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

            # WORKAROUND: Use sync API via asyncio.to_thread() instead of async API
            # Reason: generate_content_async() blocks content with finish_reason: 2 (SAFETY)
            #         while generate_content() (sync) works fine with identical content
            # This wraps the working sync call in an async context
            response = await asyncio.to_thread(
                self.model.generate_content,
                content,
                generation_config=genai.types.GenerationConfig(
                    temperature=kwargs.get("temperature", 0.3),
                    max_output_tokens=kwargs.get("max_tokens", 8000)
                )
                # Using default safety settings - no explicit safety_settings parameter
            )

            # Check for safety filter blocking or other issues
            if not response.candidates:
                raise ValueError("Gemini blocked content - no candidates returned (likely safety filter)")

            candidate = response.candidates[0]
            if candidate.finish_reason != 1:  # 1 = STOP (normal completion)
                finish_reasons = {
                    0: "UNSPECIFIED",
                    1: "STOP (normal completion)",
                    2: "SAFETY (content filtered by safety filters)",
                    3: "RECITATION (content blocked due to recitation)",
                    4: "OTHER (unknown reason)"
                }
                reason = finish_reasons.get(candidate.finish_reason, f"UNKNOWN ({candidate.finish_reason})")
                raise ValueError(f"Gemini finish_reason: {reason}")

            return response.text
        except Exception as e:
            print(f"Gemini API error: {e}")
            raise  # Re-raise instead of returning empty string


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