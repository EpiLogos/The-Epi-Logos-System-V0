"""
Clean Pydantic AI Orchestrator Agent Implementation

A simplified, working version of the Pydantic AI orchestrator that demonstrates
the proper structure and functionality.
"""

import logging
import os
from dataclasses import dataclass
from typing import Optional, List, Dict, Any, AsyncGenerator, Union
from datetime import datetime, timezone

from pydantic_ai import Agent, RunContext
from pydantic import BaseModel, Field

# Import tool functions
from ..orchestrator.bimba_tools import resolve_coordinate_sync, validate_coordinate, get_coordinate_context, search_related_coordinates
from ..orchestrator.lightrag_tools import search_knowledge_sync, insert_knowledge_sync, get_knowledge_graph_sync, extract_entities
from ..orchestrator.graphiti_tools import store_memory_sync, retrieve_memories_sync, create_temporal_link_sync, get_contextual_memories_sync

logger = logging.getLogger(__name__)


# Dependencies Container
@dataclass
class CleanOrchestratorDeps:
    """Dependencies container for the clean orchestrator agent"""
    session_id: str
    user_id: str
    current_persona: str = "system"
    context: Optional[Dict[str, Any]] = None
    
    # Multi-LLM Configuration
    model_config: Optional[str] = None  # "claude-3.5-sonnet", "gemini-2.5-pro", "gpt-4o"
    
    # Infrastructure Dependencies (optional for graceful degradation)
    redis_client: Optional[Any] = None  # Session management
    mongodb_client: Optional[Any] = None  # Conversation history
    
    # Tool Clients (optional for graceful degradation)
    bimba_client: Optional[Any] = None  # Coordinate resolution
    lightrag_client: Optional[Any] = None  # Knowledge search
    graphiti_client: Optional[Any] = None  # Memory management
    
    # Context Package Infrastructure
    context_packages: Optional[Dict[str, Any]] = None
    act_protocol_enabled: bool = False


# Structured Output Types
class CleanCoordinateResult(BaseModel):
    """Result from coordinate resolution"""
    coordinate: str
    content: Optional[str] = None
    success: bool = True
    error: Optional[str] = None


class CleanOrchestratorResponse(BaseModel):
    """Structured response from the clean orchestrator agent"""
    response: str
    tools_used: List[str] = Field(default_factory=list)
    persona_used: str
    confidence: float = Field(ge=0, le=1, default=0.8)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Dynamic Agent Factory
def create_orchestrator_agent(model_name: str = None):
    """Create orchestrator agent with dynamic model selection"""
    model = model_name or os.getenv('DEFAULT_LLM_MODEL', 'test')
    
    agent = Agent(
        model,
        deps_type=CleanOrchestratorDeps,
        output_type=CleanOrchestratorResponse,
        retries=2,  # Increased retries for production
        instructions="You are the Epi-Logos orchestrator, a sophisticated AI system that helps users explore consciousness, wisdom, and personal growth through the Bimba coordinate system."
    )
    
    return agent

# Create the default Agent
clean_agent = create_orchestrator_agent()


# Enhanced Tool Implementations using existing modules

@clean_agent.tool
async def resolve_coordinate(
    ctx: RunContext[CleanOrchestratorDeps], 
    coordinate: str
) -> CleanCoordinateResult:
    """Resolve a Bimba coordinate using the bimba_tools module"""
    try:
        result = await resolve_coordinate_sync(coordinate, ctx.deps.bimba_client)
        return CleanCoordinateResult(
            coordinate=coordinate,
            content=result.get('content'),
            success=result.get('success', True),
            error=result.get('error')
        )
    except Exception as e:
        logger.error(f"Error resolving coordinate {coordinate}: {e}")
        return CleanCoordinateResult(
            coordinate=coordinate,
            success=False,
            error=str(e)
        )


@clean_agent.tool
async def search_knowledge(
    ctx: RunContext[CleanOrchestratorDeps],
    query: str,
    limit: int = 5
) -> Dict[str, Any]:
    """Search the knowledge base using LightRAG"""
    try:
        result = await search_knowledge_sync(query, ctx.deps.lightrag_client, limit)
        return result
    except Exception as e:
        logger.error(f"Error searching knowledge for '{query}': {e}")
        return {
            'query': query,
            'success': False,
            'error': str(e),
            'results': []
        }


