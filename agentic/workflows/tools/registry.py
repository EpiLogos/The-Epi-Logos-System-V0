"""
MCP Tool Registry for Pydantic AI workflow engine.

Provides infrastructure for MCP (Model Context Protocol) tool integration
with workflow templates. Setup-only implementation for Track B - specific
tools will be implemented in future stories.
"""
import asyncio
from typing import Dict, Any, List, Optional, Protocol, runtime_checkable
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from enum import Enum


class MCPToolStatus(str, Enum):
    """MCP Tool status enumeration."""
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    ERROR = "error"
    INITIALIZING = "initializing"


class MCPToolCapability(str, Enum):
    """MCP Tool capability categories."""
    SEARCH = "search"
    RETRIEVAL = "retrieval"
    COMPUTATION = "computation"
    COMMUNICATION = "communication"
    TRANSFORMATION = "transformation"
    COORDINATION = "coordination"


class MCPToolMetadata(BaseModel):
    """Metadata for registered MCP tools."""
    tool_id: str = Field(..., description="Unique tool identifier")
    name: str = Field(..., description="Human-readable tool name")
    description: str = Field(..., description="Tool description and capabilities")
    version: str = Field(..., description="Tool version")
    capabilities: List[MCPToolCapability] = Field(..., description="Tool capabilities")
    
    # Integration metadata
    server_endpoint: Optional[str] = Field(default=None, description="MCP server endpoint")
    authentication_required: bool = Field(default=False, description="Whether tool requires authentication")
    timeout_seconds: int = Field(default=30, description="Default timeout for tool calls")
    
    # Status and monitoring
    status: MCPToolStatus = Field(default=MCPToolStatus.INITIALIZING)
    last_health_check: Optional[str] = Field(default=None, description="Last health check timestamp")
    error_count: int = Field(default=0, description="Number of recent errors")
    
    # Usage statistics
    call_count: int = Field(default=0, description="Total number of tool calls")
    success_rate: float = Field(default=1.0, description="Success rate (0.0 to 1.0)")


class MCPToolResult(BaseModel):
    """Result from MCP tool execution."""
    success: bool = Field(..., description="Whether tool call succeeded")
    tool_id: str = Field(..., description="Tool identifier")
    result: Optional[Any] = Field(default=None, description="Tool execution result")
    error: Optional[str] = Field(default=None, description="Error message if failed")
    execution_time_ms: Optional[float] = Field(default=None, description="Execution time in milliseconds")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@runtime_checkable
class MCPTool(Protocol):
    """Protocol for MCP tool implementations."""
    
    @property
    def metadata(self) -> MCPToolMetadata:
        """Get tool metadata."""
        ...
    
    async def initialize(self) -> bool:
        """Initialize tool connection."""
        ...
    
    async def call(self, parameters: Dict[str, Any]) -> MCPToolResult:
        """Execute tool with parameters."""
        ...
    
    async def health_check(self) -> bool:
        """Check tool health status."""
        ...
    
    async def cleanup(self) -> None:
        """Cleanup tool resources."""
        ...


