#!/usr/bin/env python3
"""
Multi-client MCP server startup script using SSE transport.

This script starts the Bimba-Pratibimba MCP Server with HTTP+SSE transport,
supporting multiple concurrent client connections unlike the single-client
STDIO transport.

Usage from project root:
    python run_mcp_server_sse.py

Server endpoints:
    - SSE: http://localhost:8004/sse/events (for MCP clients)
    - Health: http://localhost:8004/health (monitoring)
    - Info: http://localhost:8004/ (server details)
"""

import asyncio
import logging
import sys
import uvicorn
from pathlib import Path

# Ensure we're using the correct Python path
project_root = Path(__file__).parent.absolute()
sys.path.insert(0, str(project_root))

from agentic.mcp_servers.bimba_pratibimba_server import create_app

if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("🌐 Starting Bimba-Pratibimba MCP Server (Multi-Client SSE)")
    print("📍 Working directory:", project_root)
    print("🔧 Using virtual environment:", sys.executable)
    print("🔗 SSE endpoint: http://localhost:8004/sse")
    print("📮 Messages endpoint: http://localhost:8004/messages")
    print("💚 Health check: http://localhost:8004/health")
    print("📡 Supports multiple concurrent clients")
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 80)
    print()
    
    try:
        # Create FastAPI app with MCP server
        app = asyncio.run(create_app())
        
        # Run with uvicorn
        uvicorn.run(
            app,
            host="localhost",
            port=8004,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server failed: {e}")
        sys.exit(1)