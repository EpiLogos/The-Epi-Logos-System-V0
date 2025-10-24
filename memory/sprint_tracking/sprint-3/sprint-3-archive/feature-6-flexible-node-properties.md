# Feature 6: Flexible Node Properties System

**Sprint:** 3
**Completion Date:** 2025-10-02
**Status:** ✅ Complete

## Overview

Implemented a flexible property system for Bimba graph nodes, enabling arbitrary camelCase properties beyond the fixed GraphQL schema while maintaining type safety and validation at the service layer.

## Problem Statement

The MCP `update_bimba_node` tool was constrained by a fixed GraphQL schema that only allowed predefined properties. When attempting to add coordinate-specific properties (e.g., `f_cycle_orchestration`, `f_in_quantum_epistemology`, `spandaMode`), the tool would reject them because they weren't in the schema definition.

Claude Desktop MCP client saw the tool as constrained and would not pass arbitrary property names, limiting the expressiveness of the Bimba coordinate system.

## Solution Architecture

### Approach: Key-Value Array Pattern

Instead of implementing a custom JSON scalar (which proved overly complex and error-prone), we adopted the **key-value array pattern** already used successfully for relationship properties.

**Benefits:**
- ✅ Reuses battle-tested pattern from relationship properties
- ✅ Zero external dependencies
- ✅ Type-safe at GraphQL level
- ✅ Consistent with existing codebase patterns
- ✅ Simple and maintainable

### Implementation Layers

#### 1. GraphQL Schema (`backend/epi_logos_system/cag/bimba/schema.graphql`)

Added `PropertyInput` type and `properties` field:

```graphql
"""Input type for flexible key-value properties"""
input PropertyInput {
    key: String!
    value: String!
}

input UpdateBimbaNodeInput {
    coordinate: String!
    # ... existing typed fields ...

    # Flexible properties for arbitrary coordinate-specific fields
    properties: [PropertyInput!]
}
```

#### 2. GraphQL Resolver (`backend/epi_logos_system/cag/bimba/resolvers.py`)

Transform key-value array to flat dict for service layer:

```python
# Convert [{key: "foo", value: "bar"}] → {foo: "bar"}
properties_array = input.get("properties")
if properties_array and isinstance(properties_array, list):
    for prop in properties_array:
        if isinstance(prop, dict) and "key" in prop and "value" in prop:
            update_data[prop["key"]] = prop["value"]
```

#### 3. MCP Tool Definition (`agentic/mcp_servers/bimba_pratibimba_server.py`)

Added `additionalProperties: True` to tool schema:

```python
Tool(
    name="update_bimba_node",
    description="... FLEXIBLE PROPERTIES: This tool accepts ANY camelCase property names ...",
    inputSchema={
        "type": "object",
        "properties": { ... },
        "required": ["bimbaCoordinate"],
        "additionalProperties": True  # ← Key change
    }
)
```

#### 4. MCP Handler (`agentic/mcp_servers/bimba_pratibimba_server.py`)

Transform arbitrary properties to key-value array:

```python
# Split into known fields and custom properties
typed_props = {k: v for k, v in arguments.items() if k in known_fields}
custom_props = {k: v for k, v in arguments.items() if k not in known_fields and k != "bimbaCoordinate"}

# Transform custom properties: {foo: "bar"} → [{key: "foo", value: "bar"}]
if custom_props:
    payload["properties"] = [{"key": k, "value": str(v)} for k, v in custom_props.items()]
```

#### 5. Service Layer Validation (already in place)

`backend/epi_logos_system/cag/bimba/services.py` already validates:
- ✅ camelCase naming conventions
- ✅ No nested objects (Neo4j compatibility)
- ✅ Immutable coordinate protection
- ✅ No fragmented properties

## What Was Removed

### Failed Approach: Custom JSON Scalar

Initial implementation attempted a custom `JSONObject` scalar:

❌ **Problems encountered:**
1. Missing `literal_parser` implementation caused silent failures
2. Incorrect boolean syntax (`true` vs `True`) in MCP schema
3. Overcomplicated for simple key-value use case
4. No clear benefit over existing patterns

✅ **Removed:**
- Custom `scalar JSONObject` from GraphQL schema
- `json_scalar` ScalarType implementation from resolvers
- `ScalarType` import and all scalar decorators
- `json_scalar` from main.py schema creation

### Accidental Tool Addition

During debugging, `create_bimba_relationship` tool was accidentally added to MCP server, causing tool listing failures.

✅ **Removed:**
- Entire `create_bimba_relationship` tool definition
- Handler dispatch for `create_bimba_relationship`
- `_handle_create_bimba_relationship()` function

## Testing & Validation

### MCP Server
- ✅ Server starts successfully
- ✅ Claude Desktop connects via SSE transport
- ✅ All tools load and list correctly
- ✅ Tool schema accepts arbitrary properties

### Usage Example

```python
# Claude Desktop can now pass:
update_bimba_node(
    bimbaCoordinate="#5",
    f_cycle_orchestration="Sequential flow coordination across system layers",
    f_in_quantum_epistemology="Epii's knowing-in-formation across probability spaces",
    spandaMode="oscillatory"
)

# MCP handler transforms to:
{
    "coordinate": "#5",
    "properties": [
        {"key": "f_cycle_orchestration", "value": "Sequential flow..."},
        {"key": "f_in_quantum_epistemology", "value": "Epii's knowing..."},
        {"key": "spandaMode", "value": "oscillatory"}
    ]
}

# GraphQL resolver flattens to:
{
    "f_cycle_orchestration": "Sequential flow...",
    "f_in_quantum_epistemology": "Epii's knowing...",
    "spandaMode": "oscillatory"
}

# Service layer validates and persists to Neo4j
```

## Files Modified

### Backend Layer
- `backend/epi_logos_system/cag/bimba/schema.graphql` - Added PropertyInput type
- `backend/epi_logos_system/cag/bimba/resolvers.py` - Key-value array transformation
- `backend/main.py` - Removed json_scalar import

### Agentic Layer
- `agentic/mcp_servers/bimba_pratibimba_server.py` - Tool schema + handler updates
- `agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py` - Updated docstrings

### Service Layer
- No changes (already supported flexible properties)

## Key Learnings

### 1. Respect Existing Patterns
The relationship properties already used key-value arrays successfully. Attempting a "better" solution with JSON scalars added complexity without benefit.

### 2. Python Boolean Gotcha
In JSON Schema within Python: `"additionalProperties": True` (Python bool), not `"additionalProperties": true` (JSON literal).

### 3. Silent Failures in MCP
MCP tool listing failures are silent - tools just don't load. Critical to:
- Test tool definitions in isolation
- Validate JSON serialization
- Check for accidental additions/modifications

### 4. Keep Backend Simple
The backend service layer was already flexible. The constraint was in the GraphQL contract layer. Solution: make the contract flexible, not the backend more complex.

## Future Considerations

### Potential Enhancements
- Add property type validation (string, number, boolean) at service layer
- Implement property schema versioning for coordinate types
- Create property discovery/introspection tools
- Add property search/filtering capabilities

### Known Limitations
- Properties are string-only in key-value format (arrays must be JSON-encoded strings)
- No nested object support (Neo4j constraint)
- Property names must follow camelCase convention
- No property-level access control (inherits node-level permissions)

## Credits

**Implementation Session:** 2025-10-02
**Debugger:** User (identified failing MCP server connection)
**Assistant:** Claude (overcomplicated, then simplified)
**Pattern Source:** Existing relationship properties implementation
