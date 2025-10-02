# Dashboard Centering + Clipping Post‑Mortem (Epi‑Logos Modal Content Panel)

Date: 2025‑10‑02

## Summary

While migrating the dashboard to a hex layout with a single glass overlay, we introduced wrapper containers and inline transforms that changed how the content panel sized and centered its children. This led to repeated issues: invisible grid (0×0 measurement), off‑center ring, and top/bottom clipping. We reverted to the rectangular grid and fixed centering by making the Framer motion container fill the panel and using Tailwind‑only centering.

## Symptoms Observed

- Dashboard grid disappeared entirely (only header text visible).
- Grid/overlay visibly high (hugging top), or biased left.
- Clipping at bottom and later left/right.
- Header fading caused layout shift when it reserved vertical space.

## Root Causes

1) Wrong measurement root
- Absolute children were measured against ancestors without guaranteed height → `getBoundingClientRect()` returned 0, collapsing computed sizes.

2) Transform overrides
- Inline `transform` style overrode Tailwind `-translate-x-1/2`/`-translate-y-1/2`, breaking centering and causing drift.

3) Mixed centering/offseting models
- Centering via transform + additional `calc()` offsets compounded, shrinking usable radius and creating clipping.

4) Wrapper constraints not needed
- Extra relative/absolute wrappers (with h-full, padding, or min-h) unintentionally constrained the dashboard’s natural block size and introduced clipping.

5) Header interfering with geometry
- Header placed in normal flow reduced the measurable height for the grid, biasing it upward. Header must be overlayed, not flow content.

## Hard Rules Going Forward

- Centering: Use Tailwind utilities only. Do NOT set inline `transform` on centered elements.
  - Pattern: `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`.
- Measurement: Compute geometry from a single, panel‑sized relative container. It must have real height at first paint.
  - Parent: `relative w-full h-full` (no extra padding).
  - Child: the centered wrapper (absolute) and the overlay/circles live inside it.
- Offsets: If a visual offset is desired, adjust `top` percent (e.g., `top-[60%]`) on the centered wrapper; never change the inline transform string.
- Header overlay: Position header absolutely and remove from flow so it never affects grid sizing.
- No hidden margins/padding: Keep panel children free of `pt-*`/`mb-*` when debugging layout.

## Tailwind Centering Recipes

- Geometric center: `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`.
- Lowered visual center: same as above, but change `top-[NN%]` (e.g., `top-[60%]`).
- Full‑panel centering via flex (for simple blocks): parent `h-full flex items-center justify-center`.

## Measurement Strategy (Overlay + Hex Ring)

1) Let `panelRect = panel.getBoundingClientRect()`.
2) Choose visual center fraction `cyFrac` (e.g., 0.60). `centerY = panelRect.height * cyFrac`.
3) Radii:
   - `verticalRadius = min(centerY - margin, panelRect.height - margin - centerY)`
   - `horizontalRadius = panelRect.width/2 - margin`
   - `overlayRadius = min(verticalRadius, horizontalRadius)`; `overlaySize = 2 * overlayRadius`.
4) Circle size: derive from `overlaySize` with clamp; ring radius = overlayRadius − (hoverRadius + labelAllowance + spacingPad). Ensure ring radius ≥ 0.

## Debug Checklist

- Toggle outline on panel (red), overlay (green), and circle centers (blue) to visually confirm geometry.
- Console‑log panel size, overlay size, ring radius, circle size at mount and on resize.
- Confirm no inline `transform` prop exists on centered wrapper; rely on Tailwind classes.
- Verify no `pt-*`, `mb-*`, or padding on the immediate grid container while debugging.

## Safe Re‑intro Plan for Hex Grid + Single Overlay

Phase 1 (behind flag):
- Add a feature flag to switch between RectGrid and HexGrid.
- Implement HexGrid with:
  - Parent: `relative w-full h-full` (panel child).
  - Centered wrapper: `absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2`.
  - No inline transform.
- Compute overlay and ring radii using the Measurement Strategy.
- Header absolutely overlaid, not in flow.

Phase 2: Validate
- Enable debug outlines; verify no clipping, true center, 20px margins.
- Tune spacingPad and labelAllowance for exact look.

Phase 3: Enable flag
- Remove debug outlines.
- Flip the feature flag to HexGrid only after confirmation.

## Acceptance Criteria

- Dashboard renders with no clipping at any edge in the content panel.
- Visual center offset produces expected look while preserving margins.
- No wrappers constrain width/height unexpectedly; no inline transform on centered elements.
- Header fade does not change grid geometry.

## Notes

- The glass overlay remained the original `CircularGlassOverlay` throughout; issues stemmed from wrapper sizing and transform overrides, not component replacement.

