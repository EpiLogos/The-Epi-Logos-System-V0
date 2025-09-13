# Bimba-Pratibimba MCP Server

Minimal Model Context Protocol (MCP) server that bridges Epi-Logos orchestrator coordinate resolution to MCP format.

## Claude Desktop Configuration

**Recommended:** Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bimba-pratibimba": {
      "command": "/Users/admin/Documents/The Epi-Logos System V0/.venv/bin/python",
      "args": [
        "-m", "agentic.mcp_servers.bimba_pratibimba_server",
        "--transport", "stdio"
      ],
      "env": {
        "PYTHONPATH": "/Users/admin/Documents/The Epi-Logos System V0"
      },
      "cwd": "/Users/admin/Documents/The Epi-Logos System V0"
    }
  }
}
```

## Other MCP Clients (VS Code, Web, etc.)

For non-Claude Desktop clients that support SSE transport:
- **SSE Endpoint**: `http://localhost:8004/sse`
- **Messages Endpoint**: `http://localhost:8004/messages/`

Start the SSE server with:
```bash
python -m agentic.mcp_servers.bimba_pratibimba_server --transport sse
# or just: python -m agentic.mcp_servers.bimba_pratibimba_server
```

## Overview

This MCP server provides a foundation tool for resolving Epi-Logos coordinates using the existing orchestrator GraphQL client. It serves as a clean, extensible base for adding more orchestrator capabilities to MCP clients.

**Key Benefits:**
- ✅ **Unified Runner**: Single server with transport selection via `--transport` flag
- ✅ **Multiple Client Support**: SSE transport allows Claude Desktop, VS Code, and other MCP clients simultaneously
- ✅ **Single Server Instance**: One running server serves all clients (no duplicate processes)
- ✅ **HTTP-Based**: Proper networking with health checks and monitoring endpoints
- ✅ **Clean Architecture**: Proper Python module execution (no path hacks)
- ✅ **Legacy Compatible**: Still supports single-client STDIO for simple scenarios

## Features

### Core Tool: `resolve_coordinate`

Resolves Epi-Logos coordinates to get node data, context, and relationships.

**Input Format:**
- `coordinate`: String in format `#N` or `#N.N` (e.g., `#1`, `#2.1`, `#3.2.4`)

**Response Fields:**
- `coordinate`: The resolved coordinate
- `name`: Node name
- `subsystem`: Subsystem identifier  
- `content`: Node description/content
- `context`: Additional metadata (operationalEssence, coreNature, function, etc.)
- `related_coordinates`: Related coordinate links

### Subsystem Mapping

- `#0`: Anuttara - Proto-logical processing (Neo4j core)
- `#1`: Paramasiva - Quaternal Logic engine (MongoDB)
- `#2`: Parashakti - Vibrational processing (LightRAG)  
- `#3`: Mahamaya - Symbolic transcription (Graphiti MCP)
- `#4`: Nara - Personal interface (Qdrant)
- `#5`: Epii - Orchestration synthesis (Redis + Notion)

### Unified Execution Pattern

The server uses a single runner with transport selection:

```bash
# For Claude Desktop (STDIO transport)
python -m agentic.mcp_servers.bimba_pratibimba_server --transport stdio

# For multi-client development (SSE transport)
python -m agentic.mcp_servers.bimba_pratibimba_server --transport sse

# Default is SSE transport
python -m agentic.mcp_servers.bimba_pratibimba_server
```

**Key Benefits:**
- ✅ **No Path Hacks**: Uses proper Python module execution
- ✅ **One Runner**: Single file handles both transports
- ✅ **Clean Architecture**: Follows established project patterns

## Usage

### Development Server

**Recommended**: Start from project root using npm:

```bash
# Using npm script (recommended)
npm run dev:mcp
```

**Stop the server**:

```bash
# Graceful shutdown
npm run stop:mcp
```

**Alternative direct execution**:

```bash
# Direct execution from project root
python -m agentic.mcp_servers.bimba_pratibimba_server --transport sse
```

### MCP Client Configuration

The server supports **multiple concurrent client connections** via SSE transport. 

**Auto-start**: The MCP server automatically starts when you run `npm run dev:agentic`

