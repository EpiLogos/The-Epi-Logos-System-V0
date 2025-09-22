import React from 'react';
import { cn } from '../../utils/cn';

interface CoordinateTextProps {
  coordinate: string; // "#0", "#1", etc.
  visible?: boolean;
  position?: 'panel' | 'overlay' | 'bottom-right'; // Panel coordinate or page overlay
  className?: string;
}

export const CoordinateText: React.FC<CoordinateTextProps> = ({
  coordinate,
  visible = false,
  position = 'panel',
  className
}) => {
  const getPositionClasses = () => {
    if (position === 'panel') {
      // Panel coordinate text - exact from original CSS .panel-coordinate-text
      return "absolute bottom-[30px] right-[40px] text-[72px] text-ui-coord-text tracking-[0px] font-bold scale-x-90 origin-right pointer-events-none z-10";
    }
    
    if (position === 'overlay') {
      // Page overlay coordinate (like paramasiva #1) - absolute positioned to scroll with page
      return "absolute right-[30px] bottom-[-11px] text-[90px] text-[#666666] tracking-[0px] font-bold scale-x-90 origin-right pointer-events-none z-1";
    }

    if (position === 'bottom-right') {
      // Bottom-right position for specific use cases
      return "absolute bottom-[30px] right-[40px] text-[72px] text-ui-coord-text tracking-[0px] font-bold scale-x-90 origin-right pointer-events-none z-10";
    }
    
    return "";
  };

  return (
    <div className={cn(
      // Position-specific styling
      getPositionClasses(),
      
      // Visibility animation - exact from original CSS timing
      "transition-[opacity,filter] duration-coord-text ease-linear",
      visible ? "opacity-100 blur-none" : "opacity-0 blur-[10px]",
      
      className
    )}>
      {coordinate}
    </div>
  );
};