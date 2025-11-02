"""
Async pipeline orchestrator for Docling → LightRAG ingestion.

Coordinates SYNC Docling preprocessing with ASYNC summary generation,
context wrapping, LightRAG ingestion, MongoDB storage, and Redis tracking.
Implements pattern from Story 08.03 Dev Notes.
"""

import logging
import asyncio
import os
from typing import Optional, Dict, Any
from enum import Enum

from backend.epi_logos_system.cag.docling.preprocessor import DocumentPreprocessor
from backend.epi_logos_system.cag.docling.chunk_extractor import ChunkExtractor
from backend.epi_logos_system.cag.lightrag.summary_service import get_summary_service
from backend.epi_logos_system.cag.lightrag.chunk_wrapper import get_chunk_wrapper
from backend.epi_logos_system.cag.lightrag.chunk_store import get_chunk_store
from backend.epi_logos_system.cag.lightrag.document_operations import DocumentIngestionPipeline
from shared.database.redis_client import RedisClient

logger = logging.getLogger(__name__)


class PipelineStatus(str, Enum):
    """Pipeline execution status stages"""
    PREPROCESSING = "preprocessing"
    SUMMARIZING = "summarizing"
    WRAPPING = "wrapping"
    INGESTING = "ingesting"
    STORING = "storing"
    COMPLETE = "complete"
    FAILED = "failed"


