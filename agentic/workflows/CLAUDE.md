# Workflow Development Guidelines - ACT Protocol Alignment

This file provides mandatory guidelines for developing persona workflows aligned with the **Agentic Context & Task (ACT) Protocol**. Follow these principles to ensure our workflows support the foundational system agent architecture rather than forcing rigid tool-to-persona mappings.

## ACT Protocol Core Principles

### 1. Modular & Addressable Resources
**DO:** Create workflows as distinct, addressable components that can be discovered and composed dynamically.
**DON'T:** Hard-code specific tool dependencies or force workflows to own particular tools.

```python
# ✅ CORRECT: Workflow declares capabilities, not specific tools
@property
def workflow_capabilities(self) -> List[str]:
    return ["document_synthesis", "coordinate_resolution", "memory_creation"]

# ❌ WRONG: Workflow owns specific tools
def __init__(self, tool_registry=None):
    self._lightrag_tool = tool_registry.get("lightrag")  # BAD
```

### 2. Lazy-Loaded Context Packages
**Principle:** Workflows receive curated Context Packages assembled by the orchestrator, containing only what's needed for the specific task.

**Implementation Pattern:**
```python
async def execute(self, context: WorkflowExecutionContext) -> WorkflowExecutionResult:
    # Context package contains everything needed - no external tool fetching
    if context.context_package:
        # Use ACT virtual files from context package
        task_files = context.context_package.get_files_by_type(".md")
        data_files = context.context_package.get_files_by_type(".json")
```

### 3. Persona Definitions Drive Tool Usage
**DO:** Let persona characteristics naturally determine tool selection via ACT context.
**DON'T:** Create explicit workflow → tool mappings.

```python
# ✅ CORRECT: Persona context drives behavior organically
async def _execute_workflow_logic(self, context: WorkflowExecutionContext) -> Dict[str, Any]:
    # Nara persona naturally gravitates toward document search via context
    if self.persona_type == PersonaType.NARA:
        # Context package includes document search capabilities when needed
        return await self._process_oracle_inquiry(context)

# ❌ WRONG: Explicit tool coupling
async def execute(self, context: WorkflowExecutionContext):
    # Nara always uses LightRAG - too rigid
    result = await self._lightrag_tool.query(context.user_input)
```

## Workflow Architecture Standards

### Clean Slate Orchestration
**Pattern:** Each workflow execution is a fresh instantiation with clean context.

```python
class PersonaWorkflow(ABC):
    """
    Workflows are stateless processors that operate on Context Packages.
    No persistent tool registries or cross-workflow state.
    """
    
    def __init__(self, workflow_id: str, persona_type: PersonaType):
        # ✅ Simple, clean initialization
        self.workflow_id = workflow_id
        self.persona_type = persona_type
        self._initialized = False
        # ❌ NO: tool_registry, persistent connections, etc.
```

### Context Package Integration
**Implementation:** Workflows consume ACT virtual files from context packages:

```python
async def _execute_workflow_logic(self, context: WorkflowExecutionContext) -> Dict[str, Any]:
    """Process using ACT virtual files in context package."""
    
    # Access task instructions
    task_file = context.context_package.get_file("tasks/nara/synthesis.md")
    
    # Access data files
    user_data = context.context_package.get_file("data/user/journal_123.json")
    
    # Access cached coordinate syntheses
    bimba_cache = context.context_package.get_file("cache/bimba/#4-2-3.json")
    
    # Process using available context - no external tool calls needed
    return await self._synthesize_response(task_file, user_data, bimba_cache)
```

### State Persistence via ACT Files
**Pattern:** Workflow progress tracked in dedicated `.yaml` state files within context packages.

```python
async def _save_checkpoint(self, context: WorkflowExecutionContext) -> None:
    """Save workflow checkpoint as ACT virtual file."""
    state_file = f"state/{self.persona_type.value}/task_{context.session_id}.yaml"
    
    checkpoint_data = {
        "status": "in_progress",
        "stage": self._current_stage,
        "progress": self._progress_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # State persisted in context package for orchestrator access
    context.context_package.add_virtual_file(state_file, checkpoint_data)
```

## Tool Integration Strategy

### Global Tool Availability
**Architecture:** All MCP tools available to foundational system agent, not workflow-specific.

```python
# ✅ CORRECT: Tools available globally via system agent
# WorkflowEngine has MCPToolRegistry
# Personas access tools through context when needed

class WorkflowEngine:
    def __init__(self, redis_url: str, config: WorkflowEngineConfig):
        self.tool_registry = MCPToolRegistry()  # Global tool access
        
    async def execute_workflow(self, workflow_id: str, session: OrchestratorSession, context: Dict[str, Any]):
        # Tools available through agent context, not workflow injection
        workflow = self._get_workflow(workflow_id)
        # No tool_registry parameter needed
```

