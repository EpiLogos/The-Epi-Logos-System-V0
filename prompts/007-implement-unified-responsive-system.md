<objective>
Implement a production-ready, unified responsive system for text and images based on research-backed Tailwind v4 best practices, ensuring text scales smoothly across all viewport sizes and images remain properly proportioned and centered.

**Why this matters**: This is the final implementation after research and cleanup. It must work correctly on first try because it's based on proven patterns rather than assumptions.

**Who needs this**: End users viewing the site at any viewport size from mobile (375px) to large desktop (1920px+) must have optimal reading experience with properly visible text and centered images.

**End goal**: A functioning responsive system where:
- Text scales smoothly without hard jumps
- Text remains readable and properly sized at all viewports
- Images stay centered and proportioned when viewport changes
- Base sizes are configurable while maintaining responsive logic
- System is maintainable and follows Tailwind v4 conventions
</objective>

<context>
**Prerequisites**: This prompt MUST run AFTER prompts 005 (research) AND 006 (cleanup) complete.

Required reading before implementation:
- @./research/tailwind-v4-responsive-systems.md - The authoritative best practices
- @./audit/responsive-system-conflicts.md - What was wrong before
- @./audit/cleanup-summary.md - Current clean state

**Project context**:
- Next.js 15.5.6 with Tailwind CSS v4.1.14
- Clean codebase after prompt 006 removed all conflicts
- Primary implementation files:
  - @./frontend/src/app/globals.css (Tailwind v4 @theme configuration)
  - @./frontend/src/app/about/components/ScrollingSections.tsx (content component)
  - @./frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx (layout component)
  - @./frontend/src/app/layout.tsx (viewport meta if relevant)

**Current state**: Clean slate ready for implementation
</context>

<requirements>
1. **Follow Research Findings EXACTLY**
   - Implement the recommended approach from research document
   - Use the specific patterns and code examples from research
   - Avoid ALL anti-patterns identified in research
   - Use correct CSS custom property naming conventions
   - Implement correct clamp() formulas for smooth scaling

2. **Text Responsiveness**
   - Text must scale smoothly (no hard jumps between breakpoints)
   - Must remain visible and readable at ALL viewport sizes
   - Default sizes should be ~15% smaller than standard
   - Support configurable base sizes for different text sections
   - Maintain proportional relationships between heading/body sizes

3. **Image System**
   - Images must remain centered during viewport changes
   - Images must maintain proper aspect ratios
   - Images must not move off-screen or clip unexpectedly
   - Layout must be responsive to viewport changes

4. **Architecture Requirements**
   - Single source of truth for responsive logic
   - Maintainable and well-documented
   - Follows Tailwind v4 conventions exactly
   - No conflicting systems or approaches
   - Clean separation between configuration and usage

5. **Accessibility**
   - Must support browser zoom (if research indicates rem+vw needed)
   - Must maintain readability at all sizes
   - Must not break with user font size preferences
</requirements>

<implementation>
**Step-by-step process**:

1. **Review research findings**
   - Identify THE recommended pattern (viewport vs container based)
   - Note specific clamp() formulas that work
   - Understand why the pattern works
   - Review all anti-patterns to avoid

2. **Configure Tailwind v4 foundation**
   - Implement in `./frontend/src/app/globals.css` following research
   - Use correct CSS custom property namespace
   - Set up base responsive scale
   - Ensure JIT will generate utilities (verify against research)

3. **Implement text scaling system**
   - Apply to ScrollingSections.tsx
   - Apply to interactive-scrolling-story-component.tsx
   - Use consistent approach across all text elements:
     - Body paragraphs
     - Section headings
     - Hero headings
     - Buttons/links
     - Subtitles
   - Maintain proportional size relationships

4. **Implement image centering system**
   - Fix layout in interactive-scrolling-story-component.tsx
   - Ensure Flexbox/Grid follows best practices from research
   - Test that images stay centered across viewport changes
   - Verify aspect ratios are maintained

5. **Create configurable base sizes**
   - Allow easy adjustment of base sizes
   - Maintain responsive scaling logic when bases change
   - Document how to adjust for different sections

