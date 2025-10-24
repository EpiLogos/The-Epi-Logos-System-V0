"""
Document service for managing Bimba and Pratibimba documents in MongoDB.

Handles file uploads, metadata management, and collection routing.
Supports null collection handling and dual collection architecture.
"""

import logging
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from bson import ObjectId

from shared.database.mongodb_client import MongoDBClient

logger = logging.getLogger(__name__)


class DocumentMetadata(BaseModel):
    """Metadata for uploaded documents"""
    coordinate: str = Field(..., description="Bimba coordinate (e.g., #5-0)")
    subsystem: Optional[int] = Field(None, description="Subsystem number (0-5)")
    uploader_id: str = Field(..., description="User ID of uploader")
    uploader_email: str = Field(..., description="Email of uploader")
    title: Optional[str] = Field(None, description="Document title")
    description: Optional[str] = Field(None, description="Document description")
    tags: List[str] = Field(default_factory=list, description="Document tags")


class DocumentRecord(BaseModel):
    """MongoDB document record schema"""
    id: Optional[str] = Field(None, alias="_id", description="MongoDB ObjectId as string")
    filename: str = Field(..., description="Original filename")
    file_type: str = Field(..., description="File extension (pdf, md, docx, etc)")
    file_size: int = Field(..., description="File size in bytes")
    coordinate: str = Field(..., description="Bimba coordinate")
    subsystem: Optional[int] = Field(None, description="Subsystem number")
    collection_type: Literal["bimba", "pratibimba"] = Field("bimba", description="Collection type")

    # File storage
    file_path: Optional[str] = Field(None, description="File system path (if stored locally)")
    content: Optional[str] = Field(None, description="Text content (for small files/markdown)")

    # Metadata
    title: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    writer_notes: Optional[str] = Field(None, description="Contextual notes about document purpose and usage")
    development_content: Optional[str] = Field(None, description="Development lifecycle context (fresh vs stale)")

    # Timestamps and user tracking
    upload_timestamp: str = Field(..., description="ISO8601 timestamp")
    uploader_id: str = Field(..., description="User ID")
    uploader_email: str = Field(..., description="User email")

    # Processing status
    processing_status: str = Field("pending", description="pending, processing, completed, failed")
    pipeline_triggered: bool = Field(False, description="Whether preprocessing pipeline was triggered")

    # Version control
    version: int = Field(1, description="Schema version")

    class Config:
        populate_by_name = True  # Allow both 'id' and '_id'
        json_encoders = {
            ObjectId: str
        }