### Natural Tool Selection via Context
**Pattern:** Context packages include tool capabilities when orchestrator determines they're needed.

```python
# Context package might include:
# ==================== START: capabilities/document_search.yaml ====================
# provider: "lightrag"
# endpoint: "http://localhost:8001/mcp"
# available_tools: ["query_documents", "semantic_search"]
# ==================== END: capabilities/document_search.yaml ====================

async def _process_user_query(self, context: WorkflowExecutionContext) -> Dict[str, Any]:
    # Check if document search capability available in context
    if context.context_package.has_capability("document_search"):
        # Use system agent to perform search (tools available globally)
        search_result = await self._system_agent.search_documents(context.user_input)
        return await self._synthesize_with_documents(search_result, context)
    else:
        # Process without document search
        return await self._synthesize_from_memory(context)
```

## Anti-Patterns to Avoid

### ❌ Workflow-Specific Tool Injection
```python
# WRONG - creates rigid coupling
def __init__(self, workflow_id: str, persona_type: PersonaType, tool_registry=None):
    self._tool_registry = tool_registry  # DON'T DO THIS
    
async def call_tool(self, tool_id: str, parameters: Dict[str, Any]):
    return await self._tool_registry.call_tool(tool_id, parameters)  # AVOID
```

### ❌ Hard-Coded Tool Dependencies
```python
# WRONG - forces specific tools
@property
def required_tools(self) -> List[str]:
    return ["lightrag-query-documents", "graphiti-create-memory"]  # TOO RIGID
```

### ❌ Cross-Workflow Communication
```python
# WRONG - violates clean slate principle
async def execute(self, context: WorkflowExecutionContext):
    # Don't ask workflows to talk to each other
    nara_result = await self._nara_workflow.process(context)  # BAD
    return await self._synthesize_with_nara(nara_result)
```

## Correct Implementation Examples

### ✅ Clean Workflow Definition
```python
class NaraWorkflow(PersonaWorkflow):
    """Oracle interface workflow aligned with ACT protocol."""
    
    def __init__(self, workflow_id: str = "nara-oracle-interface", persona_type: PersonaType = PersonaType.NARA):
        super().__init__(workflow_id, persona_type)
    
    @property
    def workflow_capabilities(self) -> List[str]:
        return ["sacred_dialogue", "archetypal_guidance", "symbolic_interpretation"]
    
    async def _execute_workflow_logic(self, context: WorkflowExecutionContext) -> Dict[str, Any]:
        # Process using ACT context package - no tool dependencies
        return await self._facilitate_dialogue(context)
```

### ✅ Context Package Processing
```python
async def _facilitate_dialogue(self, context: WorkflowExecutionContext) -> Dict[str, Any]:
    """Process dialogue using ACT virtual files."""
    
    # Get user archetypal profile from context
    profile_file = context.context_package.get_file("data/user/archetypal_profile.json")
    
    # Get cosmic timing context
    timing_file = context.context_package.get_file("data/cosmic/current_timing.yaml")
    
    # Get any cached coordinate syntheses
    coord_cache = context.context_package.get_files_by_pattern("cache/bimba/#4-*.json")
    
    # Synthesize response using available context
    return {
        "response": await self._generate_oracle_response(profile_file, timing_file, coord_cache),
        "updated_context": await self._update_user_profile(context),
        "next_suggestions": await self._suggest_follow_ups(context)
    }
```

## Integration Testing Strategy

### Test ACT Protocol Compliance
```python
async def test_workflow_act_compliance():
    """Ensure workflow follows ACT protocol patterns."""
    
    # Test clean initialization (no tool dependencies)
    workflow = NaraWorkflow()
    assert not hasattr(workflow, '_tool_registry')
    assert not hasattr(workflow, '_lightrag_tool')
    
    # Test context package processing
    context_package = ContextPackage()
    context_package.add_virtual_file("tasks/nara/synthesis.md", task_content)
    context_package.add_virtual_file("data/user/profile.json", user_data)
    
    context = WorkflowExecutionContext(
        session_id="test",
        user_id="test",
        persona_type=PersonaType.NARA,
        user_input="test query",
        context_package=context_package
    )
    
    # Workflow should process using only context package
    result = await workflow.execute(context)
    assert result.success
    assert result.workflow_id == "nara-oracle-interface"
```

## Migration from Tool-Specific Architecture

If converting from tool-specific workflows:

1. **Remove tool registry parameters** from workflow constructors
2. **Delete workflow-level tool calling methods** (`call_tool`, `call_tool_with_retry`)
3. **Replace tool calls with context package processing**
4. **Update tests to use context packages instead of mock tools**
5. **Ensure workflows are stateless and disposable**

Follow these guidelines to maintain alignment with the ACT protocol and ensure our workflows support the foundational system agent architecture effectively.