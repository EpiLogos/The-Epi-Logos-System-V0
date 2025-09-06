from __future__ import annotations

import asyncio
import json
import os
from dataclasses import dataclass
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

from .orchestrator_adapter import ModelInfo, OrchestratorAdapter

app = typer.Typer(add_completion=False, help="Agentic chat CLI for Unified Orchestrator.")
console = Console()


@dataclass
class Persona:
    key: str
    name: str
    description: str
    system_prompt: str


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
    cfg: Dict[str, Any] = {
        "default_model": os.getenv("AGENTIC_DEFAULT_MODEL", "openai:gpt-4o"),
        "default_persona": os.getenv("AGENTIC_DEFAULT_PERSONA", "default"),
        "transcripts_dir": os.getenv("AGENTIC_TRANSCRIPTS_DIR", "transcripts"),
    }
    for p in [Path("agentic/config.yaml"), Path("agentic/config.json")]:
        if p.exists():
            try:
                if p.suffix == ".yaml":
                    import yaml  # type: ignore

                    cfg.update(yaml.safe_load(p.read_text()) or {})
                else:
                    cfg.update(json.loads(p.read_text() or "{}"))
            except Exception:
                pass
    return cfg


def _personas_dir() -> Path:
    return Path("agentic/personas")


def discover_personas() -> Dict[str, Persona]:
    res: Dict[str, Persona] = {}
    d = _personas_dir()
    if not d.exists():
        return res
    for p in d.glob("*.y*ml"):
        try:
            import yaml  # type: ignore

            data = yaml.safe_load(p.read_text()) or {}
            key = data.get("key") or p.stem
            res[key] = Persona(
                key=key,
                name=data.get("name", key),
                description=data.get("description", ""),
                system_prompt=data.get("system_prompt", ""),
            )
        except Exception:
            continue
    return res


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


def print_models(models: List[ModelInfo], current: Optional[str] = None) -> None:
    t = Table(title="Available Models", box=box.SIMPLE_HEAVY)
    t.add_column("Model")
    t.add_column("Provider")
    t.add_column("Notes")
    for m in models:
        star = "* " if current and m.name == current else "  "
        t.add_row(star + m.name, m.provider, m.description)
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
        print_models(OrchestratorAdapter.list_models())
        raise typer.Exit(0)


@app.command()
def chat(
    model: str = typer.Option(None, "--model", help="Model to use (provider:model)"),
    persona: str = typer.Option(None, "--persona", help="Persona key or path"),
    sys: str = typer.Option("", "--sys", help="System prompt override for the session"),
    stream: bool = typer.Option(True, "--stream/--no-stream", help="Enable/disable streaming"),
    transcript: Optional[str] = typer.Option(None, "--transcript", help="Transcript JSONL path"),
):
    """Start an interactive chat session with the orchestrator."""
    load_env()
    cfg = load_config()

    personas = discover_personas()
    default_model = model or cfg["default_model"]
    persona_key = persona or cfg["default_persona"]
    sys_override = sys or ""
    tpath = open_transcript(transcript)

    if persona_key in personas:
        sys_override = (personas[persona_key].system_prompt or "") + ("\n\n" + sys_override if sys_override else "")
        # When using external persona, use system persona inside orchestrator and inject sys
        orch_persona = "system"
    else:
        orch_persona = persona_key

    adapter = OrchestratorAdapter(
        model=default_model,
        user_id=os.getenv("AGENTIC_USER_ID", "cli-user"),
        persona_key=orch_persona,
        system_override=sys_override,
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
        # Initialize session lazily on first send
        current_model = default_model
        current_persona = persona_key
        current_sys = sys_override

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
                    print_models(OrchestratorAdapter.list_models(), current=current_model)
                elif cmd == "/use":
                    if not arg:
                        console.print("Usage: /use provider:model")
                    else:
                        current_model = arg
                        try:
                            asyncio.run(adapter.switch_model(arg))
                            console.print(f"Switched model to [bold]{arg}[/bold].")
                        except Exception as e:
                            console.print(f"[red]Failed to switch model:[/] {e}")
                elif cmd == "/personas":
                    ps = list(discover_personas().keys())
                    try:
                        ps2 = asyncio.run(adapter.list_orchestrator_personas())
                    except Exception:
                        ps2 = []
                    allp = sorted(set(ps + ps2))
                    tbl = Table(title="Personas", box=box.SIMPLE_HEAVY)
                    tbl.add_column("Key")
                    tbl.add_column("Source")
                    for k in allp:
                        src = "file" if k in personas else "orchestrator"
                        star = "* " if k == current_persona else "  "
                        tbl.add_row(star + k, src)
                    console.print(tbl)
                elif cmd == "/persona":
                    if not arg:
                        console.print("Usage: /persona <key-or-path>")
                    else:
                        # If file path, load and treat as external persona
                        new_sys = ""
                        new_orch_persona = arg
                        if (Path(arg).exists() and Path(arg).is_file()) or arg in personas:
                            if arg in personas:
                                p = personas[arg]
                            else:
                                import yaml  # type: ignore

                                data = yaml.safe_load(Path(arg).read_text())
                                p = Persona(
                                    key=data.get("key") or Path(arg).stem,
                                    name=data.get("name", arg),
                                    description=data.get("description", ""),
                                    system_prompt=data.get("system_prompt", ""),
                                )
                            new_sys = p.system_prompt
                            new_orch_persona = "system"
                        try:
                            asyncio.run(adapter.switch_persona(new_orch_persona))
                            if new_sys:
                                current_sys = new_sys
                                adapter.system_override = current_sys
                                asyncio.run(adapter._apply_sys_override("system", current_sys))
                            current_persona = arg
                            console.print(f"Switched persona to [bold]{arg}[/bold].")
                        except Exception as e:
                            console.print(f"[red]Failed to switch persona:[/] {e}")
                elif cmd == "/sys":
                    if not arg:
                        console.print(Panel.fit(current_sys or "<none>", title="System Override"))
                    else:
                        current_sys = arg
                        adapter.system_override = current_sys
                        try:
                            asyncio.run(adapter._apply_sys_override(adapter.persona_key, current_sys))
                        except Exception:
                            pass
                        console.print("System prompt updated.")
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
                    stream_iter, meta = asyncio.run(adapter.send_message(user, stream=stream))
                    spinner.update(text=f"{meta.get('active_persona') or adapter.persona_key} • {meta['latency_ms']} ms")
                    # Render response
                    console.print("[bold blue]assistant[/]:", end=" ")
                    text = asyncio.run(aiter_to_text(stream_iter))
                    console.print(text)
                    recv_at = datetime.now(timezone.utc).isoformat()
                    transcript_buffer.append({
                        "ts": recv_at,
                        "role": "assistant",
                        "content": text,
                        "model": current_model,
                    })
                    # Per-turn summary
                    if meta.get("latency_ms") is not None:
                        console.print(f"[dim]latency: {meta['latency_ms']} ms • model: {current_model}[/]")
                except KeyboardInterrupt:
                    console.print("\n[dim]stream canceled[/]")
                except Exception as e:
                    console.print(f"[red]Request failed:[/] {e}")
                    console.print("[dim]Hint: check network/API keys or try another model.[/]")

    try:
        asyncio.run(run_loop())
    except KeyboardInterrupt:
        console.print("\nExiting.")


if __name__ == "__main__":
    app()

