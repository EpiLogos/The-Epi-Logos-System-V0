import React from 'react';
import { cn } from '../../utils/cn';

interface CoordinateTextProps {
  coordinate: string; // "#0", "#1", etc.
  visible?: boolean;
  position?: 'panel' | 'overlay' | 'bottom-right'; // Panel coordinate or page overlay
  className?: string;
  linkToPageCoordinate?: boolean; // When true, set nearest data-coordinate and broadcast simple event
}

export const CoordinateText: React.FC<CoordinateTextProps> = ({
  coordinate,
  visible = false,
  position = 'panel',
  className,
  linkToPageCoordinate = false
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Minimal linkage: setting text also sets simple page coordinate data
  React.useEffect(() => {
    if (!linkToPageCoordinate) return;
    try {
      const host = containerRef.current?.closest('[data-coordinate]') as HTMLElement | null;
      if (host) {
        host.setAttribute('data-coordinate', coordinate);
      }
      // Very simple global handoff for future consumers (no resolution)
      (window as any).__CURRENT_COORDINATE_DATA__ = { coordinate };
      window.dispatchEvent(new CustomEvent('coordinate-updated', { detail: { coordinate } }));
    } catch {}
  }, [coordinate, linkToPageCoordinate]);

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
    <div ref={containerRef} className={cn(
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
