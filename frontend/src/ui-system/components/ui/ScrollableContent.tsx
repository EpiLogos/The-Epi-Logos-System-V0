import React from 'react';
import { cn } from '../../utils/cn';

interface ScrollableContentProps {
  children: React.ReactNode;
  visible?: boolean;
  className?: string;
}

export const ScrollableContent: React.FC<ScrollableContentProps> = ({
  children,
  visible = true,
  className
}) => {
  return (
    <div className={cn(
      "flex-1 overflow-hidden flex flex-col",
      // Visibility animation - only transition opacity and filter
      "transition-[opacity,filter] duration-600 ease-out",
      visible ? "opacity-100 blur-none" : "opacity-0 blur-[10px]",
      className
    )}>
      <div
        className={cn(
          "w-full overflow-y-auto overflow-x-hidden scrollbar-thin-custom min-h-[300px]",
          // Use Tailwind max-height class instead of inline styles - matches ProjectDetails pattern
          "max-h-[calc(100vh-165px)]"
        )}
      >
        <div className="text-[14px] text-[#333] leading-[1.6] space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};