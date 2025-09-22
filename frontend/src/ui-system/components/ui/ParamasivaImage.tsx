import React from 'react';
import { cn } from '../../utils/cn';

interface ParamasivaImageProps {
  src: string;
  alt: string;
  isExpanded?: boolean;
  onClick?: () => void;
  shouldBlurImage?: boolean;
  isTransitioning?: boolean; // For reverse transition to subsystems
  className?: string;
}

export const ParamasivaImage: React.FC<ParamasivaImageProps> = ({
  src,
  alt,
  isExpanded = false,
  onClick,
  shouldBlurImage = false,
  className
}) => {
  return (
    <img
      src={src}
      alt={alt}
      onClick={onClick}
      className={cn(
        // Base styling - EXACT match to working version
        "absolute cursor-pointer object-contain",
        // Always start in centered position - let CSS classes handle timing
        "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        "w-[600px] h-[600px]",
        "z-30 contrast-100 brightness-150",
        
        // Expanded state overrides with proper Tailwind transition - EXACT match
        isExpanded && [
          "!top-[42px] !left-[37px] !transform-none", // Override positioning
          "!w-[120px] !h-[120px]", // Override size
          "!z-[60]" // Override z-index - ABOVE carousel (z-50)
        ],
        
        // Normal opacity - blur is now handled at ModalPanel level
        "opacity-70 hover:opacity-100",
        
        // Hover effect only when not expanded and not blurred - EXACT match
        !isExpanded && !shouldBlurImage && "hover:scale-105 hover:opacity-100 hover:brightness-180",
        
        // Transition utility: forward vs return
        isExpanded ? "paramasiva-image-transition" : "paramasiva-image-return-transition",

        className
      )}
    />
  );
};