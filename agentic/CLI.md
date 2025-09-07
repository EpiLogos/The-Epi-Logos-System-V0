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
- Diagnostics: `python -m agentic.cli doctor`

In-REPL commands:

- `/help` — list commands
- `/models` — list available models; current marked
- `/use <provider:model>` — switch model live (validated by orchestrator)
- `/personas` — list orchestrator personas; current marked
- `/persona <key>` — switch persona (orchestrator)
- `/sys [text]` — view or set the system prompt override
- `/status` — show session + last-turn stats (model/persona/hash/timings)
- `/stream [on|off]` — toggle streaming mode during the REPL
- `/timeout <sec>` — set per-event streaming timeout (default 10s)
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

Doctor checks (what to expect):
- Capabilities: prints default and number of models. Fails if none configured.
- Personas: prints list of available personas.
- Streaming: strict ping using AG‑UI; PASS if tokens arrive (first_token_ms > 0, len > 0), else FAIL with error.
- Model switch: tries an alternate allowed+ready model and verifies the orchestrator’s `model_name`.
- Persona switch: switches to another persona and verifies orchestrator’s `active_persona`.

Strict streaming and timeouts:
- Use `--no-fallback` to fail fast if no events arrive.
- Use `--stream-timeout` or `/timeout` to tune per-event timeout.

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

## Test Phase Notes (Honest Status)

This CLI is now the primary testing harness, but we are in a test/stabilization phase. A few items to be aware of:

- Orchestrator routing choice (pydantic_ai vs. `llm_services.py`) is under review. The CLI is agnostic and tests through orchestrator APIs, but routing unification may change behavior and timing. Treat routing as “unverified/subject to change”.
- AG‑UI streaming depends on local environment and provider SDK behavior. In strict mode, a provider that doesn’t emit early tokens can cause a timeout. Use `/timeout` to tune.
- Redis/Mongo connectivity affects session persistence and conversation logging; if unavailable, you can still test streaming and persona/mode switches, but some features (history/metrics) won’t be visible.
- Persona “echo probes” are behavior checks only. The authoritative source is `get_session_status` (model_name, active_persona, system_hash).
- Persona‑model mapping management is not implemented in the CLI (no UI for assigning models per persona). If you see placeholders for this in code, treat them as stubs (no‑ops) in this phase.

If a doctor check fails, prefer the orchestrator’s reported truth (`/status` and `get_session_status`) as the source of debugging. The CLI will show actionable errors (e.g., no allowed models configured).

## Operator Playbook (Copy/Paste)

Goal: use the CLI as a confidence tool to verify orchestrator capabilities end‑to‑end during the test phase.

1) Start the dev server with diagnostics

```
AGENTIC_DEBUG=1 AGENTIC_TRACE=1 uvicorn agentic.main:app --reload
```

2) Run CLI doctor (strict streaming)

```
python -m agentic.cli doctor
```

Expected: one‑liners for Capabilities, Personas, Streaming (PASS/WARN/FAIL), Model switch (PASS/FAIL), Persona switch (PASS/FAIL). If Capabilities shows 0 models, configure `agentic/config.yaml` or `AGENTIC_MODELS`.

3) Quick REPL shakeout with trace/stats

```
python -m agentic.cli chat --trace --stats
```

Inside REPL (examples):

- `/models` — show orchestrator models
- `/use gemini:gemini-2.5-flash` — switch model; then `/status` (model_name should match)
- `/personas` — list personas
- `/persona epii` — switch persona; then `/status` (active_persona should match)
- `/sys You are terse.` — set session override; then `/status` (system_hash changes)
- `/stream off` then ask a question — uses non‑streaming; turn stats still printed
- `/stream on` `/timeout 15` — resume streaming with longer per‑event timeout
- Ask: “Latency check.” — spinner shows `first→total ms`; `/status` shows sse_events/bytes

4) Troubleshooting quick checks

- “Invalid or not‑ready model” → Ensure it’s listed in `/models` and provider keys are set.
- “No allowed models configured” → Create `agentic/config.yaml` with models.allowed/default or set `AGENTIC_MODELS`.
- Streaming FAIL in strict mode → Increase `/timeout`, verify AG‑UI deps, or test with non‑streaming (`/stream off`).
- Persona appears unchanged → Use `/status` to verify `active_persona`; behavior probes are non‑authoritative.
