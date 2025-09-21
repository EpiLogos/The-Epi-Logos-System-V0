# Paramasiva Modal Animation System - Complete Mapping

## Current Animation Sequence

### Initial State (Page Load)
```
Container: w-[420px] h-[calc(60vh+32vh)] mt-5 mr-5 mb-0 ml-0
PNG: top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]
Text: Visible (EPI : LOGOS, PARAMASIVA TRANSFORMATION, etc.)
```

### Step 1: Initial Panel Movement (1.5s after load)
```
Container: w-[420px] h-[calc(60vh+20vh)] mt-5 mr-5 mb-0 ml-0
PNG: UNCHANGED (still centered)
Text: UNCHANGED
Animation: height 800ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Step 2: Modal Opening Sequence (onClick)

#### Phase 1: Text Fade-Out (immediate)
```
Text visibility: logoVisible=false, originalTextVisible=false
Duration: 200ms
```

#### Phase 2a: Height Expansion (200ms delay)
```
Container: height becomes calc(100vh - 40px)
Animation: height 800ms cubic-bezier(0.19, 1, 0.22, 1) 200ms
```

#### Phase 2b: Width + Margin Expansion (1000ms delay - overlaps with height)
```
Container: 
  - width becomes calc(100vw - 420px - 40px)
  - margin becomes 20px (all sides)
Animation: 
  - margin 800ms cubic-bezier(0.19, 1, 0.22, 1) 200ms
  - width 1000ms cubic-bezier(0.19, 1, 0.22, 1) 1000ms
```

#### Phase 2c: Icon Movement (2200ms delay from start)
```
PNG: 
  - From: top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]
  - To: top-[42px] left-[37px] transform-none w-[120px] h-[120px]
Animation: transition-[top,left,width,height,transform] 600ms ease-paramasiva delay-2200
```

#### Phase 3: Content Fade-In (overlaps with icon)
```
Text: logoVisible=true, modalTextVisible=true, showModalContent=true
Logo text changes: "EPI : LOGOS" → "PARAMASIVA"
```

## Container Coordinate System Analysis

### Normal State Container
```
Position: absolute top-0 right-0
Dimensions: w-[420px] h-[calc(60vh+20vh)]
Margins: mt-5 mr-5 (20px top, 20px right)
Actual position from viewport: 20px from top, 20px from right edge
```

### Expanded State Container  
```
Position: absolute top-0 right-0 (UNCHANGED)
Dimensions: w-[calc(100vw-420px-40px)] h-[calc(100vh-40px)]
Margins: 20px (all sides)
Actual position from viewport: 20px from all edges
```

## PNG Positioning Analysis

### Current Positioning (Top-Left Corner)
```
Normal: Centered in 420px container
  - Actual center: 210px from left edge of container
  - Plus container offset: 20px from right viewport edge
  - PNG center in viewport: (100vw - 420px + 210px) from left

Expanded: Top-left at 42px,37px in expanded container
  - Container is 20px from all viewport edges
  - PNG top-left: 20px + 42px = 62px from viewport top
  - PNG top-left: 20px + 37px = 57px from viewport left
```

### Proposed Bottom-Right Positioning
```
Target: PNG should be in bottom-right of expanded modal
Container dimensions in expanded state:
  - Width: calc(100vw - 420px - 40px)
  - Height: calc(100vh - 40px)
  - Margins: 20px all sides

PNG desired position (120px x 120px image):
  - 37px from right edge of container content
  - 37px from bottom edge of container content

Container content area (inside margins):
  - Content width: calc(100vw - 420px - 40px) - 40px = calc(100vw - 500px)
  - Content height: calc(100vh - 40px) - 40px = calc(100vh - 80px)

PNG position calculations:
  - Right: 37px from container right edge = right-[37px]
  - Bottom: 37px from container bottom edge = bottom-[37px]
  - Must disable transform: !transform-none
  - Must disable centering: !top-auto !left-auto
```

## Animation Conflicts to Resolve

### Issue 1: Transform Conflicts
```
Normal state: -translate-x-1/2 -translate-y-1/2 (centers the image)
Expanded state: !transform-none (disables centering)
Problem: These conflict during transition
```

### Issue 2: Position Property Conflicts
```
Normal: Uses top/left with transforms for centering
Expanded: Needs bottom/right for corner positioning
Problem: Can't animate between different positioning methods smoothly
```

### Issue 3: Container Size Changes During Animation
```
Container expands while PNG is animating
PNG position calculation must account for changing container dimensions
Need to coordinate timing between container expansion and PNG movement
```

## Proper Implementation Strategy

### Option A: Coordinate-Based Positioning (Recommended)
```
1. Calculate exact pixel positions for both states
2. Use only top/left properties (no bottom/right)
3. Account for container expansion timing
4. Ensure smooth transition between calculated positions
```

### Option B: Two-Phase Animation
```
1. Phase 1: PNG stays centered during container expansion
2. Phase 2: PNG moves to bottom-right after container settles
3. Requires precise timing coordination
```

### Option C: Container-Relative Positioning
```
1. Use CSS transforms for positioning instead of top/left
2. Calculate transform values for both states
3. Animate transform property only
```

## Recommended Implementation (Option A)

### Step 1: Calculate Target Positions
```javascript
// Normal state (centered in 420px container)
normalPosition = {
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)'
}

// Expanded state (bottom-right corner)
expandedPosition = {
  // Container content area: calc(100vw - 500px) width x calc(100vh - 80px) height
  // PNG 120px x 120px, want 37px from edges
  top: 'calc(100vh - 80px - 120px - 37px)',  // = calc(100vh - 237px)
  left: 'calc(100vw - 500px - 120px - 37px)', // = calc(100vw - 657px)
  transform: 'none'
}
```

### Step 2: Timing Coordination
```
Container expansion starts: 200ms
PNG movement starts: 2200ms (2000ms after container starts)
PNG should target final expanded container size
```

### Step 3: Transition Properties
```css
transition: top 600ms ease-paramasiva 2200ms, 
            left 600ms ease-paramasiva 2200ms,
            width 600ms ease-paramasiva 2200ms,
            height 600ms ease-paramasiva 2200ms,
            transform 600ms ease-paramasiva 2200ms
```

## Implementation Code

```tsx
// In ParamasivaImage.tsx
isExpanded && [
  "!top-[calc(100vh-237px)] !left-[calc(100vw-657px)] !transform-none",
  "!w-[120px] !h-[120px]",
  "!z-[35]"
]
```

This ensures the PNG moves to the bottom-right corner of the expanded modal while accounting for all container dimensions and margins.