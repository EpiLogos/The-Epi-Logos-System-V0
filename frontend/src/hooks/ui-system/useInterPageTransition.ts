'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageLoadingState } from './usePageLoadingState';

// Exact transition phases from original CSS methodology
export type TransitionPhase = 
  | 'idle'                    // Normal state - no transition
  | 'text-fade-out'          // Phase 1: Text elements fade/blur (200ms)
  | 'panel-morphing'         // Phase 2: Layout morphing (1800ms total)
  | 'white-fade-navigation'  // Phase 3: White overlay + navigation (1000ms)
  | 'navigating';            // Phase 4: Page change in progress

// Supported transition directions (matching original)
export type TransitionDirection = 
  | 'subsystems-to-paramasiva'    // Grid → Expanded modal layout
  | 'paramasiva-to-subsystems'    // Expanded modal → Grid layout
  | 'epilogos-to-subsystems'      // EpiLogos expanded → Grid layout (reverse modal)
  | 'paramasiva-to-quaternal'     // Paramasiva modal → Quaternal Logic layout
  | 'paramasiva-to-epilogos'      // Paramasiva → Epi-Logos (to main)
  | 'subsystems-to-epilogos'      // Subsystems → Epi-Logos (to main)
  | 'quaternal-to-paramasiva'     // Quaternal Logic → Paramasiva
  | 'quaternal-to-epilogos';      // Quaternal Logic → Epi-Logos

// Simplified state - just like original CSS class approach
interface InterPageTransitionState {
  // Single transition state - like adding .paramasiva-reverse-transitioning class
  isTransitioning: boolean;
  
  // Current transition direction (CRITICAL: Components need this for proper styling)
  currentTransitionDirection: TransitionDirection | null;
  
  // Staggered transition states (like modal pattern)
  textFadeStarted: boolean;     // Phase 1: Text fade out
  heightMorphStarted: boolean;  // Phase 2a: Height expansion
  widthMorphStarted: boolean;   // Phase 2b: Width expansion
  
  // Navigation states
  whiteOverlayVisible: boolean;     // White fade overlay
  navigationReady: boolean;         // Ready to navigate
  gridLinesVisible: boolean;        // Second phase grid lines fade-in
  
  // StrictMode protection
  isExecuting: boolean;             // Lock to prevent double-execution
}

// Initial state - everything visible and normal
const initialState: InterPageTransitionState = {
  isTransitioning: false,
  currentTransitionDirection: null,
  textFadeStarted: false,
  heightMorphStarted: false,
  widthMorphStarted: false,
  whiteOverlayVisible: false,
  navigationReady: false,
  gridLinesVisible: false,
  isExecuting: false,
};

/**
 * Hook managing inter-page transitions with pixel-perfect fidelity to original CSS methodology.
 * 
 * Architecture Philosophy:
 * - Hook manages STATE and TIMING (like original JavaScript)
 * - Components apply VISUAL EFFECTS via conditional Tailwind classes (like original CSS)
 * - Precise timing coordination matching original's choreographed sequences
 * - Pure Tailwind v4 implementation with zero external CSS dependencies
 */
