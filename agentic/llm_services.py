"""
LLM Services for the Epi-Logos System Agentic Layer.

This module provides unified access to multiple LLM providers:
- OpenAI GPT (including Realtime API)
- Google Gemini
- Anthropic Claude
- Google Cloud Translate (for language detection)
"""

import os
import asyncio
from typing import Dict, Any, Optional, List
import logging

# LLM Provider Imports
try:
    import openai
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

try:
    # Deepseek uses OpenAI-compatible API
    from openai import OpenAI as DeepseekClient
    DEEPSEEK_AVAILABLE = True
except ImportError:
    DEEPSEEK_AVAILABLE = False

try:
    import langextract as lx
    LANGEXTRACT_AVAILABLE = True
except ImportError:
    LANGEXTRACT_AVAILABLE = False

logger = logging.getLogger(__name__)


class LLMServiceManager:
    """Unified manager for all LLM services."""
    
    def __init__(self):
        """Initialize all available LLM services."""
        self.openai_client = None
        self.gemini_model = None
        self.anthropic_client = None
        self.deepseek_client = None
        self.langextract_available = LANGEXTRACT_AVAILABLE

        self._initialize_services()
    
    def _initialize_services(self):
        """Initialize all available LLM services based on environment variables."""
        
        # Initialize OpenAI
        if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
            try:
                self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                logger.info("OpenAI client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI: {e}")
        
        # Initialize Gemini
        if GEMINI_AVAILABLE and os.getenv("GEMINI_API_KEY"):
            try:
                genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
                model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
                self.gemini_model = genai.GenerativeModel(model_name)
                logger.info(f"Gemini model initialized: {model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini: {e}")
        
        # Initialize Anthropic
        if ANTHROPIC_AVAILABLE and os.getenv("ANTHROPIC_API_KEY"):
            try:
                self.anthropic_client = anthropic.Anthropic(
                    api_key=os.getenv("ANTHROPIC_API_KEY")
                )
                logger.info("Anthropic client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Anthropic: {e}")

        # Initialize Deepseek
        if DEEPSEEK_AVAILABLE and os.getenv("DEEPSEEK_API_KEY"):
            try:
                self.deepseek_client = DeepseekClient(
                    api_key=os.getenv("DEEPSEEK_API_KEY"),
                    base_url="https://api.deepseek.com"
                )
                logger.info("Deepseek client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Deepseek: {e}")

        # Initialize LangExtract
        if LANGEXTRACT_AVAILABLE and os.getenv("GEMINI_API_KEY"):
            try:
                # LangExtract uses the same Gemini API key
                logger.info("LangExtract available with Gemini API key")
            except Exception as e:
                logger.warning(f"Failed to initialize LangExtract: {e}")
    
    async def extract_structured_data(
        self,
        text: str,
        prompt_description: str,
        examples: List[Dict[str, Any]],
        model_id: str = "gemini-2.5-flash"
    ) -> Optional[Dict[str, Any]]:
        """Extract structured data using LangExtract."""
        if not self.langextract_available:
            logger.warning("LangExtract not available")
            return None

        try:
            # Convert examples to LangExtract format
            lx_examples = []
            for example in examples:
                lx_examples.append(lx.data.ExampleData(
                    text=example.get("text", ""),
                    extractions=[
                        lx.data.Extraction(
                            extraction_class=ext.get("class", ""),
                            extraction_text=ext.get("text", ""),
                            attributes=ext.get("attributes", {})
                        ) for ext in example.get("extractions", [])
                    ]
                ))

            # Run extraction
            result = lx.extract(
                text_or_documents=text,
                prompt_description=prompt_description,
                examples=lx_examples,
                model_id=model_id,
                api_key=os.getenv("GEMINI_API_KEY")
            )

            return {
                "extractions": [
                    {
                        "class": ext.extraction_class,
                        "text": ext.extraction_text,
                        "attributes": ext.attributes,
                        "start_char": getattr(ext, 'start_char', None),
                        "end_char": getattr(ext, 'end_char', None)
                    } for ext in result.extractions
                ],
                "metadata": {
                    "model_used": model_id,
                    "text_length": len(text),
                    "extraction_count": len(result.extractions)
                }
            }
        except Exception as e:
            logger.error(f"LangExtract structured extraction failed: {e}")
            return None
    
    async def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        provider: str = "openai",
        model: Optional[str] = None,
        **kwargs
    ) -> Optional[str]:
        """Get chat completion from specified provider."""
        
        if provider == "openai" and self.openai_client:
            return await self._openai_chat(messages, model, **kwargs)
        elif provider == "gemini" and self.gemini_model:
            return await self._gemini_chat(messages, **kwargs)
        elif provider == "anthropic" and self.anthropic_client:
            return await self._anthropic_chat(messages, model, **kwargs)
        elif provider == "deepseek" and self.deepseek_client:
            return await self._deepseek_chat(messages, model, **kwargs)
        else:
            logger.error(f"Provider {provider} not available or not initialized")
            return None
    
    async def _openai_chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        **kwargs
    ) -> Optional[str]:
        """OpenAI chat completion."""
        try:
            model = model or os.getenv("OPENAI_MODEL", "gpt-4")

            # Use asyncio to run the synchronous OpenAI client
            import asyncio
            loop = asyncio.get_event_loop()

            response = await loop.run_in_executor(
                None,
                lambda: self.openai_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    **kwargs
                )
            )

            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI chat completion failed: {e}")
            return None
    
    async def _gemini_chat(self, messages: List[Dict[str, str]], **kwargs) -> Optional[str]:
        """Gemini chat completion."""
        try:
            # Convert messages to Gemini format
            prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])

            # Use asyncio to run the synchronous Gemini client
            import asyncio
            loop = asyncio.get_event_loop()

            response = await loop.run_in_executor(
                None,
                lambda: self.gemini_model.generate_content(prompt)
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini chat completion failed: {e}")
            return None
    
    async def _anthropic_chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        **kwargs
    ) -> Optional[str]:
        """Anthropic chat completion."""
        try:
            model = model or os.getenv("ANTHROPIC_MODEL", "claude-3-sonnet-20240229")

            # Use asyncio to run the synchronous Anthropic client
            import asyncio
            loop = asyncio.get_event_loop()

            response = await loop.run_in_executor(
                None,
                lambda: self.anthropic_client.messages.create(
                    model=model,
                    messages=messages,
                    max_tokens=kwargs.get("max_tokens", 1000),
                    **{k: v for k, v in kwargs.items() if k != "max_tokens"}
                )
            )

            return response.content[0].text
        except Exception as e:
            logger.error(f"Anthropic chat completion failed: {e}")
            return None

    async def _deepseek_chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        **kwargs
    ) -> Optional[str]:
        """Deepseek chat completion."""
        try:
            model = model or os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

            # Use asyncio to run the synchronous Deepseek client
            import asyncio
            loop = asyncio.get_event_loop()

            response = await loop.run_in_executor(
                None,
                lambda: self.deepseek_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    **kwargs
                )
            )

            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Deepseek chat completion failed: {e}")
            return None

    async def realtime_audio_session(self, audio_data: bytes) -> Optional[bytes]:
        """Handle OpenAI Realtime API for audio processing."""
        if not self.openai_client:
            logger.error("OpenAI client not available for realtime audio")
            return None
        
        try:
            # Note: This is a placeholder for the Realtime API
            # The actual implementation will depend on the final OpenAI SDK
            logger.info("Realtime audio processing requested")
            # TODO: Implement actual realtime audio processing
            return None
        except Exception as e:
            logger.error(f"Realtime audio processing failed: {e}")
            return None
    
    def get_available_providers(self) -> List[str]:
        """Get list of available LLM providers."""
        providers = []
        
        if self.openai_client:
            providers.append("openai")
        if self.gemini_model:
            providers.append("gemini")
        if self.anthropic_client:
            providers.append("anthropic")
        if self.deepseek_client:
            providers.append("deepseek")

        return providers
    
    def get_service_status(self) -> Dict[str, bool]:
        """Get status of all LLM services."""
        return {
            "openai": self.openai_client is not None,
            "gemini": self.gemini_model is not None,
            "anthropic": self.anthropic_client is not None,
            "deepseek": self.deepseek_client is not None,
            "langextract": self.langextract_available and os.getenv("GEMINI_API_KEY") is not None,
        }


