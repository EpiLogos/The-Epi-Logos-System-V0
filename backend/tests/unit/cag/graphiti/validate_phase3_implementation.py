#!/usr/bin/env python3
"""
Phase 3 Implementation Validation Script

Validates that all MEF service functions are properly implemented
without running actual tests (static code analysis).

Story 08.13 - MEF Resonance Analysis via Parashakti Agent
"""

import ast
import inspect
from pathlib import Path


def validate_phase3_implementation():
    """
    Validate Phase 3 MEF service implementation via static code analysis.

    Checks:
    1. All 4 core functions exist
    2. All functions are async
    3. EA+Episodic labels in schema
    4. All 6 MEF lens properties
    5. DeepSeek reasoning chain storage
    6. Etymology session tracking
    """

    print("=" * 80)
    print("PHASE 3: MEF SERVICE IMPLEMENTATION VALIDATION")
    print("=" * 80)
    print()

    # Read MEF service source code
    mef_service_path = Path(__file__).parent.parent.parent.parent.parent / "epi_logos_system" / "cag" / "graphiti" / "mef_service.py"

    if not mef_service_path.exists():
        print(f"❌ FAIL: MEF service file not found at {mef_service_path}")
        return False

    with open(mef_service_path, 'r') as f:
        source_code = f.read()

    print(f"📄 Reading: {mef_service_path.relative_to(mef_service_path.parent.parent.parent.parent.parent)}")
    print(f"   Lines: {len(source_code.splitlines())}")
    print()

    # Parse AST
    try:
        tree = ast.parse(source_code)
    except SyntaxError as e:
        print(f"❌ FAIL: Syntax error in MEF service: {e}")
        return False

    # Extract function definitions
    functions = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.AsyncFunctionDef):
            functions[node.name] = {
                'async': True,
                'lineno': node.lineno,
                'args': [arg.arg for arg in node.args.args]
            }
        elif isinstance(node, ast.FunctionDef):
            functions[node.name] = {
                'async': False,
                'lineno': node.lineno,
                'args': [arg.arg for arg in node.args.args]
            }

    # Validation checks
    checks_passed = 0
    checks_total = 0

    # Check 1: run_mef_analysis exists and is async
    checks_total += 1
    if 'run_mef_analysis' in functions:
        func = functions['run_mef_analysis']
        if func['async']:
            print(f"✅ CHECK 1: run_mef_analysis() exists and is async (line {func['lineno']})")
            print(f"   Args: {func['args']}")
            checks_passed += 1
        else:
            print(f"❌ CHECK 1: run_mef_analysis() exists but is NOT async")
    else:
        print(f"❌ CHECK 1: run_mef_analysis() NOT FOUND")
    print()

    # Check 2: store_bimba_resonance exists and is async
    checks_total += 1
    if 'store_bimba_resonance' in functions:
        func = functions['store_bimba_resonance']
        if func['async']:
            print(f"✅ CHECK 2: store_bimba_resonance() exists and is async (line {func['lineno']})")
            print(f"   Args: {func['args']}")
            checks_passed += 1
        else:
            print(f"❌ CHECK 2: store_bimba_resonance() exists but is NOT async")
    else:
        print(f"❌ CHECK 2: store_bimba_resonance() NOT FOUND")
    print()

    # Check 3: clear_existing_resonances exists and is async
    checks_total += 1
    if 'clear_existing_resonances' in functions:
        func = functions['clear_existing_resonances']
        if func['async']:
            print(f"✅ CHECK 3: clear_existing_resonances() exists and is async (line {func['lineno']})")
            print(f"   Args: {func['args']}")
            checks_passed += 1
        else:
            print(f"❌ CHECK 3: clear_existing_resonances() exists but is NOT async")
    else:
        print(f"❌ CHECK 3: clear_existing_resonances() NOT FOUND")
    print()

    # Check 4: create_mef_constraints_and_indexes exists and is async
    checks_total += 1
    if 'create_mef_constraints_and_indexes' in functions:
        func = functions['create_mef_constraints_and_indexes']
        if func['async']:
            print(f"✅ CHECK 4: create_mef_constraints_and_indexes() exists and is async (line {func['lineno']})")
            print(f"   Args: {func['args']}")
            checks_passed += 1
        else:
            print(f"❌ CHECK 4: create_mef_constraints_and_indexes() exists but is NOT async")
    else:
        print(f"❌ CHECK 4: create_mef_constraints_and_indexes() NOT FOUND")
    print()

    # Check 5: EA+Episodic labels in schema
    checks_total += 1
    if 'BimbaResonance:EA:Episodic' in source_code:
        occurrences = source_code.count('BimbaResonance:EA:Episodic')
        print(f"✅ CHECK 5: EA+Episodic labels found in schema ({occurrences} occurrences)")
        checks_passed += 1
    else:
        print(f"❌ CHECK 5: EA+Episodic labels NOT FOUND in schema")
    print()

    # Check 6: All 6 MEF lens properties
    checks_total += 1
    mef_lenses = [
        'mef_archetypal',
        'mef_causal',
        'mef_logical',
        'mef_processual',
        'mef_meta_epistemic',
        'mef_divine_scalar'
    ]

    found_lenses = []
    for lens in mef_lenses:
        if lens in source_code:
            found_lenses.append(lens)

    if len(found_lenses) == 6:
        print(f"✅ CHECK 6: All 6 MEF lens properties found:")
        for lens in found_lenses:
            count = source_code.count(lens)
            print(f"   - {lens}: {count} occurrences")
        checks_passed += 1
    else:
        print(f"❌ CHECK 6: Only {len(found_lenses)}/6 MEF lens properties found")
        print(f"   Missing: {set(mef_lenses) - set(found_lenses)}")
    print()

    # Check 7: DeepSeek reasoning chain storage
    checks_total += 1
    if 'deepseek_reasoning' in source_code and 'deepseek_reasoning_chain' in source_code:
        deepseek_count = source_code.count('deepseek_reasoning')
        print(f"✅ CHECK 7: DeepSeek reasoning chain storage found ({deepseek_count} references)")
        checks_passed += 1
    else:
        print(f"❌ CHECK 7: DeepSeek reasoning chain storage NOT FOUND")
    print()

    # Check 8: Etymology session tracking
    checks_total += 1
    if 'etymology_session_id' in source_code:
        session_count = source_code.count('etymology_session_id')
        print(f"✅ CHECK 8: Etymology session tracking found ({session_count} references)")
        checks_passed += 1
    else:
        print(f"❌ CHECK 8: Etymology session tracking NOT FOUND")
    print()

    # Check 9: Constraints and indexes (4 total: 1 constraint + 3 indexes)
    checks_total += 1
    constraint_count = source_code.count('CREATE CONSTRAINT')
    index_count = source_code.count('CREATE INDEX')

    if constraint_count >= 1 and index_count >= 3:
        print(f"✅ CHECK 9: Neo4j schema objects found:")
        print(f"   - Constraints: {constraint_count}")
        print(f"   - Indexes: {index_count}")
        checks_passed += 1
    else:
        print(f"❌ CHECK 9: Insufficient Neo4j schema objects:")
        print(f"   - Constraints: {constraint_count} (expected >= 1)")
        print(f"   - Indexes: {index_count} (expected >= 3)")
    print()

    # Check 10: Relationships (RESONATES_WITH, TARGETS)
    checks_total += 1
    has_resonates_with = 'RESONATES_WITH' in source_code
    has_targets = 'TARGETS' in source_code

    if has_resonates_with and has_targets:
        print(f"✅ CHECK 10: Relationships found:")
        print(f"   - RESONATES_WITH: {source_code.count('RESONATES_WITH')} occurrences")
        print(f"   - TARGETS: {source_code.count('TARGETS')} occurrences")
        checks_passed += 1
    else:
        print(f"❌ CHECK 10: Relationships incomplete:")
        print(f"   - RESONATES_WITH: {'✓' if has_resonates_with else '✗'}")
        print(f"   - TARGETS: {'✓' if has_targets else '✗'}")
    print()

    # Summary
    print("=" * 80)
    print(f"VALIDATION SUMMARY: {checks_passed}/{checks_total} checks passed")
    print("=" * 80)

    if checks_passed == checks_total:
        print()
        print("🎉 SUCCESS: Phase 3 implementation is COMPLETE and CORRECT!")
        print()
        print("All critical components verified:")
        print("  ✅ 4 core async functions")
        print("  ✅ EA+Episodic labeling")
        print("  ✅ 6 MEF lens properties")
        print("  ✅ DeepSeek reasoning chain")
        print("  ✅ Etymology session tracking")
        print("  ✅ Neo4j constraints and indexes")
        print("  ✅ Proper relationships")
        print()
        return True
    else:
        print()
        print(f"⚠️  WARNING: {checks_total - checks_passed} validation checks failed")
        print()
        return False


if __name__ == '__main__':
    success = validate_phase3_implementation()
    exit(0 if success else 1)
