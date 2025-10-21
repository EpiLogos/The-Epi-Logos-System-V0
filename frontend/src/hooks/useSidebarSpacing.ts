/**
 * useSidebarSpacing Hook
 *
 * Centralized spacing definitions for sidebar component variants.
 * All padding/margin values defined once, used everywhere.
 *
 * Spacing Rules:
 * - Collapsed state: No horizontal padding (lets SVG fit in 54px width)
 * - Normal/expanded state: Consistent horizontal + vertical padding
 * - Changes animate via CSS transitions (coordinated with width changes)
 */

interface SidebarSpacing {
  /** Horizontal padding in rem (will be converted to px-X class) */
  px: number;
  /** Vertical padding in rem (will be converted to py-X class) */
  py: number;
  /** Utility class for @utility approach (alternative to px/py) */
  utilityClass: string;
  /** Human-readable description for debugging */
  description: string;
}

/**
 * Spacing specifications for sidebar states
 *
 * Values map to Tailwind spacing scale:
 * - 0 = 0px
 * - 2 = 0.5rem (8px)
 * - 4 = 1rem (16px)
 * - 8 = 2rem (32px)
 * - 10 = 2.5rem (40px)
 */
const SIDEBAR_SPACING_SPECS = {
  collapsed: {
    px: 0,  // No horizontal padding when collapsed (fits 54px width)
    py: 8,  // 2rem vertical padding (32px)
    utilityClass: 'sidebar-spacing-collapsed',
    description: 'Collapsed: no horizontal padding, standard vertical',
  },
  normal: {
    px: 10, // 2.5rem horizontal padding (40px each side)
    py: 8,  // 2rem vertical padding (32px)
    utilityClass: 'sidebar-spacing-normal',
    description: 'Normal: standard horizontal + vertical padding',
  },
  expanded: {
    px: 10, // Same as normal (expanded state maintains normal padding)
    py: 8,  // Same as normal
    utilityClass: 'sidebar-spacing-normal', // Reuse normal utility
    description: 'Expanded: same as normal (consistency)',
  },
} as const;

/**
 * Get sidebar spacing based on collapse state
 *
 * @param isCollapsed - Whether sidebar is in collapsed state
 * @returns Spacing object with px, py, utility class, and description
 *
 * @example
 * const spacing = useSidebarSpacing(isCollapsed);
 * // Option 1: Use individual values
 * className={cn(`px-${spacing.px} py-${spacing.py}`, ...)}
 * // Option 2: Use utility class
 * className={cn(spacing.utilityClass, ...)}
 */
export function useSidebarSpacing(isCollapsed: boolean): SidebarSpacing {
  return SIDEBAR_SPACING_SPECS[isCollapsed ? 'collapsed' : 'normal'];
}

/**
 * Get spacing object for a specific state (useful for testing/debugging)
 */
export function getSidebarSpacingSpec(state: keyof typeof SIDEBAR_SPACING_SPECS): SidebarSpacing {
  return SIDEBAR_SPACING_SPECS[state];
}

/**
 * Get all available spacing specs (useful for component previews)
 */
export function getAllSidebarSpacingSpecs(): Record<string, SidebarSpacing> {
  return SIDEBAR_SPACING_SPECS;
}
