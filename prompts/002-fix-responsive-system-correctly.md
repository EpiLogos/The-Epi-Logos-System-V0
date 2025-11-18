<objective>
Fix the responsive typography and layout system at the CORRECT architectural level. The previous attempt failed because:

1. **Font sizes were changed at the wrong layer** - Modified `--font-size-base` in globals.css, but the actual text classes (`text-fluid-*`) use hardcoded `clamp()` values in tailwind.config.js that IGNORE the base
2. **Image centering logic is flawed** - Using percentage-based max-widths (`max-w-[90%]`) doesn't maintain proper horizontal centering as viewport shrinks
3. **No true viewport responsiveness** - The `clamp()` values are static calculations that don't create proportional scaling relationships

**This time**: Fix at the layer where the system ACTUALLY operates - the Tailwind config fluid typography definitions and the component container logic.
</objective>

<context>
Project: Next.js 15 + React 18 + TypeScript + Tailwind CSS v4
Files that ACTUALLY control responsive behavior:

**Typography Layer (CRITICAL):**
- `@frontend/tailwind.config.js` - Lines 36-51 define `fluid-*` font sizes using `clamp()` - THIS is where font scaling happens
- The base font-size in globals.css is IRRELEVANT because these clamp() values are absolute calculations

**Layout/Container Layer:**
- `@frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx` - Lines 325-336 define image container logic
- `@frontend/src/app/about/components/ScrollingSections.tsx` - Lines 104-144 define text content containers

**What's actually broken:**
1. The `clamp()` formulas in tailwind.config.js don't scale meaningfully - they jump between fixed min/max values
2. Image container uses `max-w-[90%]` which shrinks the container but doesn't maintain centering properly
3. Content containers don't maintain proportional width relationships across viewports
</context>

<requirements>
1. **Fix Typography at the Right Layer**
   - Modify the `clamp()` calculations in `tailwind.config.js` lines 43-51 to be ~20% smaller
   - Ensure the clamp formulas create SMOOTH proportional scaling, not just jumps between min/max
   - Test that text actually gets smaller at all viewport sizes (not just at breakpoints)

2. **Fix Image Container Logic**
   - The container at line 326-329 in interactive-scrolling-story-component.tsx needs FIXED centering
   - Replace percentage-based approach with container logic that MAINTAINS horizontal center position
   - Images should stay centered as viewport narrows, NOT "move down off screen"

3. **Fix Content Container Proportions**
   - Text content containers in ScrollingSections.tsx (lines 293) use `w-full md:w-[85%] lg:w-[80%]`
   - These need to scale proportionally so spatial relationships are maintained
   - Width should be a function of viewport width, not hardcoded percentages at breakpoints

**WHY this matters:**
- Typography: Users see NO size change because we modified a variable that nothing uses
- Images: The "moving down" happens because max-width shrinks the container but flexbox centering can't compensate
- Containers: Jumping between breakpoint widths breaks the proportional feel of the layout
</requirements>

<implementation>
**Step 1: Fix Typography in tailwind.config.js**

Current broken approach:
```js
'fluid-base': 'clamp(0.6rem, 0.5rem + 0.24vw, 0.7rem)', // These are 20% reduced but DON'T WORK
```

Why it doesn't work: The base font-size change doesn't propagate to these hardcoded calculations.

**Correct approach:**
- Recalculate ALL clamp() values in lines 43-51 to be 20% smaller than the ORIGINAL values (not the already-modified ones)
- Original values were: `fluid-xs: 8-10px`, `fluid-sm: 10-12px`, `fluid-base: 12-14px`, etc.
- New values should be: `fluid-xs: 6.4-8px`, `fluid-sm: 8-9.6px`, `fluid-base: 9.6-11.2px`, etc.
- Convert to rem: divide by 16 (browser default), not by 12.8 (the broken base we set)

