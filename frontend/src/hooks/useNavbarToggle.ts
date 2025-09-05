'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Global navbar toggle hook
 * Manages navbar visibility state and keyboard shortcuts across the app
 */
export function useNavbarToggle() {
  const [isVisible, setIsVisible] = useState(true);

  // Toggle function
  const toggle = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  // Keyboard shortcut (Esc key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return {
    isVisible,
    toggle,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false)
  };
}
