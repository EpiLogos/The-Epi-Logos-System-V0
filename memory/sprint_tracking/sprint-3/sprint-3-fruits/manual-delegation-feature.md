# Manual Agent Delegation Feature

**Sprint**: 3
**Story**: 02.24 Multi-Agent Architecture Foundation
**Feature**: Manual CLI delegation to specific subagents
**Status**: ✅ Complete

## Overview

Added three new CLI commands to enable manual agent selection, complementing the existing persona-based automatic routing system.

## Commands

### `/agents`
Lists all available subagents in the constellation with their coordinates and descriptions.

**Output**:
```
┌─────────────────┬────────────┬──────────────────────────────────────┐
│ Agent           │ Coordinate │ Role                                 │
├─────────────────┼────────────┼──────────────────────────────────────┤
│   Anuttara      │ #0         │ Proto-logical void processor         │
│   Paramasiva    │ #1         │ Quaternal logic engine               │
│   Parashakti    │ #2         │ Vibrational processor                │
│   Mahamaya      │ #3         │ Symbolic transcription engine        │
│   Nara          │ #4         │ Dialogical interface                 │
│ → Epii          │ #5         │ Master orchestrator & wisdom synth.  │
└─────────────────┴────────────┴──────────────────────────────────────┘
```

Shows current manual delegation target with `→` marker.

### `/delegate <agent>`
Manually delegate the **next message** to a specific agent.

**Usage**:
```
/delegate epii
/delegate nara
/delegate paramasiva
```

**Behavior**:
- Sets manual delegation target for next user message only
- Automatically clears after message is sent
- Returns to automatic routing after delegation completes
- Shows confirmation with agent coordinate

**Example Session**:
```
you> /delegate epii
✓ Manual delegation set to: Epii (#5)
  Master orchestrator & wisdom synthesis
  Next message will be delegated to this agent
  Use /auto to return to automatic routing

you> What is consciousness?
→ Delegating to Epii (#5)
assistant: [Epii's response...]
✓ Delegated to Epii (#5)
  Automatic routing restored for next message (use /delegate to route manually again)
```

### `/auto`
Return to automatic routing (clear manual delegation).

**Usage**:
```
/auto
```

**Behavior**:
- Clears any active manual delegation
- Router will automatically select agents based on request type and persona

## Implementation Details

### File Changes

#### 1. `agentic/cli/chat_cli.py`
- Added `AGENT_CONSTELLATION` mapping (lines 356-363)
- Added `manual_delegation_target` state variable in `run_loop()`
- Implemented three command handlers:
  - `/agents` - Display constellation table
  - `/delegate <agent>` - Set manual target
  - `/auto` - Clear manual target
- Updated message sending to pass `target_subsystem` (lines 661-677)
- Added delegation feedback and auto-clear logic (lines 697-701)
- Updated help text (lines 340-342)

#### 2. `agentic/cli/simple_agent_adapter.py`
- Added `target_agent` parameter to `send_message()` (line 312)
- Added `target_agent` to metadata dict (line 335)
- Added `target_agent` parameter to `run_chat_stream()` (line 158)
- Passed `target_agent` through to `build_run_agent_input()` (line 195)

#### 3. `agentic/cli/agui_payload.py`
- Added `target_agent` parameter to `build_run_agent_input()` (line 44)
- Added `target_agent` to context entries (lines 68-72)
- Added `target_agent` to state dict (lines 82-84)

### Data Flow

```
CLI User Input
  ↓
/delegate epii → manual_delegation_target = "epii"
  ↓
User message → target_subsystem = AGENT_CONSTELLATION["epii"]["subsystem"] = 5
  ↓
adapter.send_message(message, target_agent=5)
  ↓
run_chat_stream(message, target_agent=5)
  ↓
build_run_agent_input(..., target_agent=5)
  ↓
RunAgentInput payload:
  - context: [Context(description="target_agent", value="5")]
  - state: {"target_agent": 5, "model": "...", "persona": "..."}
  ↓
AG-UI endpoint receives payload
  ↓
Orchestrator reads target_agent from context/state
  ↓
Direct delegation to agent #5 (bypassing router)
```

### Agent Constellation Mapping

