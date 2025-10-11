"""
Delegation Display - Rich Console Formatting for Agent Delegation

Provides clean, non-blocking visualization of multi-agent delegation flow.
Integrates with DelegationEventEmitter for real-time observability.

Story 02.24 - CLI Observability Enhancement
"""

from rich.console import Console
from rich.tree import Tree
from rich.panel import Panel
from rich.text import Text
from rich import box
from typing import Dict, Any, Optional

from agentic.agents.delegation_events import DelegationEvent, DelegationEventType


class DelegationDisplay:
    """
    Rich console display for delegation events.

    Formats delegation flow in clean, readable format without blocking.
    """

    def __init__(self, console: Console):
        """
        Initialize delegation display.

        Args:
            console: Rich Console instance
        """
        self.console = console
        self.current_flow: Dict[str, Any] = {}

    def handle_event(self, event: DelegationEvent):
        """
        Handle delegation event and display appropriately.

        Args:
            event: DelegationEvent to display
        """
        # Route to specific handler based on event type
        handler_map = {
            DelegationEventType.ROUTER_CLASSIFY: self._display_router_classify,
            DelegationEventType.ROUTER_SELECT_TARGET: self._display_router_select,
            DelegationEventType.PRAKASA_INIT_START: self._display_prakasa_start,
            DelegationEventType.PRAKASA_BIMBA_QUERY: self._display_bimba_query,
            DelegationEventType.PRAKASA_CACHE_HIT: self._display_cache_hit,
            DelegationEventType.PRAKASA_CACHE_MISS: self._display_cache_miss,
            DelegationEventType.PRAKASA_PROMPT_COMPOSED: self._display_prompt_composed,
            DelegationEventType.CONTEXT_PACKAGE_BUILD: self._display_context_build,
            DelegationEventType.CONTEXT_HANDOFF: self._display_handoff,
            DelegationEventType.DELEGATION_START: self._display_delegation_start,
            DelegationEventType.DELEGATION_COMPLETE: self._display_delegation_complete,
            DelegationEventType.AGENT_PROCESSING: self._display_agent_processing,
            DelegationEventType.USAGE_AGGREGATED: self._display_usage,
        }

        handler = handler_map.get(event.event_type)
        if handler:
            handler(event)

    def _display_router_classify(self, event: DelegationEvent):
        """Display router classification"""
        data = event.data
        complexity = data.get("complexity", "").upper()
        request_type = data.get("request_type", "").replace("_", " ").title()

        color = "yellow" if complexity == "HEAVYWEIGHT" else "green"

        self.console.print(
            f"[bold cyan]╔═ ROUTER[/bold cyan] Classified: "
            f"[{color}]{complexity}[/{color}] "
            f"([dim]{request_type}[/dim])"
        )

    def _display_router_select(self, event: DelegationEvent):
        """Display target agent selection"""
        data = event.data
        target = data.get("target_subsystem")
        reason = data.get("reason", "").replace("_", " ")

        agent_names = {
            0: "Anuttara",
            1: "Paramasiva",
            2: "Parashakti",
            3: "Mahamaya",
            4: "Nara",
            5: "Epii"
        }

        agent_name = agent_names.get(target, f"Agent #{target}")

        self.console.print(
            f"[bold cyan]╠═ ROUTER[/bold cyan] Target: "
            f"[bold yellow]#{target} ({agent_name})[/bold yellow] "
            f"← {reason}"
        )

    def _display_prakasa_start(self, event: DelegationEvent):
        """Display Prakāśa initialization start"""
        subsystem = event.data.get("subsystem")

        self.console.print(
            f"[bold magenta]╠═ PRAKĀŚA[/bold magenta] Initializing agent #{subsystem}..."
        )

    def _display_bimba_query(self, event: DelegationEvent):
        """Display Bimba query"""
        data = event.data
        coordinate = data.get("coordinate")
        success = data.get("success")

        status = "[green]✓[/green]" if success else "[red]✗[/red]"

        self.console.print(
            f"[bold magenta]║  ├─[/bold magenta] Bimba Query: {coordinate} {status}"
        )

    def _display_cache_hit(self, event: DelegationEvent):
        """Display cache hit"""
        coordinate = event.data.get("coordinate")

        self.console.print(
            f"[bold magenta]║  ├─[/bold magenta] Cache: [green]HIT[/green] ({coordinate})"
        )

    def _display_cache_miss(self, event: DelegationEvent):
        """Display cache miss"""
        coordinate = event.data.get("coordinate")

        self.console.print(
            f"[bold magenta]║  ├─[/bold magenta] Cache: [yellow]MISS[/yellow] ({coordinate})"
        )

    def _display_prompt_composed(self, event: DelegationEvent):
        """Display prompt composition"""
        data = event.data
        subsystem = data.get("subsystem")
        length = data.get("prompt_length", 0)
        source = data.get("source", "unknown").upper()

        source_color = {
            "BIMBA": "green",
            "CACHE": "cyan",
            "FALLBACK": "yellow"
        }.get(source, "white")

        self.console.print(
            f"[bold magenta]║  └─[/bold magenta] Prompt: "
            f"[{source_color}]{source}[/{source_color}] "
            f"({length} chars)"
        )

    def _display_context_build(self, event: DelegationEvent):
        """Display context package build"""
        data = event.data
        context_id = data.get("context_id", "")[:16]  # Truncate for display

        self.console.print(
            f"[bold blue]╠═ CONTEXT[/bold blue] Building delegation package..."
        )
        self.console.print(
            f"[bold blue]║  ├─[/bold blue] context_id: [dim]{context_id}...[/dim]"
        )

    def _display_handoff(self, event: DelegationEvent):
        """Display agent handoff"""
        data = event.data
        from_agent = data.get("from_agent")
        to_agent = data.get("to_agent")
        reason = data.get("reason", "").replace("_", " ")

        self.console.print(
            f"[bold blue]║  └─[/bold blue] Handoff: "
            f"{from_agent} → [bold]{to_agent}[/bold] "
            f"([dim]{reason}[/dim])"
        )

    def _display_delegation_start(self, event: DelegationEvent):
        """Display delegation start"""
        data = event.data
        target = data.get("target_subsystem")
        message = data.get("message_preview", "")

        self.console.print(
            f"[bold green]╠═ DELEGATION[/bold green] Executing Pattern 1 → Agent #{target}"
        )
        self.console.print(
            f"[bold green]║  ├─[/bold green] deps: [cyan]shared[/cyan] (Bimba, LightRAG, Redis)"
        )
        self.console.print(
            f"[bold green]║  ├─[/bold green] usage: [cyan]tracking enabled[/cyan]"
        )
        if message:
            self.console.print(
                f"[bold green]║  └─[/bold green] Request: [dim]\"{message}...\"[/dim]"
            )

    def _display_delegation_complete(self, event: DelegationEvent):
        """Display delegation completion"""
        data = event.data
        target = data.get("target_subsystem")
        success = data.get("success")

        status = "[green]✓ Complete[/green]" if success else "[red]✗ Failed[/red]"

        self.console.print(
            f"[bold green]╠═ DELEGATION[/bold green] {status}"
        )

    def _display_agent_processing(self, event: DelegationEvent):
        """Display agent processing status"""
        agent = event.agent or "unknown"
        status = event.data.get("status", "")

        self.console.print(
            f"[bold yellow]║  [{agent.upper()}][/bold yellow] {status}"
        )

    def _display_usage(self, event: DelegationEvent):
        """Display usage aggregation"""
        data = event.data
        orchestrator = data.get("orchestrator_tokens", 0)
        delegated = data.get("delegated_tokens", 0)
        total = data.get("total_tokens", 0)

        self.console.print(
            f"[bold cyan]╚═ USAGE[/bold cyan] Total: [bold]{total:,}[/bold] tokens "
            f"(Orchestrator: {orchestrator:,}, Delegated: {delegated:,})"
        )

    def display_delegation_summary(
        self,
        from_agent: str,
        to_agent: str,
        success: bool,
        total_tokens: int
    ):
        """
        Display compact delegation summary.

        Args:
            from_agent: Source agent
            to_agent: Target agent
            success: Delegation success status
            total_tokens: Total token usage
        """
        status_icon = "✓" if success else "✗"
        status_color = "green" if success else "red"

        summary = Panel(
            f"[{status_color}]{status_icon}[/{status_color}] "
            f"{from_agent} → {to_agent} | "
            f"{total_tokens:,} tokens",
            title="[bold]Delegation Summary[/bold]",
            border_style="cyan",
            box=box.ROUNDED
        )

        self.console.print(summary)
