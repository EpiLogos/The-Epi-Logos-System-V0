"""
Gemini Native Integration for LightRAG
"""

import google.generativeai as genai
import os
from typing import List, Dict, Any
import asyncio


class GeminiLLMService:
    """Native Gemini integration for LightRAG"""
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable required")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            os.getenv("LIGHTRAG_LLM_MODEL", "gemini-2.5-flash")
        )
    
    async def complete(self, messages, **kwargs):
        """LightRAG-compatible completion function"""
        try:
            # Convert LightRAG message format to Gemini format
            if isinstance(messages, list) and len(messages) > 0:
                content = messages[-1].get("content", "")
            else:
                content = str(messages)
                
            response = await self.model.generate_content_async(
                content,
                generation_config=genai.types.GenerationConfig(
                    temperature=kwargs.get("temperature", 0.3),
                    max_output_tokens=kwargs.get("max_tokens", 8000)
                )
            )
            return response.text
        except Exception as e:
            print(f"Gemini API error: {e}")
            return ""


# Global service instance
gemini_service = None


def get_gemini_service():
    """Get or create Gemini service instance"""
    global gemini_service
    if gemini_service is None:
        gemini_service = GeminiLLMService()
    return gemini_service


async def gemini_llm_complete(messages, **kwargs):
    """Global function for LightRAG integration"""
    service = get_gemini_service()
    return await service.complete(messages, **kwargs)


def gemini_llm_complete_sync(messages, **kwargs):
    """Synchronous wrapper for LightRAG integration"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(gemini_llm_complete(messages, **kwargs))