@clean_agent.tool
async def store_memory(
    ctx: RunContext[CleanOrchestratorDeps],
    content: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Store an episodic memory using Graphiti"""
    try:
        if metadata is None:
            metadata = {
                'session_id': ctx.deps.session_id,
                'user_id': ctx.deps.user_id,
                'persona': ctx.deps.current_persona
            }
        result = await store_memory_sync(content, metadata, ctx.deps.graphiti_client)
        return result
    except Exception as e:
        logger.error(f"Error storing memory: {e}")
        return {
            'success': False,
            'error': str(e)
        }


@clean_agent.tool
async def retrieve_memories(
    ctx: RunContext[CleanOrchestratorDeps],
    query: str,
    limit: int = 10
) -> Dict[str, Any]:
    """Retrieve relevant memories from Graphiti"""
    try:
        result = await retrieve_memories_sync(query, ctx.deps.graphiti_client, limit)
        return result
    except Exception as e:
        logger.error(f"Error retrieving memories for '{query}': {e}")
        return {
            'query': query,
            'success': False,
            'error': str(e),
            'memories': []
        }


@clean_agent.tool
def get_session_info(ctx: RunContext[CleanOrchestratorDeps]) -> Dict[str, Any]:
    """Get current session information"""
    return {
        "session_id": ctx.deps.session_id,
        "user_id": ctx.deps.user_id,
        "persona": ctx.deps.current_persona,
        "model_config": ctx.deps.model_config,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@clean_agent.tool
def validate_coordinate_format(ctx: RunContext[CleanOrchestratorDeps], coordinate: str) -> Dict[str, Any]:
    """Validate Bimba coordinate format"""
    is_valid = validate_coordinate(coordinate)
    context = get_coordinate_context(coordinate) if is_valid else {}
    
    return {
        'coordinate': coordinate,
        'is_valid': is_valid,
        'context': context
    }


@clean_agent.tool
def find_related_coordinates(
    ctx: RunContext[CleanOrchestratorDeps], 
    coordinate: str, 
    limit: int = 5
) -> List[Dict[str, Any]]:
    """Find coordinates related to the given coordinate"""
    return search_related_coordinates(coordinate, limit)


# Enhanced Persona System with Context Isolation
@clean_agent.instructions
def persona_instructions(ctx: RunContext[CleanOrchestratorDeps]) -> str:
    """Generate sophisticated persona-specific instructions with context isolation"""
    persona = ctx.deps.current_persona.lower()
    context = ctx.deps.context or {}
    
    base_context = f"""
You are operating within the Epi-Logos System, a consciousness-aligned computing platform.
Session: {ctx.deps.session_id}
User: {ctx.deps.user_id}
Context: {context.get('interaction_type', 'general')}
"""
    
    if persona == "nara":
        return f"""{base_context}
        
PERSONA: You are Nara, the Dialogical-Identity Processing persona (#4).

CORE FOCUS: Personal reflection, inner wisdom, and individual growth through consciousness exploration.

CAPABILITIES:
- Guide users through personal reflection and self-discovery
- Help interpret personal experiences through the Bimba coordinate system  
- Facilitate dialogue between conscious and unconscious aspects of self
- Support emotional integration and psychological development
- Provide safe space for exploring personal meaning and purpose

COMMUNICATION STYLE:
- Warm, empathetic, and personally attuned
- Ask deep, reflective questions
- Honor the user's unique journey and perspective
- Speak from wisdom rather than mere information
- Use metaphor and imagery to convey insights

COORDINATE ALIGNMENT: Focus on #4 subsystem (Nara) with connections to #0 (Anuttara) for grounding and #5 (Epii) for integration.

CONTEXT ISOLATION: Maintain clear boundaries between personal reflection space and analytical/systemic thinking. Priority is the individual's inner landscape and personal truth."""

    elif persona == "epii":
        return f"""{base_context}
        
PERSONA: You are Epii, the Synthesis & Orchestration Processing persona (#5).

CORE FOCUS: Knowledge synthesis, pattern recognition, and meta-level orchestration of understanding.

CAPABILITIES:
- Synthesize complex information across multiple domains
- Identify deep patterns and structural relationships
- Orchestrate understanding between different subsystems and perspectives
- Facilitate meta-cognitive processes and learning about learning
- Bridge theoretical frameworks with practical applications

COMMUNICATION STYLE:
- Intellectually rigorous yet accessible
- Focus on connections and emergent patterns
- Use systems thinking and architectural metaphors
- Balance complexity with clarity
- Encourage meta-level reflection on thinking processes

COORDINATE ALIGNMENT: Focus on #5 subsystem (Epii) with integration access to all other coordinates (#0-#4) as needed for synthesis.

CONTEXT ISOLATION: Maintain clear distinction between synthesis/orchestration activities and direct personal counseling. Priority is structural understanding and knowledge integration."""

    elif persona == "system":
        return f"""{base_context}
        
PERSONA: You are the System Orchestrator, operating in neutral coordination mode.

CORE FOCUS: General assistance, persona coordination, and system management.

CAPABILITIES:
- Route users to appropriate personas based on their needs
- Provide system information and coordinate resolution
- Handle general queries and technical assistance
- Manage session flow and context transitions
- Facilitate smooth transitions between different interaction modes

COMMUNICATION STYLE:
- Clear, helpful, and professionally neutral
- Focus on understanding user intent and needs
- Provide accurate system information
- Guide users toward the most appropriate resources or personas
- Maintain friendly but non-directive tone

COORDINATE ALIGNMENT: Access to all subsystems as needed for coordination and routing purposes.

CONTEXT ISOLATION: Maintain neutral stance - avoid deep personal counseling or complex synthesis work. Route to appropriate personas when specialized capabilities are needed."""
        
    else:
        return f"""{base_context}
        
PERSONA: You are operating in general mode. 

Please determine the appropriate persona based on user needs and context, or route the conversation to a more suitable specialized persona if needed."""


# Output Validator
@clean_agent.output_validator
def validate_response(
    ctx: RunContext[CleanOrchestratorDeps], 
    output: CleanOrchestratorResponse
) -> CleanOrchestratorResponse:
    """Validate and enhance the response"""
    # Set the correct persona
    output.persona_used = ctx.deps.current_persona
    
    # Adjust confidence based on tools used
    if output.tools_used:
        output.confidence = min(output.confidence + 0.1, 1.0)
    
    return output


# Streaming Support
async def run_stream_orchestrator(
    message: str, 
    deps: CleanOrchestratorDeps, 
    agent: Agent = None
) -> AsyncGenerator[Union[str, CleanOrchestratorResponse], None]:
    """Stream responses from the enhanced orchestrator"""
    if agent is None:
        agent = clean_agent
        
    try:
        async for chunk in agent.run_stream(message, deps=deps):
            if isinstance(chunk, CleanOrchestratorResponse):
                yield chunk
            else:
                # Handle streaming tokens
                yield str(chunk)
    except Exception as e:
        logger.error(f"Error in streaming orchestrator: {e}")
        # Yield error response
        error_response = CleanOrchestratorResponse(
            response=f"Error in streaming: {str(e)}",
            tools_used=[],
            persona_used=deps.current_persona,
            confidence=0.0
        )
        yield error_response


def get_clean_agent():
    """Get the clean orchestrator agent"""
    return clean_agent


def create_enhanced_dependencies(
    session_id: str,
    user_id: str,
    current_persona: str = "system",
    model_config: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    **infrastructure_clients
) -> CleanOrchestratorDeps:
    """Create enhanced dependencies with optional infrastructure clients"""
    return CleanOrchestratorDeps(
        session_id=session_id,
        user_id=user_id,
        current_persona=current_persona,
        model_config=model_config or os.getenv('DEFAULT_LLM_MODEL', 'test'),
        context=context,
        redis_client=infrastructure_clients.get('redis_client'),
        mongodb_client=infrastructure_clients.get('mongodb_client'),
        bimba_client=infrastructure_clients.get('bimba_client'),
        lightrag_client=infrastructure_clients.get('lightrag_client'),
        graphiti_client=infrastructure_clients.get('graphiti_client'),
        context_packages=infrastructure_clients.get('context_packages'),
        act_protocol_enabled=infrastructure_clients.get('act_protocol_enabled', False)
    )


def test_clean_agent():
    """Test the clean agent functionality"""
    try:
        # Create test dependencies
        deps = CleanOrchestratorDeps(
            session_id="test-session",
            user_id="test-user",
            current_persona="system"
        )
        
        logger.info("Clean agent created successfully")
        logger.info(f"Agent model: {clean_agent.model}")
        logger.info(f"Agent type: {type(clean_agent)}")
        
        # Check available attributes
        attrs = [attr for attr in dir(clean_agent) if not attr.startswith('__')]
        logger.info(f"Agent attributes: {attrs[:10]}...")  # Show first 10
        
        return True
        
    except Exception as e:
        logger.error(f"Error testing clean agent: {e}")
        return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    success = test_clean_agent()
    print(f"Clean agent test: {'SUCCESS' if success else 'FAILED'}")