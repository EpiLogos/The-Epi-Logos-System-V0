import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { SubsystemModalOverlay } from './SubsystemModalOverlay';
import { SUBSYSTEM_DATA } from '../../data/subsystemsData';
import type { SubsystemData } from '../../data/subsystemsData';

interface CoordinateTextWithModalProps {
  coordinate: string; // "#0", "#1", etc.
  visible?: boolean;
  position?: 'panel' | 'overlay' | 'bottom-right';
  className?: string;
  disableModal?: boolean;
}

export const CoordinateTextWithModal: React.FC<CoordinateTextWithModalProps> = ({
  coordinate,
  visible = false,
  position = 'panel',
  className,
  disableModal = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [panelRect, setPanelRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract coordinate number for data lookup
  const coordinateNumber = coordinate.replace('#', '');
  const subsystemData: SubsystemData | undefined = SUBSYSTEM_DATA[coordinateNumber];

  useEffect(() => {
    // Measure the panel once available, and refresh on hover changes
    const updateRect = () => {
      const panelElement = containerRef.current?.parentElement;
      if (panelElement) {
        setPanelRect(panelElement.getBoundingClientRect());
      }
    };
    updateRect();
    // NOTE: Do not clear panelRect on hover-out; keep the element mounted for fade-out
  }, [isHovered]);

  const getPositionClasses = () => {
    if (position === 'panel') {
      // Panel coordinate text - exact from original CSS .panel-coordinate-text
      // BUT with pointer-events enabled for hover functionality
      return "absolute bottom-[30px] right-[40px] text-[72px] text-[#666666] tracking-[0px] font-bold scale-x-90 origin-right z-20";
    }
    
    if (position === 'overlay') {
      // Page overlay coordinate (like paramasiva #1) - exact from original  
      return "fixed right-[30px] bottom-[10px] text-[90px] text-[#666666] tracking-[0px] font-bold scale-x-90 origin-right z-1";
    }

    if (position === 'bottom-right') {
      // Bottom-right position for specific use cases
      return "absolute bottom-[30px] right-[40px] text-[72px] text-ui-coord-text tracking-[0px] font-bold scale-x-90 origin-right z-20";
    }
    
    return "";
  };

  // Keep overlay mounted once measured; toggle visibility via isHovered
  const canRenderOverlay = position === 'panel' && !!subsystemData && !!panelRect && !disableModal;


  return (
    <>
      <div 
        ref={containerRef}
        className={cn(
          // Position-specific styling
          getPositionClasses(),
          
          // Visibility animation - exact from original CSS timing
          "transition-[opacity,filter] duration-coord-text ease-linear",
          visible ? "opacity-100 blur-none" : "opacity-0 blur-[10px]",
          
          // Add hover cursor and pointer events only for panel position with data
          position === 'panel' && subsystemData && "cursor-pointer hover:text-[#888888] pointer-events-auto",
          
          // Disable pointer events for non-hoverable positions (maintain original behavior)
          position !== 'panel' && "pointer-events-none",
          
          className
        )}
        onMouseEnter={() => {
          if (position === 'panel' && subsystemData && !disableModal) {
            setIsHovered(true);
          }
        }}
        onMouseLeave={() => {
          if (position === 'panel' && subsystemData && !disableModal) {
            setIsHovered(false);
          }
        }}
      >
        {coordinate}
      </div>

      {/* Portal modal overlay - keep mounted once measured; toggle visibility */}
      {canRenderOverlay && createPortal(
        <SubsystemModalOverlay
          isVisible={isHovered}
          title={subsystemData.title}
          description={subsystemData.description}
          panelRect={panelRect}
          coordinate={coordinate}
        />,
        document.body
      )}
    </>
  );
};