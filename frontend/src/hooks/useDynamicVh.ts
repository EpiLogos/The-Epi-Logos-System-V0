'use client';

import { useEffect } from 'react';

/**
 * Sets a CSS custom property --vh that represents 1% of actual viewport height
 * Handles mobile browser address bar issues where 100vh != actual viewport
 *
 * Usage in CSS/Tailwind:
 * height: calc(var(--vh, 1vh) * 100)
 * or
 * className="h-[calc(var(--vh,1vh)*100)]"
 */
export function useDynamicVh() {
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set on mount
    setVh();

    // Update on resize with debouncing
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(setVh, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', setVh);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', setVh);
      clearTimeout(timeoutId);
    };
  }, []);
}
