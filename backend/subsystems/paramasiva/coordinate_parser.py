"""
Coordinate Decomposition Service (Story 04.01)

Parses Bimba Coordinate strings into structured numerical components
for Quaternal Logic (QL) processing.

Supported Formats:
- Basic: #N → [N]
- Hyphen-linked: #N-N-N → [N, N, N]
- Dot-linked: #N.N → [N, N]
- Reflective/Or: #N/N → [N, N]
- Complex: #N-N/N-N → [N, N, N, N]
- Root: # → []

Examples:
    >>> parse_coordinate("#1")
    [1]
    >>> parse_coordinate("#1-2-3")
    [1, 2, 3]
    >>> parse_coordinate("#0-5-0/1-4")
    [0, 5, 0, 1, 4]
"""

import re
from typing import List
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

# Bimba coordinate regex pattern (from MCP server specification)
COORDINATE_PATTERN = re.compile(r"^#(\d+([-\./]\d+)*)?$")

# Valid subsystem range (0-5 for mod6 QL framework)
VALID_SUBSYSTEMS = range(0, 6)

# The 6 Quaternal Logic Context Frames - treated as atomic units during parsing
# These must be recognized and preserved as single components
CONTEXT_FRAMES = [
    '0000',           # 4-Fold Static Framework
    '0/1',            # 6-Fold Dynamic Process
    '0/1/2',          # 8-Fold Processual Frame
    '0/1/2/3',        # Dual-Track Parallel Equation
    '4.0-4.4/5',      # Contextual Flowering Synthesis
    '5/0'             # Transcendent Integration
]


class InvalidCoordinateError(ValueError):
    """Raised when a coordinate string is invalid"""
    pass


class CoordinateComponents(BaseModel):
    """Structured representation of decomposed coordinate"""
    coordinate: str = Field(..., description="Original coordinate string")
    components: List[int | str] = Field(..., description="Numerical components extracted from coordinate (may include context frame strings)")
    depth: int = Field(..., description="Number of components (coordinate depth)")
    is_valid: bool = Field(..., description="Whether coordinate format is valid")
    exists: bool = Field(default=False, description="Whether coordinate exists in Bimba graph (requires MCP validation)")
    context_frame: str | None = Field(default=None, description="Context frame if present in coordinate")

    model_config = {
        "json_schema_extra": {
            "example": {
                "coordinate": "#1-2-3",
                "components": [1, 2, 3],
                "depth": 3,
                "is_valid": True,
                "exists": False
            }
        }
    }


def validate_coordinate_format(coordinate: str) -> bool:
    """
    Validate coordinate string matches Bimba coordinate pattern.

    Args:
        coordinate: Coordinate string to validate (e.g., "#1-2-3")

    Returns:
        True if format is valid, False otherwise

    Examples:
        >>> validate_coordinate_format("#1")
        True
        >>> validate_coordinate_format("invalid")
        False
    """
    if not coordinate:
        return False

    # Strip whitespace
    coordinate = coordinate.strip()

    # Check pattern match
    return bool(COORDINATE_PATTERN.match(coordinate))


def parse_coordinate(coordinate: str) -> tuple[List[int | str], str | None]:
    """
    Parse Bimba coordinate string into numerical components, preserving context frames as atomic units.

    Context frames are special QL processing indicators that must NOT be split into individual numbers.
    They are recognized and kept as single string components.

    Args:
        coordinate: Valid Bimba coordinate string (e.g., "#1-2-3", "#1-3-4.0/1/2/3")

    Returns:
        Tuple of (components list, context_frame string or None)
        - components: List of integers or context frame string
        - context_frame: The context frame if found, otherwise None

    Raises:
        InvalidCoordinateError: If coordinate format is invalid or contains invalid subsystems

    Examples:
        >>> parse_coordinate("#1")
        ([1], None)
        >>> parse_coordinate("#1-2-3")
        ([1, 2, 3], None)
        >>> parse_coordinate("#1-3-4.0/1/2/3")
        ([1, 3, 4, "0/1/2/3"], "0/1/2/3")
        >>> parse_coordinate("#4.2")
        ([4, 2], None)
        >>> parse_coordinate("#")
        ([], None)
    """
    # Strip whitespace
    coordinate = coordinate.strip()

    # Validate format
    if not validate_coordinate_format(coordinate):
        raise InvalidCoordinateError(f"Invalid coordinate format: {coordinate}")

    # Handle root coordinate (#)
    if coordinate == "#":
        logger.debug("Parsed root coordinate: []")
        return ([], None)

    # Remove leading '#'
    coord_str = coordinate[1:]

    # Check for context frame suffix (after dot or hyphen)
    context_frame = None
    base_coord = coord_str

    # Try to find a context frame at the end
    # Context frames come after a separator (- or .)
    for frame in CONTEXT_FRAMES:
        # Check if coordinate ends with the frame after a separator
        if coord_str.endswith('.' + frame) or coord_str.endswith('-' + frame):
            # Found a context frame!
            sep_pos = coord_str.rfind(frame) - 1  # Position of separator before frame
            base_coord = coord_str[:sep_pos]  # Everything before the separator
            context_frame = frame
            logger.debug(f"Detected context frame '{frame}' in coordinate {coordinate}")
            break

    # Parse the base coordinate (without context frame)
    if not base_coord:
        # Only a context frame, no base coordinate
        if context_frame:
            return ([context_frame], context_frame)
        else:
            return ([], None)

    # Split base coordinate by separators (-, ., /)
    # Replace all separators with a common delimiter
    normalized = base_coord.replace('/', '-').replace('.', '-')

    # Split and convert to integers
    try:
        components = [int(part) for part in normalized.split('-') if part]
    except ValueError as e:
        raise InvalidCoordinateError(f"Failed to parse coordinate components: {coordinate}") from e

    # Add context frame as final component if present
    if context_frame:
        components.append(context_frame)

    # Validate subsystem numbers (first component must be 0-5)
    if components and isinstance(components[0], int) and components[0] not in VALID_SUBSYSTEMS:
        raise InvalidCoordinateError(
            f"Invalid subsystem: #{components[0]}. Must be in range 0-5 (mod6 QL framework)"
        )

    logger.debug(f"Parsed coordinate {coordinate} → {components} (context_frame: {context_frame})")
    return (components, context_frame)


