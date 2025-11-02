#!/bin/bash
# Test runner for MEF tool integration tests

cd "$(dirname "$0")"
source .venv/bin/activate
export PYTHONPATH=.

python -m pytest agentic/tests/unit/test_shared_tools_mef.py -v "$@"