# Global instance
llm_manager = LLMServiceManager()


# Convenience functions
async def extract_structured_data(
    text: str,
    prompt_description: str,
    examples: List[Dict[str, Any]],
    model_id: str = "gemini-2.5-flash"
) -> Optional[Dict[str, Any]]:
    """Extract structured data using LangExtract."""
    return await llm_manager.extract_structured_data(text, prompt_description, examples, model_id)


async def chat_with_llm(
    messages: List[Dict[str, str]], 
    provider: str = "openai",
    **kwargs
) -> Optional[str]:
    """Chat with specified LLM provider."""
    return await llm_manager.chat_completion(messages, provider, **kwargs)


async def wisdom_synthesis(
    query: str, 
    context: Optional[str] = None,
    provider: str = "gemini"
) -> Optional[str]:
    """Synthesize wisdom using the specified LLM provider."""
    messages = [
        {
            "role": "system",
            "content": "You are a wisdom synthesis agent for the Epi-Logos System. "
                      "Provide thoughtful, nuanced responses that integrate multiple perspectives."
        }
    ]
    
    if context:
        messages.append({
            "role": "user", 
            "content": f"Context: {context}\n\nQuery: {query}"
        })
    else:
        messages.append({"role": "user", "content": query})
    
    return await chat_with_llm(messages, provider)


if __name__ == "__main__":
    # Test the LLM services
    async def test_services():
        print("🧠 Testing LLM Services...")
        
        # Check service status
        status = llm_manager.get_service_status()
        print(f"Service Status: {status}")
        
        # Test LangExtract
        if status["langextract"]:
            examples = [{
                "text": "John Smith is 30 years old and works as a doctor.",
                "extractions": [
                    {"class": "person", "text": "John Smith", "attributes": {"age": "30", "profession": "doctor"}}
                ]
            }]
            result = await extract_structured_data(
                "Mary Johnson is 25 years old and works as a teacher.",
                "Extract person information with age and profession",
                examples
            )
            print(f"LangExtract result: {result}")
        
        # Test chat completion
        available_providers = llm_manager.get_available_providers()
        if available_providers:
            provider = available_providers[0]
            response = await chat_with_llm(
                [{"role": "user", "content": "Hello, world!"}],
                provider=provider
            )
            print(f"Chat response from {provider}: {response}")
    
    asyncio.run(test_services())
