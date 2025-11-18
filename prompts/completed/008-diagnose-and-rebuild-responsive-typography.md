<objective>
Completely diagnose the current broken responsive typography system and rebuild it from scratch with a working, intelligent viewport-based text scaling solution.

The current system is fundamentally broken:
- Text doesn't scale with viewport changes
- Multiple conflicting systems are present
- Text sizes are inconsistent across sections
- The implemented hook-based approach isn't working
- Changes to scale factors have no effect

This requires a FULL DIAGNOSIS of what's actually happening, followed by a complete rebuild with a proven approach.
</objective>

<context>
**Technology Stack:**
- Next.js 15.5.6
- React 18
- Tailwind CSS v4
- TypeScript

**Current Broken Implementation:**
- Hook: `@frontend/src/hooks/useDynamicFontSize.tsx` - calculates fontSize based on viewport area
- Component: `@frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx` - sets CSS variable
- Content: `@frontend/src/app/about/components/ScrollingSections.tsx` - paragraphs reference the variable
- Content: `@frontend/src/app/about/components/EssayScrollingSections.tsx` - essay section

**Previous Failed Approaches:**
1. CSS clamp() with viewport units - didn't scale smoothly
2. Container queries - didn't work
3. ResizeObserver with container dimensions - overcomplicated, broke layout
4. Current viewport area formula - appears to not be working at all

**User Requirements:**
- Text size proportional to viewport VOLUME (width × height)
- ONE scale variable to tune the entire system
- Should scale smoothly as viewport changes (not just at breakpoints)
- All text sections should be the same size
- Must actually work
</context>

<phase_1_diagnosis>
## Step 1: Verify Hook Execution

First, determine if the hook is even running:

1. Check browser console for `[FONT DEBUG]` logs
2. If no logs appear, the hook isn't running - investigate why:
   - Is the component mounting?
   - Is there a React error preventing execution?
   - Is the import correct?

## Step 2: Verify CSS Variable Setting

Check if the CSS variable is actually being set in the DOM:

1. Open browser DevTools
2. Inspect the container element that should have `--dynamic-font-size`
3. Check computed styles for the custom property
4. Verify the value is in pixels and reasonable

## Step 3: Verify CSS Variable Inheritance

Check if paragraph elements are receiving the variable:

1. Inspect paragraph elements in DevTools
2. Check if `fontSize: var(--dynamic-font-size)` is in inline styles
3. Check if the computed fontSize shows the expected value
4. Look for any conflicting CSS rules overriding it

## Step 4: Identify All Conflicting Systems

Search the entire codebase for:

1. Hardcoded Tailwind text size classes (`text-sm`, `text-lg`, etc.)
2. CSS `font-size` rules in stylesheets
3. Other custom properties related to font sizing
4. Responsive breakpoints that might override sizing
5. Any other hooks or systems managing text size

Document EVERY conflict found with file:line references.

## Step 5: Check for Tailwind CSS Configuration Issues

1. Examine `@frontend/tailwind.config.js` for font size definitions
2. Check if Tailwind is generating utilities that conflict
3. Look for theme customizations affecting typography

## Step 6: Trace the Data Flow

Follow the complete chain from hook to rendered text:

1. Hook calculates fontSize → verify calculation logic
2. Hook returns fontSize → verify return value
3. Component receives fontSize → verify destructuring
4. Component sets CSS variable → verify inline style syntax
5. Paragraphs reference CSS variable → verify style attribute syntax
6. Browser renders text → verify actual pixel size

Create a complete diagnostic report with findings from each step.
</phase_1_diagnosis>

<phase_2_solution_design>
Based on the diagnosis, design a NEW system that will actually work:

## Requirements for New System:

1. **Single Source of Truth**: ONE place to change the scale
2. **Immediate Response**: Updates on viewport resize without breakpoint dependencies
3. **Universal Application**: Applies to ALL text in the scrolling sections
4. **Simple Formula**: fontSize = sqrt(viewportWidth × viewportHeight) × SCALE_FACTOR
5. **No Conflicts**: Remove/disable ALL competing systems
6. **Verifiable**: Easy to debug and confirm it's working

