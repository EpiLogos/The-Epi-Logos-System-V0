"""
HTTP client for LightRAG service API calls

This client handles all communication with the LightRAG service through the
Backend layer's HTTP API, replacing direct MongoDB/Qdrant connections.
"""

import logging
from typing import Dict, Any, List, Optional
from agentic.clients.backend_http_client import BackendHttpClient

logger = logging.getLogger(__name__)


class LightRAGHttpClient(BackendHttpClient):
    """HTTP client for LightRAG service operations"""
    
    async def ingest_document(
        self,
        content: str,
        source_id: str,
        source_coordinate: str,
        section_coordinates: List[str] = None,
        namespace: str = "gnostic",
        ontological_level: int = 1,
        process_type: str = "semantic_analysis"
    ) -> Dict[str, Any]:
        """Ingest a document into LightRAG for semantic analysis"""
        request_data = {
            "content": content,
            "source_id": source_id,
            "source_coordinate": source_coordinate,
            "section_coordinates": section_coordinates or [],
            "namespace": namespace,
            "ontological_level": ontological_level,
            "process_type": process_type
        }
        
        logger.info(f"Ingesting document: {source_id} (coordinate: {source_coordinate})")
        return await self.post("/api/lightrag/documents/ingest", json_data=request_data)
    
    async def search_gnostic_space(
        self,
        query: str,
        coordinate_filter: str = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """Search the Gnostic namespace (pedagogical document pool) using LightRAG"""
        request_data = {
            "query": query,
            "coordinate_filter": coordinate_filter,
            "limit": limit
        }
        
        logger.info(f"Searching documents: '{query[:50]}...' (filter: {coordinate_filter})")
        return await self.post("/api/lightrag/documents/search", json_data=request_data)
    
    async def get_coordinate_context(self, coordinate: str) -> Dict[str, Any]:
        """Get contextual information for a specific Bimba coordinate"""
        logger.info(f"Getting coordinate context: {coordinate}")
        return await self.get(f"/api/lightrag/coordinates/{coordinate}/context")
    
    async def search_coordinates(
        self,
        query: str,
        namespace: str = "gnostic",
        limit: int = 10
    ) -> Dict[str, Any]:
        """Search for relevant coordinates based on semantic query"""
        request_data = {
            "query": query,
            "namespace": namespace, 
            "limit": limit
        }
        
        logger.info(f"Searching coordinates: '{query[:50]}...' (namespace: {namespace})")
        return await self.post("/api/lightrag/coordinates/search", json_data=request_data)
    
    async def get_workspace_info(self) -> Dict[str, Any]:
        """Get information about the LightRAG workspace"""
        return await self.get("/api/lightrag/workspace/info")
    
    async def get_workspace_documents(self) -> Dict[str, Any]:
        """Get list of documents in the workspace"""
        return await self.get("/api/lightrag/workspace/documents")
    
    async def query(
        self,
        query: str,
        mode: str = "hybrid",
        only_need_context: bool = False
    ) -> Dict[str, Any]:
        """Query LightRAG knowledge using specified mode"""
        request_data = {
            "query": query,
            "mode": mode,
            "only_need_context": only_need_context
        }
        logger.info(f"Querying LightRAG: '{query[:50]}...' (mode: {mode})")
        return await self.post("/api/lightrag/query", json_data=request_data)

    async def insert(self, content: str, description: Optional[str] = None) -> Dict[str, Any]:
        """Insert content into LightRAG for knowledge graph building"""
        request_data = {
            "content": content,
            "description": description
        }
        logger.info(f"Inserting content into LightRAG: {len(content)} chars")
        return await self.post("/api/lightrag/insert", json_data=request_data)

    async def health_check(self) -> Dict[str, Any]:
        """Check LightRAG service health"""
        return await self.get("/api/lightrag/health")
