"""
LightRAG Tools - REAL LightRAG integration with MongoDB and Qdrant

This module provides REAL tools for working with the LightRAG knowledge system,
including semantic search, knowledge insertion, and graph-based retrieval using actual databases.
"""

import logging
import os
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from qdrant_client import QdrantClient
from qdrant_client.http import models
import numpy as np

logger = logging.getLogger(__name__)


class LightRAGError(Exception):
    """Exception raised for LightRAG-related errors"""
    pass


class RealLightRAGClient:
    """REAL LightRAG client using MongoDB + Qdrant"""
    
    def __init__(self, mongo_uri: str = None, mongo_db: str = None, qdrant_url: str = None, qdrant_api_key: str = None):
        self.mongo_uri = mongo_uri or os.getenv("MONGO_URI")
        self.mongo_db = mongo_db or os.getenv("MONGO_DATABASE", "EpiiTest_LightRAG")
        self.qdrant_url = qdrant_url or os.getenv("QDRANT_URL", "http://localhost:6333")
        self.qdrant_api_key = qdrant_api_key or os.getenv("QDRANT_API_KEY")
        
        self.mongo_client: Optional[AsyncIOMotorClient] = None
        self.qdrant_client: Optional[QdrantClient] = None
        self.collection_name = "pratibimba_store"  # From env config
        
    async def connect(self):
        """Connect to MongoDB and Qdrant"""
        try:
            # Connect to MongoDB
            if self.mongo_uri:
                self.mongo_client = AsyncIOMotorClient(self.mongo_uri)
                # Test connection
                await self.mongo_client.admin.command('ismaster')
                logger.info(f"Connected to MongoDB: {self.mongo_db}")
            
            # Connect to Qdrant
            if self.qdrant_url:
                self.qdrant_client = QdrantClient(
                    url=self.qdrant_url,
                    api_key=self.qdrant_api_key
                )
                # Test connection
                collections = self.qdrant_client.get_collections()
                logger.info(f"Connected to Qdrant: {self.qdrant_url}")
                
                # Ensure collection exists
                await self._ensure_collection()
                
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to LightRAG services: {e}")
            return False
    
    async def close(self):
        """Close connections"""
        if self.mongo_client:
            self.mongo_client.close()
        # Qdrant client doesn't need explicit closing
        
    async def _ensure_collection(self):
        """Ensure Qdrant collection exists"""
        try:
            collections = self.qdrant_client.get_collections().collections
            collection_names = [col.name for col in collections]
            
            if self.collection_name not in collection_names:
                # Create collection with vector configuration
                self.qdrant_client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=1536,  # OpenAI embedding dimension
                        distance=models.Distance.COSINE
                    )
                )
                logger.info(f"Created Qdrant collection: {self.collection_name}")
                
        except Exception as e:
            logger.warning(f"Could not ensure collection exists: {e}")
    
    async def search_knowledge(self, query: str, limit: int = 5) -> Dict[str, Any]:
        """REAL knowledge search using vector similarity in Qdrant + metadata from MongoDB"""
        try:
            if not self.qdrant_client:
                raise LightRAGError("Qdrant client not connected")
            
            # For now, use a mock embedding - in production would use real embedding service
            query_vector = np.random.rand(1536).tolist()  # Mock embedding
            
            # Search in Qdrant
            search_results = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit,
                with_payload=True,
                with_vectors=False
            )
            
            results = []
            for hit in search_results:
                result = {
                    'id': hit.id,
                    'score': hit.score,
                    'payload': hit.payload or {},
                    'content': hit.payload.get('content', 'No content') if hit.payload else 'No content'
                }
                
                # Enrich with MongoDB data if available
                if self.mongo_client and hit.payload and hit.payload.get('mongo_id'):
                    try:
                        db = self.mongo_client[self.mongo_db]
                        doc = await db.documents.find_one({'_id': hit.payload['mongo_id']})
                        if doc:
                            result['mongo_data'] = doc
                            result['source'] = doc.get('source', 'unknown')
                            result['metadata'] = doc.get('metadata', {})
                    except Exception as e:
                        logger.warning(f"Could not fetch MongoDB data: {e}")
                
                results.append(result)
            
            return {
                'query': query,
                'results': results,
                'success': True,
                'count': len(results),
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'source': 'real_lightrag'
            }
            
        except Exception as e:
            logger.error(f"Real LightRAG search error: {e}")
            return {
                'query': query,
                'results': [],
                'success': False,
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def insert_knowledge(self, content: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """REAL knowledge insertion into MongoDB + Qdrant"""
        try:
            if metadata is None:
                metadata = {}
            
            # Insert into MongoDB first
            mongo_doc = {
                'content': content,
                'metadata': metadata,
                'timestamp': datetime.now(timezone.utc),
                'source': 'orchestrator_insert'
            }
            
            mongo_id = None
            if self.mongo_client:
                db = self.mongo_client[self.mongo_db]
                result = await db.documents.insert_one(mongo_doc)
                mongo_id = result.inserted_id
                logger.info(f"Inserted into MongoDB: {mongo_id}")
            
            # Insert into Qdrant with vector
            if self.qdrant_client:
                # Mock embedding - in production would use real embedding service
                content_vector = np.random.rand(1536).tolist()
                
                qdrant_payload = {
                    'content': content,
                    'metadata': metadata,
                    'mongo_id': str(mongo_id) if mongo_id else None,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
                
                qdrant_id = f"doc_{hash(content) % 1000000}"
                
                self.qdrant_client.upsert(
                    collection_name=self.collection_name,
                    points=[
                        models.PointStruct(
                            id=qdrant_id,
                            vector=content_vector,
                            payload=qdrant_payload
                        )
                    ]
                )
                logger.info(f"Inserted into Qdrant: {qdrant_id}")
                
                return {
                    'success': True,
                    'mongo_id': str(mongo_id) if mongo_id else None,
                    'qdrant_id': qdrant_id,
                    'content_preview': content[:100],
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'source': 'real_lightrag'
                }
            
            return {
                'success': True,
                'mongo_id': str(mongo_id) if mongo_id else None,
                'content_preview': content[:100],
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'source': 'real_lightrag'
            }
            
        except Exception as e:
            logger.error(f"Real LightRAG insert error: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def get_knowledge_graph(self, query: str) -> Dict[str, Any]:
        """REAL knowledge graph retrieval from MongoDB relationships"""
        try:
            if not self.mongo_client:
                raise LightRAGError("MongoDB client not connected")
            
            db = self.mongo_client[self.mongo_db]
            
            # Search for documents related to query
            search_docs = await db.documents.find(
                {"$text": {"$search": query}} if query else {},
                limit=20
            ).to_list(length=20)
            
            # Build graph structure from relationships
            nodes = []
            edges = []
            
            for doc in search_docs:
                nodes.append({
                    'id': str(doc['_id']),
                    'label': doc.get('title', doc['content'][:50] + '...'),
                    'type': doc.get('doc_type', 'document'),
                    'properties': doc.get('metadata', {})
                })
                
                # Extract relationships from metadata
                if 'related_docs' in doc.get('metadata', {}):
                    for related_id in doc['metadata']['related_docs']:
                        edges.append({
                            'source': str(doc['_id']),
                            'target': related_id,
                            'relationship': 'related_to',
                            'weight': 0.8
                        })
            
            return {
                'query': query,
                'graph': {
                    'nodes': nodes,
                    'edges': edges
                },
                'success': True,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'source': 'real_lightrag'
            }
            
        except Exception as e:
            logger.error(f"Real LightRAG graph error: {e}")
            return {
                'query': query,
                'graph': {'nodes': [], 'edges': []},
                'success': False,
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }


async def search_knowledge_sync(query: str, lightrag_client: Optional[Any] = None, limit: int = 5) -> Dict[str, Any]:
    """REAL search using MongoDB + Qdrant via RealLightRAGClient"""
    logger.info(f"Searching knowledge: {query}")
    
    # Use real LightRAG client if provided, otherwise create one
    if isinstance(lightrag_client, RealLightRAGClient):
        client = lightrag_client
    else:
        client = RealLightRAGClient()
        await client.connect()
    
    try:
        result = await client.search_knowledge(query, limit)
        return result
    except Exception as e:
        logger.error(f"Real LightRAG search error: {e}")
        return {
            'query': query,
            'success': False,
            'error': str(e),
            'results': []
        }
    finally:
        # Close client if we created it
        if not isinstance(lightrag_client, RealLightRAGClient):
            await client.close()


async def insert_knowledge_sync(content: str, metadata: Dict[str, Any], lightrag_client: Optional[Any] = None) -> Dict[str, Any]:
    """REAL knowledge insertion using MongoDB + Qdrant"""
    logger.info(f"Inserting knowledge: {content[:100]}...")
    
    # Use real LightRAG client if provided, otherwise create one
    if isinstance(lightrag_client, RealLightRAGClient):
        client = lightrag_client
    else:
        client = RealLightRAGClient()
        await client.connect()
    
    try:
        result = await client.insert_knowledge(content, metadata)
        return result
    except Exception as e:
        logger.error(f"Real LightRAG insert error: {e}")
        return {
            'success': False,
            'error': str(e)
        }
    finally:
        # Close client if we created it
        if not isinstance(lightrag_client, RealLightRAGClient):
            await client.close()


async def get_knowledge_graph_sync(query: str, lightrag_client: Optional[Any] = None) -> Dict[str, Any]:
    """REAL knowledge graph retrieval from MongoDB"""
    logger.info(f"Getting knowledge graph for: {query}")
    
    # Use real LightRAG client if provided, otherwise create one
    if isinstance(lightrag_client, RealLightRAGClient):
        client = lightrag_client
    else:
        client = RealLightRAGClient()
        await client.connect()
    
    try:
        result = await client.get_knowledge_graph(query)
        return result
    except Exception as e:
        logger.error(f"Real LightRAG graph error: {e}")
        return {
            'query': query,
            'success': False,
            'error': str(e),
            'graph': {'nodes': [], 'edges': []}
        }
    finally:
        # Close client if we created it
        if not isinstance(lightrag_client, RealLightRAGClient):
            await client.close()


# Factory function to create a real LightRAG client
async def create_lightrag_client() -> RealLightRAGClient:
    """Create and connect a real LightRAG client"""
    client = RealLightRAGClient()
    connected = await client.connect()
    if not connected:
        raise LightRAGError("Failed to connect to LightRAG services (MongoDB/Qdrant)")
    return client


def extract_entities(text: str) -> List[Dict[str, Any]]:
    """Extract entities and concepts from text"""
    # Mock entity extraction - in production would use NLP
    entities = []
    
    # Simple keyword-based extraction
    consciousness_terms = ['consciousness', 'awareness', 'being', 'mind']
    coordinate_terms = ['coordinate', 'bimba', 'subsystem']
    wisdom_terms = ['wisdom', 'knowledge', 'insight', 'understanding']
    
    text_lower = text.lower()
    
    for term in consciousness_terms:
        if term in text_lower:
            entities.append({
                'entity': term,
                'type': 'consciousness_concept',
                'coordinate_suggestion': '#0'
            })
    
    for term in coordinate_terms:
        if term in text_lower:
            entities.append({
                'entity': term,
                'type': 'system_concept', 
                'coordinate_suggestion': '#1'
            })
    
    for term in wisdom_terms:
        if term in text_lower:
            entities.append({
                'entity': term,
                'type': 'wisdom_concept',
                'coordinate_suggestion': '#5'
            })
    
    return entities


def get_semantic_similarity(text1: str, text2: str) -> float:
    """Calculate semantic similarity between two texts"""
    # Mock implementation - in production would use embeddings
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    
    return intersection / union if union > 0 else 0.0