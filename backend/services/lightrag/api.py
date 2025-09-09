"""
FastAPI endpoints for LightRAG operations
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging

from .service import get_lightrag_service, LightRAGService
from .models import BimbaDocument, BimbaCoordinateMetadata

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