class MCPToolRegistry:
    """
    Registry for MCP (Model Context Protocol) tools.
    
    Provides infrastructure for tool discovery, registration, and execution
    with comprehensive error handling and health monitoring. Setup-only
    implementation for Track B foundation.
    """
    
    def __init__(self):
        """Initialize MCP tool registry."""
        self._tools: Dict[str, MCPTool] = {}
        self._tool_metadata: Dict[str, MCPToolMetadata] = {}
        self._capability_index: Dict[MCPToolCapability, List[str]] = {
            capability: [] for capability in MCPToolCapability
        }
        
        # Registry state
        self._initialized = False
        self._health_check_interval = 60  # seconds
        self._health_check_task: Optional[asyncio.Task] = None
    
    async def initialize(self) -> None:
        """Initialize MCP tool registry with health monitoring."""
        if self._initialized:
            return
        
        # Load any persistent tool configurations
        await self._load_tool_configurations()
        
        # Start health monitoring task
        self._health_check_task = asyncio.create_task(self._health_monitor_loop())
        
        self._initialized = True
    
    async def cleanup(self) -> None:
        """Cleanup MCP tool registry and all registered tools."""
        if not self._initialized:
            return
        
        # Stop health monitoring
        if self._health_check_task and not self._health_check_task.done():
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass
        
        # Cleanup all tools
        for tool in self._tools.values():
            try:
                await tool.cleanup()
            except Exception as e:
                print(f"Error cleaning up tool {tool.metadata.tool_id}: {e}")
        
        self._tools.clear()
        self._tool_metadata.clear()
        self._capability_index = {capability: [] for capability in MCPToolCapability}
        
        self._initialized = False
    
    async def register_tool(self, tool: MCPTool) -> bool:
        """
        Register an MCP tool for use in workflows.
        
        Args:
            tool: MCPTool implementation to register
            
        Returns:
            bool: True if registered successfully
        """
        try:
            metadata = tool.metadata
            
            # Check for duplicate tool ID
            if metadata.tool_id in self._tools:
                return False
            
            # Initialize tool
            if not await tool.initialize():
                return False
            
            # Register tool
            self._tools[metadata.tool_id] = tool
            self._tool_metadata[metadata.tool_id] = metadata
            
            # Update capability index
            for capability in metadata.capabilities:
                if metadata.tool_id not in self._capability_index[capability]:
                    self._capability_index[capability].append(metadata.tool_id)
            
            # Update status
            metadata.status = MCPToolStatus.AVAILABLE
            metadata.last_health_check = datetime.now(timezone.utc).isoformat()
            
            return True
            
        except Exception as e:
            print(f"Error registering tool {tool.metadata.tool_id}: {e}")
            return False
    
    async def unregister_tool(self, tool_id: str) -> bool:
        """
        Unregister an MCP tool.
        
        Args:
            tool_id: Tool identifier to unregister
            
        Returns:
            bool: True if unregistered successfully
        """
        try:
            if tool_id not in self._tools:
                return False
            
            tool = self._tools[tool_id]
            metadata = self._tool_metadata[tool_id]
            
            # Cleanup tool
            await tool.cleanup()
            
            # Remove from registries
            del self._tools[tool_id]
            del self._tool_metadata[tool_id]
            
            # Remove from capability index
            for capability in metadata.capabilities:
                if tool_id in self._capability_index[capability]:
                    self._capability_index[capability].remove(tool_id)
            
            return True
            
        except Exception as e:
            print(f"Error unregistering tool {tool_id}: {e}")
            return False
    
    async def call_tool(self, tool_id: str, parameters: Dict[str, Any]) -> MCPToolResult:
        """
        Call an MCP tool with parameters.
        
        Args:
            tool_id: Tool identifier
            parameters: Tool parameters
            
        Returns:
            MCPToolResult with execution outcome
        """
        if tool_id not in self._tools:
            return MCPToolResult(
                success=False,
                tool_id=tool_id,
                error=f"Tool '{tool_id}' not found"
            )
        
        tool = self._tools[tool_id]
        metadata = self._tool_metadata[tool_id]
        
        if metadata.status != MCPToolStatus.AVAILABLE:
            return MCPToolResult(
                success=False,
                tool_id=tool_id,
                error=f"Tool '{tool_id}' is not available (status: {metadata.status})"
            )
        
        start_time = datetime.now(timezone.utc)
        
        try:
            # Execute tool with timeout
            result = await asyncio.wait_for(
                tool.call(parameters),
                timeout=metadata.timeout_seconds
            )
            
            # Update statistics
            metadata.call_count += 1
            if result.success:
                # Update success rate (exponential moving average)
                metadata.success_rate = 0.9 * metadata.success_rate + 0.1 * 1.0
            else:
                metadata.error_count += 1
                metadata.success_rate = 0.9 * metadata.success_rate + 0.1 * 0.0
            
            return result
            
        except asyncio.TimeoutError:
            metadata.error_count += 1
            metadata.success_rate = 0.9 * metadata.success_rate + 0.1 * 0.0
            
            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            
            return MCPToolResult(
                success=False,
                tool_id=tool_id,
                error=f"Tool call timeout after {metadata.timeout_seconds} seconds",
                execution_time_ms=execution_time
            )
            
        except Exception as e:
            metadata.error_count += 1
            metadata.success_rate = 0.9 * metadata.success_rate + 0.1 * 0.0
            
            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            
            return MCPToolResult(
                success=False,
                tool_id=tool_id,
                error=f"Tool execution error: {str(e)}",
                execution_time_ms=execution_time
            )
    
    async def discover_tools_by_capability(self, capability: MCPToolCapability) -> List[MCPToolMetadata]:
        """
        Discover tools by capability.
        
        Args:
            capability: MCPToolCapability to search for
            
        Returns:
            List of tool metadata matching capability
        """
        tool_ids = self._capability_index.get(capability, [])
        return [
            self._tool_metadata[tool_id]
            for tool_id in tool_ids
            if tool_id in self._tool_metadata
        ]
    
    async def get_tool_metadata(self, tool_id: str) -> Optional[MCPToolMetadata]:
        """
        Get metadata for a specific tool.
        
        Args:
            tool_id: Tool identifier
            
        Returns:
            MCPToolMetadata if found, None otherwise
        """
        return self._tool_metadata.get(tool_id)
    
    async def list_available_tools(self) -> List[MCPToolMetadata]:
        """
        List all available tools.
        
        Returns:
            List of available tool metadata
        """
        return [
            metadata for metadata in self._tool_metadata.values()
            if metadata.status == MCPToolStatus.AVAILABLE
        ]
    
    async def get_registry_status(self) -> Dict[str, Any]:
        """
        Get comprehensive registry status.
        
        Returns:
            Registry status information
        """
        total_tools = len(self._tool_metadata)
        available_tools = sum(1 for m in self._tool_metadata.values() if m.status == MCPToolStatus.AVAILABLE)
        error_tools = sum(1 for m in self._tool_metadata.values() if m.status == MCPToolStatus.ERROR)
        
        # Calculate aggregate success rate
        if total_tools > 0:
            avg_success_rate = sum(m.success_rate for m in self._tool_metadata.values()) / total_tools
        else:
            avg_success_rate = 1.0
        
        return {
            "initialized": self._initialized,
            "total_tools": total_tools,
            "available_tools": available_tools,
            "error_tools": error_tools,
            "average_success_rate": avg_success_rate,
            "capabilities": {
                capability.value: len(tool_ids)
                for capability, tool_ids in self._capability_index.items()
            },
            "last_health_check": datetime.now(timezone.utc).isoformat()
        }
    
    async def _health_monitor_loop(self) -> None:
        """Background health monitoring for registered tools."""
        while True:
            try:
                await asyncio.sleep(self._health_check_interval)
                
                for tool_id, tool in self._tools.items():
                    try:
                        metadata = self._tool_metadata[tool_id]
                        
                        # Perform health check
                        is_healthy = await tool.health_check()
                        
                        # Update status
                        if is_healthy:
                            if metadata.status == MCPToolStatus.ERROR:
                                metadata.status = MCPToolStatus.AVAILABLE
                        else:
                            metadata.status = MCPToolStatus.ERROR
                        
                        metadata.last_health_check = datetime.now(timezone.utc).isoformat()
                        
                    except Exception as e:
                        print(f"Health check error for tool {tool_id}: {e}")
                        metadata = self._tool_metadata[tool_id]
                        metadata.status = MCPToolStatus.ERROR
                        metadata.error_count += 1
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Health monitor error: {e}")
                # Continue monitoring despite errors
    
    async def _load_tool_configurations(self) -> None:
        """Load persistent tool configurations (placeholder)."""
        # In production, this would load tool configurations from storage
        # For Track B, this is setup infrastructure only
        pass


