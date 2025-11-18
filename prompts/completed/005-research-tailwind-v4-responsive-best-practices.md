<research_objective>
Conduct comprehensive web research to identify the definitive best practices for implementing fluid, responsive typography and layout systems in Tailwind CSS v4.

**Why this matters**: Previous implementation attempts have failed because they were based on assumptions rather than proven Tailwind v4 patterns. This research will establish the ground truth for how Tailwind v4 actually works, preventing further wasted effort.

**End goal**: Create an authoritative research document that will guide a complete system overhaul, ensuring text scales smoothly across viewports and images remain properly proportioned and centered.

Thoroughly explore multiple authoritative sources and consider various approaches. Document not just WHAT works, but WHY it works and what common pitfalls to avoid.
</research_objective>

<scope>
Research focus areas:

1. **Tailwind v4 Configuration Architecture**
   - How `@theme` blocks work vs v3's `tailwind.config.js`
   - CSS custom property naming conventions (e.g., `--text-*` vs `--font-size-*`)
   - When JIT compiler generates utility classes vs when it doesn't
   - How arbitrary values like `text-[clamp(...)]` interact with the system

2. **Fluid Typography Systems**
   - Viewport units (`vw`, `vh`, `vmin`, `vmax`) - when to use each
   - Container query units (`cqi`, `cqw`, `cqh`) - when they work and when they fail
   - `clamp()` function best practices for smooth scaling
   - Accessibility considerations (rem + vw combinations for zoom support)
   - Common failure modes (hard jumps, no scaling, wrong reference points)

3. **Container Query Systems**
   - When to use `@container` classes
   - Container nesting patterns and anti-patterns
   - Why container query units might not work (missing width, nested contexts)
   - Viewport-based vs container-based responsive design trade-offs

4. **Image Centering & Proportional Scaling**
   - How images should respond to viewport changes
   - Flexbox vs Grid for image layout in responsive contexts
   - Maintaining aspect ratios while keeping images centered
   - Common issues with images moving off-screen

5. **Tailwind v4 Specific Gotchas**
   - Why custom utility classes might not generate
   - Conflicts between different responsive approaches
   - What must be in CSS vs what must be in config
   - How to verify classes are actually being generated

**Prioritize**: Official Tailwind v4 documentation, Tailwind Labs blog posts, authoritative CSS articles from 2024-2025. Avoid outdated v3 patterns.

**Time period**: Focus on Tailwind v4 specifically (released 2024+). Flag any v3 patterns as deprecated.
</scope>

<research_method>
1. **Web search strategy**:
   - Search for "Tailwind CSS v4 fluid typography best practices"
   - Search for "Tailwind v4 container queries responsive design"
   - Search for "Tailwind v4 @theme custom properties"
   - Search for "CSS clamp() fluid typography 2024"
   - Search for "container query units vs viewport units"

2. **For each finding**:
   - Document the source URL and date
   - Extract specific code examples
   - Note WHY the pattern works (technical explanation)
   - Identify anti-patterns and WHY they fail
   - Flag any version-specific considerations

3. **Synthesis**:
   - Compare approaches across sources
   - Identify consensus best practices
   - Note any contradictions and research further to resolve
   - Create a unified mental model of how the system should work
</research_method>

<deliverables>
Create a comprehensive research document at: `./research/tailwind-v4-responsive-systems.md`

Structure:

```markdown
# Tailwind v4 Responsive Systems Research

## Executive Summary
[3-5 key findings that will guide implementation]

## 1. Tailwind v4 Architecture

### How @theme Works
[Detailed explanation with examples]

### CSS Custom Property Naming
[Required patterns, what generates utilities, what doesn't]

### JIT Compilation Behavior
[When classes generate, when they don't, how to force generation]

## 2. Fluid Typography Best Practices

### Recommended Approach
[The definitive pattern to use, with code example]

### Why This Works
[Technical explanation]

### Common Failure Modes
[What doesn't work and WHY - with examples]

### Accessibility Considerations
[How to make it work with browser zoom]

## 3. Container Queries vs Viewport Units

### When to Use Container Queries
[Specific use cases]

### When to Use Viewport Units
[Specific use cases]

### Anti-Patterns
[What causes cqi to fail, nested container issues, etc.]

## 4. Image Layout Best Practices

### Keeping Images Centered
[Flexbox/Grid patterns]

### Maintaining Proportions
[Aspect ratio techniques]

### Common Pitfalls
[Why images move off-screen]

## 5. Recommended System Architecture

### Overall Approach
[Viewport-based vs container-based decision]

### File Structure
[Where definitions go: globals.css vs tailwind.config.js vs inline]

### Implementation Pattern
[Step-by-step structure for clean implementation]

## 6. Anti-Pattern Catalog

### Do NOT Do This
[Specific patterns to avoid with explanations WHY]

## Sources
[Numbered list of all sources with URLs and dates]
```
</deliverables>

<verification>
Before completing, verify:

- ✓ At least 5 authoritative sources consulted
- ✓ All sources are Tailwind v4 specific or CSS fundamentals (no v3 patterns)
- ✓ Code examples are included for every best practice
- ✓ WHY explanations provided for each recommendation
- ✓ Anti-patterns are documented with reasons they fail
- ✓ Clear recommendation on viewport vs container approach
- ✓ Accessibility considerations addressed
- ✓ All claims are backed by sources

**Test question**: Could a developer read this research and implement a responsive system without making the same mistakes that led to this research?

If no, research deeper until yes.
</verification>

<success_criteria>
1. Research document provides clear, actionable guidance
2. Definitive answer on whether to use viewport or container units
3. Explains WHY previous approaches failed
4. Provides specific code patterns to follow
5. Identifies all anti-patterns to avoid
6. Gives verification steps to confirm implementation works
</success_criteria>