class PipelineOrchestrator:
    """
    ASYNC coordinator for document preprocessing and ingestion pipeline.

    Implements the async/sync pattern from Story 08.03:
    1. SYNC Docling preprocessing (via asyncio.to_thread)
    2. ASYNC summary generation (Gemini LLM call)
    3. SYNC context wrapping (string manipulation)
    4. ASYNC LightRAG ingestion (Neo4j + Qdrant writes)
    5. ASYNC MongoDB chunk storage
    6. SYNC Redis status updates
    """

    def __init__(self):
        """Initialize pipeline components"""
        self.preprocessor = DocumentPreprocessor()
        self.chunk_extractor = ChunkExtractor()
        self.summary_service = get_summary_service()
        self.chunk_wrapper = get_chunk_wrapper()
        self.chunk_store = get_chunk_store()
        self.lightrag_pipeline = DocumentIngestionPipeline()
        self.redis_client = RedisClient()
        logger.info("PipelineOrchestrator initialized")

    async def process_document(
        self,
        source_path: str,
        document_id: str,
        coordinate: str,
        subsystem: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Execute complete document processing pipeline.

        Args:
            source_path: Path to source document
            document_id: Unique document identifier
            coordinate: Bimba coordinate (e.g., "#4.2")
            subsystem: Subsystem number (0-5) for context

        Returns:
            Pipeline result with success status and metrics
        """
        try:
            # Initialize Redis tracking
            self._update_status(document_id, PipelineStatus.PREPROCESSING, 0)

            # Validate source file exists before processing
            if not os.path.exists(source_path):
                error_msg = f"Source document not found: {source_path}. File may have been deleted from temporary storage."
                logger.error(error_msg)
                raise FileNotFoundError(error_msg)

            # Step 1: SYNC Docling preprocessing (run in thread pool)
            logger.info(f"Starting pipeline for document {document_id} at {coordinate}")
            docling_doc = await asyncio.to_thread(
                self.preprocessor.preprocess,
                source_path,
                document_id
            )

            # Extract chunks from Docling result
            chunks = self.chunk_extractor.extract_chunks(docling_doc)
            logger.info(f"Extracted {len(chunks)} chunks from document")

            self._update_status(document_id, PipelineStatus.SUMMARIZING, 20)

            # Step 2: ASYNC summary generation
            # Use first 5 chunks or ~4000 chars for summary context
            summary_content = self._prepare_summary_content(chunks)
            summary = await self.summary_service.generate_summary(
                document_content=summary_content,
                document_id=document_id,
                coordinate=coordinate,
                subsystem=subsystem
            )

            self._update_status(document_id, PipelineStatus.WRAPPING, 40)

            # Step 3: SYNC context wrapping
            wrapped_chunks = self.chunk_wrapper.wrap_chunks(
                chunks=chunks,
                summary=summary,
                document_id=document_id
            )

            self._update_status(document_id, PipelineStatus.INGESTING, 60)

            # Step 4: ASYNC LightRAG ingestion
            # Combine all wrapped chunks for LightRAG ingestion
            combined_content = "\n\n".join(
                chunk.wrapped_content for chunk in wrapped_chunks
            )

            ingestion_result = await self.lightrag_pipeline.ingest_document(
                content=combined_content,
                source_id=document_id,
                source_coordinate=coordinate,
                namespace="gnostic",
                ontological_level=subsystem or 4
            )

            if not ingestion_result.get("success"):
                raise ValueError(f"LightRAG ingestion failed: {ingestion_result.get('error')}")

            self._update_status(document_id, PipelineStatus.STORING, 80)

            # Step 5: ASYNC MongoDB raw chunk storage
            storage_success = await self.chunk_store.save_raw_chunks(
                chunks=chunks,
                document_id=document_id,
                coordinate=coordinate
            )

            if not storage_success:
                logger.warning(f"Raw chunk storage failed for {document_id}")

            # Step 6: SYNC Redis status update - COMPLETE
            self._update_status(document_id, PipelineStatus.COMPLETE, 100)

            result = {
                "success": True,
                "document_id": document_id,
                "coordinate": coordinate,
                "chunks_processed": len(chunks),
                "summary_length": len(summary.summary_text),
                "lightrag_success": ingestion_result.get("success"),
                "storage_success": storage_success
            }

            logger.info(f"Pipeline completed successfully for document {document_id}")
            return result

        except Exception as e:
            logger.error(f"Pipeline failed for document {document_id}: {e}")
            self._update_error(document_id, str(e))
            return {
                "success": False,
                "document_id": document_id,
                "error": str(e)
            }

    def _prepare_summary_content(self, chunks: list, max_chars: int = 4000) -> str:
        """
        Prepare content for summary generation.

        Uses first N chunks up to max_chars limit for context.
        Skips YAML frontmatter chunks to avoid Gemini safety filter rejection.

        Args:
            chunks: List of DoclingChunk objects
            max_chars: Maximum characters for summary context

        Returns:
            Combined content string with YAML frontmatter filtered out
        """
        content_parts = []
        total_length = 0
        yaml_frontmatter_ended = False

        for chunk in chunks:
            chunk_content = chunk.content.strip()

            # Skip YAML frontmatter chunks (triggers Gemini safety filters)
            if not yaml_frontmatter_ended:
                # Check if this looks like YAML (key: value format without markdown heading)
                if ':' in chunk_content and not chunk_content.startswith('#'):
                    # Likely YAML metadata - skip it
                    continue
                elif chunk_content == '---':
                    # YAML frontmatter delimiter - skip it
                    continue
                elif not chunk_content:
                    # Empty chunk - skip it
                    continue
                else:
                    # First real content chunk found
                    yaml_frontmatter_ended = True

            # Skip empty chunks
            if not chunk_content:
                continue

            chunk_length = len(chunk_content)
            if total_length + chunk_length > max_chars:
                break
            content_parts.append(chunk_content)
            total_length += chunk_length

        return "\n\n".join(content_parts)

    def _update_status(
        self,
        document_id: str,
        status: PipelineStatus,
        progress: int
    ):
        """
        Update pipeline status in Redis (SYNC operation).

        Args:
            document_id: Document identifier
            status: Current pipeline status
            progress: Progress percentage (0-100)
        """
        try:
            self.redis_client.set(f"pipeline:{document_id}:status", status.value)
            self.redis_client.set(f"pipeline:{document_id}:progress", str(progress))
            logger.debug(f"Pipeline status updated: {document_id} -> {status.value} ({progress}%)")
        except Exception as e:
            logger.error(f"Failed to update Redis status for {document_id}: {e}")

    def _update_error(self, document_id: str, error_message: str):
        """
        Update pipeline with error status (SYNC operation).

        Args:
            document_id: Document identifier
            error_message: Error message
        """
        try:
            self.redis_client.set(f"pipeline:{document_id}:status", PipelineStatus.FAILED.value)
            self.redis_client.set(f"pipeline:{document_id}:error", error_message)
            logger.error(f"Pipeline error recorded: {document_id} -> {error_message}")
        except Exception as e:
            logger.error(f"Failed to update Redis error for {document_id}: {e}")

    def get_pipeline_status(self, document_id: str) -> Dict[str, Any]:
        """
        Get current pipeline status from Redis (SYNC operation).

        Args:
            document_id: Document identifier

        Returns:
            Status dictionary with status, progress, and error fields
        """
        try:
            status = self.redis_client.get(f"pipeline:{document_id}:status")
            progress = self.redis_client.get(f"pipeline:{document_id}:progress")
            error = self.redis_client.get(f"pipeline:{document_id}:error")

            return {
                "status": status or "unknown",
                "progress": int(progress) if progress else 0,
                "error": error
            }
        except Exception as e:
            logger.error(f"Failed to get pipeline status for {document_id}: {e}")
            return {"status": "error", "progress": 0, "error": str(e)}


# Global orchestrator instance
_orchestrator = None


def get_pipeline_orchestrator() -> PipelineOrchestrator:
    """Get or create PipelineOrchestrator singleton"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = PipelineOrchestrator()
    return _orchestrator
