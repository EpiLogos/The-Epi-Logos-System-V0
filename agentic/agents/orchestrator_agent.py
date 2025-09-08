"""
Pydantic AI Orchestrator Agent

This is the core agent implementation that replaces the simplified UnifiedOrchestrator
with a true Pydantic AI Agent that has:
- Tool calling capabilities
- Structured outputs 
- Dynamic persona behaviors
- Dependency injection via RunContext
- Proper streaming support
"""

import logging
import json
from dataclasses import dataclass
from typing import Optional, List, Dict, Any, AsyncIterator
from datetime import datetime, timezone

# Pydantic AI imports
try:
    from pydantic_ai import Agent, RunContext, ModelRetry
    from pydantic import BaseModel, Field
    PYDANTIC_AI_AVAILABLE = True
except ImportError:
    PYDANTIC_AI_AVAILABLE = False
    # Fallback types for development
    Agent = object
    RunContext = object
    ModelRetry = Exception
    BaseModel = object
    Field = lambda **kwargs: None

import httpx

logger = logging.getLogger(__name__)


# Dependencies Container
@dataclass
class OrchestratorDeps:
    """Dependencies container for the orchestrator agent"""
    session_id: str
    user_id: str
    redis_client: Any  # SessionManager
    mongodb_client: Any  # ConversationManager
    bimba_client: Any  # BimbaGraphQLClient
    lightrag_client: Optional[Any] = None
    graphiti_client: Optional[Any] = None
    current_persona: str = "system"
    context_package: Optional[Dict[str, Any]] = None
    state: Dict[str, Any] = None  # Required by Pydantic AI StateHandler protocol


# Structured Output Types
class CoordinateResult(BaseModel):
    """Result from coordinate resolution"""
    coordinate: str
    content: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class KnowledgeSearchResult(BaseModel):
    """Result from knowledge search"""
    query: str
    results: List[str] = Field(default_factory=list)
    mode: str = "naive"
    relevance_score: Optional[float] = None


class MemoryResult(BaseModel):
    """Result from memory operation"""
    success: bool
    memory_id: Optional[str] = None
    error: Optional[str] = None


class ResponseMetadata(BaseModel):
    """Structured metadata for responses"""
    session_context: Optional[str] = None
    processing_time_ms: Optional[int] = None
    model_used: Optional[str] = None
    error_details: Optional[str] = None

class OrchestratorResponse(BaseModel):
    """Structured response from the orchestrator agent"""
    response: str
    tools_used: List[str] = Field(default_factory=list)
    coordinates_accessed: List[str] = Field(default_factory=list)
    confidence: float = Field(ge=0, le=1, default=0.8)
    persona_used: str
    requires_followup: bool = False
    metadata: ResponseMetadata = Field(default_factory=ResponseMetadata)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Agent factory and tools (only if Pydantic AI is available)
