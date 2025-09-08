"""
Native MCP protocol server for Graphiti episodic memory service.

This module implements the Model Context Protocol (MCP) server interface,
providing direct access to episodic memory tools for the agentic layer
with session tracking, agent rumination capture, and temporal community formation.
"""

import logging
import asyncio
from typing import Any, Sequence

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.types import (
    Resource, Tool, TextContent, ImageContent, EmbeddedResource,
    LoggingLevel, CallToolRequest, GetPromptRequest, ReadResourceRequest,
    ListPromptsRequest, ListResourcesRequest, ListToolsRequest,
    Prompt, PromptArgument, PromptMessage, Role
)

from shared.database import Neo4jClient
from .service import GraphitiService
from .models import (
    EpisodeRequest, EpisodeType, SearchRequest,
    CommunityRequest, QuaternalUnitRequest, QuaternalUnitUpdateRequest,
    QuaternalUnitSearchRequest, QuaternalType, QuaternalStatus,
    SourceType, QuaternalEntity, SourceReference, CrossCoordinateLink
)


logger = logging.getLogger(__name__)


class GraphitiMCPServer:
    """
    Native MCP protocol server for Graphiti episodic memory service.
    
    Provides direct access to episodic memory tools for AI agents including:
    - Episode creation (user sessions, agent ruminations, context frames)
    - Temporal search and retrieval
    - Community formation and management
    - Session continuity tracking
    """
    
    def __init__(self, neo4j_client: Neo4jClient, workspace_id: str = "episodic"):
        """Initialize MCP server with Graphiti service."""
        self.neo4j_client = neo4j_client
        self.graphiti_service = GraphitiService(neo4j_client, workspace_id)
        
        # Initialize MCP server
        self.server = Server("graphiti-episodic-memory")
        self._setup_handlers()
        
        logger.info(f"Initialized Graphiti MCP server with workspace: {workspace_id}")
    
    def _setup_handlers(self):
        """Set up MCP server request handlers."""
        
        @self.server.list_tools()
        async def handle_list_tools() -> list[Tool]:
            """List available episodic memory tools."""
            return [
                Tool(
                    name="create_episode",
                    description="Create a new episodic memory entry (user session, agent rumination, context frame, etc.)",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "group_id": {
                                "type": "string",
                                "description": "Multi-tenant group identifier"
                            },
                            "episode_type": {
                                "type": "string",
                                "enum": ["user_session", "agent_rumination", "context_frame", "learning_event", "community_formation"],
                                "description": "Type of episode to create"
                            },
                            "content": {
                                "type": "string",
                                "description": "Episode content or description"
                            },
                            "context": {
                                "type": "object",
                                "description": "Additional context data for the episode"
                            },
                            "user_id": {
                                "type": "string",
                                "description": "Associated user identifier (optional)"
                            },
                            "session_id": {
                                "type": "string",
                                "description": "Session identifier for continuity (optional)"
                            },
                            "agent_id": {
                                "type": "string",
                                "description": "Agent identifier for ruminations (optional)"
                            }
                        },
                        "required": ["group_id", "episode_type", "content"]
                    }
                ),
                Tool(
                    name="search_episodes",
                    description="Search episodic memories using hybrid search (semantic + BM25 + graph traversal)",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "group_id": {
                                "type": "string",
                                "description": "Multi-tenant group identifier"
                            },
                            "query": {
                                "type": "string",
                                "description": "Search query text"
                            },
                            "episode_types": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["user_session", "agent_rumination", "context_frame", "learning_event", "community_formation"]
                                },
                                "description": "Filter by episode types (optional)"
                            },
                            "user_id": {
                                "type": "string",
                                "description": "Filter by user ID (optional)"
                            },
                            "session_id": {
                                "type": "string",
                                "description": "Filter by session ID (optional)"
                            },
                            "agent_id": {
                                "type": "string",
                                "description": "Filter by agent ID (optional)"
                            },
                            "limit": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 100,
                                "default": 10,
                                "description": "Maximum number of results"
                            }
                        },
                        "required": ["group_id"]
                    }
                ),
                Tool(
                    name="get_session_continuity",
                    description="Get all episodes for a specific session to maintain continuity",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "group_id": {
                                "type": "string",
                                "description": "Multi-tenant group identifier"
                            },
                            "session_id": {
                                "type": "string",
                                "description": "Session identifier"
                            }
                        },
                        "required": ["group_id", "session_id"]
                    }
                ),
                Tool(
                    name="get_agent_ruminations",
                    description="Get recent agent rumination episodes for learning continuity",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "group_id": {
                                "type": "string",
                                "description": "Multi-tenant group identifier"
                            },
                            "agent_id": {
                                "type": "string",
                                "description": "Agent identifier"
                            },
                            "limit": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 50,
                                "default": 10,
                                "description": "Maximum number of ruminations to return"
                            }
                        },
                        "required": ["group_id", "agent_id"]
                    }
                ),
                Tool(
                    name="create_community",
                    description="Create a temporal community of related episodes with QL-aligned properties",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "group_id": {
                                "type": "string",
                                "description": "Multi-tenant group identifier"
                            },
                            "name": {
                                "type": "string",
                                "description": "Community name or description"
                            },
                            "episode_ids": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "List of episode IDs to include in the community"
                            },
                            "quaternary_position": {
                                "type": "integer",
                                "minimum": 0,
                                "maximum": 5,
                                "description": "QL position (#0-#5) for consciousness-aligned processing (optional)"
                            },
                            "context_frame_type": {
                                "type": "string",
                                "description": "Associated context frame type (optional)"
                            }
                        },
                        "required": ["group_id", "name"]
                    }
                ),
                Tool(
                    name="create_quaternal_unit",
                    description="Create a new QuaternalUnit for QL-aligned episodic memory synthesis",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "group_id": {
                                "type": "string",
                                "description": "Multi-tenant group identifier"
                            },
                            "quaternal_type": {
                                "type": "string",
                                "enum": ["TWO_PART", "THREE_PART", "FOUR_PART", "FIVE_PART", "SIX_PART", 
                                        "SEVEN_PART", "EIGHT_PART", "NINE_PART", "TEN_PART", "TWELVE_PART"],
                                "default": "FOUR_PART",
                                "description": "QL structure type (4 and 6-part are primary operational units)"
                            },
                            "bimba_coordinate": {
                                "type": "string",
                                "description": "Primary Bimba coordinate to ground the unit"
                            },
                            "summary": {
                                "type": "string",
                                "description": "Human-readable summary of the epistemic whole"
                            },
                            "source_references": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "uuid": {"type": "string"},
                                        "source_type": {
                                            "type": "string",
                                            "enum": ["lightrag_doc", "notion_page", "neo4j_node", "mongo_doc", "episode", "community"]
                                        },
                                        "summary": {"type": "string"},
                                        "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0}
                                    },
                                    "required": ["uuid", "source_type"]
                                },
                                "description": "Optional initial evidence to seed the process"
                            },
                            "initial_entities": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "name": {"type": "string"},
                                        "ql_position": {"type": "integer"},
                                        "summary": {"type": "string"},
                                        "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0}
                                    },
                                    "required": ["name", "ql_position"]
                                },
                                "description": "User's intuition-driven mapping of initial entities to QL positions"
                            }
                        },
                        "required": ["group_id", "bimba_coordinate", "summary"]
                    }
                ),
                Tool(
                    name="update_quaternal_unit",
                    description="Update an existing QuaternalUnit with synthesized information and cross-coordinate links",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "qu_id": {
                                "type": "string",
                                "description": "UUID of the QuaternalUnit to update"
                            },
                            "status": {
                                "type": "string",
                                "enum": ["POTENTIAL", "REFINING", "VALIDATED"],
                                "description": "New lifecycle status"
                            },
                            "summary": {
                                "type": "string",
                                "description": "Updated summary"
                            },
                            "entities_to_add": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "name": {"type": "string"},
                                        "ql_position": {"type": "integer"},
                                        "summary": {"type": "string"},
                                        "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0}
                                    },
                                    "required": ["name", "ql_position"]
                                },
                                "description": "Entities to add to the QL structure"
                            },
                            "entities_to_remove": {
                                "type": "array",
                                "items": {"type": "integer"},
                                "description": "QL positions to remove"
                            },
                            "cross_coordinate_links_to_add": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "target_qu_id": {"type": "string"},
                                        "target_bimba_coordinate": {"type": "string"},
                                        "relationship_summary": {"type": "string"},
                                        "strength": {"type": "number", "minimum": 0.0, "maximum": 1.0}
                                    },
                                    "required": ["target_qu_id", "target_bimba_coordinate", "relationship_summary"]
                                },
                                "description": "New cross-coordinate relationships"
                            },
                            "source_references_to_add": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "uuid": {"type": "string"},
                                        "source_type": {
                                            "type": "string",
                                            "enum": ["lightrag_doc", "notion_page", "neo4j_node", "mongo_doc", "episode", "community"]
                                        },
                                        "summary": {"type": "string"},
                                        "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0}
                                    },
                                    "required": ["uuid", "source_type"]
                                },
                                "description": "Additional source references"
                            }
                        },
                        "required": ["qu_id"]
                    }
                ),
                Tool(
                    name="find_quaternal_units",
                    description="Search for validated QL units related to a topic with advanced filtering",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "group_id": {
                                "type": "string",
                                "description": "Multi-tenant group identifier"
                            },
                            "query": {
                                "type": "string",
                                "description": "Text search query"
                            },
                            "quaternal_types": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["TWO_PART", "THREE_PART", "FOUR_PART", "FIVE_PART", "SIX_PART", 
                                            "SEVEN_PART", "EIGHT_PART", "NINE_PART", "TEN_PART", "TWELVE_PART"]
                                },
                                "description": "Filter by QL structure types"
                            },
                            "status": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["POTENTIAL", "REFINING", "VALIDATED"]
                                },
                                "description": "Filter by lifecycle status"
                            },
                            "bimba_coordinates": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Filter by Bimba coordinates"
                            },
                            "min_confidence": {
                                "type": "number",
                                "minimum": 0.0,
                                "maximum": 1.0,
                                "default": 0.0,
                                "description": "Minimum confidence score"
                            },
                            "min_completeness": {
                                "type": "number",
                                "minimum": 0.0,
                                "maximum": 1.0,
                                "default": 0.0,
                                "description": "Minimum completeness score"
                            },
                            "limit": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 100,
                                "default": 10,
                                "description": "Maximum number of results"
                            }
                        },
                        "required": ["group_id"]
                    }
                ),
                Tool(
                    name="refine_quaternal_unit",
                    description="Trigger the refinement process for a potential QL unit, promoting it through lifecycle stages",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "qu_id": {
                                "type": "string",
                                "description": "UUID of the QuaternalUnit to refine"
                            },
                            "refinement_instructions": {
                                "type": "string",
                                "description": "Specific instructions for refinement process"
                            },
                            "target_status": {
                                "type": "string",
                                "enum": ["REFINING", "VALIDATED"],
                                "default": "REFINING",
                                "description": "Target status after refinement"
                            },
                            "validation_criteria": {
                                "type": "object",
                                "properties": {
                                    "min_completeness": {"type": "number", "minimum": 0.0, "maximum": 1.0},
                                    "min_coherence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
                                    "required_cross_links": {"type": "integer", "minimum": 0}
                                },
                                "description": "Criteria for successful refinement"
                            }
                        },
                        "required": ["qu_id"]
                    }
                )
            ]
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict) -> list[TextContent | ImageContent | EmbeddedResource]:
            """Handle tool execution requests."""
            try:
                if name == "create_episode":
                    return await self._handle_create_episode(arguments)
                elif name == "search_episodes":
                    return await self._handle_search_episodes(arguments)
                elif name == "get_session_continuity":
                    return await self._handle_get_session_continuity(arguments)
                elif name == "get_agent_ruminations":
                    return await self._handle_get_agent_ruminations(arguments)
                elif name == "create_community":
                    return await self._handle_create_community(arguments)
                elif name == "create_quaternal_unit":
                    return await self._handle_create_quaternal_unit(arguments)
                elif name == "update_quaternal_unit":
                    return await self._handle_update_quaternal_unit(arguments)
                elif name == "find_quaternal_units":
                    return await self._handle_find_quaternal_units(arguments)
                elif name == "refine_quaternal_unit":
                    return await self._handle_refine_quaternal_unit(arguments)
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
            """List available episodic memory resources."""
            return [
                Resource(
                    uri="episodic://schema",
                    name="Episodic Memory Schema",
                    description="Schema definition for episodic memory data structures",
                    mimeType="application/json"
                ),
                Resource(
                    uri="episodic://stats",
                    name="Episodic Memory Statistics",
                    description="Usage statistics and metrics for episodic memory service",
                    mimeType="application/json"
                )
            ]
        
        @self.server.get_resource()
        async def handle_get_resource(uri: str) -> str:
            """Handle resource retrieval requests."""
            if uri == "episodic://schema":
                return self._get_schema_resource()
            elif uri == "episodic://stats":
                return await self._get_stats_resource()
            else:
                raise ValueError(f"Unknown resource URI: {uri}")
    
    async def _handle_create_episode(self, arguments: dict) -> list[TextContent]:
        """Handle episode creation tool call."""
        try:
            # Convert episode_type string to enum
            episode_type = EpisodeType(arguments["episode_type"])
            
            request = EpisodeRequest(
                group_id=arguments["group_id"],
                episode_type=episode_type,
                content=arguments["content"],
                context=arguments.get("context", {}),
                user_id=arguments.get("user_id"),
                session_id=arguments.get("session_id"),
                agent_id=arguments.get("agent_id")
            )
            
            response = await self.graphiti_service.create_episode(request)
            
            if response.success:
                return [TextContent(
                    type="text",
                    text=f"Successfully created episode: {response.episode.id}\n"
                         f"Type: {response.episode.episode_type.value}\n"
                         f"Content: {response.episode.content[:100]}...\n"
                         f"Occurred at: {response.episode.occurred_at.isoformat()}"
                )]
            else:
                return [TextContent(
                    type="text",
                    text=f"Failed to create episode: {response.message}"
                )]
                
        except Exception as e:
            return [TextContent(
                type="text",
                text=f"Error creating episode: {str(e)}"
            )]
    
    async def _handle_search_episodes(self, arguments: dict) -> list[TextContent]:
        """Handle episode search tool call."""
        try:
            # Convert episode_types if provided
            episode_types = None
            if "episode_types" in arguments:
                episode_types = [EpisodeType(t) for t in arguments["episode_types"]]
            
            request = SearchRequest(
                group_id=arguments["group_id"],
                query=arguments.get("query"),
                episode_types=episode_types,
                user_id=arguments.get("user_id"),
                session_id=arguments.get("session_id"),
                agent_id=arguments.get("agent_id"),
                limit=arguments.get("limit", 10)
            )
            
            response = await self.graphiti_service.search_episodes(request)
            
            if response.success:
                if not response.episodes:
                    return [TextContent(
                        type="text",
                        text="No episodes found matching the search criteria."
                    )]
                
                results = []
                for episode in response.episodes:
                    results.append(
                        f"Episode ID: {episode.id}\n"
                        f"Type: {episode.episode_type.value}\n"
                        f"Content: {episode.content[:200]}...\n"
                        f"Occurred: {episode.occurred_at.isoformat()}\n"
                        f"User: {episode.user_id or 'N/A'}\n"
                        f"Session: {episode.session_id or 'N/A'}\n"
                        f"Agent: {episode.agent_id or 'N/A'}\n"
                    )
                
                return [TextContent(
                    type="text",
                    text=f"Found {len(response.episodes)} episodes:\n\n" + "\n---\n".join(results)
                )]
            else:
                return [TextContent(
                    type="text",
                    text=f"Search failed: {response.message}"
                )]
                
        except Exception as e:
            return [TextContent(
                type="text",
                text=f"Error searching episodes: {str(e)}"
            )]
    
    async def _handle_get_session_continuity(self, arguments: dict) -> list[TextContent]:
        """Handle session continuity tool call."""
        try:
            episodes = await self.graphiti_service.get_session_continuity(
                arguments["group_id"],
                arguments["session_id"]
            )
            
            if not episodes:
                return [TextContent(
                    type="text",
                    text=f"No episodes found for session {arguments['session_id']}"
                )]
            
            results = []
            for episode in episodes:
                results.append(
                    f"[{episode.occurred_at.isoformat()}] {episode.episode_type.value}: {episode.content[:150]}..."
                )
            
            return [TextContent(
                type="text",
                text=f"Session {arguments['session_id']} continuity ({len(episodes)} episodes):\n\n" + 
                     "\n".join(results)
            )]
            
        except Exception as e:
            return [TextContent(
                type="text",
                text=f"Error getting session continuity: {str(e)}"
            )]
    
    async def _handle_get_agent_ruminations(self, arguments: dict) -> list[TextContent]:
        """Handle agent ruminations tool call."""
        try:
            episodes = await self.graphiti_service.get_agent_ruminations(
                arguments["group_id"],
                arguments["agent_id"],
                arguments.get("limit", 10)
            )
            
            if not episodes:
                return [TextContent(
                    type="text",
                    text=f"No ruminations found for agent {arguments['agent_id']}"
                )]
            
            results = []
            for episode in episodes:
                results.append(
                    f"[{episode.occurred_at.isoformat()}] {episode.content[:200]}..."
                )
            
            return [TextContent(
                type="text",
                text=f"Agent {arguments['agent_id']} ruminations ({len(episodes)} entries):\n\n" + 
                     "\n".join(results)
            )]
            
        except Exception as e:
            return [TextContent(
                type="text",
                text=f"Error getting agent ruminations: {str(e)}"
            )]
    
    async def _handle_create_community(self, arguments: dict) -> list[TextContent]:
        """Handle community creation tool call."""
        try:
            request = CommunityRequest(
                group_id=arguments["group_id"],
                name=arguments["name"],
                episode_ids=arguments.get("episode_ids", []),
                quaternary_position=arguments.get("quaternary_position"),
                context_frame_type=arguments.get("context_frame_type")
            )
            
            response = await self.graphiti_service.create_community(request)
            
            if response.success:
                return [TextContent(
                    type="text",
                    text=f"Successfully created community: {response.community.id}\n"
                         f"Name: {response.community.name}\n"
                         f"Episodes: {len(response.community.episode_ids)}\n"
                         f"QL Position: {response.community.quaternary_position or 'N/A'}\n"
                         f"Context Frame: {response.community.context_frame_type or 'N/A'}\n"
                         f"Formed: {response.community.formed_at.isoformat()}"
                )]
            else:
                return [TextContent(
                    type="text",
                    text=f"Failed to create community: {response.message}"
                )]
                
        except Exception as e:
            return [TextContent(
                type="text",
                text=f"Error creating community: {str(e)}"
            )]
    
    # QuaternalUnit MCP Tool Handlers
    
    async def _handle_create_quaternal_unit(self, arguments: dict) -> list[TextContent]:
        """Create a new QuaternalUnit with QL structure."""
        try:
            # Validate required arguments
            group_id = arguments.get("group_id")
            if not group_id:
                return [TextContent(
                    type="text", 
                    text="Error: group_id is required"
                )]
            
            quaternal_type_str = arguments.get("quaternal_type", "FOUR_PART")
            bimba_coordinate = arguments.get("bimba_coordinate")
            summary = arguments.get("summary")
            
            if not bimba_coordinate or not summary:
                return [TextContent(
                    type="text",
                    text="Error: bimba_coordinate and summary are required"
                )]
            
            # Convert string to enum
            from .models import QuaternalType
            try:
                quaternal_type = QuaternalType(quaternal_type_str)
            except ValueError:
                return [TextContent(
                    type="text",
                    text=f"Error: Invalid quaternal_type '{quaternal_type_str}'"
                )]
            
            # Parse optional entities
            entities = []
            if arguments.get("entities"):
                from .models import QuaternalEntity
                for entity_data in arguments["entities"]:
                    entities.append(QuaternalEntity(
                        name=entity_data["name"],
                        ql_position=entity_data["ql_position"],
                        summary=entity_data.get("summary"),
                        entity_id=entity_data.get("entity_id"),
                        confidence=entity_data.get("confidence", 1.0)
                    ))
            
            # Parse optional source references
            source_refs = []
            if arguments.get("source_references"):
                from .models import SourceReference
                for sr_data in arguments["source_references"]:
                    source_refs.append(SourceReference(
                        source_type=sr_data["source_type"],
                        source_id=sr_data["source_id"],
                        confidence=sr_data.get("confidence", 1.0),
                        excerpt=sr_data.get("excerpt")
                    ))
            
            workspace_id = arguments.get("workspace_id", "default")
            
            # Create QuaternalUnit via service
            qu = await self.graphiti_service.create_quaternal_unit(
                group_id=group_id,
                quaternal_type=quaternal_type,
                bimba_coordinate=bimba_coordinate,
                summary=summary,
                entities=entities,
                source_references=source_refs,
                workspace_id=workspace_id
            )
            
            if qu:
                return [TextContent(
                    type="text",
                    text=f"Successfully created QuaternalUnit: {qu.id}\nType: {qu.quaternal_type.value}\nCoordinate: {qu.bimba_coordinate}\nStatus: {qu.status.value}\nSummary: {qu.summary}"
                )]
            else:
                return [TextContent(
                    type="text",
                    text="Failed to create QuaternalUnit"
                )]
                
        except Exception as e:
            return [TextContent(
                type="text",
                text=f"Error creating QuaternalUnit: {str(e)}"
            )]
    
    async def _handle_update_quaternal_unit(self, arguments: dict) -> list[TextContent]:
        """Update an existing QuaternalUnit."""
        try:
            group_id = arguments.get("group_id")
            qu_id = arguments.get("qu_id")
            
            if not group_id or not qu_id:
                return [TextContent(
                    type="text",
                    text="Error: group_id and qu_id are required"
                )]
            
            # Parse optional update fields
            summary = arguments.get("summary")
            status = arguments.get("status")
            confidence_score = arguments.get("confidence_score")
            
            # Parse entities if provided
            entities = None
            if "entities" in arguments:
                from .models import QuaternalEntity
                entities = []
                for entity_data in arguments["entities"]:
                    entities.append(QuaternalEntity(
                        name=entity_data["name"],
                        ql_position=entity_data["ql_position"],
                        summary=entity_data.get("summary"),
                        entity_id=entity_data.get("entity_id"),
                        confidence=entity_data.get("confidence", 1.0)
                    ))
            
            # Convert status string to enum if provided
            status_enum = None
            if status:
                from .models import QuaternalStatus
                try:
                    status_enum = QuaternalStatus(status)
                except ValueError:
                    return [TextContent(
                        type="text",
                        text=f"Error: Invalid status '{status}'"
                    )]
            
            # Update via service
            updated_qu = await self.graphiti_service.update_quaternal_unit(
                group_id=group_id,
                qu_id=qu_id,
                summary=summary,
                entities=entities,
                status=status_enum,
                confidence_score=confidence_score
            )
            
            if updated_qu:
                return [TextContent(
                    type="text",
                    text=f"Successfully updated QuaternalUnit: {updated_qu.id}\nStatus: {updated_qu.status.value}\nSummary: {updated_qu.summary}\nConfidence: {updated_qu.confidence_score}"
                )]
            else:
                return [TextContent(
                    type="text",
                    text=f"Failed to update QuaternalUnit {qu_id}"
                )]
                
        except Exception as e:
            return [TextContent(
                type="text",
                text=f"Error updating QuaternalUnit: {str(e)}"
            )]
    
    async def _handle_find_quaternal_units(self, arguments: dict) -> list[TextContent]:
        """Find QuaternalUnits with filtering options."""
        try:
            group_id = arguments.get("group_id")
            if not group_id:
                return [TextContent(
                    type="text",
                    text="Error: group_id is required"
                )]
            
            # Parse filter arguments
            workspace_id = arguments.get("workspace_id", "default")
            quaternal_type = arguments.get("quaternal_type")
            status = arguments.get("status")
            bimba_coordinate = arguments.get("bimba_coordinate")
            min_confidence = arguments.get("min_confidence")
            min_completeness = arguments.get("min_completeness")
            limit = arguments.get("limit", 10)
            
            # Convert string enums if provided
            quaternal_type_enum = None
            if quaternal_type:
                from .models import QuaternalType
                try:
                    quaternal_type_enum = QuaternalType(quaternal_type)
                except ValueError:
                    return [TextContent(
                        type="text",
                        text=f"Error: Invalid quaternal_type '{quaternal_type}'"
                    )]
            
            status_enum = None
            if status:
                from .models import QuaternalStatus
                try:
                    status_enum = QuaternalStatus(status)
                except ValueError:
                    return [TextContent(
                        type="text",
                        text=f"Error: Invalid status '{status}'"
                    )]
            
            # Search via service
            results = await self.graphiti_service.find_quaternal_units(
                group_id=group_id,
                workspace_id=workspace_id,
                quaternal_type=quaternal_type_enum,
                status=status_enum,
                bimba_coordinate=bimba_coordinate,
                min_confidence=min_confidence,
                min_completeness=min_completeness,
                limit=limit
            )
            
            if results:
                result_text = f"Found {len(results)} QuaternalUnits:\n\n"
                for qu in results:
                    result_text += f"ID: {qu.id}\n"
                    result_text += f"Type: {qu.quaternal_type.value}\n"
                    result_text += f"Status: {qu.status.value}\n"
                    result_text += f"Coordinate: {qu.bimba_coordinate}\n"
                    result_text += f"Summary: {qu.summary}\n"
                    result_text += f"Entities: {len(qu.entities)}\n"
                    result_text += f"Cross-links: {len(qu.cross_coordinate_links)}\n"
                    result_text += f"Confidence: {qu.confidence_score:.2f}\n"
                    result_text += f"Updated: {qu.updated_at.isoformat()}\n\n"
                
                return [TextContent(
                    type="text",
                    text=result_text.strip()
                )]
            else:
                return [TextContent(
                    type="text",
                    text="No QuaternalUnits found matching the criteria"
                )]
                
        except Exception as e:
            return [TextContent(
                type="text",
                text=f"Error finding QuaternalUnits: {str(e)}"
            )]
    
    async def _handle_refine_quaternal_unit(self, arguments: dict) -> list[TextContent]:
        """Refine a QuaternalUnit through lifecycle progression."""
        try:
            qu_id = arguments.get("qu_id")
            if not qu_id:
                return [TextContent(
                    type="text",
                    text="Error: qu_id is required"
                )]
            
            # Get group_id by finding the QuaternalUnit first
            # This is a simplified approach - in production, group_id should be provided
            refinement_instructions = arguments.get("refinement_instructions", "")
            target_status = arguments.get("target_status", "REFINING")
            validation_criteria = arguments.get("validation_criteria", {})
            
            # Convert target status to enum
            from .models import QuaternalStatus
            try:
                target_status_enum = QuaternalStatus(target_status)
            except ValueError:
                return [TextContent(
                    type="text",
                    text=f"Error: Invalid target_status '{target_status}'"
                )]
            
            # For now, we'll need group_id - this is a limitation of the current API design
            # In a real implementation, we might look up the QuaternalUnit first
            group_id = arguments.get("group_id")  # Should be added to the refinement schema
            if not group_id:
                return [TextContent(
                    type="text",
                    text="Error: group_id is required for refinement"
                )]
            
            # Get current QuaternalUnit
            current_qu = await self.graphiti_service.get_quaternal_unit(group_id, qu_id)
            if not current_qu:
                return [TextContent(
                    type="text",
                    text=f"QuaternalUnit {qu_id} not found"
                )]
            
            # Apply validation criteria if moving to VALIDATED
            if target_status_enum == QuaternalStatus.VALIDATED:
                min_completeness = validation_criteria.get("min_completeness", 0.7)
                min_coherence = validation_criteria.get("min_coherence", 0.6)
                required_cross_links = validation_criteria.get("required_cross_links", 0)
                
                # Check validation criteria
                if current_qu.completeness_score < min_completeness:
                    return [TextContent(
                        type="text",
                        text=f"Validation failed: Completeness score {current_qu.completeness_score:.2f} below required {min_completeness:.2f}"
                    )]
                
                if current_qu.coherence_score < min_coherence:
                    return [TextContent(
                        type="text",
                        text=f"Validation failed: Coherence score {current_qu.coherence_score:.2f} below required {min_coherence:.2f}"
                    )]
                
                if len(current_qu.cross_coordinate_links) < required_cross_links:
                    return [TextContent(
                        type="text",
                        text=f"Validation failed: {len(current_qu.cross_coordinate_links)} cross-links below required {required_cross_links}"
                    )]
            
            # Update status and confidence based on refinement
            new_confidence = current_qu.confidence_score
            if target_status_enum == QuaternalStatus.VALIDATED:
                new_confidence = min(1.0, new_confidence + 0.2)
            elif target_status_enum == QuaternalStatus.REFINING:
                new_confidence = min(1.0, new_confidence + 0.1)
            
            # Append refinement instructions to summary if provided
            new_summary = current_qu.summary
            if refinement_instructions:
                new_summary += f" [Refined: {refinement_instructions}]"
            
            # Update the QuaternalUnit
            updated_qu = await self.graphiti_service.update_quaternal_unit(
                group_id=group_id,
                qu_id=qu_id,
                summary=new_summary,
                status=target_status_enum,
                confidence_score=new_confidence
            )
            
            if updated_qu:
                return [TextContent(
                    type="text",
                    text=f"Successfully refined QuaternalUnit: {updated_qu.id}\nStatus: {current_qu.status.value} → {updated_qu.status.value}\nConfidence: {current_qu.confidence_score:.2f} → {updated_qu.confidence_score:.2f}\nInstructions: {refinement_instructions}"
                )]
            else:
                return [TextContent(
                    type="text",
                    text=f"Failed to refine QuaternalUnit {qu_id}"
                )]
                
        except Exception as e:
            return [TextContent(
                type="text",
                text=f"Error refining QuaternalUnit: {str(e)}"
            )]
    
    def _get_schema_resource(self) -> str:
        """Get episodic memory schema resource."""
        schema = {
            "episode_types": [t.value for t in EpisodeType],
            "required_fields": ["group_id", "episode_type", "content"],
            "optional_fields": ["context", "user_id", "session_id", "agent_id"],
            "bi_temporal_tracking": {
                "occurred_at": "When the event actually happened",
                "ingested_at": "When the system recorded the event"
            },
            "quaternary_logic_positions": [0, 1, 2, 3, 4, 5],
            "context_frame_types": ["user_interaction", "agent_reasoning", "system_event"]
        }
        return str(schema)
    
    async def _get_stats_resource(self) -> str:
        """Get episodic memory service statistics."""
        try:
            # Get basic statistics from Neo4j
            query = """
            MATCH (ep:Episode:Graphiti)
            RETURN 
                count(ep) as total_episodes,
                collect(DISTINCT ep.episode_type) as episode_types,
                collect(DISTINCT ep.group_id) as groups,
                min(ep.occurred_at) as earliest_episode,
                max(ep.occurred_at) as latest_episode
            """
            
            records, _, _ = await self.neo4j_client.execute_query(query, {})
            
            if records:
                stats = dict(records[0])
                return str({
                    "total_episodes": stats.get("total_episodes", 0),
                    "episode_types": stats.get("episode_types", []),
                    "active_groups": len(stats.get("groups", [])),
                    "earliest_episode": stats.get("earliest_episode"),
                    "latest_episode": stats.get("latest_episode"),
                    "workspace_id": self.graphiti_service.workspace_id
                })
            else:
                return str({"total_episodes": 0, "message": "No episodes found"})
                
        except Exception as e:
            return str({"error": f"Failed to get stats: {str(e)}"})
    
    async def serve_stdio(self):
        """Start the MCP server with stdio transport."""
        from mcp.server.stdio import stdio_server
        
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="graphiti-episodic-memory",
                    server_version="1.0.0",
                    capabilities=self.server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={}
                    )
                )
            )
    
    async def close(self):
        """Close the MCP server and Graphiti service."""
        await self.graphiti_service.close()
        logger.info("Graphiti MCP server closed")


# Entry point for running as a standalone MCP server
async def main():
    """Main entry point for standalone MCP server."""
    import os
    from shared.database import Neo4jClient
    
    # Initialize Neo4j client from environment
    neo4j_client = Neo4jClient()
    
    # Test connection
    if not neo4j_client.test_connection():
        logger.error("Failed to connect to Neo4j. Check configuration.")
        return
    
    # Create and start MCP server
    server = GraphitiMCPServer(neo4j_client)
    
    try:
        await server.serve_stdio()
    except KeyboardInterrupt:
        logger.info("Shutting down MCP server...")
    finally:
        await server.close()


if __name__ == "__main__":
    # Run as standalone MCP server
    asyncio.run(main())