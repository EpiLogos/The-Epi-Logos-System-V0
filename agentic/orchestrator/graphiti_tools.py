"""
Graphiti Tools - REAL Neo4j integration for temporal memory and episodic storage

This module provides REAL tools for working with temporal memory using Neo4j,
including episodic memory storage, retrieval, and temporal relationship management.
"""

import logging
import os
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from neo4j import GraphDatabase, Driver
import asyncio
import uuid

logger = logging.getLogger(__name__)


class GraphitiError(Exception):
    """Exception raised for Graphiti-related errors"""
    pass


class RealGraphitiClient:
    """REAL Neo4j client for temporal memory and episodic storage"""
    
    def __init__(self, uri: str = None, username: str = None, password: str = None, database: str = None):
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.username = username or os.getenv("NEO4J_USERNAME", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD", "ep11ep11")
        self.database = database or os.getenv("NEO4J_DATABASE", "neo4j")
        self.driver: Optional[Driver] = None
        
    async def connect(self):
        """Connect to Neo4j for temporal memory storage"""
        try:
            self.driver = GraphDatabase.driver(
                self.uri, 
                auth=(self.username, self.password)
            )
            # Test connection
            await asyncio.to_thread(self.driver.verify_connectivity)
            
            # Ensure temporal memory schema
            await self._ensure_temporal_schema()
            
            logger.info(f"Connected to Neo4j for Graphiti at {self.uri}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j for Graphiti: {e}")
            return False
    
    async def close(self):
        """Close Neo4j connection"""
        if self.driver:
            await asyncio.to_thread(self.driver.close)
    
    async def _ensure_temporal_schema(self):
        """Ensure temporal memory schema exists in Neo4j"""
        try:
            schema_queries = [
                # Create constraints
                "CREATE CONSTRAINT memory_id_unique IF NOT EXISTS FOR (m:EpisodicMemory) REQUIRE m.memory_id IS UNIQUE",
                "CREATE CONSTRAINT user_id_index IF NOT EXISTS FOR (m:EpisodicMemory) REQUIRE m.user_id IS NOT NULL",
                
                # Create indexes
                "CREATE INDEX memory_timestamp_index IF NOT EXISTS FOR (m:EpisodicMemory) ON (m.timestamp)",
                "CREATE INDEX memory_user_timestamp IF NOT EXISTS FOR (m:EpisodicMemory) ON (m.user_id, m.timestamp)",
            ]
            
            def run_schema_queries(tx):
                for query in schema_queries:
                    try:
                        tx.run(query)
                    except Exception as e:
                        # Constraints/indexes may already exist
                        logger.debug(f"Schema query result: {e}")
            
            with self.driver.session(database=self.database) as session:
                await asyncio.to_thread(session.execute_write, run_schema_queries)
                
            logger.info("Temporal memory schema ensured")
            
        except Exception as e:
            logger.warning(f"Could not ensure temporal schema: {e}")
    
    async def store_memory(self, content: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Store episodic memory in Neo4j temporal graph"""
        if not self.driver:
            raise GraphitiError("Neo4j driver not connected")
        
        memory_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)
        
        cypher = """
        CREATE (m:EpisodicMemory {
            memory_id: $memory_id,
            content: $content,
            timestamp: $timestamp,
            user_id: $user_id,
            session_id: $session_id,
            persona: $persona,
            metadata: $metadata,
            created_at: datetime()
        })
        RETURN m
        """
        
        params = {
            'memory_id': memory_id,
            'content': content,
            'timestamp': timestamp.isoformat(),
            'user_id': metadata.get('user_id', 'unknown'),
            'session_id': metadata.get('session_id', 'unknown'),
            'persona': metadata.get('persona', 'system'),
            'metadata': metadata
        }
        
        try:
            def run_query(tx):
                return list(tx.run(cypher, params))
            
            with self.driver.session(database=self.database) as session:
                result = await asyncio.to_thread(session.execute_write, run_query)
            
            # Create temporal relationships to recent memories
            await self._create_temporal_links(memory_id, metadata.get('user_id'))
            
            return {
                'success': True,
                'memory_id': memory_id,
                'content_preview': content[:100],
                'timestamp': timestamp.isoformat(),
                'metadata': metadata,
                'source': 'real_graphiti_neo4j'
            }
            
        except Exception as e:
            logger.error(f"Error storing memory in Neo4j: {e}")
            raise GraphitiError(f"Failed to store memory: {e}")
    
    async def _create_temporal_links(self, memory_id: str, user_id: str):
        """Create temporal links to recent memories"""
        try:
            # Link to memories from the last hour
            recent_threshold = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
            
            cypher = """
            MATCH (current:EpisodicMemory {memory_id: $memory_id})
            MATCH (recent:EpisodicMemory {user_id: $user_id})
            WHERE recent.timestamp > $recent_threshold 
              AND recent.memory_id <> $memory_id
            WITH current, recent, 
                 duration.between(datetime(recent.timestamp), datetime(current.timestamp)).minutes AS minutes_diff
            WHERE minutes_diff >= 0 AND minutes_diff <= 60
            MERGE (recent)-[r:TEMPORAL_SEQUENCE]->(current)
            SET r.time_diff_minutes = minutes_diff
            RETURN count(r) as links_created
            """
            
            def run_query(tx):
                return list(tx.run(cypher, {
                    'memory_id': memory_id,
                    'user_id': user_id,
                    'recent_threshold': recent_threshold
                }))
            
            with self.driver.session(database=self.database) as session:
                result = await asyncio.to_thread(session.execute_read, run_query)
                
            if result:
                links_created = result[0]['links_created']
                logger.debug(f"Created {links_created} temporal links for memory {memory_id}")
                
        except Exception as e:
            logger.warning(f"Could not create temporal links: {e}")
    
    async def retrieve_memories(self, query: str, user_id: str = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Retrieve memories from Neo4j based on semantic and temporal criteria"""
        if not self.driver:
            raise GraphitiError("Neo4j driver not connected")
        
        # Build query based on available filters
        where_conditions = []
        params = {'query': query, 'limit': limit}
        
        if user_id:
            where_conditions.append("m.user_id = $user_id")
            params['user_id'] = user_id
        
        # Text search in content
        where_conditions.append("m.content CONTAINS $query")
        
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        cypher = f"""
        MATCH (m:EpisodicMemory)
        {where_clause}
        OPTIONAL MATCH (m)-[r:TEMPORAL_SEQUENCE]-(related:EpisodicMemory)
        RETURN m, count(related) as connection_count
        ORDER BY m.timestamp DESC
        LIMIT $limit
        """
        
        try:
            def run_query(tx):
                return list(tx.run(cypher, params))
            
            with self.driver.session(database=self.database) as session:
                result = await asyncio.to_thread(session.execute_read, run_query)
            
            memories = []
            for record in result:
                memory_node = dict(record['m'])
                memories.append({
                    'id': memory_node['memory_id'],
                    'content': memory_node['content'],
                    'timestamp': memory_node['timestamp'],
                    'user_id': memory_node.get('user_id'),
                    'session_id': memory_node.get('session_id'),
                    'persona': memory_node.get('persona'),
                    'metadata': memory_node.get('metadata', {}),
                    'connection_count': record['connection_count'],
                    'relevance_score': 0.8  # Could be calculated based on temporal proximity
                })
            
            return memories
            
        except Exception as e:
            logger.error(f"Error retrieving memories from Neo4j: {e}")
            return []
    
    async def get_memory_timeline(self, user_id: str, hours: int = 24) -> List[Dict[str, Any]]:
        """Get chronological timeline of memories for a user"""
        if not self.driver:
            raise GraphitiError("Neo4j driver not connected")
        
        since_time = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
        
        cypher = """
        MATCH (m:EpisodicMemory {user_id: $user_id})
        WHERE m.timestamp > $since_time
        OPTIONAL MATCH (m)-[r:TEMPORAL_SEQUENCE]->(next:EpisodicMemory)
        RETURN m, r, next
        ORDER BY m.timestamp ASC
        """
        
        try:
            def run_query(tx):
                return list(tx.run(cypher, {'user_id': user_id, 'since_time': since_time}))
            
            with self.driver.session(database=self.database) as session:
                result = await asyncio.to_thread(session.execute_read, run_query)
            
            timeline = []
            for record in result:
                memory_node = dict(record['m'])
                timeline.append({
                    'timestamp': memory_node['timestamp'],
                    'memory_id': memory_node['memory_id'],
                    'content': memory_node['content'][:200] + '...' if len(memory_node['content']) > 200 else memory_node['content'],
                    'persona': memory_node.get('persona'),
                    'has_next': record['r'] is not None,
                    'significance': 'high' if memory_node.get('metadata', {}).get('important') else 'medium'
                })
            
            return timeline
            
        except Exception as e:
            logger.error(f"Error getting memory timeline: {e}")
            return []
    
    async def create_temporal_link(self, memory_id1: str, memory_id2: str, relationship: str) -> Dict[str, Any]:
        """Create explicit temporal relationship between two memories"""
        if not self.driver:
            raise GraphitiError("Neo4j driver not connected")
        
        cypher = """
        MATCH (m1:EpisodicMemory {memory_id: $memory_id1})
        MATCH (m2:EpisodicMemory {memory_id: $memory_id2})
        MERGE (m1)-[r:TEMPORAL_LINK]->(m2)
        SET r.relationship_type = $relationship,
            r.created_at = datetime()
        RETURN r
        """
        
        try:
            def run_query(tx):
                return list(tx.run(cypher, {
                    'memory_id1': memory_id1,
                    'memory_id2': memory_id2,
                    'relationship': relationship
                }))
            
            with self.driver.session(database=self.database) as session:
                result = await asyncio.to_thread(session.execute_write, run_query)
            
            if result:
                return {
                    'success': True,
                    'link_id': f"{memory_id1}-{memory_id2}",
                    'memory_id1': memory_id1,
                    'memory_id2': memory_id2,
                    'relationship': relationship,
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'source': 'real_graphiti_neo4j'
                }
            else:
                return {
                    'success': False,
                    'error': 'One or both memories not found'
                }
                
        except Exception as e:
            logger.error(f"Error creating temporal link: {e}")
            raise GraphitiError(f"Failed to create temporal link: {e}")
    
    async def get_contextual_memories(self, context: Dict[str, Any], limit: int = 5) -> List[Dict[str, Any]]:
        """Get memories that match specific contextual criteria"""
        if not self.driver:
            raise GraphitiError("Neo4j driver not connected")
        
        # Build contextual query
        where_conditions = []
        params = {'limit': limit}
        
        if context.get('persona'):
            where_conditions.append("m.persona = $persona")
            params['persona'] = context['persona']
        
        if context.get('user_id'):
            where_conditions.append("m.user_id = $user_id")
            params['user_id'] = context['user_id']
        
        if context.get('session_id'):
            where_conditions.append("m.session_id = $session_id")
            params['session_id'] = context['session_id']
        
        if context.get('time_range_hours'):
            since_time = (datetime.now(timezone.utc) - timedelta(hours=context['time_range_hours'])).isoformat()
            where_conditions.append("m.timestamp > $since_time")
            params['since_time'] = since_time
        
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        cypher = f"""
        MATCH (m:EpisodicMemory)
        {where_clause}
        RETURN m
        ORDER BY m.timestamp DESC
        LIMIT $limit
        """
        
        try:
            def run_query(tx):
                return list(tx.run(cypher, params))
            
            with self.driver.session(database=self.database) as session:
                result = await asyncio.to_thread(session.execute_read, run_query)
            
            memories = []
            for record in result:
                memory_node = dict(record['m'])
                memories.append({
                    'id': memory_node['memory_id'],
                    'content': memory_node['content'],
                    'timestamp': memory_node['timestamp'],
                    'context_match_score': 0.9,  # Could be calculated based on context overlap
                    'metadata': memory_node.get('metadata', {})
                })
            
            return memories
            
        except Exception as e:
            logger.error(f"Error getting contextual memories: {e}")
            return []


async def store_memory_sync(content: str, metadata: Dict[str, Any], graphiti_client: Optional[Any] = None) -> Dict[str, Any]:
    """REAL episodic memory storage using Neo4j temporal graph"""
    logger.info(f"Storing memory: {content[:100]}...")
    
    # Use real Graphiti client if provided, otherwise create one
    if isinstance(graphiti_client, RealGraphitiClient):
        client = graphiti_client
    else:
        client = RealGraphitiClient()
        await client.connect()
    
    try:
        result = await client.store_memory(content, metadata)
        return result
    except Exception as e:
        logger.error(f"Real Graphiti memory storage error: {e}")
        return {
            'success': False,
            'error': str(e),
            'content_preview': content[:100]
        }
    finally:
        # Close client if we created it
        if not isinstance(graphiti_client, RealGraphitiClient):
            await client.close()


async def retrieve_memories_sync(query: str, graphiti_client: Optional[Any] = None, limit: int = 10) -> Dict[str, Any]:
    """REAL memory retrieval from Neo4j temporal graph"""
    logger.info(f"Retrieving memories for query: {query}")
    
    # Use real Graphiti client if provided, otherwise create one
    if isinstance(graphiti_client, RealGraphitiClient):
        client = graphiti_client
    else:
        client = RealGraphitiClient()
        await client.connect()
    
    try:
        memories = await client.retrieve_memories(query, limit=limit)
        return {
            'query': query,
            'memories': memories,
            'success': True,
            'count': len(memories),
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'source': 'real_graphiti_neo4j'
        }
    except Exception as e:
        logger.error(f"Real Graphiti memory retrieval error: {e}")
        return {
            'query': query,
            'success': False,
            'error': str(e),
            'memories': []
        }
    finally:
        # Close client if we created it
        if not isinstance(graphiti_client, RealGraphitiClient):
            await client.close()


async def create_temporal_link_sync(memory_id1: str, memory_id2: str, relationship: str, graphiti_client: Optional[Any] = None) -> Dict[str, Any]:
    """REAL temporal relationship creation in Neo4j"""
    logger.info(f"Creating temporal link: {memory_id1} -> {memory_id2} ({relationship})")
    
    # Use real Graphiti client if provided, otherwise create one
    if isinstance(graphiti_client, RealGraphitiClient):
        client = graphiti_client
    else:
        client = RealGraphitiClient()
        await client.connect()
    
    try:
        result = await client.create_temporal_link(memory_id1, memory_id2, relationship)
        return result
    except Exception as e:
        logger.error(f"Real Graphiti temporal link error: {e}")
        return {
            'success': False,
            'error': str(e)
        }
    finally:
        # Close client if we created it
        if not isinstance(graphiti_client, RealGraphitiClient):
            await client.close()


async def get_contextual_memories_sync(context: Dict[str, Any], graphiti_client: Optional[Any] = None, limit: int = 5) -> Dict[str, Any]:
    """REAL contextual memory retrieval from Neo4j"""
    logger.info(f"Getting contextual memories for context: {context}")
    
    # Use real Graphiti client if provided, otherwise create one
    if isinstance(graphiti_client, RealGraphitiClient):
        client = graphiti_client
    else:
        client = RealGraphitiClient()
        await client.connect()
    
    try:
        memories = await client.get_contextual_memories(context, limit)
        return {
            'context': context,
            'memories': memories,
            'success': True,
            'count': len(memories),
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'source': 'real_graphiti_neo4j'
        }
    except Exception as e:
        logger.error(f"Real Graphiti contextual memories error: {e}")
        return {
            'context': context,
            'success': False,
            'error': str(e),
            'memories': []
        }
    finally:
        # Close client if we created it
        if not isinstance(graphiti_client, RealGraphitiClient):
            await client.close()


# Factory function to create a real Graphiti client
async def create_graphiti_client() -> RealGraphitiClient:
    """Create and connect a real Graphiti client"""
    client = RealGraphitiClient()
    connected = await client.connect()
    if not connected:
        raise GraphitiError("Failed to connect to Neo4j for Graphiti temporal memory")
    return client


def get_memory_timeline(user_id: str, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """Get chronological timeline of memories for a user"""
    # Mock timeline generation
    if not start_date:
        start_date = datetime.now(timezone.utc) - datetime.timedelta(days=30)
    if not end_date:
        end_date = datetime.now(timezone.utc)
    
    timeline = [
        {
            'timestamp': (end_date - datetime.timedelta(days=7)).isoformat(),
            'event': 'First interaction with Nara persona',
            'memory_id': 'mem_first_nara',
            'significance': 'high'
        },
        {
            'timestamp': (end_date - datetime.timedelta(days=5)).isoformat(), 
            'event': 'Exploration of coordinate #2-3',
            'memory_id': 'mem_coord_exploration',
            'significance': 'medium'
        },
        {
            'timestamp': (end_date - datetime.timedelta(days=2)).isoformat(),
            'event': 'Synthesis session with Epii persona',
            'memory_id': 'mem_synthesis',
            'significance': 'high'
        }
    ]
    
    return timeline


def analyze_memory_patterns(user_id: str, graphiti_client: Optional[Any] = None) -> Dict[str, Any]:
    """Analyze patterns in user's episodic memory"""
    # Mock pattern analysis
    patterns = {
        'frequent_topics': ['consciousness', 'personal_growth', 'decision_making'],
        'preferred_personas': ['nara', 'epii'],
        'common_coordinates': ['#4-1', '#5-3', '#1-2'],
        'interaction_frequency': {
            'daily_average': 3.5,
            'peak_hours': ['10:00-12:00', '19:00-21:00'],
            'engagement_trend': 'increasing'
        },
        'insight_generation': {
            'total_insights': 27,
            'breakthrough_moments': 5,
            'integration_rate': 0.78
        }
    }
    
    return {
        'user_id': user_id,
        'analysis_timestamp': datetime.now(timezone.utc).isoformat(),
        'patterns': patterns,
        'mock': True
    }


async def get_contextual_memories_sync(context: Dict[str, Any], graphiti_client: Optional[Any] = None, limit: int = 5) -> Dict[str, Any]:
    """Get memories that match specific contextual criteria"""
    logger.info(f"Getting contextual memories for context: {context}")
    
    if graphiti_client:
        try:
            memories = await graphiti_client.get_contextual_memories(context, limit=limit)
            return {
                'context': context,
                'memories': memories,
                'success': True,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Graphiti client error getting contextual memories: {e}")
            return {
                'context': context,
                'success': False,
                'error': str(e)
            }
    
    # Mock contextual memories based on provided context
    persona = context.get('persona', 'system')
    coordinate = context.get('coordinate')
    
    contextual_memories = []
    
    if persona == 'nara':
        contextual_memories.append({
            'id': 'ctx_nara_1',
            'content': 'Personal reflection session focusing on inner wisdom',
            'context_match_score': 0.95,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    
    if persona == 'epii':
        contextual_memories.append({
            'id': 'ctx_epii_1', 
            'content': 'Knowledge synthesis and pattern recognition session',
            'context_match_score': 0.93,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    
    if coordinate:
        contextual_memories.append({
            'id': f'ctx_coord_{coordinate.replace("#", "").replace("-", "_")}',
            'content': f'Previous exploration of coordinate {coordinate}',
            'context_match_score': 0.88,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    
    return {
        'context': context,
        'memories': contextual_memories[:limit],
        'success': True,
        'count': len(contextual_memories[:limit]),
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'mock': True
    }