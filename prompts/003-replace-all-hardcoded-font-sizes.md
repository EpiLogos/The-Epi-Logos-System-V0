<objective>
Replace ALL hardcoded pixel font sizes (`text-[Npx]`) across the entire frontend codebase with the fluid responsive typography classes (`text-fluid-*`). This is the ACTUAL fix needed - the previous attempts failed because hardcoded values override the theme completely.

**Root cause discovered**: The codebase has dozens of components with hardcoded `text-[10px]`, `text-[11px]`, `text-[12px]`, `text-[13px]`, etc. that completely override any theme-level typography settings. This is why text sizes aren't responsive and don't scale with viewport changes.
</objective>

<context>
Project: Next.js 15 + React 18 + TypeScript + Tailwind CSS v4

**The Real Problem:**
A grep search revealed 30+ files with hardcoded pixel font sizes like:
- `text-[13px]` (very common)
- `text-[12px]` (very common)
- `text-[11px]` (common)
- `text-[10px]` (buttons, labels)
- `text-[48px]` (hero text)
- etc.

These override the fluid typography system completely. The theme variables in globals.css are IRRELEVANT as long as components use hardcoded values.

**Files with hardcoded sizes (partial list):**
- ScrollingSections.tsx (main content)
- PromptPackageViewer.tsx (many hardcoded sizes)
- CTASection.tsx
- NumberLanguageExplorer.tsx
- EssayScrollingSections.tsx
- HeroSection.tsx
- EssayReader.tsx
- And many more...

**Fluid typography classes available** (already defined in globals.css @theme):
- `text-fluid-xs` (6.4px → 8px)
- `text-fluid-sm` (8px → 9.6px)
- `text-fluid-base` (9.6px → 11.2px)
- `text-fluid-md` (11.2px → 12.8px)
- `text-fluid-lg` (12.8px → 16px)
- `text-fluid-xl` (14.4px → 19.2px)
- `text-fluid-2xl` (19.2px → 25.6px)
- `text-fluid-3xl` (25.6px → 32px)
</context>

<requirements>
1. **Find ALL hardcoded font sizes** across the frontend
   - Search for `text-[` pattern in all .tsx and .jsx files
   - Include both active code and potentially commented code that might get uncommented

2. **Map hardcoded sizes to fluid classes**
   - `text-[10px]` → `text-fluid-xs`
   - `text-[11px]` → `text-fluid-sm`
   - `text-[12px]` → `text-fluid-sm` or `text-fluid-base`
   - `text-[13px]` → `text-fluid-base` or `text-fluid-md`
   - `text-[14px]` → `text-fluid-md`
   - `text-[16px]` → `text-fluid-lg`
   - `text-[18px]` → `text-fluid-xl`
   - `text-[20px]` → `text-fluid-xl`
   - `text-[24px]` → `text-fluid-2xl`
   - `text-[36px]` → `text-fluid-3xl`
   - `text-[48px]` → `text-fluid-3xl` or larger

3. **Replace systematically**
   - Use context to choose the right fluid class (body text vs headings vs labels)
   - Maintain visual hierarchy (if a heading was larger, it should still be larger)
   - Preserve any conditional classes (cn() calls, isLightMode conditions, etc.)

4. **Special cases**
   - Hero text (currently `text-[48px]`) might need a custom larger size or multiple fluid classes
   - Button text should use appropriate fluid sizes
   - Tiny labels/uppercase text should use `text-fluid-xs`

**WHY this matters:**
- Hardcoded pixel values ALWAYS override theme variables in Tailwind
- No amount of theme configuration will work while components use `text-[Npx]`
- This is a find-and-replace job, but needs intelligent mapping based on context
</requirements>

<implementation>
**Step 1: Create a comprehensive list**
```bash
# Find all hardcoded text sizes
grep -rn "text-\[" frontend/src --include="*.tsx" --include="*.jsx" | grep -v node_modules > /tmp/hardcoded-sizes.txt
```

**Step 2: Systematic replacement strategy**

