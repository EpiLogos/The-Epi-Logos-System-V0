"""
Embedding utilities for backend services.

Provides a provider-agnostic interface with real provider support (Gemini)
and a deterministic local fallback for tests.
"""

from __future__ import annotations

import os
import hashlib
from typing import List, Optional


def _local_deterministic_embedding(text: str, dim: int = 384) -> List[float]:
    """Generate a deterministic pseudo-embedding from text (no network).

    Not suitable for production retrieval quality, but stable for tests.
    """
    # Use SHA256 to seed a simple PRNG-like expansion
    seed = hashlib.sha256(text.encode("utf-8")).digest()
    vals: List[float] = []
    # Expand to required dimension deterministically
    i = 0
    while len(vals) < dim:
        h = hashlib.sha256(seed + i.to_bytes(4, "little")).digest()
        # Convert bytes to floats in [0,1)
        for b in h:
            vals.append(b / 255.0)
            if len(vals) == dim:
                break
        i += 1
    # Normalize to unit length (approximate cosine semantics)
    norm = sum(v * v for v in vals) ** 0.5 or 1.0
    return [v / norm for v in vals]


def get_text_embedding(text: str, purpose: Optional[str] = None) -> List[float]:
    """Get an embedding vector for the given text.

    Provider selection via environment:
    - EMBEDDINGS_PROVIDER: 'local' (default), 'gemini'
    - EMBEDDINGS_DIM: integer dimension (default 1536)
    
    Network providers are intentionally not invoked here to keep backend
    free of external dependencies during tests. Replace with adapters as needed.
    """
    dim = int(os.getenv("EMBEDDINGS_DIM", "1536"))
    provider = os.getenv("EMBEDDINGS_PROVIDER", "local").lower()

    # Provider: Gemini (Google Generative AI)
    if provider == "gemini":
        try:
            # Reuse existing Gemini embedding integration
            from backend.epi_logos_system.cag.lightrag.gemini_embeddings import gemini_embed_single
            model = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
            # Map purpose to provider-specific task type
            task_type = None
            if purpose:
                p = purpose.lower()
                if p in ("doc", "document", "corpus", "node"):
                    task_type = "retrieval_document"
                elif p in ("query", "search"):
                    task_type = "retrieval_query"
                else:
                    task_type = "semantic_similarity"
            vec = gemini_embed_single(text, model_name=model, task_type=task_type)
            # Ensure dimensionality matches configured dim when possible
            if isinstance(vec, list) and vec and isinstance(vec[0], (int, float)):
                if len(vec) != dim:
                    # Best-effort resize: truncate or pad with zeros to match index dim
                    if len(vec) > dim:
                        vec = vec[:dim]
                    else:
                        vec = vec + [0.0] * (dim - len(vec))
                return vec
        except Exception:
            # Fall back to local deterministic on any provider error
            pass

    # Default: local deterministic (no network)
    return _local_deterministic_embedding(text, dim=dim)
