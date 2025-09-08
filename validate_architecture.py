#!/usr/bin/env python3
"""
✅ Canonical Agent Architecture Validator

This validator enforces that the codebase uses the canonical Pydantic AI agent path:
- Canonical agent: agentic/agents/orchestrator_agent.py (+ AgentRunner)
- No stale references to clean_orchestrator or dynamic_agent
- Unified streaming endpoint uses AgentRunner.run_streaming
"""

import sys
import os
from pathlib import Path

ROOT = Path(__file__).parent


def scan_repo_for(patterns, exclude_dirs=None):
    exclude_dirs = set(exclude_dirs or [])
    matches = []
    for base, dirs, files in os.walk(ROOT):
        # Skip excluded directories
        if any(str(base).startswith(str(ROOT / d)) for d in exclude_dirs):
            continue
        for fname in files:
            if fname.endswith(('.py', '.ts', '.tsx', '.js')):
                p = Path(base) / fname
                try:
                    text = p.read_text(encoding='utf-8', errors='ignore')
                except Exception:
                    continue
                for pat in patterns:
                    if pat in text:
                        matches.append((str(p), pat))
    return matches


def validate_canonical_agent() -> bool:
    ok = True
    issues = []

    # 1) Canonical agent exists
    agent_path = ROOT / 'agentic' / 'agents' / 'orchestrator_agent.py'
    if not agent_path.exists():
        issues.append(f"Missing canonical agent file: {agent_path}")

    # 2) No references to clean_orchestrator
    bad_clean = scan_repo_for([
        'from agentic.agents.clean_orchestrator',
        'clean_orchestrator',
    ], exclude_dirs=['agentic/_archive'])
    if bad_clean:
        ok = False
        issues.append("Found stale clean_orchestrator references:")
        for p, pat in bad_clean:
            issues.append(f"  {p}: contains '{pat}'")

    # 3) No references to dynamic_agent
    bad_dynamic = scan_repo_for([
        'from agentic.orchestrator.dynamic_agent',
        'dynamic_orchestrator',
        'dynamic_agent'
    ])
    if bad_dynamic:
        ok = False
        issues.append("Found stale dynamic_agent references:")
        for p, pat in bad_dynamic:
            issues.append(f"  {p}: contains '{pat}'")

    # 4) Streaming endpoint uses AgentRunner
    stream_route = ROOT / 'frontend' / 'src' / 'app' / 'api' / 'dev' / 'orchestrator' / 'stream' / 'route.ts'
    if stream_route.exists():
        try:
            text = stream_route.read_text(encoding='utf-8')
            if 'AgentRunner' not in text:
                ok = False
                issues.append("Streaming route does not reference AgentRunner.")
        except Exception:
            pass

    if ok:
        print("✅ ARCHITECTURE OK: Canonical agent path enforced, no stale references detected.")
        return True

    print("\n🚨 ARCHITECTURE WARNINGS/VIOLATIONS:")
    for msg in issues:
        print(msg)
    return False


def main():
    print("🔍 VALIDATING CANONICAL AGENT ARCHITECTURE...")
    print("=" * 50)

    success = validate_canonical_agent()

    if success:
        print("\n🎉 READY: Canonical agent usage verified.")
        sys.exit(0)
    else:
        print("\n🚨 PLEASE FIX THE ABOVE ISSUES.")
        sys.exit(1)


if __name__ == "__main__":
    main()