For each file:
1. Read the file
2. Identify all `text-[Npx]` instances
3. Determine context (body text, heading, label, button, etc.)
4. Choose appropriate `text-fluid-*` class based on:
   - Original size
   - Element role (heading > body > label)
   - Visual hierarchy relative to nearby elements
5. Replace while preserving all other classes and conditions

**Example replacements:**

```tsx
// BEFORE (hardcoded)
<p className="text-[13px] text-gray-300 leading-[2.0] tracking-[0.5px]">
  Body text here
</p>

// AFTER (fluid)
<p className="text-fluid-md text-gray-300 leading-[2.0] tracking-[0.5px]">
  Body text here
</p>
```

```tsx
// BEFORE (hardcoded with conditional)
<h2 className={cn("text-[18px] font-light tracking-[0.2em]", isLightMode ? "text-slate-900" : "text-white")}>

// AFTER (fluid)
<h2 className={cn("text-fluid-xl font-light tracking-[0.2em]", isLightMode ? "text-slate-900" : "text-white")}>
```

**Step 3: Handle edge cases**

Large hero text (48px+):
- Consider using multiple responsive classes: `text-fluid-3xl md:text-[3rem] lg:text-[4rem]`
- Or create a new `--font-size-fluid-hero` in globals.css @theme

Very small text (9px, 10px):
- Use `text-fluid-xs` consistently
- These are usually labels, metadata, or uppercase tracking text

**Step 4: Priority files** (most visible, do these first):
1. ScrollingSections.tsx (main landing page content)
2. HeroSection.tsx (hero text)
3. PromptPackageViewer.tsx (lots of hardcoded sizes)
4. CTASection.tsx (call-to-action buttons)

**What to avoid:**
- DON'T just do a blind find-and-replace - context matters for choosing the right fluid class
- DON'T change leading-[X] or tracking-[X] values - only text size classes
- DON'T break responsive patterns that are working (md:, lg: prefixes on other properties)
</implementation>

<output>
Modify files in place:
- `./frontend/src/app/about/components/ScrollingSections.tsx`
- `./frontend/src/app/about/components/PromptPackageViewer.tsx`
- `./frontend/src/app/about/components/CTASection.tsx`
- `./frontend/src/app/about/components/HeroSection.tsx`
- `./frontend/src/app/about/components/EssayReader.tsx`
- `./frontend/src/app/about/components/NumberLanguageExplorer.tsx`
- `./frontend/src/app/about/components/EssayScrollingSections.tsx`
- And any other files containing `text-[Npx]` patterns

Create a summary document:
- `./prompts/completed/003-replacement-summary.md` - List all replacements made with before/after examples
</output>

<verification>
Before declaring complete, TEST in browser:

1. **Visual regression check:**
   - Open http://localhost:3000/about
   - Compare text sizes before/after at 1920px viewport
   - Text should look similar but slightly smaller overall

2. **Responsive scaling test:**
   - Resize browser from 1920px → 1280px → 768px
   - ALL text should scale smoothly (get smaller as viewport shrinks)
   - No sudden jumps or layout breaks

3. **Hierarchy preservation:**
   - Headings should still be larger than body text
   - Labels should still be smaller than body text
   - Visual hierarchy maintained across all viewport sizes

4. **Specific checks:**
   - Hero text (was 48px): Should scale smoothly
   - Body text (was 12-13px): Should scale smoothly
   - Button text (was 10-11px): Should scale smoothly
   - All use `text-fluid-*` classes when you inspect in dev tools

**Success criteria:**
- Zero instances of `text-[Npx]` in active code (grep returns empty)
- Text scales proportionally with viewport resize
- Visual hierarchy preserved
- No layout breaks or text overflow issues
</verification>

<success_criteria>
- ALL hardcoded `text-[Npx]` values replaced with `text-fluid-*` classes
- Grep search for `text-\[.*px\]` in frontend/src returns zero active matches
- Text visibly scales when resizing browser window from 1920px to 768px
- Visual hierarchy and readability maintained at all viewport sizes
- User can see smooth, proportional text scaling behavior in real-time
</success_criteria>
