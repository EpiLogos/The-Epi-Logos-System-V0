/**
 * Coordinate Orchestration Hook  
 * Orchestrates Bimba coordinate domain logic with React state management
 * 
 * INTEGRATES: domains/navigation/coordinate.domain.ts with React state
 * 
 * This hook is the ONLY layer that imports both domain logic and React.
 * Components consume this hook and are "dumb" presentation layers.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  BIMBA_COORDINATES,
  getCoordinateByString,
  getCoordinateById,
  getCoordinateByName,
  validateCoordinateTransition,
  getNextCoordinate,
  getPreviousCoordinate,
  getComplementaryCoordinate,
  generateCoordinatePath,
  calculateCoordinateDistance,
  isProcessingCoordinate,
  isInterfaceCoordinate,
  isGroundCoordinate,
  type BimbaCoordinate,
  type CoordinateTransition
} from '@/domains/navigation/coordinate.domain';

export interface UseCoordinateReturn {
  coordinates: readonly BimbaCoordinate[];
  currentCoordinate: string | null;
  setCurrentCoordinate: (coordinate: string) => boolean;
  transitionToCoordinate: (to: string) => CoordinateTransition;
  getCoordinateByString: (coordinate: string) => BimbaCoordinate | null;
  getCoordinateById: (id: number) => BimbaCoordinate | null;
  getCoordinateByName: (name: string) => BimbaCoordinate | null;
  getNextCoordinate: () => BimbaCoordinate | null;
  getPreviousCoordinate: () => BimbaCoordinate | null;
  getComplementaryCoordinate: () => BimbaCoordinate | null;
  generatePath: (to: string, preferClockwise?: boolean) => BimbaCoordinate[];
  calculateDistance: (to: string) => number;
  isProcessingCoordinate: (coordinate?: string) => boolean;
  isInterfaceCoordinate: (coordinate?: string) => boolean; 
  isGroundCoordinate: (coordinate?: string) => boolean;
  transitionHistory: CoordinateTransition[];
}

export const useCoordinate = (initialCoordinate: string | null = null): UseCoordinateReturn => {
  const [currentCoordinate, setCurrentCoordinateState] = useState<string | null>(initialCoordinate);
  const [transitionHistory, setTransitionHistory] = useState<CoordinateTransition[]>([]);

  // Initialize with valid coordinate if provided
  useEffect(() => {
    if (initialCoordinate) {
      const coord = getCoordinateByString(initialCoordinate);
      if (coord) {
        setCurrentCoordinateState(initialCoordinate);
      }
    }
  }, [initialCoordinate]);

  const setCurrentCoordinate = useCallback((coordinate: string): boolean => {
    const coord = getCoordinateByString(coordinate);
    if (!coord) {
      console.warn(`Invalid coordinate: ${coordinate}`);
      return false;
    }

    setCurrentCoordinateState(coordinate);
    return true;
  }, []);

  const transitionToCoordinate = useCallback((to: string): CoordinateTransition => {
    // Use domain logic to validate transition
    const transition = validateCoordinateTransition(currentCoordinate, to);
    
    // Add to transition history
    setTransitionHistory(prev => [...prev, transition]);
    
    // If valid, update current coordinate
    if (transition.isValid) {
      setCurrentCoordinateState(to);
    }
    
    return transition;
  }, [currentCoordinate]);

  const getNext = useCallback((): BimbaCoordinate | null => {
    if (!currentCoordinate) return null;
    return getNextCoordinate(currentCoordinate);
  }, [currentCoordinate]);

  const getPrevious = useCallback((): BimbaCoordinate | null => {
    if (!currentCoordinate) return null;
    return getPreviousCoordinate(currentCoordinate);
  }, [currentCoordinate]);

  const getComplementary = useCallback((): BimbaCoordinate | null => {
    if (!currentCoordinate) return null;
    return getComplementaryCoordinate(currentCoordinate);
  }, [currentCoordinate]);

  const generatePath = useCallback((to: string, preferClockwise: boolean = true): BimbaCoordinate[] => {
    if (!currentCoordinate) return [];
    return generateCoordinatePath(currentCoordinate, to, preferClockwise);
  }, [currentCoordinate]);

  const calculateDistance = useCallback((to: string): number => {
    if (!currentCoordinate) return -1;
    return calculateCoordinateDistance(currentCoordinate, to);
  }, [currentCoordinate]);

  const checkIsProcessingCoordinate = useCallback((coordinate?: string): boolean => {
    const coord = coordinate || currentCoordinate;
    if (!coord) return false;
    return isProcessingCoordinate(coord);
  }, [currentCoordinate]);

  const checkIsInterfaceCoordinate = useCallback((coordinate?: string): boolean => {
    const coord = coordinate || currentCoordinate;
    if (!coord) return false;
    return isInterfaceCoordinate(coord);
  }, [currentCoordinate]);

  const checkIsGroundCoordinate = useCallback((coordinate?: string): boolean => {
    const coord = coordinate || currentCoordinate;
    if (!coord) return false;
    return isGroundCoordinate(coord);
  }, [currentCoordinate]);

  const value: UseCoordinateReturn = {
    coordinates: BIMBA_COORDINATES,
    currentCoordinate,
    setCurrentCoordinate,
    transitionToCoordinate,
    getCoordinateByString,
    getCoordinateById,
    getCoordinateByName,
    getNextCoordinate: getNext,
    getPreviousCoordinate: getPrevious,
    getComplementaryCoordinate: getComplementary,
    generatePath,
    calculateDistance,
    isProcessingCoordinate: checkIsProcessingCoordinate,
    isInterfaceCoordinate: checkIsInterfaceCoordinate,
    isGroundCoordinate: checkIsGroundCoordinate,
    transitionHistory
  };

  return value;
};