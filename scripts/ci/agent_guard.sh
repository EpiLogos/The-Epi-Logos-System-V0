#!/usr/bin/env bash
set -euo pipefail

# CI guard to enforce canonical agent usage
# Fails if stale references to clean_orchestrator (outside archive) or dynamic_agent exist

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
cd "$ROOT_DIR"

fail=0

# Block clean_orchestrator imports outside archive
if grep -RIn --exclude-dir agentic/_archive -E "agentic\.agents\.clean_orchestrator|clean_orchestrator" . >/tmp/agent_guard_clean 2>/dev/null; then
  echo "❌ Found stale clean_orchestrator references:" >&2
  cat /tmp/agent_guard_clean >&2 || true
  fail=1
fi

# Block dynamic_agent references
if grep -RIn -E "agentic\.orchestrator\.dynamic_agent|dynamic_orchestrator|dynamic_agent" . >/tmp/agent_guard_dyn 2>/dev/null; then
  echo "❌ Found stale dynamic_agent references:" >&2
  cat /tmp/agent_guard_dyn >&2 || true
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  echo "\n🚨 Canonical agent guard failed. Please remove the references above." >&2
  exit 1
fi

echo "✅ Canonical agent guard passed."

