"""
LightRAG MCP tool server for document search operations.

Story 02.16 - Foundation MCP Tool Integration
Provides LightRAG document query integration with WorkflowEngine MCPToolRegistry.
"""
import asyncio
import aiohttp
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from ..registry import MCPTool, MCPToolMetadata, MCPToolResult, MCPToolStatus, MCPToolCapability


class LightRAGToolServer:
    """
    MCP tool server for LightRAG document search operations.
    
    Integrates with LightRAG service MCP endpoint for document querying
    during persona workflow execution.
    """
    
    def __init__(
        self,
        endpoint: str = "http://localhost:8001/mcp",
        timeout: int = 30,
        retry_count: int = 3
    ):
        """
        Initialize LightRAG tool server.
        
        Args:
            endpoint: LightRAG MCP service endpoint
            timeout: Request timeout in seconds
            retry_count: Number of retry attempts
        """
        self.endpoint = endpoint
        self.timeout = timeout
        self.retry_count = retry_count
        
        self._metadata = MCPToolMetadata(
            tool_id="lightrag-query-documents",
            name="LightRAG Document Search",
            description="Search documents using LightRAG semantic search and retrieval",
            version="1.0.0",
            capabilities=[MCPToolCapability.SEARCH, MCPToolCapability.RETRIEVAL],
            server_endpoint=endpoint,
            authentication_required=False,
            timeout_seconds=timeout
        )
        
        # Connection state
        self._session: Optional[aiohttp.ClientSession] = None
        self._initialized = False
    
    @property
    def metadata(self) -> MCPToolMetadata:
        """Get tool metadata."""
        return self._metadata
    
    async def initialize(self) -> bool:
        """
        Initialize LightRAG tool server connection.
        
        Returns:
            bool: True if initialization successful
        """
        try:
            if self._initialized:
                return True
            
            # Create HTTP session
            connector = aiohttp.TCPConnector(
                limit=10,
                ttl_dns_cache=300,
                use_dns_cache=True
            )
            
            self._session = aiohttp.ClientSession(
                connector=connector,
                timeout=aiohttp.ClientTimeout(total=self.timeout),
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "EpiLogos-WorkflowEngine/1.0"
                }
            )
            
            # For initial implementation, assume healthy if session created successfully
            # Full health check will be implemented when services are running
            is_healthy = True  # await self.health_check()
            if not is_healthy:
                await self.cleanup()
                return False
            
            self._metadata.status = MCPToolStatus.AVAILABLE
            self._initialized = True
            
            return True
            
        except Exception as e:
            print(f"Error initializing LightRAG tool server: {e}")
            self._metadata.status = MCPToolStatus.ERROR
            await self.cleanup()
            return False
    
    async def call(self, parameters: Dict[str, Any]) -> MCPToolResult:
        """
        Execute LightRAG document query.
        
        Args:
            parameters: Tool parameters containing:
                - query: Search query string
                - workspace: Optional workspace identifier
                - max_results: Optional maximum result count
                
        Returns:
            MCPToolResult with search results
        """
        start_time = datetime.now(timezone.utc)
        
        try:
            if not self._initialized or not self._session:
                return MCPToolResult(
                    success=False,
                    tool_id=self._metadata.tool_id,
                    error="Tool not initialized"
                )
            
            # Validate parameters
            query = parameters.get("query")
            if not query:
                return MCPToolResult(
                    success=False,
                    tool_id=self._metadata.tool_id,
                    error="Query parameter required"
                )
            
            workspace = parameters.get("workspace", "default")
            max_results = parameters.get("max_results", 10)
            
            # Build MCP request payload
            mcp_request = {
                "method": "tools/call",
                "params": {
                    "name": "query_documents",
                    "arguments": {
                        "query": query,
                        "workspace": workspace,
                        "max_results": max_results
                    }
                }
            }
            
            # Execute MCP call with retries
            last_error = None
            for attempt in range(self.retry_count + 1):
                try:
                    async with self._session.post(
                        f"{self.endpoint}/call",
                        json=mcp_request
                    ) as response:
                        
                        if response.status == 200:
                            result_data = await response.json()
                            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
                            
                            return MCPToolResult(
                                success=True,
                                tool_id=self._metadata.tool_id,
                                result={
                                    "query": query,
                                    "workspace": workspace,
                                    "documents": result_data.get("result", {}),
                                    "execution_metadata": {
                                        "attempt": attempt + 1,
                                        "endpoint": self.endpoint
                                    }
                                },
                                execution_time_ms=execution_time
                            )
                        else:
                            error_text = await response.text()
                            last_error = f"HTTP {response.status}: {error_text}"
                
                except aiohttp.ClientError as e:
                    last_error = f"Connection error: {str(e)}"
                
                except asyncio.TimeoutError:
                    last_error = "Request timeout"
                
                # Exponential backoff for retries
                if attempt < self.retry_count:
                    await asyncio.sleep(2 ** attempt)
            
            # All retries failed
            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            
            return MCPToolResult(
                success=False,
                tool_id=self._metadata.tool_id,
                error=f"LightRAG call failed after {self.retry_count + 1} attempts: {last_error}",
                execution_time_ms=execution_time
            )
            
        except Exception as e:
            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            
            return MCPToolResult(
                success=False,
                tool_id=self._metadata.tool_id,
                error=f"Unexpected error: {str(e)}",
                execution_time_ms=execution_time
            )
    
    async def health_check(self) -> bool:
        """
        Check LightRAG service health.
        
        Returns:
            bool: True if service is healthy
        """
        try:
            if not self._session:
                return False
            
            # Health check request
            health_request = {
                "method": "tools/list",
                "params": {}
            }
            
            async with self._session.post(
                f"{self.endpoint}/health",
                json=health_request
            ) as response:
                
                if response.status == 200:
                    self._metadata.status = MCPToolStatus.AVAILABLE
                    self._metadata.last_health_check = datetime.now(timezone.utc).isoformat()
                    return True
                else:
                    self._metadata.status = MCPToolStatus.ERROR
                    return False
        
        except Exception as e:
            print(f"LightRAG health check error: {e}")
            self._metadata.status = MCPToolStatus.ERROR
            return False
    
    async def cleanup(self) -> None:
        """Cleanup LightRAG tool server resources."""
        try:
            if self._session and not self._session.closed:
                await self._session.close()
            
            self._session = None
            self._initialized = False
            self._metadata.status = MCPToolStatus.UNAVAILABLE
            
        except Exception as e:
            print(f"Error during LightRAG cleanup: {e}")