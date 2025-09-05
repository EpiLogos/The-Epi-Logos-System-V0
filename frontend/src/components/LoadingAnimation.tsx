"use client";

import React from 'react';

interface LoadingAnimationProps {
  size?: number;
  className?: string;
}

/**
 * Geometric Loading Animation Component
 * 
 * Implements the 7-square geometric animation pattern converted from styled-components
 * to Tailwind CSS for the foundation interface. Features 45-degree rotation with
 * staggered delays for a dynamic visual effect.
 * 
 * Based on Story 00.02 requirements for foundation interface implementation.
 */
export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  size = 200, 
  className = '' 
}) => {
  const squareSize = size / 7; // Each square is 1/7 of total size
  const animationDuration = '10s'; // 10s ease-in-out infinite as specified
  
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label="Loading animation"
    >
      {/* Container for all squares with central positioning */}
      <div className="relative w-full h-full">
        {Array.from({ length: 7 }, (_, index) => {
          const delay = index * 0.2; // Stagger delays by 200ms
          const rotation = 45; // 45-degree rotation as specified
          
          // Calculate position for each square in a circular arrangement
          const angle = (index * 360) / 7; // Distribute squares evenly in circle
          const radius = size * 0.3; // Position squares at 30% of container radius
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          
          return (
            <div
              key={index}
              className={`
                absolute
                bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500
                rounded-sm
                shadow-lg
                transform-gpu
                animate-spin-pulse
              `}
              style={{
                width: squareSize,
                height: squareSize,
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                animation: `spin-pulse ${animationDuration} ease-in-out infinite`,
                animationDelay: `${delay}s`,
                // Custom animation keyframes defined in CSS
                '--square-index': index,
              }}
            />
          );
        })}
        
        {/* Central core square */}
        <div
          className={`
            absolute
            left-1/2 top-1/2
            transform -translate-x-1/2 -translate-y-1/2
            bg-gradient-to-br from-yellow-400 to-orange-500
            rounded-full
            shadow-2xl
            animate-pulse-glow
          `}
          style={{
            width: squareSize * 1.5,
            height: squareSize * 1.5,
            animation: `pulse-glow ${animationDuration} ease-in-out infinite reverse`,
          }}
        />
      </div>
      
      {/* CSS-in-JS style injection for custom animations */}
      <style jsx>{`
        @keyframes spin-pulse {
          0%, 100% {
            transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) rotate(45deg) scale(1);
            opacity: 0.8;
          }
          25% {
            transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) rotate(135deg) scale(1.2);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) rotate(225deg) scale(0.8);
            opacity: 0.6;
          }
          75% {
            transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) rotate(315deg) scale(1.1);
            opacity: 0.9;
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            box-shadow: 0 0 20px rgba(255, 165, 0, 0.5);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.3);
            box-shadow: 0 0 40px rgba(255, 165, 0, 0.8);
          }
        }
        
        .animate-spin-pulse {
          animation: spin-pulse ${animationDuration} ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow ${animationDuration} ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

/**
 * Responsive Loading Animation Wrapper
 * 
 * Automatically adjusts size based on screen size for responsive behavior
 */
export const ResponsiveLoadingAnimation: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      {/* Mobile: smaller animation */}
      <div className="block sm:hidden">
        <LoadingAnimation size={150} />
      </div>
      
      {/* Tablet: medium animation */}
      <div className="hidden sm:block lg:hidden">
        <LoadingAnimation size={200} />
      </div>
      
      {/* Desktop: large animation */}
      <div className="hidden lg:block">
        <LoadingAnimation size={300} />
      </div>
    </div>
  );
};

/**
 * Loading Animation with Status Text
 * 
 * Combines the geometric animation with service initialization status
 */
interface LoadingWithStatusProps {
  status?: string;
  subtext?: string;
  className?: string;
}

export const LoadingAnimationWithStatus: React.FC<LoadingWithStatusProps> = ({
  status = "Initializing Epi-Logos System",
  subtext = "Validating tri-laminar architecture...",
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-8 ${className}`}>
      <ResponsiveLoadingAnimation />
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
          {status}
        </h2>
        <p className="text-gray-300 text-sm md:text-base font-light">
          {subtext}
        </p>
        
        {/* Loading dots */}
        <div className="flex justify-center space-x-1 mt-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.3}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;