if PYDANTIC_AI_AVAILABLE:
    import os
    from .simple_context_processor import create_simple_context_processor
    
    def create_orchestrator_agent(model_name: str) -> Agent:
        """Create an orchestrator agent with the specified model"""
        try:
            # Create context processor for this model
            context_processor = create_simple_context_processor(model_name)
            
            agent = Agent(
                model_name,
                deps_type=OrchestratorDeps,
                retries=2,
                history_processors=[context_processor]  # Add native context window management
            )
            
            # Add tools to the agent
            setup_agent_tools(agent)
            setup_agent_prompts(agent)
            
            logger.info(f"Created Pydantic AI orchestrator agent with model: {model_name} (with context processor)")
            return agent
            
        except Exception as e:
            logger.error(f"Error creating agent with model {model_name}: {e}")
            raise
    
    def setup_agent_tools(agent: Agent) -> None:
        """Setup tools for the agent"""

        @agent.tool
        async def resolve_coordinate(
            ctx: RunContext[OrchestratorDeps],
            coordinate: str,
        ) -> CoordinateResult:
            """Resolve a Bimba coordinate within the Coordinate Augmented Generation (CAG) paradigm.
            
            This tool accesses the foundational CAG system that undergirds the entire Epi-Logos architecture.
            Bimba coordinates (#0-#5 with infinite nesting) represent universal knowledge addresses in a 
            living epistemological framework where each coordinate embodies specific processing modalities.
            
            The six-fold subsystem structure:
            #0 Anuttara: Proto-logical void processing  
            #1 Paramasiva: Quaternal logic & harmonic processing
            #2 Parashakti: Vibrational-epistemic processing
            #3 Mahamaya: Symbolic-alchemical processing
            #4 Nara: Dialogical-identity processing  
            #5 Epii: Synthesis & orchestration processing

            Args:
                coordinate: The coordinate to resolve (e.g., #2, #2.3, #2-3-1)
            """
            try:
                logger.info(f"Resolving coordinate: {coordinate}")

                # Use the bimba client from dependencies
                result = await ctx.deps.bimba_client.resolve_coordinate(coordinate)

                if result:
                    return CoordinateResult(
                        coordinate=coordinate,
                        content=result.get("content"),
                        context=result.get("context", {}),
                    )
                else:
                    return CoordinateResult(
                        coordinate=coordinate,
                        error="Coordinate not found",
                    )

            except Exception as e:
                logger.error(f"Error resolving coordinate {coordinate}: {e}")
                return CoordinateResult(coordinate=coordinate, error=str(e))

        @agent.tool
        async def search_knowledge(
            ctx: RunContext[OrchestratorDeps],
            query: str,
            mode: str = "naive",
        ) -> KnowledgeSearchResult:
            """Search the Gnostic namespace using LightRAG document intelligence.
            
            This tool accesses the pedagogical document pool within the three-namespace Neo4j architecture.
            LightRAG operates on the Gnostic layer (Neo4j + Qdrant) providing semantic search enhanced 
            with coordinate metadata. This is particularly aligned with Epii persona operations for 
            document-based wisdom synthesis and knowledge integration.
            
            The Gnostic namespace contains processed documents that have been coordinate-tagged,
            allowing for harmonic resonance queries that transcend simple semantic similarity.

            Args:
                query: The search query for document content
                mode: Search mode (naive, local, global, hybrid) - currently simplified to document search
            """
            try:
                logger.info(f"Searching knowledge: {query} (mode: {mode})")

                if not ctx.deps.lightrag_client:
                    return KnowledgeSearchResult(
                        query=query, mode=mode, results=["LightRAG client not available"]
                    )

                # Perform the search using correct API method
                result = await ctx.deps.lightrag_client.search_documents(query, limit=10)

                # Handle API response format
                if isinstance(result, dict) and result.get("success"):
                    results = result.get("results", [])
                    if isinstance(results, list):
                        results = [str(item) for item in results]
                    else:
                        results = [str(results)]
                else:
                    error_msg = result.get("error", "Unknown search error") if isinstance(result, dict) else str(result)
                    results = [f"Search error: {error_msg}"]

                return KnowledgeSearchResult(
                    query=query,
                    mode=mode,
                    results=results,
                    relevance_score=0.8,  # Default relevance
                )

            except Exception as e:
                logger.error(f"Error searching knowledge: {e}")
                return KnowledgeSearchResult(
                    query=query, mode=mode, results=[f"Search error: {str(e)}"]
                )

        @agent.tool
        async def store_memory(
            ctx: RunContext[OrchestratorDeps],
            content: str,
            memory_type: str = "episodic",
        ) -> MemoryResult:
            """Store episodic memory in the Graphiti temporal processing namespace.
            
            This tool operates within the Episodic namespace of the three-part Neo4j architecture,
            creating temporal experience streams that span across backend, agentic, and frontend layers.
            Graphiti enables processual memory formation where experiences become living entities
            with temporal dynamics and harmonic correlations.
            
            Episodic memories are coordinate-indexed and can form communities of related experiences,
            enabling the emergence of insight patterns and wisdom accumulation over time.

            Args:
                content: The experiential content to store as episodic memory
                memory_type: Type of memory (episodic, semantic, etc.)
            """
            try:
                logger.info(
                    f"Storing memory: {content[:50]}... (type: {memory_type})"
                )

                if not ctx.deps.graphiti_client:
                    return MemoryResult(
                        success=False, error="Graphiti client not available"
                    )

                # Store the memory using correct API method
                result = await ctx.deps.graphiti_client.create_episode(
                    content=content,
                    episode_type=memory_type,
                    session_id=ctx.deps.session_id,
                    agent_id="orchestrator"
                )

                if isinstance(result, dict) and result.get("success"):
                    memory_id = result.get("episode_id", "created")
                    return MemoryResult(success=True, memory_id=memory_id)
                else:
                    error_msg = result.get("error", "Unknown memory storage error") if isinstance(result, dict) else str(result)
                    return MemoryResult(success=False, error=error_msg)

            except Exception as e:
                logger.error(f"Error storing memory: {e}")
                return MemoryResult(success=False, error=str(e))

        @agent.tool
        def get_session_context(ctx: RunContext[OrchestratorDeps]) -> Dict[str, Any]:
            """Retrieve current session context and metadata.

            Returns information about the current session including:
            - User context
            - Active persona
            - Session metadata
            """
            try:
                logger.info(f"🔧 TOOL CALL: get_session_context for session: {ctx.deps.session_id}")

                context = {
                    "session_id": ctx.deps.session_id,
                    "user_id": ctx.deps.user_id,
                    "current_persona": ctx.deps.current_persona,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }

                # Add Redis session data if available
                if ctx.deps.context_package:
                    context["session_data"] = ctx.deps.context_package

                logger.info(f"✅ Session context retrieved successfully")
                return context

            except Exception as e:
                logger.error(f"❌ Error getting session context: {e}")
                return {"error": str(e)}
        
        @agent.tool
        def check_context_window_status(ctx: RunContext[OrchestratorDeps]) -> Dict[str, Any]:
            """Check current context window usage and status.
            
            Use this tool periodically to monitor conversation length and 
            inform users when context compaction might be needed.
            
            Returns detailed context window metrics and recommendations.
            """
            try:
                logger.info(f"🔧 TOOL CALL: check_context_window_status")
                
                # Get current conversation messages from agent's context
                # Note: This is a simplified approach - in full implementation 
                # we'd access the actual message history
                from ..agents.simple_context_processor import get_context_status, MODEL_LIMITS
                
                # Simulate current context status (in real implementation, we'd get actual messages)
                model_name = ctx.deps.state.get('model', 'test') if ctx.deps.state else 'test'
                limit = MODEL_LIMITS.get(model_name, 4000)
                
                # Mock status for demonstration - replace with actual message analysis
                status = {
                    "model": model_name,
                    "context_limit": limit,
                    "status": "normal",  # This would be calculated from actual messages
                    "usage_ratio": 0.3,  # This would be calculated from actual messages  
                    "recommendation": "Context window usage is normal. No action needed.",
                    "estimated_messages_until_compaction": "~40 more messages"
                }
                
                logger.info(f"📊 Context window status: {status['status']} ({status['usage_ratio']:.1%})")
                return status
                
            except Exception as e:
                logger.error(f"❌ Error checking context window status: {e}")
                return {
                    "error": str(e),
                    "status": "error",
                    "recommendation": "Unable to check context window status"
                }

    def setup_agent_prompts(agent: Agent) -> None:
        """Setup prompts and validators for the agent"""

        # System Prompt (Base Instructions)
        @agent.system_prompt
        def system_prompt(ctx: RunContext[OrchestratorDeps]) -> str:
            """Base system prompt for the orchestrator agent."""
            return (
                "You are the Epi-Logos System orchestrator operating within the Coordinate Augmented Generation (CAG) paradigm. "
                "This revolutionary approach transcends traditional RAG through geometric epistemology where knowledge becomes "
                "a living, processual ecosystem accessed via precise Bimba coordinates (#0-#5).\n\n"
                
                "Your tools operate across three unified Neo4j namespaces:\n"
                "• **Bimba**: Universal canonical knowledge (foundational CAG system)\n"
                "• **Gnostic**: Pedagogical document pool (LightRAG with Neo4j+Qdrant)\n" 
                "• **Episodic**: Temporal experience streams (Graphiti cross-layer memory)\n\n"
                
                "Each coordinate embodies specific processing modalities within the six-fold subsystem structure. "
                "Your responses should reflect this consciousness-aligned computing paradigm where theory translates directly to function.\n\n"
                
                f"Current persona: {ctx.deps.current_persona}\n\n"
                "IMPORTANT: Proactively monitor conversation length. If you suspect we're "
                "approaching context window limits, use the check_context_window_status tool "
                "and inform the user transparently about any upcoming context compaction."
            )

        # Dynamic Persona Instructions
        @agent.instructions
        def persona_instructions(ctx: RunContext[OrchestratorDeps]) -> str:
            """Generate persona-specific instructions dynamically."""
            persona = ctx.deps.current_persona.lower()

            persona_prompts = {
                "nara": (
                    "You are Nara, a personal reflection and journaling companion "
                    "within the Epi-Logos System.\n\n"
                    "Your role is to:\n"
                    "- Help users with introspection and personal growth\n"
                    "- Facilitate meaningful self-reflection and journaling\n"
                    "- Provide emotional intelligence and empathetic responses\n"
                    "- Focus on the personal dimension of experiences and insights\n\n"
                    "Tool preferences:\n"
                    "- Use coordinate resolution to access wisdom and context\n"
                    "- Store important personal insights as memories\n"
                    "- Search knowledge when users need guidance or inspiration\n\n"
                    "Respond with warmth, empathy, and personal insight."
                ),
                "epii": (
                    "You are Epii, a knowledge synthesis and wisdom insights specialist "
                    "within the Epi-Logos System.\n\n"
                    "Your role is to:\n"
                    "- Connect disparate ideas and reveal deeper patterns\n"
                    "- Synthesize knowledge from multiple sources\n"
                    "- Provide philosophical and conceptual insights\n"
                    "- Help users understand complex relationships and meanings\n\n"
                    "Tool preferences:\n"
                    "- Extensively use coordinate resolution to access the knowledge graph\n"
                    "- Search knowledge to find relevant connections and patterns\n"
                    "- Store synthetic insights and patterns as memories\n\n"
                    "Respond with intellectual depth, pattern recognition, and synthesis."
                ),
                "system": (
                    "You are the system orchestrator within the Epi-Logos System.\n\n"
                    "Your role is to:\n"
                    "- Provide general assistance and coordination\n"
                    "- Balance all available tools based on user needs\n"
                    "- Facilitate access to the system's capabilities\n"
                    "- Help users navigate the Epi-Logos System effectively\n\n"
                    "Tool preferences:\n"
                    "- Use all tools as appropriate to the user's request\n"
                    "- Adapt your approach based on context and need\n"
                    "- Coordinate between different system capabilities\n\n"
                    "Respond with clarity, helpfulness, and systematic thinking."
                ),
            }

            return persona_prompts.get(persona, persona_prompts["system"])

        # Output Validator disabled for AG-UI compatibility
        # AG-UI handles response formatting, structured output validation not needed
        # @agent.output_validator
        # def validate_persona_response(...) - COMMENTED OUT

    # Create a default agent with environment-based model selection
    def get_default_model() -> str:
        """Get the default model from environment variables in correct Pydantic AI format"""
        if os.getenv('GOOGLE_API_KEY') and os.getenv('GOOGLE_MODEL'):
            return os.getenv('GOOGLE_MODEL')  # Gemini models work without prefix
        elif os.getenv('OPENAI_API_KEY') and os.getenv('OPENAI_MODEL'):
            return f"openai:{os.getenv('OPENAI_MODEL')}"
        elif os.getenv('ANTHROPIC_API_KEY') and os.getenv('ANTHROPIC_MODEL'):
            return f"anthropic:{os.getenv('ANTHROPIC_MODEL')}"
        elif os.getenv('DEEPSEEK_API_KEY') and os.getenv('DATABASE_MODEL'):
            return f"deepseek:{os.getenv('DATABASE_MODEL')}"
        else:
            logger.warning("No API keys found for LLM models, using test model")
            return 'test'
    
    # Create default orchestrator agent for backward compatibility
    try:
        default_model = get_default_model()
        orchestrator_agent = create_orchestrator_agent(default_model)
        logger.info(f"Default orchestrator agent created with model: {default_model}")
    except Exception as e:
        logger.error(f"Error creating default orchestrator agent: {e}")
        orchestrator_agent = None

