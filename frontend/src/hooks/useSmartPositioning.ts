'use client';

import { useState, useEffect, useCallback } from 'react';

interface Position {
  top: number;
  right: number;
}

/**
 * Smart positioning hook for navbar toggle
 * Detects coordinate text and other content to avoid overlays
 */
export function useSmartPositioning() {
  const [position, setPosition] = useState<Position>({ top: 16, right: 16 });

  const calculatePosition = useCallback(() => {
    const minMargin = 16;

    // Always use top-right position - coordinate text has been cleaned up
    const newPosition: Position = { top: minMargin, right: minMargin };
    setPosition(newPosition);
  }, []);

  // Calculate position on mount and window resize
  useEffect(() => {
    calculatePosition();
    
    const handleResize = () => {
      setTimeout(calculatePosition, 100); // Debounce resize
    };

    window.addEventListener('resize', handleResize);
    
    // Recalculate when DOM changes (for dynamic content)
    const observer = new MutationObserver(() => {
      setTimeout(calculatePosition, 100);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-coordinate', 'class']
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [calculatePosition]);

  return position;
}
