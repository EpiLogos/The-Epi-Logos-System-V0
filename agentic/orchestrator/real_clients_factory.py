"""
Real Clients Factory - Initialize all REAL database and service clients

This module provides factory functions to create and initialize all the real database 
clients for the orchestrator, replacing mock implementations with actual integrations.
"""

import logging
import os
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from .bimba_tools import create_bimba_client, Neo4jBimbaClient
from .lightrag_tools import create_lightrag_client, RealLightRAGClient
from .graphiti_tools import create_graphiti_client, RealGraphitiClient
from .redis_session_tools import create_redis_session_client, RealRedisSessionClient
from .mongo_conversation_tools import create_mongo_conversation_client, RealMongoConversationClient

logger = logging.getLogger(__name__)


class RealClientsContainer:
    """Container for all real database and service clients"""
    
    def __init__(self):
        self.bimba_client: Optional[Neo4jBimbaClient] = None
        self.lightrag_client: Optional[RealLightRAGClient] = None
        self.graphiti_client: Optional[RealGraphitiClient] = None
        self.redis_client: Optional[RealRedisSessionClient] = None
        self.mongo_client: Optional[RealMongoConversationClient] = None
        
        self.connected_services = set()
        self.failed_services = set()
        
    async def initialize_all(self, required_services: Optional[list] = None) -> Dict[str, bool]:
        """Initialize all available real clients"""
        if required_services is None:
            required_services = ['bimba', 'lightrag', 'graphiti', 'redis', 'mongo']
        
        results = {}
        
        # Initialize Neo4j Bimba client
        if 'bimba' in required_services:
            try:
                self.bimba_client = await create_bimba_client()
                self.connected_services.add('bimba')
                results['bimba'] = True
                logger.info("✅ Bimba (Neo4j) client connected")
            except Exception as e:
                logger.warning(f"❌ Bimba client failed: {e}")
                self.failed_services.add('bimba')
                results['bimba'] = False
        
        # Initialize LightRAG client (MongoDB + Qdrant)
        if 'lightrag' in required_services:
            try:
                self.lightrag_client = await create_lightrag_client()
                self.connected_services.add('lightrag')
                results['lightrag'] = True
                logger.info("✅ LightRAG (MongoDB + Qdrant) client connected")
            except Exception as e:
                logger.warning(f"❌ LightRAG client failed: {e}")
                self.failed_services.add('lightrag')
                results['lightrag'] = False
        
        # Initialize Graphiti client (Neo4j temporal memory)
        if 'graphiti' in required_services:
            try:
                self.graphiti_client = await create_graphiti_client()
                self.connected_services.add('graphiti')
                results['graphiti'] = True
                logger.info("✅ Graphiti (Neo4j temporal) client connected")
            except Exception as e:
                logger.warning(f"❌ Graphiti client failed: {e}")
                self.failed_services.add('graphiti')
                results['graphiti'] = False
        
        # Initialize Redis session client
        if 'redis' in required_services:
            try:
                self.redis_client = await create_redis_session_client()
                self.connected_services.add('redis')
                results['redis'] = True
                logger.info("✅ Redis session client connected")
            except Exception as e:
                logger.warning(f"❌ Redis client failed: {e}")
                self.failed_services.add('redis')
                results['redis'] = False
        
        # Initialize MongoDB conversation client
        if 'mongo' in required_services:
            try:
                self.mongo_client = await create_mongo_conversation_client()
                self.connected_services.add('mongo')
                results['mongo'] = True
                logger.info("✅ MongoDB conversation client connected")
            except Exception as e:
                logger.warning(f"❌ MongoDB client failed: {e}")
                self.failed_services.add('mongo')
                results['mongo'] = False
        
        connected_count = len(self.connected_services)
        total_count = len(required_services)
        
        logger.info(f"🔗 Real clients initialized: {connected_count}/{total_count} services connected")
        
        if connected_count == 0:
            logger.error("❌ CRITICAL: No real clients connected! System will fall back to mock implementations.")
        elif connected_count < total_count:
            logger.warning(f"⚠️  Partial connection: {self.failed_services} services failed. System will use graceful degradation.")
        else:
            logger.info("🎉 All real clients connected successfully!")
        
        return results
    
    async def close_all(self):
        """Close all connected clients"""
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
        
        logger.info("🔚 All real clients closed")
    
    def get_status(self) -> Dict[str, Any]:
        """Get status of all clients"""
        return {
            'connected_services': list(self.connected_services),
            'failed_services': list(self.failed_services),
            'connected_count': len(self.connected_services),
            'total_available': 5,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'clients': {
                'bimba': self.bimba_client is not None,
                'lightrag': self.lightrag_client is not None,
                'graphiti': self.graphiti_client is not None,
                'redis': self.redis_client is not None,
                'mongo': self.mongo_client is not None,
            }
        }
    
    def is_service_connected(self, service: str) -> bool:
        """Check if a specific service is connected"""
        return service in self.connected_services


# Global instance for easy access
_global_clients_container = None


async def get_real_clients_container(force_reinit: bool = False) -> RealClientsContainer:
    """Get or create the global real clients container"""
    global _global_clients_container
    
    if _global_clients_container is None or force_reinit:
        _global_clients_container = RealClientsContainer()
        await _global_clients_container.initialize_all()
    
    return _global_clients_container


