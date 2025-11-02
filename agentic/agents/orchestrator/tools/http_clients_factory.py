"""
HTTP Clients Factory - Initialize all HTTP-based service clients

This module provides factory functions to create and initialize HTTP clients
for communicating with the Backend layer APIs, replacing direct database connections
to maintain proper trilaminar architecture separation.
"""

import logging
import os
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from agentic.clients import (
    BackendHttpClient,
    LightRAGHttpClient, 
    GraphitiHttpClient,
    BimbaGraphQLClient
)
from .bimba.http_bimba_tools import create_http_bimba_client, HttpBimbaClient
# Note: redis_session_tools and mongo_conversation_tools have been deprecated
# as they mistakenly made session/conversation management part of tooling
# Session/conversation management is now in dedicated directories

logger = logging.getLogger(__name__)


class HttpClientsContainer:
    """Container for all HTTP-based service clients"""
    
    def __init__(self):
        self.backend_client: Optional[BackendHttpClient] = None
        # Wrap BimbaGraphQLClient with HttpBimbaClient to expose full tool surface
        self.bimba_client: Optional[HttpBimbaClient] = None
        self.lightrag_client: Optional[LightRAGHttpClient] = None
        self.graphiti_client: Optional[GraphitiHttpClient] = None
        
        # Session management can still be direct since it's within agentic layer
        self.redis_client: Optional[Any] = None  # AsyncOrchestratorSessionManager
        self.mongo_client: Optional[Any] = None  # ConversationManager
        
        self.connected_services = set()
        self.failed_services = set()
        
    async def initialize_all(self, required_services: Optional[list] = None) -> Dict[str, bool]:
        """Initialize all available HTTP clients"""
        if required_services is None:
            required_services = ['backend', 'bimba', 'lightrag', 'graphiti', 'redis', 'mongo']
        
        results = {}
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        
        # Initialize base Backend HTTP client
        if 'backend' in required_services:
            try:
                self.backend_client = BackendHttpClient(backend_url)
                await self.backend_client.connect()
                # Test backend connection
                await self.backend_client.health_check()
                self.connected_services.add('backend')
                results['backend'] = True
                logger.info(f"✅ Backend HTTP client connected: {backend_url}")
            except Exception as e:
                logger.warning(f"❌ Backend client failed: {e}")
                self.failed_services.add('backend')
                results['backend'] = False
        
        # Initialize Bimba GraphQL client (depends on backend)
        if 'bimba' in required_services:
            try:
                graphql_client = BimbaGraphQLClient(backend_url)
                await graphql_client.connect()
                # Wrap in HTTP Bimba client to gain relationships + path traversal
                self.bimba_client = await create_http_bimba_client(graphql_client)
                # Test with a simple coordinate resolution
                test_result = await self.bimba_client.resolve_coordinate("#0")
                if test_result:
                    self.connected_services.add('bimba')
                    results['bimba'] = True
                    logger.info("✅ Bimba HTTP client connected (GraphQL-backed)")
                else:
                    raise Exception("Bimba client test failed")
            except Exception as e:
                logger.warning(f"❌ Bimba client failed: {e}")
                self.failed_services.add('bimba')
                results['bimba'] = False
        
        # Initialize LightRAG HTTP client (depends on backend)
        if 'lightrag' in required_services:
            try:
                self.lightrag_client = LightRAGHttpClient(backend_url)
                await self.lightrag_client.connect()
                # Test LightRAG connection
                await self.lightrag_client.health_check()
                self.connected_services.add('lightrag')
                results['lightrag'] = True
                logger.info("✅ LightRAG HTTP client connected")
            except Exception as e:
                logger.warning(f"❌ LightRAG client failed: {e}")
                self.failed_services.add('lightrag')
                results['lightrag'] = False
        
        # Initialize Graphiti HTTP client (depends on backend)
        if 'graphiti' in required_services:
            try:
                self.graphiti_client = GraphitiHttpClient(backend_url)
                await self.graphiti_client.connect()
                # Test Graphiti connection
                await self.graphiti_client.health_check()
                self.connected_services.add('graphiti')
                results['graphiti'] = True
                logger.info("✅ Graphiti HTTP client connected")
            except Exception as e:
                logger.warning(f"❌ Graphiti client failed: {e}")
                self.failed_services.add('graphiti')
                results['graphiti'] = False
        
        # Initialize Redis session client (async manager for AG-UI compatibility)
        if 'redis' in required_services:
            try:
                from ..session.async_session import create_async_session_manager
                self.redis_client = await create_async_session_manager()
                self.connected_services.add('redis')
                results['redis'] = True
                logger.info("✅ Async Redis session manager connected")
            except Exception as e:
                logger.warning(f"❌ Redis client failed: {e}")
                self.failed_services.add('redis')
                results['redis'] = False
        
        # Initialize MongoDB conversation service (direct connection within agentic layer)
        if 'mongo' in required_services:
            try:
                from shared.database.conversation_service import ConversationService
                self.mongo_client = ConversationService()
                # Test underlying MongoDB connection via the conversation service
                if self.mongo_client._mongo.test_connection():
                    self.connected_services.add('mongo')
                    results['mongo'] = True
                    logger.info("✅ MongoDB conversation service connected")
                else:
                    raise Exception("MongoDB conversation service connection test failed")
            except Exception as e:
                logger.warning(f"❌ MongoDB client failed: {e}")
                self.failed_services.add('mongo')
                results['mongo'] = False
        
        connected_count = len(self.connected_services)
        total_count = len(required_services)
        
        logger.info(f"🔗 HTTP clients initialized: {connected_count}/{total_count} services connected")
        
        if connected_count == 0:
            logger.error("❌ CRITICAL: No HTTP clients connected! System cannot function.")
        elif connected_count < total_count:
            logger.warning(f"⚠️  Partial connection: {self.failed_services} services failed. System will use graceful degradation.")
        else:
            logger.info("🎉 All HTTP clients connected successfully!")
        
        return results
    
    async def close_all(self):
        """Close all connected clients"""
        if self.backend_client:
            await self.backend_client.close()
        if self.bimba_client:
            await self.bimba_client.close()
        if self.lightrag_client:
            await self.lightrag_client.close()
        if self.graphiti_client:
            await self.graphiti_client.close()
        if self.redis_client:
            await self.redis_client.close()
        if self.mongo_client:
            await self.mongo_client.close()
        
        logger.info("🔚 All HTTP clients closed")
    
    def get_status(self) -> Dict[str, Any]:
        """Get status of all clients"""
        return {
            'connected_services': list(self.connected_services),
            'failed_services': list(self.failed_services),
            'connected_count': len(self.connected_services),
            'total_available': 6,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'clients': {
                'backend': self.backend_client is not None,
                'bimba': self.bimba_client is not None,
                'lightrag': self.lightrag_client is not None,
                'graphiti': self.graphiti_client is not None,
                'redis': self.redis_client is not None,
                'mongo': self.mongo_client is not None,
            },
            'architecture_type': 'HTTP-based trilaminar'
        }
    
    def is_service_connected(self, service: str) -> bool:
        """Check if a specific service is connected"""
        return service in self.connected_services


