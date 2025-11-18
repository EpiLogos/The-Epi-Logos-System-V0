'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LightModeContextType {
  isLightMode: boolean;
  toggleLightMode: () => void;
}

const LightModeContext = createContext<LightModeContextType | undefined>(undefined);

export function LightModeProvider({ children }: { children: ReactNode }) {
  const [isLightMode, setIsLightMode] = useState(false);
  const [showFadeMask, setShowFadeMask] = useState(false);
  const [fadeMaskColor, setFadeMaskColor] = useState<'white' | 'black'>('white');

  const toggleLightMode = () => {
    // Set fade mask color based on where we're going
    // Going TO light mode = white mask, Going TO dark mode = black mask
    const goingToLightMode = !isLightMode;
    setFadeMaskColor(goingToLightMode ? 'white' : 'black');

    // Show the fade mask
    setShowFadeMask(true);

    // Toggle the mode after fade-in
    setTimeout(() => {
      setIsLightMode(prev => !prev);
    }, 250);

    // Hide the fade mask after transition completes
    setTimeout(() => {
      setShowFadeMask(false);
    }, 500);
  };

  // Keyboard shortcuts for light mode toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Option 1: Cmd/Ctrl + Shift + L
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'L' || event.key === 'l')) {
        event.preventDefault();
        console.log('Light mode toggled via Cmd+Shift+L');
        toggleLightMode();
        return;
      }

      // Option 2: Simple 'l' key (when not typing in input/textarea)
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (!isTyping && event.key === 'l' && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        console.log('Light mode toggled via L key');
        toggleLightMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <LightModeContext.Provider value={{ isLightMode, toggleLightMode }}>
      {children}
      {/* Fade mask overlay */}
      <div
        className={`fixed inset-0 z-[99999] pointer-events-none transition-opacity duration-[250ms] ${
          fadeMaskColor === 'white' ? 'bg-white' : 'bg-black'
        } ${showFadeMask ? 'opacity-100' : 'opacity-0'}`}
      />
    </LightModeContext.Provider>
  );
}

export function useLightMode() {
  const context = useContext(LightModeContext);
  if (context === undefined) {
    throw new Error('useLightMode must be used within a LightModeProvider');
  }
  return context;
}
