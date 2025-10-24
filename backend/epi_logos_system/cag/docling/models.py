"""
Docling-specific data models for document preprocessing.

Defines data structures for Docling chunks with hierarchical metadata
including heading levels, section titles, reading order, table indices,
page numbers, and bounding boxes.
"""

from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
import uuid


class ConversionStatus(str, Enum):
    """Docling conversion result status"""
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    PARTIAL_SUCCESS = "PARTIAL_SUCCESS"
    FAILURE = "FAILURE"


class DoclingMetadata(BaseModel):
    """
    Hierarchical metadata extracted from Docling conversion.

    Preserves document structure including headings, sections, tables,
    reading order, and positioning information.
    """
    heading_level: Optional[int] = Field(None, description="Heading level (1-6) if chunk is heading")
    section_title: Optional[str] = Field(None, description="Section or parent heading title")
    reading_order: int = Field(..., description="Sequential reading position in document")
    table_index: Optional[int] = Field(None, description="Table index if chunk contains table data")
    page_number: Optional[int] = Field(None, description="Source page number")
    bbox: Optional[List[float]] = Field(None, description="Bounding box [x, y, width, height]")
    chunk_type: str = Field("text", description="Type of content: text, table, list, code, etc.")


class DoclingChunk(BaseModel):
    """
    Raw chunk extracted from Docling preprocessing.

    Represents a single semantic unit of content with hierarchical
    metadata preserved for context-aware processing.
    """
    chunk_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique chunk identifier")
    chunk_index: int = Field(..., description="Sequential position in document (0-based)")
    content: str = Field(..., description="Extracted text content")
    docling_metadata: DoclingMetadata = Field(..., description="Hierarchical structure metadata")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "chunk_id": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
                "chunk_index": 0,
                "content": "Introduction to Bimba Coordinates",
                "docling_metadata": {
                    "heading_level": 1,
                    "section_title": "Introduction",
                    "reading_order": 5,
                    "table_index": None,
                    "page_number": 1,
                    "bbox": [50.0, 100.0, 500.0, 30.0],
                    "chunk_type": "heading"
                }
            }
        }
    )


class DoclingDocument(BaseModel):
    """
    Complete Docling conversion result for a source document.

    Contains all extracted chunks with metadata and conversion status.
    """
    document_id: str = Field(..., description="Source document identifier")
    source_path: str = Field(..., description="Original file path or URL")
    status: ConversionStatus = Field(..., description="Conversion result status")
    chunks: List[DoclingChunk] = Field(default_factory=list, description="Extracted chunks")
    total_pages: Optional[int] = Field(None, description="Total page count")
    conversion_errors: List[str] = Field(default_factory=list, description="Any conversion errors")
    timing_ms: Optional[float] = Field(None, description="Conversion time in milliseconds")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "document_id": "doc-uuid-12345",
                "source_path": "/uploads/bimba-guide.pdf",
                "status": "SUCCESS",
                "chunks": [],
                "total_pages": 42,
                "conversion_errors": [],
                "timing_ms": 2350.5
            }
        }
    )
