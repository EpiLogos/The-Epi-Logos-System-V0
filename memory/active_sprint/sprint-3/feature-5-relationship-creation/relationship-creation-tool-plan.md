# Bimba Relationship Creation Tool - Implementation Plan

## Feature Overview

**Purpose**: Create/update semantically rich relationships between Bimba nodes with idempotent MERGE operations and open property schema.

**Key Innovation**: MERGE pattern with pre-validation ensures safety while enabling iterative relationship refinement.

---

## Design Decisions

### 1. MERGE vs CREATE - Final Decision: MERGE ✓

**Rationale**:
- **Idempotent**: Re-running same mutation updates properties instead of creating duplicates
- **Update Capability**: Single tool handles both create and update (cleaner API)
- **Safety Preserved**: Pre-validation via separate MATCH prevents node creation
- **Real-World Usage**: Developers can refine relationships iteratively

**Implementation Pattern**:
```cypher
# Step 1: Validate nodes exist (prevents MERGE from creating)
MATCH (from:BimbaNode { bimbaCoordinate: $from })
MATCH (to:BimbaNode { bimbaCoordinate: $to })

# Step 2: MERGE relationship (safe because nodes pre-validated)
MERGE (from)-[r:RELATIONSHIP_TYPE]->(to)
ON CREATE SET r.createdAt = datetime(), ...
ON MATCH SET r.updatedAt = datetime()
SET r += $properties
```

### 2. Property Schema - Open & Relationship-Specific ✓

**Design**: Completely open key-value property array
- No predefined schema
- Relationship-specific semantics
- Developer freedom to define meaningful properties

**GraphQL Input**:
```graphql
input RelationshipPropertyInput {
    key: String!
    value: String!
}

properties: [RelationshipPropertyInput!]
```

**Examples**:
- Hierarchical: `{key: "hierarchyLevel", value: "1"}`
- Resonance: `{key: "resonancePattern", value: "3-fold harmonic"}`
- Temporal: `{key: "sequenceOrder", value: "1"}`
- Custom: Any camelCase property relevant to relationship

---

## GraphQL Schema

### Input Types

```graphql
"""Flexible key-value property for relationships"""
input RelationshipPropertyInput {
    key: String!
    value: String!
}

"""Input for creating/updating a relationship between Bimba nodes"""
input CreateBimbaRelationshipInput {
    fromCoordinate: String!
    toCoordinate: String!
    relationshipType: String!
    properties: [RelationshipPropertyInput!]
    bidirectional: Boolean
}
```

### Output Types

```graphql
"""A created/updated relationship with its properties"""
type BimbaRelationship {
    type: String!
    fromCoordinate: String!
    toCoordinate: String!
    properties: [RelationshipProperty!]!
    createdAt: String
    updatedAt: String
}

"""Payload for relationship creation/update"""
type CreateBimbaRelationshipPayload {
    success: Boolean!
    relationship: BimbaRelationship
    reverseRelationship: BimbaRelationship
    wasUpdate: Boolean!  # True if relationship already existed
    errors: [MutationError!]
}
```

### Mutation

```graphql
type Mutation {
    createBimbaRelationship(input: CreateBimbaRelationshipInput!): CreateBimbaRelationshipPayload
}
```

---

## Backend Implementation

### Repository Layer (NodeRepository)

**Method**: `create_or_update_bimba_relationship()`

**Algorithm**:
1. Validate `from_coordinate` exists → raise ValueError if not
2. Validate `to_coordinate` exists → raise ValueError if not
3. Check if relationship exists (for `wasUpdate` flag)
4. MERGE relationship with ON CREATE/ON MATCH logic
5. Optional: Create bidirectional reverse relationship
6. Return relationship data + wasUpdate flag

**Cypher Pattern**:
```cypher
# Check existence
MATCH (from:BimbaNode { bimbaCoordinate: $from })-[r:TYPE]->(to:BimbaNode { bimbaCoordinate: $to })
RETURN r

# MERGE relationship
MATCH (from:BimbaNode { bimbaCoordinate: $from })
MATCH (to:BimbaNode { bimbaCoordinate: $to })
MERGE (from)-[r:TYPE]->(to)
ON CREATE SET r.createdAt = datetime(), r.fromCoordinate = $from, r.toCoordinate = $to
ON MATCH SET r.updatedAt = datetime()
SET r += $properties
RETURN r
```

### Service Layer (NodeService)

**Method**: `create_bimba_relationship()`

**Validation**:
- Relationship type format: `^[A-Z_][A-Z0-9_]*$` (UPPERCASE_UNDERSCORES)
- Property key format: camelCase validation
- No nested objects in property values
- Delegates to repository for data access

### Resolver Layer

