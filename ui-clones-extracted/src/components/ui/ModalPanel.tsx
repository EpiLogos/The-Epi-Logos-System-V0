import React from 'react';
import { cn } from '../../utils/cn';

interface ModalPanelProps {
  children: React.ReactNode;
  isModalExpanded?: boolean;
  animationPhase?: 'idle' | 'height-expanding' | 'width-expanding' | 'icon-moving' | 'complete';
  shouldBlur?: boolean; // Global blur effect for transitions
  showGridLines?: boolean; // Second phase grid lines fade-in
  className?: string;
}

export const ModalPanel = React.forwardRef<HTMLDivElement, ModalPanelProps>(({
  children,
  shouldBlur = false,
  showGridLines = false,
  className
}, ref) => {
  // Debug logging
  React.useEffect(() => {
    console.log('ModalPanel: showGridLines =', showGridLines);
  }, [showGridLines]);
  return (
    <div 
      ref={ref}
      className={cn(
      // Base panel styling from original .adjusted-right-panel - EXACT match
      "w-full h-full flex items-center justify-center p-10 relative z-10",
      // Force black background and exact border from original
      "!bg-[#090a09] border-[2px] border-[#cacaca]",
      
      // Global blur effect for transitions (like SubsystemsPage)
      shouldBlur && "blur-[12px] opacity-10 transition-[filter,opacity] duration-[1200ms] delay-0 ease-gentle",
      
      className
    )}>
      {children}
    </div>
  );
});

ModalPanel.displayName = 'ModalPanel';