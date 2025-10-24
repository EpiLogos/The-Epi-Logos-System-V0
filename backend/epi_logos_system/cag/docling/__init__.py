"""
Docling preprocessing module for document parsing and chunk extraction.

This module provides document preprocessing services using Docling 2.57.0
for extracting structured chunks with hierarchical metadata from various
document formats (PDF, DOCX, PPTX, XLSX, HTML).
"""

from backend.epi_logos_system.cag.docling.models import (
    DoclingChunk,
    DoclingMetadata,
    DoclingDocument,
    ConversionStatus,
)

__all__ = [
    "DoclingChunk",
    "DoclingMetadata",
    "DoclingDocument",
    "ConversionStatus",
]

# Lazy imports to avoid circular dependencies and missing docling in test env
try:
    from backend.epi_logos_system.cag.docling.preprocessor import DocumentPreprocessor
    from backend.epi_logos_system.cag.docling.chunk_extractor import ChunkExtractor
    __all__.extend(["DocumentPreprocessor", "ChunkExtractor"])
except ImportError:
    pass
