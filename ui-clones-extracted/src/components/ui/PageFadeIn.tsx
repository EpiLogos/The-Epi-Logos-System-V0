import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Phase 1: White overlay fades out after 600ms
    const whiteTimer = setTimeout(() => {
      setWhiteOverlayVisible(false);
    }, 600);

    // Phase 2: Content blur clears after 800ms  
    const blurTimer = setTimeout(() => {
      setContentBlurred(false);
    }, 800);

    return () => {
      clearTimeout(whiteTimer);
      clearTimeout(blurTimer);
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