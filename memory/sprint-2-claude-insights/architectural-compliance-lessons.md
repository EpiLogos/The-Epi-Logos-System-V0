# Architectural Compliance Lessons from Story 02.10

*Extracted from Sprint 2 Development - September 2025*

## Critical Learning: No Silent Deviations Enforcement

### Case Study: GraphQL vs REST Implementation
**Initial Problem**: Story 02.01 initially implemented REST instead of specified GraphQL due to reported "dependency conflicts with Strawberry GraphQL and Python 3.13".

**Root Cause Discovery**: Local directory name collision (`/graphql/` shadowing graphql-core package), not actual dependency conflicts.

**Golden Rule Applied**: 
1. **STOP** - Do not implement alternative without escalation
2. **INVESTIGATE** - 15-minute PoC validated actual compatibility  
3. **DOCUMENT** - Specific technical blocker with evidence
4. **RESOLVE** - Alternative solutions within architectural constraints

### Key Process Improvement for Claude Code

```markdown
### Required Actions Before Alternative Implementation
- [ ] Create isolated PoC demonstrating the claimed conflict
- [ ] Test with latest package versions  
- [ ] Verify no local environment issues (shadowed imports, PATH problems)
- [ ] Document exact error messages and dependency versions
- [ ] Evaluate alternative approaches within architectural constraints
```

## Architectural Decision Verification Process

### Always Validate Technical Blockers
```bash
# Verify latest dependency versions
pip list --outdated
# Test minimal implementation in isolated environment
# Document specific error messages and versions
```

### GraphQL Integration Patterns (Validated Working)
When integrating GraphQL with FastAPI:
- ✅ **Correct**: Use FastAPI path operations (`@app.post()`) for proper dependency injection
- ❌ **Incorrect**: Use `app.add_route()` which bypasses FastAPI's DI system
- ✅ **Correct**: Unpack Ariadne return tuple: `success, result = await ariadne.graphql()`
- ✅ **Required**: Comprehensive unit + integration testing

## Exception Process Framework

### When Technical Blockers Are Real
1. Create ADR amendment documenting exception rationale
2. Open technical debt ticket for future remediation
3. Define narrow criteria for exception scope
4. Set review/expiration date for exception

### Testing Requirements for Architecture Changes
- **Unit Tests**: Isolated component logic testing
- **Integration Tests**: Full request pipeline validation  
- **Compatibility Tests**: Verify no regression in existing functionality
- **Error Handling Tests**: Validate graceful failure modes

## Recommendations for CLAUDE.md Updates

Add to Architectural Compliance section:
```markdown
### Exception Process
- Create ADR amendment documenting exception rationale
- Open technical debt ticket for future remediation
- Define narrow criteria for exception scope
- Set review/expiration date for exception
```