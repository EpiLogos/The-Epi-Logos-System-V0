"""
Contextual chunk wrapper system for coordinate-aware RAG embeddings.

Adds context metadata wrapper to Docling chunks: document summary,
Bimba coordinate, subsystem info, and structural position. Pure SYNC
string manipulation (<1ms per chunk).
"""

import logging
from typing import Optional
from pydantic import BaseModel, Field

from backend.epi_logos_system.cag.docling.models import DoclingChunk
from backend.epi_logos_system.cag.lightrag.summary_service import DocumentSummary

logger = logging.getLogger(__name__)


class ContextualizedChunk(BaseModel):
    """
    Chunk with context metadata wrapper for coordinate-aware embeddings.

    Combines original Docling chunk with document summary, coordinate,
    subsystem context, and structural position for enhanced RAG quality.
    """
    chunk_id: str = Field(..., description="Original chunk identifier")
    chunk_index: int = Field(..., description="Sequential position in document")
    wrapped_content: str = Field(..., description="Content with context wrapper prefix")
    original_content: str = Field(..., description="Original chunk content (unwrapped)")
    coordinate: str = Field(..., description="Bimba coordinate of document")
    document_id: str = Field(..., description="Source document identifier")
    subsystem_context: Optional[str] = Field(None, description="Subsystem context")
    structural_metadata: dict = Field(default_factory=dict, description="Docling structural metadata")


class ChunkWrapper:
    """
    SYNC service for wrapping chunks with coordinate-aware context.

    Pure string manipulation with no async operations or database calls.
    Designed for <1ms performance per chunk.
    """

    def wrap_chunks(
        self,
        chunks: list[DoclingChunk],
        summary: DocumentSummary,
        document_id: str
    ) -> list[ContextualizedChunk]:
        """
        Wrap all chunks with context metadata.

        Args:
            chunks: List of raw Docling chunks
            summary: Document summary with coordinate context
            document_id: Source document identifier

        Returns:
            List of contextualized chunks with metadata wrappers
        """
        logger.info(f"Wrapping {len(chunks)} chunks for document {document_id}")

        contextualized = []
        total_chunks = len(chunks)

        for chunk in chunks:
            wrapped = self.wrap_single_chunk(
                chunk=chunk,
                summary=summary,
                document_id=document_id,
                total_chunks=total_chunks
            )
            contextualized.append(wrapped)

        logger.info(f"Wrapped {len(contextualized)} chunks with coordinate context")
        return contextualized

    def wrap_single_chunk(
        self,
        chunk: DoclingChunk,
        summary: DocumentSummary,
        document_id: str,
        total_chunks: int
    ) -> ContextualizedChunk:
        """
        Wrap single chunk with context metadata.

        Args:
            chunk: Raw Docling chunk
            summary: Document summary
            document_id: Document identifier
            total_chunks: Total number of chunks in document

        Returns:
            Contextualized chunk with wrapped content
        """
        # Build context wrapper prefix
        context_prefix = self._build_context_prefix(
            summary=summary,
            chunk=chunk,
            chunk_position=chunk.chunk_index + 1,  # 1-based for readability
            total_chunks=total_chunks
        )

        # Combine prefix with original content
        wrapped_content = f"{context_prefix}\n\n{chunk.content}"

        # Extract structural metadata from Docling
        structural_metadata = {
            "heading_level": chunk.docling_metadata.heading_level,
            "section_title": chunk.docling_metadata.section_title,
            "reading_order": chunk.docling_metadata.reading_order,
            "table_index": chunk.docling_metadata.table_index,
            "page_number": chunk.docling_metadata.page_number,
            "chunk_type": chunk.docling_metadata.chunk_type,
        }

        return ContextualizedChunk(
            chunk_id=chunk.chunk_id,
            chunk_index=chunk.chunk_index,
            wrapped_content=wrapped_content,
            original_content=chunk.content,
            coordinate=summary.coordinate,
            document_id=document_id,
            subsystem_context=summary.subsystem_context,
            structural_metadata=structural_metadata
        )

    def _build_context_prefix(
        self,
        summary: DocumentSummary,
        chunk: DoclingChunk,
        chunk_position: int,
        total_chunks: int
    ) -> str:
        """
        Build context metadata prefix for chunk.

        Creates a compact, embedding-friendly prefix with coordinate,
        document summary, structural position, and themes.

        Args:
            summary: Document summary
            chunk: Docling chunk
            chunk_position: 1-based chunk position
            total_chunks: Total chunks in document

        Returns:
            Context prefix string
        """
        # Build structural position info
        position_info = f"[Chunk {chunk_position}/{total_chunks}"

        if chunk.docling_metadata.section_title:
            position_info += f" | Section: {chunk.docling_metadata.section_title}"

        if chunk.docling_metadata.page_number:
            position_info += f" | Page {chunk.docling_metadata.page_number}"

        position_info += "]"

        # Build coordinate context
        coordinate_context = f"Coordinate: {summary.coordinate}"
        if summary.subsystem_context:
            coordinate_context += f" ({summary.subsystem_context})"

        # Build themes context (first 3 themes for brevity)
        themes_context = ""
        if summary.key_themes:
            themes = summary.key_themes[:3]  # Limit to 3 for conciseness
            themes_context = f"Key Themes: {', '.join(themes)}"

        # Assemble prefix (compact format for embedding efficiency)
        prefix_parts = [
            position_info,
            coordinate_context,
        ]

        if themes_context:
            prefix_parts.append(themes_context)

        # Add brief summary (first 200 chars for context without overwhelming)
        if summary.summary_text:
            summary_snippet = summary.summary_text[:200]
            if len(summary.summary_text) > 200:
                summary_snippet += "..."
            prefix_parts.append(f"Document Context: {summary_snippet}")

        return "\n".join(prefix_parts)


# Global service instance
_chunk_wrapper = None


def get_chunk_wrapper() -> ChunkWrapper:
    """Get or create ChunkWrapper singleton"""
    global _chunk_wrapper
    if _chunk_wrapper is None:
        _chunk_wrapper = ChunkWrapper()
    return _chunk_wrapper
