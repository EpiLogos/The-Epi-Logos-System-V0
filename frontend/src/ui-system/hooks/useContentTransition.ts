'use client';

import { useState, useEffect, useCallback } from 'react';
import { type EpiLogosBusinessState } from './useEpiLogosBusinessStates';

export interface ContentTransitionState {
  contentVisible: boolean;
  isTransitioning: boolean;
  previousState: EpiLogosBusinessState | null;
}

export interface ContentTransitionActions {
  forceShow: () => void;
  forceHide: () => void;
  resetTransition: () => void;
}

export interface UseContentTransitionOptions {
  transitionDuration?: number;
  initialVisible?: boolean;
  skipInitialTransition?: boolean;
}

/**
 * Hook to manage content transitions independently from modal expansion
 * Provides smooth fade/blur transitions between business states
 */
export const useContentTransition = (
  businessState: EpiLogosBusinessState,
  options: UseContentTransitionOptions = {}
): [ContentTransitionState, ContentTransitionActions] => {
  const {
    transitionDuration = 300, // Match CSS transition duration
    initialVisible = false,
    skipInitialTransition = false
  } = options;

  const [contentVisible, setContentVisible] = useState(initialVisible);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousState, setPreviousState] = useState<EpiLogosBusinessState | null>(null);

  // Handle business state changes with smooth transitions
  useEffect(() => {
    // Skip transition logic if this is the initial state and we want to skip initial transition
    if (!previousState && skipInitialTransition) {
      setContentVisible(true);
      setPreviousState(businessState);
      return;
    }

    // If we have a previous state and it's different from current, transition
    if (previousState && previousState !== businessState) {
      setIsTransitioning(true);
      
      // Phase 1: Fade out current content
      setContentVisible(false);
      
      // Phase 2: Fade in new content after transition completes
      const transitionTimer = setTimeout(() => {
        setContentVisible(true);
        setIsTransitioning(false);
      }, transitionDuration);
      
      setPreviousState(businessState);
      
      return () => clearTimeout(transitionTimer);
    } 
    // Initial content load (no previous state)
    else if (!previousState) {
      // Small delay to ensure DOM is ready
      const initialTimer = setTimeout(() => {
        setContentVisible(true);
      }, 50);
      
      setPreviousState(businessState);
      
      return () => clearTimeout(initialTimer);
    }
  }, [businessState, previousState, transitionDuration, skipInitialTransition]);

  // Actions for manual control
  const forceShow = useCallback(() => {
    setContentVisible(true);
    setIsTransitioning(false);
  }, []);

  const forceHide = useCallback(() => {
    setContentVisible(false);
    setIsTransitioning(false);
  }, []);

  const resetTransition = useCallback(() => {
    setContentVisible(false);
    setIsTransitioning(false);
    setPreviousState(null);
  }, []);

  const state: ContentTransitionState = {
    contentVisible,
    isTransitioning,
    previousState
  };

  const actions: ContentTransitionActions = {
    forceShow,
    forceHide,
    resetTransition
  };

  return [state, actions];
};

/**
 * Specialized hook for modal content that coordinates with modal expansion timing
 */
export const useModalContentTransition = (
  businessState: EpiLogosBusinessState,
  modalExpansionComplete: boolean,
  options: UseContentTransitionOptions = {}
): [ContentTransitionState, ContentTransitionActions] => {
  const [baseState, baseActions] = useContentTransition(businessState, {
    ...options,
    initialVisible: false
  });

  const [modalContentVisible, setModalContentVisible] = useState(false);

  // Coordinate with modal expansion - only show content after modal is ready
  useEffect(() => {
    if (modalExpansionComplete && baseState.contentVisible) {
      setModalContentVisible(true);
    } else {
      setModalContentVisible(false);
    }
  }, [modalExpansionComplete, baseState.contentVisible]);

  // Override the base state with modal-aware visibility
  const modalState: ContentTransitionState = {
    ...baseState,
    contentVisible: modalContentVisible
  };

  return [modalState, baseActions];
};

export default useContentTransition;
