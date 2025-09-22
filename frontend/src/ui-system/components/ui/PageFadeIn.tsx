import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

interface PageFadeInProps {
  children: React.ReactNode;
  className?: string;
}

export const PageFadeIn: React.FC<PageFadeInProps> = ({ 
  children, 
  className 
}) => {
  const [whiteOverlayVisible, setWhiteOverlayVisible] = useState(true);
  const [contentBlurred, setContentBlurred] = useState(true);
  const timerRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Clear any existing timers
    timerRefs.current.forEach(timer => clearTimeout(timer));
    timerRefs.current = [];

    // Brief delay to ensure new page content is fully hydrated and ready
    // This prevents flashing of unloaded content between transitions
    const hydrationTimer = setTimeout(() => {
      // Phase 1: White overlay fades out after hydration + 300ms (reduced from 500ms)
      const whiteTimer = setTimeout(() => {
        setWhiteOverlayVisible(false);
      }, 300);

      // Phase 2: Content blur clears after 500ms (reduced from 700ms) 
      const blurTimer = setTimeout(() => {
        setContentBlurred(false);
      }, 500);

      timerRefs.current.push(whiteTimer, blurTimer);
    }, 50); // Reduced delay for Next.js hydration (from 100ms to 50ms)

    timerRefs.current.push(hydrationTimer);

    return () => {
      timerRefs.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  return (
    <>
      {/* White overlay - fades out over 600ms */}
      <div className={cn(
        "fixed -top-[5px] -left-[5px] w-[calc(100vw+10px)] h-[calc(100vh+10px)] bg-[#f5f5f5] z-[9999] transition-opacity duration-[600ms] ease-out pointer-events-none",
        whiteOverlayVisible ? "opacity-100" : "opacity-0"
      )} />
      
      {/* Content - starts blurred, clears after 800ms */}
      <div className={cn(
        "transition-all duration-[200ms] ease-out",
        contentBlurred ? "blur-[4px]" : "blur-none",
        className
      )}>
        {children}
      </div>
    </>
  );
};

export default PageFadeIn;