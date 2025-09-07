# Agentic Chat CLI

Simple terminal chat for the Unified Orchestrator. The orchestrator is the single source of truth for models and providers; the CLI only discovers and uses what the orchestrator advertises.

## Quick Start

- Copy `agentic/.env.example` to `.env` and fill any API keys you have.
- Optionally copy `agentic/config.example.yaml` to `agentic/config.yaml` to set defaults.
- Ensure Python deps per `agentic/requirements.txt` are installed (typer, rich, pydantic-ai are included).

### Commands

- List help: `python -m agentic.cli --help`
- List models (from orchestrator): `python -m agentic.cli --models`
- Start chat: `python -m agentic.cli chat`

In-REPL commands:

- `/help` — list commands
- `/models` — list available models; current marked
- `/use <provider:model>` — switch model live (validated by orchestrator)
- `/personas` — list orchestrator personas; current marked
- `/persona <key>` — switch persona (orchestrator)
- `/sys [text]` — view or set the system prompt override
- `/save [path]` — save transcript to JSONL
- `/load <path>` — load a JSONL transcript into context
- `/config` — show current effective config
- `/clear` — clear context (new orchestrator session on next message)
- `/exit` — quit

## Personas

Personas are provided by the orchestrator. The CLI does not mutate persona definitions or inject persona files. Use `/sys` to apply per-session instruction overrides.

## Models

Models use the `provider:model` style. The orchestrator advertises allowed and ready models based on `agentic/config.yaml` and provider readiness; the CLI shows only those and refuses others.

## Transcripts

- JSONL lines: `{ "ts": "ISO-8601", "role": "user|assistant|system", "content": "...", "model": "..." }`
- Save with `/save` and load with `/load`.

## Errors & Edge Cases

- Unknown model: clear error; not selected.
- Streaming: uses orchestrator AG-UI streaming if available, else emulated streaming.
- Network/service issues: friendly errors; CLI remains alive.

## Diagnostics

Flags: `--debug`, `--trace`, `--dump-payloads`, `--stats`, `--trace-id <uuid>`

- `--debug`: verbose logs
- `--trace`: per-turn timing and JSONL logs
- `--dump-payloads`: log AG-UI payload shapes (keys/lengths, redacted)
- `--stats`: print per-turn summary (model, persona, tokens, first_token_ms, total_ms)
- `--trace-id`: override trace id; otherwise generated per turn

Env:
- `AGENTIC_DEBUG=1`, `AGENTIC_TRACE=1`, `AGENTIC_LOG_FORMAT=json`

Instrumentation:
- CLI records `first_token_ms`, `total_ms`, `sse_events`, `sse_bytes`.
- Orchestrator `get_session_status` exposes `model_name`, `active_persona`, and `system_hash`.

## AG-UI Payload Contract

The CLI builds AG-UI payloads via `agentic/cli/agui_payload.py` and streams with
`UnifiedOrchestrator.process_ag_ui_input_stream`.

Minimal JSON shape (fields required by the AG-UI model):

{
  "thread_id": "str",
  "run_id": "str",
  "messages": [ { "id": "str", "content": "str" } ],
  "context": [ { "description": "str", "value": "str" } ],
  "state": {},
  "tools": [],
  "forwardedProps": { "thread_id": "str", "model": "str|null" }
}

Notes:
- `tools` may be an empty list.
- `forwardedProps` must be an object.
- `context` is a list; entries are not tuples.