**Method**: `resolve_create_bimba_relationship()`

**Flow**:
1. Admin authorization check
2. Extract input parameters
3. Convert property array to dict
4. Call service method
5. Map result to GraphQL payload
6. Return structured response

**Error Codes**:
- `COORDINATE_NOT_FOUND`: fromCoordinate or toCoordinate doesn't exist
- `INVALID_RELATIONSHIP_TYPE`: Type doesn't match pattern
- `VALIDATION_ERROR`: Property validation failed
- `UNAUTHORIZED_ADMIN`: Non-admin user
- `RELATIONSHIP_ERROR`: General relationship creation error

---

## Agentic Layer Implementation

### BimbaGraphQLClient

**Method**: `create_bimba_relationship(input_data: Dict[str, Any])`

**GraphQL Mutation**:
```graphql
mutation CreateRel($input: CreateBimbaRelationshipInput!) {
  createBimbaRelationship(input: $input) {
    success
    relationship {
      type
      fromCoordinate
      toCoordinate
      properties { key value }
      createdAt
      updatedAt
    }
    reverseRelationship {
      type
      fromCoordinate
      toCoordinate
      properties { key value }
      createdAt
      updatedAt
    }
    wasUpdate
    errors { field message code }
  }
}
```

### HttpBimbaClient

**Method**: `create_bimba_relationship(input_data: Dict[str, Any])`

Wraps GraphQL client call with error handling and logging.

### Orchestrator Agent Tool

**Signature**:
```python
@agent.tool
async def create_bimba_relationship(
    ctx: RunContext[OrchestratorDeps],
    from_coordinate: str,
    to_coordinate: str,
    relationship_type: str,
    properties: Optional[List[Dict[str, str]]] = None,
    bidirectional: bool = False,
) -> Dict[str, Any]
```

**Documentation**:
- Clear explanation of MERGE behavior
- Examples of property types per relationship category
- Admin-only notice
- wasUpdate flag explanation

---

## MCP Server Implementation

### Tool Definition (CORRECTED - MCP Compatible)

**IMPORTANT**: Previous implementation used nested object schema with `required` arrays inside `items`, which broke MCP validation. This corrected version uses simple string array format.

```python
Tool(
    name="create_bimba_relationship",
    description=(
        "Create or update relationship between Bimba coordinates (admin only). "
        "Uses MERGE for idempotent operations. Pre-validates coordinates. "
        "Properties format: array of 'key:value' strings (e.g., ['hierarchyLevel:1', 'resonancePattern:harmonic']). "
        "Open schema - define properties that make sense for your relationship type."
    ),
    inputSchema={
        "type": "object",
        "properties": {
            "fromCoordinate": {
                "type": "string",
                "pattern": r"^#(\d+([-\.]\d+)*)?$",
                "description": "Source Bimba coordinate"
            },
            "toCoordinate": {
                "type": "string",
                "pattern": r"^#(\d+([-\.]\d+)*)?$",
                "description": "Target Bimba coordinate"
            },
            "relationshipType": {
                "type": "string",
                "description": "Relationship type in UPPERCASE_UNDERSCORES format (e.g., CONTAINS, RESONATES_WITH)"
            },
            "properties": {
                "type": "array",
                "items": {"type": "string"},  # ✅ Simple string array, not nested objects
                "description": "Properties as 'key:value' strings (e.g., ['hierarchyLevel:1', 'resonancePattern:3-fold harmonic'])"
            },
            "bidirectional": {
                "type": "boolean",
                "description": "Create reverse relationship as well"
            }
        },
        "required": ["fromCoordinate", "toCoordinate", "relationshipType"],
        "additionalProperties": False
    }
)
```

### Handler Method

**Method**: `_handle_create_bimba_relationship()`

**String Parsing Logic**:
```python
# Parse "key:value" strings into GraphQL format
property_list = []
for prop_str in arguments.get("properties", []):
    if ":" in prop_str:
        key, value = prop_str.split(":", 1)
        property_list.append({"key": key.strip(), "value": value.strip()})
```

**Response Format**:
```
Created relationship: #1 -[CONTAINS]-> #1-2
Properties: hierarchyLevel=1, parentChild=true

(or)

Updated relationship: #1 -[CONTAINS]-> #1-2
Properties: hierarchyLevel=2
```

---

## Validation Rules

### Relationship Type Validation
- **Pattern**: `^[A-Z_][A-Z0-9_]*$`
- **Valid**: `CONTAINS`, `RESONATES_WITH`, `TRANSFORMS_INTO`
- **Invalid**: `contains`, `Resonates-With`, `123_START`