export const useInterPageTransition = () => {
  const router = useRouter();
  const { navigateWithLoading } = usePageLoadingState();
  const [state, setState] = useState<InterPageTransitionState>(initialState);
  const timerRefs = useRef<NodeJS.Timeout[]>([]);
  
  // CRITICAL FIX: Reset transition state on component mount
  // This ensures text animations work when already on the page
  useEffect(() => {
    setState(initialState);
    // Clear any existing timers on mount
    timerRefs.current.forEach(timer => clearTimeout(timer));
    timerRefs.current = [];
  }, []);
  
  // Clear all timers on unmount (prevent memory leaks)
  useEffect(() => {
    return () => {
      timerRefs.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Clear existing timers utility - AGGRESSIVE cleanup for StrictMode
  const clearAllTimers = useCallback(() => {
    timerRefs.current.forEach(timer => clearTimeout(timer));
    timerRefs.current = [];
    // Reset execution lock to allow new transitions
    setState(prev => ({ ...prev, isExecuting: false }));
  }, []);

  /**
   * SUBSYSTEMS → PARAMASIVA TRANSITION
   * 
   * SACRED ORIGINAL TIMING (CSS Variables):
   * --text-fade-out: 200ms    | PHASE 1: Text disappears (immediate)
   * --panel-height: 800ms     | PHASE 2a: Height expansion (delay: 200ms) 
   * --panel-width: 1000ms     | PHASE 2b: Width expansion (delay: 1000ms)
   * --icon-move: 600ms        | PHASE 2c: Icon repositioning (delay: 2000ms)
   * 
   * Total morphing: 200ms + 800ms + 1000ms = 2000ms
   * Then: White fade + navigate
   */
  const transitionToParamasiva = useCallback(() => {
    // STRICTMODE PROTECTION: Prevent double-execution race conditions
    if (state.isTransitioning || state.isExecuting) return;
    
    clearAllTimers();
    
    // PHASE 1: Text fade-out (immediate) + LOCK execution + SET DIRECTION
    setState(prev => ({ 
      ...prev, 
      isTransitioning: true, 
      textFadeStarted: true, 
      isExecuting: true,
      currentTransitionDirection: 'subsystems-to-paramasiva'
    }));
    
    const phase2Timer = setTimeout(() => {
      // PHASE 2: Panel expansion
      setState(prev => ({ ...prev, heightMorphStarted: true }));
      
      const phase3Timer = setTimeout(() => {
        // PHASE 3: White fade + navigation
        setState(prev => ({ ...prev, whiteOverlayVisible: true }));
        
        const navigationTimer = setTimeout(() => {
          // Keep white overlay visible during navigation
          navigateWithLoading('/paramasiva');
          // Don't reset state here - let new page handle it
        }, 650);
        
        timerRefs.current.push(navigationTimer);
      }, 1200);
      
      timerRefs.current.push(phase3Timer);
    }, 200);
    
    timerRefs.current.push(phase2Timer);
  }, [state.isTransitioning, state.isExecuting, navigateWithLoading, clearAllTimers]);

  /**
   * PARAMASIVA → SUBSYSTEMS TRANSITION
   * 
   * SACRED REVERSE TIMING (From CSS .paramasiva-reverse-transitioning):
   * --text-fade-out: 200ms    | PHASE 1: Text disappears (immediate)
   * --panel-width: 1000ms     | PHASE 2a: Width expansion (delay: 200ms)
   * --panel-height: 800ms     | PHASE 2b: Height expansion (delay: 1200ms)
   * 
   * Key difference: Width changes FIRST (immediate after text), then height
   * This morphs the narrow Paramasiva panel back to full-width grid
   */
  const transitionToSubsystems = useCallback(() => {
    // STRICTMODE PROTECTION: Prevent double-execution race conditions
    if (state.isTransitioning || state.isExecuting) return;
    
    clearAllTimers();
    
    // PHASE 1: Text fade-out (immediate) + LOCK execution + SET DIRECTION
    setState(prev => ({ 
      ...prev, 
      isTransitioning: true, 
      textFadeStarted: true, 
      isExecuting: true,
      currentTransitionDirection: 'paramasiva-to-subsystems'
    }));
    
    // PHASE 2a: Width expansion (immediately after text fade - 167ms)
    const widthTimer = setTimeout(() => {
      setState(prev => ({ ...prev, widthMorphStarted: true }));
    }, 167);
    
    // PHASE 2b: Height expansion (after width completes - 1000ms total)
    const heightTimer = setTimeout(() => {
      setState(prev => ({ ...prev, heightMorphStarted: true }));
    }, 1000);
    
    // PHASE 2c: Grid lines fade-in (30% into end of first phase - 1100ms)
    const gridLinesTimer = setTimeout(() => {
      setState(prev => ({ ...prev, gridLinesVisible: true }));
    }, 1100);
    
    // PHASE 3: White fade + navigation (after all morphing completes)
    const navigationTimer = setTimeout(() => {
      setState(prev => ({ ...prev, whiteOverlayVisible: true }));
      
      const finalNavigationTimer = setTimeout(() => {
        // Keep white overlay visible during navigation
        navigateWithLoading('/subsystems');
        // Don't reset state here - let new page handle it
      }, 650);
      
      timerRefs.current.push(finalNavigationTimer);
    }, 1667);

    timerRefs.current.push(widthTimer, heightTimer, gridLinesTimer, navigationTimer);
  }, [state.isTransitioning, state.isExecuting, navigateWithLoading, clearAllTimers]);

  /**
   * EPILOGOS → SUBSYSTEMS TRANSITION (REVERSE MODAL)
   * 
   * This is the REVERSE of the modal expansion pattern:
   * - EpiLogos expanded state: Left sidebar (420px) + Right content panel
   * - Target: Subsystems layout: Left sidebar (300px) + Full-width grid
   * 
   * REVERSE MODAL TIMING:
   * --text-fade-out: 200ms    | PHASE 1: Text disappears (immediate)
   * --sidebar-expand: 1000ms  | PHASE 2: Left sidebar expands rightward (420px → calc(100vw-300px))
   * --content-morph: 800ms    | PHASE 3: Content morphs to grid (coordinated)
   * 
   * Total morphing: 200ms + 1000ms + 800ms = 2000ms
   * Then: White fade + navigate to /subsystems
   */
  const transitionToSubsystemsFromEpiLogos = useCallback(() => {
    // STRICTMODE PROTECTION: Prevent double-execution race conditions
    if (state.isTransitioning || state.isExecuting) return;
    
    clearAllTimers();
    
    // PHASE 1: Text fade-out (immediate) + LOCK execution + SET DIRECTION
    setState(prev => ({ 
      ...prev, 
      isTransitioning: true, 
      textFadeStarted: true, 
      isExecuting: true,
      currentTransitionDirection: 'epilogos-to-subsystems'
    }));
    
    // PHASE 2: Left sidebar expansion (200ms after text fade)
    const sidebarTimer = setTimeout(() => {
      setState(prev => ({ ...prev, widthMorphStarted: true }));
    }, 200);
    
    // PHASE 3: Content panel morph (1000ms after sidebar starts expanding)
    const contentTimer = setTimeout(() => {
      setState(prev => ({ ...prev, heightMorphStarted: true }));
    }, 1200);
    
    // PHASE 4: White fade + navigation (after SVG animation completes)
    const navigationTimer = setTimeout(() => {
      setState(prev => ({ ...prev, whiteOverlayVisible: true }));
      
      const finalNavigationTimer = setTimeout(() => {
        // Keep white overlay visible during navigation
        navigateWithLoading('/subsystems');
        // Don't reset state here - let new page handle it
      }, 650);
      
      timerRefs.current.push(finalNavigationTimer);
    }, 2400);

    timerRefs.current.push(sidebarTimer, contentTimer, navigationTimer);
  }, [state.isTransitioning, state.isExecuting, navigateWithLoading, clearAllTimers]);

  /**
   * PARAMASIVA → QUATERNAL LOGIC TRANSITION
   * 
   * MODAL COLLAPSE SEQUENCE:
   * --text-fade-out: 200ms    | PHASE 1: Text disappears (immediate)
   * --modal-height: 800ms     | PHASE 2a: Height collapse (delay: 200ms)
   * --modal-width: 1000ms     | PHASE 2b: Width collapse (delay: 1000ms)
   * --sidebar-shrink: 1000ms  | PHASE 2c: Sidebar 420px → 300px (coordinated)
   * 
   * Target: Paramasiva modal → Quaternal Logic main content area
   * Operant Component: ContentPanel morphs from modal to normal panel
   */
  const transitionToQuaternalFromParamasiva = useCallback(() => {
    // STRICTMODE PROTECTION: Prevent double-execution race conditions
    if (state.isTransitioning || state.isExecuting) return;
    
    clearAllTimers();
    
    // PHASE 1: Text fade-out (immediate) + LOCK execution + SET DIRECTION
    setState(prev => ({ 
      ...prev, 
      isTransitioning: true, 
      textFadeStarted: true, 
      isExecuting: true,
      currentTransitionDirection: 'paramasiva-to-quaternal'
    }));
    
    // PHASE 2a: Modal height collapse (200ms after text fade)
    const heightTimer = setTimeout(() => {
      setState(prev => ({ ...prev, heightMorphStarted: true }));
    }, 200);
    
    // PHASE 2b: Modal width collapse + sidebar shrink (1000ms after height starts)
    const widthTimer = setTimeout(() => {
      setState(prev => ({ ...prev, widthMorphStarted: true }));
    }, 1200);
    
    // PHASE 3: White fade + navigation (after all morphing completes)
    const navigationTimer = setTimeout(() => {
      setState(prev => ({ ...prev, whiteOverlayVisible: true }));
      
      const finalNavigationTimer = setTimeout(() => {
        // Keep white overlay visible during navigation
        navigateWithLoading('/quaternal-logic');
        // Don't reset state here - let new page handle it
      }, 650);
      
      timerRefs.current.push(finalNavigationTimer);
    }, 2000);

    timerRefs.current.push(heightTimer, widthTimer, navigationTimer);
  }, [state.isTransitioning, state.isExecuting, navigateWithLoading, clearAllTimers]);

  /**
   * EMERGENCY RESET
   * Allows manual cancellation of transitions if needed
   * Also provides StrictMode recovery mechanism
   */
  const resetTransition = useCallback(() => {
    clearAllTimers();
    setState(initialState);
  }, [clearAllTimers]);

  // STRICTMODE PROTECTION: Monitor for invalid state combinations
  useEffect(() => {
    // If we're transitioning but not executing, something went wrong
    if (state.isTransitioning && !state.isExecuting) {
      console.warn('useInterPageTransition: Invalid state detected - transitioning without execution lock. Resetting...');
      resetTransition();
    }
  }, [state.isTransitioning, state.isExecuting, resetTransition]);


  // Return hook interface - simplified like original CSS class approach
  return {
    // Core state
    isTransitioning: state.isTransitioning,
    currentTransitionDirection: state.currentTransitionDirection,
    textFadeStarted: state.textFadeStarted,
    heightMorphStarted: state.heightMorphStarted,
    widthMorphStarted: state.widthMorphStarted,
    whiteOverlayVisible: state.whiteOverlayVisible,
    gridLinesVisible: state.gridLinesVisible,
    
    // Transition triggers
    transitionToParamasiva,
    transitionToSubsystems,
    transitionToSubsystemsFromEpiLogos,
    transitionToQuaternalFromParamasiva,
    // New transitions
    transitionToEpiLogosFromParamasiva: (() => {
      // STRICTMODE PROTECTION: Prevent double-execution race conditions
      if (state.isTransitioning || state.isExecuting) return;

      clearAllTimers();

      // PHASE 1: Text fade-out + lock execution + set direction
      setState(prev => ({
        ...prev,
        isTransitioning: true,
        textFadeStarted: true,
        isExecuting: true,
        currentTransitionDirection: 'paramasiva-to-epilogos'
      }));

      // COLLAPSE-ONLY: Height settle then white fade (no width phase)
      const heightTimer = setTimeout(() => {
        setState(prev => ({ ...prev, heightMorphStarted: true }));
      }, 200);

      const navigationTimer = setTimeout(() => {
        setState(prev => ({ ...prev, whiteOverlayVisible: true }));

        const finalNavigationTimer = setTimeout(() => {
          navigateWithLoading('/');
        }, 650);

        timerRefs.current.push(finalNavigationTimer);
      }, 1200);

      timerRefs.current.push(heightTimer, navigationTimer);
    }),

    transitionToEpiLogosFromSubsystems: (() => {
      // STRICTMODE PROTECTION: Prevent double-execution race conditions
      if (state.isTransitioning || state.isExecuting) return;

      clearAllTimers();

      // PHASE 1: Text fade-out + lock execution + set direction
      setState(prev => ({
        ...prev,
        isTransitioning: true,
        textFadeStarted: true,
        isExecuting: true,
        currentTransitionDirection: 'subsystems-to-epilogos'
      }));

      // PHASE 2a: Height morph toward Epi-Logos footprint
      const heightTimer = setTimeout(() => {
        setState(prev => ({ ...prev, heightMorphStarted: true }));
      }, 200);

      // PHASE 2b: Width morph to Epi-Logos footprint
      const widthTimer = setTimeout(() => {
        setState(prev => ({ ...prev, widthMorphStarted: true }));
      }, 1200);

      // PHASE 3: White fade + navigation after morph completes
      const navigationTimer = setTimeout(() => {
        setState(prev => ({ ...prev, whiteOverlayVisible: true }));

        const finalNavigationTimer = setTimeout(() => {
          navigateWithLoading('/');
        }, 650);

        timerRefs.current.push(finalNavigationTimer);
      }, 2000);

      timerRefs.current.push(heightTimer, widthTimer, navigationTimer);
    }),

    transitionToParamasivaFromQuaternal: (() => {
      // STRICTMODE PROTECTION: Prevent double-execution race conditions
      if (state.isTransitioning || state.isExecuting) return;

      clearAllTimers();

      // PHASE 1: Text fade-out + lock execution + set direction
      setState(prev => ({
        ...prev,
        isTransitioning: true,
        textFadeStarted: true,
        isExecuting: true,
        currentTransitionDirection: 'quaternal-to-paramasiva'
      }));

      // PHASE 2: Container morph (height focus first)
      const heightTimer = setTimeout(() => {
        setState(prev => ({ ...prev, heightMorphStarted: true }));
      }, 200);

      // PHASE 3: Width/structure settle
      const widthTimer = setTimeout(() => {
        setState(prev => ({ ...prev, widthMorphStarted: true }));
      }, 1200);

      // PHASE 4: White fade + navigate
      const navigationTimer = setTimeout(() => {
        setState(prev => ({ ...prev, whiteOverlayVisible: true }));

        const finalNavigationTimer = setTimeout(() => {
          navigateWithLoading('/paramasiva');
        }, 650);

        timerRefs.current.push(finalNavigationTimer);
      }, 2000);

      timerRefs.current.push(heightTimer, widthTimer, navigationTimer);
    }),

    transitionToEpiLogosFromQuaternal: (() => {
      // STRICTMODE PROTECTION: Prevent double-execution race conditions
      if (state.isTransitioning || state.isExecuting) return;

      clearAllTimers();

      // PHASE 1: Text fade-out + lock execution + set direction
      setState(prev => ({
        ...prev,
        isTransitioning: true,
        textFadeStarted: true,
        isExecuting: true,
        currentTransitionDirection: 'quaternal-to-epilogos'
      }));

      // PHASE 2a: Container morph (height)
      const heightTimer = setTimeout(() => {
        setState(prev => ({ ...prev, heightMorphStarted: true }));
      }, 200);

      // PHASE 2b: Width morph
      const widthTimer = setTimeout(() => {
        setState(prev => ({ ...prev, widthMorphStarted: true }));
      }, 1200);

      // PHASE 3: White fade + navigate
      const navigationTimer = setTimeout(() => {
        setState(prev => ({ ...prev, whiteOverlayVisible: true }));

        const finalNavigationTimer = setTimeout(() => {
          navigateWithLoading('/');
        }, 650);

        timerRefs.current.push(finalNavigationTimer);
      }, 2000);

      timerRefs.current.push(heightTimer, widthTimer, navigationTimer);
    }),
    resetTransition,
  };
};

/**
 * USAGE EXAMPLE:
 * 
 * // In SubsystemsPage component:
 * const { 
 *   transitionToParamasiva,
 *   shouldApplyMorphing,
 *   shouldBlurImages,
 *   shouldHideText,
 *   isSubsystemsToParamasiva 
 * } = useInterPageTransition();
 * 
 * // Apply conditional Tailwind classes:
 * <div className={cn(
 *   "grid-main-area flex-1 grid grid-cols-3 grid-rows-2",
 *   shouldApplyMorphing && isSubsystemsToParamasiva && [
 *     "!w-[420px] !h-[calc(73vh+20.75vh)]",
 *     "!mx-[20px] !my-[35px] !mb-[105px]",
 *     "transition-all duration-panel-width delay-phase-1"
 *   ]
 * )}>
 * 
 * <img className={cn(
 *   "panel-center-image",
 *   shouldBlurImages && [
 *     "opacity-10 blur-[12px] brightness-[0.3]",
 *     "transition-all duration-[1800ms] ease-out"
 *   ]
 * )} />
 * 
 * // Click handler:
 * <div onClick={transitionToParamasiva}>
 */

export default useInterPageTransition;
