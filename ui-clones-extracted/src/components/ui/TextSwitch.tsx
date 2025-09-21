import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface TextSwitchProps {
  text: string;
  visible?: boolean;
  delay?: number;
  duration?: 'fast' | 'normal' | 'slow';
  className?: string;
}

export const TextSwitch: React.FC<TextSwitchProps> = ({
  text,
  visible = true,
  delay = 0,
  duration = 'normal',
  className
}) => {
  const [currentText, setCurrentText] = useState(text);
  const [isVisible, setIsVisible] = useState(false);
  const [, setIsTransitioning] = useState(false);

  // Auto-animate on mount like original text-generate.js
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, []); // Only run once on mount

  // Handle visibility changes (for inter-page transitions)
  useEffect(() => {
    if (!visible) {
      setIsVisible(false);
    }
  }, [visible]);

  // Handle text content changes with proper transition timing
  useEffect(() => {
    if (text !== currentText && visible) {
      setIsTransitioning(true);
      
      // PHASE 1: Fade out current text
      setIsVisible(false);
      
      // PHASE 2: Stay hidden longer, then switch content
      setTimeout(() => {
        setCurrentText(text);
      }, getDurationMs()); // Full duration to stay hidden
      
      // PHASE 3: Fade back in with new content after additional delay
      setTimeout(() => {
        setIsVisible(true);
        setIsTransitioning(false);
      }, getDurationMs() + 300); // Stay hidden + extra delay before fade in
    } else if (text !== currentText && !visible) {
      // If not visible, just switch text immediately
      setCurrentText(text);
    }
  }, [text, visible]);

  // Convert duration to milliseconds
  const getDurationMs = () => {
    switch (duration) {
      case 'fast': return 300;
      case 'slow': return 800;
      default: return 600;
    }
  };

  // Pure Tailwind v4 duration classes
  const getDurationClass = () => {
    switch (duration) {
      case 'fast': return 'duration-300';
      case 'slow': return 'duration-800';
      default: return 'duration-600';
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
      {currentText}
    </div>
  );
};