def decompose_coordinate(
    coordinate: str,
    validate_existence: bool = False
) -> CoordinateComponents:
    """
    Decompose Bimba coordinate into structured components.

    This is the primary service function exposed via GraphQL and REST APIs.

    Args:
        coordinate: Bimba coordinate string to decompose (None will be converted to empty string)
        validate_existence: Whether to validate coordinate exists in Bimba graph via MCP

    Returns:
        CoordinateComponents object with decomposition results

    Raises:
        InvalidCoordinateError: If coordinate format is invalid

    Examples:
        >>> result = decompose_coordinate("#1-2-3")
        >>> result.components
        [1, 2, 3]
        >>> result.depth
        3
    """
    # Handle None input
    if coordinate is None:
        coordinate = ""

    # Validate and parse
    is_valid = validate_coordinate_format(coordinate)

    if not is_valid:
        return CoordinateComponents(
            coordinate=coordinate,
            components=[],
            depth=0,
            is_valid=False,
            exists=False
        )

    try:
        components, context_frame = parse_coordinate(coordinate)
        depth = len(components)

        # Create result
        result = CoordinateComponents(
            coordinate=coordinate,
            components=components,
            depth=depth,
            is_valid=True,
            exists=False,  # MCP validation not yet implemented
            context_frame=context_frame
        )

        # TODO: Validate existence via Bimba MCP if requested
        if validate_existence:
            # This will be implemented after Bimba MCP integration
            # For now, always returns exists=False
            logger.warning("MCP validation not yet implemented - exists will always be False")

        return result

    except InvalidCoordinateError as e:
        logger.error(f"Coordinate decomposition failed: {e}")
        raise


# Utility functions for coordinate operations (future enhancements)

def get_parent_coordinate(coordinate: str) -> str | None:
    """
    Get parent coordinate by removing last component.

    Examples:
        >>> get_parent_coordinate("#1-2-3")
        '#1-2'
        >>> get_parent_coordinate("#1")
        '#'
        >>> get_parent_coordinate("#")
        None
    """
    components, context_frame = parse_coordinate(coordinate)

    if not components:
        return None  # Root has no parent

    if len(components) == 1:
        return "#"  # Parent of #N is root

    # Reconstruct coordinate without last component
    parent_components = components[:-1]
    return "#" + "-".join(str(c) for c in parent_components)


def get_coordinate_depth(coordinate: str) -> int:
    """
    Get depth of coordinate (number of components).

    Examples:
        >>> get_coordinate_depth("#1-2-3")
        3
        >>> get_coordinate_depth("#1")
        1
        >>> get_coordinate_depth("#")
        0
    """
    components, _ = parse_coordinate(coordinate)
    return len(components)


def get_subsystem(coordinate: str) -> int | None:
    """
    Get subsystem number (first component) from coordinate.

    Examples:
        >>> get_subsystem("#1-2-3")
        1
        >>> get_subsystem("#5")
        5
        >>> get_subsystem("#")
        None
    """
    components, _ = parse_coordinate(coordinate)
    if components and isinstance(components[0], int):
        return components[0]
    return None
