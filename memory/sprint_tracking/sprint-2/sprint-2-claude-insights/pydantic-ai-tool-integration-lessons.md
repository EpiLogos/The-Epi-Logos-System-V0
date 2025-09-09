# Pydantic AI Tool Integration: Critical Lessons Learned

**Date:** 2025-01-08  
**Context:** Sprint 2 - Memory System Integration  
**Issue:** `Error: name 'tool' is not defined`

## The Problem

During memory system integration, we encountered a critical error when trying to use `@tool` decorators in our memory tools:

```
Error: name 'tool' is not defined
```

This led to confusion about the correct way to integrate tools with Pydantic AI agents.

## Root Cause Analysis

### What We Initially Tried (WRONG)

```python
# ❌ INCORRECT APPROACH
from pydantic_ai.tools import tool  # This import doesn't exist!

@tool  # This decorator doesn't work this way
async def get_conversation_history(agent_context: Dict[str, Any]) -> str:
    """Get conversation history"""
    return "history"
```

### The Actual Error

The error occurred because:
1. **No such import exists**: `from pydantic_ai.tools import tool` is invalid
2. **Wrong decorator usage**: `@tool` is not how you register tools with Pydantic AI
3. **Misunderstanding of tool registration**: We thought tools needed explicit decorators

## The Correct Solution

### Method 1: Automatic Function Introspection (RECOMMENDED)

```python
# ✅ CORRECT APPROACH - Plain Functions
import logging
from typing import Dict, Any, List, Optional

# NO IMPORTS OF 'tool' NEEDED!

async def get_conversation_history(
    agent_context: Dict[str, Any],
    limit: int = 10
) -> str:
    """Get recent conversation history for context."""
    # Implementation here
    return "formatted history"

async def get_agent_state(agent_context: Dict[str, Any]) -> str:
    """Get current agent state."""
    # Implementation here
    return "agent state"

# Export as list for agent registration
MEMORY_TOOLS = [
    get_conversation_history,
    get_agent_state,
    # ... other functions
]
```

### Method 2: Agent Decorator Pattern (ALTERNATIVE)

```python
# ✅ ALTERNATIVE - Using Agent Instance Decorators
from pydantic_ai import Agent

agent = Agent(model="openai:gpt-4o")

@agent.tool  # This works - decorator on agent instance
async def get_conversation_history(ctx: RunContext, limit: int = 10) -> str:
    """Get conversation history"""
    return "history"

@agent.tool_plain  # For tools that don't need RunContext
def simple_tool() -> str:
    """Simple tool without context"""
    return "result"
```

### Method 3: Explicit Tool Objects (ADVANCED)

```python
# ✅ ADVANCED - Explicit Tool Configuration
from pydantic_ai import Agent, Tool

def my_function(param: str) -> str:
    return f"Result: {param}"

agent = Agent(
    model="openai:gpt-4o",
    tools=[
        Tool(my_function, takes_ctx=False),
        # More explicit control over tool behavior
    ]
)
```

## How Pydantic AI Tool Registration Actually Works

### Automatic Introspection Magic

When you pass functions to `Agent(tools=[...])`, Pydantic AI automatically:

1. **Inspects function signatures** to determine parameters and types
2. **Extracts docstrings** to create tool descriptions
3. **Determines RunContext usage** based on parameter types
4. **Creates JSON schemas** for the LLM to understand tool parameters
5. **Registers tools** with the agent's available toolset

### Example of What Happens Behind the Scenes

```python
# Your simple function:
async def search_memory(query: str, limit: int = 5) -> str:
    """Search conversation history for specific terms."""
    return f"Found results for: {query}"

# Pydantic AI automatically creates this tool schema:
{
    "name": "search_memory",
    "description": "Search conversation history for specific terms.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "limit": {"type": "integer", "default": 5}
        },
        "required": ["query"]
    }
}
```

## Integration Pattern in Our Orchestrator

### Our Working Implementation

```python
# agentic/orchestrator/core.py
def _initialize_agent(self) -> Agent:
    from .memory_tools import MEMORY_TOOLS
    from .lightrag_tools import LIGHTRAG_TOOLS
    from .bimba_tools import BIMBA_TOOLS
    
    # Combine all tool functions
    all_direct_tools = LIGHTRAG_TOOLS + BIMBA_TOOLS + MEMORY_TOOLS
    
    # Agent automatically converts functions to tools
    agent = Agent(
        model=agent_model,
        system_prompt=self._build_orchestrator_system_prompt(),
        tools=all_direct_tools  # ✅ Just pass the functions!
    )
    
    return agent
```

## Key Insights and Best Practices

### ✅ DO

1. **Use plain async functions** with proper type hints
2. **Write descriptive docstrings** - they become tool descriptions
3. **Use meaningful parameter names** - they appear in the tool schema
4. **Export functions in lists** for easy import (`MEMORY_TOOLS = [...]`)
5. **Let Pydantic AI handle introspection** - it's very good at it

### ❌ DON'T

1. **Don't try to import `tool` from pydantic_ai.tools** - it doesn't exist
2. **Don't use `@tool` decorators** on standalone functions
3. **Don't overthink tool registration** - simple functions work great
4. **Don't mix decorator and function list approaches** - pick one pattern

### 🔍 DEBUGGING TIPS

1. **Check imports carefully** - `tool` import errors are common
2. **Verify function signatures** - Pydantic AI needs clean type hints
3. **Test tool lists** - ensure all functions are properly exported
4. **Use descriptive docstrings** - they help both LLM and debugging

## Documentation References

From [Pydantic AI Tools Documentation](https://ai.pydantic.dev/tools/):

> **The simplest way to register tools via the Agent constructor is to pass a list of functions, the function signature is inspected to determine if the tool takes RunContext.**

This confirms our approach is correct and recommended.

## Memory System Success

After fixing the tool registration, our memory system now works perfectly:

- ✅ **Session persistence** via Redis
- ✅ **Conversation history** via MongoDB  
- ✅ **Agent memory tools** for self-awareness
- ✅ **Automatic tool conversion** by Pydantic AI
- ✅ **Clean, maintainable code** without decorator complexity

## Lesson Summary

**The Big Lesson:** Pydantic AI is designed for simplicity. Plain functions with good type hints and docstrings are all you need. The framework handles the complex tool registration automatically through introspection.

**Key Takeaway:** When in doubt, start simple. Pydantic AI's automatic function introspection is powerful and reliable - trust it to work correctly.

**Anti-Pattern to Avoid:** Don't try to over-engineer tool registration with decorators and complex imports. The simple approach is the correct approach.
