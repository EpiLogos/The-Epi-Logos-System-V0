"""
GraphQL schema extensions for LightRAG document intelligence
"""

import strawberry
from typing import Optional, List, Any
from strawberry.scalars import JSON
import logging

from .service import get_lightrag_service
from .models import BimbaDocument, BimbaCoordinateMetadata

logger = logging.getLogger(__name__)


@strawberry.type
class CoordinateMetadata:
    """GraphQL type for Bimba coordinate metadata"""
    source_coordinate: str
    section_coordinates: List[str]
    namespace: str
    ontological_level: int
    process_type: str


@strawberry.input
class CoordinateMetadataInput:
    """GraphQL input for Bimba coordinate metadata"""
    source_coordinate: str
    section_coordinates: List[str] = strawberry.field(default_factory=list)
    namespace: str = "gnostic"
    ontological_level: int
    process_type: str


@strawberry.input
class DocumentIngestionInput:
    """GraphQL input for document ingestion"""
    content: str
    source_id: str
    metadata: CoordinateMetadataInput


@strawberry.input
class DocumentSearchInput:
    """GraphQL input for document search"""
    query: str
    coordinate_filter: Optional[str] = None
    limit: int = 10


@strawberry.type
class DocumentIngestionResult:
    """GraphQL type for document ingestion result"""
    success: bool
    document_id: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None


@strawberry.type
class DocumentSearchResult:
    """GraphQL type for document search result"""
    success: bool
    query: str
    coordinate_filter: Optional[str] = None
    results: Optional[JSON] = None
    error: Optional[str] = None


@strawberry.type
class CoordinateContextResult:
    """GraphQL type for coordinate context result"""
    success: bool
    coordinate: str
    context: Optional[JSON] = None
    error: Optional[str] = None


@strawberry.type
class LightRAGHealthCheck:
    """GraphQL type for LightRAG health check"""
    success: bool
    healthy: bool
    workspace: str
    checks: JSON


@strawberry.type
class WorkspaceInfo:
    """GraphQL type for workspace information"""
    success: bool
    workspace: Optional[str] = None
    working_dir: Optional[str] = None
    metadata: Optional[JSON] = None
    error: Optional[str] = None


@strawberry.type
class LightRAGQuery:
    """GraphQL queries for LightRAG"""
    
    @strawberry.field
    async def lightrag_health(self) -> LightRAGHealthCheck:
        """Check LightRAG service health"""
        try:
            service = get_lightrag_service()
            health = service.health_check()
            return LightRAGHealthCheck(
                success=health["success"],
                healthy=health["healthy"],
                workspace=service.workspace,
                checks=health["checks"]
            )
        except Exception as e:
            logger.error(f"GraphQL health check failed: {e}")
            return LightRAGHealthCheck(
                success=False,
                healthy=False,
                workspace="unknown",
                checks={"error": str(e)}
            )
    
    @strawberry.field
    async def lightrag_workspace_info(self) -> WorkspaceInfo:
        """Get workspace information"""
        try:
            service = get_lightrag_service()
            return WorkspaceInfo(
                success=True,
                workspace=service.workspace,
                working_dir=service.working_dir,
                metadata=service._workspace_metadata
            )
        except Exception as e:
            logger.error(f"GraphQL workspace info failed: {e}")
            return WorkspaceInfo(
                success=False,
                error=str(e)
            )
    
    @strawberry.field
    async def search_documents(self, input: DocumentSearchInput) -> DocumentSearchResult:
        """Search documents with coordinate-based filtering"""
        try:
            service = get_lightrag_service()
            result = service.search_by_coordinates_sync(
                query=input.query,
                coordinate_filter=input.coordinate_filter
            )
            
            return DocumentSearchResult(
                success=result["success"],
                query=input.query,
                coordinate_filter=input.coordinate_filter,
                results=result.get("result"),
                error=result.get("error")
            )
        except Exception as e:
            logger.error(f"GraphQL document search failed: {e}")
            return DocumentSearchResult(
                success=False,
                query=input.query,
                coordinate_filter=input.coordinate_filter,
                error=str(e)
            )
    
    @strawberry.field
    async def get_coordinate_context(self, coordinate: str) -> CoordinateContextResult:
        """Get all documents within a coordinate context"""
        try:
            service = get_lightrag_service()
            result = service.get_coordinate_context_sync(coordinate)
            
            return CoordinateContextResult(
                success=result["success"],
                coordinate=coordinate,
                context=result.get("result"),
                error=result.get("error")
            )
        except Exception as e:
            logger.error(f"GraphQL coordinate context failed: {e}")
            return CoordinateContextResult(
                success=False,
                coordinate=coordinate,
                error=str(e)
            )


@strawberry.type
class LightRAGMutation:
    """GraphQL mutations for LightRAG"""
    
    @strawberry.mutation
    async def ingest_document(self, input: DocumentIngestionInput) -> DocumentIngestionResult:
        """Ingest document with Bimba coordinate metadata"""
        try:
            service = get_lightrag_service()
            
            # Create metadata
            metadata = BimbaCoordinateMetadata(
                source_coordinate=input.metadata.source_coordinate,
                section_coordinates=input.metadata.section_coordinates,
                namespace=input.metadata.namespace,
                ontological_level=input.metadata.ontological_level,
                process_type=input.metadata.process_type
            )
            
            # Create document
            doc = BimbaDocument(
                content=input.content,
                source_id=input.source_id,
                metadata=metadata
            )
            
            # Ingest document
            result = service.ingest_document_with_coordinates_sync(doc)
            
            return DocumentIngestionResult(
                success=result["success"],
                document_id=result.get("document_id"),
                message="Document ingested successfully" if result["success"] else None,
                error=result.get("error")
            )
            
        except Exception as e:
            logger.error(f"GraphQL document ingestion failed: {e}")
            return DocumentIngestionResult(
                success=False,
                error=str(e)
            )


# Create the schema extensions
def get_lightrag_schema_extensions():
    """Get LightRAG GraphQL schema extensions"""
    return {
        "queries": LightRAGQuery,
        "mutations": LightRAGMutation
    }