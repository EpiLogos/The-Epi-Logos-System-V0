"""
Orchestrator System Prompt Module Imports
Modular system prompt components for isolated editing and dynamic loading

DEPRECATED: This package is deprecated as of the Neo4j prompt migration.
All orchestrator prompts are now stored in Neo4j at #5-4 node and loaded
via PrakasaManager. These modules are kept for fallback only and will be
removed in a future version.
"""

from agentic.agents.orchestrator.system_prompt.quaternal_logic_foundation import get_quaternal_logic_foundation
from agentic.agents.orchestrator.system_prompt.epi_logos_system_foundation import get_epi_logos_system_foundation  
from agentic.agents.orchestrator.system_prompt.agent_operational_context import get_agent_operational_context

__all__ = [
    'get_quaternal_logic_foundation',
    'get_epi_logos_system_foundation', 
    'get_agent_operational_context'
]

def get_complete_system_foundation() -> str:
    """
    Get complete system foundation by combining all modular imports.
    Allows isolated editing while providing unified system prompt.
    """
    ql_foundation = get_quaternal_logic_foundation()
    system_foundation = get_epi_logos_system_foundation()
    operational_context = get_agent_operational_context()
    
    return f"""
{ql_foundation}

{system_foundation}

{operational_context}
"""
