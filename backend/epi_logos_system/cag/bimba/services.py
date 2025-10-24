from pydantic import BaseModel
from typing import Optional

# Import from shared database package
from shared.database import Neo4jClient, RedisClient
import os
import math
import re
from typing import List, Dict, Any
import logging
import json

from backend.epi_logos_system.shared.embeddings import get_text_embedding
import hashlib
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class BimbaNode(BaseModel):
    coordinate: str
    name: str
    subsystem: Optional[str] = None
    description: Optional[str] = None
    operationalEssence: Optional[str] = None
    coreNature: Optional[str] = None
    function: Optional[str] = None
    architecturalFunction: Optional[str] = None
    symbol: Optional[str] = None
    uuid: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

# Real Neo4j repository
class NodeRepository:
    def __init__(self, neo4j_client: Neo4jClient):
        self.neo4j_client = neo4j_client
    
    def find_by_coordinate(self, coordinate: str) -> BimbaNode | None:
        print(f"Neo4j: Querying for coordinate {coordinate}")
        
        try:
            # Query Neo4j for Bimba coordinate
            node_data = self.neo4j_client.get_bimba_node(coordinate)
            
            if node_data:
                # Always map from bimbaCoordinate
                coord_value = node_data.get("bimbaCoordinate")

                # Convert datetime objects to strings if present
                created_at = node_data.get("created_at")
                updated_at = node_data.get("updated_at")
                if created_at and hasattr(created_at, 'isoformat'):
                    created_at = created_at.isoformat()
                if updated_at and hasattr(updated_at, 'isoformat'):
                    updated_at = updated_at.isoformat()

                return BimbaNode(
                    coordinate=coord_value,
                    name=node_data["name"],
                    subsystem=str(node_data.get("subsystem", "unknown")),
                    description=node_data.get("description"),
                    operationalEssence=node_data.get("operationalEssence"),
                    coreNature=node_data.get("coreNature"),
                    architecturalFunction=node_data.get("architecturalFunction") or node_data.get("function"),
                    symbol=node_data.get("symbol"),
                    uuid=node_data.get("uuid"),
                    createdAt=str(created_at) if created_at else None,
                    updatedAt=str(updated_at) if updated_at else None
                )
            
            # Not found; do not create nodes implicitly (read paths are pure)
            return None
            
        except Exception as e:
            print(f"Error querying Neo4j for coordinate {coordinate}: {e}")
            return None

    def find_shortest_path(self, start: str, end: str, hops: int) -> tuple[list[dict], list[dict]]:
        """Find shortest path nodes and relationships between two coordinates.

        Returns (nodes, relationships), or ([], []) if not found.
        """
        # Build Cypher with literal hop bound (never parameterized)
        # Anchored strictly by bimbaCoordinate
        query = f"""
        MATCH (start:BimbaNode {{ bimbaCoordinate: $start }})
        MATCH (end:BimbaNode {{ bimbaCoordinate: $end }})
        CALL {{
          WITH start, end
          MATCH p = shortestPath((start)-[*1..{hops}]-(end))
          RETURN p LIMIT 1
        }}
        RETURN 
          nodes(p) AS nodes,
          [i IN range(0, size(relationships(p))-1) |
            {{
              type: type(relationships(p)[i]),
              direction: CASE WHEN startNode(relationships(p)[i]) = nodes(p)[i] THEN 'OUTGOING' ELSE 'INCOMING' END,
              properties: properties(relationships(p)[i])
            }}
          ] AS rels
        """

        records, _summary, _keys = self.neo4j_client.execute_query(
            query, {"start": start, "end": end}
        )

        if not records:
            return [], []
        rec = records[0]
        nodes = [dict(n) for n in rec.get("nodes", [])]
        rels = [dict(r) for r in rec.get("rels", [])]
        return nodes, rels

    def create_bimba_node(self, data: dict) -> BimbaNode | None:
        """Create a Bimba node if it does not already exist.

        Enforces uniqueness on bimbaCoordinate; returns None if duplicate exists.
        """
        coordinate = data.get("coordinate")
        name = data.get("name")
        subsystem = data.get("subsystem")

        if not coordinate or not name or subsystem is None:
            raise ValueError("coordinate, name, and subsystem are required")

        # First check for existing node
        existing = self.neo4j_client.get_bimba_node(coordinate)
        if existing:
            return None

        query = """
        CREATE (n:BimbaNode {
            bimbaCoordinate: $coordinate,
            name: $name,
            subsystem: $subsystem,
            description: $description,
            operationalEssence: $operationalEssence,
            coreNature: $coreNature,
            function: $function,
            architecturalFunction: $architecturalFunction,
            symbol: $symbol,
            uuid: randomUUID(),
            created_at: datetime(),
            updated_at: datetime()
        })
        RETURN n
        """

        params = {
            "coordinate": coordinate,
            "name": name,
            "subsystem": int(subsystem),
            "description": data.get("description"),
            "operationalEssence": data.get("operationalEssence"),
            "coreNature": data.get("coreNature"),
            "function": data.get("function"),
            "architecturalFunction": data.get("architecturalFunction") or data.get("function"),
            "symbol": data.get("symbol"),
        }

        records, _summary, _keys = self.neo4j_client.execute_query(query, params)
        if not records:
            raise RuntimeError("Failed to create node")
        n = dict(records[0]["n"]) if records[0].get("n") is not None else {}
        # Map created node to BimbaNode model
        return BimbaNode(
            coordinate=n.get("bimbaCoordinate"),
            name=n.get("name"),
            subsystem=str(n.get("subsystem")) if n.get("subsystem") is not None else None,
            description=n.get("description"),
            operationalEssence=n.get("operationalEssence"),
            coreNature=n.get("coreNature"),
            function=n.get("function"),
            architecturalFunction=n.get("architecturalFunction") or n.get("function"),
            symbol=n.get("symbol"),
            uuid=n.get("uuid"),
            createdAt=str(n.get("created_at")) if n.get("created_at") else None,
            updatedAt=str(n.get("updated_at")) if n.get("updated_at") else None,
        )

    def create_or_update_bimba_relationship(
        self,
        from_coordinate: str,
        to_coordinate: str,
        relationship_type: str,
        properties: list[dict[str, str]],
        bidirectional: bool = False
    ) -> dict:
        """Create or update relationship between existing Bimba nodes using MERGE.

        Pre-validates both nodes exist, then uses MERGE for idempotent create/update.
        Returns relationship data and wasUpdate flag.

        Args:
            from_coordinate: Source node coordinate
            to_coordinate: Target node coordinate
            relationship_type: Relationship type (UPPERCASE_UNDERSCORES)
            properties: List of {"key": "...", "value": "..."} dicts
            bidirectional: Create reverse relationship too

        Returns:
            Dict with 'forward', 'reverse' (if bidirectional), and 'wasUpdate' keys

        Raises:
            ValueError: If either coordinate doesn't exist or relationship type invalid
        """
        # Step 1: Validate both nodes exist (prevents MERGE from creating nodes)
        from_node = self.neo4j_client.get_bimba_node(from_coordinate)
        to_node = self.neo4j_client.get_bimba_node(to_coordinate)

        if not from_node:
            raise ValueError(f"Source coordinate not found: {from_coordinate}")
        if not to_node:
            raise ValueError(f"Target coordinate not found: {to_coordinate}")

        # Step 2: Validate relationship type format
        import re
        if not re.match(r'^[A-Z_][A-Z0-9_]*$', relationship_type):
            raise ValueError(
                f"Invalid relationship type: {relationship_type}. "
                "Use UPPERCASE_WITH_UNDERSCORES (e.g., CONTAINS, RESONATES_WITH)"
            )

        # Step 3: Convert property array to dict
        props_dict = {prop["key"]: prop["value"] for prop in properties} if properties else {}

        # Step 4: Check if relationship exists (for wasUpdate flag)
        check_query = f"""
        MATCH (from:BimbaNode {{ bimbaCoordinate: $from_coord }})
              -[r:{relationship_type}]->
              (to:BimbaNode {{ bimbaCoordinate: $to_coord }})
        RETURN r
        """

        existing_records, _, _ = self.neo4j_client.execute_query(check_query, {
            "from_coord": from_coordinate,
            "to_coord": to_coordinate
        })
        was_update = len(existing_records) > 0

        # Step 5: MERGE relationship (safe because nodes pre-validated)
        merge_query = f"""
        MATCH (from:BimbaNode {{ bimbaCoordinate: $from_coord }})
        MATCH (to:BimbaNode {{ bimbaCoordinate: $to_coord }})
        MERGE (from)-[r:{relationship_type}]->(to)
        ON CREATE SET
            r.createdAt = datetime(),
            r.fromCoordinate = $from_coord,
            r.toCoordinate = $to_coord
        ON MATCH SET
            r.updatedAt = datetime()
        SET r += $properties
        RETURN r, type(r) as relType
        """

        params = {
            "from_coord": from_coordinate,
            "to_coord": to_coordinate,
            "properties": props_dict
        }

        records, _, _ = self.neo4j_client.execute_query(merge_query, params)

        if not records:
            raise RuntimeError("Failed to create/update relationship")

        forward_rel = dict(records[0]["r"])
        result = {
            "forward": forward_rel,
            "reverse": None,
            "wasUpdate": was_update
        }

        # Step 6: Optional bidirectional (same MERGE pattern)
        if bidirectional:
            reverse_query = f"""
            MATCH (from:BimbaNode {{ bimbaCoordinate: $from_coord }})
            MATCH (to:BimbaNode {{ bimbaCoordinate: $to_coord }})
            MERGE (to)-[r:{relationship_type}]->(from)
            ON CREATE SET
                r.createdAt = datetime(),
                r.fromCoordinate = $to_coord,
                r.toCoordinate = $from_coord,
                r.bidirectionalPair = true
            ON MATCH SET
                r.updatedAt = datetime()
            SET r += $properties
            RETURN r
            """

            rev_records, _, _ = self.neo4j_client.execute_query(reverse_query, params)
            result["reverse"] = dict(rev_records[0]["r"]) if rev_records else None

        return result

    def update_bimba_node(self, coordinate: str, update_data: dict) -> dict | None:
        """Update an existing Bimba node with flexible schema-based properties.

        Enforces:
        - Coordinate existence validation
        - Immutable bimbaCoordinate protection
        - Neo4j compatibility (no nested objects)
        - Partial updates (only provided properties are updated)
        - Automatic lastUpdated timestamp

        Returns the updated node's complete property set, or None if coordinate doesn't exist.
        """
        # Validate coordinate exists
        existing = self.neo4j_client.get_bimba_node(coordinate)
        if not existing:
            return None

        # Remove None values and immutable fields
        properties = {k: v for k, v in update_data.items() if v is not None}

        # Protect immutable coordinate identity
        properties.pop("coordinate", None)
        properties.pop("bimbaCoordinate", None)

        # Reject fragmented position properties
        fragmented_keys = [k for k in properties.keys() if k.startswith("position_")]
        if fragmented_keys:
            raise ValueError(f"Fragmented position properties not allowed: {fragmented_keys}")

        # Validate Neo4j compatibility (no nested objects)
        for key, value in properties.items():
            if isinstance(value, dict):
                raise ValueError(f"Nested objects not allowed for Neo4j compatibility: {key}")
            # Arrays must be lists of primitives
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, (dict, list)):
                        raise ValueError(f"Nested structures in arrays not allowed: {key}")

        if not properties:
            # No valid updates provided
            return existing

        # Build Cypher update query with += for partial updates
        query = """
        MATCH (n:BimbaNode { bimbaCoordinate: $coordinate })
        SET n += $properties,
            n.lastUpdated = datetime(),
            n.updated_at = datetime()
        RETURN n
        """

        params = {"coordinate": coordinate, "properties": properties}
        records, _summary, _keys = self.neo4j_client.execute_query(query, params)

        if not records:
            return None

        # Return complete updated node as dict
        n = dict(records[0]["n"]) if records[0].get("n") is not None else {}
        return n

