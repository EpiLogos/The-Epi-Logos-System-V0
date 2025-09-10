#!/usr/bin/env python3
"""
STDIO runner for Bimba-Pratibimba MCP Server
For use with Claude Desktop
"""

import asyncio
import logging
import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from agentic.mcp_servers.bimba_pratibimba_server import BimbaPratibimbaMCPServerSSE

async def main():
    """Run the MCP server with STDIO transport."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    server = BimbaPratibimbaMCPServerSSE()
    await server.initialize()
    await server.serve_stdio()

if __name__ == "__main__":
    asyncio.run(main())
