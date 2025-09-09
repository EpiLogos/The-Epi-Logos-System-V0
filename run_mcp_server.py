#!/usr/bin/env python3
"""
Convenient script to run the Bimba-Pratibimba MCP Server from project root.

Usage from project root:
    python run_mcp_server.py

This script ensures proper path setup and runs the MCP server using the 
project's virtual environment and dependencies.
"""

import asyncio
import logging
import sys
from pathlib import Path

# Ensure we're using the correct Python path
project_root = Path(__file__).parent.absolute()
sys.path.insert(0, str(project_root))

from agentic.mcp_servers.bimba_pratibimba_server import main

if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("🏃 Starting Bimba-Pratibimba MCP Server from project root...")
    print("📍 Working directory:", project_root)
    print("🔧 Using virtual environment:", sys.executable)
    print("📡 Press Ctrl+C to stop the server")
    print("=" * 60)
    print()
    
    try:
        # Run the MCP server
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server failed: {e}")
        sys.exit(1)