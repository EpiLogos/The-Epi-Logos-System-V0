"""
MongoDB chunk persistence service for raw Docling chunks.

ASYNC service for storing raw Docling chunks in MongoDB doc_chunks collection
with indexes for fast retrieval by document_id and coordinate. Supports Story
08.09 deep analysis pipeline.
"""

import logging
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from backend.epi_logos_system.cag.docling.models import DoclingChunk
from shared.database.mongodb_client import MongoDBClient

logger = logging.getLogger(__name__)


class ChunkStorageDocument(BaseModel):
    """
    MongoDB document schema for doc_chunks collection.

    Matches schema specification from Story 08.03.
    """
    document_id: str = Field(..., description="Links to bimba_documents._id")
    coordinate: str = Field(..., description="Bimba coordinate from parent document")
    upload_timestamp: str = Field(..., description="ISO8601 timestamp")
    chunks: List[dict] = Field(..., description="Array of chunk objects with metadata")
    version: int = Field(1, description="Schema version for migrations")
    storage_metadata: dict = Field(..., description="Creation metadata")


class ChunkStoreService:
    """
    ASYNC MongoDB persistence for raw Docling chunks.

    Stores chunks in doc_chunks collection with indexes for fast retrieval.
    Links to bimba_documents via document_id and coordinate fields.
    """

    def __init__(self):
        """Initialize with MongoDB client"""
        self.client = MongoDBClient()
        self.collection_name = "doc_chunks"
        self._indexes_created = False
        logger.info("ChunkStoreService initialized")

    async def ensure_indexes(self):
        """
        Create MongoDB indexes for doc_chunks collection.

        Creates indexes as specified in Story 08.03:
        - document_id (fast lookup by document)
        - coordinate (fast lookup by coordinate)
        - upload_timestamp (recent documents first)
        - chunks.chunk_id (fast chunk retrieval for Story 08.09)
        """
        if self._indexes_created:
            return

        try:
            db = self.client.database
            collection = db[self.collection_name]

            # Create indexes (sync operations - MongoDB client is sync)
            collection.create_index([("document_id", 1)])
            collection.create_index([("coordinate", 1)])
            collection.create_index([("upload_timestamp", -1)])
            collection.create_index([("chunks.chunk_id", 1)])

            self._indexes_created = True
            logger.info("MongoDB indexes created for doc_chunks collection")

        except Exception as e:
            logger.error(f"Failed to create indexes: {e}")
            # Non-fatal - queries will still work, just slower

    async def save_raw_chunks(
        self,
        chunks: List[DoclingChunk],
        document_id: str,
        coordinate: str
    ) -> bool:
        """
        Save raw Docling chunks to MongoDB.

        Args:
            chunks: List of DoclingChunk objects
            document_id: Source document identifier
            coordinate: Bimba coordinate of document

        Returns:
            True if successful, False otherwise
        """
        try:
            # Ensure indexes exist
            await self.ensure_indexes()

            # Convert DoclingChunks to dict format for MongoDB
            chunk_dicts = []
            for chunk in chunks:
                chunk_dict = {
                    "chunk_id": chunk.chunk_id,
                    "chunk_index": chunk.chunk_index,
                    "content": chunk.content,
                    "docling_metadata": {
                        "heading_level": chunk.docling_metadata.heading_level,
                        "section_title": chunk.docling_metadata.section_title,
                        "reading_order": chunk.docling_metadata.reading_order,
                        "table_index": chunk.docling_metadata.table_index,
                        "page_number": chunk.docling_metadata.page_number,
                        "bbox": chunk.docling_metadata.bbox,
                        "chunk_type": chunk.docling_metadata.chunk_type,
                    }
                }
                chunk_dicts.append(chunk_dict)

            # Create storage document
            storage_doc = {
                "document_id": document_id,
                "coordinate": coordinate,
                "upload_timestamp": datetime.now(timezone.utc).isoformat(),
                "chunks": chunk_dicts,
                "version": 1,
                "storage_metadata": {
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "created_by": "pipeline_orchestrator",
                    "chunk_count": len(chunk_dicts)
                }
            }

            # Insert into MongoDB (async wrapper around sync operation)
            result = await self.client.insert_one(self.collection_name, storage_doc)

            logger.info(
                f"Saved {len(chunks)} raw chunks for document {document_id} "
                f"at coordinate {coordinate} (MongoDB ID: {result.inserted_id})"
            )

            return True

        except Exception as e:
            logger.error(f"Failed to save raw chunks for {document_id}: {e}")
            return False

    async def get_raw_chunks(
        self,
        document_id: str
    ) -> Optional[ChunkStorageDocument]:
        """
        Retrieve raw chunks for a document.

        Args:
            document_id: Document identifier

        Returns:
            ChunkStorageDocument or None if not found
        """
        try:
            doc = await self.client.find_one(self.collection_name, {"document_id": document_id})

            if not doc:
                logger.warning(f"No raw chunks found for document {document_id}")
                return None

            # Remove MongoDB _id field before converting to Pydantic
            doc.pop("_id", None)

            return ChunkStorageDocument(**doc)

        except Exception as e:
            logger.error(f"Failed to retrieve raw chunks for {document_id}: {e}")
            return None

    async def get_chunks_by_coordinate(
        self,
        coordinate: str,
        limit: int = 100
    ) -> List[ChunkStorageDocument]:
        """
        Retrieve all chunk documents for a coordinate.

        Args:
            coordinate: Bimba coordinate
            limit: Maximum number of documents to return

        Returns:
            List of ChunkStorageDocument objects
        """
        try:
            docs = await self.client.find(self.collection_name, {"coordinate": coordinate}, limit=limit)

            results = []
            for doc in docs:
                doc.pop("_id", None)
                results.append(ChunkStorageDocument(**doc))

            logger.info(f"Retrieved {len(results)} chunk documents for coordinate {coordinate}")
            return results

        except Exception as e:
            logger.error(f"Failed to retrieve chunks by coordinate {coordinate}: {e}")
            return []


# Global service instance
_chunk_store = None


def get_chunk_store() -> ChunkStoreService:
    """Get or create ChunkStoreService singleton"""
    global _chunk_store
    if _chunk_store is None:
        _chunk_store = ChunkStoreService()
    return _chunk_store
