"""
Qdrant Tenant Storage for LightRAG
"""

from lightrag.base import BaseVectorStorage
from qdrant_client import QdrantClient
from qdrant_client.models import PayloadSchemaType, VectorParams, Distance
import os
from typing import Optional, List, Dict, Any


class TenantQdrantStorage(BaseVectorStorage):
    """Qdrant storage with tenant isolation"""
    
    def __init__(self, tenant_id: str, **kwargs):
        # Get connection config from environment
        config = self._get_config(tenant_id)
        super().__init__(**config, **kwargs)
        self.tenant_id = tenant_id
        
    def _get_config(self, tenant_id: str) -> Dict[str, Any]:
        """Get Qdrant connection from environment"""
        return {
            "url": os.getenv("QDRANT_URL", "http://localhost:6333"),
            "collection_name": f"lightrag_{tenant_id}",
            "api_key": os.getenv("QDRANT_API_KEY", None),  # Optional for local
            "embedding_dim": 1536,  # Default embedding dimension
            "distance": Distance.COSINE
        }
    
    def create_collection_if_not_exists(self):
        """Create collection with tenant-specific configuration"""
        try:
            # Check if collection exists
            collections = self.client.get_collections()
            if self.collection_name not in [c.name for c in collections.collections]:
                # Create collection with vector configuration
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.embedding_dim,
                        distance=Distance.COSINE
                    )
                )
                print(f"Created Qdrant collection: {self.collection_name}")
            
            # Add payload indexes for coordinate filtering
            self._create_payload_indexes()
            
        except Exception as e:
            print(f"Collection creation error: {e}")
    
    def _create_payload_indexes(self):
        """Create payload indexes for tenant and coordinate filtering"""
        try:
            # Create index for coordinate-based filtering
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="coordinate_metadata.source_coordinate",
                field_type=PayloadSchemaType.KEYWORD
            )
            
            # Create index for tenant isolation
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="tenant_id",
                field_type=PayloadSchemaType.KEYWORD
            )
            
            print(f"Created payload indexes for collection: {self.collection_name}")
            
        except Exception as e:
            print(f"Index creation warning: {e}")
    
    def add_vectors(self, vectors: List, metadata: Optional[List[Dict]] = None):
        """Add tenant_id to all metadata"""
        if metadata is None:
            metadata = [{} for _ in vectors]
        
        # Add tenant_id to each metadata entry
        for meta in metadata:
            meta["tenant_id"] = self.tenant_id
            
        return super().add_vectors(vectors, metadata)
    
    def search_by_coordinates(self, query_vector: List[float], coordinate_filter: str, limit: int = 10):
        """Search with coordinate-based filtering"""
        search_filter = {
            "must": [
                {"key": "tenant_id", "match": {"value": self.tenant_id}},
                {"key": "coordinate_metadata.source_coordinate", "match": {"value": coordinate_filter}}
            ]
        }
        
        return self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter=search_filter,
            limit=limit
        )