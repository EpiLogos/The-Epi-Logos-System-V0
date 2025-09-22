import React from 'react';
import { cn } from '../../utils/cn';

interface PortfolioContainerProps {
  children: React.ReactNode;
  pageType: 'subsystems' | 'paramasiva' | 'epi-logos' | 'quaternal-logic';
  isModalExpanded?: boolean;
  isTransitioning?: boolean;
  transitionDirection?: 'to-paramasiva' | 'to-subsystems' | 'to-main' | 'to-quaternal' | 'idle';
  className?: string;
}

export const PortfolioContainer: React.FC<PortfolioContainerProps> = ({
  children,
  pageType,
  isModalExpanded = false,
  isTransitioning = false,
  transitionDirection,
  className
}) => {
  // Get page-specific styling
  const getPageStyles = () => {
    if (pageType === 'paramasiva') {
      return isModalExpanded 
        ? "overflow-hidden" // Modal expanded state
        : ""; // Normal paramasiva state
    }
    
    if (pageType === 'subsystems') {
      return ""; // Grid coordinates page styling
    }

    if (pageType === 'epi-logos') {
      return ""; // EpiLogos page styling - simple layout
    }

    if (pageType === 'quaternal-logic') {
      return isModalExpanded 
        ? "overflow-visible" // Allow modal to expand beyond screen
        : ""; // Normal state
    }
    
    return ""; // Default index page
  };

  // Get transition styling based on direction
  const getTransitionStyles = () => {
    if (!isTransitioning) return "";
    
    switch (transitionDirection) {
      case 'to-paramasiva':
        return "overflow-hidden"; // Paramasiva transition state
      case 'to-subsystems':
        return "overflow-hidden relative"; // CRITICAL: relative positioning for absolute children
      case 'to-quaternal':
        return "overflow-hidden"; // Quaternal Logic transition state
      case 'to-main':
        return "overflow-hidden opacity-0 scale-95 transition-all duration-800 ease-out"; // Reverse transition
      default:
        return "";
    }
  };

  return (
    <div className={cn(
      // Base portfolio container - conditional layout based on transition
      isTransitioning && transitionDirection === 'to-subsystems' 
        ? "flex h-screen bg-ui-gray relative"  // Keep flex layout but allow relative positioning
        : pageType === 'quaternal-logic' && isModalExpanded
        ? "flex min-h-screen bg-ui-gray"  // Allow expansion beyond screen height for modal
        : "flex h-screen bg-ui-gray",     // Normal flex layout
      
      // Page-specific styles (pure Tailwind equivalents)
      getPageStyles(),
      
      // Transition states (pure Tailwind equivalents)
      getTransitionStyles(),
      
      // Page fade-in animation - exact from original timing
      "animate-page-fade-in",
      
      className
    )}>
      {children}
    </div>
  );
};