# The service that uses the repository
class NodeService:
    def __init__(self, repo: NodeRepository):
        self._repo = repo
        self._redis = RedisClient()

    def get_node(self, coordinate: str) -> BimbaNode | None:
        return self._repo.find_by_coordinate(coordinate=coordinate)

    def get_node_extended(self, coordinate: str) -> dict | None:
        """Get complete node with all flexible schema properties.

        Returns the raw Neo4j node data as a dict with all properties,
        including extended schema fields like keyPrinciples, internalStructure, etc.
        This is for comprehensive inspection, not quick lookups.
        """
        node_data = self._repo.neo4j_client.get_bimba_node(coordinate)
        if not node_data:
            return None

        # Return complete property set (Neo4j already fetched everything)
        return dict(node_data)

    def get_node_complete(self, coordinate: str, include_functional_properties: bool = False) -> dict | None:
        """Get node with ALL Neo4j properties (selective filtering).

        Returns dict with coordinate, name, and allProperties containing
        properties from Neo4j via Generic scalar, regardless of schema.
        Automatically filters out embeddings metadata, internal timestamps,
        and functional properties (f_* prefixed) unless explicitly requested.
        This enables agents to access any property without knowing field names.

        Args:
            coordinate: Bimba coordinate to retrieve
            include_functional_properties: If True, include f_* prefixed functional properties.
                                          Default False filters them out.
        """
        node_data = self._repo.neo4j_client.get_bimba_node(coordinate)
        if not node_data:
            return None

        # Filter out embeddings metadata and internal timestamps
        # These are system-internal properties not useful for agent reasoning
        exclude_props = {
            # Embeddings metadata (from regenerate_node_embedding)
            "embeddings",
            "embedding_updated_at",
            "embedding_model",
            "embedding_dim",
            "embedding_hash",
            # Internal system timestamps (different from user-facing createdAt/updatedAt)
            "created_at",
            "updated_at",
            "lastUpdated",  # Duplicate of updated_at
        }

        # Filter properties while preserving all others
        # Additionally filter functional properties (f_* prefix) unless explicitly requested
        def should_include_prop(key: str) -> bool:
            if key in exclude_props:
                return False
            if key.startswith("f_") and not include_functional_properties:
                return False
            return True

        filtered_props = {k: v for k, v in node_data.items() if should_include_prop(k)}

        # Serialize Neo4j types to JSON-compatible values
        # Generic scalar expects JSON-serializable data, but Neo4j returns DateTime, Duration, Point, etc.
        serialized_props = self._serialize_neo4j_types(filtered_props)

        return {
            "coordinate": node_data.get("bimbaCoordinate"),
            "name": node_data.get("name"),
            "allProperties": serialized_props  # Fully JSON-serializable properties
        }

    def _serialize_neo4j_types(self, data: Any) -> Any:
        """Recursively serialize Neo4j types to JSON-compatible values.

        Handles:
        - DateTime -> ISO string
        - Duration -> string representation
        - Point -> dict with coordinates
        - Date, Time -> ISO string
        - Lists and dicts (recursively)
        """
        if data is None:
            return None

        # Neo4j DateTime (has iso_format method)
        if hasattr(data, 'iso_format'):
            return data.iso_format()

        # Neo4j Duration
        if hasattr(data, 'months') and hasattr(data, 'days') and hasattr(data, 'seconds'):
            return str(data)

        # Neo4j Point (spatial)
        if hasattr(data, 'srid') and hasattr(data, 'coords'):
            return {
                'srid': data.srid,
                'x': data.coords[0] if len(data.coords) > 0 else None,
                'y': data.coords[1] if len(data.coords) > 1 else None,
                'z': data.coords[2] if len(data.coords) > 2 else None,
            }

        # Python datetime (fallback for any datetime objects)
        if hasattr(data, 'isoformat'):
            return data.isoformat()

        # Lists - recursively serialize elements
        if isinstance(data, list):
            return [self._serialize_neo4j_types(item) for item in data]

        # Dicts - recursively serialize values
        if isinstance(data, dict):
            return {k: self._serialize_neo4j_types(v) for k, v in data.items()}

        # Primitives (str, int, float, bool) pass through
        return data

    def get_node_relationships(self, coordinate: str) -> dict | None:
        """Return a node bundled with its immediate relationship edges.

        Uses the shared Neo4j client to fetch both the node and all direct
        incoming/outgoing relationships, formatting the result to match the
        GraphQL schema NodeWithEdges shape.

        Filters out embeddings metadata and internal timestamps from neighbor nodes
        to keep the response clean and focused on semantic content.
        """
        # First, resolve the node itself
        node = self.get_node(coordinate)
        if not node:
            return None

        # Fetch relationships via Neo4j client helper
        edges_raw = self._repo.neo4j_client.get_bimba_node_relationships(coordinate)

        # Transform raw edges into GraphQL-friendly structures
        edges: list[dict] = []
        for edge in edges_raw:
            neighbor = edge.get("neighbor", {})

            # Normalize coordinate field to always be present
            neighbor_coord = neighbor.get("bimbaCoordinate")

            # Skip edges with invalid neighbors (missing bimbaCoordinate)
            if not neighbor_coord:
                print(f"Warning: Skipping edge with neighbor missing bimbaCoordinate: {neighbor.get('name', 'Unknown')} (uuid: {neighbor.get('uuid', 'N/A')})")
                continue

            neighbor_dict = {
                "coordinate": neighbor_coord,
                "name": neighbor.get("name"),
                "subsystem": str(neighbor.get("subsystem")) if neighbor.get("subsystem") is not None else None,
                "description": neighbor.get("description"),
                "operationalEssence": neighbor.get("operationalEssence"),
                "coreNature": neighbor.get("coreNature"),
                "function": neighbor.get("function"),
                "architecturalFunction": neighbor.get("architecturalFunction") or neighbor.get("function"),
                "symbol": neighbor.get("symbol"),
                "uuid": neighbor.get("uuid"),
                # Note: Intentionally omitting timestamps and embeddings metadata
                # to keep relationship responses clean and focused on semantic content
            }

            # Flatten relationship properties into key-value array
            rel_props = edge.get("properties", {}) or {}
            properties_list = [
                {"key": k, "value": rel_props[k] if rel_props[k] is not None else None}
                for k in rel_props
            ]

            edges.append(
                {
                    "type": edge.get("type"),
                    "direction": edge.get("direction"),
                    "neighbor": neighbor_dict,
                    "properties": properties_list,
                }
            )

        return {
            "node": node.model_dump(),
            "edges": edges,
        }

    def get_path_between_coordinates(self, start_coordinate: str, end_coordinate: str, max_hops: Optional[int] = None) -> dict | None:
        """Return ordered path structure between two coordinates.

        Validates maxHops (>=1 and <= safety cap) and formats components.
        """
        # Determine default and safety cap from environment
        default_hops = int(os.getenv("BIMBA_MAX_HOPS_DEFAULT", "5"))
        cap_hops = int(os.getenv("BIMBA_MAX_HOPS_CAP", "10"))
        hops = default_hops if max_hops is None else int(max_hops)
        if hops < 1:
            raise ValueError("maxHops must be >= 1")
        if hops > cap_hops:
            raise ValueError(f"maxHops exceeds safety cap {cap_hops}")

        nodes, rels = self._repo.find_shortest_path(start_coordinate, end_coordinate, hops)
        if not nodes:
            return None

        components: list[dict] = []
        for idx, n in enumerate(nodes):
            components.append(
                {
                    "coordinate": n.get("bimbaCoordinate"),
                    "name": n.get("name"),
                    "subsystem": str(n.get("subsystem")) if n.get("subsystem") is not None else None,
                    "position": idx * 2,
                }
            )
            if idx < len(rels):
                r = rels[idx]
                props = r.get("properties") or {}
                props_list = [{"key": k, "value": props[k] if props[k] is not None else None} for k in props]
                components.append(
                    {
                        "type": r.get("type") or r.get("_type") or r.get("label") or "RELATED_TO",
                        "direction": r.get("direction") or "OUTGOING",
                        "properties": props_list,
                        "position": idx * 2 + 1,
                    }
                )

        start_node = nodes[0]
        end_node = nodes[-1]
        return {
            "startNode": {
                "coordinate": start_node.get("bimbaCoordinate"),
                "name": start_node.get("name"),
                "subsystem": str(start_node.get("subsystem")) if start_node.get("subsystem") is not None else None,
            },
            "endNode": {
                "coordinate": end_node.get("bimbaCoordinate"),
                "name": end_node.get("name"),
                "subsystem": str(end_node.get("subsystem")) if end_node.get("subsystem") is not None else None,
            },
            "pathLength": len(nodes) - 1,
            "pathComponents": components,
        }

    def create_bimba_node(self, input_data: dict) -> BimbaNode | None:
        """Create a Bimba node via repository with basic validation."""
        # Ensure we never write to a `coordinate` property in Neo4j; only bimbaCoordinate
        # Validation handled in repository; here we simply pass through.
        return self._repo.create_bimba_node(input_data)

    def create_bimba_relationship(
        self,
        from_coordinate: str,
        to_coordinate: str,
        relationship_type: str,
        properties: list[dict[str, str]],
        bidirectional: bool = False
    ) -> dict:
        """Create or update relationship between Bimba nodes with property validation.

        Performs business-layer validation and delegates to repository for MERGE operation.

        Args:
            from_coordinate: Source coordinate
            to_coordinate: Target coordinate
            relationship_type: Relationship type (validated format)
            properties: List of {"key": "...", "value": "..."} dicts
            bidirectional: Create reverse relationship

        Returns:
            Dict with relationship data and wasUpdate flag
        """
        # Validate property keys follow camelCase convention
        if properties:
            for prop in properties:
                key = prop.get("key", "")
                if key and not self._is_valid_property_name(key):
                    raise ValueError(
                        f"Invalid property key '{key}': must use camelCase "
                        "(e.g., harmonicFrequency, not HarmonicFrequency)"
                    )

        # Delegate to repository for MERGE operation
        return self._repo.create_or_update_bimba_relationship(
            from_coordinate=from_coordinate,
            to_coordinate=to_coordinate,
            relationship_type=relationship_type,
            properties=properties,
            bidirectional=bidirectional
        )

    def update_bimba_node(self, coordinate: str, update_data: dict) -> dict | None:
        """Update an existing Bimba node with flexible schema-based properties.

        Performs business-layer validation and delegates to repository for persistence.
        Returns the complete updated node, or None if coordinate doesn't exist.
        """
        # Validate property naming conventions (camelCase with scope)
        for key in update_data.keys():
            if key and not self._is_valid_property_name(key):
                raise ValueError(f"Invalid property name '{key}': must use camelCase with scope indicators")

        # Delegate to repository for data access
        return self._repo.update_bimba_node(coordinate, update_data)

    def _is_valid_property_name(self, name: str) -> bool:
        """Validate property names follow camelCase conventions.

        Allows: camelCase, arrays, subsystem patterns like 'spandaDevelopmentalStages'
        """
        if not name:
            return False
        # Basic camelCase check: starts with lowercase, no spaces, no special chars except underscores
        if name[0].isupper():
            return False
        if " " in name or any(c in name for c in ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "+", "=", "{", "}", "[", "]", "|", "\\", ":", ";", '"', "'", "<", ">", ",", "?", "/"]):
            return False
        return True

    def semantic_coordinate_discovery(self, query_text: str, max_results: Optional[int] = 7, alpha: Optional[float] = None) -> list[dict]:
        """Perform semantic-to-coordinate discovery via Neo4j vector index.

        Guardrails:
        - Read-only: no implicit mutations
        - Identity anchored strictly by bimbaCoordinate
        - Timeout enforced via driver (15s default)
        - Result cap at 20
        - Default 7 results: enables parent + complete mod6 children (e.g., #1 + #1-0 through #1-5)
        """
        # Enforce defaults and caps
        k_default = 7  # Mod6 QL alignment: parent + 6 children = complete structure
        k_cap = 20
        k = k_default if max_results is None else int(max_results)
        if k < 1:
            k = k_default
        k = min(k, k_cap)

        # Compute embedding for query text (query task type)
        embedding = get_text_embedding(query_text, purpose="query")

        # Single canonical index; no env flexibility to keep ops simple
        index_names = ["bimba_embeddings_idx"]
        timeout_ms = 15_000

        results: list[dict] = []
        seen_coords: set[str] = set()

        for idx_name in index_names:
            # Build Cypher with literal index name (Neo4j requires literal in CALL)
            cypher = (
                f"CALL db.index.vector.queryNodes('{idx_name}', $k, $q) "
                "YIELD node, score RETURN node, score LIMIT $k"
            )
            try:
                recs, _sum, _keys = self._repo.neo4j_client.execute_query(
                    cypher, {"k": k, "q": embedding}, timeout_ms=timeout_ms
                )
            except Exception:
                # Skip this index if query fails (e.g., index missing)
                recs = []

            for r in recs:
                n_obj = r.get("node")
                if n_obj is None:
                    n = {}
                elif isinstance(n_obj, dict):
                    n = n_obj
                elif hasattr(n_obj, "items"):
                    n = dict(n_obj)  # Neo4j-like map
                elif hasattr(n_obj, "__dict__"):
                    n = vars(n_obj)
                else:
                    n = {}
                coord = n.get("bimbaCoordinate")
                if not coord or coord in seen_coords:
                    continue
                seen_coords.add(coord)

                # Ensure name is always a string (defensive against arrays)
                name_raw = n.get("name")
                if isinstance(name_raw, list):
                    name = "; ".join(str(item) for item in name_raw if item) or coord
                else:
                    name = str(name_raw) if name_raw else coord

                score = float(r.get("score") or 0.0)

                # Extract semanticContext, ensuring it's always a string (not array)
                # Try description, coreNature, operationalEssence in order
                semantic_ctx = n.get("description") or n.get("coreNature") or n.get("operationalEssence")
                # If it's a list, join with semicolons; otherwise use as-is
                if isinstance(semantic_ctx, list):
                    semantic_ctx = "; ".join(str(item) for item in semantic_ctx if item)
                elif semantic_ctx is not None:
                    semantic_ctx = str(semantic_ctx)

                # Map to GraphQL type fields
                results.append(
                    {
                        "coordinate": coord,
                        "name": name,
                        "similarity": score,
                        "semanticContext": semantic_ctx,
                        "namespace": "Bimba",
                        "clusterId": _cluster_id_from_coordinate(coord),
                        "clusterTheme": _cluster_theme_from_coordinate(coord),
                    }
                )

        # Hybrid: BM25 full-text + vector union and rerank
        bm25_list: list[dict] = []
        try:
            ft_q = (
                "CALL db.index.fulltext.queryNodes('bimba_node_fulltext', $q) "
                "YIELD node, score RETURN node, score LIMIT $limit"
            )
            bm_recs, _fs, _fk = self._repo.neo4j_client.execute_query(
                ft_q, {"q": query_text, "limit": max(k * 5, 50)}
            )
            for r in bm_recs:
                n_obj = r.get("node")
                n = dict(n_obj) if isinstance(n_obj, dict) else (vars(n_obj) if hasattr(n_obj, "__dict__") else {})
                coord = n.get("bimbaCoordinate")
                if not coord:
                    continue
                bm25_list.append({"coordinate": coord, "bm25": float(r.get("score") or 0.0)})
        except Exception:
            bm25_list = []

        def norm_map(items: list[dict], key: str, id_key: str) -> dict[str, float]:
            if not items:
                return {}
            vals = [float(it.get(key) or 0.0) for it in items]
            vmin, vmax = min(vals), max(vals)
            denom = (vmax - vmin) or 1.0
            return {str(it.get(id_key)): (float(it.get(key) or 0.0) - vmin) / denom for it in items}

        vec_norm = norm_map(results, "similarity", "coordinate")
        bm_norm = norm_map(bm25_list, "bm25", "coordinate")

        # Weighted union
        try:
            a = float(alpha) if alpha is not None else 0.6
        except Exception:
            a = 0.6
        if a < 0.0:
            a = 0.0
        if a > 1.0:
            a = 1.0
        alpha_val = a
        union_coords = set(vec_norm.keys()) | set(bm_norm.keys())
        reranked = []
        for c in union_coords:
            score = alpha_val * vec_norm.get(c, 0.0) + (1 - alpha_val) * bm_norm.get(c, 0.0)
            reranked.append((c, score))
        reranked.sort(key=lambda t: t[1], reverse=True)

        # Build final items
        node_map = {d.get("coordinate"): d for d in results}
        out: list[dict] = []
        for coord, score in reranked[:k]:
            d = node_map.get(coord)
            if not d:
                d = {"coordinate": coord, "name": coord, "similarity": score}
            else:
                d = {**d, "similarity": score}
            out.append(d)
        return out

    def lexical_coordinate_search(self, search_string: str, limit: Optional[int] = None) -> list[dict]:
        """Perform lexical substring search across all BimbaNode properties.

        Direct property iteration for exact substring matching when semantic/fulltext search fails.
        Heavier query but more precise - finds substrings like 'Iti' in 'My-Self/Iti'.

        Args:
            search_string: String to search for in any property
            limit: Max results (default 20, capped at 50)

        Returns:
            List of dicts with coordinate, name, description
        """
        # Enforce limits
        limit_default = 20
        limit_cap = 50
        result_limit = limit_default if limit is None else int(limit)
        if result_limit < 1:
            result_limit = limit_default
        result_limit = min(result_limit, limit_cap)

        # Cypher query with safe property checking
        query = """
        MATCH (n:BimbaNode)
        WHERE any(key IN keys(n) WHERE
            (n[key] IS :: STRING AND n[key] CONTAINS $searchString) OR
            (n[key] IS :: LIST<ANY> AND any(item IN n[key] WHERE item IS :: STRING AND item CONTAINS $searchString))
        )
        RETURN n.bimbaCoordinate AS coordinate, n.name AS name, n.description AS description
        LIMIT $limit
        """

        try:
            records, _summary, _keys = self._repo.neo4j_client.execute_query(
                query,
                {"searchString": search_string, "limit": result_limit}
            )

            results = []
            for record in records:
                coord = record.get("coordinate")
                name = record.get("name")
                desc = record.get("description")

                if coord:  # Only include if coordinate exists
                    results.append({
                        "coordinate": coord,
                        "name": name or coord,  # Fallback to coordinate if name missing
                        "description": desc
                    })

            return results

        except Exception as e:
            logger.error(f"Lexical search failed for '{search_string}': {e}")
            return []

    def get_direct_children(self, bimba_coordinate: str) -> list[dict]:
        """Get direct child nodes of a given Bimba coordinate.

        Returns lean data (name, coordinate, primaryDesignation, description) for all child nodes
        whose bimbaCoordinate begins with the parent's coordinate.

        Args:
            bimba_coordinate: Parent coordinate to find children for

        Returns:
            List of dicts with child node data
        """
        # Cypher query - find children via hierarchical coordinate matching
        query = """
        MATCH (parent:BimbaNode {bimbaCoordinate: $bimbaCoordinate})-[]->(child:BimbaNode)
        WHERE child.bimbaCoordinate STARTS WITH parent.bimbaCoordinate
        RETURN child {
            .name,
            .bimbaCoordinate,
            .primaryDesignation,
            .description
        } AS child
        """

        try:
            records, _summary, _keys = self._repo.neo4j_client.execute_query(
                query,
                {"bimbaCoordinate": bimba_coordinate}
            )

            children = []
            for record in records:
                child_data = record.get("child")
                if child_data:
                    # Map bimbaCoordinate to coordinate for consistency
                    children.append({
                        "coordinate": child_data.get("bimbaCoordinate"),
                        "name": child_data.get("name"),
                        "primaryDesignation": child_data.get("primaryDesignation"),
                        "description": child_data.get("description")
                    })

            return children

        except Exception as e:
            logger.error(f"Failed to get direct children for '{bimba_coordinate}': {e}")
            return []

    def get_all_coordinates(self) -> list[dict]:
        """Fetch all Bimba coordinates from Neo4j with Redis caching.

        Cache is only invalidated when total node count changes.
        This ensures fresh data when nodes are added/deleted while avoiding
        unnecessary queries for read-heavy operations.

        Returns:
            List of dicts with coordinate, name, subsystem
        """
        cache_key = "bimba:all_coordinates"
        count_key = "bimba:node_count"

        try:
            # Get current node count from Neo4j
            count_query = "MATCH (n:BimbaNode) RETURN count(n) AS total"
            count_records, _, _ = self._repo.neo4j_client.execute_query(count_query)
            current_count = count_records[0].get("total", 0) if count_records else 0

            # Check cached count
            cached_count = self._redis.get(count_key)
            cached_data = self._redis.get(cache_key)

            # Use cache if count matches
            if cached_count and cached_data and int(cached_count) == current_count:
                logger.debug(f"Cache hit for all coordinates (count: {current_count})")
                return json.loads(cached_data)

            logger.info(f"Cache miss or node count changed. Refreshing coordinates (count: {current_count})")

            # Query ONLY coordinate and name
            query = """
            MATCH (n:BimbaNode)
            RETURN n.bimbaCoordinate AS coordinate,
                   n.name AS name
            ORDER BY n.bimbaCoordinate
            """

            records, _, _ = self._repo.neo4j_client.execute_query(query)

            result = []
            for record in records:
                coord = record.get("coordinate")
                name = record.get("name")

                # Only require coordinate - name can be null/empty
                if coord:
                    result.append({
                        "coordinate": coord,
                        "name": name or coord  # Fallback to coordinate if no name
                    })

            # Cache results
            self._redis.setex(cache_key, 3600, json.dumps(result))
            self._redis.setex(count_key, 3600, str(current_count))

            logger.info(f"Cached {len(result)} coordinates")
            return result

        except Exception as e:
            logger.error(f"Failed to fetch all coordinates: {e}")
            raise  # Fail properly, don't hide errors

    def _fetch_node_props_and_labels(self, coordinate: str) -> tuple[dict, list[str]]:
        query = """
        MATCH (n:BimbaNode { bimbaCoordinate: $c })
        RETURN properties(n) AS props, labels(n) AS labels
        """
        records, _s, _k = self._repo.neo4j_client.execute_query(query, {"c": coordinate})
        if not records:
            return {}, []
        rec = records[0]
        props = dict(rec.get("props") or {})
        labels = list(rec.get("labels") or [])
        return props, labels

    def _serialize_relationships(self, coordinate: str) -> list[str]:
        """Serialize outgoing relationships for embedding context.

        Returns list of formatted relationship strings like:
        "CONTAINS -> #1-2 (hierarchyLevel=1, parentChild=true)"
        """
        lines = []

        # Get max relationships from env (default 10 to prevent token overflow)
        max_rels = int(os.getenv("MAX_RELATIONSHIPS_PER_NODE", "10"))

        try:
            # Fetch relationships using existing method
            rel_data = self.get_node_relationships(coordinate)
            if not rel_data:
                return lines

            edges = rel_data.get('edges', [])

            # Limit to prevent token overflow
            for edge in edges[:max_rels]:
                rel_type = edge.get('type')
                neighbor = edge.get('neighbor', {})
                neighbor_coord = neighbor.get('coordinate')
                direction = edge.get('direction')

                if not rel_type or not neighbor_coord:
                    continue

                # Use arrow notation for clarity
                arrow = "->" if direction == "OUTGOING" else "<-"
                rel_line = f"{rel_type} {arrow} {neighbor_coord}"

                # Include neighbor name for semantic richness
                neighbor_name = neighbor.get('name')
                if neighbor_name:
                    rel_line += f" [{neighbor_name}]"

                # Include properties
                props = edge.get('properties', [])
                if props:
                    prop_strs = [f"{p.get('key')}={p.get('value')}" for p in props if p.get('key') and p.get('value') is not None]
                    if prop_strs:
                        rel_line += f" ({', '.join(prop_strs)})"

                lines.append(rel_line)
        except Exception as e:
            # If relationship fetching fails, continue without relationships
            # (graceful degradation - embeddings still work without relationships)
            logger.warning(f"Failed to serialize relationships for {coordinate}: {e}")

        return lines

    def _serialize_properties_for_embedding(self, props: dict, labels: list[str]) -> tuple[str, str]:
        # Include nested structures; exclude only known metadata/embedding keys.
        exclude = {
            "embeddings",
            "embedding_updated_at",
            "embedding_model",
            "embedding_dim",
            "embedding_hash",
            "created_at",
            "updated_at",
        }
        def flatten(value, prefix: str, out: list[str]):
            if value is None:
                return
            if isinstance(value, (str, int, float, bool)):
                out.append(f"{prefix}: {value}")
                return
            if isinstance(value, dict):
                for k in sorted(value.keys()):
                    if k in exclude:
                        continue
                    flatten(value[k], f"{prefix}.{k}" if prefix else k, out)
                return
            if isinstance(value, list):
                for i, item in enumerate(value):
                    flatten(item, f"{prefix}[{i}]", out)
                return
            out.append(f"{prefix}: {str(value)}")

        lines: list[str] = []
        if labels:
            lines.append("labels: " + ",".join(sorted(labels)))

        # Priority fields: Core semantic properties
        # Static priority fields (established architectural properties)
        static_priority = ["name", "symbol", "coreNature", "operationalEssence", "function", "architecturalFunction"]

        # Quintessential properties (q_, q0_, q1_, q12_ etc. prefixed) - dynamically discovered and prioritized
        # These encapsulate distilled, essential understanding of a coordinate
        # Pattern matches: q_, q0_, q1_, q12_, q123_, etc.
        quintessential_keys = sorted([
            k for k in props.keys()
            if re.match(r'^q(?:\d+)?_', k)  # Matches q_ or q<digits>_
        ])

        # Combine: quintessential properties ranked HIGHEST (after name/symbol, before other core properties)
        # This ensures semantic search strongly weights well-distilled understanding
        priority_fields = ["name", "symbol"] + quintessential_keys + ["coreNature", "operationalEssence", "function", "architecturalFunction"]

        # Serialize priority fields first (order matters for embedding weight)
        for pf in priority_fields:
            if pf in props and pf not in exclude:
                flatten(props.get(pf), pf, lines)

        # Then serialize remaining properties alphabetically
        for key in sorted(props.keys()):
            if key in exclude or key in priority_fields:
                continue
            flatten(props.get(key), key, lines)

        # NEW: Include relationships if enabled
        include_relationships = os.getenv("INCLUDE_RELATIONSHIPS_IN_EMBEDDINGS", "true").lower() == "true"
        if include_relationships:
            coord = props.get('bimbaCoordinate')
            if coord:
                rel_lines = self._serialize_relationships(coord)
                if rel_lines:
                    lines.append("")  # Blank line separator
                    lines.append("Relationships:")
                    lines.extend(rel_lines)

        text = "\n".join(lines)
        h = hashlib.sha256(text.encode("utf-8")).hexdigest()
        return text, h

    def regenerate_node_embedding(self, coordinate: str) -> dict:
        props, labels = self._fetch_node_props_and_labels(coordinate)
        if not props:
            return {"success": False, "coordinate": coordinate, "error": "Coordinate not found"}

        text, content_hash = self._serialize_properties_for_embedding(props, labels)
        vec = get_text_embedding(text, purpose="document")
        model = os.getenv("EMBEDDINGS_MODEL", "local-deterministic")
        dim = len(vec)

        query = """
        MATCH (n:BimbaNode { bimbaCoordinate: $c })
        SET n.embeddings = $v,
            n.embedding_updated_at = datetime(),
            n.embedding_model = $m,
            n.embedding_dim = $d,
            n.embedding_hash = $h
        RETURN toString(n.embedding_updated_at) AS updatedAt
        """
        recs, _s, _k = self._repo.neo4j_client.execute_query(
            query, {"c": coordinate, "v": vec, "m": model, "d": dim, "h": content_hash}
        )
        updated_at = None
        if recs:
            updated_at = recs[0].get("updatedAt")
        return {
            "success": True,
            "coordinate": coordinate,
            "dimension": dim,
            "updatedAt": updated_at,
            "model": model,
            "hash": content_hash,
        }

    def regenerate_all_embeddings(self, batch_size: int = 500, force: bool = False) -> dict:
        # Iterate batches using SKIP/LIMIT
        total = 0
        updated = 0
        skipped = 0
        skip = 0
        while True:
            q = """
            MATCH (n:BimbaNode)
            RETURN n.bimbaCoordinate AS coord, properties(n) AS props, labels(n) AS labels
            ORDER BY n.bimbaCoordinate
            SKIP $skip LIMIT $limit
            """
            recs, _s, _k = self._repo.neo4j_client.execute_query(q, {"skip": skip, "limit": batch_size})
            if not recs:
                break
            for r in recs:
                total += 1
                coord = r.get("coord")
                props = dict(r.get("props") or {})
                labels = list(r.get("labels") or [])
                text, content_hash = self._serialize_properties_for_embedding(props, labels)
                prev_hash = props.get("embedding_hash")
                if not force and prev_hash and prev_hash == content_hash:
                    skipped += 1
                    continue
                vec = get_text_embedding(text, purpose="document")
                model = os.getenv("EMBEDDINGS_MODEL", "local-deterministic")
                dim = len(vec)
                uq = """
                MATCH (n:BimbaNode { bimbaCoordinate: $c })
                SET n.embeddings = $v,
                    n.embedding_updated_at = datetime(),
                    n.embedding_model = $m,
                    n.embedding_dim = $d,
                    n.embedding_hash = $h
                RETURN 1
                """
                self._repo.neo4j_client.execute_query(uq, {"c": coord, "v": vec, "m": model, "d": dim, "h": content_hash})
                updated += 1
            skip += batch_size
        return {"success": True, "total": total, "updated": updated, "skipped": skipped}

    def invalidate_node_embedding(self, coordinate: str) -> None:
        """Invalidate node embedding by clearing the hash.

        This forces regeneration on next semantic search or explicit regenerate call.
        Used when relationships change to trigger re-embedding with new context.
        """
        try:
            query = """
            MATCH (n:BimbaNode { bimbaCoordinate: $c })
            SET n.embedding_hash = null
            RETURN 1
            """
            self._repo.neo4j_client.execute_query(query, {"c": coordinate})
            logger.debug(f"Invalidated embedding for {coordinate}")
        except Exception as e:
            logger.warning(f"Failed to invalidate embedding for {coordinate}: {e}")


def _cluster_id_from_coordinate(coordinate: str) -> str:
    """Derive a simple cluster id from the leading subsystem of a coordinate."""
    try:
        # Coordinate starts with '#', then digits; separators '-' or '.'
        core = coordinate.lstrip('#')
        first = core.replace('.', '-').split('-', 1)[0]
        return f"subsys-{first}"
    except Exception:
        return "subsys-unknown"


def _cluster_theme_from_coordinate(coordinate: str) -> str:
    """Provide a human-friendly cluster theme based on subsystem mapping."""
    mapping = {
        "0": "Anuttara",
        "1": "Paramasiva",
        "2": "Parashakti",
        "3": "Mahamaya",
        "4": "Nara",
        "5": "Epii",
    }
    core = coordinate.lstrip('#')
    first = core.replace('.', '-').split('-', 1)[0]
    return mapping.get(first, None) or "Bimba"

# FastAPI dependency provider
def get_node_service() -> NodeService:
    # Initialize Neo4j client with environment configuration
    neo4j_client = Neo4jClient()
    repo = NodeRepository(neo4j_client=neo4j_client)
    return NodeService(repo=repo)
