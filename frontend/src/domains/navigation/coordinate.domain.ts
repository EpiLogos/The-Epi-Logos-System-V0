/**
 * Coordinate Domain Logic
 * Pure functions for Bimba coordinate processing and navigation
 * 
 * EXTRACTED FROM: hexagon-navigation.tsx, AGUIProvider.tsx coordinate logic
 * 
 * This domain contains zero React dependencies and pure business logic only.
 */

export interface BimbaCoordinate {
  id: number;
  coordinate: string;
  name: string;
  description: string;
  phase: string;
  domain: string;
}

export interface CoordinateTransition {
  from: string | null;
  to: string;
  isValid: boolean;
  reason?: string;
}

/**
 * Complete Bimba coordinate system definitions
 */
export const BIMBA_COORDINATES: readonly BimbaCoordinate[] = [
  {
    id: 0,
    coordinate: '#0',
    name: 'Anuttara',
    description: 'Absolute Ground',
    phase: 'Implicit Potential',
    domain: 'Void Processing & Proto-Logical Processing'
  },
  {
    id: 1,
    coordinate: '#1',
    name: 'Paramasiva',
    description: 'Foundational Architect',
    phase: 'The "What" - Material Cause',
    domain: 'Universal Grammar & Structural Frameworks'
  },
  {
    id: 2,
    coordinate: '#2',
    name: 'Parashakti',
    description: 'Cosmic Imagination',
    phase: 'The "How" - Processual Transformation',
    domain: '72-bit Vibrational Architecture & Frequency Processing'
  },
  {
    id: 3,
    coordinate: '#3',
    name: 'Mahamaya',
    description: 'Universal Transcription',
    phase: 'Mediation - Integration & Pattern Recognition',
    domain: '64-bit Symbolic Processing & DNA/I-Ching Translation'
  },
  {
    id: 4,
    coordinate: '#4',
    name: 'Nara',
    description: 'Dialogical Identity',
    phase: 'Context - Practical Environment',
    domain: 'User Interaction & Oracle Operations'
  },
  {
    id: 5,
    coordinate: '#5',
    name: 'Epii',
    description: 'Synthesis & Orchestration',
    phase: 'Quintessence - Integral Synthesis',
    domain: 'Master Orchestrator & Meta-Techne Loops'
  }
] as const;

/**
 * Get coordinate by string identifier
 */
export const getCoordinateByString = (coordinate: string): BimbaCoordinate | null => {
  return BIMBA_COORDINATES.find(c => c.coordinate === coordinate) || null;
};

/**
 * Get coordinate by ID
 */
export const getCoordinateById = (id: number): BimbaCoordinate | null => {
  return BIMBA_COORDINATES.find(c => c.id === id) || null;
};

/**
 * Get coordinate by name
 */
export const getCoordinateByName = (name: string): BimbaCoordinate | null => {
  return BIMBA_COORDINATES.find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
};

/**
 * Validate coordinate transition
 * Based on Bimba coordinate system flow rules
 */
export const validateCoordinateTransition = (
  from: string | null,
  to: string
): CoordinateTransition => {
  const toCoord = getCoordinateByString(to);
  
  if (!toCoord) {
    return {
      from,
      to,
      isValid: false,
      reason: `Invalid target coordinate: ${to}`
    };
  }

  // #0 (Anuttara) can be accessed from anywhere as the absolute ground
  if (to === '#0') {
    return { from, to, isValid: true };
  }

  // If no starting point, allow transition to any coordinate
  if (!from) {
    return { from, to, isValid: true };
  }

  const fromCoord = getCoordinateByString(from);
  if (!fromCoord) {
    return {
      from,
      to,
      isValid: false,
      reason: `Invalid source coordinate: ${from}`
    };
  }

  // All transitions are valid within the Bimba system
  // This represents the interconnected nature of the six-fold architecture
  return { from, to, isValid: true };
};

/**
 * Get next coordinate in sequence
 */
export const getNextCoordinate = (current: string): BimbaCoordinate | null => {
  const currentCoord = getCoordinateByString(current);
  if (!currentCoord) return null;
  
  const nextId = (currentCoord.id + 1) % 6;
  return getCoordinateById(nextId);
};

/**
 * Get previous coordinate in sequence
 */
export const getPreviousCoordinate = (current: string): BimbaCoordinate | null => {
  const currentCoord = getCoordinateByString(current);
  if (!currentCoord) return null;
  
  const prevId = currentCoord.id === 0 ? 5 : currentCoord.id - 1;
  return getCoordinateById(prevId);
};

/**
 * Get complementary coordinate (opposite in the hexad)
 */
export const getComplementaryCoordinate = (coordinate: string): BimbaCoordinate | null => {
  const coord = getCoordinateByString(coordinate);
  if (!coord) return null;
  
  const complementaryId = (coord.id + 3) % 6;
  return getCoordinateById(complementaryId);
};

/**
 * Generate coordinate path between two points
 */
export const generateCoordinatePath = (
  from: string,
  to: string,
  preferClockwise: boolean = true
): BimbaCoordinate[] => {
  const fromCoord = getCoordinateByString(from);
  const toCoord = getCoordinateByString(to);
  
  if (!fromCoord || !toCoord) return [];
  
  const path: BimbaCoordinate[] = [fromCoord];
  
  if (fromCoord.id === toCoord.id) {
    return path;
  }

  let currentId = fromCoord.id;
  const targetId = toCoord.id;
  
  while (currentId !== targetId) {
    if (preferClockwise) {
      currentId = (currentId + 1) % 6;
    } else {
      currentId = currentId === 0 ? 5 : currentId - 1;
    }
    
    const coord = getCoordinateById(currentId);
    if (coord) {
      path.push(coord);
    }
  }
  
  return path;
};

/**
 * Calculate coordinate distance (shortest path)
 */
export const calculateCoordinateDistance = (from: string, to: string): number => {
  const fromCoord = getCoordinateByString(from);
  const toCoord = getCoordinateByString(to);
  
  if (!fromCoord || !toCoord) return -1;
  
  const clockwiseDistance = (toCoord.id - fromCoord.id + 6) % 6;
  const counterClockwiseDistance = (fromCoord.id - toCoord.id + 6) % 6;
  
  return Math.min(clockwiseDistance, counterClockwiseDistance);
};

/**
 * Check if coordinate represents a processing layer
 */
export const isProcessingCoordinate = (coordinate: string): boolean => {
  return ['#2', '#3'].includes(coordinate); // Parashakti & Mahamaya
};

/**
 * Check if coordinate represents an interface layer
 */
export const isInterfaceCoordinate = (coordinate: string): boolean => {
  return ['#1', '#4', '#5'].includes(coordinate); // Paramasiva, Nara, Epii
};

/**
 * Check if coordinate is the ground state
 */
export const isGroundCoordinate = (coordinate: string): boolean => {
  return coordinate === '#0'; // Anuttara
};