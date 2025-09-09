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

from .simple_agent_adapter import SimpleAgentAdapter
from .diagnostics import DiagnosticsRecorder

app = typer.Typer(add_completion=False, help="Agentic chat CLI for Unified Orchestrator.")
console = Console()



def load_env() -> None:
    """Load `.env` from project root if present without failing if missing."""
    try:
        from dotenv import load_dotenv  # type: ignore

        # Look for .env in project root (parent of agentic directory)
        project_root = Path(__file__).parent.parent.parent
        env_path = project_root / ".env"
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


@app.command()
def models():
    """List available models and exit."""
    load_env()
    adapter = SimpleAgentAdapter(
        model=os.getenv("AGENTIC_DEFAULT_MODEL", "groq:moonshotai/kimi-k2-instruct"),
        user_id=os.getenv("AGENTIC_USER_ID", "cli-user"),
        persona_key="system",
    )
    caps = asyncio.run(adapter.get_capabilities())
    print_models(caps.get("models", []), caps.get("default_model", ""), current=None)


@app.command()
def doctor():
    """Run connectivity and streaming diagnostics."""
    load_env()
    console.print("Running diagnostics…")
    diag = DiagnosticsRecorder(debug=True, trace=True, dump_payloads=True, stats=True)
    adapter = SimpleAgentAdapter(
        model=os.getenv("AGENTIC_DEFAULT_MODEL", "groq:moonshotai/kimi-k2-instruct"),
        user_id=os.getenv("AGENTIC_USER_ID", "cli-user"),
        persona_key="system",
        system_override="",
        diagnostics=diag,
    )

    async def run_checks():
        # Capabilities
        caps = await adapter.get_capabilities()
        models = caps.get('models', [])
        default = caps.get('default_model')
        console.print(f"Capabilities: default={default} models={len(models)}")
        if not models:
            console.print("[red]FAIL:[/] no allowed models configured (agentic/config.yaml or AGENTIC_MODELS)")
        # Personas
        pers = await adapter.list_orchestrator_personas()
        console.print(f"Personas: {pers if pers else '[]'}")
        # Streaming check (strict)
        try:
            stream_iter, meta = await adapter.send_message("diagnostic ping", stream=True, strict=True, timeout_s=10)
            text = ""
            async for chunk in stream_iter:
                # Handle both string chunks and dict chunks
                if isinstance(chunk, dict):
                    text += chunk.get('content', '')
                else:
                    text += str(chunk)
            passed = bool(meta.get('first_token_ms')) and len(text) > 0 and meta.get('streaming_mode') == 'ag_ui'
            console.print(f"Streaming: {'PASS' if passed else 'WARN'} first_token_ms={meta.get('first_token_ms')} total_ms={meta.get('latency_ms')} mode={meta.get('streaming_mode')} len={len(text)}")
        except Exception as e:
            console.print(f"Streaming: [red]FAIL[/] {e}")
        # Model switch probe (if another model exists)
        try:
            alt = next((m['name'] for m in models if m['name'] != default and m.get('ready')), None)
            if alt:
                ok = await adapter.update_model_in_session(alt)
                status = await adapter.orch.get_session_status(adapter.session_id)
                active = status.get('model_name') if status else None
                console.print(f"Model switch: {'PASS' if ok and active==alt else 'FAIL'} requested={alt} active={active} ok={ok}")
        except Exception as e:
            console.print(f"Model switch probe failed: {e}")
        # Persona switch probe (if available)
        try:
            current = (await adapter.orch.get_session_status(adapter.session_id)).get('active_persona') if adapter.session_id else None
            altp = next((p for p in pers if p != current), None)
            if altp:
                okp = await adapter.switch_persona(altp)
                status2 = await adapter.orch.get_session_status(adapter.session_id)
                activep = status2.get('active_persona') if status2 else None
                console.print(f"Persona switch: {'PASS' if okp and activep==altp else 'FAIL'} requested={altp} active={activep} ok={okp}")
        except Exception as e:
            console.print(f"Persona switch probe failed: {e}")

    import asyncio as _a
    _a.run(run_checks())


