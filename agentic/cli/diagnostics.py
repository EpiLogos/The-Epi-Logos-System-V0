from __future__ import annotations

import json
import os
import sys
import time
from dataclasses import dataclass, asdict
from typing import Any, Dict, Optional


def _now_iso() -> str:
    import datetime as _dt

    return _dt.datetime.utcnow().isoformat() + "Z"


@dataclass
class TurnStats:
    trace_id: str
    session_id: Optional[str]
    model: Optional[str]
    persona_key: Optional[str]
    first_token_ms: Optional[int] = None
    total_ms: Optional[int] = None
    sse_events: int = 0
    sse_bytes: int = 0
    error_msg: Optional[str] = None


class DiagnosticsRecorder:
    """Lightweight JSONL diagnostics recorder for CLI.

    Controlled by flags or env:
    - debug: verbose log lines
    - trace: include per-turn timing
    - dump_payloads: log AG-UI payload shapes (keys/counts only)
    - stats: print per-turn summary at the end of turn
    """

    def __init__(self, *, debug: bool = False, trace: bool = False, dump_payloads: bool = False, stats: bool = False) -> None:
        self.debug = debug or os.getenv("AGENTIC_DEBUG") == "1"
        self.trace = trace or os.getenv("AGENTIC_TRACE") == "1"
        self.dump_payloads = dump_payloads
        self.stats = stats
        self._start_ns: Optional[int] = None
        self._first_token_ns: Optional[int] = None
        self.turn: Optional[TurnStats] = None

    def start_turn(self, *, trace_id: str, session_id: Optional[str], model: Optional[str], persona_key: Optional[str]) -> None:
        self._start_ns = time.perf_counter_ns()
        self._first_token_ns = None
        self.turn = TurnStats(trace_id=trace_id, session_id=session_id, model=model, persona_key=persona_key)

    def record_first_token(self) -> None:
        if self._start_ns is None:
            return
        if self._first_token_ns is None:
            self._first_token_ns = time.perf_counter_ns()
            if self.turn:
                dt_ms = int((self._first_token_ns - self._start_ns) / 1_000_000)
                self.turn.first_token_ms = max(dt_ms, 1)

    def record_chunk(self, data: str) -> None:
        if self.turn:
            self.turn.sse_events += 1
            self.turn.sse_bytes += len(data.encode("utf-8", errors="ignore"))

    def error(self, msg: str) -> None:
        if self.turn:
            self.turn.error_msg = msg
        if self.debug:
            self._log({"level": "error", "component": "cli", "ts": _now_iso(), "msg": msg})

    def end_turn(self) -> None:
        if self._start_ns is None or not self.turn:
            return
        end_ns = time.perf_counter_ns()
        total_ms = int((end_ns - self._start_ns) / 1_000_000)
        self.turn.total_ms = max(total_ms, 1)
        if self.stats:
            print(f"[stats] trace={self.turn.trace_id} model={self.turn.model} persona={self.turn.persona_key} first_token_ms={self.turn.first_token_ms} total_ms={self.turn.total_ms} events={self.turn.sse_events} bytes={self.turn.sse_bytes} err={bool(self.turn.error_msg)}")
        if self.trace:
            self._log({"level": "info", "component": "cli", "ts": _now_iso(), **asdict(self.turn)})

    def dump_payload_shape(self, *, trace_id: str, kind: str, payload: Any) -> None:
        if not self.dump_payloads:
            return
        # Redact raw content; log only keys/lengths
        shape = _shape(payload)
        self._log({"level": "debug", "component": "agui", "ts": _now_iso(), "trace_id": trace_id, "kind": kind, "shape": shape})

    def _log(self, obj: Dict[str, Any]) -> None:
        try:
            sys.stdout.write(json.dumps(obj) + "\n")
            sys.stdout.flush()
        except Exception:
            pass


def _shape(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _shape(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [ _shape(x) for x in obj ]
    if hasattr(obj, "model_dump"):
        # pydantic models
        return _shape(obj.model_dump())
    if isinstance(obj, str):
        return f"str({len(obj)})"
    if isinstance(obj, bytes):
        return f"bytes({len(obj)})"
    return type(obj).__name__

