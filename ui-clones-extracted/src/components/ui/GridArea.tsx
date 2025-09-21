import React from 'react';
import { cn } from '../../utils/cn';

interface GridAreaProps {
  children: React.ReactNode;
  className?: string;
}

export const GridArea: React.FC<GridAreaProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      // Grid layout - exact from original CSS (.grid-main-area)
      "flex-1 grid grid-cols-3 grid-rows-2 gap-0 h-screen bg-[#090a09]",
      
      className
    )}>
      {children}
    </div>
  );
};