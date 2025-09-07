"""
Common types for the orchestrator module to prevent circular imports.
"""

from enum import Enum


class PersonaType(str, Enum):
    """Available persona types"""
    NARA = "nara"
    EPII = "epii" 
    SYSTEM = "system"