"""
API response utilities for consistent response formatting.
Provides standardized response models and helper functions.
"""
from typing import Any, Optional, Dict, List
from pydantic import BaseModel


class APIResponse(BaseModel):
    """Standard API response model."""
    
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    errors: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    @classmethod
    def success_response(
        cls,
        message: str = "Operation successful",
        data: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> "APIResponse":
        """Create a success response."""
        return cls(
            success=True,
            message=message,
            data=data,
            metadata=metadata
        )
    
    @classmethod
    def error_response(
        cls,
        message: str = "Operation failed",
        errors: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> "APIResponse":
        """Create an error response."""
        return cls(
            success=False,
            message=message,
            errors=errors or [],
            metadata=metadata
        )
    
    @classmethod
    def validation_error_response(
        cls,
        errors: List[str],
        message: str = "Validation failed"
    ) -> "APIResponse":
        """Create a validation error response."""
        return cls(
            success=False,
            message=message,
            errors=errors
        )


class PaginatedResponse(BaseModel):
    """Paginated API response model."""
    
    success: bool
    message: str
    data: List[Dict[str, Any]]
    pagination: Dict[str, Any]
    
    @classmethod
    def create(
        cls,
        data: List[Dict[str, Any]],
        page: int,
        per_page: int,
        total_items: int,
        message: str = "Data retrieved successfully"
    ) -> "PaginatedResponse":
        """Create a paginated response."""
        total_pages = (total_items + per_page - 1) // per_page
        has_next = page < total_pages
        has_prev = page > 1
        
        pagination = {
            "page": page,
            "per_page": per_page,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev,
            "next_page": page + 1 if has_next else None,
            "prev_page": page - 1 if has_prev else None
        }
        
        return cls(
            success=True,
            message=message,
            data=data,
            pagination=pagination
        )


def format_error_response(error: Exception, message: str = None) -> Dict[str, Any]:
    """Format exception as error response dictionary."""
    return {
        "success": False,
        "message": message or str(error),
        "errors": [str(error)],
        "error_type": error.__class__.__name__
    }


def format_validation_errors(validation_errors: List[Dict[str, Any]]) -> List[str]:
    """Format Pydantic validation errors as string list."""
    formatted_errors = []
    
    for error in validation_errors:
        field = ".".join(str(loc) for loc in error.get("loc", []))
        message = error.get("msg", "Validation error")
        error_type = error.get("type", "")
        
        if field:
            formatted_errors.append(f"{field}: {message}")
        else:
            formatted_errors.append(message)
    
    return formatted_errors