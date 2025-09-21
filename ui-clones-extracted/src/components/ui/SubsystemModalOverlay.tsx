import React from 'react';
import { cn } from '../../utils/cn';

interface SubsystemModalOverlayProps {
  isVisible: boolean;
  title: string;
  description: string;
  panelRect: DOMRect | null;
  coordinate: string;
}

export const SubsystemModalOverlay: React.FC<SubsystemModalOverlayProps> = ({
  isVisible,
  title,
  description,
  panelRect,
  coordinate
}) => {
  if (!panelRect) return null;
  

  return (
    <div
      data-modal-overlay
      data-visible={isVisible}
      className={cn(
        // Base styling - reversed colors from coordinate panels
        "bg-[#f5f5f5] border-[1.222px] border-[#cacaca] rounded-none overflow-hidden z-20",

        // SINGLE UTILITY - Contains full state + transition logic
        "coordinate-modal-hover"
      )}
      style={{
        // Fixed positioning with exact panel dimensions
        position: 'fixed',
        top: panelRect.top,
        left: panelRect.left,
        width: panelRect.width,
        height: panelRect.height,
        // Disable pointer events to prevent interference with coordinate text hover
        pointerEvents: 'none'
      }}
    >
      {/* Coordinate text in corner */}
      <div className="absolute bottom-[30px] right-[40px] text-[72px] text-[#666666] tracking-[0px] font-bold scale-x-90 origin-right z-30">
        {coordinate}
      </div>
      
      {/* Modal content container */}
      <div className="p-6 h-full flex flex-col justify-center items-center">
        {/* Title - prominent and centered */}
        <h3 className="text-[20px] font-bold tracking-[1px] text-[#333333] mb-4 text-center">
          {title}
        </h3>
        
        {/* Description - readable and centered */}
        <p className="text-[13px] font-normal leading-[1.5] text-[#666666] text-center px-2">
          {description}
        </p>
      </div>
    </div>
  );
};