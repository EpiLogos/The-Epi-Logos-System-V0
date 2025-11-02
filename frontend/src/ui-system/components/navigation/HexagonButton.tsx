import React from 'react';
import { cn } from '../../utils/cn';

interface HexagonButtonProps {
  onClick: () => void;
  isOpen: boolean;
  className?: string;
}

export const HexagonButton: React.FC<HexagonButtonProps> = ({
  onClick,
  isOpen,
  className
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? 'Close quick access panel' : 'Open quick access panel'}
      tabIndex={0}
      className={cn(
        'p-2 transition-colors duration-200 cursor-pointer',
        isOpen ? 'text-[#944040]' : 'text-[#333]',
        'hover:text-[#666]',
        className
      )}
    >
      {/* SVG Hexagon - sacred geometry with 6 vertices */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-200"
      >
        {/*
          Hexagon path: 6 vertices arranged in sacred geometry
          Starting from top vertex, moving clockwise
          Center at (12, 12), radius ~8
        */}
        <path
          d="M 12 4 L 19.856 8 L 19.856 16 L 12 20 L 4.144 16 L 4.144 8 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Inner circle for emphasis when open */}
        {isOpen && (
          <circle
            cx="12"
            cy="12"
            r="3"
            fill="currentColor"
            opacity="0.3"
          />
        )}
      </svg>
    </button>
  );
};
