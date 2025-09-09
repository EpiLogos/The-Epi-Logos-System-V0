"""
Agentic Layer Application for Epi-Logos System

This is the main entry point for the agentic layer (Nervous System)
of the tri-laminar architecture.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env files
load_dotenv()  # loads .env from project root

# Initialize FastAPI app
app = FastAPI(
    title="Epi-Logos Agentic Layer",
    description="Agentic AI layer for the Epi-Logos System V0.1",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000", "http://localhost:8000", "http://backend:8000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional JSON logging middleware for diagnostics
if os.getenv("AGENTIC_DEBUG") == "1" or os.getenv("AGENTIC_TRACE") == "1":
    try:
        from .server.middleware.logging import JSONLoggingMiddleware

        app.add_middleware(JSONLoggingMiddleware)  # type: ignore
    except Exception:
        pass

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Epi-Logos Agentic Layer",
        "version": "0.1.0",
        "timestamp": datetime.utcnow().isoformat(),
        "layer": "Agentic (Nervous System)"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker and monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.1.0",
        "services": {
            "orchestrator": "healthy",
            "personas": "pending",
            "tools": "pending"
        }
    }

@app.get("/api/v1/personas")
async def list_personas():
    """List available personas"""
    return {
        "personas": [
            {
                "id": "nara",
                "name": "Nara",
                "subsystem": 4,
                "status": "initialized",
                "description": "User interaction and dialogue persona"
            },
            {
                "id": "epii", 
                "name": "Epii",
                "subsystem": 5,
                "status": "initialized",
                "description": "Knowledge synthesis and wisdom generation persona"
            },
            {
                "id": "anuttara",
                "name": "Anuttara", 
                "subsystem": 0,
                "status": "initialized",
                "description": "Absolute ground and foundational processing persona"
            },
            {
                "id": "paramasiva",
                "name": "Paramasiva",
                "subsystem": 1, 
                "status": "initialized",
                "description": "Quaternary logic and reasoning persona"
            },
            {
                "id": "parashakti",
                "name": "Parashakti",
                "subsystem": 2,
                "status": "initialized", 
                "description": "Vibrational and energetic processing persona"
            },
            {
                "id": "mahamaya",
                "name": "Mahamaya",
                "subsystem": 3,
                "status": "initialized",
                "description": "Transcription and transformation persona"
            }
        ]
    }

# Include AG-UI protocol router (moved from Backend layer)
from .api.ag_ui import router as ag_ui_router
app.include_router(ag_ui_router)

@app.get("/api/v1/orchestrator/status")
async def orchestrator_status():
    """Get orchestrator status"""
    return {
        "status": "operational",
        "active_workflows": 0,
        "available_tools": [],
        "persona_coordination": "ready"
    }

@app.get("/api/v1/orchestrator/sessions/{session_id}/status")
async def get_session_status(session_id: str):
    """Get real session status from Redis"""
    from .orchestrator.redis_session_tools import RealRedisSessionClient
    
    try:
        redis_client = RealRedisSessionClient()
        await redis_client.connect()
        
        session_data = await redis_client.get_session(session_id)
        if session_data:
            return {
                "session_id": session_id,
                "active_model": session_data.get("model", "unknown"),
                "active_persona": session_data.get("persona", "system"), 
                "user_id": session_data.get("user_id", "unknown"),
                "conversation_length": len(session_data.get("messages", [])),
                "last_activity": session_data.get("updated_at"),
                "system_override": session_data.get("system_override", ""),
                "status": "active"
            }
        else:
            return {
                "session_id": session_id,
                "status": "not_found",
                "message": "Session not found in Redis"
            }
            
    except Exception as e:
        logger.error(f"Error getting session status: {e}")
        return {
            "session_id": session_id,
            "status": "error", 
            "message": str(e)
        }

@app.get("/api/v1/orchestrator/capabilities")
async def get_orchestrator_capabilities():
    """Get orchestrator capabilities including tools from Pydantic AI agent"""
    from .agents.orchestrator_agent import get_agent_info, create_orchestrator_agent

    # Get agent info
    agent_info = get_agent_info()

    # Return the actual tool names defined in setup_agent_tools
    tools = [
        "resolve_coordinate",
        "search_gnostic_space", 
        "get_session_context",
        "check_context_window_status",
        "ingest_wisdom",
        "get_gnostic_workspace_info",
        "remember_episode", 
        "search_memory_patterns",
        "form_memory_community",
        "retrieve_session_continuity",
        "access_agent_ruminations"
    ]

    return {
        "success": True,
        "tools": tools,
        "agent_info": agent_info,
        "tools_count": len(tools)
    }

@app.get("/api/v1/orchestrator/models")
async def get_available_models():
    """Get available models for the orchestrator agent"""
    from .agents.orchestrator_agent import get_agent_info

    # Get agent info which includes available models
    agent_info = get_agent_info()
    available_models = agent_info.get("available_models", {})
    default_model = agent_info.get("default_model", "gemini-2.5-flash")
    
    # Format models for frontend consumption
    models = []
    
    # Map environment variables to user-friendly model info
    model_mappings = {
        "groq": {
            "moonshotai/kimi-k2-instruct": {"name": "Kimi K2 Instruct", "provider": "Groq"},
        },
        "gemini": {
            "gemini-2.5-flash": {"name": "Gemini 2.5 Flash", "provider": "Google"},
            "gemini-2.5-pro": {"name": "Gemini 2.5 Pro", "provider": "Google"},
            "gemini-1.5-pro": {"name": "Gemini 1.5 Pro", "provider": "Google"},
        },
        # OpenAI commented out - streaming blocked by OpenAI biometric data collection
        # "openai": {
        #     "gpt-4o": {"name": "GPT-4o", "provider": "OpenAI"},
        #     "gpt-4o-mini": {"name": "GPT-4o Mini", "provider": "OpenAI"},
        #     "gpt-4-turbo": {"name": "GPT-4 Turbo", "provider": "OpenAI"},
        # },
        "anthropic": {
            "claude-3-5-sonnet-20241022": {"name": "Claude 3.5 Sonnet", "provider": "Anthropic"},
            "claude-3-haiku-20240307": {"name": "Claude 3 Haiku", "provider": "Anthropic"},
            "claude-3-opus-20240229": {"name": "Claude 3 Opus", "provider": "Anthropic"},
        },
        "deepseek": {
            "deepseek-chat": {"name": "DeepSeek Chat", "provider": "DeepSeek"},
            "deepseek-coder": {"name": "DeepSeek Coder", "provider": "DeepSeek"},
        }
    }
    
    # Process available models - only include providers with API keys configured
    for provider, model_list in available_models.items():
        if model_list:  # Only include providers that have API keys configured
            for model_id in model_list:
                # Handle special cases for model format
                if provider == "gemini":
                    # Gemini models work without provider prefix in Pydantic AI
                    full_model_id = model_id
                    clean_model_id = model_id
                else:
                    # Other providers need provider:model format
                    if ":" not in model_id:
                        full_model_id = f"{provider}:{model_id}"
                        clean_model_id = model_id
                    else:
                        full_model_id = model_id
                        _, clean_model_id = model_id.split(":", 1)
                
                # Get model info from mappings
                provider_models = model_mappings.get(provider, {})
                model_info = provider_models.get(clean_model_id, {
                    "name": clean_model_id.title().replace("-", " "),
                    "provider": provider.title()
                })
                
                models.append({
                    "id": full_model_id,  # Correct format for each provider
                    "name": model_info["name"],
                    "provider": model_info["provider"],
                    "available": True
                })
    
    # If no models are available, provide fallback
    if not models:
        models.append({
            "id": "test",
            "name": "Test Model",
            "provider": "Local",
            "available": True
        })
    
    return {
        "success": True,
        "models": models,
        "default_model": default_model,
        "total_available": len(models)
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
