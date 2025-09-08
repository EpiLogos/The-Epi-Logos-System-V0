"""
Base HTTP client for communicating with Backend layer APIs

This client provides the foundation for all HTTP communication with the 
Backend layer, ensuring proper error handling and request formatting.
"""

import os
import logging
import httpx
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class BackendHttpClient:
    """Base HTTP client for Backend layer communication"""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv("BACKEND_URL", "http://localhost:8000")
        self.timeout = httpx.Timeout(30.0)  # 30 second timeout
        self._client: Optional[httpx.AsyncClient] = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        await self.connect()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
        
    async def connect(self):
        """Initialize HTTP client connection"""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
                headers={"User-Agent": "EpiLogos-Agentic/1.0"}
            )
            logger.info(f"Connected to Backend API at {self.base_url}")
    
    async def close(self):
        """Close HTTP client connection"""
        if self._client:
            await self._client.aclose()
            self._client = None
            logger.info("Backend HTTP client connection closed")
    
    async def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make GET request to Backend API"""
        if not self._client:
            await self.connect()
            
        try:
            response = await self._client.get(endpoint, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error on GET {endpoint}: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Request error on GET {endpoint}: {e}")
            raise
    
    async def post(self, endpoint: str, data: Optional[Dict[str, Any]] = None, json_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make POST request to Backend API"""
        if not self._client:
            await self.connect()
            
        try:
            response = await self._client.post(
                endpoint, 
                data=data,
                json=json_data
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error on POST {endpoint}: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Request error on POST {endpoint}: {e}")
            raise
    
    async def health_check(self) -> Dict[str, Any]:
        """Check Backend API health"""
        return await self.get("/api/health/")