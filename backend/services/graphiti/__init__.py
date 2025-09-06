"""
Graphiti MCP Foundation Service.

This module provides temporal graph episodic memory capabilities for the Epi-Logos System.
It implements both MCP protocol server for agentic layer access and GraphQL API endpoints
for frontend/backend integration with shared Neo4j infrastructure.

Key Features:
- Session tracking and AI agent rumination capture
- Temporal memory and community formation
- Multi-tenant isolation with group_id namespacing
- Bi-temporal data tracking (event occurrence + ingestion time)
"""

from .service import GraphitiService
from .models import Episode, Community, EpisodeRequest, EpisodeResponse

__all__ = ["GraphitiService", "Episode", "Community", "EpisodeRequest", "EpisodeResponse"]