from __future__ import annotations

import asyncio
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

import typer
from rich.console import Console
from rich.prompt import Prompt
from rich.table import Table
from rich.panel import Panel
from rich import box
from rich.live import Live
from rich.spinner import Spinner

from .orchestrator_adapter import OrchestratorAdapter
from .diagnostics import DiagnosticsRecorder

app = typer.Typer(add_completion=False, help="Agentic chat CLI for Unified Orchestrator.")
console = Console()



def load_env() -> None:
    """Load `.env` if present without failing if missing."""
    try:
        from dotenv import load_dotenv  # type: ignore

        env_path = Path(".env")
        if env_path.exists():
            load_dotenv(env_path)
    except Exception:
        pass


def load_config() -> Dict[str, Any]:
    # Only local CLI defaults for cosmetic behavior
    return {
        "transcripts_dir": os.getenv("AGENTIC_TRANSCRIPTS_DIR", "transcripts"),
    }


def _truncate_transcript(buf: List[Dict[str, Any]], max_items: int = 400) -> Optional[int]:
    if len(buf) <= max_items:
        return None
    drop = len(buf) - max_items
    del buf[:drop]
    return drop


def open_transcript(path: Optional[str]) -> Path:
    if path:
        p = Path(path)
    else:
        ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%SZ")
        p = Path("transcripts") / f"chat-{ts}.jsonl"
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def write_jsonl(path: Path, records: List[Dict[str, Any]]) -> None:
    with path.open("a", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except Exception:
                continue
    return out


def print_models(models: List[Dict[str, Any]], default: str, current: Optional[str]) -> None:
    t = Table(title="Available Models (from orchestrator)", box=box.SIMPLE_HEAVY)
    t.add_column("Model")
    t.add_column("Provider")
    t.add_column("Ready")
    for m in models:
        name = m.get("name")
        star = "* " if current and name == current else ("• " if name == default else "  ")
        ready = "yes" if m.get("ready") else "no"
        t.add_row(star + name, m.get("provider", ""), ready)
    console.print(t)


def print_config(model: str, persona: str, sys_prompt: str, stream: bool, transcript_path: Path) -> None:
    t = Table(title="Current Config", box=box.SIMPLE_HEAVY)
    t.add_column("Key")
    t.add_column("Value")
    t.add_row("model", model)
    t.add_row("persona", persona)
    t.add_row("sys", (sys_prompt[:80] + "…") if len(sys_prompt) > 80 else sys_prompt or "<none>")
    t.add_row("stream", str(stream))
    t.add_row("transcript", str(transcript_path))
    console.print(t)


@app.callback(invoke_without_command=True)
def main(models: bool = typer.Option(False, "--models", help="List available models and exit")):
    """Agentic CLI entry. Use `chat` to start the REPL."""
    if models:
        load_env()
        adapter = OrchestratorAdapter(
            model=os.getenv("AGENTIC_DEFAULT_MODEL", "openai:gpt-4o"),
            user_id=os.getenv("AGENTIC_USER_ID", "cli-user"),
            persona_key="system",
        )
        caps = asyncio.run(adapter.get_capabilities())
        print_models(caps.get("models", []), caps.get("default_model", ""), current=None)
        raise typer.Exit(0)


@app.command()
def doctor():
    """Run connectivity and streaming diagnostics."""
    load_env()
    console.print("Running diagnostics…")
    diag = DiagnosticsRecorder(debug=True, trace=True, dump_payloads=True, stats=True)
    adapter = OrchestratorAdapter(
        model=os.getenv("AGENTIC_DEFAULT_MODEL", "openai:gpt-4o"),
        user_id=os.getenv("AGENTIC_USER_ID", "cli-user"),
        persona_key="system",
        system_override="",
        diagnostics=diag,
    )

    async def run_checks():
        # Capabilities
        caps = await adapter.get_capabilities()
        console.print(f"Capabilities: default={caps.get('default_model')} models={len(caps.get('models', []))}")
        # Personas
        pers = await adapter.list_orchestrator_personas()
        console.print(f"Personas: {pers}")
        # Streaming check
        stream_iter, meta = await adapter.send_message("diagnostic ping", stream=True)
        text = ""
        async for chunk in stream_iter:
            text += chunk
        console.print(f"Streaming: first_token_ms={meta.get('first_token_ms')} total_ms={meta.get('latency_ms')} mode={meta.get('streaming_mode')} len={len(text)}")

    import asyncio as _a
    _a.run(run_checks())


@app.command()
def chat(
    model: Optional[str] = typer.Option(None, "--model", help="Model to use (provider:model); default from orchestrator"),
    persona: Optional[str] = typer.Option(None, "--persona", help="Persona key (orchestrator personas)"),
    sys: str = typer.Option("", "--sys", help="System prompt override for the session"),
    stream: bool = typer.Option(True, "--stream/--no-stream", help="Enable/disable streaming"),
    transcript: Optional[str] = typer.Option(None, "--transcript", help="Transcript JSONL path"),
    debug: bool = typer.Option(False, "--debug", help="Verbose logs"),
    trace: bool = typer.Option(False, "--trace", help="Per-turn timing logs"),
    dump_payloads: bool = typer.Option(False, "--dump-payloads", help="Log AG-UI payload shapes"),
    stats: bool = typer.Option(False, "--stats", help="Print per-turn summary"),
    trace_id_opt: Optional[str] = typer.Option(None, "--trace-id", help="Override trace id"),
):
    """Start an interactive chat session with the orchestrator."""
    load_env()
    cfg = load_config()

    sys_override = sys or ""
    tpath = open_transcript(transcript)

    diag = DiagnosticsRecorder(debug=debug, trace=trace, dump_payloads=dump_payloads, stats=stats)

    adapter = OrchestratorAdapter(
        model=model or os.getenv("AGENTIC_DEFAULT_MODEL", "openai:gpt-4o"),
        user_id=os.getenv("AGENTIC_USER_ID", "cli-user"),
        persona_key=persona or "system",
        system_override=sys_override,
        diagnostics=diag,
        trace_id_override=trace_id_opt,
    )

    # Keep a local transcript for saving/loading
    transcript_buffer: List[Dict[str, Any]] = []

    console.print(Panel.fit("Agentic Chat. Type /help for commands.", title="Unified Orchestrator", border_style="cyan"))

    async def aiter_to_text(async_iter):
        text_parts: List[str] = []
        async for part in async_iter:
            text_parts.append(part)
        return "".join(text_parts)

    def cmd_help():
        console.print("Commands:")
        console.print("/help — show this help")
        console.print("/models — list models; current marked")
        console.print("/use <model> — switch model live")
        console.print("/personas — list available personas; current")
        console.print("/persona <key-or-path> — switch persona")
        console.print("/sys [text] — view or set system override")
        console.print("/save [path] — save current transcript")
        console.print("/load <path> — load transcript into context")
        console.print("/config — show effective config")
        console.print("/clear — clear conversation context")
        console.print("/exit — quit")

    async def run_loop():
        # Start session and load orchestrator capabilities
        caps = await adapter.get_capabilities()
        current_model = caps.get("default_model")
        current_persona = persona or "system"
        current_sys = sys_override
        console.print(f"[dim]Using model: {current_model} (default: {caps.get('default_model')})[/]")

        while True:
            try:
                user = Prompt.ask("[bold green]you[/]")
            except (EOFError, KeyboardInterrupt):
                console.print("\nExiting.")
                break

            if not user:
                continue

            if user.startswith("/"):
                parts = user.strip().split(maxsplit=1)
                cmd = parts[0].lower()
                arg = parts[1] if len(parts) > 1 else ""

                if cmd == "/help":
                    cmd_help()
                elif cmd == "/models":
                    caps = await adapter.get_capabilities()
                    current = current_model
                    print_models(caps.get("models", []), caps.get("default_model", ""), current=current)
                elif cmd == "/use":
                    if not arg:
                        console.print("Usage: /use provider:model")
                    else:
                        ok = await adapter.update_model_in_session(arg)
                        if ok:
                            current_model = arg
                            console.print(f"Switched model to [bold]{arg}[/bold].")
                        else:
                            console.print("[red]Invalid or not-ready model (not advertised by orchestrator).[/]")
                elif cmd == "/personas":
                    try:
                        allp = await adapter.list_orchestrator_personas()
                    except Exception:
                        allp = []
                    tbl = Table(title="Personas", box=box.SIMPLE_HEAVY)
                    tbl.add_column("Key")
                    for k in allp:
                        star = "* " if k == current_persona else "  "
                        tbl.add_row(star + k)
                    console.print(tbl)
                elif cmd == "/persona":
                    if not arg:
                        console.print("Usage: /persona <key>")
                    else:
                        try:
                            ok = await adapter.switch_persona(arg)
                            if ok:
                                current_persona = arg
                                console.print(f"Switched persona to [bold]{arg}[/bold].")
                            else:
                                console.print("[red]Unknown persona (orchestrator did not list it).[/]")
                        except Exception as e:
                            console.print(f"[red]Failed to switch persona:[/] {e}")
                elif cmd == "/sys":
                    if not arg:
                        console.print(Panel.fit(current_sys or "<none>", title="System Override"))
                    else:
                        ok = await adapter.update_sys_override(arg)
                        if ok:
                            current_sys = arg
                            console.print("System prompt updated.")
                        else:
                            console.print("[red]Failed to update system prompt.[/]")
                elif cmd == "/save":
                    path = Path(arg) if arg else tpath
                    try:
                        write_jsonl(path, transcript_buffer)
                        console.print(f"Saved transcript to {path}")
                    except Exception as e:
                        console.print(f"[red]Save failed:[/] {e}")
                elif cmd == "/load":
                    if not arg:
                        console.print("Usage: /load <path>")
                    else:
                        path = Path(arg)
                        try:
                            recs = read_jsonl(path)
                            transcript_buffer.extend(recs)
                            console.print(f"Loaded {len(recs)} turns from {path}")
                        except Exception as e:
                            console.print(f"[red]Load failed:[/] {e}")
                elif cmd == "/config":
                    print_config(current_model, current_persona, current_sys, stream, tpath)
                elif cmd == "/clear":
                    try:
                        asyncio.run(adapter.clear())
                        console.print("Context cleared (new session will start on next message).")
                    except Exception as e:
                        console.print(f"[red]Clear failed:[/] {e}")
                elif cmd == "/exit":
                    break
                else:
                    console.print("Unknown command. Type /help.")
                continue

            # Normal user message
            sent_at = datetime.now(timezone.utc).isoformat()
            transcript_buffer.append({
                "ts": sent_at,
                "role": "user",
                "content": user,
                "model": current_model,
            })

            spinner = Spinner("dots", text="thinking…")
            with Live(spinner, refresh_per_second=12, console=console):
                try:
                    stream_iter, meta = await adapter.send_message(user, stream=stream)
                    spinner.update(text=f"{meta.get('active_persona') or adapter.persona_key} • {meta.get('first_token_ms','?')}→{meta.get('latency_ms','?')} ms")
                    # Render response
                    console.print("[bold blue]assistant[/]:", end=" ")
                    text = await aiter_to_text(stream_iter)
                    console.print(text)
                    recv_at = datetime.now(timezone.utc).isoformat()
                    transcript_buffer.append({
                        "ts": recv_at,
                        "role": "assistant",
                        "content": text,
                        "model": meta.get("model") or current_model,
                    })
                    # Update current model from meta/status
                    if meta.get("model"):
                        current_model = meta["model"]
                    # Per-turn summary
                    if meta.get("latency_ms") is not None:
                        console.print(f"[dim]latency: {meta['latency_ms']} ms • model: {current_model}[/]")
                except KeyboardInterrupt:
                    console.print("\n[dim]stream canceled[/]")
                except Exception as e:
                    console.print(f"[red]Request failed:[/] {e}")
                    console.print("[dim]Hint: check network/API keys or try another model.[/]")

            dropped = _truncate_transcript(transcript_buffer, max_items=400)
            if dropped:
                console.print(f"[dim]context truncated: dropped {dropped} old items[/]")

    try:
        asyncio.run(run_loop())
    except KeyboardInterrupt:
        console.print("\nExiting.")


if __name__ == "__main__":
    app()
