"""
FastAPI endpoints for document upload and management.

Handles file uploads to bimba_documents and pratibimba_documents collections.
Supports preprocessing pipeline trigger for Story 08.03.
"""

import logging
import os
from typing import Optional, Literal, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
from bson import ObjectId

from .service import get_document_service, DocumentService, DocumentMetadata, DocumentRecord
from backend.epi_logos_system.auth.api import get_current_user
from backend.epi_logos_system.cag.lightrag.pipeline_orchestrator import get_pipeline_orchestrator

logger = logging.getLogger(__name__)

# Router for document endpoints
router = APIRouter(prefix="/api/documents", tags=["documents"])

# File upload directory (configurable via env)
UPLOAD_DIR = os.getenv("DOCUMENT_UPLOAD_DIR", "/tmp/epi_logos_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class UploadResponse(BaseModel):
    """Response model for document upload"""
    success: bool
    document_id: Optional[str] = None
    filename: Optional[str] = None
    coordinate: Optional[str] = None
    collection_type: Optional[str] = None
    pipeline_triggered: Optional[bool] = None
    message: Optional[str] = None
    error: Optional[str] = None


class DocumentListResponse(BaseModel):
    """Response model for document listing"""
    success: bool
    bimba_documents: List[dict]
    pratibimba_documents: List[dict]
    error: Optional[str] = None


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    coordinate: str = Form(...),
    collection_type: Literal["bimba", "pratibimba"] = Form("bimba"),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    subsystem: Optional[int] = Form(None),
    trigger_pipeline: bool = Form(False),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload document to MongoDB collection.

    Args:
        file: Uploaded file (PDF, DOCX, MD, TXT, etc.)
        coordinate: Bimba coordinate (e.g., #5-0)
        collection_type: Target collection (bimba or pratibimba, default: bimba)
        title: Optional document title (defaults to filename)
        description: Optional description
        subsystem: Optional subsystem number (0-5)
        trigger_pipeline: Whether to trigger Docling preprocessing pipeline
        current_user: Authenticated user (from JWT)

    Returns:
        UploadResponse with document_id and processing status

    Admin-only: Only users with is_admin=True can upload documents.
    """
    try:
        # Check admin permission
        if not current_user.isAdmin:
            raise HTTPException(
                status_code=403,
                detail="Admin permission required for document upload"
            )

        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")

        # Extract file extension
        file_extension = os.path.splitext(file.filename)[1].lstrip(".")
        if not file_extension:
            file_extension = "unknown"

        # Read file content
        content = await file.read()
        file_size = len(content)

        # Save file to disk for preprocessing
        file_path = os.path.join(UPLOAD_DIR, f"{coordinate.replace('#', '')}_{file.filename}")
        with open(file_path, "wb") as f:
            f.write(content)

        logger.info(f"File saved to: {file_path} ({file_size} bytes)")

        # For markdown/text files, store content in MongoDB
        text_content = None
        if file_extension in ["md", "txt"]:
            try:
                text_content = content.decode("utf-8")
            except UnicodeDecodeError:
                logger.warning(f"Failed to decode {file.filename} as UTF-8")

        # Create metadata
        metadata = DocumentMetadata(
            coordinate=coordinate,
            subsystem=subsystem,
            uploader_id=str(current_user.id),  # Convert ObjectId to string
            uploader_email=current_user.email,
            title=title or file.filename,
            description=description,
            tags=[]
        )

        # Create document record
        service = get_document_service()
        doc_record = await service.create_document(
            filename=file.filename,
            file_type=file_extension,
            file_size=file_size,
            metadata=metadata,
            collection_type=collection_type,
            file_path=file_path,
            content=text_content
        )

        # Trigger preprocessing pipeline if requested (only for processable file types)
        pipeline_triggered = False
        processable_types = ["pdf", "docx", "pptx", "xlsx", "html", "md", "txt"]

        if trigger_pipeline and file_extension in processable_types:
            try:
                orchestrator = get_pipeline_orchestrator()

                # Trigger async pipeline (non-blocking)
                await orchestrator.process_document(
                    source_path=file_path,
                    document_id=doc_record.id,
                    coordinate=coordinate,
                    subsystem=subsystem
                )

                # Update document status
                await service.update_processing_status(
                    document_id=doc_record.id,
                    status="processing",
                    collection_type=collection_type,
                    pipeline_triggered=True
                )

                pipeline_triggered = True
                logger.info(f"Preprocessing pipeline triggered for document {doc_record.id}")

            except Exception as pipeline_error:
                logger.error(f"Pipeline trigger failed: {pipeline_error}")
                # Don't fail upload if pipeline fails - document is still saved

        return UploadResponse(
            success=True,
            document_id=doc_record.id,
            filename=file.filename,
            coordinate=coordinate,
            collection_type=collection_type,
            pipeline_triggered=pipeline_triggered,
            message=f"Document uploaded successfully to {collection_type}_documents"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document upload failed: {e}", exc_info=True)
        return UploadResponse(
            success=False,
            error=str(e)
        )


@router.get("/list", response_model=DocumentListResponse)
async def list_all_documents(
    coordinate: Optional[str] = None
):
    """
    List all documents from both collections.

    Returns documents from bimba_documents and pratibimba_documents.
    Used by Archive page coordinate tree.

    Public endpoint - documents are publicly readable.
    Only uploads require admin authentication.

    Args:
        coordinate: Optional filter by coordinate

    Returns:
        {"bimba_documents": [...], "pratibimba_documents": [...]}
    """
    try:
        service = get_document_service()

        if coordinate:
            # Filter by coordinate
            bimba_docs = await service.list_documents(
                collection_type="bimba",
                coordinate=coordinate
            )
            pratibimba_docs = await service.list_documents(
                collection_type="pratibimba",
                coordinate=coordinate
            )

            return DocumentListResponse(
                success=True,
                bimba_documents=[doc.model_dump() for doc in bimba_docs],
                pratibimba_documents=[doc.model_dump() for doc in pratibimba_docs]
            )
        else:
            # Get all documents (minimal data for tree)
            result = await service.get_all_documents_for_tree()

            return DocumentListResponse(
                success=True,
                bimba_documents=result["bimba"],
                pratibimba_documents=result["pratibimba"]
            )

    except Exception as e:
        logger.error(f"Document listing failed: {e}", exc_info=True)
        return DocumentListResponse(
            success=False,
            bimba_documents=[],
            pratibimba_documents=[],
            error=str(e)
        )


@router.get("/{collection_type}/{document_id}")
async def get_document_by_type(
    document_id: str,
    collection_type: Literal["bimba", "pratibimba"]
):
    """
    Get single document by ID and collection type.

    Public endpoint - documents are publicly readable.

    Args:
        document_id: MongoDB ObjectId
        collection_type: Collection to query (bimba or pratibimba)

    Returns:
        Document record with full details
    """
    try:
        service = get_document_service()
        doc = await service.get_document(document_id, collection_type)

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        return doc.model_dump()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document retrieval failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{collection_type}/{document_id}")
async def update_document(
    document_id: str,
    collection_type: Literal["bimba", "pratibimba"],
    updates: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Update document fields (admin only).

    Args:
        document_id: MongoDB ObjectId
        collection_type: Collection to update (bimba or pratibimba)
        updates: Dictionary of fields to update
        current_user: Authenticated user (from JWT)

    Returns:
        Updated document record
    """
    try:
        # Check admin permission
        if not current_user.isAdmin:
            raise HTTPException(
                status_code=403,
                detail="Admin permission required for document updates"
            )

        service = get_document_service()
        doc = await service.update_document(document_id, updates, collection_type)

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        return doc.model_dump()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document update failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{collection_type}/{document_id}")
async def delete_document(
    document_id: str,
    collection_type: Literal["bimba", "pratibimba"],
    current_user: dict = Depends(get_current_user)
):
    """
    Delete document (admin only).

    Args:
        document_id: MongoDB ObjectId
        collection_type: Collection to delete from (bimba or pratibimba)
        current_user: Authenticated user (from JWT)

    Returns:
        Success response
    """
    try:
        # Check admin permission
        if not current_user.isAdmin:
            raise HTTPException(
                status_code=403,
                detail="Admin permission required for document deletion"
            )

        service = get_document_service()
        collection = service._get_collection(collection_type)

        result = collection.delete_one({"_id": ObjectId(document_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")

        return {"success": True, "message": "Document deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document deletion failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