@app.command()
def agent_status():
    """🤖 Check canonical Pydantic AI agent status and capabilities."""
    load_env()
    console.print("🤖 Checking Canonical Pydantic AI Agent Status...\n")

    try:
        from ..agents.orchestrator_agent import get_agent_info

        info = get_agent_info()

        # Overview table
        overview_table = Table(title="Pydantic AI Orchestrator (Canonical)", box=box.ROUNDED)
        overview_table.add_column("Property", style="cyan")
        overview_table.add_column("Value", style="green")
        overview_table.add_row("Agent Available", "✅ YES" if info.get("available") else "❌ NO")
        overview_table.add_row("Default Model", info.get("default_model", "unknown"))
        overview_table.add_row("Supports Streaming", "✅ YES" if info.get("supports_streaming") else "❌ NO")
        overview_table.add_row("Supports Personas", "✅ YES" if info.get("supports_personas") else "❌ NO")
        overview_table.add_row("Supports Tools", str(info.get("tools_count", 0)))
        console.print(overview_table)

        # Models table
        models = info.get("available_models", {}) or {}
        if models:
            console.print("\n📋 Available Models:")
            models_table = Table(box=box.SIMPLE)
            models_table.add_column("Provider", style="yellow")
            models_table.add_column("Model", style="cyan")
            for provider, model in models.items():
                models_table.add_row(provider, model or "<unset>")
            console.print(models_table)
        else:
            console.print("[yellow]No models advertised by orchestrator_agent. Configure API keys.[/yellow]")
            console.print("Required environment variables:")
            console.print("  - OPENAI_API_KEY (+ OPENAI_MODEL)")
            console.print("  - GEMINI_API_KEY (+ GEMINI_MODEL)")
            console.print("  - ANTHROPIC_API_KEY (+ ANTHROPIC_MODEL)")
            console.print("  - DEEPSEEK_API_KEY (+ DATABASE_MODEL)")

        console.print("\n📊 Integration Path:")
        console.print("- Frontend → Next API → AgentRunner → 🤖 orchestrator_agent")
        console.print("[green]✅ Unified on canonical agent[/green]")

    except Exception as e:
        console.print(f"[red]❌ Error: {e}[/red]")


@app.command()
def persona_models():
    """🎭 Show and manage persona model assignments."""
    load_env()
    adapter = SimpleAgentAdapter(
        model=os.getenv("AGENTIC_DEFAULT_MODEL", "groq:moonshotai/kimi-k2-instruct"),
    )

    async def show_assignments():
        assignments = await adapter.get_persona_models()
        validation = await adapter.validate_persona_models()

        table = Table(title="🎭 Persona Model Assignments", box=box.ROUNDED)
        table.add_column("Persona", style="cyan", width=12)
        table.add_column("Model", style="green", width=30)
        table.add_column("Status", style="yellow", width=10)
        table.add_column("Provider", style="blue", width=12)

        for persona, model in assignments.items():
            is_valid = validation.get(persona, False)
            status = "✅ Ready" if is_valid else "❌ Invalid"

            # Parse provider from model
            provider = model.split(":")[0] if ":" in model else "openai"

            table.add_row(
                persona.title(),
                model,
                status,
                provider.title()
            )

        console.print(table)

        # Show routing summary
        caps = await adapter.get_capabilities()
        routing = caps.get("persona_routing", {})

        console.print(f"\n📊 Routing Summary:")
        console.print(f"  Valid Assignments: {routing.get('valid_assignments', 0)}/{routing.get('total_personas', 0)}")
        console.print(f"  Default Model: {routing.get('default_model', 'unknown')}")

    asyncio.run(show_assignments())


