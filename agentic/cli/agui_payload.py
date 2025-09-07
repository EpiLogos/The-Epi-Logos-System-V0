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

from typing import Any, Dict, Mapping, MutableMapping, Sequence
from uuid import uuid4

from ag_ui.core import RunAgentInput, UserMessage, Context


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
) -> RunAgentInput:
    """Build a validated RunAgentInput instance for AG-UI streaming.

    Raises ValueError with actionable messages if required fields are missing.
    """
    if not thread_id:
        raise ValueError("thread_id required")
    if forwarded_props is None:
        raise ValueError("forwarded_props missing: provide a mapping (e.g., {'thread_id': ...})")

    # Messages
    msg = UserMessage(id=str(uuid4()), content=str(user_text))

    # Context list
    context_entries: list[Context] = [
        Context(description="persona", value=str(persona or "system")),
    ]
    if system_override:
        context_entries.append(build_context_system(system_override))

    # Tools and forwarded props defaults
    tools_list = list(tools or [])
    fwd: Dict[str, Any] = dict(forwarded_props)
    if "thread_id" not in fwd:
        fwd["thread_id"] = thread_id

    # State default
    st = dict(state or {})

    # Construct and return a validated model
    return RunAgentInput(
        thread_id=thread_id,
        run_id=str(uuid4()),
        messages=[msg],
        context=context_entries,
        state=st,
        tools=tools_list,
        forwarded_props=fwd,  # ✅ Fixed: snake_case not camelCase
    )