class DocumentService:
    """
    Service for managing document uploads and retrieval.

    Handles both bimba_documents and pratibimba_documents collections.
    Supports null collection handling - creates collections on first write.
    """

    def __init__(self):
        """Initialize with MongoDB client"""
        self.client = MongoDBClient()
        self.bimba_collection_name = "bimba_documents"
        self.pratibimba_collection_name = "pratibimba_documents"
        self._indexes_created = {"bimba": False, "pratibimba": False}
        logger.info("DocumentService initialized")

    def _get_collection(self, collection_type: Literal["bimba", "pratibimba"]):
        """
        Get MongoDB collection with null handling.

        Creates collection if it doesn't exist.
        """
        collection_name = (
            self.bimba_collection_name
            if collection_type == "bimba"
            else self.pratibimba_collection_name
        )

        db = self.client.database

        # MongoDB creates collection automatically on first insert
        # But we can check if it exists for logging purposes
        existing_collections = db.list_collection_names()
        if collection_name not in existing_collections:
            logger.info(f"Collection {collection_name} will be created on first insert")

        return db[collection_name]

    async def ensure_indexes(self, collection_type: Literal["bimba", "pratibimba"]):
        """
        Create MongoDB indexes for document collections.

        Indexes:
        - coordinate (lookup by coordinate)
        - uploader_id (lookup by user)
        - upload_timestamp (recent documents)
        - processing_status (filter by status)
        """
        if self._indexes_created[collection_type]:
            return

        try:
            collection = self._get_collection(collection_type)

            # Create indexes (sync operations - MongoDB client is sync)
            collection.create_index([("coordinate", 1)])
            collection.create_index([("uploader_id", 1)])
            collection.create_index([("upload_timestamp", -1)])
            collection.create_index([("processing_status", 1)])

            self._indexes_created[collection_type] = True
            logger.info(f"MongoDB indexes created for {collection_type}_documents collection")

        except Exception as e:
            logger.error(f"Failed to create indexes for {collection_type}: {e}")
            # Non-fatal - queries will still work, just slower

    async def create_document(
        self,
        filename: str,
        file_type: str,
        file_size: int,
        metadata: DocumentMetadata,
        collection_type: Literal["bimba", "pratibimba"] = "bimba",
        file_path: Optional[str] = None,
        content: Optional[str] = None
    ) -> DocumentRecord:
        """
        Create new document record in MongoDB.

        Args:
            filename: Original filename
            file_type: File extension
            file_size: File size in bytes
            metadata: Document metadata
            collection_type: Target collection (bimba or pratibimba)
            file_path: Optional file system path
            content: Optional text content (for markdown, small files)

        Returns:
            DocumentRecord with MongoDB _id
        """
        # Ensure indexes exist
        await self.ensure_indexes(collection_type)

        # Create document record
        doc = DocumentRecord(
            filename=filename,
            file_type=file_type,
            file_size=file_size,
            coordinate=metadata.coordinate,
            subsystem=metadata.subsystem,
            collection_type=collection_type,
            file_path=file_path,
            content=content,
            title=metadata.title,
            description=metadata.description,
            tags=metadata.tags,
            upload_timestamp=datetime.now(timezone.utc).isoformat(),
            uploader_id=metadata.uploader_id,
            uploader_email=metadata.uploader_email,
            processing_status="pending",
            pipeline_triggered=False,
            version=1
        )

        # Convert to dict and remove _id if None
        doc_dict = doc.model_dump(exclude_none=True, exclude={"_id"})

        # Insert into collection
        collection = self._get_collection(collection_type)
        result = collection.insert_one(doc_dict)

        # Update with MongoDB id
        doc.id = str(result.inserted_id)

        logger.info(
            f"Document created: {filename} in {collection_type}_documents "
            f"(coordinate: {metadata.coordinate}, id: {doc.id})"
        )

        return doc

    async def get_document(
        self,
        document_id: str,
        collection_type: Literal["bimba", "pratibimba"] = "bimba"
    ) -> Optional[DocumentRecord]:
        """Get document by ID"""
        try:
            collection = self._get_collection(collection_type)
            doc = collection.find_one({"_id": ObjectId(document_id)})

            if not doc:
                return None

            # Convert ObjectId to string
            doc["_id"] = str(doc["_id"])

            return DocumentRecord(**doc)

        except Exception as e:
            logger.error(f"Failed to get document {document_id}: {e}")
            return None

    async def list_documents(
        self,
        collection_type: Literal["bimba", "pratibimba"] = "bimba",
        coordinate: Optional[str] = None,
        uploader_id: Optional[str] = None,
        limit: int = 100
    ) -> List[DocumentRecord]:
        """
        List documents with optional filtering.

        Args:
            collection_type: Collection to query
            coordinate: Filter by coordinate
            uploader_id: Filter by uploader
            limit: Max results
        """
        try:
            collection = self._get_collection(collection_type)

            # Build query filter
            query = {}
            if coordinate:
                query["coordinate"] = coordinate
            if uploader_id:
                query["uploader_id"] = uploader_id

            # Execute query with limit
            cursor = collection.find(query).sort("upload_timestamp", -1).limit(limit)

            # Convert to DocumentRecord objects
            documents = []
            for doc in cursor:
                doc["_id"] = str(doc["_id"])
                documents.append(DocumentRecord(**doc))

            return documents

        except Exception as e:
            logger.error(f"Failed to list documents: {e}")
            return []

    async def update_processing_status(
        self,
        document_id: str,
        status: str,
        collection_type: Literal["bimba", "pratibimba"] = "bimba",
        pipeline_triggered: bool = False
    ) -> bool:
        """Update document processing status"""
        try:
            collection = self._get_collection(collection_type)

            update = {
                "$set": {
                    "processing_status": status,
                    "pipeline_triggered": pipeline_triggered
                }
            }

            result = collection.update_one(
                {"_id": ObjectId(document_id)},
                update
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Failed to update document {document_id}: {e}")
            return False

    async def update_document(
        self,
        document_id: str,
        updates: Dict[str, Any],
        collection_type: Literal["bimba", "pratibimba"] = "bimba"
    ) -> Optional[DocumentRecord]:
        """
        Update document with arbitrary fields.

        Args:
            document_id: MongoDB ObjectId
            updates: Dictionary of fields to update
            collection_type: Collection to update

        Returns:
            Updated DocumentRecord or None if update failed
        """
        try:
            collection = self._get_collection(collection_type)

            # Remove _id from updates if present (can't update _id)
            updates = {k: v for k, v in updates.items() if k not in ["_id", "id"]}

            if not updates:
                logger.warning(f"No valid fields to update for document {document_id}")
                return await self.get_document(document_id, collection_type)

            # Perform update
            result = collection.update_one(
                {"_id": ObjectId(document_id)},
                {"$set": updates}
            )

            if result.matched_count == 0:
                logger.error(f"Document {document_id} not found in {collection_type}_documents")
                return None

            # Return updated document
            return await self.get_document(document_id, collection_type)

        except Exception as e:
            logger.error(f"Failed to update document {document_id}: {e}")
            return None

    async def get_all_documents_for_tree(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get all documents from both collections for coordinate tree.

        Returns minimal data for tree building:
        - _id, filename, coordinate, title, upload_timestamp

        Returns:
            {"bimba": [...], "pratibimba": [...]}
        """
        try:
            result = {"bimba": [], "pratibimba": []}

            for coll_type in ["bimba", "pratibimba"]:
                collection = self._get_collection(coll_type)

                # Project only needed fields
                cursor = collection.find(
                    {},
                    {
                        "_id": 1,
                        "filename": 1,
                        "coordinate": 1,
                        "title": 1,
                        "upload_timestamp": 1,
                        "file_type": 1,
                        "content": 1,  # Include content for document viewer
                        "processing_status": 1  # Include processing status
                    }
                ).sort("upload_timestamp", -1)

                docs = []
                for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    docs.append(doc)

                result[coll_type] = docs

            logger.info(
                f"Retrieved {len(result['bimba'])} bimba docs, "
                f"{len(result['pratibimba'])} pratibimba docs for tree"
            )

            return result

        except Exception as e:
            logger.error(f"Failed to get documents for tree: {e}")
            return {"bimba": [], "pratibimba": []}


# Singleton instance
_document_service: Optional[DocumentService] = None


def get_document_service() -> DocumentService:
    """Get or create singleton DocumentService instance"""
    global _document_service
    if _document_service is None:
        _document_service = DocumentService()
    return _document_service
