import React from 'react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  children: React.ReactNode;
  variant: 'subsystems' | 'paramasiva' | 'epi-logos' | 'main';
  isModalExpanded?: boolean;
  isTransitioning?: boolean;
  transitionDirection?: 'to-subsystems' | 'to-quaternal' | 'idle';
  animationPhase?: string;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  children,
  variant,
  isModalExpanded = false,
  isTransitioning = false,
  transitionDirection = 'idle',
  animationPhase = 'initial',
  className
}) => {
  // Calculate width based on variant and modal state
  const getWidth = () => {
    if (variant === 'subsystems') {
      return 'w-[300px]'; // Grid sidebar width
    }
    
    if (variant === 'paramasiva') {
      // TRANSITION HANDLING: Multiple directions from Paramasiva
      if (isTransitioning) {
        if (transitionDirection === 'to-subsystems') {
          // PARAMASIVA → SUBSYSTEMS: Shrink to grid width
          return 'w-[300px]';
        } else if (transitionDirection === 'to-quaternal') {
          // PARAMASIVA → QUATERNAL LOGIC: Stay at 420px (main sidebar width)
          return 'w-[420px]';
        }
      }
      
      // NORMAL PARAMASIVA STATES
      return isModalExpanded ? 'w-[420px]' : 'w-[calc(100vw-420px)]'; // Expanded left sidebar
    }

    if (variant === 'epi-logos') {
      // REVERSE MODAL HANDLING: EpiLogos → Subsystems
      if (isTransitioning) {
        // During reverse transition: Sidebar should expand from 420px back to full screen
        return 'w-screen'; // Back to full screen width
      }
      
      // NORMAL EPI-LOGOS STATES
      // EPI-LOGOS: Full-width initial state → narrow expanded state
      return isModalExpanded ? 'w-[420px]' : 'w-screen'; // Full screen → narrow sidebar
    }

    if (variant === 'main') {
      // MAIN: Standard portfolio sidebar (quaternal logic page)
      return 'w-[420px]'; // Fixed main sidebar width
    }
    
    return 'w-[420px]'; // Default
  };

  return (
    <div className={cn(
      // Base sidebar styling - FIXED: Remove overflow-hidden when modal expanded to allow scrolling
      "bg-[#f5f5f5] px-10 py-8 flex flex-col justify-between flex-shrink-0 h-screen max-h-screen",
      // Only hide overflow when NOT in modal expanded state (to allow scrollable content)
      !isModalExpanded && "overflow-hidden",
      
      // Width based on variant and state
      getWidth(),
      
      // Border for subsystems and main variants (always)
      variant === 'subsystems' && "border-r border-[#e0e0e0]",
      variant === 'main' && "border-r border-[#e0e0e0]",
      
      // Border for epi-logos (only after width expansion starts)
      variant === 'epi-logos' && animationPhase === 'width-expanding' && "border-r border-[#e0e0e0]",
      variant === 'epi-logos' && animationPhase === 'height-expanding' && "border-r border-[#e0e0e0]", 
      variant === 'epi-logos' && animationPhase === 'complete' && "border-r border-[#e0e0e0]",
      
      // Transition for paramasiva width changes during modal expansion or reverse transition
      variant === 'paramasiva' && (isTransitioning && transitionDirection === 'to-subsystems'
        ? "transition-[width] duration-1000 ease-out delay-200" // Subsystems transition timing
        : isTransitioning && transitionDirection === 'to-quaternal'
        ? "transition-quaternal-sidebar-shrink" // Quaternal transition utility (coordinated with ContentPanel)
        : "transition-[width] duration-1000 ease-out delay-1000" // Normal modal expansion timing
      ),
        
      // Transition for epi-logos width changes 
      variant === 'epi-logos' && (isTransitioning
        ? "transition-[width] duration-1000 ease-paramasiva delay-200" // Reverse modal transition timing (200ms after text fade)
        : "transition-all duration-1000 ease-out delay-[750ms]" // Normal modal expansion timing
      ),
      
      
      // Remove border bottom for paramasiva when modal expanded
      variant === 'paramasiva' && isModalExpanded && "border-b border-[#e0e0e0]",
      
      className
    )}>
      {children}
    </div>
  );
};