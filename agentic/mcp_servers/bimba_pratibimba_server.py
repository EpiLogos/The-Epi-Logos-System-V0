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
import os
from dotenv import load_dotenv
from typing import cast, Iterable

from fastapi import FastAPI, Request
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.sse import SseServerTransport
from mcp.server.stdio import stdio_server
from mcp.types import (
    Resource, Tool, TextContent, ImageContent, EmbeddedResource,
)
from pydantic import AnyUrl, TypeAdapter
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # type-only import to avoid runtime ImportError on older MCP versions
    from mcp.types import ReadResourceContents

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
        # Load .env for local development so MCP inherits shared secrets automatically
        try:
            load_dotenv()
        except Exception:
            pass
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
            # Attach admin Authorization header if provided via environment
            token = os.getenv("MCP_BACKEND_BEARER") or os.getenv("BACKEND_ADMIN_TOKEN")
            default_headers = {}
            if token:
                default_headers["Authorization"] = f"Bearer {token}"
            mcp_admin_secret = os.getenv("MCP_ADMIN_SECRET")
            if mcp_admin_secret:
                default_headers["X-MCP-Admin-Secret"] = mcp_admin_secret
            default_headers = default_headers or None
            self.bimba_client = BimbaGraphQLClient(default_headers=default_headers)
            logger.info("Initialized Bimba-Pratibimba MCP server with SSE transport")
            logger.info("BimbaGraphQLClient initialized successfully")
            if token:
                logger.info("MCP will forward admin Authorization header for GraphQL mutations")
            if mcp_admin_secret:
                logger.info("MCP will forward X-MCP-Admin-Secret for local admin bypass (dev-only)")
        except Exception as e:
            logger.error(f"Failed to initialize BimbaGraphQLClient: {e}")
            raise
    
    def _setup_handlers(self):
        """Setup MCP protocol handlers."""
        # Construct a real AnyUrl for the custom scheme (validated at runtime)
        SCHEMA_URI: AnyUrl = TypeAdapter(AnyUrl).validate_python("bimba://local/schema")
        
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

