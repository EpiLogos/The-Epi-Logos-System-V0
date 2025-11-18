<objective>
Implement a TRUE container-aware responsive typography system using CSS Container Queries. This is the proper solution - text should scale based on its PARENT CONTAINER size, which is tied to viewport size, creating a cascading responsive system.

**The Real Fix**: Current system uses viewport units (`vw`) which don't account for container width changes. Container queries let text respond to its parent container's size, creating proper proportional scaling as layouts reflow.
</objective>

<context>
Project: Next.js 15 + React 18 + TypeScript + Tailwind CSS v4
**Container Queries Plugin**: Already installed (`@tailwindcss/container-queries` in tailwind.config.js line 176)

**Current Problem:**
```tsx
// Current (viewport-aware only)
<div className="w-full md:w-[85%]">  {/* Container width changes */}
  <p className="text-fluid-md">Text</p>  {/* But text ignores container, only watches viewport */}
</div>
```

When the container shrinks from `w-full` → `w-[85%]`, the text doesn't respond because `clamp(0.6rem, 0.5rem + 0.5vw, 0.7rem)` only watches viewport width (vw), not container width.

**Proper Solution (container-aware):**
```tsx
// Container-aware system
<div className="@container w-full md:w-[85%]">  {/* Mark as container context */}
  <p className="text-fluid-base @md:text-fluid-md @lg:text-fluid-lg">
    {/* Text scales based on CONTAINER size, not viewport */}
  </p>
</div>
```

**Container Query Breakpoints (Tailwind):**
- `@sm` - Container width ≥ 384px (24rem)
- `@md` - Container width ≥ 448px (28rem)
- `@lg` - Container width ≥ 512px (32rem)
- `@xl` - Container width ≥ 576px (36rem)
- `@2xl` - Container width ≥ 672px (42rem)
- `@[Npx]` - Custom container width

**Why This Works:**
1. Viewport changes → Container width changes → Text size responds
2. Creates a cascading responsive system: viewport → layout → containers → text
3. Text maintains proper proportions relative to its container at ANY viewport size
</context>

<requirements>
1. **Add `@container` to all responsive parent containers**
   - ScrollingSections content wrappers
   - Image sidebar columns
   - Text content divs that change width at breakpoints

2. **Convert text sizing to container-aware breakpoints**
   - Instead of: `text-fluid-md` (viewport-only)
   - Use: `text-fluid-sm @md:text-fluid-md @lg:text-fluid-lg` (container-aware)

3. **Create a container query sizing strategy**
   - Small containers (< 448px): `text-fluid-sm`
   - Medium containers (448-512px): `text-fluid-md`
   - Large containers (> 512px): `text-fluid-lg`
   - Extra large containers (> 672px): `text-fluid-xl`

4. **Maintain visual hierarchy**
   - Headings should still be larger than body text within same container
   - Labels should still be smaller
   - Use container breakpoints to scale entire hierarchies together

**WHY this is the right approach:**
- Viewport units (`vw`) are global - they don't know about layout changes
- Container queries are local - text responds to its actual available space
- This creates PROPORTIONAL scaling: as container shrinks, text shrinks proportionally
- Works correctly when sidebars collapse, grids reflow, etc.
</requirements>

<implementation>
**Step 1: Identify all responsive containers**

Find containers that change width at breakpoints:
```bash
grep -rn "w-full.*md:w-\|w-\[.*\].*md:" frontend/src/app/about/components --include="*.tsx"
```

These need `@container` added.

**Step 2: Mark containers**

```tsx
// BEFORE
<div className="w-full md:w-[85%] lg:w-[80%] flex flex-col">

// AFTER
<div className="@container w-full md:w-[85%] lg:w-[80%] flex flex-col">
```

**Step 3: Convert text to container-aware sizing**

```tsx
// BEFORE (viewport-only)
<p className="text-fluid-md leading-[1.7] md:leading-[1.8]">

// AFTER (container-aware)
<p className="text-fluid-sm @md:text-fluid-md @lg:text-fluid-lg leading-[1.7] @md:leading-[1.8]">
```

