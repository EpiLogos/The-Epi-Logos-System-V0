/**
 * useCoordinateDisplay Hook
 * Custom hook for managing coordinate display state and data fetching
 * 
 * Following Decoupled Domain Pattern:
 * - Manages React-specific concerns (useState, useEffect)
 * - Integrates with coordinateService for data fetching
 * - Provides clean interface for components
 */

'use client';

import { useState, useEffect } from 'react';
import { resolveCoordinate, CoordinateResolution } from '@/lib/coordinateService';

export interface UseCoordinateDisplayOptions {
  coordinate?: string;
  autoResolve?: boolean;
  enableCaching?: boolean;
}

export interface UseCoordinateDisplayReturn {
  coordinateData: CoordinateResolution | null;
  isLoading: boolean;
  error: string | null;
  resolveCurrentCoordinate: (coord: string) => Promise<void>;
  clearError: () => void;
  refresh: () => Promise<void>;
}

// Simple in-memory cache for coordinate resolutions
const coordinateCache = new Map<string, CoordinateResolution>();

export const useCoordinateDisplay = ({
  coordinate,
  autoResolve = true,
  enableCaching = true
}: UseCoordinateDisplayOptions = {}): UseCoordinateDisplayReturn => {
  const [coordinateData, setCoordinateData] = useState<CoordinateResolution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveCurrentCoordinate = async (coord: string): Promise<void> => {
    if (!coord) return;

    // Check cache first
    if (enableCaching && coordinateCache.has(coord)) {
      const cached = coordinateCache.get(coord)!;
      setCoordinateData(cached);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resolution = await resolveCoordinate(coord);
      setCoordinateData(resolution);
      
      // Cache the result
      if (enableCaching) {
        coordinateCache.set(coord, resolution);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve coordinate';
      setError(errorMessage);
      setCoordinateData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const refresh = async (): Promise<void> => {
    if (coordinate) {
      // Clear cache for this coordinate to force fresh resolution
      if (enableCaching) {
        coordinateCache.delete(coordinate);
      }
      await resolveCurrentCoordinate(coordinate);
    }
  };

  // Auto-resolve coordinate when it changes
  useEffect(() => {
    if (coordinate && autoResolve) {
      resolveCurrentCoordinate(coordinate);
    }
  }, [coordinate, autoResolve]);

  return {
    coordinateData,
    isLoading,
    error,
    resolveCurrentCoordinate,
    clearError,
    refresh
  };
};