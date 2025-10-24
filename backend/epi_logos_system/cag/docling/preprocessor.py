"""
Docling DocumentConverter wrapper for format detection and conversion.

Provides SYNC document preprocessing using Docling 2.57.0 API.
Handles PDF, DOCX, PPTX, XLSX, HTML formats with automatic detection.
"""

import logging
from typing import Optional
from pathlib import Path

from docling.document_converter import DocumentConverter
from backend.epi_logos_system.cag.docling.models import (
    DoclingDocument,
    ConversionStatus,
)

logger = logging.getLogger(__name__)


class DocumentPreprocessor:
    """
    Synchronous document preprocessing using Docling DocumentConverter.

    Note: Docling is inherently synchronous (no async support).
    Use asyncio.to_thread() in pipeline orchestrator for async integration.
    """

    def __init__(self):
        """Initialize DocumentConverter"""
        self.converter = DocumentConverter()
        logger.info("DocumentPreprocessor initialized with Docling 2.57.0")

    def preprocess(
        self,
        source_path: str,
        document_id: str
    ) -> DoclingDocument:
        """
        Preprocess document using Docling converter.

        Args:
            source_path: File path or URL to document
            document_id: Unique document identifier

        Returns:
            DoclingDocument with conversion status and extracted data

        Raises:
            FileNotFoundError: If source path doesn't exist
            ValueError: If format is unsupported
        """
        try:
            # Validate source exists
            if not source_path.startswith("http"):
                if not Path(source_path).exists():
                    raise FileNotFoundError(f"Source document not found: {source_path}")

            logger.info(f"Starting Docling conversion for: {source_path}")

            # Convert document (SYNC operation)
            result = self.converter.convert(source_path)

            # Map Docling status to our enum
            status = self._map_status(result.status)

            # Extract conversion errors if any
            conversion_errors = []
            if hasattr(result, 'errors') and result.errors:
                conversion_errors = [str(err) for err in result.errors]

            # Extract timing info
            timing_ms = None
            if hasattr(result, 'timings') and result.timings:
                timing_ms = sum(result.timings.values()) * 1000  # Convert to ms

            # Get total pages
            total_pages = len(result.pages) if hasattr(result, 'pages') else None

            # Create DoclingDocument (chunks will be extracted separately)
            doc = DoclingDocument(
                document_id=document_id,
                source_path=source_path,
                status=status,
                chunks=[],  # Populated by ChunkExtractor
                total_pages=total_pages,
                conversion_errors=conversion_errors,
                timing_ms=timing_ms
            )

            # Store raw Docling result for chunk extraction
            doc._raw_result = result  # Private attribute for chunk extractor

            # Log conversion result (0 pages is valid for markdown files)
            logger.info(
                f"Docling conversion complete: status={status}, "
                f"pages={total_pages} (0 valid for markdown), timing={timing_ms}ms"
            )

            # Handle conversion failures - only check status, not page count
            if status != ConversionStatus.SUCCESS and status != ConversionStatus.PARTIAL_SUCCESS:
                error_msg = ", ".join(conversion_errors) if conversion_errors else "Unknown error"
                raise ValueError(f"Docling conversion failed: {error_msg}")

            if status == ConversionStatus.PARTIAL_SUCCESS:
                logger.warning(
                    f"Partial conversion success with errors: {conversion_errors}"
                )

            return doc

        except FileNotFoundError:
            raise
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error in Docling preprocessing: {e}")
            raise ValueError(f"Document preprocessing failed: {str(e)}") from e

    def _map_status(self, docling_status: str) -> ConversionStatus:
        """
        Map Docling status string to ConversionStatus enum.

        Args:
            docling_status: Status from Docling ConversionResult

        Returns:
            Mapped ConversionStatus enum value
        """
        status_map = {
            "PENDING": ConversionStatus.PENDING,
            "SUCCESS": ConversionStatus.SUCCESS,
            "PARTIAL_SUCCESS": ConversionStatus.PARTIAL_SUCCESS,
            "FAILURE": ConversionStatus.FAILURE,
        }

        status_upper = docling_status.name.upper()
        return status_map.get(status_upper, ConversionStatus.FAILURE)
