<objective>
Conduct a comprehensive audit of all existing responsive text and image systems, identify every conflicting or broken implementation, and systematically remove them to create a clean foundation for the new unified system.

**Why this matters**: Multiple failed implementation attempts have created layers of conflicting responsive systems. These conflicts prevent any single approach from working correctly. A clean slate is essential before implementing the research-backed solution.

**Who needs this**: The next implementation phase depends on having zero conflicting systems remaining.

**End goal**: A completely clean codebase with all broken/conflicting responsive implementations removed, ready for the unified system implementation.
</objective>

<context>
**Prerequisites**: This prompt MUST run AFTER prompt 005 (research) completes. You need the research findings to identify what qualifies as a "conflicting system" vs what should be preserved.

Read the research document first:
- @./research/tailwind-v4-responsive-systems.md

**Current problem state**:
- Text sizes not changing across viewport sizes
- Images not staying centered when viewport changes
- Multiple attempts have created layered conflicts:
  - CSS custom properties in `@theme` that may not generate utilities
  - Arbitrary values with `clamp()` using different unit systems (`vw` vs `cqi`)
  - Potentially conflicting viewport meta tags
  - Nested `@container` contexts causing reference point failures
  - Mix of hardcoded sizes, fluid classes, and arbitrary values

**Project context**:
- Next.js 15.5.6 frontend
- Tailwind CSS v4.1.14
- Primary files affected:
  - @./frontend/src/app/globals.css
  - @./frontend/src/app/layout.tsx
  - @./frontend/src/app/about/components/ScrollingSections.tsx
  - @./frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx
  - @./frontend/tailwind.config.js
</context>

<requirements>
1. **Comprehensive Discovery**
   - Grep for ALL instances of responsive text patterns across frontend
   - Find every `text-[clamp(...)]`, `text-fluid-*`, `--text-*`, `--font-size-*`
   - Identify all `@container` usage and nesting patterns
   - Locate all viewport meta configurations
   - Find any fontSize configurations in tailwind.config.js

2. **Conflict Identification**
   - Map out every different responsive approach currently in use
   - Identify which approaches conflict with each other
   - Determine which approaches contradict the research findings
   - Document why each conflict prevents the system from working

3. **Systematic Removal**
   - Remove ALL broken or conflicting implementations
   - Based on research findings, determine what (if anything) should be preserved
   - Clean up CSS custom properties that don't generate utilities
   - Remove conflicting tailwind.config.js fontSize entries
   - Fix or remove problematic viewport meta tags
   - Eliminate nested container contexts
   - Strip out all arbitrary value clamp() instances using wrong units

4. **Image System Audit**
   - Examine current image centering approaches
   - Identify why images move off-screen during viewport changes
   - Document current Flexbox/Grid patterns
   - Remove any conflicting layout systems

5. **Documentation**
   - Create an audit report documenting:
     - What was found
     - What was removed and WHY
     - What (if anything) was preserved and WHY
     - Verification that conflicts are eliminated
</requirements>

<implementation>
**Step-by-step process**:

1. **Read research findings**
   - Understand the recommended approach from 005-research
   - Identify anti-patterns that must be removed

2. **Discovery phase**
   ```bash
   # Search patterns (examples - adapt based on research):
   grep -r "text-\[clamp" frontend/src/
   grep -r "text-fluid-" frontend/src/
   grep -r "@container" frontend/src/
   grep -r "cqi\|cqw\|cqh" frontend/src/
   ```

3. **Create audit document**: `./audit/responsive-system-conflicts.md`
   - List every conflicting pattern found
   - Explain WHY each is problematic based on research
   - Note file locations and line numbers

4. **Systematic cleanup**
   - Remove in this order:
     a. Conflicting CSS custom properties in globals.css
     b. Broken fontSize config in tailwind.config.js
     c. All arbitrary value `text-[clamp(...)]` instances
     d. Nested `@container` contexts
     e. Problematic viewport meta tags
     f. Any other conflicts identified

5. **Verification**
   - After cleanup, search again to confirm removal
   - Document the clean state
   - Verify no unintended removals occurred

**What to avoid and WHY**:
- ❌ Don't remove anything without documenting it first - we need an audit trail
- ❌ Don't preserve "partial solutions" - clean slate is better than conflicts
- ❌ Don't assume - verify every removal against the research findings
- ❌ Don't touch unrelated code - surgical precision only
</implementation>

<output>
Create/modify files:

1. **Audit report**: `./audit/responsive-system-conflicts.md`
   - Complete inventory of conflicts found
   - Explanation of why each is problematic
   - Documentation of what was removed

2. **Modified files**:
   - `./frontend/src/app/globals.css` - Clean `@theme` block
   - `./frontend/src/app/layout.tsx` - Fixed viewport meta if needed
   - `./frontend/tailwind.config.js` - Removed conflicting fontSize config
   - `./frontend/src/app/about/components/ScrollingSections.tsx` - All responsive text removed
   - `./frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx` - All responsive text removed

3. **Cleanup summary**: `./audit/cleanup-summary.md`
   - Before/after comparison
   - What was removed from each file
   - Verification that conflicts are eliminated
   - Confirmation the codebase is ready for implementation
</output>

<verification>
Before declaring complete:

1. **Search verification**
   ```bash
   # Verify no arbitrary clamp() values remain
   ! grep -r "text-\[clamp" frontend/src/

   # Verify no old fluid class references
   ! grep -r "text-fluid-" frontend/src/

   # Check @container usage is clean
   grep -r "@container" frontend/src/
   ```

2. **File checks**
   - Read each modified file to confirm only intended changes
   - Verify no syntax errors introduced
   - Confirm no unrelated code affected

3. **Audit documentation**
   - Complete audit report exists
   - Cleanup summary documents all changes
   - Future developer could understand what was removed and why

4. **Research alignment**
   - Verify removals align with research anti-patterns
   - Confirm preserved elements align with best practices
   - No contradictions between cleanup and research findings

**Success test**: Could the next prompt implement a clean responsive system without encountering any conflicts? If no, clean more aggressively.
</verification>

<success_criteria>
1. ✓ Zero conflicting responsive text implementations remain
2. ✓ All broken patterns identified in research are removed
3. ✓ Complete audit trail documents what was removed and why
4. ✓ Codebase is in clean state ready for new implementation
5. ✓ No unintended code deletions occurred
6. ✓ Image system issues are documented even if not yet fixed
7. ✓ Verification confirms conflicts are eliminated
</success_criteria>