async def create_enhanced_orchestrator_deps(
    session_id: str,
    user_id: str,
    current_persona: str,
    model_config: str = "gemini-2.5-flash",
    auth_token: Optional[str] = None,
):
    """
    Create enhanced orchestrator dependencies using HTTP clients.
    
    This replaces the direct database connections with HTTP-based clients
    that communicate through the Backend layer APIs.
    
    Returns OrchestratorDeps for Pydantic AI StateHandler protocol compatibility.
    """
    from ..orchestrator_agent import OrchestratorDeps
    
    # Create HTTP clients container
    container = HttpClientsContainer()
    
    # Initialize all HTTP clients
    await container.initialize_all()

    # If an auth token is provided, rebuild key clients with Authorization header
    default_headers = {"Authorization": f"Bearer {auth_token}"} if auth_token else None
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    if auth_token:
        try:
            # Replace backend client with authorized one
            container.backend_client = BackendHttpClient(backend_url, default_headers=default_headers)
            await container.backend_client.connect()

            # Replace Bimba GraphQL client with authorized one
            graphql_client = BimbaGraphQLClient(backend_url)
            # Inject Authorization by directly setting header on underlying base client after connect
            await graphql_client.connect()
            # Patch headers on the underlying HTTPX client
            if getattr(graphql_client, "_client", None):
                graphql_client._client.headers.update(default_headers)
            container.bimba_client = await create_http_bimba_client(graphql_client)
        except Exception as e:
            logger.warning(f"Failed to set Authorization on HTTP clients: {e}")
    
    # Create OrchestratorDeps with HTTP clients and state support
    # Optional: enrich context with user info for gating (best-effort)
    context_pkg = None
    if auth_token and container.backend_client:
        try:
            me = await container.backend_client.get("/api/auth/me")
            if isinstance(me, dict) and me.get("success") and me.get("data", {}).get("user"):
                context_pkg = {"user": me["data"]["user"]}
        except Exception:
            # Non-fatal; backend might not be reachable or token invalid
            context_pkg = None

    deps = OrchestratorDeps(
        session_id=session_id,
        user_id=user_id,
        redis_client=container.redis_client,
        conversation_service=container.mongo_client,
        bimba_client=container.bimba_client,
        lightrag_client=container.lightrag_client,
        graphiti_client=container.graphiti_client,
        current_persona=current_persona,
        context_package=context_pkg,
        state={}  # Initialize empty state dict for StateHandler protocol
    )
    
    logger.info(f"Enhanced HTTP orchestrator deps created for session {session_id} ({current_persona})")
    return deps
