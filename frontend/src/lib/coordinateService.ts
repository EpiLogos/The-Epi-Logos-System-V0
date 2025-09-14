/**
 * Coordinate Resolution Service
 * Handles GraphQL queries for coordinate data with environment-based configuration
 * 
 * Integrates with backend CAG Bimba service for coordinate resolution
 * Provides type-safe interface for frontend components
 */

// GraphQL endpoint configuration with environment variable support
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8000/graphql';

/**
 * Enhanced coordinate resolution interface matching BimbaNode schema
 * Provides full coordinate details for canvas/card/dynamic content areas
 */
export interface CoordinateResolution {
  id: string;
  coordinate: string;
  branch: number;
  terminal: number;
  name: string;
  description: string;
  subsystem: {
    id: number;
    name: string;
    description: string;
    color: string;
  };
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    status?: 'active' | 'placeholder' | 'development';
    tags?: string[];
  };
  relationships?: {
    parent?: string;
    children?: string[];
    related?: string[];
  };
  content?: {
    summary?: string;
    details?: string;
    features?: string[];
    capabilities?: string[];
  };
}

/**
 * GraphQL query for full coordinate resolution
 * Fetches comprehensive data for the placeholder system
 */
const COORDINATE_RESOLUTION_QUERY = `
  query ResolveCoordinate($coordinate: String!) {
    resolveCoordinate(coordinate: $coordinate) {
      id
      coordinate
      branch
      terminal
      name
      description
      subsystem {
        id
        name
        description
        color
      }
      metadata {
        createdAt
        updatedAt
        status
        tags
      }
      relationships {
        parent
        children
        related
      }
      content {
        summary
        details
        features
        capabilities
      }
    }
  }
`;

/**
 * Simple in-memory cache for coordinate resolutions
 * Reduces redundant GraphQL requests during development
 */
const coordinateCache = new Map<string, { data: CoordinateResolution; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Resolves a coordinate string to full coordinate data
 * @param coordinate - The coordinate string (e.g., '#2-3', '#0', '#1-4-2')
 * @returns Promise resolving to coordinate data or null
 */
export async function resolveCoordinate(coordinate: string): Promise<CoordinateResolution | null> {
  try {
    // Check cache first
    const cached = coordinateCache.get(coordinate);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[CoordinateService] Cache hit for ${coordinate}`);
      return cached.data;
    }

    console.log(`[CoordinateService] Resolving coordinate ${coordinate} via GraphQL`);
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: COORDINATE_RESOLUTION_QUERY,
        variables: { coordinate }
      })
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('[CoordinateService] GraphQL errors:', result.errors);
      throw new Error(result.errors[0]?.message || 'GraphQL query failed');
    }

    const coordinateData = result.data?.resolveCoordinate;
    
    if (!coordinateData) {
      console.warn(`[CoordinateService] No data found for coordinate ${coordinate}`);
      return null;
    }

    // Cache the result
    coordinateCache.set(coordinate, {
      data: coordinateData,
      timestamp: Date.now()
    });

    return coordinateData;
  } catch (error) {
    console.error('[CoordinateService] Error resolving coordinate:', error);
    
    // Return fallback data for development if GraphQL is unavailable
    if (process.env.NODE_ENV === 'development') {
      return getFallbackCoordinateData(coordinate);
    }
    
    throw error;
  }
}

/**
 * Clears the coordinate cache
 * Useful for development and testing
 */
export function clearCoordinateCache(): void {
  coordinateCache.clear();
  console.log('[CoordinateService] Cache cleared');
}

/**
 * Provides fallback coordinate data for development
 * Used when GraphQL endpoint is unavailable
 */
function getFallbackCoordinateData(coordinate: string): CoordinateResolution | null {
  const match = coordinate.match(/^#(\d)(?:-(\d))?(?:-(\d))?/);
  if (!match) return null;

  const branch = parseInt(match[1], 10);
  const terminal = match[2] ? parseInt(match[2], 10) : branch;
  
  const subsystems = [
    { id: 0, name: 'Anuttara', description: 'Absolute Ground & Proto-Logical Processing', color: '#9333ea' },
    { id: 1, name: 'Paramasiva', description: 'Foundational Architect of Quaternal Logic', color: '#ec4899' },
    { id: 2, name: 'Parashakti', description: 'Cosmic Imagination & Vibrational Matrix', color: '#22c55e' },
    { id: 3, name: 'Mahamaya', description: 'Universal Transcription Engine', color: '#fbbf24' },
    { id: 4, name: 'Nara', description: 'Dialogical-Identity Processing', color: '#ef4444' },
    { id: 5, name: 'Epii', description: 'Synthesis & Orchestration Processing', color: '#3b82f6' },
  ];

  const subsystem = subsystems[branch] || subsystems[0];
  const terminalSubsystem = subsystems[terminal] || subsystem;

  return {
    id: `fallback-${coordinate}`,
    coordinate,
    branch,
    terminal,
    name: `${subsystem.name} → ${terminalSubsystem.name}`,
    description: `Development placeholder for coordinate ${coordinate}`,
    subsystem: subsystem,
    metadata: {
      status: 'placeholder',
      createdAt: new Date().toISOString(),
      tags: ['development', 'fallback']
    },
    content: {
      summary: `This is a development fallback for coordinate ${coordinate}`,
      details: 'The GraphQL endpoint is not available. This data is generated locally for development purposes.',
      features: ['Placeholder content', 'Development mode', 'Local fallback'],
      capabilities: ['Basic coordinate display', 'Subsystem theming', 'Development testing']
    }
  };
}

export default {
  resolveCoordinate,
  clearCoordinateCache
};