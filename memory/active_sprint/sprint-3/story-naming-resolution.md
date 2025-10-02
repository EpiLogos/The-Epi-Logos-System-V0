# Story Numbering Resolution: 08.10 vs 08.06

**Date**: October 2nd, 2025
**Resolved By**: Bob (Scrum Master)
**Issue**: Conflicting story number references in sprint plan

## Resolution Summary

**RESOLVED**: Story 08.10 **DOES NOT EXIST**. The canonical story is **08.06 Epii Persona Workflow**.

## Investigation Findings

### Sprint Plan References
- Original sprint plan (Sprint 11, line 372) referenced "**08.10** Epii Persona Workflow"
- Acceleration analysis referenced both 08.10 and 08.06 as potential discrepancy
- User confirmed: "no such 08.10 story exists, only 08.06"

### File System Verification
```bash
# Search for 08.10 story files
find docs/stories -name "*08.10*"
# Result: No files found

# Search for 08.06 story files
find docs/stories -name "*08.06*"
# Result: docs/stories/08.06.epii-persona-workflow.md EXISTS
```

### Story File Confirmation
- **08.06.epii-persona-workflow.md**: ✅ EXISTS (canonical)
- **08.10 variant**: ❌ DOES NOT EXIST (phantom reference)

## Corrective Actions Taken

### 1. Updated Story 08.06 ✅
- Integrated QL Episodic Overlays architecture from plan-development-epii-QL.md
- Added 4 new acceptance criteria (AC 8-11) for episodic overlay functionality
- Enhanced with dual-namespace schema, traction types, coordinate transforms
- Added releasement phenomenology reference implementation
- Version bumped to 2.0 with changelog entry

### 2. Created Updated Sprint Plan ✅
- **File**: `docs/sprint-plan-updated-Oct-2nd.md`
- All references to "08.10" removed
- Replaced with correct "**08.06**" throughout
- Added story numbering resolution section
- Updated Sprint 5 with enhanced 08.06 story placement

### 3. Restructured Sprint Sequence ✅
- **Sprint 5**: 08.06 Epii Persona Workflow (was Sprint 11)
- **Sprint 7**: 04.06 Context Frame System moved from Sprint 5
- **Sprint 8**: 02.24.1 Paramasiva Topological Analysis moved from Sprint 5
- **Sprint 11**: 04.02 QL Context Frame Application moved from Sprint 15

## Root Cause Analysis

### Why the Confusion Occurred
1. **Early planning inconsistency**: Initial sprint plan may have had placeholder story numbers
2. **Manual editing errors**: Possible typo changing 08.06 → 08.10 in sprint plan
3. **Copy-paste error**: Story template duplication with incorrect numbering
4. **Lack of validation**: No automated check for story file existence vs sprint plan references

## Prevention Measures

### Immediate Actions
1. ✅ Cross-reference all sprint plan story numbers against actual story files
2. ✅ Update sprint plan with verified story numbers only
3. ✅ Document canonical story numbers in this resolution file

### Future Prevention
1. **Story Registry**: Maintain canonical story number registry
2. **Validation Script**: Create automated validator to check sprint plan references
3. **Story Creation Protocol**: Always verify new story numbers against existing files
4. **Sprint Plan Updates**: Double-check story numbers before committing changes

## Canonical Story Reference

### Epii Persona Workflow
- **Correct Number**: 08.06
- **File**: `docs/stories/08.06.epii-persona-workflow.md`
- **Sprint**: 5 (updated from 11)
- **Version**: 2.0 (as of Oct 2, 2025)
- **Status**: Draft, enhanced with QL Episodic Overlays

### Story Scope
**Original** (v1.0):
- 12-fold Logos Cycle
- Know Thyself Protocol
- Pedagogical Protocol
- MCP Tools Integration
- Nara Coordination

**Enhanced** (v2.0 - adds):
- QL Episodic Overlays architecture
- Dual-namespace: Core Bimba + Episodic communities
- `:OVERLAYS` relationships with traction types
- Coordinate transform functions
- Releasement phenomenology reference
- Neo4j GDS community detection

## References

- **Story File**: `docs/stories/08.06.epii-persona-workflow.md`
- **Updated Sprint Plan**: `docs/sprint-plan-updated-Oct-2nd.md`
- **Planning Document**: `memory/active_sprint/sprint-3/plan-development-epii-QL.md`
- **Acceleration Analysis**: `memory/active_sprint/sprint-3/epii-acceleration-analysis.md`

## Status: RESOLVED ✅

All sprint plan references updated to use correct story number **08.06**.
No story 08.10 exists or should be created.
