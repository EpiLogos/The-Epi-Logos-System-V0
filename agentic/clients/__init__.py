"""
HTTP clients for communicating with Backend layer APIs

This module provides HTTP clients that replace direct database connections,
ensuring proper trilaminar architecture separation.
"""

from agentic.clients.backend_http_client import BackendHttpClient
from agentic.clients.lightrag_http_client import LightRAGHttpClient
from agentic.clients.graphiti_http_client import GraphitiHttpClient
from agentic.clients.bimba_graphql_client import BimbaGraphQLClient

__all__ = [
    "BackendHttpClient",
    "LightRAGHttpClient", 
    "GraphitiHttpClient",
    "BimbaGraphQLClient"
]
