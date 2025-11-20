<objective>
Implement mobile touch gesture controls for the ScrollingFeatureShowcase component that match the discrete section-change behavior of the existing wheel/keyboard navigation.

Users need to:
1. Flick/swipe up or down to change sections (one gesture = one section change, matching the wheel behavior)
2. Swipe left or right to toggle the sidebar open/close

This must integrate seamlessly with the existing scroll snap system without disrupting desktop behavior.
</objective>

<context>
**Project**: Epi-Logos landing page with section-based scrolling showcase
**Tech Stack**: Next.js 15, React 18, TypeScript, Framer Motion

@frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx
- Contains `ScrollingFeatureShowcase` component
- Has existing wheel-triggered section jumping (lines 99-150)
- Uses `lastTriggerTimeRef` with 1200ms lock duration to prevent rapid-fire navigation
- Animates using custom easeInOutCubic over 600ms
- Fires `onSectionChange` callback and dispatches custom events

@frontend/src/app/about/components/ScrollingSections.tsx
- Parent component that uses `ScrollingFeatureShowcase`
- Has `handleHeroClick` which dispatches synthetic wheel events for navigation
- May need sidebar toggle logic added or dispatched to parent

**Sidebar Context**: The about page likely has a sidebar component that responds to toggle events. Investigate the page structure to find the correct event or state to toggle.
</context>

<requirements>
## Core Touch Gesture System

### Vertical Swipe (Section Navigation)
1. Detect touch start, move, and end events
2. Calculate vertical swipe distance and velocity
3. Trigger section change when:
   - Swipe distance exceeds threshold (e.g., 50px) AND/OR
   - Swipe velocity exceeds threshold (e.g., 0.3 px/ms) for quick flicks
4. Use the same `lastTriggerTimeRef` lock mechanism (1200ms) to prevent rapid navigation
5. Use the same animation function for consistency
6. Call `setActiveIndex`, scroll to target, and fire `onSectionChange`

### Horizontal Swipe (Sidebar Toggle)
1. Detect horizontal swipes that exceed a threshold
2. Distinguish from vertical swipes - use angle detection (e.g., if horizontal > 2x vertical)
3. Emit appropriate sidebar toggle:
   - Swipe left from right edge: open sidebar
   - Swipe right from left edge: close sidebar
   - Or: any significant horizontal swipe toggles sidebar state
4. Research how the sidebar is controlled in the about page and integrate appropriately

### Touch Event Handling
1. Use `touchstart`, `touchmove`, `touchend` events
2. Track starting position on `touchstart`
3. Calculate delta on `touchend`
4. Prevent default only when gesture is recognized (don't break normal scrolling for other elements)
5. Consider multi-touch scenarios (only process single-finger gestures)

## Technical Constraints

1. **Lock Duration**: Respect the existing 1200ms lock between section changes
2. **Animation**: Use the existing `animate` function pattern for smooth transitions
3. **State Sync**: Ensure `activeIndex` state is updated correctly
4. **Callbacks**: Fire `onSectionChange` just like wheel handler does
5. **Passive Listeners**: Cannot use passive listeners if calling `preventDefault()`
6. **Mobile Detection**: Apply touch handlers on all devices (touch events won't fire on desktop anyway)

## Edge Cases
- Handle boundary conditions (first/last section)
- Handle diagonal swipes (should favor the dominant direction)
- Prevent navigation during active animation (use lock)
- Handle rapid successive swipes gracefully
</requirements>

<implementation>
## Approach

1. Add touch event state tracking (touchStartX, touchStartY, touchStartTime)
2. Add useEffect for touch event listeners on the container
3. Implement swipe direction detection with thresholds
4. Reuse the existing animation logic for vertical swipes
5. Dispatch custom event or call callback for sidebar toggle on horizontal swipes

## Code Integration Points

In `interactive-scrolling-story-component.tsx`:

```typescript
// Add refs for touch tracking
const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

// Add touch handling useEffect alongside the wheel useEffect
useEffect(() => {
  const container = scrollContainerRef.current;
  if (!container) return;

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length !== 1) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Calculate velocity
    const velocityY = Math.abs(deltaY) / deltaTime;

    // Determine swipe direction
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 2;
    const isVertical = Math.abs(deltaY) > Math.abs(deltaX) * 2;

    // Process swipes...
    touchStartRef.current = null;
  };

  container.addEventListener('touchstart', handleTouchStart, { passive: true });
  container.addEventListener('touchend', handleTouchEnd, { passive: false });

  return () => {
    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchend', handleTouchEnd);
  };
}, [/* dependencies */]);
```

## Sidebar Toggle

Research the about page structure to find:
1. How the sidebar state is managed (context? local state?)
2. What event or callback toggles it

Options for sidebar integration:
- Add `onSidebarToggle?: () => void` prop to ScrollingFeatureShowcase
- Dispatch a custom event like `sidebarToggle`
- Access a context directly

## Thresholds to Configure

```typescript
const SWIPE_THRESHOLD = 50; // minimum pixels for a swipe
const VELOCITY_THRESHOLD = 0.3; // pixels per millisecond for quick flicks
const ANGLE_RATIO = 2; // horizontal must be 2x vertical to be horizontal swipe
```
</implementation>

<output>
Modify the following files:

1. `./frontend/src/ui-system/components/ui/interactive-scrolling-story-component.tsx`
   - Add touch gesture handling for section navigation
   - Emit sidebar toggle event for horizontal swipes

2. Potentially `./frontend/src/app/about/components/ScrollingSections.tsx` or related about page files
   - Connect sidebar toggle event to actual sidebar state
   - Ensure the event dispatching and handling is wired up

Also investigate:
- `./frontend/src/app/about/page.tsx` - for sidebar state management
- Any sidebar component in the about section
</output>

<verification>
Before declaring complete, verify:

1. **Vertical swipe navigation**:
   - Test on mobile device or Chrome DevTools mobile emulation
   - Flick up → next section
   - Flick down → previous section
   - Quick flicks work (velocity detection)
   - Slow drags work (distance detection)
   - Lock prevents rapid-fire (1200ms cooldown)
   - First section: can't go up
   - Last section: can't go down

2. **Horizontal swipe sidebar toggle**:
   - Swipe left or right triggers sidebar toggle
   - Diagonal swipes favor vertical (section navigation) over horizontal
   - Sidebar actually opens/closes

3. **Desktop behavior unchanged**:
   - Wheel scrolling still works
   - No interference with click events
   - Pagination dots still work

4. **Animation smoothness**:
   - Transitions use same easing as wheel navigation
   - No jank or stuttering
   - Blur effects apply correctly during transitions

5. **Run the app**:
   ```bash
   npm run dev:frontend
   ```
   Navigate to the about page and test on mobile viewport
</verification>

<success_criteria>
- Mobile users can flick up/down to navigate sections with one gesture per section
- Mobile users can swipe left/right to toggle sidebar
- Touch gestures respect the same 1200ms lock as wheel events
- Animation timing and easing matches existing wheel navigation
- No regression in desktop behavior
- Touch handling doesn't break other touch interactions (buttons, links)
</success_criteria>
