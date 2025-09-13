"""
HTTP LightRAG Tools - Backend API integration for document operations

This module provides HTTP-based tools for working with the LightRAG system,
communicating through the Backend layer's REST API instead of direct MongoDB/Qdrant connections.
"""

import logging
from typing import Dict, Any, Optional, List
from agentic.clients.lightrag_http_client import LightRAGHttpClient

logger = logging.getLogger(__name__)


class LightRAGError(Exception):
    """Exception raised for LightRAG-related errors"""
    pass


class HttpLightRAGClient:
    """HTTP-based client for LightRAG operations"""
    
    def __init__(self, http_client: LightRAGHttpClient):
        self.client = http_client
        
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
        """
        Ingest a document into LightRAG for semantic analysis.
        
        Args:
            content: The document content to ingest
            source_id: Unique identifier for the source
            source_coordinate: Bimba coordinate for the source
            section_coordinates: List of section coordinates within the document
            namespace: Namespace for organization (default: "gnostic")
            ontological_level: Ontological processing level
            process_type: Type of processing to apply
            
        Returns:
            Dict containing ingestion results
        """
        try:
            result = await self.client.ingest_document(
                content=content,
                source_id=source_id,
                source_coordinate=source_coordinate,
                section_coordinates=section_coordinates or [],
                namespace=namespace,
                ontological_level=ontological_level,
                process_type=process_type
            )
            
            if result.get("success"):
                logger.info(f"Successfully ingested document: {source_id}")
                return {
                    "success": True,
                    "document_id": result.get("document_id"),
                    "source_id": source_id,
                    "source_coordinate": source_coordinate,
                    "message": result.get("message", "Document ingested successfully")
                }
            else:
                error_msg = result.get("error", "Unknown ingestion error")
                logger.warning(f"Failed to ingest document {source_id}: {error_msg}")
                return {
                    "success": False,
                    "source_id": source_id,
                    "error": error_msg
                }
                
        except Exception as e:
            logger.error(f"Exception ingesting document {source_id}: {e}")
            return {
                "success": False,
                "source_id": source_id,
                "error": f"HTTP request failed: {str(e)}"
            }
    
    async def search_documents(
        self,
        query: str,
        coordinate_filter: str = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Search documents using semantic similarity.
        
        Args:
            query: The search query
            coordinate_filter: Optional Bimba coordinate filter
            limit: Maximum number of results
            
        Returns:
            Dict containing search results
        """
        try:
            result = await self.client.search_documents(
                query=query,
                coordinate_filter=coordinate_filter,
                limit=limit
            )
            
            if result.get("success"):
                results = result.get("results", [])
                logger.info(f"Search found {len(results)} documents for: '{query[:50]}...'")
                return {
                    "success": True,
                    "query": query,
                    "coordinate_filter": coordinate_filter,
                    "results": results,
                    "count": len(results)
                }
            else:
                error_msg = result.get("error", "Unknown search error")
                logger.warning(f"Document search failed for '{query}': {error_msg}")
                return {
                    "success": False,
                    "query": query,
                    "results": [],
                    "error": error_msg
                }
                
        except Exception as e:
            logger.error(f"Exception searching documents with query '{query}': {e}")
            return {
                "success": False,
                "query": query,
                "results": [],
                "error": f"HTTP request failed: {str(e)}"
            }
    
    async def get_coordinate_context(self, coordinate: str) -> Dict[str, Any]:
        """
        Get contextual information for a specific Bimba coordinate.
        
        Args:
            coordinate: The Bimba coordinate
            
        Returns:
            Dict containing coordinate context
        """
        try:
            result = await self.client.get_coordinate_context(coordinate)
            
            logger.info(f"Retrieved context for coordinate: {coordinate}")
            return {
                "success": True,
                "coordinate": coordinate,
                "context": result
            }
            
        except Exception as e:
            logger.error(f"Exception getting coordinate context for {coordinate}: {e}")
            return {
                "success": False,
                "coordinate": coordinate,
                "context": None,
                "error": f"HTTP request failed: {str(e)}"
            }
    
    async def search_coordinates(
        self,
        query: str,
        namespace: str = "gnostic",
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Search for relevant coordinates based on semantic query.
        
        Args:
            query: The search query
            namespace: Namespace to search in
            limit: Maximum number of results
            
        Returns:
            Dict containing coordinate search results
        """
        try:
            result = await self.client.search_coordinates(
                query=query,
                namespace=namespace,
                limit=limit
            )
            
            logger.info(f"Coordinate search completed for: '{query[:50]}...'")
            return {
                "success": True,
                "query": query,
                "namespace": namespace,
                "results": result
            }
            
        except Exception as e:
            logger.error(f"Exception searching coordinates with query '{query}': {e}")
            return {
                "success": False,
                "query": query,
                "results": [],
                "error": f"HTTP request failed: {str(e)}"
            }
    
    async def get_workspace_info(self) -> Dict[str, Any]:
        """Get information about the LightRAG workspace."""
        try:
            result = await self.client.get_workspace_info()
            return {"success": True, "workspace_info": result}
        except Exception as e:
            logger.error(f"Exception getting workspace info: {e}")
            return {"success": False, "error": f"HTTP request failed: {str(e)}"}
    
    async def get_workspace_documents(self) -> Dict[str, Any]:
        """Get list of documents in the workspace."""
        try:
            result = await self.client.get_workspace_documents()
            return {"success": True, "documents": result}
        except Exception as e:
            logger.error(f"Exception getting workspace documents: {e}")
            return {"success": False, "error": f"HTTP request failed: {str(e)}"}
    
    async def health_check(self) -> Dict[str, Any]:
        """Check LightRAG service health."""
        try:
            result = await self.client.health_check()
            return {"success": True, "health": result}
        except Exception as e:
            logger.error(f"Exception checking LightRAG health: {e}")
            return {"success": False, "error": f"HTTP request failed: {str(e)}"}
    
    async def close(self):
        """Close the HTTP client connection"""
        if self.client:
            await self.client.close()


async def create_http_lightrag_client(http_client: LightRAGHttpClient) -> HttpLightRAGClient:
    """
    Factory function to create an HTTP-based LightRAG client.
    
    Args:
        http_client: The HTTP client for Backend API communication
        
    Returns:
        Configured HttpLightRAGClient instance
    """
    client = HttpLightRAGClient(http_client)
    logger.info("HTTP LightRAG client created")
    return client
