<objective>
Fix the core responsive design system affecting typography scaling and layout behavior across viewport dimensions. Address three interconnected issues:
1. Reduce default font sizes globally by ~20%
2. Fix horizontal image centering in scrolling sections that breaks as viewport narrows
3. Establish proper proportional responsive behavior for text and layout elements

This is critical for the desktop-first landing page experience, as mobile optimization depends on getting the core responsive mechanics working correctly first.
</objective>

<context>
Project: Next.js 15 + React 18 + TypeScript + Tailwind CSS v4
Target: Landing page with scrolling sections component

Current problems indicate systemic issues with:
- Base typography scaling system (likely in globals.css or tailwind.config)
- Container logic for responsive layouts (possibly in ScrollingSections or parent containers)
- Image positioning within flex/grid containers that doesn't maintain horizontal centering

Read @CLAUDE.md for project conventions and Tailwind v4 syntax requirements.

Key files to examine:
@frontend/src/app/globals.css
@frontend/tailwind.config.js
@frontend/src/app/about/components/ScrollingSections.tsx
@frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx
@frontend/src/app/layout.tsx
</context>

<requirements>
1. **Global Typography Fix**
   - Reduce base font sizes by approximately 20% across all breakpoints
   - Ensure typography scales proportionally with viewport changes
   - Maintain readability and hierarchy relationships
   - Use Tailwind v4 @theme syntax (never v3 @tailwind directives)

2. **Image Horizontal Centering**
   - Images in scrolling sections must maintain horizontal centering as viewport width decreases
   - Fix the issue where images "move down off screen" when page width is reduced
   - Ensure proper behavior up to the mobile image-hidden breakpoint

3. **Core Responsive Container Logic**
   - Investigate and fix underlying container/layout system that's preventing proper proportional scaling
   - Ensure all elements scale responsively relative to viewport dimensions
   - Desktop-focused implementation (mobile will be addressed after core system works)

WHY this matters: The current system doesn't have proper responsive foundations. Band-aid fixes won't work—we need to fix the underlying container logic and scaling system so elements render proportionally at any viewport size.
</requirements>

<implementation>
**Approach:**

1. **Thoroughly analyze** the current responsive system:
   - How is base font sizing configured? (rem, px, clamp()?)
   - What container widths/max-widths are constraining layout?
   - How are images positioned within their containers?
   - Are there conflicting responsive utilities or custom CSS?

2. **Identify root causes** before implementing fixes:
   - Typography: Likely in globals.css @theme or tailwind.config theme extend
   - Image centering: Probably flex/grid container behavior in ScrollingSections
   - Responsive scaling: May involve container queries, viewport units, or breakpoint logic

3. **Fix typography scaling system**:
   - Update base font sizes in @theme (Tailwind v4 syntax only)
   - Consider using fluid typography with clamp() for smooth scaling
   - Ensure all text elements inherit responsive behavior

4. **Fix image centering mechanics**:
   - Review flex/grid alignment properties
   - Check for fixed widths/heights that break responsive behavior
   - Ensure horizontal centering is maintained via proper CSS (mx-auto, justify-center, etc.)

5. **Validate container logic**:
   - Check for overly restrictive max-widths
   - Ensure containers use responsive units
   - Verify no absolute positioning breaking layout flow

**What to avoid and WHY:**
- Never use Tailwind v3 syntax (@tailwind base/components/utilities) - Tailwind v4 uses @import "tailwindcss" and @theme blocks
- Don't apply inline style fixes - fix the underlying system so all components benefit
- Avoid fixed pixel values that don't scale - use relative units (rem, %, viewport units)
- Don't add breakpoint-specific band-aids without fixing the core logic first
</implementation>

<output>
Modify existing files as needed:
- `./frontend/src/app/globals.css` - Typography scaling system
- `./frontend/tailwind.config.js` - Theme configuration if needed
- `./frontend/src/app/about/components/ScrollingSections.tsx` - Image centering fixes
- `./frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx` - Container logic fixes
- `./frontend/src/app/layout.tsx` - Root layout adjustments if needed

Do NOT create new files unless absolutely necessary - prefer editing existing components.
</output>

<verification>
Before declaring complete, verify your work by testing at multiple viewport widths:

1. **Typography verification:**
   - Text is ~20% smaller than before at all sizes
   - Text scales proportionally as viewport changes
   - No breaking at standard breakpoints (tablet, desktop, wide)

2. **Image centering verification:**
   - Images remain horizontally centered as viewport narrows
   - No "moving down off screen" behavior
   - Images maintain proper positioning up to mobile breakpoint

3. **Responsive scaling verification:**
   - All elements scale proportionally with viewport changes
   - No layout breaks or unexpected wrapping
   - Desktop view maintains proper proportions at various widths

Test at these viewport widths: 1920px, 1440px, 1280px, 1024px, 768px (before mobile cutoff)
</verification>

<success_criteria>
- Base font sizes reduced by ~20% globally
- Images in scrolling sections maintain horizontal centering at all desktop viewport widths
- Text and layout elements scale proportionally with viewport changes
- No hardcoded values or breakpoint-specific fixes - solution should work via proper responsive system
- Desktop-focused implementation ready for mobile optimization next phase
</success_criteria>
