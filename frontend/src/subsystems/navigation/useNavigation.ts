/**
 * Navigation Orchestration Hook
 * Orchestrates navigation domain logic with React state and Next.js router
 * 
 * INTEGRATES: domains/navigation/navigation.domain.ts with React and Next.js router
 * 
 * This hook is the ONLY layer that imports both domain logic and React.
 * Components consume this hook and are "dumb" presentation layers.
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  SUBSYSTEMS,
  determineNavigationAction,
  calculateSubsystemRoute,
  getAccessibleSubsystems,
  getProtectedSubsystems,
  getSubsystemByName,
  getSubsystemById,
  getSubsystemByCoordinate,
  subsystemRequiresAuth,
  type Subsystem,
  type NavigationAction
} from '@/domains/navigation/navigation.domain';

export interface UseNavigationReturn {
  subsystems: readonly Subsystem[];
  navigateToSubsystem: (subsystem: Subsystem, isAuthenticated: boolean) => Promise<boolean>;
  getSubsystemByName: (name: string) => Subsystem | null;
  getSubsystemById: (id: number) => Subsystem | null;  
  getSubsystemByCoordinate: (coordinate: string) => Subsystem | null;
  getAccessibleSubsystems: (isAuthenticated: boolean) => Subsystem[];
  getProtectedSubsystems: () => Subsystem[];
  requiresAuth: (subsystem: Subsystem) => boolean;
  navigateToAuth: () => void;
  navigateHome: () => void;
}

export const useNavigation = (): UseNavigationReturn => {
  const router = useRouter();

  const navigateToSubsystem = useCallback(async (
    subsystem: Subsystem, 
    isAuthenticated: boolean
  ): Promise<boolean> => {
    // Use domain logic to determine navigation action
    const action: NavigationAction = determineNavigationAction(subsystem, isAuthenticated);
    
    switch (action.type) {
      case 'navigate':
        if (action.route) {
          router.push(action.route);
          return true;
        }
        return false;
        
      case 'auth_required':
        // Show authentication required warning (could be customized)
        if (typeof window !== 'undefined') {
          alert(action.message || `Authentication required to access ${subsystem.name}`);
        }
        return false;
        
      case 'blocked':
        // Handle blocked navigation (could log error, show message, etc.)
        console.warn('Navigation blocked:', action.message);
        if (typeof window !== 'undefined' && action.message) {
          alert(action.message);
        }
        return false;
        
      default:
        return false;
    }
  }, [router]);

  const navigateToAuth = useCallback(() => {
    router.push('/auth/signin');
  }, [router]);

  const navigateHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const getAccessibleSubsystemsForUser = useCallback((isAuthenticated: boolean): Subsystem[] => {
    return getAccessibleSubsystems(isAuthenticated);
  }, []);

  const getProtectedSubsystemsList = useCallback((): Subsystem[] => {
    return getProtectedSubsystems();
  }, []);

  const checkRequiresAuth = useCallback((subsystem: Subsystem): boolean => {
    return subsystemRequiresAuth(subsystem);
  }, []);

  const value: UseNavigationReturn = {
    subsystems: SUBSYSTEMS,
    navigateToSubsystem,
    getSubsystemByName,
    getSubsystemById,
    getSubsystemByCoordinate, 
    getAccessibleSubsystems: getAccessibleSubsystemsForUser,
    getProtectedSubsystems: getProtectedSubsystemsList,
    requiresAuth: checkRequiresAuth,
    navigateToAuth,
    navigateHome
  };

  return value;
};