**Manual start**: Use `npm run dev:mcp` for dedicated terminal observability

Configure your clients to connect to the running server:


#### VS Code MCP Extension Configuration

Add to your VS Code settings or MCP extension config:

```json
{
  "mcp.servers": [
    {
      "name": "bimba-pratibimba",
      "url": "http://localhost:8004/sse",
      "type": "sse"
    }
  ]
}
```

#### Generic MCP Client Configuration

For any MCP-compatible client:

```json
{
  "name": "bimba-pratibimba",
  "description": "Epi-Logos Coordinate Resolution MCP Server - 6-fold CAG system with Bimba coordinate mapping",
  "url": "http://localhost:8004/sse",
  "type": "sse",
  "capabilities": {
    "tools": ["resolve_coordinate"],
    "resources": ["bimba://schema"]
  },
  "metadata": {
    "coordinates": {
      "0": "Anuttara - Proto-logical processing",
      "1": "Paramasiva - Quaternal Logic engine", 
      "2": "Parashakti - Vibrational processing",
      "3": "Mahamaya - Symbolic transcription",
      "4": "Nara - Personal interface",
      "5": "Epii - Synthesis & orchestration"
    },
    "formats": ["#", "#N", "#N-N-N", "#N.N"],
    "examples": ["#", "#0", "#1", "#1-2", "#3-4-5", "#4.2", "#2-3-5-4.2"]
  }
}
```

**Note**: Make sure the MCP server is running before connecting clients.

### LLM Usage Examples

Once connected, LLMs will understand these natural language requests and automatically use the `resolve_coordinate` tool:

**✅ Natural Requests LLMs Will Handle:**
- "Get info on coordinate #1"
- "What's at Bimba coordinate #1-2?" 
- "Check out the Anuttara layer" (→ resolves #0)
- "Explore Paramasiva subsystem" (→ resolves #1)
- "Tell me about coordinate #4.2"
- "What's in the Nara interface?" (→ resolves #4)
- "Show me the Epii synthesis layer" (→ resolves #5)
- "Resolve #2-3-5-4.2" (→ complex coordinate resolution)

**Context Understanding**: The enhanced tool description provides LLMs with full context about:
- The 6-fold consciousness-computing architecture
- CAG (Coordinate Augmented Generation) system
- Flexible coordinate formats (hyphens, dots, bare '#')
- Subsystem mappings and purposes
- When and how to use coordinate resolution

### Integration Testing

```python
import asyncio
from agentic.mcp_servers.bimba_pratibimba_server import BimbaPratibimbaMCPServer

async def test_coordinate():
    server = BimbaPratibimbaMCPServer()
    await server.initialize()
    
    # Test coordinate resolution
    result = await server._handle_resolve_coordinate({'coordinate': '#1'})
    print(result[0].text)
```

### Coordinate Formats

The server accepts all Epi-Logos coordinate formats using pattern: `^#(\d+([-\.]\d+)*)?$`

Valid examples:
- `#` (system root)
- `#0`, `#1`, `#5` (subsystems)
- `#1-2`, `#3-4-5` (hyphen-linked)
- `#4.2` (dot-linked, typically after #4)
- `#2-3-5-4.2` (complex mixed format)

Invalid examples:
- `1` (missing #)
- `#1.` (trailing separator)
- `##1` (double #)

## Architecture

### Foundation Pattern

- **Minimal**: Single coordinate resolution tool
- **Clean**: Proper error handling without system info leakage
- **Extensible**: Ready for adding more orchestrator tools
- **GraphQL Bridge**: Uses existing BimbaGraphQLClient

### Dependencies

- `mcp>=1.13.1`: MCP protocol implementation
- `agentic.clients.bimba_graphql_client`: Existing coordinate resolution client

## Future Extensions

This foundation supports incremental addition of orchestrator capabilities:

- Additional GraphQL queries as MCP tools
- Search and filtering tools
- Subsystem-specific operations  
- Cross-coordinate relationship tools
- Bulk resolution operations

## Error Handling

- **Invalid coordinates**: Format validation with helpful error messages
- **Network failures**: Graceful handling of backend connectivity issues  
- **GraphQL errors**: Clean presentation of resolution failures
- **Server errors**: Proper logging without sensitive information exposure