# Example placeholder tool implementations for testing and demonstration

class PlaceholderSearchTool:
    """Placeholder MCP tool for search capabilities."""
    
    def __init__(self):
        self._metadata = MCPToolMetadata(
            tool_id="placeholder-search",
            name="Placeholder Search Tool",
            description="Example search tool for testing MCP infrastructure",
            version="1.0.0",
            capabilities=[MCPToolCapability.SEARCH, MCPToolCapability.RETRIEVAL]
        )
    
    @property
    def metadata(self) -> MCPToolMetadata:
        return self._metadata
    
    async def initialize(self) -> bool:
        """Initialize placeholder tool."""
        self._metadata.status = MCPToolStatus.AVAILABLE
        return True
    
    async def call(self, parameters: Dict[str, Any]) -> MCPToolResult:
        """Execute placeholder search."""
        query = parameters.get("query", "")
        
        # Simulate search operation
        await asyncio.sleep(0.1)
        
        return MCPToolResult(
            success=True,
            tool_id=self._metadata.tool_id,
            result={
                "query": query,
                "results": [
                    {"id": 1, "title": f"Result for '{query}'", "relevance": 0.9},
                    {"id": 2, "title": f"Another result for '{query}'", "relevance": 0.7}
                ],
                "count": 2
            },
            execution_time_ms=100.0
        )
    
    async def health_check(self) -> bool:
        """Check tool health."""
        return True
    
    async def cleanup(self) -> None:
        """Cleanup tool resources."""
        pass


class PlaceholderCoordinateTool:
    """Placeholder MCP tool for coordinate resolution."""
    
    def __init__(self):
        self._metadata = MCPToolMetadata(
            tool_id="placeholder-coordinate",
            name="Placeholder Coordinate Tool",
            description="Example coordinate resolution tool for CAG integration",
            version="1.0.0",
            capabilities=[MCPToolCapability.RETRIEVAL, MCPToolCapability.TRANSFORMATION]
        )
    
    @property
    def metadata(self) -> MCPToolMetadata:
        return self._metadata
    
    async def initialize(self) -> bool:
        """Initialize placeholder tool."""
        self._metadata.status = MCPToolStatus.AVAILABLE
        return True
    
    async def call(self, parameters: Dict[str, Any]) -> MCPToolResult:
        """Execute placeholder coordinate resolution."""
        coordinate = parameters.get("coordinate", "")
        
        # Simulate coordinate resolution
        await asyncio.sleep(0.2)
        
        return MCPToolResult(
            success=True,
            tool_id=self._metadata.tool_id,
            result={
                "coordinate": coordinate,
                "resolved_data": {
                    "name": f"Node at {coordinate}",
                    "description": f"Example data for coordinate {coordinate}",
                    "subsystem": coordinate.split("-")[0] if "-" in coordinate else "unknown",
                    "properties": {"example": True, "placeholder": True}
                }
            },
            execution_time_ms=200.0
        )
    
    async def health_check(self) -> bool:
        """Check tool health."""
        return True
    
    async def cleanup(self) -> None:
        """Cleanup tool resources."""
        pass