import React from 'react';
import { cn } from '../../utils/cn';

interface ImageOverlayProps {
  src: string;
  alt: string;
  isRepositioned?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ImageOverlay: React.FC<ImageOverlayProps> = ({
  src,
  alt,
  isRepositioned = false,
  onClick,
  className
}) => {
  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center",
      className
    )}>
      {/* Click handler overlay */}
      {onClick && (
        <div 
          className="absolute inset-0 cursor-pointer z-10"
          onClick={onClick}
        />
      )}
      
      {/* Center Image with repositioning animation */}
      <img
        src={src}
        alt={alt}
        className={cn(
          // Base image styling - exact from original .panel-center-image
          "max-w-[60%] max-h-[60%] object-contain opacity-80",
          
          // Transition timing - exact from original icon move timing
          "transition-all duration-icon-move ease-out",
          
          // Repositioning transform - exact from original CSS
          isRepositioned 
            ? "translate-x-[-50px] translate-y-[-50px] scale-110" 
            : "translate-x-0 translate-y-0 scale-100",
          
          // Hover effect
          onClick && "hover:scale-105 transition-transform duration-hover-quick"
        )}
      />
    </div>
  );
};