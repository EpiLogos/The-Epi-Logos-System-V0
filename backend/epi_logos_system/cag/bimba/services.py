from pydantic import BaseModel
from typing import Optional

# Import from shared database package
from shared.database import Neo4jClient
import os
import math
from typing import List, Dict, Any

from backend.epi_logos_system.shared.embeddings import get_text_embedding
import hashlib
from datetime import datetime, timezone

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

# The service that uses the repository
class NodeService:
    def __init__(self, repo: NodeRepository):
        self._repo = repo

    def get_node(self, coordinate: str) -> BimbaNode | None:
        return self._repo.find_by_coordinate(coordinate=coordinate)

    def get_node_relationships(self, coordinate: str) -> dict | None:
        """Return a node bundled with its immediate relationship edges.

        Uses the shared Neo4j client to fetch both the node and all direct
        incoming/outgoing relationships, formatting the result to match the
        GraphQL schema NodeWithEdges shape.
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
                "createdAt": str(neighbor.get("created_at")) if neighbor.get("created_at") else None,
                "updatedAt": str(neighbor.get("updated_at")) if neighbor.get("updated_at") else None,
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

    def semantic_coordinate_discovery(self, query_text: str, max_results: Optional[int] = 5) -> list[dict]:
        """Perform semantic-to-coordinate discovery via Neo4j vector index.

        Guardrails:
        - Read-only: no implicit mutations
        - Identity anchored strictly by bimbaCoordinate
        - Timeout enforced via driver (15s default)
        - Result cap at 20
        """
        # Enforce defaults and caps
        k_default = 5
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
                name = n.get("name") or coord
                score = float(r.get("score") or 0.0)
                # Map to GraphQL type fields
                results.append(
                    {
                        "coordinate": coord,
                        "name": name,
                        "similarity": score,
                        "semanticContext": n.get("description") or n.get("coreNature") or n.get("operationalEssence"),
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
        alpha = 0.6  # vector weight
        union_coords = set(vec_norm.keys()) | set(bm_norm.keys())
        reranked = []
        for c in union_coords:
            score = alpha * vec_norm.get(c, 0.0) + (1 - alpha) * bm_norm.get(c, 0.0)
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
        priority_fields = ["name", "symbol", "coreNature", "operationalEssence", "function", "architecturalFunction"]
        for pf in priority_fields:
            if pf in props and pf not in exclude:
                flatten(props.get(pf), pf, lines)
        for key in sorted(props.keys()):
            if key in exclude or key in priority_fields:
                continue
            flatten(props.get(key), key, lines)
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
