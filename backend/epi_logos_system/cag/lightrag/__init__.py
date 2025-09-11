"""
LightRAG Foundation Integration Service

Provides hybrid vector-graph document intelligence for the Gnostic Namespace
with Bimba coordinate metadata preservation.
"""

from .models import (
    BimbaCoordinateMetadata,
    BimbaDocument,
    BimbaChunk,
    build_coordinate_kg,
)

# Lazy imports to avoid circular dependencies
def get_lightrag_service():
    from .service import get_lightrag_service as _get_service
    return _get_service()

def get_document_operations_service():
    from .document_operations import get_document_operations_service as _get_service
    return _get_service()

def get_ingestion_pipeline():
    from .document_operations import get_ingestion_pipeline as _get_pipeline
    return _get_pipeline()

def get_search_operations():
    from .document_operations import get_search_operations as _get_operations
    return _get_operations()

__all__ = [
    "get_lightrag_service",
    "get_document_operations_service",
    "get_ingestion_pipeline", 
    "get_search_operations",
    "BimbaCoordinateMetadata", 
    "BimbaDocument",
    "BimbaChunk",
    "build_coordinate_kg",
]