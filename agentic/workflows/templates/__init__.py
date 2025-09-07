"""
Persona workflow templates for coordinate-aware processing.

Provides base PersonaWorkflow class and persona-specific implementations
for Nara (#4) and Epii (#5) coordinate processing.
"""

from .base import PersonaWorkflow, WorkflowExecutionContext, WorkflowExecutionResult
from .nara_workflow import NaraWorkflow
from .epii_workflow import EpiiWorkflow

__all__ = [
    "PersonaWorkflow",
    "WorkflowExecutionContext", 
    "WorkflowExecutionResult",
    "NaraWorkflow",
    "EpiiWorkflow"
]