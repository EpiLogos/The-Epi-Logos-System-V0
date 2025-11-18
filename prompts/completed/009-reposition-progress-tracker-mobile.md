<objective>
Reposition and restyle the progress tracker (pagination dots) for both mobile and desktop views in the interactive scrolling story component.

**Current state**: Tracker is positioned at top-left with horizontal dashes
**Desired state**:
- **Desktop**: Move to right side, keep horizontal dash styling
- **Mobile**: Move to right side, rotate 90° to vertical, use shorter dots (1/3 desktop size)
</objective>

<context>
**Component**: `@frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx`

**Current tracker implementation** (lines 222-248):
- Fixed position: `top-8 left-12`
- Horizontal layout: `flex space-x-2`
- Dash styling: Active = `w-12 h-1`, Inactive = `w-6 h-1`

**Requirements from user**:
1. Desktop: Move to right side, maintain current dash styling
2. Mobile (<768px):
   - Move to right side
   - Rotate 90 degrees (vertical orientation)
   - Use dots (shorter lines) - 1/3 of desktop size
   - Only visible on scroll (already implemented)
   - Fixed to right edge
</context>

<requirements>
## Desktop Styling (≥768px width)
- Position: Fixed right side (e.g., `right-12` instead of `left-12`)
- Keep horizontal orientation (`flex-row`)
- Keep current dash sizes (active: `w-12 h-1`, inactive: `w-6 h-1`)
- Maintain all current hover/transition effects

## Mobile Styling (<768px width)
- Position: Fixed right side (e.g., `right-4` or `right-6`)
- Vertical orientation: Rotate 90° or use `flex-col` with adjusted spacing
- Smaller dots:
  - Active: `w-4 h-1` (1/3 of desktop w-12)
  - Inactive: `w-2 h-1` (1/3 of desktop w-6)
- Vertical spacing: `space-y-2` instead of `space-x-2`
- Maintain light/dark mode colors
- Maintain click functionality
</requirements>

<implementation>
**Step 1**: Read the current tracker implementation
```
@frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx lines 222-248
```

**Step 2**: Update positioning and responsive classes

Replace the current fixed positioning and layout classes with responsive variants:

```tsx
// Current (line 224):
<div className="fixed top-8 left-12 flex space-x-2 z-50">

// New (responsive):
<div className="fixed top-8 md:right-12 right-4 z-50 flex md:flex-row flex-col md:space-x-2 space-y-2 md:space-y-0">
```

**Step 3**: Update button sizing with responsive classes

Replace the hardcoded `w-12`, `w-6`, and `h-1` with responsive variants:

```tsx
// Current (lines 239-242):
className={cn(
  "h-1 rounded-full transition-colors duration-300",
  index === activeIndex
    ? isLightMode ? "w-12 bg-gray-800/80" : "w-12 bg-white/80"
    : isLightMode ? "w-6 bg-gray-800/20 hover:bg-gray-800/40" : "w-6 bg-white/20 hover:bg-white/40"
)}

// New (responsive sizing - 1/3 on mobile):
className={cn(
  "h-1 rounded-full transition-colors duration-300",
  index === activeIndex
    ? isLightMode
      ? "w-4 md:w-12 bg-gray-800/80"
      : "w-4 md:w-12 bg-white/80"
    : isLightMode
      ? "w-2 md:w-6 bg-gray-800/20 hover:bg-gray-800/40"
      : "w-2 md:w-6 bg-white/20 hover:bg-white/40"
)}
```

**Step 4**: Verify responsive behavior

Test at different viewport widths:
- Desktop (≥768px): Should show horizontal dashes on right side
- Mobile (<768px): Should show vertical short dots on right side
- Transitions should be smooth when resizing
</implementation>

<verification>
Before declaring complete:

1. **Visual check desktop**:
   - Open at 1920×1080 or similar
   - Tracker should be on right side
   - Horizontal dashes (active: 48px wide, inactive: 24px wide)
   - Clicking works correctly

2. **Visual check mobile**:
   - Open at 375×667 or similar
   - Tracker should be on right side
   - Vertical dots (active: 16px wide, inactive: 8px wide)
   - Dots stacked vertically with spacing
   - Clicking works correctly

3. **Responsive transition**:
   - Resize window from desktop to mobile
   - Layout should smoothly transition from horizontal to vertical
   - No layout jumps or overlaps

4. **Light/dark mode**:
   - Test both modes
   - Colors should work in both orientations
   - Hover effects functional
</verification>

<output>
Modify:
- `./frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx` (lines 224 and 238-243)

Changes:
1. Container positioning: `left-12` → `md:right-12 right-4`
2. Container layout: `flex space-x-2` → `flex md:flex-row flex-col md:space-x-2 space-y-2 md:space-y-0`
3. Button sizing: Add responsive classes for 1/3 mobile sizing
</output>

<success_criteria>
✓ Desktop shows horizontal tracker on right side with current dash styling
✓ Mobile shows vertical tracker on right side with dot styling (1/3 size)
✓ All transitions smooth and functional
✓ Click navigation works in both layouts
✓ Light/dark mode colors preserved
✓ No layout shifts or overlaps at any viewport size
</success_criteria>
