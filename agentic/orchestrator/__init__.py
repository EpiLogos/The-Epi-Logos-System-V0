"""
Unified Orchestrator Module

The central orchestration system for persona-based AI workflows in the Epi-Logos System.
Implements the core UnifiedOrchestrator with persona masking capability, ACT Protocol
foundation, and basic GraphQL integration for Bimba Map access.

Track A Implementation: Foundation layer with core orchestrator, basic persona routing,
Redis session management, and clean slate re-instantiation protocols.
"""

# Import components without importing core at module level to avoid pydantic_ai dependency issues
from .persona_manager import PersonaManager
from .session import SessionManager
from .context_package import ContextPackageBuilder
from .bimba_client import BimbaGraphQLClient

__all__ = [
    "PersonaManager", 
    "SessionManager",
    "ContextPackageBuilder", 
    "BimbaGraphQLClient"
]

def get_unified_orchestrator():
    """Lazy import of UnifiedOrchestrator to avoid pydantic_ai import issues"""
    from .core import UnifiedOrchestrator
    return UnifiedOrchestrator