@app.command(name="chat")
@app.callback(invoke_without_command=True)
def chat(
    model: Optional[str] = typer.Option(None, "--model", help="Model to use (provider:model); default from orchestrator"),
    persona: Optional[str] = typer.Option(None, "--persona", help="Persona key (orchestrator personas)"),
    sys: str = typer.Option("", "--sys", help="System prompt override for the session"),
    stream: bool = typer.Option(True, "--stream/--no-stream", help="Enable/disable streaming"),
    no_fallback: bool = typer.Option(False, "--no-fallback", help="Strict streaming; no automatic fallback"),
    stream_timeout: float = typer.Option(10.0, "--stream-timeout", help="Streaming timeout in seconds (per event)"),
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

    adapter = SimpleAgentAdapter(
        model=model or os.getenv("AGENTIC_DEFAULT_MODEL", "gemini-2.5-flash"),
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
            # Handle both string chunks and dict chunks
            if isinstance(part, dict):
                text_parts.append(part.get('content', ''))
            else:
                text_parts.append(str(part))
        return "".join(text_parts)

    def cmd_help():
        console.print("Commands:")
        console.print("/help — show this help")
        console.print("/models — list models; current marked")
        console.print("/use <model> — switch model live")
        console.print("/personas — list available personas; current")
        console.print("/persona <key-or-path> — switch persona")
        console.print("/tools — list available tools from orchestrator")
        console.print("/timeout <sec> — set streaming timeout per event")
        console.print("/sys [text] — view or set system override")
        console.print("/save [path] — save current transcript")
        console.print("/load <path> — load transcript into context")
        console.print("/config — show effective config")
        console.print("/status — show session+turn status")
        console.print("/stream [on|off] — toggle streaming mode")
        console.print("/clear — clear conversation context")
        console.print("/exit — quit")

    async def run_loop():
        # Start session and load orchestrator capabilities
        caps = await adapter.get_capabilities()
        current_model = caps.get("default_model")
        current_persona = adapter.persona_key
        current_sys = sys_override
        console.print(f"[dim]Using model: {current_model} (default: {caps.get('default_model')})[/]")

        current_stream = stream
        current_timeout = float(stream_timeout)
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
                            # Confirm with orchestrator truth
                            status = await adapter.orch.get_session_status(adapter.session_id)
                            current_model = status.get("model_name") if status else arg
                            console.print(f"Active model (orchestrator): [bold]{current_model}[/bold].")
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
                                status = await adapter.orch.get_session_status(adapter.session_id)
                                current_persona = status.get("active_persona") if status else arg
                                console.print(f"Active persona (orchestrator): [bold]{current_persona}[/bold].")
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
                            status = await adapter.orch.get_session_status(adapter.session_id)
                            console.print(f"System prompt updated (hash): [bold]{(status or {}).get('system_hash')}[/bold]")
                        else:
                            console.print("[red]Failed to update system prompt.[/]")
                elif cmd == "/tools":
                    try:
                        tools = await adapter.list_orchestrator_tools()
                        if tools:
                            t = Table(title="Available Tools", box=box.SIMPLE_HEAVY)
                            t.add_column("Tool Name")
                            t.add_column("Description")

                            # Add descriptions for known tools
                            tool_descriptions = {
                                "search_knowledge": "Search the knowledge base using LightRAG",
                                "insert_knowledge": "Insert new knowledge into the knowledge base",
                                "get_knowledge_graph": "Retrieve knowledge graph structure",
                                "search_bimba": "Search the Bimba graph database",
                                "create_bimba_node": "Create new nodes in Bimba graph",
                                "update_bimba_node": "Update existing Bimba graph nodes",
                                "create_graphiti_edge": "Create edges in Graphiti temporal graph",
                                "search_graphiti_nodes": "Search Graphiti temporal nodes",
                                "get_session_context": "Retrieve current session context"
                            }

                            for tool in tools:
                                description = tool_descriptions.get(tool, "Tool from orchestrator")
                                t.add_row(tool, description)
                            console.print(t)
                        else:
                            console.print("[yellow]No tools available or failed to fetch tools.[/]")
                    except Exception as e:
                        console.print(f"[red]Failed to get tools:[/] {e}")
                elif cmd == "/status":
                    status = await adapter.orch.get_session_status(adapter.session_id)
                    if not status:
                        console.print("[red]No active session.[/]")
                    else:
                        t = Table(title="Session Status", box=box.SIMPLE_HEAVY)
                        t.add_column("Key")
                        t.add_column("Value")
                        t.add_row("session_id", status.get("session_id") or "")
                        t.add_row("model_name", status.get("model_name") or "")
                        t.add_row("active_persona", status.get("active_persona") or "")
                        t.add_row("system_hash", status.get("system_hash") or "")
                        # Last turn stats
                        if diag.turn:
                            t.add_row("first_token_ms", str(diag.turn.first_token_ms or ""))
                            t.add_row("total_ms", str(diag.turn.total_ms or ""))
                            t.add_row("sse_events", str(diag.turn.sse_events))
                            t.add_row("sse_bytes", str(diag.turn.sse_bytes))
                        console.print(t)
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
                elif cmd == "/stream":
                    if not arg:
                        console.print(f"Streaming is {'on' if current_stream else 'off'}.")
                    else:
                        val = arg.strip().lower()
                        if val in ("on", "off"):
                            current_stream = (val == "on")
                            console.print(f"Streaming turned {'on' if current_stream else 'off'}.")
                        else:
                            console.print("Usage: /stream [on|off]")
                elif cmd == "/timeout":
                    if not arg:
                        console.print(f"Current stream timeout: {current_timeout:.1f} s")
                    else:
                        try:
                            new_to = float(arg)
                            if new_to <= 0:
                                raise ValueError
                            current_timeout = new_to
                            console.print(f"Stream timeout set to {current_timeout:.1f} s")
                        except Exception:
                            console.print("Usage: /timeout <seconds> (positive number)")
                elif cmd == "/persona_models":
                    # 🎭 Show persona model assignments
                    try:
                        assignments = await adapter.get_persona_models()
                        validation = await adapter.validate_persona_models()

                        table = Table(title="🎭 Persona Model Assignments", box=box.ROUNDED)
                        table.add_column("Persona", style="cyan")
                        table.add_column("Model", style="green")
                        table.add_column("Status", style="yellow")

                        for persona, model in assignments.items():
                            is_valid = validation.get(persona, False)
                            status = "✅ Ready" if is_valid else "❌ Invalid"
                            table.add_row(persona.title(), model, status)

                        console.print(table)
                    except Exception as e:
                        console.print(f"[red]Failed to get persona models:[/] {e}")
                elif cmd == "/persona_model":
                    # 🎭 Set persona model: /persona_model <persona> <model>
                    if not arg:
                        console.print("Usage: /persona_model <persona> <model>")
                        console.print("Example: /persona_model nara anthropic:claude-3-5-haiku-20241022")
                    else:
                        parts = arg.split(maxsplit=1)
                        if len(parts) != 2:
                            console.print("Usage: /persona_model <persona> <model>")
                        else:
                            persona, model = parts
                            try:
                                success = await adapter.set_persona_model(persona, model)
                                if success:
                                    console.print(f"✅ Set {persona} to use {model}")
                                else:
                                    console.print(f"❌ Failed to set {persona} model to {model} (invalid or not ready)")
                            except Exception as e:
                                console.print(f"[red]Failed to set persona model:[/] {e}")
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
                    try:
                        stream_iter, meta = await adapter.send_message(user, stream=current_stream, strict=no_fallback, timeout_s=current_timeout)
                    except Exception as e:
                        console.print(f"[red]Streaming error:[/] {e}")
                        continue
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
