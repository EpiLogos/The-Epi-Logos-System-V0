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
    allow_origins=["http://localhost:3000", "http://frontend:3000", "http://localhost:8000", "http://backend:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/api/v1/orchestrator/status")
async def orchestrator_status():
    """Get orchestrator status"""
    return {
        "status": "operational",
        "active_workflows": 0,
        "available_tools": [],
        "persona_coordination": "ready"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
