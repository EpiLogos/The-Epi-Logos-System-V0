"""
ContextPackage: lightweight container for external context inputs.

This provides a minimal API for workflows that expect a context package.
"""

from __future__ import annotations

from typing import Dict, List, Optional


class ContextPackage:
    def __init__(self) -> None:
        self._files: Dict[str, str] = {}

    def add_virtual_file(self, path: str, content: str) -> None:
        self._files[path] = content

    def get_file(self, path: str) -> Optional[str]:
        return self._files.get(path)

    def get_files_by_type(self, suffix: str) -> List[str]:
        return [p for p in self._files if p.endswith(suffix)]

    def get_files_by_pattern(self, pattern: str) -> List[str]:
        # Minimal pattern support; callers may filter themselves
        return [p for p in self._files if pattern in p]

    def has_capability(self, name: str) -> bool:  # placeholder
        return False