### Property Key Validation
- **Pattern**: camelCase (starts lowercase, no spaces/special chars)
- **Valid**: `harmonicFrequency`, `modalityBridge`, `sequenceOrder`
- **Invalid**: `HarmonicFrequency`, `modality-bridge`, `sequence order`

### Property Value Constraints
- Must be primitive string (no nested objects)
- Neo4j will store as-is
- Type interpretation left to consumers

---

## Testing Strategy

### Test Cases

#### 1. Basic Relationship Creation (MCP Format)
```json
{
  "fromCoordinate": "#1",
  "toCoordinate": "#1-2",
  "relationshipType": "CONTAINS",
  "properties": ["hierarchyLevel:1"]
}
```

#### 2. Idempotent Update (MCP Format)
```json
// First call - creates relationship
{
  "fromCoordinate": "#1",
  "toCoordinate": "#1-2",
  "relationshipType": "CONTAINS",
  "properties": ["version:1"]
}

// Second call - updates relationship
{
  "fromCoordinate": "#1",
  "toCoordinate": "#1-2",
  "relationshipType": "CONTAINS",
  "properties": ["version:2"]
}
// wasUpdate: true
```

#### 3. Bidirectional Relationship (MCP Format)
```json
{
  "fromCoordinate": "#1-2",
  "toCoordinate": "#2-3",
  "relationshipType": "RESONATES_WITH",
  "properties": [
    "resonancePattern:3-fold harmonic",
    "harmonicFrequency:432"
  ],
  "bidirectional": true
}
```

#### 4. Error Cases
- Non-existent fromCoordinate → `COORDINATE_NOT_FOUND`
- Non-existent toCoordinate → `COORDINATE_NOT_FOUND`
- Invalid type `contains` → `INVALID_RELATIONSHIP_TYPE`
- Non-admin user → `UNAUTHORIZED_ADMIN`

---

## Example Relationship Patterns

### Hierarchical (MCP String Format)
```json
{
  "relationshipType": "CONTAINS",
  "properties": [
    "hierarchyLevel:1",
    "parentChild:true",
    "containmentType:structural"
  ]
}
```

### Resonance (QL-Specific, MCP String Format)
```json
{
  "relationshipType": "RESONATES_WITH",
  "properties": [
    "resonancePattern:3-fold harmonic",
    "harmonicFrequency:432",
    "modalityBridge:Spanda-Paramarsa",
    "subsystemLink:1-to-2"
  ]
}
```

### Temporal (MCP String Format)
```json
{
  "relationshipType": "TEMPORAL_SEQUENCE",
  "properties": [
    "sequenceOrder:1",
    "temporalContext:Nara developmental phase",
    "phaseTransition:dialogical-synthesis"
  ]
}
```

### Semantic/Transformational (MCP String Format)
```json
{
  "relationshipType": "TRANSFORMS_INTO",
  "properties": [
    "transformationType:vibrational-to-symbolic",
    "alchemicalStage:nigredo-albedo",
    "confidence:0.85",
    "derivationPath:#2,#2-3,#3"
  ]
}
```

---

## Files to Modify

### Backend
1. `backend/epi_logos_system/cag/bimba/schema.graphql`
2. `backend/epi_logos_system/cag/bimba/services.py`
3. `backend/epi_logos_system/cag/bimba/resolvers.py`

### Agentic
4. `agentic/clients/bimba_graphql_client.py`
5. `agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py`
6. `agentic/agents/orchestrator/orchestrator_agent.py`

### MCP
7. `agentic/mcp_servers/bimba_pratibimba_server.py`

---

## Success Criteria

✅ Relationship created between existing nodes
✅ MERGE pattern enables idempotent updates
✅ wasUpdate flag correctly indicates create vs update
✅ Bidirectional relationships created atomically
✅ Open property schema supports any relationship type
✅ Admin authorization enforced at all layers
✅ Coordinate pre-validation prevents node creation
✅ Orchestrator tool with proper Pydantic AI decoration
✅ MCP tool with comprehensive schema
✅ Structured error responses for all failure modes

---

## Implementation Time Estimate

**Total**: ~70 minutes

1. GraphQL Schema: 5 min
2. Repository Method: 15 min
3. Service Method: 10 min
4. Resolver: 10 min
5. GraphQL Client: 5 min
6. HTTP Client: 5 min
7. Orchestrator Tool: 10 min
8. MCP Tool: 10 min

---

**Implementation Date**: 2025-10-02 (Initial) | 2025-10-02 (Revised for MCP compatibility)
**Feature Status**: Ready for FULL re-implementation (previous version removed due to MCP schema errors)
**Architecture Compliance**: Verified against CLAUDE.md patterns
**MCP Compatibility**: ✅ Corrected - uses simple string array instead of nested objects
