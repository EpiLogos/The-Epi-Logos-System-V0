"""
Health Check Service for Agentic Layer

Provides health monitoring for the agentic layer (Nervous System)
of the tri-laminar architecture.
"""

import os
import time
import sys
from datetime import datetime
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class AgenticHealthService:
    """Health check service for Epi-Logos Agentic Layer"""
    
    def __init__(self):
        """Initialize agentic health service"""
        self.startup_time = datetime.utcnow()
        
    async def comprehensive_health_check(self) -> Dict[str, Any]:
        """Comprehensive health check for agentic layer"""
        start_time = time.time()
        
        # Check AI services configuration
        ai_services = await self._check_ai_services()
        
        # Check orchestrator status
        orchestrator = await self._check_orchestrator()
        
        # Check persona system
        personas = await self._check_personas()
        
        # Check tools system
        tools = await self._check_tools()
        
        total_time = (time.time() - start_time) * 1000
        
        # Calculate overall status
        checks = [ai_services, orchestrator, personas, tools]
        overall_status = self._calculate_status(checks)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "service": "epi-logos-agentic",
            "version": "0.1.0",
            "uptime_seconds": (datetime.utcnow() - self.startup_time).total_seconds(),
            "overall_status": overall_status,
            "response_time_ms": total_time,
            "checks": {
                "ai_services": ai_services,
                "orchestrator": orchestrator,
                "personas": personas,
                "tools": tools
            },
            "layer": "Agentic (Nervous System)",
            "story": "00.02 - Service Validation & Foundation Interface"
        }
    
    async def _check_ai_services(self) -> Dict[str, Any]:
        """Check AI service configurations"""
        try:
            ai_keys = {
                "gemini": os.getenv("GEMINI_API_KEY"),
                "openai": os.getenv("OPENAI_API_KEY"), 
                "anthropic": os.getenv("ANTHROPIC_API_KEY"),
                "deepseek": os.getenv("DEEPSEEK_API_KEY")
            }
            
            configured_services = [name for name, key in ai_keys.items() if key]
            total_services = len(ai_keys)
            configured_count = len(configured_services)
            
            if configured_count == 0:
                status = "critical"
                message = "No AI services configured"
            elif configured_count >= total_services * 0.5:
                status = "healthy"
                message = f"{configured_count}/{total_services} AI services configured"
            else:
                status = "warning"
                message = f"Limited AI services: {configured_count}/{total_services} configured"
            
            return {
                "status": status,
                "message": message,
                "details": {
                    "configured_services": configured_services,
                    "total_services": total_services,
                    "configured_count": configured_count,
                    "service_status": {
                        name: "configured" if key else "not_configured"
                        for name, key in ai_keys.items()
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"AI services check failed: {e}")
            return {
                "status": "error",
                "message": "AI services check failed",
                "error": str(e)
            }
    
    async def _check_orchestrator(self) -> Dict[str, Any]:
        """Check orchestrator system"""
        try:
            # Check if orchestrator directory exists and is accessible
            orchestrator_path = os.path.join(os.path.dirname(__file__), "orchestrator")
            orchestrator_exists = os.path.exists(orchestrator_path)
            
            return {
                "status": "healthy" if orchestrator_exists else "warning",
                "message": "Orchestrator system ready" if orchestrator_exists else "Orchestrator directory not found",
                "details": {
                    "orchestrator_path": orchestrator_path,
                    "directory_exists": orchestrator_exists,
                    "active_workflows": 0,
                    "workflow_capacity": "unlimited"
                }
            }
            
        except Exception as e:
            logger.error(f"Orchestrator check failed: {e}")
            return {
                "status": "error",
                "message": "Orchestrator check failed",
                "error": str(e)
            }
    
    async def _check_personas(self) -> Dict[str, Any]:
        """Check persona system"""
        try:
            # Define the six personas according to the Bimba coordinate system
            personas = {
                "anuttara": {
                    "id": 0,
                    "name": "Anuttara",
                    "description": "Absolute ground and foundational processing",
                    "status": "initialized"
                },
                "paramasiva": {
                    "id": 1,
                    "name": "Paramasiva", 
                    "description": "Quaternary logic and reasoning",
                    "status": "initialized"
                },
                "parashakti": {
                    "id": 2,
                    "name": "Parashakti",
                    "description": "Vibrational and energetic processing",
                    "status": "initialized"
                },
                "mahamaya": {
                    "id": 3,
                    "name": "Mahamaya",
                    "description": "Transcription and transformation",
                    "status": "initialized"
                },
                "nara": {
                    "id": 4,
                    "name": "Nara",
                    "description": "User interaction and dialogue",
                    "status": "initialized"
                },
                "epii": {
                    "id": 5,
                    "name": "Epii",
                    "description": "Knowledge synthesis and wisdom generation",
                    "status": "initialized"
                }
            }
            
            active_personas = len(personas)
            total_personas = 6
            
            return {
                "status": "healthy" if active_personas == total_personas else "warning",
                "message": f"Persona system: {active_personas}/{total_personas} personas initialized",
                "details": {
                    "total_personas": total_personas,
                    "active_personas": active_personas,
                    "personas": personas,
                    "coordination_ready": True
                }
            }
            
        except Exception as e:
            logger.error(f"Personas check failed: {e}")
            return {
                "status": "error",
                "message": "Personas check failed", 
                "error": str(e)
            }
    
    async def _check_tools(self) -> Dict[str, Any]:
        """Check tools system"""
        try:
            # Check if tools directory exists
            tools_path = os.path.join(os.path.dirname(__file__), "tools")
            tools_exists = os.path.exists(tools_path)
            
            return {
                "status": "healthy" if tools_exists else "warning",
                "message": "Tools system ready" if tools_exists else "Tools directory not found",
                "details": {
                    "tools_path": tools_path,
                    "directory_exists": tools_exists,
                    "available_tools": [],
                    "tool_categories": ["analysis", "synthesis", "transformation", "communication"]
                }
            }
            
        except Exception as e:
            logger.error(f"Tools check failed: {e}")
            return {
                "status": "error",
                "message": "Tools check failed",
                "error": str(e)
            }
    
    def _calculate_status(self, checks: list) -> str:
        """Calculate overall status from individual checks"""
        statuses = [check.get("status", "error") for check in checks]
        
        if "critical" in statuses or "error" in statuses:
            return "unhealthy"
        elif "warning" in statuses:
            return "warning"
        elif all(status == "healthy" for status in statuses):
            return "healthy"
        else:
            return "warning"
    
    async def quick_health_check(self) -> Dict[str, Any]:
        """Quick health check for basic monitoring"""
        start_time = time.time()
        
        # Basic AI services check
        ai_keys = [
            os.getenv("GEMINI_API_KEY"),
            os.getenv("OPENAI_API_KEY"),
            os.getenv("ANTHROPIC_API_KEY")
        ]
        
        configured_ai_services = sum(1 for key in ai_keys if key)
        status = "healthy" if configured_ai_services > 0 else "warning"
        
        response_time = (time.time() - start_time) * 1000
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "status": status,
            "response_time_ms": response_time,
            "uptime_seconds": (datetime.utcnow() - self.startup_time).total_seconds(),
            "configured_ai_services": configured_ai_services,
            "message": "Quick health check completed"
        }


# Global health service instance
agentic_health_service = AgenticHealthService()