CORE MOD6 QL FRAMEWORK: The coordinate system is built on Quaternal Logic (QL) with mod6 processing, where the standard coordinate range runs from 0-5 as the foundational basis within any given branch. This mod6 framework represents a complete cycle of manifestation from implicit potential (0) through quintessential synthesis (5).

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
                            "bimbaCoordinate": {
                                "type": "string",
                                "description": "Epi-Logos Bimba coordinate. Formats: '#' (system root), '#N' (subsystem), '#N-N-N' (hyphen-linked), '#N.N' (dot-linked, typically after #4), '#N/N' (slash for reflective and/or). Examples: '#', '#0', '#1', '#1-2', '#3-4-5', '#4.2', '#0-5-0/1-4'",
                                "pattern": r"^#(\d+([-\.\/]\d+)*)?$"
                            }
                        },
                        "required": ["bimbaCoordinate"]
                    }
                ),
                Tool(
                    name="get_node_relationships",
                    description=(
                        "Get all direct relationship connections for a Bimba coordinate. "
                        "Returns the node and its edges with type, direction, neighbor, and properties."
                    ),
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "bimbaCoordinate": {
                                "type": "string",
                                "description": "Bimba coordinate to inspect for relationships.",
                                "pattern": r"^#(\d+([-\.\/]\d+)*)?$"
                            }
                        },
                        "required": ["bimbaCoordinate"]
                    }
                )
                ,
                Tool(
                    name="get_node_details_complete",
                    description=(
                        "Get ALL properties for a Bimba coordinate without schema restrictions (COMPLETE). "
                        "Returns Neo4j properties via Generic scalar with selective filtering. "
                        "Perfect for discovering unknown/custom properties or accessing coordinate-specific fields "
                        "not in the canonical schema. By default excludes embeddings metadata, internal timestamps, "
                        "and functional properties (f_* prefix). Set includeFunctionalProperties=true to include "
                        "f_* prefixed functional properties. "
                        "For structured canonical fields, use get_node_by_coordinate_extended instead. "
                        "For quick lookups, use resolve_coordinate instead."
                    ),
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "bimbaCoordinate": {
                                "type": "string",
                                "description": "Bimba coordinate to retrieve all properties for",
                                "pattern": r"^#(\d+([-\.\/]\d+)*)?$"
                            },
                            "includeFunctionalProperties": {
                                "type": "boolean",
                                "description": "If true, include f_* prefixed functional properties (default: false)",
                                "default": False
                            }
                        },
                        "required": ["bimbaCoordinate"]
                    }
                ),
                Tool(
                    name="get_node_by_coordinate_extended",
                    description=(
                        "Deep inspection of a Bimba coordinate with COMPREHENSIVE property set. "
                        "Returns all flexible schema properties including principle arrays, internal structure, "
                        "operational details, and relational coordinates. Use this for detailed analysis, NOT quick lookups. "
                        "For conversational context, use resolve_coordinate instead (lean/fast). "
                        "Performance note: Fetches array fields which can be large."
                    ),
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "bimbaCoordinate": {
                                "type": "string",
                                "description": "Bimba coordinate for detailed inspection",
                                "pattern": r"^#(\d+([-\.\/]\d+)*)?$"
                            }
                        },
                        "required": ["bimbaCoordinate"]
                    }
                )
                ,
                Tool(
                    name="create_bimba_node",
                    description=(
                        "Create a Bimba graph node (admin only). Includes optional semantic fields."
                    ),
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "bimbaCoordinate": {"type": "string", "description": "Bimba coordinate (#N[-|.]N...)"},
                            "name": {"type": "string"},
                            "subsystem": {"type": "integer"},
                            "description": {"type": "string"},
                            "operationalEssence": {"type": "string"},
                            "coreNature": {"type": "string"},
                            "function": {"type": "string"},
                            "architecturalFunction": {"type": "string"},
                            "symbol": {"type": "string"}
                        },
                        "required": ["bimbaCoordinate", "name", "subsystem"]
                    }
                )
                ,
                Tool(
                    name="update_bimba_node",
                    description="Update an existing Bimba graph node with flexible schema-based properties (admin only). Supports partial updates - only provided fields are updated. FLEXIBLE PROPERTIES: This tool accepts ANY camelCase property names beyond the documented fields. The backend validates naming conventions (camelCase) and Neo4j compatibility (no nested objects), but you can add arbitrary coordinate-specific fields like 'f_cycle_orchestration', 'spandaMode', etc. Common fields: Core Identity: name, primaryDesignation, coreNature, architecturalFunction. Structure: internalStructure. Principles: keyPrinciples, resonances, practicalApplications (arrays). Operational: operationalEssence, accessLevel, consciousnessStructure, operationalSymbolics. Relational: relatedCoordinates (array). Legacy: description, function, symbol. Custom properties are fully supported - just use camelCase names.",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "bimbaCoordinate": {"type": "string", "description": "Target coordinate (required)"},
                            "name": {"type": "string"},
                            "primaryDesignation": {"type": "string"},
                            "coreNature": {"type": "string"},
                            "architecturalFunction": {"type": "string"},
                            "internalStructure": {"type": "string"},
                            "keyPrinciples": {"type": "array", "items": {"type": "string"}},
                            "resonances": {"type": "array", "items": {"type": "string"}},
                            "practicalApplications": {"type": "array", "items": {"type": "string"}},
                            "operationalEssence": {"type": "string"},
                            "accessLevel": {"type": "string"},
                            "consciousnessStructure": {"type": "string"},
                            "operationalSymbolics": {"type": "string"},
                            "relatedCoordinates": {"type": "array", "items": {"type": "string"}},
                            "description": {"type": "string"},
                            "function": {"type": "string"},
                            "symbol": {"type": "string"}
                        },
                        "required": ["bimbaCoordinate"],
                        "additionalProperties": True
                    }
                )
                ,
                Tool(
                    name="get_path_between_coordinates",
                    description=(
                        "Find a path of relationships connecting two Bimba coordinates "
                        "through the knowledge graph, enabling narrative discovery and "
                        "contextual relationship analysis. Returns path length, start/end "
                        "nodes, and ordered components (nodes and relationships)."
                    ),
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "startCoordinate": {
                                "type": "string",
                                "description": "Starting Bimba coordinate",
                                "pattern": r"^#(\d+([-\.\/]\d+)*)?$"
                            },
                            "endCoordinate": {
                                "type": "string",
                                "description": "Ending Bimba coordinate",
                                "pattern": r"^#(\d+([-\.\/]\d+)*)?$"
                            },
                            "maxHops": {
                                "type": "integer",
                                "description": "Optional hop limit (default 5)",
                                "minimum": 1,
                                "default": 5
                            }
                        },
                        "required": ["startCoordinate", "endCoordinate"]
                    }
                )
                ,
                Tool(
                    name="semantic_coordinate_discovery",
                    description=(
                        "Discover Bimba coordinates that semantically match a natural language description. "
                        "Returns ranked matches with similarity scores and semantic context. "
                        "Default 7 results enables parent + complete mod6 children (e.g., #1 + #1-0 through #1-5)."
                    ),
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "query_text": {"type": "string", "description": "Natural language query text"},
                            "max_results": {"type": "integer", "description": "Maximum results (default 7 for mod6 QL alignment)", "default": 7},
                            "alpha": {"type": "number", "description": "Hybrid weight (vector vs BM25): 0..1", "minimum": 0, "maximum": 1, "default": 0.6}
                        },
                        "required": ["query_text"]
                    }
                )
                ,
                Tool(
                    name="regenerate_node_embedding",
                    description=(
                        "Regenerate the embeddings vector for a Bimba node and persist it to the graph."
                    ),
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "bimbaCoordinate": {
                                "type": "string",
                                "description": "Bimba coordinate to regenerate embedding for",
                                "pattern": r"^#(\d+([-\.\/]\d+)*)?$"
                            }
                        },
                        "required": ["bimbaCoordinate"]
                    }
                )
                ,
                Tool(
                    name="regenerate_all_embeddings",
                    description=(
                        "Regenerate embeddings for all Bimba nodes (admin-only)."
                    ),
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "batch_size": {"type": "integer", "description": "Batch size", "default": 500},
                            "force": {"type": "boolean", "description": "Bypass hash and force rewrite", "default": False}
                        }
                    }
                )
                ,
                Tool(
                    name="create_bimba_relationship",
                    description=(
                        "Create or update relationship between Bimba coordinates (admin only). "
                        "Uses MERGE for idempotent operations - pre-validates coordinates to prevent node creation. "
                        "Properties format: array of 'key:value' strings (e.g., ['hierarchyLevel:1', 'resonancePattern:harmonic']). "
                        "Open schema - define properties that make sense for your relationship type."
                    ),
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "fromCoordinate": {
                                "type": "string",
                                "pattern": r"^#(\d+([-\.\/]\d+)*)?$",
                                "description": "Source Bimba coordinate"
                            },
                            "toCoordinate": {
                                "type": "string",
                                "pattern": r"^#(\d+([-\.\/]\d+)*)?$",
                                "description": "Target Bimba coordinate"
                            },
                            "relationshipType": {
                                "type": "string",
                                "description": "Relationship type in UPPERCASE_UNDERSCORES format (e.g., CONTAINS, RESONATES_WITH)"
                            },
                            "properties": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Properties as 'key:value' strings (e.g., ['hierarchyLevel:1', 'resonancePattern:3-fold harmonic'])"
                            },
                            "bidirectional": {
                                "type": "boolean",
                                "description": "Create reverse relationship as well"
                            }
                        },
                        "required": ["fromCoordinate", "toCoordinate", "relationshipType"],
                        "additionalProperties": False
                    }
                )
                ,
                Tool(
                    name="get_wisdom_packet",
                    description=(
                        "Get or generate a Wisdom Packet for a Bimba coordinate.\n\n"
                        "Wisdom Packets provide pre-synthesized, contextually rich canonical knowledge "
                        "summaries with key concepts, narrative synthesis, and apophatic pointers.\n\n"
                        "SMART FLOW: Check cache → generate if missing → cache for instant future access (24h TTL).\n\n"
                        "Use when you need deep contextual understanding beyond raw coordinate resolution."
                    ),
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "bimbaCoordinate": {
                                "type": "string",
                                "description": "Bimba coordinate (e.g., '#1-2', '#3-4-5')",
                                "pattern": r"^#(\d+([-\.\/]\d+)*)?$"
                            },
                            "depth": {
                                "type": "integer",
                                "description": "Traversal depth (1-5, default 2)",
                                "default": 2,
                                "minimum": 1,
                                "maximum": 5
                            },
                            "focus": {
                                "type": "string",
                                "description": "Synthesis lens",
                                "enum": ["STRUCTURAL", "PROCESSUAL", "ARCHETYPAL", "PRACTICAL"]
                            },
                            "forceRegenerate": {
                                "type": "boolean",
                                "description": "Bypass cache and regenerate",
                                "default": False
                            }
                        },
                        "required": ["bimbaCoordinate"]
                    }
                ),
                Tool(
                    name="get_quintessential_properties",
                    description=(
                        "Get quintessential properties (q_*) for a Bimba coordinate.\n\n"
                        "Quintessential properties are pithy, well-crafted distillations of a node's "
                        "essential nature. These properties follow the pattern q_ or q<digits>_ (e.g., "
                        "q_, q0_, q1_, q12_) and represent refined understanding from episodic research "
                        "and MEF lens crystallization.\n\n"
                        "Priority order: q_ (base) → q0_ → q1_ → q2_ → ... (sorted numerically).\n\n"
                        "Use when you need distilled, essential understanding (not verbose descriptions)."
                    ),
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "bimbaCoordinate": {
                                "type": "string",
                                "description": "Bimba coordinate (e.g., '#1-2', '#3-4-5')",
                                "pattern": r"^#(\d+([-\.\/]\d+)*)?$"
                            }
                        },
                        "required": ["bimbaCoordinate"]
                    }
                ),
                Tool(
                    name="lexical_coordinate_search",
                    description=(
                        "Lexical substring search across all Bimba node properties. "
                        "Direct property iteration for exact substring matching when semantic/fulltext search fails. "
                        "Finds substrings like 'Iti' in 'My-Self/Iti'. Heavier query but more precise. "
                        "Use when semantic search misses exact string matches or for finding coordinates with specific text patterns."
                    ),
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "searchString": {
                                "type": "string",
                                "description": "String to search for in any property (case-sensitive)"
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Maximum results to return (default 20, capped at 50)",
                                "minimum": 1,
                                "default": 20
                            }
                        },
                        "required": ["searchString"]
                    }
                ),
                Tool(
                    name="get_direct_children",
                    description=(
                        "Get direct child nodes of a Bimba coordinate. "
                        "Returns lean data (name, coordinate, primaryDesignation, description) for hierarchical children. "
                        "Useful for exploring coordinate hierarchies and discovering sub-coordinates."
                    ),
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "bimbaCoordinate": {
                                "type": "string",
                                "description": "Parent Bimba coordinate (#N[-|.]N...)",
                                "pattern": r"^#(\d+([-\.\/]\d+)*)?$"
                            }
                        },
                        "required": ["bimbaCoordinate"]
                    }
                ),
                Tool(
                    name="get_agent_functional_properties",
                    description=(
                        "Get functional (f_*) properties for agent discovery and configuration. "
                        "Returns f_* properties like f_agent, f_tools, f_system_prompt, f_workflow_*, "
                        "f_capabilities, etc. Enables agents to discover their own operational configuration "
                        "and other agents' capabilities dynamically from Neo4j. "
                        "Optionally filter by property prefix (e.g., 'f_workflow_' for workflow properties only)."
                    ),
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "bimbaCoordinate": {
                                "type": "string",
                                "description": "Bimba coordinate to query for functional properties",
                                "pattern": r"^#(\d+([-\.\/]\d+)*)?$"
                            },
                            "propertyPrefix": {
                                "type": "string",
                                "description": "Optional prefix filter (e.g., 'f_workflow_', 'f_tools')"
                            }
                        },
                        "required": ["bimbaCoordinate"]
                    }
                )
            ]
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict) -> list[TextContent | ImageContent | EmbeddedResource]:
            """Handle tool execution requests."""
            try:
                if name == "resolve_coordinate":
                    return await self._handle_resolve_coordinate(arguments)
                elif name == "get_node_relationships":
                    return await self._handle_get_node_relationships(arguments)
                elif name == "get_node_details_complete":
                    return await self._handle_get_node_details_complete(arguments)
                elif name == "get_node_by_coordinate_extended":
                    return await self._handle_get_node_by_coordinate_extended(arguments)
                elif name == "get_path_between_coordinates":
                    return await self._handle_get_path_between_coordinates(arguments)
                elif name == "create_bimba_node":
                    return await self._handle_create_bimba_node(arguments)
                elif name == "update_bimba_node":
                    return await self._handle_update_bimba_node(arguments)
                elif name == "semantic_coordinate_discovery":
                    return await self._handle_semantic_coordinate_discovery(arguments)
                elif name == "regenerate_node_embedding":
                    return await self._handle_regenerate_node_embedding(arguments)
                elif name == "regenerate_all_embeddings":
                    return await self._handle_regenerate_all_embeddings(arguments)
                elif name == "create_bimba_relationship":
                    return await self._handle_create_bimba_relationship(arguments)
                elif name == "get_wisdom_packet":
                    return await self._handle_get_wisdom_packet(arguments)
                elif name == "get_quintessential_properties":
                    return await self._handle_get_quintessential_properties(arguments)
                elif name == "lexical_coordinate_search":
                    return await self._handle_lexical_coordinate_search(arguments)
                elif name == "get_direct_children":
                    return await self._handle_get_direct_children(arguments)
                elif name == "get_agent_functional_properties":
                    return await self._handle_get_agent_functional_properties(arguments)
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
                    uri=SCHEMA_URI,
                    name="Bimba Coordinate Schema",
                    description="Schema definition for Epi-Logos coordinate data structures",
                    mimeType="application/json"
                )
            ]
        
        @self.server.read_resource()
        async def handle_read_resource(uri: AnyUrl) -> str | bytes | Iterable["ReadResourceContents"]:
            """Handle resource retrieval requests."""
            if str(uri) == str(SCHEMA_URI):
                return self._get_schema_resource()
            else:
                raise ValueError(f"Unknown resource URI: {uri}")

    async def _handle_resolve_coordinate(self, arguments: dict) -> list[TextContent]:
        """Handle coordinate resolution tool call."""
        try:
            coordinate = arguments.get("bimbaCoordinate")
            if not coordinate:
                return [TextContent(
                    type="text",
                    text="Error: bimbaCoordinate parameter is required"
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
                            elif key == 'architecturalFunction':
                                response += f"  architecturalFunction: {value}\n"
                            elif key == 'symbol':
                                response += f"  symbol: {value}\n"
                            # nodeType not used
                
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
    async def _handle_get_node_details_complete(self, arguments: dict) -> list[TextContent]:
        """Handle complete node details retrieval via GraphQL (all properties via Generic scalar)."""
        try:
            coordinate = arguments.get("bimbaCoordinate")
            if not coordinate:
                return [TextContent(type="text", text="Error: bimbaCoordinate parameter is required")]

            include_functional = arguments.get("includeFunctionalProperties", False)

            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Complete node service not initialized")]

            result = await self.bimba_client.get_node_details_complete(coordinate, include_functional)

            if result.get("success"):
                all_props = result.get("allProperties") or {}

                # Format complete properties response
                lines: list[str] = []
                lines.append(f"=== COMPLETE NODE DETAILS: {coordinate} ===\n")
                lines.append(f"All Neo4j properties (embeddings/timestamps filtered):\n")

                # Display all properties in JSON-like format
                import json
                formatted_props = json.dumps(all_props, indent=2, default=str)
                lines.append(formatted_props)

                return [TextContent(type="text", text="\n".join(lines))]
            else:
                error = result.get("error", "Unknown error")
                return [TextContent(type="text", text=f"Complete details retrieval failed: {error}")]

        except Exception as e:
            logger.error(f"Error in get_node_details_complete: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    async def _handle_get_node_by_coordinate_extended(self, arguments: dict) -> list[TextContent]:
        """Handle extended node inspection via GraphQL (comprehensive property set)."""
        try:
            coordinate = arguments.get("bimbaCoordinate")
            if not coordinate:
                return [TextContent(type="text", text="Error: bimbaCoordinate parameter is required")]

            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Extended node service not initialized")]

            result = await self.bimba_client.get_node_by_coordinate_extended(coordinate)

            if result.get("success"):
                node = result.get("node") or {}

                # Format comprehensive response
                lines: list[str] = []
                lines.append(f"=== COMPREHENSIVE NODE INSPECTION: {coordinate} ===\n")

                # Core Identity
                lines.append("## Core Identity")
                lines.append(f"Name: {node.get('name')}")
                lines.append(f"Subsystem: {node.get('subsystem')}")
                if node.get("primaryDesignation"):
                    lines.append(f"Primary Designation: {node.get('primaryDesignation')}")
                if node.get("coreNature"):
                    lines.append(f"Core Nature: {node.get('coreNature')}")
                if node.get("architecturalFunction"):
                    lines.append(f"Architectural Function: {node.get('architecturalFunction')}")

                # Structure
                if node.get("internalStructure"):
                    lines.append(f"\n## Internal Structure")
                    lines.append(node.get("internalStructure"))

                # Principle Arrays
                if node.get("keyPrinciples"):
                    lines.append(f"\n## Key Principles")
                    for i, principle in enumerate(node.get("keyPrinciples", []), 1):
                        lines.append(f"  {i}. {principle}")

                if node.get("resonances"):
                    lines.append(f"\n## Resonances")
                    for i, resonance in enumerate(node.get("resonances", []), 1):
                        lines.append(f"  {i}. {resonance}")

                if node.get("practicalApplications"):
                    lines.append(f"\n## Practical Applications")
                    for i, app in enumerate(node.get("practicalApplications", []), 1):
                        lines.append(f"  {i}. {app}")

                # Operational
                if node.get("operationalEssence") or node.get("accessLevel") or node.get("consciousnessStructure") or node.get("operationalSymbolics"):
                    lines.append(f"\n## Operational Details")
                    if node.get("operationalEssence"):
                        lines.append(f"Operational Essence: {node.get('operationalEssence')}")
                    if node.get("accessLevel"):
                        lines.append(f"Access Level: {node.get('accessLevel')}")
                    if node.get("consciousnessStructure"):
                        lines.append(f"Consciousness Structure: {node.get('consciousnessStructure')}")
                    if node.get("operationalSymbolics"):
                        lines.append(f"Operational Symbolics: {node.get('operationalSymbolics')}")

                # Relational
                if node.get("relatedCoordinates"):
                    lines.append(f"\n## Related Coordinates")
                    for coord in node.get("relatedCoordinates", []):
                        lines.append(f"  - {coord}")

                # Metadata
                lines.append(f"\n## Metadata")
                if node.get("lastUpdated"):
                    lines.append(f"Last Updated: {node.get('lastUpdated')}")
                if node.get("createdAt"):
                    lines.append(f"Created: {node.get('createdAt')}")
                if node.get("uuid"):
                    lines.append(f"UUID: {node.get('uuid')}")

                return [TextContent(type="text", text="\n".join(lines))]
            else:
                error = result.get("error", "Unknown error")
                return [TextContent(type="text", text=f"Extended inspection failed: {error}")]

        except Exception as e:
            logger.error(f"Error in get_node_by_coordinate_extended: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    async def _handle_get_node_relationships(self, arguments: dict) -> list[TextContent]:
        """Handle relationship discovery for a coordinate."""
        try:
            coordinate = arguments.get("bimbaCoordinate")
            if not coordinate:
                return [TextContent(type="text", text="Error: bimbaCoordinate parameter is required")]

            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Relationship service not initialized")]

            result = await self.bimba_client.get_node_relationships(coordinate)

            if result.get("success"):
                node = result.get("node") or {}
                edges = result.get("edges", [])

                lines: list[str] = []
                lines.append(f"Coordinate: {node.get('coordinate', coordinate)}")
                if node.get("name"):
                    lines.append(f"Name: {node['name']}")
                if node.get("subsystem") is not None:
                    lines.append(f"Subsystem: {node['subsystem']}")
                lines.append("")
                lines.append(f"Edges: {len(edges)}")

                for e in edges:
                    etype = e.get("type")
                    edir = e.get("direction")
                    neigh = e.get("neighbor", {})
                    ncoord = neigh.get("coordinate")
                    nname = neigh.get("name")
                    header = f"- [{edir}] {etype} -> {ncoord or 'UNKNOWN'}"
                    if nname:
                        header += f" ({nname})"
                    lines.append(header)

                    props = e.get("properties") or []
                    if props:
                        prop_str = ", ".join([f"{p['key']}={p.get('value')}" for p in props])
                        lines.append(f"  properties: {prop_str}")

                return [TextContent(type="text", text="\n".join(lines))]
            else:
                err = result.get("error", "Unknown error")
                return [TextContent(type="text", text=f"Relationship discovery failed: {err}")]
        except Exception as e:
            logger.error(f"Error in get_node_relationships: {e}")
            return [TextContent(type="text", text=f"Error fetching relationships: {str(e)}")]

    async def _handle_get_path_between_coordinates(self, arguments: dict) -> list[TextContent]:
        """Handle path traversal between two coordinates via GraphQL."""
        try:
            start = arguments.get("startCoordinate")
            end = arguments.get("endCoordinate")
            hops = arguments.get("maxHops", 5)

            if not start or not end:
                return [TextContent(type="text", text="Error: startCoordinate and endCoordinate are required")]

            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Path traversal service not initialized")]

            # Inline GraphQL call using the client base POST
            query = """
            query Path($start: String!, $end: String!, $hops: Int) {
              getPathBetweenCoordinates(startCoordinate: $start, endCoordinate: $end, maxHops: $hops) {
                startNode { coordinate name subsystem }
                endNode { coordinate name subsystem }
                pathLength
                pathComponents {
                  ... on PathNode { position coordinate name subsystem }
                  ... on PathRelationship { position type direction properties { key value } }
                }
              }
            }
            """
            variables = {"start": start, "end": end, "hops": hops}
            resp = await self.bimba_client.post("/graphql", json_data={"query": query, "variables": variables})

            if "data" in resp and resp["data"] and resp["data"].get("getPathBetweenCoordinates"):
                path = resp["data"]["getPathBetweenCoordinates"]
                lines: list[str] = []
                lines.append(f"Path from {path['startNode']['coordinate']} to {path['endNode']['coordinate']}")
                lines.append(f"Length: {path['pathLength']}")
                lines.append("Components:")
                for comp in path.get("pathComponents", []):
                    pos = comp.get("position")
                    if "type" in comp:  # relationship
                        t = comp.get("type")
                        d = comp.get("direction")
                        lines.append(f"  {pos}: [{d}] -{t}->")
                    else:  # node
                        lines.append(f"  {pos}: {comp.get('coordinate')} ({comp.get('name')})")
                return [TextContent(type="text", text="\n".join(lines))]

            # GraphQL error or no path
            if "data" in resp and resp["data"] and resp["data"].get("getPathBetweenCoordinates") is None:
                return [TextContent(type="text", text="No path found within constraints.")]

            errors = resp.get("errors", [])
            err_msg = "; ".join([e.get("message", "Unknown error") for e in errors])
            return [TextContent(type="text", text=f"Path traversal failed: {err_msg or 'GraphQL query failed'}")]

        except Exception as e:
            logger.error(f"Error in get_path_between_coordinates: {e}")
            return [TextContent(type="text", text=f"Error finding path: {str(e)}")]

    async def _handle_semantic_coordinate_discovery(self, arguments: dict) -> list[TextContent]:
        """Handle semantic coordinate discovery via GraphQL."""
        try:
            query_text = arguments.get("query_text")
            max_results = int(arguments.get("max_results", 7))  # Default 7 for mod6 QL alignment (parent + 6 children)
            alpha = arguments.get("alpha", None)
            if not query_text:
                return [TextContent(type="text", text="Error: query_text is required")]

            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Semantic discovery service not initialized")]

            result = await self.bimba_client.semantic_coordinate_discovery(query_text, max_results, alpha)
            if result.get("success"):
                lines: list[str] = [f"Results ({len(result.get('results', []))}):"]
                for i, r in enumerate(result.get("results", []), start=1):
                    coord = r.get("coordinate")
                    name = r.get("name")
                    score = r.get("similarity")
                    ctx = r.get("semanticContext")
                    ns = r.get("namespace")
                    header = f"{i}. {coord} ({name}) — score={score:.4f}"
                    if ns:
                        header += f" [{ns}]"
                    lines.append(header)
                    if ctx:
                        lines.append(f"    context: {ctx}")
                return [TextContent(type="text", text="\n".join(lines))]
            else:
                return [TextContent(type="text", text=f"Semantic discovery failed: {result.get('error', 'Unknown error')}")]
        except Exception as e:
            logger.error(f"Error in semantic_coordinate_discovery: {e}")
            return [TextContent(type="text", text=f"Error during semantic discovery: {str(e)}")]

    async def _handle_regenerate_node_embedding(self, arguments: dict) -> list[TextContent]:
        """Handle node embedding regeneration via Backend REST."""
        try:
            coord = arguments.get("bimbaCoordinate")
            if not coord:
                return [TextContent(type="text", text="Error: bimbaCoordinate is required")]

            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Embedding tool not initialized")]

            # Use GraphQL mutation via client
            resp = await self.bimba_client.regenerate_node_embedding(coord)
            if resp.get("success"):
                dim = resp.get("dimension")
                return [TextContent(type="text", text=f"Embedding regenerated for {coord} (dim={dim})")]
            else:
                return [TextContent(type="text", text=f"Embedding regeneration failed: {resp.get('error', 'Unknown error')}")]
        except Exception as e:
            logger.error(f"Error in regenerate_node_embedding: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    async def _handle_create_bimba_node(self, arguments: dict) -> list[TextContent]:
        """Handle node creation via GraphQL (admin)."""
        try:
            required = ["bimbaCoordinate", "name", "subsystem"]
            missing = [k for k in required if not arguments.get(k)]
            if missing:
                return [TextContent(type="text", text=f"Error: missing required fields: {', '.join(missing)}")]

            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Node creation client not initialized")]

            payload = {
                k: v for k, v in arguments.items() if k in (
                    "bimbaCoordinate", "name", "subsystem", "description",
                    "operationalEssence", "coreNature", "function", "architecturalFunction", "symbol"
                ) and v is not None
            }
            if "bimbaCoordinate" in payload:
                payload["coordinate"] = payload.pop("bimbaCoordinate")
            resp = await self.bimba_client.create_bimba_node(payload)
            if resp.get("success"):
                node = resp.get("node") or {}
                return [TextContent(type="text", text=f"Node created: {node.get('coordinate')} ({node.get('name')})")]
            # errors path
            errs = resp.get("errors") or []
            if errs:
                code = errs[0].get("code")
                msg = errs[0].get("message")
                return [TextContent(type="text", text=f"Creation failed [{code}]: {msg}")]
            return [TextContent(type="text", text=f"Creation failed: {resp}")]
        except Exception as e:
            logger.error(f"Error in create_bimba_node: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    async def _handle_update_bimba_node(self, arguments: dict) -> list[TextContent]:
        """Handle node update via GraphQL (admin).

        Accepts ALL properties from arguments (flexible schema support).
        Transforms custom properties to key-value array format for GraphQL.
        """
        try:
            coord = arguments.get("bimbaCoordinate")
            if not coord:
                return [TextContent(type="text", text="Error: bimbaCoordinate is required")]

            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Node update client not initialized")]

            # Known typed fields in GraphQL schema
            known_fields = {
                "name", "primaryDesignation", "coreNature", "architecturalFunction",
                "internalStructure", "keyPrinciples", "resonances", "practicalApplications",
                "operationalEssence", "accessLevel", "consciousnessStructure", "operationalSymbolics",
                "relatedCoordinates", "description", "function", "symbol"
            }

            # Split into known fields and custom properties
            typed_props = {k: v for k, v in arguments.items() if k in known_fields and v is not None}
            custom_props = {k: v for k, v in arguments.items() if k not in known_fields and k != "bimbaCoordinate" and v is not None}

            # Build payload with typed fields
            payload = {"coordinate": coord, **typed_props}

            # Transform custom properties to key-value array: {foo: "bar"} → [{key: "foo", value: "bar"}]
            if custom_props:
                payload["properties"] = [{"key": k, "value": str(v)} for k, v in custom_props.items()]

            resp = await self.bimba_client.update_bimba_node(payload)
            if resp.get("success"):
                node = resp.get("node") or {}
                return [TextContent(type="text", text=f"Node updated: {node.get('coordinate')} ({node.get('name')})")]

            # Handle errors
            errs = resp.get("errors") or []
            if errs:
                code = errs[0].get("code")
                msg = errs[0].get("message")
                return [TextContent(type="text", text=f"Update failed [{code}]: {msg}")]
            return [TextContent(type="text", text=f"Update failed: {resp}")]
        except Exception as e:
            logger.error(f"Error in update_bimba_node: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    async def _handle_regenerate_all_embeddings(self, arguments: dict) -> list[TextContent]:
        try:
            batch_size = int(arguments.get("batch_size", 500))
            force = bool(arguments.get("force", False))
            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Embedding tool not initialized")]
            resp = await self.bimba_client.regenerate_all_embeddings(batch_size, force)
            if resp.get("success"):
                return [TextContent(type="text", text=f"Bulk regeneration complete: total={resp.get('total')} updated={resp.get('updated')} skipped={resp.get('skipped')} (force={force})")]
            else:
                return [TextContent(type="text", text=f"Bulk regeneration failed: {resp.get('error', 'Unknown error')}")]
        except Exception as e:
            logger.error(f"Error in regenerate_all_embeddings: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    async def _handle_create_bimba_relationship(self, arguments: dict) -> list[TextContent]:
        """Handle relationship creation via GraphQL (admin).

        Parses 'key:value' string array into property objects for GraphQL.
        """
        try:
            # Validate required fields
            required = ["fromCoordinate", "toCoordinate", "relationshipType"]
            missing = [k for k in required if not arguments.get(k)]
            if missing:
                return [TextContent(type="text", text=f"Error: missing required fields: {', '.join(missing)}")]

            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Relationship creation client not initialized")]

            # Parse "key:value" strings into GraphQL format
            property_list = []
            for prop_str in arguments.get("properties", []):
                if ":" in prop_str:
                    key, value = prop_str.split(":", 1)
                    property_list.append({"key": key.strip(), "value": value.strip()})

            # Build payload for GraphQL
            payload = {
                "fromCoordinate": arguments["fromCoordinate"],
                "toCoordinate": arguments["toCoordinate"],
                "relationshipType": arguments["relationshipType"],
                "properties": property_list
            }
            if "bidirectional" in arguments:
                payload["bidirectional"] = arguments["bidirectional"]

            resp = await self.bimba_client.create_bimba_relationship(payload)

            if resp.get("success"):
                rel = resp.get("relationship") or {}
                was_update = resp.get("wasUpdate", False)
                action = "Updated" if was_update else "Created"

                # Format response
                lines: list[str] = []
                lines.append(f"{action} relationship: {rel.get('fromCoordinate')} -[{rel.get('type')}]-> {rel.get('toCoordinate')}")

                # Show properties
                props = rel.get("properties", [])
                if props:
                    prop_strs = [f"{p.get('key')}={p.get('value')}" for p in props]
                    lines.append(f"Properties: {', '.join(prop_strs)}")

                # Show reverse if bidirectional
                rev_rel = resp.get("reverseRelationship")
                if rev_rel:
                    lines.append(f"\nReverse: {rev_rel.get('fromCoordinate')} -[{rev_rel.get('type')}]-> {rev_rel.get('toCoordinate')}")

                return [TextContent(type="text", text="\n".join(lines))]

            # Handle errors
            errs = resp.get("errors") or []
            if errs:
                code = errs[0].get("code")
                msg = errs[0].get("message")
                return [TextContent(type="text", text=f"Relationship creation failed [{code}]: {msg}")]
            return [TextContent(type="text", text=f"Relationship creation failed: {resp}")]
        except Exception as e:
            logger.error(f"Error in create_bimba_relationship: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    async def _handle_get_wisdom_packet(self, arguments: dict) -> list[TextContent]:
        """Handle wisdom packet generation/retrieval via GraphQL.

        Provides pre-synthesized, contextually rich canonical knowledge summaries.
        """
        try:
            coordinate = arguments.get("bimbaCoordinate")
            if not coordinate:
                return [TextContent(type="text", text="Error: bimbaCoordinate parameter is required")]

            depth = arguments.get("depth", 2)
            focus = arguments.get("focus")
            force_regenerate = arguments.get("forceRegenerate", False)

            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Wisdom packet client not initialized")]

            result = await self.bimba_client.get_wisdom_packet(
                coordinate=coordinate,
                depth=depth,
                focus=focus,
                force_regenerate=force_regenerate
            )

            if result.get("success"):
                packet = result.get("wisdom_packet", {})

                # Format wisdom packet for MCP display
                lines: list[str] = []
                lines.append(f"=== Wisdom Packet: {coordinate} ===")
                lines.append(f"Cache Hit: {packet.get('cacheHit', False)}")
                lines.append(f"Synthesis Score: {packet.get('synthesisScore', 0):.2f}")
                lines.append(f"Depth: {packet.get('depth', 2)}")

                if packet.get("focus"):
                    lines.append(f"Focus: {packet['focus']}")

                lines.append("")

                # Central node
                central = packet.get("centralNode", {})
                lines.append(f"Central Node: {central.get('name', 'Unknown')}")
                if central.get("operationalEssence"):
                    lines.append(f"  Essence: {central['operationalEssence']}")
                lines.append("")

                # Narrative summary
                lines.append("Narrative Summary:")
                lines.append(f"  {packet.get('narrativeSummary', 'N/A')}")
                lines.append("")

                # Key concepts
                key_concepts = packet.get("keyConcepts", [])
                if key_concepts:
                    lines.append(f"Key Concepts ({len(key_concepts)}):")
                    for kc in key_concepts:
                        concept = kc.get("concept", "Unknown")
                        relevance = kc.get("relevanceScore", 0)
                        lines.append(f"  • {concept} (relevance: {relevance:.2f})")
                        if kc.get("description"):
                            lines.append(f"    {kc['description']}")
                    lines.append("")

                # Contextual themes
                themes = packet.get("contextualThemes", [])
                if themes:
                    lines.append(f"Contextual Themes: {', '.join(themes)}")
                    lines.append("")

                # Apophatic pointers
                pointers = packet.get("apophaticPointers", [])
                if pointers:
                    lines.append(f"Apophatic Pointers ({len(pointers)}):")
                    for ap in pointers:
                        theme = ap.get("missingTheme", "Unknown")
                        suggestion = ap.get("suggestion", "")
                        lines.append(f"  ⚠ Missing: {theme}")
                        if suggestion:
                            lines.append(f"    → {suggestion}")
                    lines.append("")

                lines.append(f"Generated: {packet.get('generatedAt', 'Unknown')}")

                return [TextContent(type="text", text="\n".join(lines))]
            else:
                error = result.get("error", "Unknown error")
                return [TextContent(type="text", text=f"Wisdom packet error: {error}")]

        except Exception as e:
            logger.error(f"Error in get_wisdom_packet: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    async def _handle_get_quintessential_properties(self, arguments: dict) -> list[TextContent]:
        """Handle quintessential properties retrieval via GraphQL.

        Returns pithy, well-crafted distillations of a node's essential nature.
        """
        try:
            coordinate = arguments.get("bimbaCoordinate")
            if not coordinate:
                return [TextContent(type="text", text="Error: bimbaCoordinate parameter is required")]

            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Quintessential properties client not initialized")]

            result = await self.bimba_client.get_quintessential_properties(coordinate)

            if result.get("success"):
                q_props = result.get("quintessential_properties", {})

                # Format quintessential properties for MCP display
                lines: list[str] = []
                lines.append(f"=== Quintessential Properties: {coordinate} ===")
                lines.append("")

                if q_props:
                    for key, value in q_props.items():
                        lines.append(f"{key}:")
                        lines.append(f"  {value}")
                        lines.append("")
                else:
                    lines.append("No quintessential properties found for this coordinate.")
                    lines.append("")
                    lines.append("Quintessential properties (q_*) are pithy, well-crafted")
                    lines.append("distillations created through episodic research and")
                    lines.append("MEF lens crystallization. They represent refined")
                    lines.append("understanding beyond standard descriptions.")

                return [TextContent(type="text", text="\n".join(lines))]
            else:
                error = result.get("error", "Unknown error")
                return [TextContent(type="text", text=f"Quintessential properties error: {error}")]

        except Exception as e:
            logger.error(f"Error in get_quintessential_properties: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    async def _handle_lexical_coordinate_search(self, arguments: dict) -> list[TextContent]:
        """Handle lexical substring search via GraphQL.

        Direct property iteration for exact substring matching when semantic/fulltext search fails.
        """
        try:
            search_string = arguments.get("searchString")
            if not search_string:
                return [TextContent(type="text", text="Error: searchString parameter is required")]

            limit = arguments.get("limit")

            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Lexical search client not initialized")]

            result = await self.bimba_client.lexical_coordinate_search(search_string, limit)

            if result.get("success"):
                results = result.get("results", [])
                lines: list[str] = []
                lines.append(f"Lexical search for '{search_string}': {len(results)} results")

                for i, r in enumerate(results, 1):
                    coord = r.get("coordinate")
                    name = r.get("name")
                    desc = r.get("description")

                    line = f"{i}. {coord}"
                    if name:
                        line += f" ({name})"
                    lines.append(line)

                    if desc:
                        # Truncate long descriptions
                        desc_preview = desc[:100] + "..." if len(desc) > 100 else desc
                        lines.append(f"   {desc_preview}")

                return [TextContent(type="text", text="\n".join(lines))]
            else:
                error = result.get("error", "Unknown error")
                return [TextContent(type="text", text=f"Lexical search failed: {error}")]

        except Exception as e:
            logger.error(f"Error in lexical_coordinate_search: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    async def _handle_get_direct_children(self, arguments: dict) -> list[TextContent]:
        """Handle direct children query via GraphQL.

        Returns lean data for hierarchical child nodes of a given coordinate.
        """
        try:
            bimba_coordinate = arguments.get("bimbaCoordinate")
            if not bimba_coordinate:
                return [TextContent(type="text", text="Error: bimbaCoordinate parameter is required")]

            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Bimba client not initialized")]

            result = await self.bimba_client.get_direct_children(bimba_coordinate)

            if result.get("success"):
                children = result.get("children", [])
                lines: list[str] = []
                lines.append(f"Direct children of '{bimba_coordinate}': {len(children)} child nodes")

                if not children:
                    lines.append("(No children found)")
                else:
                    for i, child in enumerate(children, 1):
                        coord = child.get("coordinate")
                        name = child.get("name")
                        primary_designation = child.get("primaryDesignation")
                        desc = child.get("description")

                        line = f"{i}. {coord}"
                        if name:
                            line += f" - {name}"
                        if primary_designation:
                            line += f" ({primary_designation})"
                        lines.append(line)

                        if desc:
                            # Truncate long descriptions
                            desc_preview = desc[:100] + "..." if len(desc) > 100 else desc
                            lines.append(f"   {desc_preview}")

                return [TextContent(type="text", text="\n".join(lines))]
            else:
                error = result.get("error", "Unknown error")
                return [TextContent(type="text", text=f"Get direct children failed: {error}")]

        except Exception as e:
            logger.error(f"Error in get_direct_children: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    async def _handle_get_agent_functional_properties(self, arguments: dict) -> list[TextContent]:
        """Handle functional properties query via GraphQL.

        Returns f_* properties for agent discovery and configuration.
        """
        try:
            bimba_coordinate = arguments.get("bimbaCoordinate")
            if not bimba_coordinate:
                return [TextContent(type="text", text="Error: bimbaCoordinate parameter is required")]

            property_prefix = arguments.get("propertyPrefix")

            if not self.bimba_client:
                return [TextContent(type="text", text="Error: Bimba client not initialized")]

            result = await self.bimba_client.get_functional_properties(bimba_coordinate, property_prefix)

            if result.get("success"):
                properties = result.get("properties", {})
                lines: list[str] = []

                filter_text = f" (filtered: {property_prefix})" if property_prefix else ""
                lines.append(f"Functional properties for '{bimba_coordinate}'{filter_text}:")

                if not properties:
                    lines.append("(No functional properties found)")
                else:
                    for key, value in properties.items():
                        # Format value based on type
                        if isinstance(value, list):
                            value_str = f"[{len(value)} items]"
                            lines.append(f"  {key}: {value_str}")
                            # Show first few items
                            for item in value[:3]:
                                lines.append(f"    - {item}")
                            if len(value) > 3:
                                lines.append(f"    ... and {len(value) - 3} more")
                        elif isinstance(value, str) and len(value) > 100:
                            # Truncate long strings
                            lines.append(f"  {key}: {value[:100]}...")
                        else:
                            lines.append(f"  {key}: {value}")

                return [TextContent(type="text", text="\n".join(lines))]
            else:
                error = result.get("error", "Unknown error")
                return [TextContent(type="text", text=f"Get functional properties failed: {error}")]

        except Exception as e:
            logger.error(f"Error in get_agent_functional_properties: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    def _get_schema_resource(self) -> str:
        """Get coordinate schema resource."""
        schema = {
            "mod6_ql_framework": {
                "description": "Core mod6 Quaternal Logic framework with standard coordinate range 0-5",
                "cycle": "Complete manifestation cycle from implicit potential (0) to quintessential synthesis (5)",
                "range": "0-5 as foundational basis within any given branch"
            },
            "coordinate_formats": [
                {
                    "format": "#",
                    "description": "System root coordinate"
                },
                {
                    "format": "#N",
                    "description": "Primary subsystem coordinate (0-5 mod6 QL framework)"
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
                "tools": ["resolve_coordinate", "get_node_relationships"],
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
