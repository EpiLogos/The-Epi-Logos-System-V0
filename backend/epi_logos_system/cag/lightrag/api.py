"""
FastAPI endpoints for LightRAG operations
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging

from .service import get_lightrag_service, LightRAGService
from .models import BimbaDocument, BimbaCoordinateMetadata
from .pipeline_orchestrator import get_pipeline_orchestrator
from .chunk_store import get_chunk_store

logger = logging.getLogger(__name__)

# FastAPI router for LightRAG endpoints
router = APIRouter(prefix="/api/lightrag", tags=["lightrag"])


# Request/Response models
class DocumentIngestionRequest(BaseModel):
    content: str
    source_id: str
    source_coordinate: str
    section_coordinates: List[str] = []
    namespace: str = "gnostic"
    ontological_level: int
    process_type: str


class DocumentIngestionResponse(BaseModel):
    success: bool
    document_id: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    coordinate_filter: Optional[str] = None
    limit: int = 10


class SearchResponse(BaseModel):
    success: bool
    query: str
    coordinate_filter: Optional[str] = None
    results: Optional[Any] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    success: bool
    healthy: bool
    workspace: str
    checks: Dict[str, Any]


# Dependency to get LightRAG service
def get_service() -> LightRAGService:
    """Dependency to get LightRAG service instance"""
    try:
        return get_lightrag_service()
    except Exception as e:
        logger.error(f"Failed to get LightRAG service: {e}")
        raise HTTPException(status_code=500, detail="LightRAG service unavailable")


@router.get("/health", response_model=HealthResponse)
async def health_check(service: LightRAGService = Depends(get_service)):
    """Check LightRAG service health"""
    try:
        health = service.health_check()
        return HealthResponse(**health)
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/documents/ingest", response_model=DocumentIngestionResponse)
async def ingest_document(
    request: DocumentIngestionRequest,
    service: LightRAGService = Depends(get_service)
):
    """Ingest document with Bimba coordinate metadata"""
    try:
        # Create metadata
        metadata = BimbaCoordinateMetadata(
            source_coordinate=request.source_coordinate,
            section_coordinates=request.section_coordinates,
            namespace=request.namespace,
            ontological_level=request.ontological_level,
            process_type=request.process_type
        )
        
        # Create document
        doc = BimbaDocument(
            content=request.content,
            source_id=request.source_id,
            metadata=metadata
        )
        
        # Ingest document
        result = await service.ingest_document_with_coordinates(doc)
        
        if result["success"]:
            return DocumentIngestionResponse(
                success=True,
                document_id=result["document_id"],
                message="Document ingested successfully"
            )
        else:
            return DocumentIngestionResponse(
                success=False,
                error=result.get("error", "Unknown error")
            )
            
    except Exception as e:
        logger.error(f"Document ingestion failed: {e}")
        return DocumentIngestionResponse(
            success=False,
            error=str(e)
        )


@router.post("/documents/search", response_model=SearchResponse)
async def search_documents(
    request: SearchRequest,
    service: LightRAGService = Depends(get_service)
):
    """Search documents with coordinate-based filtering"""
    try:
        result = await service.search_gnostic_space(
            query=request.query,
            coordinate_filter=request.coordinate_filter,
            limit=request.limit
        )
        
        if result["success"]:
            return SearchResponse(
                success=True,
                query=request.query,
                coordinate_filter=request.coordinate_filter,
                results=result["result"]
            )
        else:
            return SearchResponse(
                success=False,
                query=request.query,
                coordinate_filter=request.coordinate_filter,
                error=result.get("error", "Unknown error")
            )
            
    except Exception as e:
        logger.error(f"Document search failed: {e}")
        return SearchResponse(
            success=False,
            query=request.query,
            coordinate_filter=request.coordinate_filter,
            error=str(e)
        )


@router.get("/coordinates/{coordinate}/context")
async def get_coordinate_context(
    coordinate: str,
    service: LightRAGService = Depends(get_service)
):
    """Get all documents within a coordinate context"""
    try:
        result = service.get_coordinate_context_sync(coordinate)
        
        return {
            "success": result["success"],
            "coordinate": coordinate,
            "context": result.get("result"),
            "error": result.get("error")
        }
        
    except Exception as e:
        logger.error(f"Coordinate context retrieval failed: {e}")
        return {
            "success": False,
            "coordinate": coordinate,
            "error": str(e)
        }


@router.get("/workspace/info")
async def get_workspace_info(service: LightRAGService = Depends(get_service)):
    """Get comprehensive workspace information"""
    try:
        info = service.get_workspace_info()
        return info
    except Exception as e:
        logger.error(f"Workspace info retrieval failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }


@router.get("/workspace/documents")
async def list_workspace_documents(service: LightRAGService = Depends(get_service)):
    """List all documents in workspace"""
    try:
        docs = service.list_workspace_documents()
        return docs
    except Exception as e:
        logger.error(f"Document listing failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }


# New Pipeline Endpoints for Story 08.03

class DocumentProcessingRequest(BaseModel):
    """Request model for document preprocessing pipeline"""
    source_path: str
    document_id: str
    coordinate: str
    subsystem: Optional[int] = None


class DocumentProcessingResponse(BaseModel):
    """Response model for document preprocessing pipeline"""
    success: bool
    document_id: str
    coordinate: Optional[str] = None
    chunks_processed: Optional[int] = None
    summary_length: Optional[int] = None
    lightrag_success: Optional[bool] = None
    storage_success: Optional[bool] = None
    error: Optional[str] = None


class PipelineStatusResponse(BaseModel):
    """Response model for pipeline status"""
    document_id: str
    status: str
    progress: int
    error: Optional[str] = None


class RawChunksResponse(BaseModel):
    """Response model for raw chunks retrieval"""
    success: bool
    document_id: str
    coordinate: Optional[str] = None
    chunks: Optional[List[Dict[str, Any]]] = None
    chunk_count: Optional[int] = None
    error: Optional[str] = None


@router.post("/documents/preprocess", response_model=DocumentProcessingResponse)
async def preprocess_document(request: DocumentProcessingRequest):
    """
    Trigger Docling document preprocessing and LightRAG ingestion pipeline.

    Executes complete pipeline:
    1. Docling preprocessing (PDF, DOCX, PPTX, XLSX, HTML)
    2. Document summary generation
    3. Context wrapping with coordinate metadata
    4. LightRAG ingestion (Neo4j + Qdrant)
    5. Raw chunk storage in MongoDB
    """
    try:
        orchestrator = get_pipeline_orchestrator()

        result = await orchestrator.process_document(
            source_path=request.source_path,
            document_id=request.document_id,
            coordinate=request.coordinate,
            subsystem=request.subsystem
        )

        return DocumentProcessingResponse(**result)

    except Exception as e:
        logger.error(f"Document preprocessing failed: {e}")
        return DocumentProcessingResponse(
            success=False,
            document_id=request.document_id,
            error=str(e)
        )


@router.post("/documents/{document_id}/ingest", response_model=DocumentProcessingResponse)
async def ingest_document_by_id(document_id: str):
    """
    Trigger ingestion for an already-uploaded document.

    Fetches document metadata from MongoDB and triggers the full pipeline.
    Used for manual ingestion after upload or re-ingestion.

    Admin-only endpoint.
    """
    try:
        from backend.epi_logos_system.cag.documents.service import get_document_service

        # Fetch document metadata from MongoDB
        doc_service = get_document_service()
        doc = await doc_service.get_document(document_id, "bimba")

        if not doc:
            return DocumentProcessingResponse(
                success=False,
                document_id=document_id,
                error="Document not found"
            )

        if not doc.file_path:
            return DocumentProcessingResponse(
                success=False,
                document_id=document_id,
                error="Document has no file path"
            )

        # Trigger pipeline
        orchestrator = get_pipeline_orchestrator()
        result = await orchestrator.process_document(
            source_path=doc.file_path,
            document_id=document_id,
            coordinate=doc.coordinate,
            subsystem=doc.subsystem
        )

        # Update document status
        await doc_service.update_processing_status(
            document_id=document_id,
            status="processing" if result.get("success") else "failed",
            collection_type="bimba",
            pipeline_triggered=True
        )

        return DocumentProcessingResponse(
            success=result.get("success", False),
            document_id=document_id,
            coordinate=result.get("coordinate"),
            chunks_processed=result.get("chunks_processed"),
            error=result.get("error")
        )

    except Exception as e:
        logger.error(f"Document ingestion failed for {document_id}: {e}")
        return DocumentProcessingResponse(
            success=False,
            document_id=document_id,
            error=str(e)
        )


@router.get("/documents/{document_id}/status", response_model=PipelineStatusResponse)
async def get_pipeline_status(document_id: str):
    """
    Get current pipeline processing status for a document.

    Returns status, progress (0-100), and error message if failed.
    Used by admin UI for progress tracking.
    """
    try:
        orchestrator = get_pipeline_orchestrator()
        status = orchestrator.get_pipeline_status(document_id)

        return PipelineStatusResponse(
            document_id=document_id,
            **status
        )

    except Exception as e:
        logger.error(f"Status retrieval failed for {document_id}: {e}")
        return PipelineStatusResponse(
            document_id=document_id,
            status="error",
            progress=0,
            error=str(e)
        )


@router.get("/documents/{document_id}/raw-chunks", response_model=RawChunksResponse)
async def get_raw_chunks(document_id: str):
    """
    Retrieve raw Docling chunks for a document.

    Returns chunks with hierarchical metadata for Story 08.09 deep analysis.
    Chunks are stored in MongoDB doc_chunks collection.
    """
    try:
        chunk_store = get_chunk_store()
        storage_doc = await chunk_store.get_raw_chunks(document_id)

        if not storage_doc:
            return RawChunksResponse(
                success=False,
                document_id=document_id,
                error="No raw chunks found for document"
            )

        return RawChunksResponse(
            success=True,
            document_id=document_id,
            coordinate=storage_doc.coordinate,
            chunks=storage_doc.chunks,
            chunk_count=len(storage_doc.chunks)
        )

    except Exception as e:
        logger.error(f"Raw chunks retrieval failed for {document_id}: {e}")
        return RawChunksResponse(
            success=False,
            document_id=document_id,
            error=str(e)
        )
