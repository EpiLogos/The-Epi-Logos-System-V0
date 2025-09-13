"""
API modules for Agentic layer

This package contains API endpoints that belong in the Agentic layer,
including the AG-UI protocol for agent communication.
"""

from agentic.api.ag_ui import router as ag_ui_router

__all__ = ["ag_ui_router"]