async def create_enhanced_orchestrator_deps(
    session_id: str,
    user_id: str,
    current_persona: str = "system",
    model_config: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    use_real_clients: bool = True
):
    """Create enhanced orchestrator dependencies with real clients"""
    from ..agents.clean_orchestrator import CleanOrchestratorDeps
    
    if use_real_clients:
        # Get real clients
        clients = await get_real_clients_container()
        
        return CleanOrchestratorDeps(
            session_id=session_id,
            user_id=user_id,
            current_persona=current_persona,
            model_config=model_config or os.getenv('DEFAULT_LLM_MODEL', 'test'),
            context=context,
            
            # Real clients
            redis_client=clients.redis_client,
            mongodb_client=clients.mongo_client,
            bimba_client=clients.bimba_client,
            lightrag_client=clients.lightrag_client,
            graphiti_client=clients.graphiti_client,
            
            # Context packages (future)
            context_packages=context.get('packages') if context else None,
            act_protocol_enabled=context.get('act_enabled', False) if context else False
        )
    else:
        # Mock clients (graceful degradation)
        return CleanOrchestratorDeps(
            session_id=session_id,
            user_id=user_id,
            current_persona=current_persona,
            model_config=model_config or os.getenv('DEFAULT_LLM_MODEL', 'test'),
            context=context,
            
            # No real clients - will use mock implementations
            redis_client=None,
            mongodb_client=None,
            bimba_client=None,
            lightrag_client=None,
            graphiti_client=None,
            
            context_packages=None,
            act_protocol_enabled=False
        )


async def test_all_real_integrations() -> Dict[str, Any]:
    """Test all real integrations and return detailed results"""
    logger.info("🧪 Testing all real integrations...")
    
    clients = await get_real_clients_container()
    test_results = {}
    
    # Test Bimba (Neo4j coordinate resolution)
    if clients.bimba_client:
        try:
            from .bimba_tools import resolve_coordinate_sync
            result = await resolve_coordinate_sync("#1-2-3", clients.bimba_client)
            test_results['bimba'] = {
                'success': result.get('success', False),
                'detail': f"Resolved coordinate: {result.get('coordinate')}",
                'error': result.get('error')
            }
        except Exception as e:
            test_results['bimba'] = {'success': False, 'error': str(e)}
    else:
        test_results['bimba'] = {'success': False, 'error': 'Client not connected'}
    
    # Test LightRAG (MongoDB + Qdrant search)
    if clients.lightrag_client:
        try:
            from .lightrag_tools import search_knowledge_sync
            result = await search_knowledge_sync("test query", clients.lightrag_client, limit=2)
            test_results['lightrag'] = {
                'success': result.get('success', False),
                'detail': f"Found {result.get('count', 0)} results",
                'error': result.get('error')
            }
        except Exception as e:
            test_results['lightrag'] = {'success': False, 'error': str(e)}
    else:
        test_results['lightrag'] = {'success': False, 'error': 'Client not connected'}
    
    # Test Graphiti (Neo4j temporal memory)
    if clients.graphiti_client:
        try:
            from .graphiti_tools import store_memory_sync
            test_metadata = {'user_id': 'test', 'session_id': 'test-session'}
            result = await store_memory_sync("Test memory for integration test", test_metadata, clients.graphiti_client)
            test_results['graphiti'] = {
                'success': result.get('success', False),
                'detail': f"Stored memory: {result.get('memory_id')}",
                'error': result.get('error')
            }
        except Exception as e:
            test_results['graphiti'] = {'success': False, 'error': str(e)}
    else:
        test_results['graphiti'] = {'success': False, 'error': 'Client not connected'}
    
    # Test Redis (session management)
    if clients.redis_client:
        try:
            from .redis_session_tools import create_session_sync
            result = await create_session_sync("test-user", {"test": "data"}, clients.redis_client)
            test_results['redis'] = {
                'success': result.get('success', False),
                'detail': f"Created session: {result.get('session_id')}",
                'error': result.get('error')
            }
        except Exception as e:
            test_results['redis'] = {'success': False, 'error': str(e)}
    else:
        test_results['redis'] = {'success': False, 'error': 'Client not connected'}
    
    # Test MongoDB (conversation history)
    if clients.mongo_client:
        try:
            from .mongo_conversation_tools import add_message_sync
            test_message = {'role': 'user', 'content': 'Test message for integration test'}
            result = await add_message_sync("test-session", test_message, clients.mongo_client)
            test_results['mongo'] = {
                'success': result.get('success', False),
                'detail': f"Added message to session",
                'error': result.get('error')
            }
        except Exception as e:
            test_results['mongo'] = {'success': False, 'error': str(e)}
    else:
        test_results['mongo'] = {'success': False, 'error': 'Client not connected'}
    
    # Summary
    successful_tests = sum(1 for result in test_results.values() if result['success'])
    total_tests = len(test_results)
    
    summary = {
        'total_tests': total_tests,
        'successful_tests': successful_tests,
        'success_rate': successful_tests / total_tests if total_tests > 0 else 0,
        'all_passed': successful_tests == total_tests,
        'test_results': test_results,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    
    if summary['all_passed']:
        logger.info(f"🎉 ALL INTEGRATIONS PASSED! {successful_tests}/{total_tests} tests successful")
    else:
        logger.warning(f"⚠️  PARTIAL SUCCESS: {successful_tests}/{total_tests} integrations working")
    
    return summary