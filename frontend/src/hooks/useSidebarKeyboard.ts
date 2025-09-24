'use client';

import { useEffect } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';

/**
 * Hook to add ESC key functionality to sidebar toggle
 * Uses the existing SidebarContext toggle function
 */
export function useSidebarKeyboard() {
  const { toggle } = useSidebar();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  // Return the toggle function in case components need direct access
  return { toggle };
}
