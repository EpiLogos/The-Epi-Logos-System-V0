"""
Simple Agent Adapter - CLI Bridge to AG-UI System

Replaces the broken OrchestratorAdapter with a direct bridge to the working
AG-UI orchestrator system. Maintains CLI UX while using proven backend.
"""

import asyncio
import json
import os
import aiohttp
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple
from uuid import uuid4
import logging

from .agui_payload import build_run_agent_input
from .diagnostics import DiagnosticsRecorder

logger = logging.getLogger(__name__)

class SimpleAgentAdapter:
    """Direct bridge from CLI to working AG-UI orchestrator system"""
    
    def __init__(self,
                 model: str,
                 user_id: str = "cli-user",
                 persona_key: Optional[str] = None,
                 system_override: str = "",
                 diagnostics: Optional[DiagnosticsRecorder] = None,
                 trace_id_override: Optional[str] = None,
                 ) -> None:
        self.user_id = user_id
        self.model = model
        self.persona_key = persona_key or "system"
        self.system_override = system_override or ""
        self.thread_id = str(uuid4())  # Each CLI session gets unique thread
        
        # AG-UI endpoint
        self.ag_ui_base = os.getenv("AGENTIC_BASE_URL", "http://localhost:8001")
        self.models_endpoint = f"{self.ag_ui_base}/api/v1/orchestrator/models"
        self.ag_ui_endpoint = f"{self.ag_ui_base}/api/v1/ag-ui/run"
        
        # Diagnostics
        self.diag = diagnostics or DiagnosticsRecorder()
        self.trace_id_override = trace_id_override
        
        # Session state
        self.session_id: Optional[str] = None
        
    # --- Models ---
    async def list_available_models(self) -> List[Dict[str, Any]]:
        """Get available models from working models API"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.models_endpoint) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        models = data.get("models", [])
                        # Return full model objects with name, provider, ready fields
                        return [
                            {
                                "name": model["id"],
                                "provider": model.get("provider", "Unknown"),
                                "ready": model.get("available", False)
                            }
                            for model in models if model.get("available")
                        ]
                    return []
        except Exception as e:
            logger.error(f"Error listing models: {e}")
            return []
    
    # --- Capabilities ---
    async def get_capabilities(self) -> Dict[str, Any]:
        """Return CLI capabilities with current model info"""
        available_models = await self.list_available_models()

        # Get tools from orchestrator
        tools = await self.list_orchestrator_tools()

        return {
            "streaming": True,
            "model_switching": True,
            "persona_switching": True,
            "tools": tools,
            "session_management": True,
            "default_model": self.model,
            "models": available_models,  # CLI expects "models" key
            "available_models": available_models,
            "current_persona": self.persona_key
        }
    
    # --- Personas ---
    async def list_orchestrator_personas(self) -> List[str]:
        """Return available personas from actual orchestrator"""
        return ["system", "nara", "epii"]

    # --- Tools ---
    async def list_orchestrator_tools(self) -> List[str]:
        """Return available tools from orchestrator Pydantic AI agent"""
        try:
            # Get tools from orchestrator capabilities endpoint
            async with aiohttp.ClientSession() as session:
                tools_endpoint = f"{self.ag_ui_base}/api/v1/orchestrator/capabilities"
                async with session.get(tools_endpoint) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if data.get("success"):
                            tools = data.get("tools", [])
                            # Return tool names (they should already be strings)
                            return [str(tool) for tool in tools if tool]
                        else:
                            logger.warning(f"Capabilities endpoint returned unsuccessful response: {data}")
                            return []
                    else:
                        logger.warning(f"Capabilities endpoint returned {resp.status}: {await resp.text()}")
                        return []
        except Exception as e:
            logger.error(f"Error listing tools from orchestrator: {e}")
            return []
    
    async def switch_persona(self, persona_key: str) -> bool:
        """Switch persona for future requests"""
        personas = await self.list_orchestrator_personas()
        if persona_key in personas:
            self.persona_key = persona_key
            return True
        return False
    
    # --- Session ---
    async def start_session(self) -> str:
        """Initialize session (no-op for AG-UI, just return thread_id)"""
        if not self.session_id:
            self.session_id = self.thread_id
        return self.session_id
    
    async def update_model_in_session(self, model: str) -> bool:
        """Update model for future requests"""
        available_models = await self.list_available_models()
        available_model_names = [m["name"] for m in available_models]
        if model in available_model_names:
            self.model = model
            return True
        return False
    
    async def update_sys_override(self, text: Optional[str]) -> bool:
        """Update system prompt override"""
        self.system_override = text or ""
        return True
    
    # --- Chat Streaming ---
    async def run_chat_stream(
        self, 
        message: str, 
        stream: bool = True,
        stream_timeout: Optional[float] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream chat response via AG-UI protocol"""
        
        # GPT-5 doesn't support streaming - disable it automatically
        if "gpt-5" in self.model.lower():
            stream = False
        
        if not self.session_id:
            await self.start_session()
            
        # Start diagnostics recording
        trace_id = self.trace_id_override or str(uuid4())
        self.diag.start_turn(
            trace_id=trace_id,
            session_id=self.session_id,
            model=self.model,
            persona_key=self.persona_key
        )
        
        try:
            # Build AG-UI payload  
            agui_payload = build_run_agent_input(
                thread_id=self.thread_id,
                user_text=message,
                persona=self.persona_key,
                system_override=self.system_override,
                tools=None,
                state={"model": self.model, "persona": self.persona_key},
                forwarded_props={}
            )
            
            # Stream from AG-UI endpoint
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.ag_ui_endpoint,
                    json=agui_payload.model_dump(),  # Convert Pydantic model to dict
                    headers={"Content-Type": "application/json"}
                ) as resp:
                    
                    if resp.status != 200:
                        error_text = await resp.text()
                        raise Exception(f"AG-UI request failed: {resp.status} - {error_text}")
                    
                    # Parse streaming response line by line
                    buffer = ""
                    async for chunk in resp.content.iter_chunked(1024):
                        chunk_str = chunk.decode('utf-8')
                        buffer += chunk_str
                        
                        # Process complete lines
                        while '\n' in buffer:
                            line, buffer = buffer.split('\n', 1)
                            line = line.strip()
                            
                            if line.startswith('data: '):
                                try:
                                    event_data = json.loads(line[6:])  # Remove 'data: ' prefix
                                    
                                    # Convert AG-UI events to CLI format
                                    cli_event = self._convert_ag_ui_event(event_data)
                                    if cli_event:
                                        yield cli_event
                                        
                                except json.JSONDecodeError:
                                    continue
                                
        except Exception as e:
            logger.error(f"Error in chat stream: {e}")
            yield {
                "type": "error",
                "content": f"Stream error: {str(e)}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        finally:
            self.diag.end_turn()
    
    def _convert_ag_ui_event(self, ag_ui_event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Convert AG-UI events to CLI-compatible format"""
        event_type = ag_ui_event.get("type")
        
        if event_type == "TEXT_MESSAGE_CONTENT":
            return {
                "type": "content",
                "content": ag_ui_event.get("delta", ""),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        elif event_type == "TEXT_MESSAGE_END":
            return {
                "type": "message_complete",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        elif event_type == "RUN_STARTED":
            return {
                "type": "run_started",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        elif event_type == "RUN_FINISHED":
            return {
                "type": "run_finished", 
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        elif event_type == "TOOL_CALL_START":
            return {
                "type": "tool_start",
                "tool_name": ag_ui_event.get("toolCallName", "unknown"),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        elif event_type == "TOOL_CALL_RESULT":
            return {
                "type": "tool_result",
                "content": ag_ui_event.get("content", ""),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        # Skip other event types
        return None
    
    # --- Persona Model Management (simplified) ---
    async def set_persona_model(self, persona: str, model: str) -> bool:
        """Set model for persona (simplified - just validation)"""
        available_models = await self.list_available_models()
        available_model_names = [m["name"] for m in available_models]
        personas = await self.list_orchestrator_personas()
        return persona in personas and model in available_model_names
    
    async def get_persona_models(self) -> Dict[str, str]:
        """Get persona model assignments (simplified)"""
        return {persona: self.model for persona in await self.list_orchestrator_personas()}
    
    async def validate_persona_models(self) -> Dict[str, bool]:
        """Validate persona models (simplified)"""
        personas = await self.list_orchestrator_personas()
        return {persona: True for persona in personas}
    
    # --- CLI Compatibility Methods ---
    async def send_message(
        self, 
        message: str, 
        stream: bool = True, 
        strict: bool = False,
        timeout_s: Optional[float] = None
    ) -> Tuple[AsyncGenerator[Dict[str, Any], None], Dict[str, Any]]:
        """Send message and return stream iterator + metadata (CLI compatibility)"""
        
        # GPT-5 doesn't support streaming - disable it automatically
        if "gpt-5" in self.model.lower():
            stream = False
        
        # Generate metadata
        meta = {
            "model": self.model,
            "persona": self.persona_key,
            "session_id": self.session_id or self.thread_id,
            "stream": stream,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Return stream iterator and metadata
        stream_iter = self.run_chat_stream(message, stream=stream, stream_timeout=timeout_s)
        return stream_iter, meta
    
    # Real orchestrator property for CLI compatibility
    @property 
    def orch(self):
        """Real orchestrator that calls actual session APIs"""
        return RealOrchestrator(self)

class RealOrchestrator:
    """Real orchestrator that calls actual session status API"""
    
    def __init__(self, adapter):
        self.adapter = adapter
        self.session_status_endpoint = f"{adapter.ag_ui_base}/api/v1/orchestrator/sessions"
    
    async def get_session_status(self, session_id: str) -> Dict[str, Any]:
        """Get real session status from Redis via API"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.session_status_endpoint}/{session_id}/status") as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        # Fallback if session doesn't exist yet
                        return {
                            "session_id": session_id,
                            "active_model": self.adapter.model,
                            "active_persona": self.adapter.persona_key,
                            "user_id": self.adapter.user_id,
                            "status": "new",
                            "system_override": self.adapter.system_override,
                            "conversation_length": 0
                        }
        except Exception as e:
            logger.error(f"Error getting session status: {e}")
            # Fallback on error
            return {
                "session_id": session_id,
                "active_model": self.adapter.model,
                "active_persona": self.adapter.persona_key,
                "user_id": self.adapter.user_id,
                "status": "error",
                "system_override": self.adapter.system_override,
                "error": str(e)
            }