"""
Pydantic AI Workflow Engine for Track B Story 02.14.

Provides workflow registration, execution, and state management integrated
with Track A UnifiedOrchestrator for persona-aware processing.
"""

from .engine import WorkflowEngine, WorkflowEngineConfig
from .state import WorkflowStateManager, WorkflowState, WorkflowStatus, WorkflowCheckpoint
from .templates.base import PersonaWorkflow, WorkflowExecutionContext, WorkflowExecutionResult
from .templates.nara_workflow import NaraWorkflow
from .templates.epii_workflow import EpiiWorkflow
from .tools.registry import MCPToolRegistry, MCPToolMetadata, MCPToolResult

__all__ = [
    # Core engine
    "WorkflowEngine",
    "WorkflowEngineConfig",
    
    # State management
    "WorkflowStateManager",
    "WorkflowState", 
    "WorkflowStatus",
    "WorkflowCheckpoint",
    
    # Base templates
    "PersonaWorkflow",
    "WorkflowExecutionContext",
    "WorkflowExecutionResult",
    
    # Persona implementations
    "NaraWorkflow",
    "EpiiWorkflow",
    
    # Tool integration
    "MCPToolRegistry",
    "MCPToolMetadata",
    "MCPToolResult"
]