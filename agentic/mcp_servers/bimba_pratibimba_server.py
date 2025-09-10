"""
Multi-client Model Context Protocol (MCP) server for Bimba-Pratibimba coordinate resolution.

This MCP server provides a foundation tool that bridges orchestrator GraphQL 
coordinate resolution capabilities to MCP format using SSE transport for 
multiple concurrent client connections.

Core tool:
- resolve_coordinate: Resolve Epi-Logos coordinates via orchestrator's GraphQL client

The server uses HTTP+SSE transport to support multiple clients simultaneously,
replacing the single-client STDIO transport limitation.
"""

import asyncio
import logging
from typing import Any, Sequence

from fastapi import FastAPI, Request
from fastapi.routing import Mount
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.sse import SseServerTransport
from mcp.server.stdio import stdio_server
from mcp.types import (
    Resource, Tool, TextContent, ImageContent, EmbeddedResource,
    LoggingLevel, CallToolRequest, GetPromptRequest, ReadResourceRequest,
    ListPromptsRequest, ListResourcesRequest, ListToolsRequest,
    Prompt, PromptArgument, PromptMessage, Role
)

from agentic.clients.bimba_graphql_client import BimbaGraphQLClient

logger = logging.getLogger(__name__)


class BimbaPratibimbaMCPServerSSE:
    """
    Multi-client MCP server for Bimba coordinate resolution via SSE transport.
    
    Provides foundation for orchestrator capabilities in MCP format:
    - Single coordinate resolution tool using existing BimbaGraphQLClient
    - Clean error handling without system information leakage
    - Extensible structure for adding future orchestrator tools
    - SSE transport supporting multiple concurrent client connections
    """
    
    def __init__(self):
        """Initialize MCP server with coordinate resolution capability."""
        self.bimba_client = None
        
        # Initialize MCP server
        self.server = Server("bimba-pratibimba")
        self._setup_handlers()
        
        # FastAPI app for SSE transport
        self.app = FastAPI(
            title="Bimba-Pratibimba MCP Server",
            description="Multi-client Epi-Logos coordinate resolution MCP server",
            version="1.0.0"
        )
        
        # SSE transport (with trailing slash to match mount)
        self.sse_transport = SseServerTransport("/messages/")
    
    async def initialize(self):
        """Initialize coordinate resolution client."""
        try:
            self.bimba_client = BimbaGraphQLClient()
            logger.info("Initialized Bimba-Pratibimba MCP server with SSE transport")
            logger.info("BimbaGraphQLClient initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize BimbaGraphQLClient: {e}")
            raise
    
    def _setup_handlers(self):
        """Setup MCP protocol handlers."""
        
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
                
                if result.get('content'):
                    response += f"Content: {result['content']}\n"
                
                # Add context information if available
                context = result.get('context', {})
                if context:
                    response += "\nContext:\n"
                    for key, value in context.items():
                        if value and key not in ['description']:  # Skip None values and avoid duplicate description
                            if key == 'operationalEssence':
                                response += f"  operationalEssence: {value}\n"
                            elif key == 'coreNature':
                                response += f"  coreNature: {value}\n"
                            elif key == 'function':
                                response += f"  function: {value}\n"
                            elif key == 'symbol':
                                response += f"  symbol: {value}\n"
                            elif key == 'nodeType':
                                response += f"  nodeType: {value}\n"
                
                return [TextContent(
                    type="text",
                    text=response
                )]
            else:
                # Handle resolution failure
                error_msg = result.get('error', 'Unknown error occurred during coordinate resolution')
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
            "coordinate_formats": [
                {
                    "format": "#",
                    "description": "System root coordinate"
                },
                {
                    "format": "#N",
                    "description": "Primary subsystem coordinate (0-5)"
                },
                {
                    "format": "#N-N-N",
                    "description": "Hyphen-linked coordinate chain"
                },
                {
                    "format": "#N.N",
                    "description": "Dot-linked coordinate (typically after #4)"
                }
            ],
            "subsystems": {
                "0": "Anuttara - Proto-logical processing",
                "1": "Paramasiva - Quaternal Logic engine",
                "2": "Parashakti - Vibrational processing", 
                "3": "Mahamaya - Symbolic transcription",
                "4": "Nara - Personal interface",
                "5": "Epii - Synthesis & orchestration"
            },
            "examples": ["#", "#0", "#1", "#1-2", "#3-4-5", "#4.2", "#2-3-5-4.2"]
        }
        
        import json
        return json.dumps(schema, indent=2)
    
    def setup_fastapi_routes(self):
        """Setup FastAPI routes for health checks and info."""
        
        @self.app.get("/")
        async def root():
            return {
                "name": "Bimba-Pratibimba MCP Server",
                "version": "1.0.0",
                "transport": "SSE",
                "tools": ["resolve_coordinate"],
                "resources": ["bimba://schema"],
                "clients_supported": "Multiple concurrent connections"
            }
        
        @self.app.get("/health")
        async def health():
            return {
                "status": "healthy",
                "bimba_client": "initialized" if self.bimba_client else "not_initialized"
            }
    
    async def connect_sse(self):
        """Connect MCP server to FastAPI app via SSE transport."""
        # Setup FastAPI routes
        self.setup_fastapi_routes()

        # Add SSE endpoint for connections
        @self.app.get("/sse")
        async def handle_sse(request: Request):
            async with self.sse_transport.connect_sse(
                request.scope, request.receive, request._send
            ) as streams:
                # Create initialization options
                init_options = InitializationOptions(
                    server_name="bimba-pratibimba",
                    server_version="1.0.0",
                    capabilities=self.server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={}
                    )
                )

                # Run the MCP server with proper initialization
                await self.server.run(
                    streams[0], streams[1], init_options
                )

        # Mount the SSE transport for message handling (with trailing slash)
        self.app.mount("/messages/", self.sse_transport.handle_post_message)

        logger.info("MCP server connected to SSE transport at /sse and /messages/")

    async def serve_stdio(self):
        """Start the MCP server with stdio transport for Claude Desktop compatibility."""
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


# Global server instance for uvicorn
mcp_server = BimbaPratibimbaMCPServerSSE()


async def create_app() -> FastAPI:
    """Create and initialize the FastAPI application."""
    await mcp_server.initialize()
    await mcp_server.connect_sse()
    return mcp_server.app


# For direct execution
async def main():
    """Main entry point with transport selection."""
    import argparse

    parser = argparse.ArgumentParser(description="Bimba-Pratibimba MCP Server")
    parser.add_argument(
        "--transport",
        choices=["sse", "stdio"],
        default="sse",
        help="Transport type: 'sse' for web clients (default), 'stdio' for Claude Desktop"
    )
    args = parser.parse_args()

    if args.transport == "stdio":
        logger.info("Starting MCP server with STDIO transport for Claude Desktop")
        server = BimbaPratibimbaMCPServerSSE()
        await server.initialize()
        await server.serve_stdio()
    else:
        logger.info("Starting MCP server with SSE transport for web clients")
        app = await create_app()

        # Use uvicorn for development
        import uvicorn
        config = uvicorn.Config(
            app,
            host="localhost",
            port=8004,
            log_level="info"
        )
        uvicorn_server = uvicorn.Server(config)

        logger.info("Starting Bimba-Pratibimba MCP server on http://localhost:8004")
        logger.info("SSE endpoint: http://localhost:8004/sse")
        logger.info("Messages endpoint: http://localhost:8004/messages")
        logger.info("Health check: http://localhost:8004/health")

        await uvicorn_server.serve()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    asyncio.run(main())