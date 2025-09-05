"""
Database Connectivity Validation for Epi-Logos System

Tests connectivity to all four database systems:
- Neo4j Aura (Cloud) - Graph Database
- MongoDB Atlas (Cloud) - Document Database  
- Redis Cloud - Cache and Event Streaming
- Qdrant Local - Vector Database

Implements retry logic with exponential backoff for robust connection testing.
"""

import os
import asyncio
import time
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

# Database client imports
try:
    from neo4j import GraphDatabase, TRUST_SYSTEM_CA_SIGNED_CERTIFICATES
except ImportError:
    GraphDatabase = None

try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
except ImportError:
    MongoClient = None
    ConnectionFailure = None
    ServerSelectionTimeoutError = None

try:
    import redis
    from redis.exceptions import ConnectionError as RedisConnectionError
except ImportError:
    redis = None
    RedisConnectionError = None

try:
    from qdrant_client import QdrantClient
    from qdrant_client.http.exceptions import UnexpectedResponse
    from qdrant_client.models import Distance, VectorParams
except ImportError:
    QdrantClient = None
    UnexpectedResponse = None
    Distance = None
    VectorParams = None

logger = logging.getLogger(__name__)


class DatabaseStatus(Enum):
    """Database connection status"""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    TIMEOUT = "timeout"
    NOT_CONFIGURED = "not_configured"


