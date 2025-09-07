"""
Gemini Embedding Function for LightRAG Integration
"""

import os
import json
from typing import List, Union
import google.generativeai as genai


def gemini_embed_batch(texts: List[str], model_name: str = "models/text-embedding-004") -> List[List[float]]:
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
        for text in texts:
            try:
                result = genai.embed_content(
                    model=model_name,
                    content=text,
                    task_type="semantic_similarity"
                )
                embeddings.append(result['embedding'])
            except Exception as e:
                print(f"Embedding error for text: {e}")
                # Return zero vector as fallback
                embeddings.append([0.0] * 768)  # Default embedding dimension
        
        return embeddings
        
    except Exception as e:
        print(f"Gemini embedding batch error: {e}")
        # Return zero vectors as fallback
        return [[0.0] * 768 for _ in texts]


def gemini_embed_single(text: str, model_name: str = "models/text-embedding-004") -> List[float]:
    """
    Generate embedding for single text using Gemini
    """
    result = gemini_embed_batch([text], model_name)
    return result[0] if result else [0.0] * 768


# Wrapper function compatible with LightRAG (async version)
async def gemini_embedding_func(texts: Union[str, List[str]]) -> Union[List[float], List[List[float]]]:
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

# Add embedding dimension attribute required by LightRAG
gemini_embedding_func.embedding_dim = 768  # Gemini text-embedding-004 dimension