"""
Minimal Model Context Protocol (MCP) server for Bimba-Pratibimba coordinate resolution.

This MCP server provides a foundation tool that bridges orchestrator GraphQL 
coordinate resolution capabilities to MCP format. It serves as a clean base
for future orchestrator tool integrations.

Core tool:
- resolve_coordinate: Resolve Epi-Logos coordinates via orchestrator's GraphQL client

The server follows clean, minimal patterns and serves as foundation for 
incremental addition of more orchestrator capabilities.
"""

import asyncio
import logging
import re
from typing import Any, Sequence

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.types import (
    Resource, Tool, TextContent, ImageContent, EmbeddedResource,
    LoggingLevel, CallToolRequest, GetPromptRequest, ReadResourceRequest,
    ListPromptsRequest, ListResourcesRequest, ListToolsRequest,
    Prompt, PromptArgument, PromptMessage, Role
)

from agentic.clients.bimba_graphql_client import BimbaGraphQLClient

logger = logging.getLogger(__name__)


class BimbaPratibimbaMCPServer:
    """
    Minimal MCP server for Bimba coordinate resolution.
    
    Provides foundation for orchestrator capabilities in MCP format:
    - Single coordinate resolution tool using existing BimbaGraphQLClient
    - Clean error handling without system information leakage
    - Extensible structure for adding future orchestrator tools
    """
    
    def __init__(self):
        """Initialize MCP server with coordinate resolution capability."""
        self.bimba_client = None
        
        # Initialize MCP server
        self.server = Server("bimba-pratibimba")
        self._setup_handlers()
        
        logger.info("Initialized Bimba-Pratibimba MCP server")
    
    async def initialize(self):
        """Initialize GraphQL client and prepare server for operation."""
        try:
            # Initialize the BimbaGraphQLClient for coordinate resolution
            self.bimba_client = BimbaGraphQLClient()
            logger.info("BimbaGraphQLClient initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize BimbaGraphQLClient: {e}")
            raise
    
    def _setup_handlers(self):
        """Set up MCP server request handlers."""
        
        @self.server.list_tools()
        async def handle_list_tools() -> list[Tool]:
            """List available coordinate resolution tools."""
            return [
                Tool(
                    name="resolve_coordinate",
                    description="""Resolve Epi-Logos Bimba coordinates in the 6-fold Coordinate Augmented Generation (CAG) system.

The Epi-Logos system uses a hierarchical coordinate structure where each coordinate maps to one of six consciousness-computing subsystems:
• #0 Anuttara: Proto-logical processing & foundational ground
• #1 Paramasiva: Quaternal Logic engine & architectural patterns  
• #2 Parashakti: Vibrational processing & cosmic imagination
• #3 Mahamaya: Symbolic transcription & universal language
• #4 Nara: Personal interface & dialogical processing
• #5 Epii: Synthesis & orchestration processing

Coordinates use flexible separators: hyphens (#N-N-N) for most linkages, dots (#N.N) typically after #4. The bare '#' represents system root.

Use this tool when users ask about:
- "Get info on coordinate #X" or "What's at #X-Y?"  
- "Check out Bimba coordinate #X" or "Resolve #X-Y-Z"
- "Explore subsystem X" or "Tell me about the Anuttara layer"
- Any reference to Epi-Logos coordinates, nodes, or subsystem data

The tool returns comprehensive node information including name, subsystem, content, operational essence, and related coordinates.""",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "coordinate": {
                                "type": "string",
                                "description": "Epi-Logos Bimba coordinate. Formats: '#' (system root), '#N' (subsystem), '#N-N-N' (hyphen-linked), '#N.N' (dot-linked, typically after #4). Examples: '#', '#0', '#1', '#1-2', '#3-4-5', '#4.2', '#2-3-5-4.2'",
                                "pattern": r"^#(\d+([-\.]\d+)*)?$"
                            }
                        },
                        "required": ["coordinate"]
                    }
                )
            ]
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict) -> list[TextContent | ImageContent | EmbeddedResource]:
            """Handle tool execution requests."""
            try:
                if name == "resolve_coordinate":
                    return await self._handle_resolve_coordinate(arguments)
                else:
                    return [TextContent(
                        type="text",
                        text=f"Unknown tool: {name}"
                    )]
                    
            except Exception as e:
                logger.error(f"Error executing tool {name}: {e}")
                return [TextContent(
                    type="text",
                    text=f"Error executing {name}: {str(e)}"
                )]
        
        @self.server.list_resources()
        async def handle_list_resources() -> list[Resource]:
            """List available resources."""
            return [
                Resource(
                    uri="bimba://schema",
                    name="Bimba Coordinate Schema",
                    description="Schema definition for Epi-Logos coordinate data structures",
                    mimeType="application/json"
                )
            ]
        
        @self.server.read_resource()
        async def handle_read_resource(uri: str) -> str:
            """Handle resource retrieval requests."""
            if uri == "bimba://schema":
                return self._get_schema_resource()
            else:
                raise ValueError(f"Unknown resource URI: {uri}")
    
    async def _handle_resolve_coordinate(self, arguments: dict) -> list[TextContent]:
        """Handle coordinate resolution tool call."""
        try:
            coordinate = arguments.get("coordinate")
            if not coordinate:
                return [TextContent(
                    type="text",
                    text="Error: coordinate parameter is required"
                )]
            
            # Note: No local validation - let GraphQL backend handle coordinate format validation
            
            # Ensure BimbaGraphQLClient is initialized
            if not self.bimba_client:
                return [TextContent(
                    type="text",
                    text="Error: Coordinate resolution service not initialized"
                )]
            
            # Resolve coordinate via GraphQL client
            result = await self.bimba_client.resolve_coordinate(coordinate)
            
            if result.get("success"):
                # Format successful response
                response = f"Coordinate: {result['coordinate']}\n"
                response += f"Name: {result['name']}\n" 
                response += f"Subsystem: {result['subsystem']}\n"
                
                if result.get("content"):
                    response += f"Content: {result['content']}\n"
                
                # Add context information if available
                context = result.get("context", {})
                if context:
                    response += "\nContext:\n"
                    for key, value in context.items():
                        if value and key not in ['uuid', 'createdAt', 'updatedAt']:
                            response += f"  {key}: {value}\n"
                
                # Add related coordinates if available
                related = result.get("related_coordinates", [])
                if related:
                    response += f"\nRelated Coordinates: {len(related)} found"
                
                return [TextContent(
                    type="text",
                    text=response
                )]
            else:
                # Handle resolution failure
                error_msg = result.get("error", "Coordinate resolution failed")
                return [TextContent(
                    type="text",
                    text=f"Resolution failed: {error_msg}"
                )]
                
        except Exception as e:
            logger.error(f"Error in resolve_coordinate: {e}")
            return [TextContent(
                type="text",
                text=f"Error resolving coordinate: {str(e)}"
            )]
    
    # Note: Removed coordinate validation - GraphQL backend handles all format validation
    
    def _get_schema_resource(self) -> str:
        """Get coordinate schema resource."""
        schema = {
            "coordinate_format": "#N or #N.N (e.g., '#1', '#2.1', '#3.2.4')",
            "subsystems": {
                "#0": "Anuttara - Proto-logical processing (Neo4j core)",
                "#1": "Paramasiva - Quaternal Logic engine (MongoDB)", 
                "#2": "Parashakti - Vibrational processing (LightRAG)",
                "#3": "Mahamaya - Symbolic transcription (Graphiti MCP)",
                "#4": "Nara - Personal interface (Qdrant)",
                "#5": "Epii - Orchestration synthesis (Redis + Notion)"
            },
            "response_fields": [
                "coordinate", "name", "subsystem", "content", 
                "context", "related_coordinates"
            ],
            "context_fields": [
                "description", "operationalEssence", "coreNature", 
                "function", "symbol", "nodeType"
            ]
        }
        return str(schema)
    
    async def serve_stdio(self):
        """Start the MCP server with stdio transport."""
        from mcp.server.stdio import stdio_server
        
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="bimba-pratibimba",
                    server_version="1.0.0",
                    capabilities=self.server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={}
                    )
                )
            )
    
    async def close(self):
        """Close the MCP server and any resources."""
        # Note: BimbaGraphQLClient doesn't require explicit closing
        logger.info("Bimba-Pratibimba MCP server closed")


# Entry point for running as a standalone MCP server
async def main():
    """Main entry point for standalone MCP server."""
    import sys
    
    # Create and initialize MCP server
    server = BimbaPratibimbaMCPServer()
    
    try:
        # Initialize the server
        await server.initialize()
        logger.info("Starting Bimba-Pratibimba MCP server...")
        
        # Start serving
        await server.serve_stdio()
        
    except KeyboardInterrupt:
        logger.info("Shutting down MCP server...")
    except Exception as e:
        logger.error(f"MCP server error: {e}")
        sys.exit(1)
    finally:
        await server.close()


if __name__ == "__main__":
    # Run as standalone MCP server
    asyncio.run(main())