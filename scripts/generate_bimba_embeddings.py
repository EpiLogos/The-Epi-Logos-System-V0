#!/usr/bin/env python3
"""
Generate embeddings for all BimbaNode nodes in Neo4j and store them
as a single 'embeddings' property (dimension defaults to 768).

Usage:
  python scripts/generate_bimba_embeddings.py --batch-size 500

Environment:
  - EMBEDDINGS_DIM (default: 1536)
  - NEO4J_* for database connectivity
"""

import os
import sys
import math
import argparse
from typing import List, Dict, Any

from shared.database import Neo4jClient


def get_text_embedding(text: str) -> List[float]:
    from backend.epi_logos_system.shared.embeddings import get_text_embedding as f
    return f(text)


def fetch_bimba_nodes(client: Neo4jClient, skip: int, limit: int) -> List[Dict[str, Any]]:
    query = """
    MATCH (n:BimbaNode)
    RETURN n.bimbaCoordinate AS coord, properties(n) AS props, labels(n) AS labels
    SKIP $skip LIMIT $limit
    """
    records, _s, _k = client.execute_query(query, {"skip": skip, "limit": limit})
    out: List[Dict[str, Any]] = []
    for r in records:
        out.append({
            "coord": r.get("coord"),
            "props": r.get("props") or {},
            "labels": r.get("labels") or [],
        })
    return out


def upsert_embedding(client: Neo4jClient, coordinate: str, vector: List[float], model: str, dim: int, hash_str: str) -> None:
    query = """
    MATCH (n:BimbaNode { bimbaCoordinate: $c })
    SET n.embeddings = $v,
        n.embedding_updated_at = datetime(),
        n.embedding_model = $m,
        n.embedding_dim = $d,
        n.embedding_hash = $h
    RETURN size(n.embeddings) AS dim
    """
    client.execute_query(query, {"c": coordinate, "v": vector, "m": model, "d": dim, "h": hash_str})


def serialize_props(props: Dict[str, Any], labels: List[str]) -> tuple[str, str]:
    import hashlib as _hashlib
    exclude = {"embeddings", "embedding_updated_at", "embedding_model", "embedding_dim", "embedding_hash", "created_at", "updated_at"}
    lines: List[str] = []
    if labels:
        lines.append("labels: " + ",".join(sorted(labels)))
    for k in sorted(props.keys()):
        if k in exclude:
            continue
        v = props.get(k)
        if v is None:
            continue
        if isinstance(v, (str, int, float, bool)):
            lines.append(f"{k}: {v}")
        elif isinstance(v, list) and all(isinstance(x, (str, int, float, bool)) for x in v):
            lines.append(f"{k}: {','.join(map(str, v))}")
    text = "\n".join(lines)
    return text, _hashlib.sha256(text.encode("utf-8")).hexdigest()


def generate_all_embeddings(batch_size: int = 500) -> None:
    with Neo4jClient() as client:
        if not client.test_connection():
            print("Neo4j connection failed. Check NEO4J_* env vars.")
            sys.exit(1)

        skip = 0
        total = 0
        while True:
            rows = fetch_bimba_nodes(client, skip=skip, limit=batch_size)
            if not rows:
                break

            for row in rows:
                coord = row.get("coord")
                if not coord:
                    continue
                text, h = serialize_props(row.get("props") or {}, row.get("labels") or [])
                vec = get_text_embedding(text)
                model = os.getenv("EMBEDDINGS_MODEL", "local-deterministic")
                upsert_embedding(client, coord, vec, model, len(vec), h)
                total += 1
            print(f"Processed {total} nodes...")
            skip += batch_size
        print(f"Done. Embeddings generated for {total} nodes.")


def main():
    parser = argparse.ArgumentParser(description="Generate embeddings for all Bimba nodes")
    parser.add_argument("--batch-size", type=int, default=500, help="Batch size for scanning nodes")
    args = parser.parse_args()
    generate_all_embeddings(batch_size=args.batch_size)


if __name__ == "__main__":
    main()
