#!/usr/bin/env python3
"""
Force-regenerate embeddings for every Bimba node by calling the single-node
GraphQL mutation `regenerateNodeEmbedding` for each coordinate.

Why this script?
- The bulk mutation skips updates when `embedding_hash` is unchanged and uses
  SKIP/LIMIT pagination (nondeterministic without ordering). This script
  guarantees a rewrite for every node regardless of previous state.

Requirements
- .env with Backend + Neo4j configuration (same as the app).
- One of:
  - MCP_ADMIN_SECRET set (preferred for local dev), or
  - MCP_BACKEND_BEARER (a valid admin JWT), or
  - BACKEND_ADMIN_TOKEN (alias for the bearer token).

Usage
  python scripts/regen_bimba_embeddings_all_nodes.py --concurrency 24

The script prints a small progress line and a final summary.
"""

from __future__ import annotations

import asyncio
import os
import sys
import time
from typing import List

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

import httpx
from pathlib import Path

# Ensure repository root is on sys.path so `shared.*` imports work when running the script directly
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Import Neo4j client from the shared package used by the app
from shared.database.neo4j_client import Neo4jClient  # type: ignore


BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


def _build_headers() -> dict:
    headers = {"User-Agent": "Bimba-EmbeddingsRegen/1.0"}
    token = os.getenv("MCP_BACKEND_BEARER") or os.getenv("BACKEND_ADMIN_TOKEN")
    secret = os.getenv("MCP_ADMIN_SECRET")
    if token:
        if not token.lower().startswith("bearer "):
            headers["Authorization"] = f"Bearer {token}"
        else:
            headers["Authorization"] = token
    if secret:
        headers["X-MCP-Admin-Secret"] = secret
    return headers


def _load_all_coordinates() -> List[str]:
    """Fetch all Bimba coordinates directly from Neo4j."""
    with Neo4jClient() as client:
        # Will raise if not configured; match app config
        q = """
        MATCH (n:BimbaNode)
        RETURN n.bimbaCoordinate AS coord
        """
        recs, _s, _k = client.execute_query(q)
        coords: List[str] = []
        for r in recs:
            c = r.get("coord")
            if c:
                coords.append(c)
        return coords


async def _regen_one(client: httpx.AsyncClient, coord: str) -> bool:
    mutation = """
    mutation Regen($coordinate: String!) {
      regenerateNodeEmbedding(coordinate: $coordinate) {
        success
        error
      }
    }
    """
    try:
        resp = await client.post(
            f"{BACKEND_URL}/graphql",
            json={"query": mutation, "variables": {"coordinate": coord}},
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict) and data.get("data") and data["data"].get("regenerateNodeEmbedding"):
            payload = data["data"]["regenerateNodeEmbedding"]
            return bool(payload.get("success"))
        return False
    except Exception:
        return False


async def main(concurrency: int = 24) -> int:
    coords = _load_all_coordinates()
    total = len(coords)
    if total == 0:
        print("No Bimba nodes found.")
        return 1
    print(f"Found {total} Bimba coordinates. Starting regeneration with concurrency={concurrency}…")

    headers = _build_headers()
    success = 0
    fail = 0
    started = time.time()

    limits = httpx.Limits(max_keepalive_connections=concurrency, max_connections=concurrency)
    async with httpx.AsyncClient(headers=headers, limits=limits, timeout=httpx.Timeout(40.0)) as client:
        sem = asyncio.Semaphore(concurrency)

        async def worker(c: str):
            nonlocal success, fail
            async with sem:
                ok = await _regen_one(client, c)
                if ok:
                    success += 1
                else:
                    fail += 1

        tasks = [asyncio.create_task(worker(c)) for c in coords]

        # Simple progress printer
        last = 0
        while True:
            done = success + fail
            if done != last:
                print(f"Progress: {done}/{total} (ok={success} fail={fail})", end="\r", flush=True)
                last = done
            if done >= total:
                break
            await asyncio.sleep(0.2)

        await asyncio.gather(*tasks)

    elapsed = time.time() - started
    print()  # newline after carriage returns
    print(f"Completed in {elapsed:.1f}s — ok={success} fail={fail} / total={total}")
    return 0 if success > 0 and fail == 0 else (0 if success >= total * 0.95 else 1)


if __name__ == "__main__":
    try:
        import argparse
        p = argparse.ArgumentParser()
        p.add_argument("--concurrency", type=int, default=24)
        args = p.parse_args()
        rc = asyncio.run(main(concurrency=args.concurrency))
        sys.exit(rc)
    except KeyboardInterrupt:
        print("\nInterrupted")
        sys.exit(130)
