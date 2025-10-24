"""
Structured chunk extraction from Docling output.

Parses result.document.export_to_dict() to extract chunks with
hierarchical metadata (headings, sections, tables, reading order).
"""

import logging
from typing import List, Dict, Any, Optional

from backend.epi_logos_system.cag.docling.models import (
    DoclingChunk,
    DoclingMetadata,
    DoclingDocument,
)

logger = logging.getLogger(__name__)


class ChunkExtractor:
    """
    Extract structured chunks from Docling ConversionResult.

    Parses export_to_dict() output to create DoclingChunk objects
    with preserved hierarchical metadata.
    """

    def extract_chunks(self, docling_doc: DoclingDocument) -> List[DoclingChunk]:
        """
        Extract chunks from Docling conversion result.

        Args:
            docling_doc: DoclingDocument with _raw_result attribute

        Returns:
            List of DoclingChunk objects with hierarchical metadata

        Raises:
            ValueError: If raw result not found or export fails
        """
        if not hasattr(docling_doc, '_raw_result'):
            raise ValueError("DoclingDocument missing _raw_result attribute")

        try:
            raw_result = docling_doc._raw_result

            # Export Docling document to structured dict
            doc_dict = raw_result.document.export_to_dict()

            logger.info(f"Extracting chunks from Docling dict: {type(doc_dict)}")

            # Parse chunks from dict structure
            chunks = self._parse_chunks_from_dict(doc_dict)

            logger.info(f"Extracted {len(chunks)} chunks from document")

            return chunks

        except AttributeError as e:
            logger.error(f"Docling result missing expected attributes: {e}")
            raise ValueError(f"Invalid Docling result structure: {str(e)}") from e
        except Exception as e:
            logger.error(f"Chunk extraction failed: {e}")
            raise ValueError(f"Failed to extract chunks: {str(e)}") from e

    def _parse_chunks_from_dict(self, doc_dict: Dict[str, Any]) -> List[DoclingChunk]:
        """
        Parse chunks from Docling export_to_dict() output.

        The dict structure varies by Docling version, but typically contains:
        - 'body': List of document elements (paragraphs, headings, tables, etc.)
        - 'metadata': Document-level metadata
        - 'pages': Page-level information

        Args:
            doc_dict: Dictionary from export_to_dict()

        Returns:
            List of DoclingChunk objects
        """
        chunks = []
        chunk_index = 0

        # Docling 2.57 uses reference-based structure:
        # - body['children'] contains references like {'$ref': '#/texts/11'}
        # - texts array contains actual content elements
        # Always try texts array first (source of truth for markdown and structured docs)
        body_elements = doc_dict.get('texts', [])

        if body_elements:
            logger.info(f"Using texts array: {len(body_elements)} text elements")
        else:
            # Fallback for older Docling versions or other formats
            body = doc_dict.get('body')
            if isinstance(body, list):
                body_elements = body
                logger.info(f"Using body list structure: {len(body_elements)} elements")
            else:
                body_elements = doc_dict.get('elements', [])
                logger.warning(f"Using elements fallback: {len(body_elements)} elements")

        # Track current section context
        current_section = None
        current_heading_level = None

        for reading_order, element in enumerate(body_elements):
            chunk = self._parse_element(
                element=element,
                chunk_index=chunk_index,
                reading_order=reading_order,
                current_section=current_section,
                current_heading_level=current_heading_level
            )

            if chunk:
                chunks.append(chunk)
                chunk_index += 1

                # Update section context if this is a heading
                if chunk.docling_metadata.heading_level:
                    current_section = chunk.content
                    current_heading_level = chunk.docling_metadata.heading_level

        return chunks

    def _parse_element(
        self,
        element: Dict[str, Any],
        chunk_index: int,
        reading_order: int,
        current_section: Optional[str],
        current_heading_level: Optional[int]
    ) -> Optional[DoclingChunk]:
        """
        Parse a single Docling element into a DoclingChunk.

        Args:
            element: Element dict from Docling body
            chunk_index: Sequential chunk index
            reading_order: Reading order position
            current_section: Current section title context
            current_heading_level: Current heading level context

        Returns:
            DoclingChunk or None if element should be skipped
        """
        # Extract content text
        content = element.get('text', '').strip()
        if not content:
            return None  # Skip empty elements

        # Determine element type - Docling 2.57 markdown uses 'label' instead of 'type'
        element_type = element.get('type') or element.get('label', 'text')
        element_type = str(element_type).lower()

        # Extract metadata based on element type
        metadata = DoclingMetadata(
            heading_level=self._extract_heading_level(element, element_type),
            section_title=current_section,
            reading_order=reading_order,
            table_index=self._extract_table_index(element, element_type),
            page_number=self._extract_page_number(element),
            bbox=self._extract_bbox(element.get('prov')),
            chunk_type=element_type
        )

        return DoclingChunk(
            chunk_index=chunk_index,
            content=content,
            docling_metadata=metadata
        )

    def _extract_heading_level(self, element: Dict[str, Any], element_type: str) -> Optional[int]:
        """Extract heading level from element"""
        if 'heading' in element_type or 'title' in element_type:
            # Try to extract level from type (e.g., "heading-1", "h1")
            if 'level' in element:
                return element['level']
            # Parse from type string
            for i in range(1, 7):
                if str(i) in element_type:
                    return i
            return 1  # Default to h1 if unclear
        return None

    def _extract_table_index(self, element: Dict[str, Any], element_type: str) -> Optional[int]:
        """Extract table index if element is table"""
        if 'table' in element_type:
            return element.get('table_index') or element.get('index')
        return None

    def _extract_page_number(self, element: Dict[str, Any]) -> Optional[int]:
        """
        Extract page number from element provenance.

        Handles both dict and list prov structures.
        Markdown files have empty list, PDFs have dict with page_no.

        Args:
            element: Element dict from Docling

        Returns:
            Page number or None
        """
        prov = element.get('prov')

        # PDF/DOCX structure: prov is dict
        if isinstance(prov, dict):
            return prov.get('page_no')

        # Markdown structure: prov is list (usually empty)
        if isinstance(prov, list) and len(prov) > 0:
            # If list has items, try first item
            first_item = prov[0]
            if isinstance(first_item, dict):
                return first_item.get('page_no')

        return None

    def _extract_bbox(self, prov: Any) -> Optional[List[float]]:
        """
        Extract bounding box coordinates from provenance.

        Handles both dict and list prov structures.
        Markdown files typically have no bbox, PDFs/images do.

        Args:
            prov: Provenance data (dict, list, or None)

        Returns:
            Bounding box [x, y, width, height] or None
        """
        if isinstance(prov, dict):
            bbox = prov.get('bbox')
            if bbox and isinstance(bbox, list) and len(bbox) == 4:
                return bbox

        if isinstance(prov, list) and len(prov) > 0:
            first_item = prov[0]
            if isinstance(first_item, dict):
                bbox = first_item.get('bbox')
                if bbox and isinstance(bbox, list) and len(bbox) == 4:
                    return bbox

        return None
