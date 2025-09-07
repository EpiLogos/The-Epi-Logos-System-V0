#!/usr/bin/env python3
"""
🚨 ARCHITECTURAL COMPLIANCE VALIDATOR 🚨

This script validates that the orchestrator follows the mandatory architectural principles:
1. NO direct Pydantic AI Agent calls
2. ALL LLM interactions through llm_services.py layer
"""

import sys
import os

def validate_core_architecture():
    """Validate core.py follows architectural principles"""
    
    core_path = "agentic/orchestrator/core.py"
    
    if not os.path.exists(core_path):
        print(f"❌ ERROR: {core_path} not found")
        return False
    
    with open(core_path, 'r') as f:
        source = f.read()
    
    violations = []
    
    # Check for forbidden imports
    forbidden_imports = [
        "from pydantic_ai import Agent",
        "from pydantic_ai.agent import Agent", 
        "import pydantic_ai",
    ]
    
    for pattern in forbidden_imports:
        if pattern in source:
            violations.append(f"FORBIDDEN IMPORT: {pattern}")
    
    # Check for forbidden Agent usage
    forbidden_usage = [
        "Agent(",
        "= Agent",
        "agent.run(",
        "run_ag_ui(",
    ]
    
    for pattern in forbidden_usage:
        if pattern in source:
            violations.append(f"FORBIDDEN PATTERN: {pattern}")
    
    # Check for required LLM service usage
    required_patterns = [
        "llm_manager.chat_completion",
        "from ..llm_services import llm_manager",
    ]
    
    missing_requirements = []
    for pattern in required_patterns:
        if pattern not in source:
            missing_requirements.append(f"MISSING REQUIREMENT: {pattern}")
    
    # Report results
    if violations:
        print("🚨 ARCHITECTURAL VIOLATIONS DETECTED:")
        for v in violations:
            print(f"  ❌ {v}")
    
    if missing_requirements:
        print("\n🔍 MISSING REQUIREMENTS:")
        for r in missing_requirements:
            print(f"  ⚠️ {r}")
    
    if not violations and not missing_requirements:
        print("✅ ARCHITECTURAL COMPLIANCE: PASSED")
        return True
    else:
        print(f"\n💥 TOTAL ISSUES: {len(violations + missing_requirements)}")
        return False

def main():
    print("🔍 VALIDATING ARCHITECTURAL COMPLIANCE...")
    print("=" * 50)
    
    success = validate_core_architecture()
    
    if success:
        print("\n🎉 ALL ARCHITECTURAL REQUIREMENTS MET!")
        sys.exit(0)
    else:
        print("\n🚨 ARCHITECTURAL VIOLATIONS MUST BE FIXED!")
        print("\nREQUIRED ACTIONS:")
        print("1. Remove all Pydantic AI Agent imports")
        print("2. Remove all Agent() instantiations") 
        print("3. Remove all agent.run() calls")
        print("4. Remove all run_ag_ui() calls")
        print("5. Add llm_manager import and usage")
        sys.exit(1)

if __name__ == "__main__":
    main()