## Design Decisions:

Consider these approaches and choose the best one based on your diagnosis:

**Option A: Fix Current Hook-Based Approach**
- Pros: Already partially implemented
- Cons: If fundamentally broken, might be faster to rebuild

**Option B: Pure CSS Solution**
- Use calc() with viewport units directly
- Pros: No JavaScript, simpler
- Cons: Previous attempts failed, might not support area-based formula

**Option C: Global Style Injection**
- Create a useEffect that injects a <style> tag with font-size rules
- Pros: Avoids CSS variable scoping issues
- Cons: More invasive

**Option D: Context Provider with Direct Prop Passing**
- Pass fontSize directly to each paragraph via props
- Pros: Explicit, debuggable
- Cons: Requires updating many components

Choose the approach that will ACTUALLY WORK based on your findings.
</phase_2_solution_design>

<implementation>
## Step 1: Clean Up All Conflicts

Before implementing the new system:

1. Remove ALL hardcoded Tailwind text size classes from ScrollingSections.tsx
2. Remove ALL font-size CSS rules from globals.css
3. Remove conflicting custom properties
4. Comment out or remove broken hook if replacing it
5. Document what you removed and why

## Step 2: Implement New System

Based on your chosen approach, implement with:

1. Clear console logging to verify each step
2. Explicit comments explaining the logic
3. Single constant for scale factor (make it OBVIOUS where to change it)
4. Error handling for edge cases

## Step 3: Apply Universally

Ensure the new system applies to:

- All paragraphs in ScrollingSections.tsx
- Essay descriptions in EssayScrollingSections.tsx
- Any other text in the scrolling story component
- Maintain the 0.88 multiplier for italic closing paragraphs

## Step 4: Remove Debug Logging

Once verified working, clean up console.log statements.
</implementation>

<verification>
Before declaring success, verify:

1. **Console Shows Calculations**: Debug logs show fontSize changing as viewport resizes
2. **DOM Reflects Changes**: Inspecting elements shows fontSize updating in real-time
3. **Text Visually Scales**: Actually watch the text size change as you resize the window
4. **All Sections Match**: Every text section has the same base size
5. **Scale Factor Works**: Changing SCALE_FACTOR immediately affects text size
6. **No Breakpoint Dependency**: Scaling happens smoothly, not just at sm/md/lg breakpoints

## Test Scenarios:

1. Resize window from mobile to desktop width - text should scale smoothly
2. Change SCALE_FACTOR constant - text should immediately resize
3. Check all 4 story sections - all paragraphs should match in size
4. Verify italic endings are exactly 0.88 × base size
5. Hard refresh (Cmd+Shift+R) - system should work from cold start

If ANY of these fail, the system is not working.
</verification>

<output>
Provide a comprehensive diagnostic report covering:

1. **What Was Broken**: Detailed explanation of every issue found
2. **Why It Was Broken**: Root cause analysis
3. **What Was Changed**: Every file modified with before/after
4. **How It Works Now**: Clear explanation of the new system
5. **How to Tune It**: Explicit instructions for adjusting text size

Save diagnostic findings to: `./memory/responsive-typography-diagnosis-2024-11.md`

Modified files should include:
- `./frontend/src/hooks/useDynamicFontSize.tsx` (or replacement)
- `./frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx`
- `./frontend/src/app/about/components/ScrollingSections.tsx`
- `./frontend/src/app/about/components/EssayScrollingSections.tsx`
- `./frontend/src/app/globals.css`
- `./frontend/tailwind.config.js` (if needed)
</output>

<success_criteria>
The system is successful when:

1. ✓ Text size changes smoothly as viewport is resized
2. ✓ All text sections are the same base size
3. ✓ One constant controls the entire system
4. ✓ No conflicts with Tailwind or other CSS
5. ✓ Works reliably on page load and refresh
6. ✓ User can easily tune the scale by changing ONE number
7. ✓ System is simple enough to understand and maintain

**MOST IMPORTANT**: The user should be able to resize their browser window and watch the text scale in real-time. If this doesn't happen, the system DOES NOT WORK.
</success_criteria>
