"""
AG-UI Payload Builder

Contract (derived from ag_ui.core models in codebase):
- RunAgentInput fields: thread_id:str, run_id:str, messages:list[UserMessage],
  context:list[Context], state:dict, tools:list (required), forwarded_props:dict (required).
- Context fields: description:str, value:str.
- messages contain at least id:str and content:str (role optional in current usage).
- tools may be an empty list []; forwarded_props must be an object (not None).
- All containers are plain lists/dicts (no tuples), and all strings are real str types.

This module centralizes construction and validation of AG-UI payloads to avoid
schema drift and validation errors.
"""

from __future__ import annotations

from typing import Any, Dict, List, Mapping, MutableMapping, Sequence, cast
from uuid import uuid4

from ag_ui.core import RunAgentInput, UserMessage, AssistantMessage, Context, Message


def build_context_system(text: str) -> Context:
    """Build a minimal system context entry.

    Args:
        text: Context value string
    Returns:
        Context model instance
    """
    return Context(description="system", value=str(text))


def build_run_agent_input(
    *,
    thread_id: str,
    user_text: str,
    persona: str,
    system_override: str | None,
    tools: Sequence[Mapping[str, Any]] | None,
    state: Mapping[str, Any] | None,
    forwarded_props: Mapping[str, Any] | None,
    target_agent: int | None = None,
    previous_messages: Sequence[Mapping[str, str]] | None = None,
) -> RunAgentInput:
    """Build a validated RunAgentInput instance for AG-UI streaming.

    Args:
        target_agent: Optional subsystem number (0-5) for manual delegation
        previous_messages: Optional list of previous messages with 'role' and 'content' keys

    Raises ValueError with actionable messages if required fields are missing.
    """
    if not thread_id:
        raise ValueError("thread_id required")
    if forwarded_props is None:
        raise ValueError("forwarded_props missing: provide a mapping (e.g., {'thread_id': ...})")

    # Build messages list: previous messages + current message
    messages_list: List[UserMessage | AssistantMessage] = []

    # Add previous messages from conversation history
    if previous_messages:
        for prev_msg in previous_messages:
            role = prev_msg.get("role", "user")
            content = str(prev_msg.get("content", ""))

            # Convert backend message format to AG-UI message types
            if role == "assistant":
                messages_list.append(AssistantMessage(id=str(uuid4()), content=content))
            else:  # Default to user message
                messages_list.append(UserMessage(id=str(uuid4()), content=content))

    # Add current user message
    msg = UserMessage(id=str(uuid4()), content=str(user_text))
    messages_list.append(msg)

    # Context list
    context_entries: list[Context] = [
        Context(description="persona", value=str(persona or "system")),
    ]
    if system_override:
        context_entries.append(build_context_system(system_override))

    # Add target_agent to context if manual delegation requested
    if target_agent is not None:
        context_entries.append(
            Context(description="target_agent", value=str(target_agent))
        )

    # Tools and forwarded props defaults
    tools_list = list(tools or [])
    fwd: Dict[str, Any] = dict(forwarded_props)
    if "thread_id" not in fwd:
        fwd["thread_id"] = thread_id

    # State default
    st = dict(state or {})
    # Add target_agent to state for orchestrator to use
    if target_agent is not None:
        st["target_agent"] = target_agent

    # Construct and return a validated model
    return RunAgentInput(
        thread_id=thread_id,
        run_id=str(uuid4()),
        messages=cast(List[Message], messages_list),  # Full conversation history
        context=context_entries,
        state=st,
        tools=tools_list,
        forwarded_props=fwd,  # ✅ Fixed: snake_case not camelCase
    )

