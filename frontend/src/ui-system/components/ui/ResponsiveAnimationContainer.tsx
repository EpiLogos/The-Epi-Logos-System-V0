import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

interface ResponsiveAnimationContainerProps {
  children: React.ReactNode;
  isExpanded?: boolean;
  repositioned?: boolean;
  className?: string;
  // Animation timing controls
  transitionDuration?: number;
  transitionDelay?: number;
  // Container behavior controls
  preserveAspectRatio?: boolean;
  refreshOnResize?: boolean;
}

export const ResponsiveAnimationContainer: React.FC<ResponsiveAnimationContainerProps> = ({
  children,
  isExpanded = false,
  repositioned = false,
  className = '',
  transitionDuration = 600,
  transitionDelay = 0,
  preserveAspectRatio = true,
  refreshOnResize = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle container resize refresh for child animations
  useEffect(() => {
    if (!refreshOnResize) return;

    const handleResize = () => {
      if (containerRef.current) {
        // Trigger a re-render for child components that need to recalculate dimensions
        const event = new CustomEvent('containerResize', {
          detail: { 
            container: containerRef.current,
            isExpanded,
            repositioned 
          }
        });
        containerRef.current.dispatchEvent(event);
      }
    };

    // Debounced resize handler
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    
    // Also trigger on state changes
    handleResize();

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, [isExpanded, repositioned, refreshOnResize]);

  return (
    <div
      ref={containerRef}
      className={cn(
        // Base container styles
        'absolute inset-0 w-full h-full overflow-hidden',
        
        // Aspect ratio preservation
        preserveAspectRatio && 'flex items-center justify-center',
        
        // Smooth transitions for all child animations
        'transition-all ease-out',
        
        // Custom transition timing
        className
      )}
      style={{
        transitionDuration: `${transitionDuration}ms`,
        transitionDelay: `${transitionDelay}ms`,
      }}
      data-expanded={isExpanded}
      data-repositioned={repositioned}
    >
      {children}
    </div>
  );
};

// Wrapper for background animations that need responsive behavior
interface ResponsiveBackgroundProps {
  children: React.ReactNode;
  isExpanded?: boolean;
  repositioned?: boolean;
  onContainerResize?: (container: HTMLElement, state: { isExpanded: boolean; repositioned: boolean }) => void;
  className?: string;
  // Wave-specific fade-in behavior
  fadeInDelay?: number;
  initiallyVisible?: boolean;
  // Modal expansion fade-back-in behavior
  modalFadeInDelay?: number;
  modalFadeInEnabled?: boolean;
  // Filter controls
  enableBlurFilter?: boolean;
  // Re-render controls
  reRenderDuringInvisibility?: boolean;
  reRenderDelay?: number;
  // Transition controls
  returnTransitionDuration?: number;
}

export const ResponsiveBackground: React.FC<ResponsiveBackgroundProps> = ({
  children,
  isExpanded = false,
  repositioned = false,
  onContainerResize,
  className = '',
  fadeInDelay = 1000,
  initiallyVisible = false,
  modalFadeInDelay = 2000, // Default delay for modal fade-in (after image repositioning starts)
  modalFadeInEnabled = true,
  enableBlurFilter = true, // Default to enabled (for waves), disable for particles
  reRenderDuringInvisibility = true, // Default to enabled for fresh modal sizing
  reRenderDelay = 1500, // Re-render at peak invisibility (mid-animation)
  returnTransitionDuration = 1200, // Smooth return transition duration
}) => {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const [hasInitalFadeIn, setHasInitalFadeIn] = React.useState(initiallyVisible);
  const [hasModalFadeIn, setHasModalFadeIn] = React.useState(false);
  const [reRenderKey, setReRenderKey] = React.useState(0);

  // Handle initial fade-in effect like HTML version
  useEffect(() => {
    if (!initiallyVisible && fadeInDelay > 0) {
      const timer = setTimeout(() => {
        setHasInitalFadeIn(true);
      }, fadeInDelay);
      return () => clearTimeout(timer);
    }
  }, [fadeInDelay, initiallyVisible]);

  // Handle modal expansion fade-in (after image repositioning begins)
  useEffect(() => {
    if (isExpanded && modalFadeInEnabled) {
      // Reset fade-in state when modal first expands
      setHasModalFadeIn(false);
      
      // Re-render at peak invisibility for fresh modal sizing
      if (reRenderDuringInvisibility) {
        setTimeout(() => {
          setReRenderKey(prev => prev + 1); // Force re-render with new dimensions
        }, reRenderDelay);
      }
      
      // Fade back in after the image repositioning starts
      const timer = setTimeout(() => {
        setHasModalFadeIn(true);
      }, modalFadeInDelay);
      
      return () => {
        clearTimeout(timer);
        if (reRenderDuringInvisibility) {
          // Clear re-render timer if component unmounts
        }
      };
    } else {
      // Reset when modal is not expanded
      setHasModalFadeIn(false);
    }
  }, [isExpanded, modalFadeInDelay, modalFadeInEnabled, reRenderDuringInvisibility, reRenderDelay]);

  useEffect(() => {
    const container = backgroundRef.current;
    if (!container) return;

    const handleContainerResize = (event: CustomEvent) => {
      if (onContainerResize) {
        onContainerResize(event.detail.container, {
          isExpanded: event.detail.isExpanded,
          repositioned: event.detail.repositioned
        });
      }
    };

    container.addEventListener('containerResize', handleContainerResize as EventListener);

    return () => {
      container.removeEventListener('containerResize', handleContainerResize as EventListener);
    };
  }, [onContainerResize]);

  return (
    <div
      ref={backgroundRef}
      className={cn(
        // Base positioning
        'absolute inset-0 w-full h-full',
        
        // State-based transformations using Tailwind v4 - unified brightness approach
        isExpanded && repositioned && hasModalFadeIn ? [
          // Expanded + repositioned + faded back in (modal fully expanded with backgrounds visible)
          enableBlurFilter ? 'opacity-20' : 'opacity-70', // Waves dimmer, particles brighter in expanded state
          enableBlurFilter ? 'blur-[1px]' : 'blur-none', // Conditional blur for depth
          'scale-105', // Slight scale to fill expanded space
        ] : isExpanded && hasModalFadeIn ? [
          // Expanded + faded back in but not repositioned yet
          enableBlurFilter ? 'opacity-15' : 'opacity-60', // Gradual transition for both
          enableBlurFilter ? 'blur-[2px]' : 'blur-none', // Conditional light blur
          'scale-100',
        ] : isExpanded ? [
          // Expanded but not faded back in yet (modal expanding)
          'opacity-0', // Fade out during expansion
          enableBlurFilter ? 'blur-[8px]' : 'blur-none', // Conditional heavy blur
          'scale-100',
        ] : hasInitalFadeIn ? [
          // Default state after initial fade-in (normal view)
          'opacity-100', // Both fully visible in normal state
          enableBlurFilter ? 'blur-[2px]' : 'blur-none', // Conditional subtle blur
          'scale-100',
        ] : [
          // Initial state before fade-in
          'opacity-0', // Start invisible like HTML version
          enableBlurFilter ? 'blur-[2px]' : 'blur-none', // Conditional subtle blur even when invisible
          'scale-100',
        ],
        
        // Smooth transitions for all transform properties
        'transition-all ease-out',
        
        // Ensure proper layering
        'pointer-events-none',
        
        className
      )}
      style={{
        // Dynamic transition duration based on state
        transitionDuration: !isExpanded && hasInitalFadeIn 
          ? `${returnTransitionDuration}ms` // Smooth return transition
          : '800ms' // Standard transitions
      }}
    >
      {/* Use reRenderKey to force fresh render during invisibility */}
      <div key={reRenderKey}>
        {children}
      </div>
    </div>
  );
};

export default ResponsiveAnimationContainer;