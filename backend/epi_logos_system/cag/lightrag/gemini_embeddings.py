"""
Gemini Embedding Function for LightRAG Integration
"""

import os
import json
from typing import List, Union, Optional
import google.generativeai as genai


def gemini_embed_batch(texts: List[str], model_name: str = "gemini-embedding-001", task_type: Optional[str] = None) -> List[List[float]]:
    """
    Generate embeddings for batch of texts using Gemini
    """
    try:
        # Configure Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        genai.configure(api_key=api_key)

        # Generate embeddings
        embeddings = []
        # Resolve target dimension from env (default 1536)
        try:
            target_dim = int(os.getenv("EMBEDDINGS_DIM", "1536"))
        except Exception:
            target_dim = 1536

        for text in texts:
            try:
                # SDK requires models/ prefix even though docs don't show it
                model_with_prefix = model_name if model_name.startswith("models/") else f"models/{model_name}"

                result = genai.embed_content(
                    model=model_with_prefix,
                    content=text,
                    task_type=(task_type or "semantic_similarity"),
                    output_dimensionality=target_dim  # Specify dimension explicitly
                )
                vec = result['embedding']
                # Resize to target_dim (truncate/pad) to match index and downstream configs
                if len(vec) != target_dim:
                    if len(vec) > target_dim:
                        vec = vec[:target_dim]
                    else:
                        vec = vec + [0.0] * (target_dim - len(vec))
                # Normalize to unit length for non-3072 dims per Gemini guidance
                try:
                    import math
                    norm = math.sqrt(sum(v*v for v in vec)) or 1.0
                    vec = [v / norm for v in vec]
                except Exception:
                    pass
                embeddings.append(vec)
            except Exception as e:
                print(f"Embedding error for text: {e}")
                # Return zero vector as fallback
                embeddings.append([0.0] * target_dim)
        
        return embeddings
        
    except Exception as e:
        print(f"Gemini embedding batch error: {e}")
        # Return zero vectors as fallback
        return [[0.0] * 768 for _ in texts]


def gemini_embed_single(text: str, model_name: str = "gemini-embedding-001", task_type: Optional[str] = None) -> List[float]:
    """
    Generate embedding for single text using Gemini
    """
    result = gemini_embed_batch([text], model_name, task_type)
    return result[0] if result else [0.0] * 768


# Wrapper function compatible with LightRAG (async version)
async def gemini_embedding_func_raw(texts: Union[str, List[str]]) -> Union[List[float], List[List[float]]]:
    """
    LightRAG-compatible async embedding function using Gemini
    """
    import asyncio
    
    # Run the synchronous embedding function in a thread pool
    loop = asyncio.get_event_loop()
    
    if isinstance(texts, str):
        result = await loop.run_in_executor(None, gemini_embed_single, texts)
        return result
    elif isinstance(texts, list):
        result = await loop.run_in_executor(None, gemini_embed_batch, texts)
        return result
    else:
        raise ValueError(f"Unsupported input type: {type(texts)}")

# Create proper EmbeddingFunc object for LightRAG
from lightrag.base import EmbeddingFunc

from os import getenv
try:
    _dim = int(getenv("EMBEDDINGS_DIM", "1536"))
except Exception:
    _dim = 1536

gemini_embedding_func = EmbeddingFunc(
    embedding_dim=_dim,
    func=gemini_embedding_func_raw
)
