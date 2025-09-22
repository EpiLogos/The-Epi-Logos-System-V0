import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface TextAnimateProps {
  children: React.ReactNode;
  visible?: boolean;
  delay?: number;
  duration?: 'fast' | 'normal' | 'slow' | 'slower';
  className?: string;
}

export const TextAnimate: React.FC<TextAnimateProps> = ({
  children,
  visible = true,
  delay = 0,
  duration = 'normal',
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // FIXED: Single useEffect to prevent timer conflicts and StrictMode issues
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      // Immediately hide when visible becomes false (for transitions)
      setIsVisible(false);
    }
  }, [delay, visible]);

  // Pure Tailwind v4 duration classes
  const getDurationClass = () => {
    switch (duration) {
      case 'fast': return 'duration-300';
      case 'slow': return 'duration-800';
      case 'slower': return 'duration-[550ms]'; // 200ms slower than normal (350ms + 200ms = 550ms)
      default: return 'duration-350'; // Sped up from 600ms to 350ms (250ms faster)
    }
  };

  return (
    <div
      className={cn(
        // Pure Tailwind v4 transitions - no inline styles
        "transition-[opacity,filter] ease-linear",
        getDurationClass(),
        isVisible ? "opacity-100 blur-none" : "opacity-0 blur-[10px]",
        className
      )}
    >
      {children}
    </div>
  );
};