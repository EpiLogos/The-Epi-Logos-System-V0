"""
Document management module.

Handles file uploads, MongoDB storage, and preprocessing pipeline integration.
"""

from .service import DocumentService, get_document_service, DocumentMetadata, DocumentRecord
from .api import router

__all__ = [
    "DocumentService",
    "get_document_service",
    "DocumentMetadata",
    "DocumentRecord",
    "router"
]
