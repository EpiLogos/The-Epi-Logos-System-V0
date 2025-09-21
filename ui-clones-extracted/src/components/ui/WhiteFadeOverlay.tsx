import React from 'react';
import { cn } from '../../utils/cn';

interface WhiteFadeOverlayProps {
  visible?: boolean;
  onAnimationComplete?: () => void;
  className?: string;
}

export const WhiteFadeOverlay: React.FC<WhiteFadeOverlayProps> = ({
  visible = false,
  onAnimationComplete,
  className
}) => {
  // Handle animation completion
  const handleTransitionEnd = () => {
    if (visible && onAnimationComplete) {
      onAnimationComplete();
    }
  };

  return (
    <div 
      className={cn(
        // Base overlay styling - exact from original CSS
        "fixed inset-0 w-full h-full bg-[#f5f5f5] z-[10000] pointer-events-none",
        
        // Transition timing - FASTER for reverse transition (250ms fade)
        "transition-opacity duration-[250ms] ease-out",
        
        // Visibility state
        visible ? "opacity-100" : "opacity-0",
        
        className
      )}
      onTransitionEnd={handleTransitionEnd}
    />
  );
};