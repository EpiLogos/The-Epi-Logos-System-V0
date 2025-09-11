"""
Foundational document operations for LightRAG service
"""

import logging
import uuid
from typing import Dict, Any, List, Optional
from dataclasses import asdict
from datetime import datetime, timezone

from .models import BimbaDocument, BimbaCoordinateMetadata, BimbaChunk
from .service import get_lightrag_service

logger = logging.getLogger(__name__)


class DocumentIngestionPipeline:
    """Document ingestion pipeline with coordinate metadata preservation"""
    
    def __init__(self):
        self.service = get_lightrag_service()
        self.ingestion_history = []
    
    async def ingest_document(
        self, 
        content: str,
        source_id: str,
        source_coordinate: str,
        section_coordinates: Optional[List[str]] = None,
        namespace: str = "gnostic",
        ontological_level: int = 4,
        process_type: str = "dialogical-identity"
    ) -> Dict[str, Any]:
        """Ingest document with full metadata tracking"""
        try:
            # Create metadata
            metadata = BimbaCoordinateMetadata(
                source_coordinate=source_coordinate,
                section_coordinates=section_coordinates or [],
                namespace=namespace,
                ontological_level=ontological_level,
                process_type=process_type
            )
            
            # Create document
            doc = BimbaDocument(
                content=content,
                source_id=source_id,
                metadata=metadata
            )
            
            # Record ingestion attempt
            ingestion_record = {
                "document_id": source_id,
                "coordinate": source_coordinate,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "processing"
            }
            self.ingestion_history.append(ingestion_record)
            
            # Ingest document
            result = await self.service.ingest_document_with_coordinates(doc)
            
            # Update ingestion record
            ingestion_record["status"] = "success" if result["success"] else "failed"
            ingestion_record["result"] = result
            
            # Track metadata relationships
            if result["success"]:
                await self._track_document_relationships(doc, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Document ingestion pipeline error: {e}")
            if ingestion_record:
                ingestion_record["status"] = "failed"
                ingestion_record["error"] = str(e)
            return {"success": False, "error": str(e)}
    
    def ingest_document_sync(
        self, 
        content: str,
        source_id: str,
        source_coordinate: str,
        section_coordinates: Optional[List[str]] = None,
        namespace: str = "gnostic",
        ontological_level: int = 4,
        process_type: str = "dialogical-identity"
    ) -> Dict[str, Any]:
        """Synchronous version of document ingestion"""
        try:
            # Create metadata
            metadata = BimbaCoordinateMetadata(
                source_coordinate=source_coordinate,
                section_coordinates=section_coordinates or [],
                namespace=namespace,
                ontological_level=ontological_level,
                process_type=process_type
            )
            
            # Create document
            doc = BimbaDocument(
                content=content,
                source_id=source_id,
                metadata=metadata
            )
            
            # Record ingestion attempt
            ingestion_record = {
                "document_id": source_id,
                "coordinate": source_coordinate,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "processing"
            }
            self.ingestion_history.append(ingestion_record)
            
            # Ingest document
            result = self.service.ingest_document_with_coordinates_sync(doc)
            
            # Update ingestion record
            ingestion_record["status"] = "success" if result["success"] else "failed"
            ingestion_record["result"] = result
            
            # Track metadata relationships
            if result["success"]:
                self._track_document_relationships_sync(doc, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Document ingestion pipeline error: {e}")
            if ingestion_record:
                ingestion_record["status"] = "failed"
                ingestion_record["error"] = str(e)
            return {"success": False, "error": str(e)}
    
    async def _track_document_relationships(self, doc: BimbaDocument, ingestion_result: Dict[str, Any]):
        """Track document relationships and metadata"""
        try:
            # Store document metadata for relationship tracking
            metadata_record = {
                "source_id": doc.source_id,
                "source_coordinate": doc.metadata.source_coordinate,
                "section_coordinates": doc.metadata.section_coordinates,
                "namespace": doc.metadata.namespace,
                "ontological_level": doc.metadata.ontological_level,
                "process_type": doc.metadata.process_type,
                "ingestion_timestamp": datetime.now(timezone.utc).isoformat(),
                "content_length": len(doc.content),
                "ingestion_result": ingestion_result
            }
            
            # Store in service metadata
            if not hasattr(self.service, '_document_metadata'):
                self.service._document_metadata = {}
            self.service._document_metadata[doc.source_id] = metadata_record
            
        except Exception as e:
            logger.warning(f"Failed to track document relationships: {e}")
    
    def _track_document_relationships_sync(self, doc: BimbaDocument, ingestion_result: Dict[str, Any]):
        """Synchronous version of relationship tracking"""
        try:
            # Store document metadata for relationship tracking
            metadata_record = {
                "source_id": doc.source_id,
                "source_coordinate": doc.metadata.source_coordinate,
                "section_coordinates": doc.metadata.section_coordinates,
                "namespace": doc.metadata.namespace,
                "ontological_level": doc.metadata.ontological_level,
                "process_type": doc.metadata.process_type,
                "ingestion_timestamp": datetime.now(timezone.utc).isoformat(),
                "content_length": len(doc.content),
                "ingestion_result": ingestion_result
            }
            
            # Store in service metadata
            if not hasattr(self.service, '_document_metadata'):
                self.service._document_metadata = {}
            self.service._document_metadata[doc.source_id] = metadata_record
            
        except Exception as e:
            logger.warning(f"Failed to track document relationships: {e}")
    
    def get_ingestion_history(self) -> List[Dict[str, Any]]:
        """Get document ingestion history"""
        return self.ingestion_history.copy()
    
    def get_document_metadata(self, source_id: str) -> Optional[Dict[str, Any]]:
        """Get metadata for specific document"""
        if hasattr(self.service, '_document_metadata'):
            return self.service._document_metadata.get(source_id)
        return None


class HybridSearchOperations:
    """Hybrid vector-graph search operations"""
    
    def __init__(self):
        self.service = get_lightrag_service()
        self.search_history = []
    
    async def semantic_search(
        self,
        query: str,
        coordinate_filter: Optional[str] = None,
        limit: int = 10,
        search_mode: str = "hybrid"
    ) -> Dict[str, Any]:
        """Perform semantic search with coordinate filtering"""
        try:
            search_record = {
                "query": query,
                "coordinate_filter": coordinate_filter,
                "limit": limit,
                "search_mode": search_mode,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "search_id": str(uuid.uuid4())
            }
            self.search_history.append(search_record)
            
            # Perform search
            result = await self.service.search_by_coordinates(
                query=query,
                coordinate_filter=coordinate_filter,
                limit=limit
            )
            
            # Enhance result with search metadata
            if result["success"]:
                result["search_metadata"] = {
                    "search_id": search_record["search_id"],
                    "search_mode": search_mode,
                    "timestamp": search_record["timestamp"]
                }
            
            search_record["result"] = result
            return result
            
        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            return {"success": False, "error": str(e)}
    
    def semantic_search_sync(
        self,
        query: str,
        coordinate_filter: Optional[str] = None,
        limit: int = 10,
        search_mode: str = "hybrid"
    ) -> Dict[str, Any]:
        """Synchronous semantic search"""
        try:
            search_record = {
                "query": query,
                "coordinate_filter": coordinate_filter,
                "limit": limit,
                "search_mode": search_mode,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "search_id": str(uuid.uuid4())
            }
            self.search_history.append(search_record)
            
            # Perform search
            result = self.service.search_by_coordinates_sync(
                query=query,
                coordinate_filter=coordinate_filter,
                limit=limit
            )
            
            # Enhance result with search metadata
            if result["success"]:
                result["search_metadata"] = {
                    "search_id": search_record["search_id"],
                    "search_mode": search_mode,
                    "timestamp": search_record["timestamp"]
                }
            
            search_record["result"] = result
            return result
            
        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            return {"success": False, "error": str(e)}
    
    async def coordinate_based_retrieval(
        self,
        coordinate: str,
        include_children: bool = True,
        include_parents: bool = True,
        max_depth: int = 3
    ) -> Dict[str, Any]:
        """Retrieve documents by coordinate hierarchy"""
        try:
            # Get coordinate context
            result = await self.service.get_coordinate_context(coordinate)
            
            if not result["success"]:
                return result
            
            # Enhance with hierarchy information
            hierarchy_info = self._analyze_coordinate_hierarchy(
                coordinate, include_children, include_parents, max_depth
            )
            
            result["hierarchy_info"] = hierarchy_info
            return result
            
        except Exception as e:
            logger.error(f"Coordinate retrieval error: {e}")
            return {"success": False, "error": str(e)}
    
    def coordinate_based_retrieval_sync(
        self,
        coordinate: str,
        include_children: bool = True,
        include_parents: bool = True,
        max_depth: int = 3
    ) -> Dict[str, Any]:
        """Synchronous coordinate-based retrieval"""
        try:
            # Get coordinate context
            result = self.service.get_coordinate_context_sync(coordinate)
            
            if not result["success"]:
                return result
            
            # Enhance with hierarchy information
            hierarchy_info = self._analyze_coordinate_hierarchy(
                coordinate, include_children, include_parents, max_depth
            )
            
            result["hierarchy_info"] = hierarchy_info
            return result
            
        except Exception as e:
            logger.error(f"Coordinate retrieval error: {e}")
            return {"success": False, "error": str(e)}
    
    def _analyze_coordinate_hierarchy(
        self,
        coordinate: str,
        include_children: bool,
        include_parents: bool,
        max_depth: int
    ) -> Dict[str, Any]:
        """Analyze coordinate hierarchy for enhanced retrieval"""
        hierarchy = {
            "target_coordinate": coordinate,
            "parents": [],
            "children": [],
            "siblings": [],
            "max_depth": max_depth
        }
        
        # Extract coordinate parts
        parts = coordinate.lstrip('#').split('.')
        
        # Generate parent coordinates
        if include_parents:
            for i in range(len(parts) - 1, 0, -1):
                parent = '#' + '.'.join(parts[:i])
                hierarchy["parents"].append(parent)
        
        # Generate potential child coordinates (limited by depth)
        if include_children:
            for i in range(1, max_depth + 1):
                child = coordinate + f'.{i}'
                hierarchy["children"].append(child)
        
        # Generate sibling coordinates  
        if len(parts) > 1:
            parent_parts = parts[:-1]
            current_level = int(parts[-1]) if parts[-1].isdigit() else 1
            
            for sibling_num in range(1, 6):  # Generate up to 5 siblings
                if sibling_num != current_level:
                    sibling = '#' + '.'.join(parent_parts + [str(sibling_num)])
                    hierarchy["siblings"].append(sibling)
        
        return hierarchy
    
    def get_search_history(self) -> List[Dict[str, Any]]:
        """Get search operation history"""
        return self.search_history.copy()


class DocumentOperationsService:
    """Service layer abstraction for document operations"""
    
    def __init__(self):
        self.ingestion_pipeline = DocumentIngestionPipeline()
        self.search_operations = HybridSearchOperations()
        self.lightrag_service = get_lightrag_service()
    
    async def ingest_document(self, **kwargs) -> Dict[str, Any]:
        """Ingest document through pipeline"""
        return await self.ingestion_pipeline.ingest_document(**kwargs)
    
    def ingest_document_sync(self, **kwargs) -> Dict[str, Any]:
        """Synchronous document ingestion"""
        return self.ingestion_pipeline.ingest_document_sync(**kwargs)
    
    async def search_documents(self, **kwargs) -> Dict[str, Any]:
        """Search documents with semantic capabilities"""
        return await self.search_operations.semantic_search(**kwargs)
    
    def search_documents_sync(self, **kwargs) -> Dict[str, Any]:
        """Synchronous document search"""
        return self.search_operations.semantic_search_sync(**kwargs)
    
    async def retrieve_by_coordinate(self, **kwargs) -> Dict[str, Any]:
        """Retrieve documents by coordinate hierarchy"""
        return await self.search_operations.coordinate_based_retrieval(**kwargs)
    
    def retrieve_by_coordinate_sync(self, **kwargs) -> Dict[str, Any]:
        """Synchronous coordinate retrieval"""
        return self.search_operations.coordinate_based_retrieval_sync(**kwargs)
    
    def get_operation_stats(self) -> Dict[str, Any]:
        """Get statistics about document operations"""
        return {
            "ingestion_history_count": len(self.ingestion_pipeline.get_ingestion_history()),
            "search_history_count": len(self.search_operations.get_search_history()),
            "workspace_info": self.lightrag_service.get_workspace_info(),
            "last_operations": {
                "last_ingestion": self.ingestion_pipeline.get_ingestion_history()[-1:],
                "last_search": self.search_operations.get_search_history()[-1:]
            }
        }


# Global service instances
_document_operations_service = None
_ingestion_pipeline = None
_search_operations = None


def get_document_operations_service() -> DocumentOperationsService:
    """Get or create document operations service instance"""
    global _document_operations_service
    if _document_operations_service is None:
        _document_operations_service = DocumentOperationsService()
    return _document_operations_service


def get_ingestion_pipeline() -> DocumentIngestionPipeline:
    """Get or create document ingestion pipeline instance"""
    global _ingestion_pipeline
    if _ingestion_pipeline is None:
        _ingestion_pipeline = DocumentIngestionPipeline()
    return _ingestion_pipeline


def get_search_operations() -> HybridSearchOperations:
    """Get or create search operations instance"""
    global _search_operations
    if _search_operations is None:
        _search_operations = HybridSearchOperations()
    return _search_operations