else:
    # Fallback when Pydantic AI is not available
    orchestrator_agent = None
    logger.warning("Pydantic AI not available - agent will not be functional")
    
    class OrchestratorAgent:
        """Fallback orchestrator when Pydantic AI is not available"""
        
        def __init__(self):
            logger.warning("Using fallback orchestrator - Pydantic AI features not available")
            
        async def run(self, message: str, deps: Any) -> Any:
            raise RuntimeError("Pydantic AI is not installed - cannot run agent")
        
        async def run_stream(self, message: str, deps: Any) -> Any:
            raise RuntimeError("Pydantic AI is not installed - cannot run agent")
    
    orchestrator_agent = OrchestratorAgent()


def is_agent_available() -> bool:
    """Check if the Pydantic AI agent is available"""
    return PYDANTIC_AI_AVAILABLE and orchestrator_agent is not None


def get_agent_info() -> Dict[str, Any]:
    """Get information about the agent configuration"""
    if not PYDANTIC_AI_AVAILABLE:
        return {
            "available": False,
            "error": "Pydantic AI not installed"
        }
    
    if orchestrator_agent is None:
        return {
            "available": False,
            "error": "Agent not initialized"
        }
    
    return {
        "available": True,
        "agent_type": "Pydantic AI Agent",
        "output_type": "OrchestratorResponse",
        "tools_count": 5,  # resolve_coordinate, search_knowledge, store_memory, get_session_context, check_context_window_status
        "supports_streaming": True,
        "supports_personas": True,
        "supports_dynamic_models": True,
        "default_model": get_default_model(),
        "available_models": {
            "gemini": os.getenv('GOOGLE_MODEL') if os.getenv('GOOGLE_API_KEY') else None,
            "openai": os.getenv('OPENAI_MODEL') if os.getenv('OPENAI_API_KEY') else None,
            "anthropic": os.getenv('ANTHROPIC_MODEL') if os.getenv('ANTHROPIC_API_KEY') else None,
            "deepseek": os.getenv('DATABASE_MODEL') if os.getenv('DEEPSEEK_API_KEY') else None
        }
    }