**Step 4: Create container name contexts for nested containers**

For complex layouts with multiple container contexts:
```tsx
<div className="@container/sidebar">  {/* Named container */}
  <div className="@container/content">  {/* Nested named container */}
    <p className="text-fluid-sm @md/content:text-fluid-md">  {/* Query specific container */}
      Text scales with content container, not sidebar
    </p>
  </div>
</div>
```

**Step 5: Update key files**

**Priority files:**
1. **interactive-scrolling-story-component.tsx** (main content containers)
   - Add `@container` to content wrapper divs
   - Convert text sizing to container queries
   - Image column should also be `@container`

2. **ScrollingSections.tsx** (section content)
   - Each slide's content div needs `@container`
   - All text should use container breakpoints

3. **Image containers** (responsive images)
   - Mark image wrapper as `@container`
   - Use `@[Npx]` custom breakpoints for image sizing

**Example Implementation:**

```tsx
// interactive-scrolling-story-component.tsx line ~293
<div
  className="@container flex flex-col py-4 md:py-6 lg:py-8 mt-8 md:mt-10 lg:mt-12 mb-4 md:mb-6 lg:mb-8"
  style={{ width: 'clamp(70%, calc(100vw - 4rem), 85%)' }}
>
  <h2 className="text-fluid-xl @md:text-fluid-2xl @lg:text-fluid-3xl font-normal tracking-[2px] mb-3 md:mb-4 lg:mb-5">
    {slide.title}
  </h2>
  <div className="overflow-y-auto flex-1">
    <p className="text-fluid-sm @md:text-fluid-md @lg:text-fluid-lg leading-[1.7] @md:leading-[1.8]">
      {slide.content}
    </p>
  </div>
</div>
```

**What to avoid:**
- DON'T mix viewport breakpoints (md:, lg:) with container breakpoints (@md:, @lg:) for the SAME property
- DON'T add `@container` to every single div - only responsive layout containers
- DON'T break existing layout structure - just add `@container` and convert text sizing
</implementation>

<output>
Modify files in place:
- `./frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx`
- `./frontend/src/app/about/components/ScrollingSections.tsx`
- Any other components with responsive text containers

Create verification document:
- `./prompts/completed/004-container-query-verification.md` - List all containers marked and their query strategies
</output>

<verification>
Before declaring complete, TEST the container-aware system:

1. **Container responsiveness test:**
   - Open http://localhost:3000/about
   - Open browser dev tools, inspect a text element
   - You should see classes like `@md:text-fluid-md` in the DOM
   - The computed font size should change based on CONTAINER width, not just viewport

2. **Resize test:**
   - Resize browser from 1920px → 768px
   - Watch the content container width change (should go from 85% → 100%)
   - Text should scale DOWN as container gets narrower
   - No sudden jumps - smooth scaling

3. **Container query verification:**
   - Use dev tools to inspect container
   - Container should have `container-type: inline-size` in computed styles
   - Text should respond when you manually change container width via dev tools

4. **Visual hierarchy test:**
   - At 1920px: Headings larger, body medium, labels small
   - At 1280px: Everything proportionally smaller
   - At 768px: Everything even smaller, but hierarchy maintained

**Success criteria:**
- All responsive containers have `@container` class
- All text uses container query breakpoints (`@md:`, `@lg:`, etc.)
- Text visibly scales when CONTAINER width changes, not just viewport
- Inspect element shows container queries in computed styles
- Smooth proportional scaling across all viewport sizes
</verification>

<success_criteria>
- All layout containers that change width have `@container` class
- Text sizing uses container query breakpoints (`@sm:`, `@md:`, `@lg:`)
- Text scales proportionally with its container's width
- Dev tools show `container-type: inline-size` on container elements
- Resizing browser creates smooth, cascading responsive behavior: viewport → container → text
- Visual hierarchy preserved at all container sizes
</success_criteria>
