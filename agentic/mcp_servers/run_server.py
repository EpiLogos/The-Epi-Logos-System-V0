#!/usr/bin/env python3
"""
Development script to run the Bimba-Pratibimba MCP Server.

Usage:
    cd agentic && python mcp_servers/run_server.py
    
    or from project root:
    python -m agentic.mcp_servers.run_server
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add project root to path if needed
project_root = Path(__file__).parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from agentic.mcp_servers.bimba_pratibimba_server import main

if __name__ == "__main__":
    # Set up logging for development
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("Starting Bimba-Pratibimba MCP Server...")
    print("Press Ctrl+C to stop the server")
    print()
    
    # Run the server
    asyncio.run(main())