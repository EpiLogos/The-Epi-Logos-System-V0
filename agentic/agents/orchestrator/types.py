"""
Core orchestrator types used across agents and workflows.

Provides a minimal PersonaType enum to decouple components that only need
persona identity without bringing in larger orchestrator dependencies.
"""

from __future__ import annotations

from enum import Enum


class PersonaType(str, Enum):
    SYSTEM = "SYSTEM"
    NARA = "NARA"
    EPII = "EPII"

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.value

    @classmethod
    def from_key(cls, key: str) -> "PersonaType":
        """Create a PersonaType from a user-facing key (case-insensitive)."""
        normalized = (key or "system").strip().upper()
        try:
            return cls(normalized)
        except ValueError:
            return cls.SYSTEM

