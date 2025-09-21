import React from 'react';
import { cn } from '../../lib/utils';

interface ExpansionSquareProps {
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

export const ExpansionSquare: React.FC<ExpansionSquareProps> = ({
  isExpanded,
  onToggle,
  className
}) => {
  return (
    <div 
      className={cn(
        "w-[25px] h-[25px] border border-[#666] bg-transparent cursor-pointer transition-all duration-300 hover:border-[#333] hover:bg-[#f8f8f8] hover:shadow-sm flex items-center justify-center",
        className
      )}
      onClick={onToggle}
      style={{
        borderWidth: '1px',
      }}
    >
      <div className="text-[#666] text-xs font-normal select-none">
        {isExpanded ? '−' : '+'}
      </div>
    </div>
  );
};