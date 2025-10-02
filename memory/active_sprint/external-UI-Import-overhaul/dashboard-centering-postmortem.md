# Dashboard Centering + Hex Grid — What Works (Epi‑Logos Modal Content Panel)

Date: 2025‑10‑02

## Current, Working Setup

- Modal dashboard content is centered by the panel using a full‑height Framer container:
  - motion.div classes: `modal-content-panel relative w-full h-full flex items-center justify-center`.
  - No extra wrappers between the panel and the dashboard grid.
- Cursor waves (SplashCursor) overlay fills the panel because the motion container is `w-full h-full` (no left‑side clipping).
- Rectangular grid is stable. Hex grid now implemented as a proper hex ring with per‑item glass overlays (no central glass), centered and unclipped.

## Hex Grid (Per‑Item Overlays) — Implementation

- Component: `HexDashboardGridPerItem` (no global glass overlay).
- Container: `relative aspect-square` with responsive width: `w-[min(92vw,700px)]`.
- Positions: 6 nodes placed at polar angles 0°, 60°, 120°, 180°, 240°, 300°.
- Radius: `r = min(width, height)/2 − circleSize/2 − edgeMargin`.
- Circle size: `157px` (matches DashboardCircle default), keeping visual parity.
- Each node renders `<DashboardCircle>` (with its own glass overlay) absolutely at `(cx ± r cosθ, cy ± r sinθ)`.
- No inline `transform`; all centering is via Tailwind utilities in the parent panel.

## Rules We’re Keeping

1) Fill the panel and let the panel center the child
   - Use `w-full h-full flex items-center justify-center` on the immediate content child.
2) Use a single, panel‑sized measurement root
   - The hex container measures itself (ResizeObserver) and drives polar layout — never rely on an ancestor that could be 0‑height at first paint.
3) Do not override transform with inline styles
   - Tailwind `-translate-x/y-1/2` is the only transform used for centering wrappers when needed.
4) Header is overlay only
   - Absolutely positioned; it must not affect grid geometry.

## Troubles We Avoided (and How)

- 0×0 measurements → invisible grid:
  - Ensure the measuring container is visible (`relative`, real size); add a sensible fallback size to avoid blank first paint.
- Left/right/top/bottom clipping:
  - Do not add padding/margins on the immediate grid container while tuning.
  - Do not wrap the grid in h-full relative boxes unless they inherit true height from the panel.
- Transform drift:
  - Never override Tailwind’s transform with an inline `transform` string.

## Debug Aids (when needed)

- Temporary outlines on panel (red) and hex container (green) to verify geometry.
- Log: panel size, container size, computed radius, circle size.

## Next Steps (optional)

- Fine‑tune ring spacing by adjusting `edgeMargin` or circle size on larger/smaller breakpoints.
- Add a tiny visual vertical offset by nudging the hex container’s `top` percent (keeping radius computed from the true panel center to avoid clipping).

