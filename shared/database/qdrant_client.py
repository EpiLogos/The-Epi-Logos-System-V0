"""
Qdrant local vector database client for semantic search and RAG capabilities.

This client handles connections to local Qdrant instance and provides
vector operations for wisdom synthesis, knowledge discovery, and
LightRAG integration.
"""

import os
import logging
from typing import Dict, List, Any, Optional, Union
import numpy as np
from qdrant_client import QdrantClient as QdrantSDK
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter, FieldCondition, 
    MatchValue, SearchRequest, CollectionInfo, CollectionStatus
)
from qdrant_client.http.exceptions import UnexpectedResponse


logger = logging.getLogger(__name__)


class QdrantClient:
    """Qdrant local vector database client for semantic search."""
    
    def __init__(self):
        """Initialize Qdrant client with configuration from environment."""
        self.url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.api_key = os.getenv("QDRANT_API_KEY")
        
        self._client: Optional[QdrantSDK] = None
        
        # Validate URL format
        if not self.url.startswith(("http://", "https://")):
            logger.warning(f"Qdrant URL format may be incorrect: {self.url}")
    
    @property
    def client(self) -> QdrantSDK:
        """Get or create Qdrant client instance."""
        if self._client is None:
            kwargs = {"url": self.url}
            if self.api_key:
                kwargs["api_key"] = self.api_key
            
            self._client = QdrantSDK(**kwargs)
        return self._client
    
    def test_connection(self) -> bool:
        """Test connection to local Qdrant."""
        try:
            health = self.client.get_collections()
            return True
        except Exception as e:
            logger.error(f"Qdrant connection test failed: {e}")
            return False
    
    def health_check(self) -> Dict[str, Any]:
        """Get Qdrant health status."""
        try:
            # Qdrant doesn't have a direct health endpoint, so we check collections
            collections = self.client.get_collections()
            return {
                "status": "ok",
                "collections_count": len(collections.collections),
                "version": "local"
            }
        except Exception as e:
            logger.error(f"Qdrant health check failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def create_collection(self, collection_name: str, vector_size: int, 
                         distance: str = "Cosine", **kwargs) -> bool:
        """Create a new collection with specified vector configuration."""
        try:
            distance_map = {
                "Cosine": Distance.COSINE,
                "Euclidean": Distance.EUCLID,
                "Dot": Distance.DOT
            }
            
            vector_params = VectorParams(
                size=vector_size,
                distance=distance_map.get(distance, Distance.COSINE)
            )
            
            # Handle HNSW configuration if provided
            hnsw_config = kwargs.get("hnsw_config")
            if hnsw_config:
                from qdrant_client.models import HnswConfigDiff
                vector_params.hnsw_config = HnswConfigDiff(**hnsw_config)
            
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=vector_params
            )
            return True
        except Exception as e:
            logger.error(f"Error creating Qdrant collection {collection_name}: {e}")
            return False
    
    def delete_collection(self, collection_name: str) -> bool:
        """Delete a collection."""
        try:
            self.client.delete_collection(collection_name)
            return True
        except Exception as e:
            logger.error(f"Error deleting Qdrant collection {collection_name}: {e}")
            return False
    
    def list_collections(self) -> List[Any]:
        """List all collections."""
        try:
            response = self.client.get_collections()
            return response.collections
        except Exception as e:
            logger.error(f"Error listing Qdrant collections: {e}")
            return []
    
    def get_collection_info(self, collection_name: str) -> Optional[CollectionInfo]:
        """Get information about a collection."""
        try:
            return self.client.get_collection(collection_name)
        except Exception as e:
            logger.error(f"Error getting Qdrant collection info for {collection_name}: {e}")
            return None
    
    def upsert_vectors(self, collection_name: str, vectors: List[Dict[str, Any]]) -> bool:
        """Insert or update vectors in a collection."""
        try:
            points = []
            for vector_data in vectors:
                point = PointStruct(
                    id=vector_data["id"],
                    vector=vector_data["vector"],
                    payload=vector_data.get("payload", {})
                )
                points.append(point)
            
            self.client.upsert(
                collection_name=collection_name,
                points=points
            )
            return True
        except Exception as e:
            logger.error(f"Error upserting vectors to {collection_name}: {e}")
            return False
    
    def search_vectors(self, collection_name: str, query_vector: List[float],
                      limit: int = 10, filter_conditions: Optional[Dict[str, Any]] = None,
                      score_threshold: Optional[float] = None) -> List[Any]:
        """Search for similar vectors in a collection."""
        try:
            search_filter = None
            if filter_conditions:
                # Convert filter conditions to Qdrant Filter format
                must_conditions = []
                for key, value in filter_conditions.items():
                    if isinstance(value, dict) and "$in" in value:
                        # Handle $in operator
                        for item in value["$in"]:
                            condition = FieldCondition(
                                key=key,
                                match=MatchValue(value=item)
                            )
                            must_conditions.append(condition)
                    else:
                        condition = FieldCondition(
                            key=key,
                            match=MatchValue(value=value)
                        )
                        must_conditions.append(condition)
                
                if must_conditions:
                    search_filter = Filter(must=must_conditions)
            
            results = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                query_filter=search_filter,
                limit=limit,
                score_threshold=score_threshold
            )
            
            return results
        except Exception as e:
            logger.error(f"Error searching vectors in {collection_name}: {e}")
            return []
    
    def delete_vectors(self, collection_name: str, vector_ids: List[Union[str, int]]) -> bool:
        """Delete vectors by their IDs."""
        try:
            self.client.delete(
                collection_name=collection_name,
                points_selector=vector_ids
            )
            return True
        except Exception as e:
            logger.error(f"Error deleting vectors from {collection_name}: {e}")
            return False
    
    def hybrid_search(self, collection_name: str, query_vector: List[float],
                     text_query: str, limit: int = 10) -> List[Any]:
        """Perform hybrid search combining vector similarity and text matching."""
        try:
            # This is a simplified hybrid search - real implementation would be more sophisticated
            # For now, we'll search with vector similarity and filter by text content
            filter_conditions = {"text": {"$contains": text_query}}
            
            return self.search_vectors(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
                filter_conditions=filter_conditions
            )
        except Exception as e:
            logger.error(f"Error performing hybrid search in {collection_name}: {e}")
            return []
    
    def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        """Get statistics for a collection."""
        try:
            info = self.client.get_collection(collection_name)
            return {
                "vectors_count": info.vectors_count,
                "indexed_vectors_count": info.indexed_vectors_count,
                "points_count": info.points_count,
                "segments_count": info.segments_count,
                "status": info.status.value if info.status else "unknown"
            }
        except Exception as e:
            logger.error(f"Error getting stats for collection {collection_name}: {e}")
            return {}
    
    def create_wisdom_synthesis_collection(self, collection_name: str = "wisdom_synthesis",
                                         vector_size: int = 384) -> bool:
        """Create a specialized collection for wisdom synthesis."""
        return self.create_collection(
            collection_name=collection_name,
            vector_size=vector_size,
            distance="Cosine",
            hnsw_config={
                "m": 16,
                "ef_construct": 100
            }
        )
    
    def create_lightrag_collection(self, collection_name: str = "lightrag_vectors",
                                  vector_size: int = 384) -> bool:
        """Create a specialized collection for LightRAG integration."""
        return self.create_collection(
            collection_name=collection_name,
            vector_size=vector_size,
            distance="Cosine",
            hnsw_config={
                "m": 16,
                "ef_construct": 200  # Higher for better recall
            }
        )
    
    def batch_upsert_wisdom_content(self, collection_name: str, 
                                   wisdom_contents: List[Dict[str, Any]]) -> bool:
        """Batch upsert wisdom content with optimized payload structure."""
        try:
            points = []
            for content in wisdom_contents:
                # Ensure required fields
                if "id" not in content or "vector" not in content:
                    logger.warning(f"Skipping wisdom content missing required fields: {content.keys()}")
                    continue
                
                # Structure payload for wisdom synthesis
                payload = {
                    "coordinate": content.get("coordinate"),
                    "content": content.get("content"),
                    "source_type": content.get("source_type", "unknown"),
                    "subsystem": content.get("subsystem"),
                    "complexity": content.get("complexity", "unknown"),
                    "themes": content.get("themes", []),
                    "created_at": content.get("created_at"),
                    "metadata": content.get("metadata", {})
                }
                
                point = PointStruct(
                    id=content["id"],
                    vector=content["vector"],
                    payload=payload
                )
                points.append(point)
            
            if points:
                self.client.upsert(collection_name=collection_name, points=points)
                return True
            
            return False
        except Exception as e:
            logger.error(f"Error batch upserting wisdom content: {e}")
            return False
    
    def close(self):
        """Close the Qdrant client connection."""
        if self._client:
            # Qdrant client doesn't have an explicit close method
            self._client = None
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()
