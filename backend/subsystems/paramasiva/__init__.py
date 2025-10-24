"""
Paramasiva Subsystem (#1) - Quaternal Logic Engine

This subsystem implements the mathematical and logical foundation
for the Epi-Logos system through Quaternal Logic (QL) processing.

Core Services:
- Coordinate Decomposition: Parse Bimba coordinates into numerical components
- QL Context Frame Application: Apply QL frames to data payloads (Story 04.02)
- Contemplative Mode: Inter-subsystem epistemic conversations
"""

from .coordinate_parser import (
    parse_coordinate,
    decompose_coordinate,
    CoordinateComponents,
    InvalidCoordinateError
)

__all__ = [
    "parse_coordinate",
    "decompose_coordinate",
    "CoordinateComponents",
    "InvalidCoordinateError",
]