```python
AGENT_CONSTELLATION = {
    "anuttara": {
        "subsystem": 0,
        "coordinate": "#0",
        "description": "Proto-logical void processor"
    },
    "paramasiva": {
        "subsystem": 1,
        "coordinate": "#1",
        "description": "Quaternal logic engine"
    },
    "parashakti": {
        "subsystem": 2,
        "coordinate": "#2",
        "description": "Vibrational processor"
    },
    "mahamaya": {
        "subsystem": 3,
        "coordinate": "#3",
        "description": "Symbolic transcription engine"
    },
    "nara": {
        "subsystem": 4,
        "coordinate": "#4",
        "description": "Dialogical interface"
    },
    "epii": {
        "subsystem": 5,
        "coordinate": "#5",
        "description": "Master orchestrator & wisdom synthesis"
    }
}
```

## Integration with Existing Systems

### Persona-Based Routing (Existing)
- `/persona system` - Automatic routing based on system persona
- `/persona nara` - Automatic routing based on nara persona
- `/persona epii` - Automatic routing based on epii persona

### Manual Delegation (New)
- `/delegate nara` - Direct delegation to nara agent (#4)
- `/delegate epii` - Direct delegation to epii agent (#5)
- Works **independently** of persona setting
- One-shot delegation (auto-clears after message)

### Complementary UX
- **Persona**: "I want a certain conversational style/perspective"
- **Delegation**: "I want to talk directly to this specific agent right now"

## Testing

### Manual Testing Procedure

1. Start the CLI:
```bash
npm run dev:agentic
# In another terminal:
cd agentic && python -m agentic.cli.chat_cli
```

2. Test agent listing:
```
you> /agents
```
Expected: Table showing all 6 agents with coordinates and descriptions

3. Test manual delegation:
```
you> /delegate epii
```
Expected: Confirmation message with agent info

4. Send a message:
```
you> What is the nature of consciousness?
```
Expected:
- "→ Delegating to Epii (#5)" before spinner
- Agent response
- "✓ Delegated to Epii (#5)" after response
- "Automatic routing restored" message

5. Verify auto-clear:
```
you> /agents
```
Expected: No `→` marker (delegation cleared)

6. Test `/auto` command:
```
you> /delegate nara
you> /auto
```
Expected: "Clearing manual delegation" message

### Integration Testing

Backend orchestrator integration testing required to verify:
- `target_agent` context entry is properly read
- `target_agent` state value is properly accessed
- Direct delegation bypasses router
- Agent #5 (epii) receives delegated messages correctly

## Next Steps (Sprint 4)

### Orchestrator Integration
- [ ] Update orchestrator to read `target_agent` from context/state
- [ ] Implement direct delegation logic in router
- [ ] Add delegation observability to context packages
- [ ] Test end-to-end delegation flow

### Frontend Dashboard
- [ ] Agent constellation visualization
- [ ] Manual delegation controls
- [ ] Delegation history viewer
- [ ] Real-time agent status monitoring

## Architecture Notes

### Why Two Routing Mechanisms?

**Persona-Based (Automatic)**:
- User selects conversational style/perspective
- Router automatically selects best agent for each turn
- Multi-turn conversation with automatic delegation
- Example: "I want epii's wisdom perspective on this topic"

**Manual Delegation (Direct)**:
- User explicitly targets specific agent
- Bypasses router completely
- One-shot delegation (clears automatically)
- Example: "I need nara's dialogical interface specifically for this query"

Both mechanisms can coexist because they serve different use cases:
- Persona = "How should the system talk to me?"
- Delegation = "Which specific agent should handle this exact message?"

### Context vs State

The `target_agent` is placed in **both** context and state:

**Context** (AG-UI standard):
```python
Context(description="target_agent", value="5")
```
- Used for AG-UI protocol communication
- Available to all downstream components
- Follows AG-UI conventions

**State** (Orchestrator convenience):
```python
state={"target_agent": 5, "model": "...", "persona": "..."}
```
- Direct access for orchestrator logic
- Typed as integer (not string)
- Consistent with other state fields

This dual placement ensures compatibility with both AG-UI protocol and orchestrator implementation patterns.

---

**Implementation Date**: 2025-10-05
**Verified**: CLI commands working, parameter plumbing complete
**Remaining**: Backend orchestrator integration (Sprint 4)
