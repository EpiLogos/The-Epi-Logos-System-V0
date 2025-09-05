"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

export type TransitionPhase = 'idle' | 'initiating' | 'frosting' | 'repositioning' | 'complete';

export interface TransitionState {
  phase: TransitionPhase;
  progress: number;
  duration: number;
  isTransitioning: boolean;
}

interface TransitionContextType {
  state: TransitionState;
  startTransition: () => void;
  updateProgress: (progress: number) => void;
  setPhase: (phase: TransitionPhase) => void;
  resetTransition: () => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

const initialState: TransitionState = {
  phase: 'idle',
  progress: 0,
  duration: 6000, // 6 seconds total
  isTransitioning: false,
};

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TransitionState>(initialState);

  const startTransition = useCallback(() => {
    console.log('TransitionContext: Starting transition');
    setState(prev => {
      const newState = {
        ...prev,
        phase: 'initiating' as TransitionPhase,
        progress: 0,
        isTransitioning: true,
      };
      console.log('TransitionContext: New state:', newState);
      return newState;
    });
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(1, progress)),
    }));
  }, []);

  const setPhase = useCallback((phase: TransitionPhase) => {
    setState(prev => ({
      ...prev,
      phase,
      isTransitioning: phase !== 'idle' && phase !== 'complete',
    }));
  }, []);

  const resetTransition = useCallback(() => {
    setState(initialState);
  }, []);

  const value: TransitionContextType = {
    state,
    startTransition,
    updateProgress,
    setPhase,
    resetTransition,
  };

  return (
    <TransitionContext.Provider value={value}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const context = useContext(TransitionContext);
  if (context === undefined) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context;
}
