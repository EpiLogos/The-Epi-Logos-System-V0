"""
Bimba Tools - REAL Neo4j integration for coordinate resolution and Bimba system functionality

This module provides REAL tools for working with the Bimba coordinate system,
including coordinate resolution, validation, and semantic content retrieval from Neo4j.
"""

import logging
import os
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from neo4j import GraphDatabase, Driver
import asyncio

logger = logging.getLogger(__name__)


class BimbaCoordinateError(Exception):
    """Exception raised for Bimba coordinate-related errors"""
    pass


class Neo4jBimbaClient:
    """REAL Neo4j client for Bimba coordinate operations"""
    
    def __init__(self, uri: str = None, username: str = None, password: str = None, database: str = None):
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.username = username or os.getenv("NEO4J_USERNAME", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD", "ep11ep11")
        self.database = database or os.getenv("NEO4J_DATABASE", "neo4j")
        self.driver: Optional[Driver] = None
        
    async def connect(self):
        """Establish connection to Neo4j"""
        try:
            self.driver = GraphDatabase.driver(
                self.uri, 
                auth=(self.username, self.password)
            )
            # Test connection
            await asyncio.to_thread(self.driver.verify_connectivity)
            logger.info(f"Connected to Neo4j at {self.uri}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            return False
    
    async def close(self):
        """Close Neo4j connection"""
        if self.driver:
            await asyncio.to_thread(self.driver.close)
            
    async def query_coordinate(self, coordinate: str) -> Dict[str, Any]:
        """Query Neo4j for Bimba coordinate data"""
        if not self.driver:
            raise BimbaCoordinateError("Neo4j driver not connected")
            
        # Parse coordinate for Neo4j query
        parsed = parse_coordinate(coordinate)
        if not parsed.get('is_valid'):
            raise BimbaCoordinateError(f"Invalid coordinate format: {coordinate}")
        
        subsystem = parsed.get('subsystem')
        domain = parsed.get('domain')
        detail = parsed.get('coordinate_detail')
        
        # Build Cypher query based on coordinate structure
        if detail:
            cypher = """
            MATCH (n:BimbaNode {subsystem: $subsystem, domain: $domain, detail: $detail})
            OPTIONAL MATCH (n)-[r]-(related)
            RETURN n, r, related
            LIMIT 50
            """
            params = {"subsystem": subsystem, "domain": domain, "detail": detail}
        elif domain is not None:
            cypher = """
            MATCH (n:BimbaNode {subsystem: $subsystem, domain: $domain})
            OPTIONAL MATCH (n)-[r]-(related)
            RETURN n, r, related
            LIMIT 50
            """
            params = {"subsystem": subsystem, "domain": domain}
        else:
            cypher = """
            MATCH (n:BimbaNode {subsystem: $subsystem})
            OPTIONAL MATCH (n)-[r]-(related)
            RETURN n, r, related
            LIMIT 50
            """
            params = {"subsystem": subsystem}
        
        try:
            def run_query(tx):
                return list(tx.run(cypher, params))
            
            with self.driver.session(database=self.database) as session:
                result = await asyncio.to_thread(session.execute_read, run_query)
                
            if not result:
                # Try broader search
                fallback_cypher = """
                MATCH (n:BimbaNode)
                WHERE n.coordinate CONTAINS $coord_str OR n.name CONTAINS $coord_str
                OPTIONAL MATCH (n)-[r]-(related)
                RETURN n, r, related
                LIMIT 10
                """
                
                def run_fallback(tx):
                    return list(tx.run(fallback_cypher, {"coord_str": coordinate}))
                
                with self.driver.session(database=self.database) as session:
                    result = await asyncio.to_thread(session.execute_read, run_fallback)
            
            return {
                'coordinate': coordinate,
                'results': [dict(record) for record in result],
                'count': len(result),
                'success': True,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Neo4j query error for {coordinate}: {e}")
            raise BimbaCoordinateError(f"Database query failed: {e}")
    
    async def search_related_coordinates(self, coordinate: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Find coordinates related to the given coordinate via Neo4j relationships"""
        if not self.driver:
            raise BimbaCoordinateError("Neo4j driver not connected")
        
        cypher = """
        MATCH (source:BimbaNode)
        WHERE source.coordinate = $coordinate OR source.coordinate CONTAINS $coordinate
        MATCH (source)-[r]-(related:BimbaNode)
        RETURN related.coordinate as coordinate, 
               type(r) as relationship, 
               related.name as name,
               related.content as content
        LIMIT $limit
        """
        
        try:
            def run_query(tx):
                return list(tx.run(cypher, {"coordinate": coordinate, "limit": limit}))
            
            with self.driver.session(database=self.database) as session:
                result = await asyncio.to_thread(session.execute_read, run_query)
            
            return [
                {
                    'coordinate': record['coordinate'],
                    'relationship': record['relationship'],
                    'name': record['name'],
                    'content': record['content'],
                    'similarity': 0.9  # Could be calculated based on relationship type
                }
                for record in result
            ]
            
        except Exception as e:
            logger.error(f"Error finding related coordinates for {coordinate}: {e}")
            return []


def parse_coordinate(coordinate: str) -> Dict[str, Any]:
    """Parse a Bimba coordinate string into its components"""
    try:
        # Basic coordinate parsing - handles formats like #1, #1-2, #1-2-3.4
        coordinate = coordinate.strip('#')
        parts = coordinate.split('-')
        
        result = {
            'raw': coordinate,
            'subsystem': int(parts[0]) if parts else None,
            'domain': int(parts[1]) if len(parts) > 1 else None,
            'coordinate_detail': parts[2] if len(parts) > 2 else None,
            'is_valid': True
        }
        
        return result
        
    except (ValueError, IndexError) as e:
        logger.warning(f"Invalid coordinate format: {coordinate}, error: {e}")
        return {
            'raw': coordinate,
            'is_valid': False,
            'error': str(e)
        }


def validate_coordinate(coordinate: str) -> bool:
    """Validate if a coordinate is properly formatted"""
    parsed = parse_coordinate(coordinate)
    return parsed.get('is_valid', False)


async def resolve_coordinate_sync(coordinate: str, bimba_client: Optional[Any] = None) -> Dict[str, Any]:
    """REAL coordinate resolution using Neo4j database"""
    logger.info(f"Resolving coordinate: {coordinate}")
    
    # Parse coordinate
    parsed = parse_coordinate(coordinate)
    if not parsed.get('is_valid'):
        return {
            'coordinate': coordinate,
            'success': False,
            'error': f"Invalid coordinate format: {coordinate}",
            'parsed': parsed
        }
    
    # Use real Neo4j client if provided, otherwise create one
    if isinstance(bimba_client, Neo4jBimbaClient):
        client = bimba_client
    else:
        client = Neo4jBimbaClient()
        await client.connect()
        
    try:
        result = await client.query_coordinate(coordinate)
        
        if result['count'] > 0:
            # Extract content from Neo4j results
            main_node = None
            relationships = []
            
            for record in result['results']:
                if 'n' in record and record['n'] is not None:
                    node_data = dict(record['n'])
                    if not main_node:
                        main_node = node_data
                    
                if 'r' in record and record['r'] is not None:
                    relationships.append({
                        'type': record['r'].type,
                        'properties': dict(record['r'])
                    })
            
            if main_node:
                content = f"""Coordinate {coordinate} resolved from Neo4j:
Name: {main_node.get('name', 'Unknown')}
Subsystem: {main_node.get('subsystem', 'Unknown')}
Content: {main_node.get('content', 'No content available')}
Description: {main_node.get('description', 'No description available')}

Connected to {len(relationships)} other nodes via relationships:
{', '.join([r['type'] for r in relationships[:5]])}
"""
                
                return {
                    'coordinate': coordinate,
                    'content': content,
                    'success': True,
                    'parsed': parsed,
                    'neo4j_data': main_node,
                    'relationships': relationships,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
        
        # No results found in Neo4j
        return {
            'coordinate': coordinate,
            'success': False,
            'error': f"Coordinate {coordinate} not found in Neo4j database",
            'parsed': parsed,
            'neo4j_searched': True,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Real Neo4j error resolving {coordinate}: {e}")
        return {
            'coordinate': coordinate,
            'success': False,
            'error': f"Neo4j database error: {str(e)}",
            'parsed': parsed
        }
    finally:
        # Close client if we created it
        if not isinstance(bimba_client, Neo4jBimbaClient):
            await client.close()


def get_coordinate_context(coordinate: str) -> Dict[str, Any]:
    """Get contextual information about a coordinate"""
    parsed = parse_coordinate(coordinate)
    
    if not parsed.get('is_valid'):
        return {'error': 'Invalid coordinate'}
    
    subsystem = parsed.get('subsystem')
    context = {
        'subsystem_focus': {
            0: "Void processing, foundational metacomputation",
            1: "Universal grammar, structural frameworks",
            2: "Vibrational architecture, frequency processing", 
            3: "Symbolic processing, DNA/I-Ching translation",
            4: "User interaction, oracle operations",
            5: "Master orchestration, meta-techne loops"
        }.get(subsystem, "Unknown subsystem"),
        'architectural_layer': {
            0: "Proto-Logical Processing",
            1: "Quaternal Logic Engine", 
            2: "Vibrational Matrix",
            3: "Transcription Engine",
            4: "Dialogical Interface",
            5: "Synthesis Layer"
        }.get(subsystem, "Unknown layer"),
        'database_alignment': f"DB-{subsystem}" if subsystem is not None else "Unknown"
    }
    
    return context


async def search_related_coordinates(coordinate: str, limit: int = 5, bimba_client: Optional[Any] = None) -> List[Dict[str, Any]]:
    """REAL search for coordinates related to the given coordinate via Neo4j"""
    parsed = parse_coordinate(coordinate)
    
    if not parsed.get('is_valid'):
        return []
    
    # Use real Neo4j client if provided, otherwise create one
    if isinstance(bimba_client, Neo4jBimbaClient):
        client = bimba_client
    else:
        client = Neo4jBimbaClient()
        await client.connect()
    
    try:
        related = await client.search_related_coordinates(coordinate, limit)
        return related
    except Exception as e:
        logger.error(f"Error searching related coordinates for {coordinate}: {e}")
        return []
    finally:
        # Close client if we created it
        if not isinstance(bimba_client, Neo4jBimbaClient):
            await client.close()


# Factory function to create a real Neo4j client
async def create_bimba_client() -> Neo4jBimbaClient:
    """Create and connect a Neo4j Bimba client"""
    client = Neo4jBimbaClient()
    connected = await client.connect()
    if not connected:
        raise BimbaCoordinateError("Failed to connect to Neo4j database")
    return client