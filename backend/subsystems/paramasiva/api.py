"""
FastAPI REST Endpoints for Paramasiva Subsystem
Story 04.01: Coordinate Decomposition Service
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
import logging

from .coordinate_parser import (
    decompose_coordinate as decompose_coord_service,
    InvalidCoordinateError,
    CoordinateComponents as ServiceCoordinateComponents
)

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/paramasiva", tags=["paramasiva"])


# Request/Response Models
class DecomposeRequest(BaseModel):
    """Request model for coordinate decomposition"""
    bimba_coordinate: str = Field(
        ...,
        description="Bimba coordinate string to decompose",
        examples=["#1-2-3", "#4.2", "#0-5-0/1-4"]
    )
    validate_existence: bool = Field(
        default=False,
        description="Validate coordinate exists in Bimba graph via MCP"
    )


class CoordinateComponents(BaseModel):
    """Response model for coordinate decomposition"""
    coordinate: str = Field(..., description="Original coordinate string")
    components: List[int | str] = Field(..., description="Numerical components (may include context frame strings)")
    depth: int = Field(..., description="Number of components (coordinate depth)")
    is_valid: bool = Field(..., description="Whether coordinate format is valid")
    exists: bool = Field(..., description="Whether coordinate exists in Bimba graph")
    context_frame: str | None = Field(default=None, description="QL Context Frame if present")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "coordinate": "#1-2-3",
                    "components": [1, 2, 3],
                    "depth": 3,
                    "is_valid": True,
                    "exists": False,
                    "context_frame": None
                },
                {
                    "coordinate": "#1-3-4.0/1/2/3",
                    "components": [1, 3, 4, "0/1/2/3"],
                    "depth": 4,
                    "is_valid": True,
                    "exists": False,
                    "context_frame": "0/1/2/3"
                }
            ]
        }
    }


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error message")
    detail: str | None = Field(default=None, description="Detailed error information")


@router.post("/decompose", response_model=CoordinateComponents)
async def decompose_coordinate(request: DecomposeRequest):
    """
    Decompose Bimba coordinate into numerical components for QL processing.

    This endpoint parses Bimba coordinate strings and returns structured
    numerical components needed for Quaternal Logic (QL) Context Frame
    activation and mathematical analysis.

    ## Examples

    **Basic coordinate:**
    ```json
    {"bimba_coordinate": "#1"}
    → {"coordinate": "#1", "components": [1], "depth": 1, "is_valid": true, "exists": false}
    ```

    **Hyphen-linked coordinate:**
    ```json
    {"bimba_coordinate": "#1-2-3"}
    → {"coordinate": "#1-2-3", "components": [1, 2, 3], "depth": 3, "is_valid": true, "exists": false}
    ```

    **Dot-linked coordinate:**
    ```json
    {"bimba_coordinate": "#4.2"}
    → {"coordinate": "#4.2", "components": [4, 2], "depth": 2, "is_valid": true, "exists": false}
    ```

    **Complex reflective coordinate:**
    ```json
    {"bimba_coordinate": "#0-5-0/1-4"}
    → {"coordinate": "#0-5-0/1-4", "components": [0, 5, 0, 1, 4], "depth": 5, "is_valid": true, "exists": false}
    ```

    **Invalid coordinate:**
    ```json
    {"bimba_coordinate": "invalid"}
    → {"coordinate": "invalid", "components": [], "depth": 0, "is_valid": false, "exists": false}
    ```

    Args:
        request: DecomposeRequest containing coordinate string

    Returns:
        CoordinateComponents with decomposition results

    Raises:
        HTTPException: 400 if coordinate format is critically malformed
    """
    try:
        # Call service layer
        result = decompose_coord_service(
            request.bimba_coordinate,
            validate_existence=request.validate_existence
        )

        # Convert service model to API model
        return CoordinateComponents(
            coordinate=result.coordinate,
            components=result.components,
            depth=result.depth,
            is_valid=result.is_valid,
            exists=result.exists,
            context_frame=result.context_frame
        )

    except InvalidCoordinateError as e:
        logger.warning(f"Invalid coordinate format: {request.bimba_coordinate} - {str(e)}")
        # Return invalid result instead of raising exception
        # This matches GraphQL behavior for consistency
        return CoordinateComponents(
            coordinate=request.bimba_coordinate,
            components=[],
            depth=0,
            is_valid=False,
            exists=False
        )

    except Exception as e:
        logger.error(f"Unexpected error decomposing coordinate {request.bimba_coordinate}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while decomposing coordinate: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    Health check endpoint for Paramasiva subsystem.

    Returns:
        Status information
    """
    return {
        "status": "healthy",
        "subsystem": "paramasiva",
        "services": {
            "coordinate_decomposition": "operational"
        }
    }
