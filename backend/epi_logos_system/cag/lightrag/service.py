"""
Core LightRAG Service with Database Dependency
"""

from lightrag import LightRAG, QueryParam
from .gemini_llm import gemini_llm_complete  # Use async function directly
from .gemini_embeddings import gemini_embedding_func
from .models import BimbaDocument, build_coordinate_kg
import os
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv


class LightRAGService:
    """Core LightRAG service with hard database dependency"""
    
    def __init__(self):
        # Load environment variables from .env file
        load_dotenv()
        
        # Check for testing mode
        self.testing_enabled = os.getenv("LIGHTRAG_TESTING_ENABLED", "false").lower() == "true"
        
        if self.testing_enabled:
            # Use testing databases with existing data
            self.neo4j_database = os.getenv("LIGHTRAG_NEO4J_DATABASE", "archetypes")
            self.qdrant_collection = os.getenv("LIGHTRAG_QDRANT_COLLECTION", "pratibimba_store")
            self.workspace = "testing_archetypes"
        else:
            # Use production databases
            self.neo4j_database = os.getenv("NEO4J_DATABASE", "neo4j")
            self.qdrant_collection = "lightrag_production"
            self.workspace = os.getenv("LIGHTRAG_WORKSPACE", "gnostic")
        
        self.working_dir = os.getenv("LIGHTRAG_WORKING_DIR", f"./workspaces/{self.workspace}")
        
        # Ensure working directory exists
        os.makedirs(self.working_dir, exist_ok=True)
        
        # Validate required environment variables
        self._validate_database_config()
        
        # Configure database connections
        self.neo4j_config = {
            "uri": os.getenv("NEO4J_URI", "bolt://localhost:7687"),
            "username": os.getenv("NEO4J_USERNAME", "neo4j"),
            "password": os.getenv("NEO4J_PASSWORD", "ep11ep11"),
            "database": self.neo4j_database
        }
        
        self.qdrant_config = {
            "url": os.getenv("QDRANT_URL", "http://localhost:6333"),
            "api_key": os.getenv("QDRANT_API_KEY", "ep11ep11"),
            "collection_name": self.qdrant_collection,
            "vector_size": int(os.getenv("EMBEDDINGS_DIM", "1536"))
        }
        
        # Set environment variables for LightRAG storage backends
        self._set_storage_environment_variables()
        
        # CRITICAL: Override LightRAG chunk collection name to use pre-filled pratibimba_store
        from lightrag.namespace import NameSpace
        NameSpace.VECTOR_STORE_CHUNKS = "pratibimba_store"  # Change chunks → pratibimba_store
        
        # Initialize LightRAG with database backends (NO FALLBACKS)
        try:
            self.rag = LightRAG(
                working_dir=self.working_dir,
                workspace="",  # Empty workspace = no prefixes, collections: entities, relationships, chunks
                llm_model_func=gemini_llm_complete,  # Use async function
                llm_model_name=os.getenv("LIGHTRAG_LLM_MODEL", "gemini-2.5-flash"),
                llm_model_kwargs={
                    "temperature": 0.3,
                    "max_tokens": 8000
                },
                # Use Gemini embedding function
                embedding_func=gemini_embedding_func,
                # Database storage backends - JSON KV + Neo4j + Qdrant
                kv_storage="JsonKVStorage",  # Local JSON file storage
                graph_storage="Neo4JStorage",
                vector_storage="QdrantVectorDBStorage",
                # Pass configuration to vector storage backend
                vector_db_storage_cls_kwargs={
                    "url": self.qdrant_config["url"],
                    "api_key": self.qdrant_config["api_key"],
                    "collection_name": self.qdrant_config["collection_name"],
                    "vector_size": self.qdrant_config["vector_size"]
                }
                # Neo4j configuration is handled via environment variables (no graph_storage_cls_kwargs parameter)
            )
            self.database_enabled = True
            
        except Exception as e:
            # NO FALLBACK - Service must fail if databases unavailable
            raise RuntimeError(f"LightRAG database initialization failed: {e}. "
                             f"Required databases: Neo4j '{self.neo4j_database}' and Qdrant '{self.qdrant_collection}'. "
                             f"Ensure databases are running and accessible.") from e
        
        # Store service metadata
        self._workspace_metadata = {
            "workspace": self.workspace,
            "namespace": "gnostic",
            "initialized": True,
            "database_enabled": self.database_enabled,
            "testing_enabled": self.testing_enabled,
            "neo4j_database": self.neo4j_database,
            "qdrant_collection": self.qdrant_collection,
            "neo4j_config": self.neo4j_config,
            "qdrant_config": self.qdrant_config
        }
        
        # Initialize storage
        self._initialize_storage()
    
    def _validate_database_config(self):
        """Validate that required database configuration is present"""
        required_vars = [
            "NEO4J_URI", "NEO4J_USERNAME", "NEO4J_PASSWORD",
            "QDRANT_URL", "QDRANT_API_KEY", "GEMINI_API_KEY"
        ]
        
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        if missing_vars:
            raise RuntimeError(f"Missing required environment variables: {missing_vars}. "
                             f"LightRAG service requires database connections to function.")
    
    def _set_storage_environment_variables(self):
        """Set environment variables for LightRAG storage backends"""
        # LightRAG storage type environment variables (required by the framework)
        storage_type_vars = {
            "LIGHTRAG_GRAPH_STORAGE": "Neo4JStorage",
            "LIGHTRAG_VECTOR_STORAGE": "QdrantVectorDBStorage",
            "LIGHTRAG_KV_STORAGE": "JsonKVStorage",  # Default for local file storage
            "LIGHTRAG_DOC_STATUS_STORAGE": "JsonDocStatusStorage"  # Default for local file storage
        }
        
        for key, value in storage_type_vars.items():
            os.environ[key] = value
        
        # Neo4j storage backend reads these environment variables
        # Based on research: https://github.com/HKUDS/LightRAG/issues/222
        neo4j_env_vars = {
            "NEO4J_URI": self.neo4j_config["uri"],
            "NEO4J_USERNAME": self.neo4j_config["username"], 
            "NEO4J_PASSWORD": self.neo4j_config["password"],
            "NEO4J_DATABASE": self.neo4j_config["database"]
        }
        
        # Set workspace for data isolation (Neo4j uses labels for workspace separation)
        if self.workspace:
            neo4j_env_vars["WORKSPACE"] = self.workspace
        
        # Apply Neo4j environment variables
        for key, value in neo4j_env_vars.items():
            if value:  # Only set if value is not None/empty
                os.environ[key] = str(value)
                
        # CRITICAL: Set Qdrant environment variables for pre-filled collections
        # Empty workspace creates: entities, relationships, chunks
        # Override chunks → pratibimba_store via QDRANT_COLLECTION
        qdrant_env_vars = {
            "QDRANT_URL": self.qdrant_config["url"],
            "QDRANT_API_KEY": self.qdrant_config["api_key"],
            "QDRANT_COLLECTION": "pratibimba_store",  # Override chunks → pratibimba_store
            "QDRANT_WORKSPACE": "",  # Empty = no prefixes
            # Final result: entities, relationships, pratibimba_store
        }
        
        for key, value in qdrant_env_vars.items():
            if value:
                os.environ[key] = str(value)
    
    def _initialize_storage(self):
        """Initialize storage for workspace isolation"""
        try:
            # Initialize LightRAG storages (required for v1.4.7+)
            import asyncio
            
            # Initialize storages asynchronously
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                loop.run_until_complete(self.rag.initialize_storages())
                print(f"✅ LightRAG storages initialized successfully")
                
                # Initialize pipeline status for operations
                from lightrag.kg.shared_storage import initialize_pipeline_status
                loop.run_until_complete(initialize_pipeline_status())
                print(f"✅ LightRAG pipeline status initialized successfully")
                
            finally:
                loop.close()
                
        except Exception as e:
            raise RuntimeError(f"LightRAG storage initialization failed: {e}. "
                             f"This is required for Neo4j + Qdrant database integration.") from e
    
    async def ingest_document_with_coordinates(self, doc: BimbaDocument) -> Dict[str, Any]:
        """Ingest document preserving Bimba coordinate metadata"""
        try:
            custom_kg = build_coordinate_kg(doc)
            result = await self.rag.ainsert_custom_kg(custom_kg)
            return {"success": True, "result": result, "document_id": doc.source_id}
        except Exception as e:
            print(f"Document ingestion error: {e}")
            return {"success": False, "error": str(e)}
    
    
    async def search_gnostic_space(self, query: str, coordinate_filter: Optional[str] = None, limit: int = 10) -> Dict[str, Any]:
        """Search the Gnostic namespace (pedagogical document pool) using LightRAG"""
        try:
            # Use proper QueryParam object
            query_param = QueryParam(mode="global", top_k=limit)
            result = await self.rag.aquery(query, param=query_param)
            
            # Implement coordinate-based post-filtering if coordinate_filter is provided
            filtered_result = self._filter_by_coordinate(result, coordinate_filter) if coordinate_filter else result
            
            return {
                "success": True,
                "query": query,
                "coordinate_filter": coordinate_filter,
                "result": filtered_result,
                "workspace": self.workspace
            }
        except Exception as e:
            print(f"Search error: {e}")
            return {"success": False, "error": str(e)}
    
    
    def _filter_by_coordinate(self, result: str, coordinate_filter: str) -> str:
        """Filter search results by Bimba coordinate"""
        if not coordinate_filter or not result:
            return result
            
        # Split result into lines and filter for coordinate mentions
        lines = result.split('\n')
        filtered_lines = []
        
        for line in lines:
            # Check if line contains the coordinate or a related coordinate
            if (coordinate_filter in line or 
                self._is_related_coordinate(line, coordinate_filter)):
                filtered_lines.append(line)
        
        return '\n'.join(filtered_lines) if filtered_lines else "No results found for coordinate: " + coordinate_filter
    
    def _is_related_coordinate(self, text: str, target_coordinate: str) -> bool:
        """Check if text contains coordinates related to target coordinate"""
        import re
        
        # Check for exact match first
        if target_coordinate in text:
            return True
            
        # Check for child coordinates (e.g., "#4.2.3.1" matches target "#4.2.3")
        child_pattern = re.escape(target_coordinate) + r'(\.\d+)+'
        if re.search(child_pattern, text):
            return True
            
        # Check if target is a child of coordinates in text (e.g., "#4.2.3" matches text "#4.2")
        # Find all coordinates in text
        coord_pattern = r'#[\d\.]+'
        found_coords = re.findall(coord_pattern, text)
        
        for found_coord in found_coords:
            # Check if target starts with found_coord (target is child of found_coord)
            if target_coordinate.startswith(found_coord + '.'):
                return True
                
        return False
    
    async def get_coordinate_context(self, coordinate: str) -> Dict[str, Any]:
        """Get all documents within a coordinate context"""
        try:
            # Use broad query to get all content, then filter by coordinate
            result = await self.search_by_coordinates(
                query=f"content related to {coordinate}",
                coordinate_filter=coordinate,
                limit=50
            )
            
            return {
                "success": True,
                "coordinate": coordinate,
                "context": result.get("result", ""),
                "workspace": self.workspace
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    
    def list_workspace_documents(self) -> Dict[str, Any]:
        """List all documents in current workspace with coordinate metadata"""
        try:
            # Check for existing documents in workspace
            workspace_files = []
            if os.path.exists(self.working_dir):
                for file in os.listdir(self.working_dir):
                    if file.endswith(('.json', '.pkl', '.db')):
                        workspace_files.append(file)
            
            return {
                "success": True,
                "workspace": self.workspace,
                "working_dir": self.working_dir,
                "document_count": len(workspace_files),
                "files": workspace_files
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_workspace_info(self) -> Dict[str, Any]:
        """Get comprehensive workspace information"""
        try:
            docs_info = self.list_workspace_documents()
            
            return {
                "success": True,
                "workspace": self.workspace,
                "namespace": self._workspace_metadata.get("namespace", "gnostic"),
                "working_dir": self.working_dir,
                "initialized": self._workspace_metadata.get("initialized", False),
                "documents": docs_info.get("files", []),
                "document_count": docs_info.get("document_count", 0)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def health_check(self) -> Dict[str, Any]:
        """Check service health including database configuration"""
        try:
            # Basic health checks
            checks = {
                "workspace": self.workspace,
                "working_dir_exists": os.path.exists(self.working_dir),
                "graph_storage": hasattr(self.rag, 'graph_storage'),
                "vector_storage": hasattr(self.rag, 'vector_storage'),
                "workspace_writable": os.access(self.working_dir, os.W_OK) if os.path.exists(self.working_dir) else False,
                "database_enabled": self.database_enabled,
                "neo4j_configured": bool(self.neo4j_config.get("uri")),
                "qdrant_configured": bool(self.qdrant_config.get("url"))
            }
            
            all_healthy = all(checks.values())
            
            return {
                "success": True,
                "healthy": all_healthy,
                "workspace": self.workspace,  # Add workspace as top-level field for HealthResponse
                "checks": checks,
                "workspace_info": self.get_workspace_info(),
                "database_status": {
                    "neo4j_uri": self.neo4j_config.get("uri"),
                    "neo4j_database": self.neo4j_database,
                    "qdrant_url": self.qdrant_config.get("url"),
                    "qdrant_collection": self.qdrant_collection,
                    "database_enabled": self.database_enabled,
                    "testing_enabled": self.testing_enabled,
                    "current_storage": "database-integrated (Neo4j + Qdrant)",
                    "note": f"Using {'testing' if self.testing_enabled else 'production'} databases with hard dependency"
                }
            }
        except Exception as e:
            return {
                "success": False,
                "healthy": False,
                "workspace": getattr(self, 'workspace', 'unknown'),
                "checks": {"error": str(e)},
                "error": str(e)
            }


# Global service instance
lightrag_service = None


def get_lightrag_service() -> LightRAGService:
    """Get or create LightRAG service instance"""
    global lightrag_service
    if lightrag_service is None:
        lightrag_service = LightRAGService()
    return lightrag_service