Example fix:
```js
// OLD (broken): 'fluid-base': 'clamp(0.6rem, 0.5rem + 0.24vw, 0.7rem)'
// NEW (correct): 'fluid-base': 'clamp(0.6rem, 0.5rem + 0.5vw, 0.7rem)' // 9.6px → 11.2px
```

**Step 2: Fix Image Centering in interactive-scrolling-story-component.tsx**

Current broken approach (line 326-329):
```tsx
<div className="... max-w-[90%] max-h-[85vh] w-auto h-auto">
  <img className="max-w-full max-h-[85vh] w-auto h-auto object-contain mx-auto" />
</div>
```

Why it doesn't work: Outer div shrinks with viewport, but centering is only maintained by the parent flexbox which can't compensate when the div itself is moving.

**Correct approach:**
- Use `width: fit-content` on the outer container so it wraps the image exactly
- Add explicit `margin: 0 auto` to FORCE horizontal centering independent of viewport
- Remove the percentage-based max-width that's causing the "moving" behavior

Example fix:
```tsx
<div className="... mx-auto" style={{ width: 'fit-content', maxWidth: '90%', maxHeight: '85vh' }}>
  <img className="max-w-full max-h-[85vh] w-auto h-auto object-contain" />
</div>
```

**Step 3: Fix Content Container Proportions in ScrollingSections.tsx**

Current broken approach (line 293):
```tsx
<div className="w-full md:w-[85%] lg:w-[80%] ...">
```

Why it doesn't work: Jumps between 100% → 85% → 80% at breakpoints, no smooth scaling.

**Correct approach:**
- Use a width formula that scales proportionally: `width: clamp(70%, 90vw - 2rem, 85%)`
- This maintains proportional relationships across ALL viewport sizes, not just at breakpoints

Example fix:
```tsx
<div className="flex flex-col py-4 md:py-6 lg:py-8 mt-8 md:mt-10 lg:mt-12 mb-4 md:mb-6 lg:mb-8"
     style={{ width: 'clamp(70%, calc(100vw - 4rem), 85%)' }}>
```

**What to avoid:**
- DON'T modify globals.css base font-size again - it doesn't affect the clamp() values
- DON'T use percentage-based max-widths for image containers - they break centering
- DON'T use breakpoint-only width classes - use clamp() for smooth scaling
</implementation>

<output>
Modify these files ONLY:
- `./frontend/tailwind.config.js` - Lines 43-51 (fluid typography clamp values)
- `./frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx` - Lines 325-336 (image container)
- `./frontend/src/app/about/components/ScrollingSections.tsx` - Line 293 (content container width)

Optional: Revert the broken changes in globals.css if they're still there (lines 65-66, 772)
</output>

<verification>
Before declaring complete, TEST at these viewport widths IN THE BROWSER:

1. **Typography Test (compare before/after):**
   - Open dev tools, set viewport to 1920px width
   - Measure the actual rendered font size of text with class `text-fluid-base`
   - Resize viewport to 1280px → font should be visibly smaller
   - Resize to 768px → font should be even smaller
   - **Success**: Text shrinks ~20% at each viewport compared to original

2. **Image Centering Test:**
   - Load a scrolling section with an image
   - Slowly resize viewport from 1920px → 768px
   - Watch the image horizontal position
   - **Success**: Image stays horizontally centered, doesn't "move down off screen"

3. **Container Proportions Test:**
   - Observe text content container width at 1920px
   - Resize to 1440px → container should scale proportionally (not jump)
   - Resize to 1024px → smooth scaling continues
   - **Success**: No sudden jumps, proportional scaling across all sizes

Run dev server with: `npm run dev`
Test in browser at: http://localhost:3000/about
</verification>

<success_criteria>
- Text rendered in browser is actually ~20% smaller than original at ALL viewport sizes
- Images remain horizontally centered as viewport shrinks (no vertical shifting)
- Content containers scale smoothly without breakpoint jumps
- Changes made at the layer where the system ACTUALLY operates (tailwind config, not globals.css base)
- User can resize browser window and see smooth, proportional scaling behavior
</success_criteria>
