/**
 * Navigation Domain Logic
 * Pure functions for route calculation and navigation logic
 * 
 * EXTRACTED FROM: hexagon-navigation.tsx:31-41, 22-29
 * 
 * This domain contains zero React dependencies and pure business logic only.
 */

export interface Subsystem {
  id: number;
  name: string;
  coordinate: string;
  description: string;
}

export interface NavigationAction {
  type: 'navigate' | 'auth_required' | 'blocked';
  route?: string;
  message?: string;
  subsystem: Subsystem;
}

export interface RouteAccessRule {
  subsystem: string;
  requiresAuth: boolean;
  isProtected: boolean;
}

/**
 * Subsystem definitions with coordinates
 * EXTRACTED FROM: hexagon-navigation.tsx:22-29
 */
export const SUBSYSTEMS: readonly Subsystem[] = [
  { id: 0, name: 'Anuttara', coordinate: '#0', description: 'Absolute Ground' },
  { id: 1, name: 'Paramasiva', coordinate: '#1', description: 'Foundational Architect' },
  { id: 2, name: 'Parashakti', coordinate: '#2', description: 'Cosmic Imagination' },
  { id: 3, name: 'Mahamaya', coordinate: '#3', description: 'Universal Transcription' },
  { id: 4, name: 'Nara', coordinate: '#4', description: 'Dialogical Identity' },
  { id: 5, name: 'Epii', coordinate: '#5', description: 'Synthesis & Orchestration' }
] as const;

/**
 * Route access rules for subsystems
 * EXTRACTED FROM: hexagon-navigation.tsx:32-36, 38-40 logic
 */
export const ROUTE_ACCESS_RULES: readonly RouteAccessRule[] = [
  { subsystem: 'Anuttara', requiresAuth: false, isProtected: false },
  { subsystem: 'Paramasiva', requiresAuth: false, isProtected: false },
  { subsystem: 'Parashakti', requiresAuth: false, isProtected: false },
  { subsystem: 'Mahamaya', requiresAuth: false, isProtected: false },
  { subsystem: 'Nara', requiresAuth: true, isProtected: true }, // Nara is protected
  { subsystem: 'Epii', requiresAuth: false, isProtected: false }
] as const;

/**
 * Get subsystem by name
 */
export const getSubsystemByName = (name: string): Subsystem | null => {
  return SUBSYSTEMS.find(s => s.name.toLowerCase() === name.toLowerCase()) || null;
};

/**
 * Get subsystem by coordinate
 */
export const getSubsystemByCoordinate = (coordinate: string): Subsystem | null => {
  return SUBSYSTEMS.find(s => s.coordinate === coordinate) || null;
};

/**
 * Get subsystem by ID
 */
export const getSubsystemById = (id: number): Subsystem | null => {
  return SUBSYSTEMS.find(s => s.id === id) || null;
};

/**
 * Calculate route for subsystem navigation
 * EXTRACTED FROM: hexagon-navigation.tsx:39
 */
export const calculateSubsystemRoute = (subsystem: Subsystem): string => {
  return `/${subsystem.name.toLowerCase()}`;
};

/**
 * Determine navigation action for subsystem click
 * EXTRACTED FROM: hexagon-navigation.tsx:31-41
 */
export const determineNavigationAction = (
  subsystem: Subsystem,
  isAuthenticated: boolean
): NavigationAction => {
  const accessRule = ROUTE_ACCESS_RULES.find(r => r.subsystem === subsystem.name);
  
  if (!accessRule) {
    return {
      type: 'blocked',
      message: `Unknown subsystem: ${subsystem.name}`,
      subsystem
    };
  }

  if (accessRule.requiresAuth && !isAuthenticated) {
    return {
      type: 'auth_required',
      message: `Authentication required to access ${subsystem.name}`,
      subsystem
    };
  }

  const route = calculateSubsystemRoute(subsystem);
  return {
    type: 'navigate',
    route,
    subsystem
  };
};

/**
 * Get all accessible subsystems for user
 */
export const getAccessibleSubsystems = (isAuthenticated: boolean): Subsystem[] => {
  return SUBSYSTEMS.filter(subsystem => {
    const rule = ROUTE_ACCESS_RULES.find(r => r.subsystem === subsystem.name);
    return !rule?.requiresAuth || isAuthenticated;
  });
};

/**
 * Get protected subsystems
 */
export const getProtectedSubsystems = (): Subsystem[] => {
  return SUBSYSTEMS.filter(subsystem => {
    const rule = ROUTE_ACCESS_RULES.find(r => r.subsystem === subsystem.name);
    return rule?.isProtected || false;
  });
};

/**
 * Check if subsystem requires authentication
 */
export const subsystemRequiresAuth = (subsystem: Subsystem): boolean => {
  const rule = ROUTE_ACCESS_RULES.find(r => r.subsystem === subsystem.name);
  return rule?.requiresAuth || false;
};

/**
 * Validate coordinate format
 */
export const isValidCoordinate = (coordinate: string): boolean => {
  return /^#[0-5]$/.test(coordinate);
};

/**
 * Parse coordinate to subsystem ID
 */
export const parseCoordinateToId = (coordinate: string): number | null => {
  if (!isValidCoordinate(coordinate)) return null;
  return parseInt(coordinate.substring(1), 10);
};