6. **Testing and verification**
   - Test at mobile (375px)
   - Test at tablet (768px)
   - Test at desktop (1024px, 1440px, 1920px)
   - Verify smooth scaling with no jumps
   - Verify images stay centered
   - Test browser zoom functionality

**Implementation notes based on research**:
[Adapt this section based on what prompt 005 discovers]

- Use [viewport/container] units because [reason from research]
- clamp() formula pattern: `clamp(MIN, BASE + SCALE*[unit], MAX)`
- Configuration goes in [specific location based on research]
- Avoid [anti-patterns from research]

**Critical: Do NOT**
- ❌ Use patterns contradicting the research
- ❌ Mix viewport and container approaches (pick one based on research)
- ❌ Assume anything - follow research exactly
- ❌ Create nested container contexts (if research says avoid)
- ❌ Use wrong CSS custom property namespace
- ❌ Implement without testing across full viewport range
</implementation>

<output>
Implement the following:

1. **Core configuration**: `./frontend/src/app/globals.css`
   - Tailwind v4 `@theme` block with correct responsive scale
   - CSS custom properties following v4 conventions
   - Clean, well-commented implementation

2. **Content component**: `./frontend/src/app/about/components/ScrollingSections.tsx`
   - All text elements using responsive system
   - Consistent size hierarchy
   - Smooth scaling across viewports

3. **Layout component**: `./frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx`
   - Responsive text implementation
   - Fixed image centering system
   - Proper container/flexbox structure

4. **Documentation**: `./docs/responsive-system-implementation.md`
   - How the system works
   - How to adjust base sizes
   - Maintenance guidelines
   - Verification checklist

5. **Implementation notes**: `./docs/implementation-notes.md`
   - What pattern was chosen and why
   - Key decisions made
   - Testing results
   - Any deviations from research (with justification)
</output>

<verification>
Before declaring complete, thoroughly verify:

1. **Functional testing**
   ```bash
   # Start dev server if not running
   ! npm run dev:frontend

   # Check rendered output
   ! curl -s http://localhost:3000/about | grep -o 'class="[^"]*text-[^"]*"' | head -20
   ```

2. **Visual verification** (document in implementation notes)
   - Open http://localhost:3000/about in browser
   - Resize from 375px to 1920px width
   - Text scales smoothly? (YES/NO - if NO, fix)
   - No hard jumps between sizes? (YES/NO - if NO, fix)
   - Images stay centered? (YES/NO - if NO, fix)
   - Images maintain proportions? (YES/NO - if NO, fix)

3. **Code quality**
   - No conflicting responsive approaches?
   - Follows research patterns exactly?
   - Well-documented and maintainable?
   - No anti-patterns from research?

4. **Accessibility**
   - Browser zoom works correctly?
   - Text remains readable at all sizes?
   - No user font size conflicts?

5. **Configuration test**
   - Adjust a base size and verify responsive logic maintains
   - Document that configuration works as intended

**Critical**: Do NOT mark complete unless ALL verification checks pass. If anything fails, debug and fix before completing.

**Testing checklist** (must complete):
- [ ] Text scales smoothly from 375px to 1920px
- [ ] No hard size jumps at any width
- [ ] Images stay centered at all widths
- [ ] Images maintain aspect ratios
- [ ] Browser zoom works correctly
- [ ] Base sizes are configurable
- [ ] No console errors
- [ ] Follows research patterns exactly
- [ ] Documentation is complete
- [ ] Implementation notes explain decisions
</verification>

<success_criteria>
1. ✓ Text scales smoothly across full viewport range with no jumps
2. ✓ Text remains properly sized and readable at all viewports
3. ✓ Images stay centered and proportioned during viewport changes
4. ✓ System follows research-backed Tailwind v4 best practices
5. ✓ Base sizes are configurable while maintaining responsive logic
6. ✓ Zero conflicts or anti-patterns present
7. ✓ Browser zoom and accessibility work correctly
8. ✓ Implementation is maintainable and well-documented
9. ✓ All verification tests pass
10. ✓ User can resize browser and see smooth, proper responsive behavior

**Ultimate test**: User resizes browser from mobile to desktop and says "yes, this works correctly now" - not "it's still broken" or "nothing changed".
</success_criteria>
