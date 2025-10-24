"""
Groq Integration for LightRAG (Kimi K2 via Groq)
Replacement for Gemini due to 2.5 Flash safety filter bug
"""

from groq import AsyncGroq
import os
from typing import List, Dict, Any


class GroqLLMService:
    """Groq integration for LightRAG using Kimi K2 model"""

    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable required")
        self.client = AsyncGroq(api_key=api_key)
        self.model = os.getenv("GROQ_MODEL", "moonshotai/kimi-k2-instruct")

    async def complete(self, messages, **kwargs):
        """LightRAG-compatible completion function"""
        try:
            # Convert LightRAG message format to Groq format
            if isinstance(messages, list) and len(messages) > 0:
                # Already in OpenAI-compatible format
                groq_messages = messages
            else:
                # Simple string prompt
                groq_messages = [{"role": "user", "content": str(messages)}]

            # Call Groq API
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=groq_messages,
                temperature=kwargs.get("temperature", 0.3),
                max_tokens=kwargs.get("max_tokens", 8000)
            )

            # Extract response text
            if not response.choices:
                raise ValueError("Groq returned no choices")

            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq API error: {e}")
            raise


# Global service instance
groq_service = None


def get_groq_service():
    """Get or create Groq service instance"""
    global groq_service
    if groq_service is None:
        groq_service = GroqLLMService()
    return groq_service


async def groq_llm_complete(messages, **kwargs):
    """Global function for LightRAG integration"""
    service = get_groq_service()
    return await service.complete(messages, **kwargs)
