'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TransitionState {
  isTransitioning: boolean;
  fromPage: string | null;
  toPage: string | null;
  transitionType: 'auth-to-account' | 'account-to-auth' | 'default' | null;
}

interface PageTransitionContextType {
  transitionState: TransitionState;
  startTransition: (fromPage: string, toPage: string, type?: string) => void;
  completeTransition: () => void;
  isTransitioningTo: (page: string) => boolean;
  isTransitioningFrom: (page: string) => boolean;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const [transitionState, setTransitionState] = useState<TransitionState>({
    isTransitioning: false,
    fromPage: null,
    toPage: null,
    transitionType: null,
  });

  const startTransition = useCallback((fromPage: string, toPage: string, type: string = 'default') => {
    setTransitionState({
      isTransitioning: true,
      fromPage,
      toPage,
      transitionType: type as any,
    });
  }, []);

  const completeTransition = useCallback(() => {
    setTransitionState({
      isTransitioning: false,
      fromPage: null,
      toPage: null,
      transitionType: null,
    });
  }, []);

  const isTransitioningTo = useCallback((page: string) => {
    return transitionState.isTransitioning && transitionState.toPage === page;
  }, [transitionState]);

  const isTransitioningFrom = useCallback((page: string) => {
    return transitionState.isTransitioning && transitionState.fromPage === page;
  }, [transitionState]);

  return (
    <PageTransitionContext.Provider value={{
      transitionState,
      startTransition,
      completeTransition,
      isTransitioningTo,
      isTransitioningFrom,
    }}>
      {children}
    </PageTransitionContext.Provider>
  );
}

export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (context === undefined) {
    throw new Error('usePageTransition must be used within a PageTransitionProvider');
  }
  return context;
}

// Transition Background Component
interface TransitionBackgroundProps {
  currentPage: 'auth' | 'account';
  className?: string;
}

export function TransitionBackground({ currentPage, className = '' }: TransitionBackgroundProps) {
  const { transitionState } = usePageTransition();
  
  // Determine background colors based on page and transition state
  const getBackgroundClass = () => {
    if (transitionState.isTransitioning) {
      if (transitionState.transitionType === 'auth-to-account') {
        // Transitioning from orange/red to green
        return 'bg-gradient-to-br from-orange-900 via-amber-800 to-green-800';
      } else if (transitionState.transitionType === 'account-to-auth') {
        // Transitioning from green to orange/red
        return 'bg-gradient-to-br from-green-800 via-amber-800 to-orange-900';
      }
    }
    
    // Default backgrounds
    if (currentPage === 'auth') {
      return 'bg-gradient-to-br from-orange-900 via-red-900 to-orange-800';
    } else {
      return 'bg-gradient-to-br from-green-900 via-emerald-900 to-green-800';
    }
  };

  return (
    <motion.div
      className={`fixed inset-0 ${getBackgroundClass()} ${className}`}
      animate={{
        background: transitionState.isTransitioning 
          ? (transitionState.transitionType === 'auth-to-account' 
              ? ['linear-gradient(to bottom right, #7c2d12, #dc2626, #7c2d12)', 
                 'linear-gradient(to bottom right, #7c2d12, #d97706, #166534)',
                 'linear-gradient(to bottom right, #14532d, #065f46, #14532d)']
              : ['linear-gradient(to bottom right, #14532d, #065f46, #14532d)',
                 'linear-gradient(to bottom right, #14532d, #d97706, #7c2d12)',
                 'linear-gradient(to bottom right, #7c2d12, #dc2626, #7c2d12)'])
          : undefined
      }}
      transition={{ 
        duration: transitionState.isTransitioning ? 1.5 : 0.8,
        ease: "easeInOut"
      }}
    />
  );
}
