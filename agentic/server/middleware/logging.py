from __future__ import annotations

import json
import time
from typing import Callable


class JSONLoggingMiddleware:
    """Minimal ASGI middleware that logs request/response timing and trace_id.

    Emits a single JSON line per request with: path, method, status, ms, trace_id.
    """

    def __init__(self, app: Callable):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start = time.perf_counter_ns()
        trace_id = None
        status_holder = {"status": 0}

        async def send_wrapper(message):
            if message.get("type") == "http.response.start":
                status_holder["status"] = message.get("status", 0)
            await send(message)

        headers = {k.decode().lower(): v.decode() for k, v in scope.get("headers", [])}
        trace_id = headers.get("x-trace-id")

        await self.app(scope, receive, send_wrapper)

        end = time.perf_counter_ns()
        total_ms = int((end - start) / 1_000_000)
        log = {
            "component": "server",
            "path": scope.get("path"),
            "method": scope.get("method"),
            "status": status_holder["status"],
            "total_ms": total_ms,
            "trace_id": trace_id,
        }
        print(json.dumps(log))

