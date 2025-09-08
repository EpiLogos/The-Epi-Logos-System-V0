"""
Agentic Service Package

The agentic service provides persona-based AI workflows through the UnifiedOrchestrator
system with clean slate re-instantiation protocols and ACT Protocol context management.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure the repository root is on sys.path so sibling package `shared` can be imported
# when the runtime launches Python from outside the repo root (e.g., from Next.js).
try:  # pragma: no cover - simple bootstrap
    import shared  # type: ignore
except Exception:  # ImportError or others
    repo_root = Path(__file__).resolve().parents[1]
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

__version__ = "0.1.0"
