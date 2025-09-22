'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface PageLoadingState {
  isNavigating: boolean;
  targetPath: string | null;
}

/**
 * Hook for managing page loading states during Next.js navigation.
 * 
 * Integrates with page transition animations to provide smooth loading experience:
 * 1. Animation completes → Navigation starts with loading state
 * 2. Loading state persists during Next.js route change
 * 3. New page PageFadeIn component takes over and completes the transition
 * 
 * This bridges the gap between animation completion and page load completion.
 */
export const usePageLoadingState = () => {
  const router = useRouter();
  const [state, setState] = useState<PageLoadingState>({
    isNavigating: false,
    targetPath: null,
  });

  /**
   * Navigate to a new page with loading state tracking.
   * 
   * This function should be called instead of router.push() when you want
   * to maintain loading state during navigation.
   * 
   * @param path - The path to navigate to
   */
  const navigateWithLoading = useCallback((path: string) => {
    setState({
      isNavigating: true,
      targetPath: path,
    });
    
    // Start Next.js navigation
    router.push(path);
    
    // Note: We don't reset isNavigating here - the new page's PageFadeIn
    // component will handle the loading state completion
  }, [router]);

  /**
   * Manually reset the loading state.
   * 
   * This is typically called by PageFadeIn after the new page
   * has fully loaded and is ready to display.
   */
  const resetLoadingState = useCallback(() => {
    setState({
      isNavigating: false,
      targetPath: null,
    });
  }, []);

  /**
   * Check if currently navigating to a specific path.
   * 
   * @param path - The path to check
   * @returns true if currently navigating to the specified path
   */
  const isNavigatingTo = useCallback((path: string) => {
    return state.isNavigating && state.targetPath === path;
  }, [state.isNavigating, state.targetPath]);

  return {
    // State
    isNavigating: state.isNavigating,
    targetPath: state.targetPath,
    
    // Actions
    navigateWithLoading,
    resetLoadingState,
    isNavigatingTo,
  };
};

export default usePageLoadingState;