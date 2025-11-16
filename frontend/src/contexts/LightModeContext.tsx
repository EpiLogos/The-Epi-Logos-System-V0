'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LightModeContextType {
  isLightMode: boolean;
  toggleLightMode: () => void;
}

const LightModeContext = createContext<LightModeContextType | undefined>(undefined);

export function LightModeProvider({ children }: { children: ReactNode }) {
  const [isLightMode, setIsLightMode] = useState(false);

  const toggleLightMode = () => {
    setIsLightMode(prev => !prev);
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
