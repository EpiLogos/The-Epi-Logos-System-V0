"""
GraphQL Resolvers for Paramasiva Subsystem
Story 04.01: Coordinate Decomposition Service
"""

import strawberry
from typing import List
import logging

from .coordinate_parser import (
    decompose_coordinate,
    InvalidCoordinateError
)

logger = logging.getLogger(__name__)


@strawberry.type
class CoordinateComponents:
    """Structured representation of decomposed coordinate"""
    coordinate: str = strawberry.field(description="Original coordinate string")
    components: List[strawberry.scalar(int | str)] = strawberry.field(description="Numerical components (may include context frame strings)")
    depth: int = strawberry.field(description="Number of components (coordinate depth)")
    is_valid: bool = strawberry.field(description="Whether coordinate format is valid")
    exists: bool = strawberry.field(description="Whether coordinate exists in Bimba graph (requires MCP validation)")
    context_frame: str | None = strawberry.field(default=None, description="QL Context Frame if present")


@strawberry.type
class Query:
    @strawberry.field(description="Decompose Bimba coordinate into numerical components for QL processing")
    def decompose_coordinate(
        self,
        bimba_coordinate: str = strawberry.argument(description="Bimba coordinate string to decompose"),
        validate_existence: bool = strawberry.argument(
            default=False,
            description="Validate coordinate exists in Bimba graph via MCP"
        )
    ) -> CoordinateComponents:
        """
        Decompose Bimba coordinate into numerical components.

        Args:
            bimba_coordinate: Coordinate string to decompose (e.g., "#1-2-3")
            validate_existence: Whether to validate coordinate exists via MCP

        Returns:
            CoordinateComponents with decomposition results

        Examples:
            >>> decompose_coordinate("#1-2-3")
            CoordinateComponents(coordinate="#1-2-3", components=[1, 2, 3], depth=3, is_valid=True, exists=False)
        """
        try:
            result = decompose_coordinate(bimba_coordinate, validate_existence=validate_existence)

            return CoordinateComponents(
                coordinate=result.coordinate,
                components=result.components,
                depth=result.depth,
                is_valid=result.is_valid,
                exists=result.exists,
                context_frame=result.context_frame
            )

        except InvalidCoordinateError as e:
            logger.error(f"Invalid coordinate: {bimba_coordinate} - {str(e)}")
            # Return invalid result instead of raising exception
            return CoordinateComponents(
                coordinate=bimba_coordinate,
                components=[],
                depth=0,
                is_valid=False,
                exists=False
            )
        except Exception as e:
            logger.error(f"Unexpected error decomposing coordinate {bimba_coordinate}: {str(e)}")
            return CoordinateComponents(
                coordinate=bimba_coordinate,
                components=[],
                depth=0,
                is_valid=False,
                exists=False
            )


# Create schema
schema = strawberry.Schema(query=Query)
