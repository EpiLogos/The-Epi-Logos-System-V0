# Agentic Chat CLI

Simple terminal chat for the Unified Orchestrator with model and persona switching.

## Quick Start

- Copy `agentic/.env.example` to `.env` and fill any API keys you have.
- Optionally copy `agentic/config.example.yaml` to `agentic/config.yaml` to set defaults.
- Ensure Python deps per `agentic/requirements.txt` are installed (typer, rich, pydantic-ai are included).

### Commands

- List help: `python -m agentic.cli --help`
- List models: `python -m agentic.cli --models`
- Start chat: `python -m agentic.cli chat --persona default --model openai:gpt-4o`

In-REPL commands:

- `/help` — list commands
- `/models` — list available models; current marked
- `/use <provider:model>` — switch model live
- `/personas` — list available personas; current marked
- `/persona <key-or-path>` — switch persona (file personas apply as system-prompt injection)
- `/sys [text]` — view or set the system prompt override
- `/save [path]` — save transcript to JSONL
- `/load <path>` — load a JSONL transcript into context
- `/config` — show current effective config
- `/clear` — clear context (new orchestrator session on next message)
- `/exit` — quit

## Personas

Place YAML files in `agentic/personas/` with fields:

key: mypersona
name: My Persona
description: Something descriptive
system_prompt: |
  Your system prompt...

These are applied as a system-prompt injection layered before any ad-hoc `/sys` text. If the key matches an orchestrator persona (e.g., `nara`, `epii`, `system`), the orchestrator will switch to that persona; otherwise the CLI keeps `system` inside the orchestrator and injects the YAML prompt.

## Models

Models use the `provider:model` style used by `pydantic-ai`.
You can add custom entries via `AGENTIC_EXTRA_MODELS` in `.env` (comma-separated).

## Transcripts

- JSONL lines: `{ "ts": "ISO-8601", "role": "user|assistant|system", "content": "...", "model": "..." }`
- Save with `/save` and load with `/load`.

## Errors & Edge Cases

- Missing services (Redis/Mongo): the CLI will still run; errors are handled and presented with hints.
- Streaming: the orchestrator does not stream; the CLI emulates streaming by chunking the final response.
- Network issues: errors show a friendly message with a retry hint; the app stays alive.

