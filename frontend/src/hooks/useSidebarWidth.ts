/**
 * useSidebarWidth Hook
 *
 * Extracts width calculation logic from Sidebar component.
 * Single source of truth for sidebar width across all variants and states.
 *
 * Width Rules (applied in priority order):
 * 1. COLLAPSE STATE: Always overrides other states
 * 2. VARIANT-SPECIFIC LOGIC: Each variant has unique width behavior
 * 3. TRANSITION STATES: Overrides normal variant width during transitions
 * 4. MODAL EXPANSION: May affect width depending on variant
 */

interface UseSidebarWidthParams {
  isCollapsed: boolean;
  variant: 'subsystems' | 'paramasiva' | 'epi-logos' | 'main';
  isModalExpanded?: boolean;
  isTransitioning?: boolean;
  transitionDirection?: 'to-subsystems' | 'to-quaternal' | 'idle';
}

interface SidebarWidth {
  width: string;
  description: string;
}

/**
 * Width specifications for each sidebar variant
 * Each variant includes its normal state and any transition overrides
 */
const SIDEBAR_WIDTH_SPECS = {
  subsystems: {
    normal: { width: 'w-[300px]', description: 'Grid coordinates sidebar' },
    collapsed: { width: 'sidebar-collapsed', description: 'Collapsed grid sidebar (54px)' },
  },
  paramasiva: {
    normal: {
      expanded: { width: 'w-[calc(100vw-420px)]', description: 'Full-width expanded left sidebar' },
      collapsed: { width: 'sidebar-collapsed', description: 'Collapsed paramasiva sidebar (54px)' },
    },
    transition: {
      toSubsystems: { width: 'w-[300px]', description: 'Shrinking to grid width (300px)' },
      toQuaternal: { width: 'w-[420px]', description: 'Fixed width for quaternal transition' },
    },
  },
  'epi-logos': {
    normal: {
      expanded: { width: 'w-[420px]', description: 'Narrow modal sidebar' },
      collapsed: { width: 'sidebar-collapsed', description: 'Collapsed epi-logos sidebar (54px)' },
      default: { width: 'w-screen', description: 'Full-screen initial state' },
    },
    transition: {
      default: { width: 'w-screen', description: 'Reverse transition to full-screen' },
    },
  },
  main: {
    normal: { width: 'w-[420px]', description: 'Standard sidebar width' },
    collapsed: { width: 'sidebar-collapsed', description: 'Collapsed main sidebar (54px)' },
  },
} as const;

/**
 * Calculate sidebar width based on current state
 *
 * Priority order:
 * 1. Collapsed state (always highest priority)
 * 2. Transition state (if currently transitioning)
 * 3. Variant-specific rules (depends on isModalExpanded)
 *
 * @returns Object with width class and debug description
 */
export function useSidebarWidth({
  isCollapsed,
  variant,
  isModalExpanded = false,
  isTransitioning = false,
  transitionDirection = 'idle',
}: UseSidebarWidthParams): SidebarWidth {
  // RULE 1: Collapse state always takes precedence
  if (isCollapsed) {
    return {
      width: 'sidebar-collapsed',
      description: `${variant}: collapsed (54px)`,
    };
  }

  // RULE 2: Transition states override normal variant behavior
  if (isTransitioning && variant === 'paramasiva') {
    if (transitionDirection === 'to-subsystems') {
      return {
        width: SIDEBAR_WIDTH_SPECS.paramasiva.transition.toSubsystems.width,
        description: SIDEBAR_WIDTH_SPECS.paramasiva.transition.toSubsystems.description,
      };
    }
    if (transitionDirection === 'to-quaternal') {
      return {
        width: SIDEBAR_WIDTH_SPECS.paramasiva.transition.toQuaternal.width,
        description: SIDEBAR_WIDTH_SPECS.paramasiva.transition.toQuaternal.description,
      };
    }
  }

  // RULE 3: EpiLogos reverse transition
  if (isTransitioning && variant === 'epi-logos') {
    return {
      width: SIDEBAR_WIDTH_SPECS['epi-logos'].transition.default.width,
      description: SIDEBAR_WIDTH_SPECS['epi-logos'].transition.default.description,
    };
  }

  // RULE 4: Normal variant-specific behavior
  switch (variant) {
    case 'subsystems':
      return {
        width: SIDEBAR_WIDTH_SPECS.subsystems.normal.width,
        description: SIDEBAR_WIDTH_SPECS.subsystems.normal.description,
      };

    case 'paramasiva':
      return {
        width: isModalExpanded
          ? 'w-[420px]'
          : SIDEBAR_WIDTH_SPECS.paramasiva.normal.expanded.width,
        description: isModalExpanded
          ? 'Paramasiva: modal expanded (420px)'
          : 'Paramasiva: normal expanded (full - 420px)',
      };

    case 'epi-logos':
      return {
        width: isModalExpanded
          ? SIDEBAR_WIDTH_SPECS['epi-logos'].normal.expanded.width
          : SIDEBAR_WIDTH_SPECS['epi-logos'].normal.default.width,
        description: isModalExpanded
          ? 'EpiLogos: modal expanded (420px)'
          : 'EpiLogos: initial state (full-screen)',
      };

    case 'main':
      return {
        width: SIDEBAR_WIDTH_SPECS.main.normal.width,
        description: SIDEBAR_WIDTH_SPECS.main.normal.description,
      };

    default:
      return {
        width: 'w-[420px]',
        description: 'default width',
      };
  }
}

/**
 * Helper to get all available widths for a variant (useful for testing/debugging)
 */
export function getSidebarWidthSpecs(variant: typeof SIDEBAR_WIDTH_SPECS extends Record<infer K, any> ? K : never) {
  return SIDEBAR_WIDTH_SPECS[variant];
}
