"""
MCP (Model Context Protocol) server for agentic layer access to LightRAG
"""

import json
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict

from .service import get_lightrag_service
from .models import BimbaDocument, BimbaCoordinateMetadata

logger = logging.getLogger(__name__)


@dataclass
class MCPTool:
    """MCP tool definition"""
    name: str
    description: str
    schema: Dict[str, Any]


@dataclass
class MCPRequest:
    """MCP request structure"""
    tool: str
    parameters: Dict[str, Any]


@dataclass
class MCPResponse:
    """MCP response structure"""
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None


class LightRAGMCPServer:
    """MCP server for LightRAG document intelligence tools"""
    
    def __init__(self):
        self.tools = self._define_tools()
    
    def _define_tools(self) -> Dict[str, MCPTool]:
        """Define available MCP tools"""
        return {
            "lightrag_ingest_document": MCPTool(
                name="lightrag_ingest_document",
                description="Ingest a document into LightRAG with Bimba coordinate metadata",
                schema={
                    "type": "object",
                    "properties": {
                        "content": {
                            "type": "string",
                            "description": "Document content to ingest"
                        },
                        "source_id": {
                            "type": "string",
                            "description": "Unique identifier for the document"
                        },
                        "source_coordinate": {
                            "type": "string",
                            "description": "Bimba coordinate (e.g., '#4.2.3')"
                        },
                        "section_coordinates": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Section-level coordinates",
                            "default": []
                        },
                        "namespace": {
                            "type": "string",
                            "description": "Namespace (default: 'gnostic')",
                            "default": "gnostic"
                        },
                        "ontological_level": {
                            "type": "integer",
                            "minimum": 0,
                            "maximum": 5,
                            "description": "Ontological level (0-5)"
                        },
                        "process_type": {
                            "type": "string",
                            "description": "Process type (e.g., 'dialogical-identity')"
                        }
                    },
                    "required": ["content", "source_id", "source_coordinate", "ontological_level", "process_type"]
                }
            ),
            
            "lightrag_search_documents": MCPTool(
                name="lightrag_search_documents",
                description="Search documents using hybrid vector-graph retrieval",
                schema={
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query"
                        },
                        "coordinate_filter": {
                            "type": "string",
                            "description": "Filter by coordinate pattern (optional)",
                            "default": None
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of results",
                            "default": 10,
                            "minimum": 1,
                            "maximum": 100
                        }
                    },
                    "required": ["query"]
                }
            ),
            
            "lightrag_get_coordinate_context": MCPTool(
                name="lightrag_get_coordinate_context",
                description="Get all documents within a specific coordinate context",
                schema={
                    "type": "object",
                    "properties": {
                        "coordinate": {
                            "type": "string",
                            "description": "Bimba coordinate to get context for"
                        }
                    },
                    "required": ["coordinate"]
                }
            ),
            
            "lightrag_health_check": MCPTool(
                name="lightrag_health_check",
                description="Check the health status of LightRAG service",
                schema={
                    "type": "object",
                    "properties": {},
                    "additionalProperties": False
                }
            ),
            
            "lightrag_workspace_info": MCPTool(
                name="lightrag_workspace_info",
                description="Get information about the current LightRAG workspace",
                schema={
                    "type": "object",
                    "properties": {},
                    "additionalProperties": False
                }
            )
        }
    
    def get_available_tools(self) -> List[Dict[str, Any]]:
        """Get list of available tools for MCP discovery"""
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "schema": tool.schema
            }
            for tool in self.tools.values()
        ]
    
    async def execute_tool(self, request: MCPRequest) -> MCPResponse:
        """Execute an MCP tool request"""
        try:
            tool_name = request.tool
            
            if tool_name not in self.tools:
                return MCPResponse(
                    success=False,
                    error=f"Unknown tool: {tool_name}"
                )
            
            # Route to appropriate handler
            if tool_name == "lightrag_ingest_document":
                return await self._handle_ingest_document(request.parameters)
            elif tool_name == "lightrag_search_documents":
                return await self._handle_search_documents(request.parameters)
            elif tool_name == "lightrag_get_coordinate_context":
                return await self._handle_get_coordinate_context(request.parameters)
            elif tool_name == "lightrag_health_check":
                return await self._handle_health_check(request.parameters)
            elif tool_name == "lightrag_workspace_info":
                return await self._handle_workspace_info(request.parameters)
            else:
                return MCPResponse(
                    success=False,
                    error=f"Tool handler not implemented: {tool_name}"
                )
                
        except Exception as e:
            logger.error(f"MCP tool execution failed: {e}")
            return MCPResponse(
                success=False,
                error=str(e)
            )
    
    async def _handle_ingest_document(self, params: Dict[str, Any]) -> MCPResponse:
        """Handle document ingestion"""
        try:
            service = get_lightrag_service()
            
            # Create metadata
            metadata = BimbaCoordinateMetadata(
                source_coordinate=params["source_coordinate"],
                section_coordinates=params.get("section_coordinates", []),
                namespace=params.get("namespace", "gnostic"),
                ontological_level=params["ontological_level"],
                process_type=params["process_type"]
            )
            
            # Create document
            doc = BimbaDocument(
                content=params["content"],
                source_id=params["source_id"],
                metadata=metadata
            )
            
            # Ingest document
            result = service.ingest_document_with_coordinates_sync(doc)
            
            return MCPResponse(
                success=result["success"],
                result=result if result["success"] else None,
                error=result.get("error")
            )
            
        except Exception as e:
            logger.error(f"MCP document ingestion failed: {e}")
            return MCPResponse(success=False, error=str(e))
    
    async def _handle_search_documents(self, params: Dict[str, Any]) -> MCPResponse:
        """Handle document search"""
        try:
            service = get_lightrag_service()
            
            result = service.search_by_coordinates_sync(
                query=params["query"],
                coordinate_filter=params.get("coordinate_filter"),
                limit=params.get("limit", 10)
            )
            
            return MCPResponse(
                success=result["success"],
                result=result if result["success"] else None,
                error=result.get("error")
            )
            
        except Exception as e:
            logger.error(f"MCP document search failed: {e}")
            return MCPResponse(success=False, error=str(e))
    
    async def _handle_get_coordinate_context(self, params: Dict[str, Any]) -> MCPResponse:
        """Handle coordinate context retrieval"""
        try:
            service = get_lightrag_service()
            
            result = service.get_coordinate_context_sync(params["coordinate"])
            
            return MCPResponse(
                success=result["success"],
                result=result if result["success"] else None,
                error=result.get("error")
            )
            
        except Exception as e:
            logger.error(f"MCP coordinate context failed: {e}")
            return MCPResponse(success=False, error=str(e))
    
    async def _handle_health_check(self, params: Dict[str, Any]) -> MCPResponse:
        """Handle health check"""
        try:
            service = get_lightrag_service()
            health = service.health_check()
            
            return MCPResponse(
                success=True,
                result=health
            )
            
        except Exception as e:
            logger.error(f"MCP health check failed: {e}")
            return MCPResponse(success=False, error=str(e))
    
    async def _handle_workspace_info(self, params: Dict[str, Any]) -> MCPResponse:
        """Handle workspace info request"""
        try:
            service = get_lightrag_service()
            
            # Get comprehensive workspace info
            workspace_info = service.get_workspace_info()
            
            return MCPResponse(
                success=workspace_info["success"],
                result=workspace_info if workspace_info["success"] else None,
                error=workspace_info.get("error")
            )
            
        except Exception as e:
            logger.error(f"MCP workspace info failed: {e}")
            return MCPResponse(success=False, error=str(e))


# Global MCP server instance
lightrag_mcp_server = None


def get_lightrag_mcp_server() -> LightRAGMCPServer:
    """Get or create LightRAG MCP server instance"""
    global lightrag_mcp_server
    if lightrag_mcp_server is None:
        lightrag_mcp_server = LightRAGMCPServer()
    return lightrag_mcp_server


# Helper functions for external integration
def get_mcp_tools() -> List[Dict[str, Any]]:
    """Get available MCP tools for registration"""
    server = get_lightrag_mcp_server()
    return server.get_available_tools()


async def execute_mcp_tool(tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Execute MCP tool and return response as dict"""
    server = get_lightrag_mcp_server()
    request = MCPRequest(tool=tool_name, parameters=parameters)
    response = await server.execute_tool(request)
    return asdict(response)