@dataclass
class DatabaseResult:
    """Result of database connectivity test"""
    database: str
    status: DatabaseStatus
    response_time_ms: float
    message: str
    details: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class DatabaseValidator:
    """Validates connectivity to all Epi-Logos databases"""
    
    def __init__(self, timeout_seconds: int = 5, max_retries: int = 3):
        """Initialize with timeout and retry configuration"""
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        
    async def validate_all_databases(self) -> Dict[str, DatabaseResult]:
        """Test connectivity to all databases concurrently"""
        tasks = [
            self._test_neo4j(),
            self._test_mongodb(),
            self._test_redis(),
            self._test_qdrant()
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            "neo4j": results[0] if not isinstance(results[0], Exception) else DatabaseResult(
                database="neo4j",
                status=DatabaseStatus.ERROR,
                response_time_ms=0.0,
                message="Validation failed",
                error=str(results[0])
            ),
            "mongodb": results[1] if not isinstance(results[1], Exception) else DatabaseResult(
                database="mongodb", 
                status=DatabaseStatus.ERROR,
                response_time_ms=0.0,
                message="Validation failed",
                error=str(results[1])
            ),
            "redis": results[2] if not isinstance(results[2], Exception) else DatabaseResult(
                database="redis",
                status=DatabaseStatus.ERROR,
                response_time_ms=0.0,
                message="Validation failed", 
                error=str(results[2])
            ),
            "qdrant": results[3] if not isinstance(results[3], Exception) else DatabaseResult(
                database="qdrant",
                status=DatabaseStatus.ERROR,
                response_time_ms=0.0,
                message="Validation failed",
                error=str(results[3])
            )
        }
    
    async def _test_neo4j(self) -> DatabaseResult:
        """Test Neo4j Aura connectivity"""
        if not GraphDatabase:
            return DatabaseResult(
                database="neo4j",
                status=DatabaseStatus.ERROR,
                response_time_ms=0.0,
                message="Neo4j driver not installed",
                error="Missing neo4j package"
            )
        
        uri = os.getenv("NEO4J_URI")
        username = os.getenv("NEO4J_USERNAME", "neo4j")
        password = os.getenv("NEO4J_PASSWORD")
        database = os.getenv("NEO4J_DATABASE", "neo4j")
        
        if not uri or not password:
            return DatabaseResult(
                database="neo4j",
                status=DatabaseStatus.NOT_CONFIGURED,
                response_time_ms=0.0,
                message="Neo4j configuration missing (NEO4J_URI or NEO4J_PASSWORD)"
            )
        
        driver = None
        start_time = time.time()
        
        try:
            # Create driver with SSL configuration for Aura
            driver = GraphDatabase.driver(
                uri,
                auth=(username, password),
                encrypted=True,
                trust=TRUST_SYSTEM_CA_SIGNED_CERTIFICATES,
                connection_timeout=self.timeout_seconds,
                max_connection_lifetime=30
            )
            
            # Test connection with simple query
            async def test_connection():
                with driver.session(database=database) as session:
                    result = session.run("MATCH (n) RETURN count(n) as count LIMIT 1")
                    record = result.single()
                    node_count = record["count"] if record else 0
                    
                    # Test namespace creation capability
                    session.run("MERGE (test:TestConnection {timestamp: $ts})", ts=int(time.time()))
                    session.run("MATCH (test:TestConnection {timestamp: $ts}) DELETE test", ts=int(time.time()))
                    
                    return node_count
            
            # Retry logic with exponential backoff
            for attempt in range(self.max_retries):
                try:
                    node_count = await asyncio.wait_for(
                        asyncio.create_task(asyncio.to_thread(test_connection)),
                        timeout=self.timeout_seconds
                    )
                    
                    response_time = (time.time() - start_time) * 1000
                    
                    return DatabaseResult(
                        database="neo4j",
                        status=DatabaseStatus.CONNECTED,
                        response_time_ms=response_time,
                        message=f"Connected to Neo4j Aura, {node_count} nodes in database",
                        details={
                            "uri": uri.split('@')[1] if '@' in uri else uri.split('//')[1],
                            "database": database,
                            "node_count": node_count,
                            "ssl_enabled": True
                        }
                    )
                    
                except asyncio.TimeoutError:
                    if attempt == self.max_retries - 1:
                        return DatabaseResult(
                            database="neo4j",
                            status=DatabaseStatus.TIMEOUT,
                            response_time_ms=(time.time() - start_time) * 1000,
                            message=f"Connection timeout after {self.timeout_seconds}s"
                        )
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return DatabaseResult(
                database="neo4j",
                status=DatabaseStatus.ERROR,
                response_time_ms=response_time,
                message="Neo4j connection failed",
                error=str(e)
            )
        finally:
            if driver:
                driver.close()
    
    async def _test_mongodb(self) -> DatabaseResult:
        """Test MongoDB Atlas connectivity"""
        if not MongoClient:
            return DatabaseResult(
                database="mongodb",
                status=DatabaseStatus.ERROR,
                response_time_ms=0.0,
                message="MongoDB driver not installed",
                error="Missing pymongo package"
            )
        
        uri = os.getenv("MONGODB_URI")
        db_name = os.getenv("MONGODB_DB_NAME", "EpiiTest")
        
        if not uri:
            return DatabaseResult(
                database="mongodb",
                status=DatabaseStatus.NOT_CONFIGURED,
                response_time_ms=0.0,
                message="MongoDB configuration missing (MONGODB_URI)"
            )
        
        client = None
        start_time = time.time()
        
        try:
            # Create MongoDB client
            client = MongoClient(
                uri,
                serverSelectionTimeoutMS=self.timeout_seconds * 1000,
                connectTimeoutMS=self.timeout_seconds * 1000,
                socketTimeoutMS=self.timeout_seconds * 1000
            )
            
            async def test_connection():
                # Test server connection
                client.admin.command('ismaster')
                
                # Test database access
                db = client[db_name]
                collections = db.list_collection_names()
                
                # Test document operations
                test_collection = db.test_connection
                test_doc = {"test": True, "timestamp": int(time.time())}
                result = test_collection.insert_one(test_doc)
                test_collection.delete_one({"_id": result.inserted_id})
                
                return len(collections)
            
            # Retry logic
            for attempt in range(self.max_retries):
                try:
                    collection_count = await asyncio.wait_for(
                        asyncio.create_task(asyncio.to_thread(test_connection)),
                        timeout=self.timeout_seconds
                    )
                    
                    response_time = (time.time() - start_time) * 1000
                    
                    return DatabaseResult(
                        database="mongodb",
                        status=DatabaseStatus.CONNECTED,
                        response_time_ms=response_time,
                        message=f"Connected to MongoDB Atlas, {collection_count} collections",
                        details={
                            "database": db_name,
                            "collection_count": collection_count,
                            "ssl_enabled": True
                        }
                    )
                    
                except asyncio.TimeoutError:
                    if attempt == self.max_retries - 1:
                        return DatabaseResult(
                            database="mongodb",
                            status=DatabaseStatus.TIMEOUT,
                            response_time_ms=(time.time() - start_time) * 1000,
                            message=f"Connection timeout after {self.timeout_seconds}s"
                        )
                    await asyncio.sleep(2 ** attempt)
                    
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            response_time = (time.time() - start_time) * 1000
            return DatabaseResult(
                database="mongodb",
                status=DatabaseStatus.DISCONNECTED,
                response_time_ms=response_time,
                message="MongoDB connection failed",
                error=str(e)
            )
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return DatabaseResult(
                database="mongodb",
                status=DatabaseStatus.ERROR,
                response_time_ms=response_time,
                message="MongoDB validation error",
                error=str(e)
            )
        finally:
            if client:
                client.close()
    
    async def _test_redis(self) -> DatabaseResult:
        """Test Redis Cloud connectivity"""
        if not redis:
            return DatabaseResult(
                database="redis",
                status=DatabaseStatus.ERROR,
                response_time_ms=0.0,
                message="Redis client not installed",
                error="Missing redis package"
            )
        
        url = os.getenv("REDIS_URL")
        password = os.getenv("REDIS_PASSWORD")
        
        if not url or not password:
            return DatabaseResult(
                database="redis",
                status=DatabaseStatus.NOT_CONFIGURED,
                response_time_ms=0.0,
                message="Redis configuration missing (REDIS_URL or REDIS_PASSWORD)"
            )
        
        client = None
        start_time = time.time()
        
        try:
            # Parse Redis URL to get host and port
            if ":" in url:
                host, port = url.rsplit(":", 1)
                port = int(port)
            else:
                host = url
                port = 6379
            
            # Create Redis client
            client = redis.Redis(
                host=host,
                port=port,
                password=password,
                ssl=True,
                ssl_cert_reqs=None,
                socket_timeout=self.timeout_seconds,
                socket_connect_timeout=self.timeout_seconds,
                decode_responses=True
            )
            
            async def test_connection():
                # Test basic connectivity
                client.ping()
                
                # Test set/get operations
                test_key = f"test_connection_{int(time.time())}"
                client.set(test_key, "test_value", ex=60)  # Expire in 60 seconds
                value = client.get(test_key)
                client.delete(test_key)
                
                # Test pub/sub capability (for future AG-UI Protocol)
                pubsub = client.pubsub()
                pubsub.close()
                
                # Get server info
                info = client.info()
                return info.get("connected_clients", 0)
            
            # Retry logic
            for attempt in range(self.max_retries):
                try:
                    connected_clients = await asyncio.wait_for(
                        asyncio.create_task(asyncio.to_thread(test_connection)),
                        timeout=self.timeout_seconds
                    )
                    
                    response_time = (time.time() - start_time) * 1000
                    
                    return DatabaseResult(
                        database="redis",
                        status=DatabaseStatus.CONNECTED,
                        response_time_ms=response_time,
                        message=f"Connected to Redis Cloud, {connected_clients} active connections",
                        details={
                            "host": host,
                            "port": port,
                            "ssl_enabled": True,
                            "connected_clients": connected_clients
                        }
                    )
                    
                except asyncio.TimeoutError:
                    if attempt == self.max_retries - 1:
                        return DatabaseResult(
                            database="redis",
                            status=DatabaseStatus.TIMEOUT,
                            response_time_ms=(time.time() - start_time) * 1000,
                            message=f"Connection timeout after {self.timeout_seconds}s"
                        )
                    await asyncio.sleep(2 ** attempt)
                    
        except RedisConnectionError as e:
            response_time = (time.time() - start_time) * 1000
            return DatabaseResult(
                database="redis",
                status=DatabaseStatus.DISCONNECTED,
                response_time_ms=response_time,
                message="Redis connection failed",
                error=str(e)
            )
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return DatabaseResult(
                database="redis",
                status=DatabaseStatus.ERROR,
                response_time_ms=response_time,
                message="Redis validation error",
                error=str(e)
            )
        finally:
            if client:
                try:
                    client.close()
                except:
                    pass
    
    async def _test_qdrant(self) -> DatabaseResult:
        """Test Qdrant Local connectivity"""
        if not QdrantClient:
            return DatabaseResult(
                database="qdrant",
                status=DatabaseStatus.ERROR,
                response_time_ms=0.0,
                message="Qdrant client not installed",
                error="Missing qdrant-client package"
            )
        
        url = os.getenv("QDRANT_URL", "http://localhost:6333")
        api_key = os.getenv("QDRANT_API_KEY")
        
        client = None
        start_time = time.time()
        
        try:
            # Create Qdrant client
            client = QdrantClient(
                url=url,
                api_key=api_key,
                timeout=self.timeout_seconds
            )
            
            async def test_connection():
                # Test basic connectivity
                collections = client.get_collections()
                
                # Test collection creation and basic vector operations
                test_collection = f"test_connection_{int(time.time())}"
                
                try:
                    # Create test collection
                    client.create_collection(
                        collection_name=test_collection,
                        vectors_config=VectorParams(
                            size=4,
                            distance=Distance.COSINE
                        )
                    )
                    
                    # Test vector insertion
                    test_vector = [0.1, 0.2, 0.3, 0.4]
                    client.upsert(
                        collection_name=test_collection,
                        points=[{
                            "id": 1,
                            "vector": test_vector,
                            "payload": {"test": True}
                        }]
                    )
                    
                    # Test search
                    search_results = client.search(
                        collection_name=test_collection,
                        query_vector=test_vector,
                        limit=1
                    )
                    
                    # Clean up test collection
                    client.delete_collection(test_collection)
                    
                    return len(collections.collections), len(search_results)
                    
                except Exception:
                    # Clean up on error
                    try:
                        client.delete_collection(test_collection)
                    except:
                        pass
                    raise
            
            # Retry logic
            for attempt in range(self.max_retries):
                try:
                    collection_count, search_result_count = await asyncio.wait_for(
                        asyncio.create_task(asyncio.to_thread(test_connection)),
                        timeout=self.timeout_seconds * 2  # Vector operations need more time
                    )
                    
                    response_time = (time.time() - start_time) * 1000
                    
                    return DatabaseResult(
                        database="qdrant",
                        status=DatabaseStatus.CONNECTED,
                        response_time_ms=response_time,
                        message=f"Connected to Qdrant Local, {collection_count} collections",
                        details={
                            "url": url,
                            "collection_count": collection_count,
                            "test_search_results": search_result_count,
                            "api_key_configured": api_key is not None
                        }
                    )
                    
                except asyncio.TimeoutError:
                    if attempt == self.max_retries - 1:
                        return DatabaseResult(
                            database="qdrant",
                            status=DatabaseStatus.TIMEOUT,
                            response_time_ms=(time.time() - start_time) * 1000,
                            message=f"Connection timeout after {self.timeout_seconds * 2}s"
                        )
                    await asyncio.sleep(2 ** attempt)
                    
        except UnexpectedResponse as e:
            response_time = (time.time() - start_time) * 1000
            return DatabaseResult(
                database="qdrant",
                status=DatabaseStatus.DISCONNECTED,
                response_time_ms=response_time,
                message="Qdrant connection failed",
                error=str(e)
            )
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return DatabaseResult(
                database="qdrant",
                status=DatabaseStatus.ERROR,
                response_time_ms=response_time,
                message="Qdrant validation error",
                error=str(e)
            )
    
    def get_health_summary(self, results: Dict[str, DatabaseResult]) -> Dict[str, Any]:
        """Generate health summary from database test results"""
        connected_count = sum(1 for r in results.values() if r.status == DatabaseStatus.CONNECTED)
        total_count = len(results)
        
        return {
            "overall_status": "healthy" if connected_count == total_count else "degraded" if connected_count > 0 else "unhealthy",
            "connected_databases": connected_count,
            "total_databases": total_count,
            "average_response_time_ms": sum(r.response_time_ms for r in results.values()) / total_count if total_count > 0 else 0,
            "database_details": {
                db_name: {
                    "status": result.status.value,
                    "response_time_ms": result.response_time_ms,
                    "message": result.message,
                    "error": result.error
                }
                for db_name, result in results.items()
            }
        }


# Convenience functions
async def validate_all_databases(timeout_seconds: int = 5, max_retries: int = 3) -> Dict[str, DatabaseResult]:
    """Validate all database connections"""
    validator = DatabaseValidator(timeout_seconds, max_retries)
    return await validator.validate_all_databases()


async def check_database_health() -> Dict[str, Any]:
    """Quick health check for all databases"""
    validator = DatabaseValidator()
    results = await validator.validate_all_databases()
    return validator.get_health_summary(results)