import React from 'react';
import { cn } from '../../utils/cn';

interface ContentPanelProps {
  children: React.ReactNode;
  pageType: 'subsystems' | 'paramasiva' | 'epi-logos';
  isModalExpanded?: boolean;
  panelMoved?: boolean; // For paramasiva panel height adjustment
  animationPhase?: 'idle' | 'height-expanding' | 'width-expanding' | 'icon-moving' | 'complete';
  isTransitioning?: boolean; // For inter-page transitions
  secondPhaseCollapse?: boolean; // Second phase: collapse to width 0
  transitionDirection?: 'to-subsystems' | 'to-quaternal' | 'to-main' | 'idle'; // New transition directions
  heightMorphStarted?: boolean; // For quaternal transition height collapse phase
  widthMorphStarted?: boolean; // For quaternal transition width collapse phase
  isSidebarCollapsed?: boolean; // For sidebar collapse coordination
  className?: string;
}

export const ContentPanel: React.FC<ContentPanelProps> = ({
  children,
  pageType,
  isModalExpanded = false,
  panelMoved = false,
  animationPhase = 'idle',
  isTransitioning = false,
  secondPhaseCollapse = false,
  transitionDirection = 'idle',
  heightMorphStarted = false,
  widthMorphStarted = false,
  isSidebarCollapsed = false,
  className
}) => {
  // Calculate dimensions based on page type and modal state
  const getDimensions = () => {
    if (pageType === 'subsystems') {
      // Subsystems: Full-width grid area
      return "flex-1 h-screen";
    }
    
    if (pageType === 'paramasiva') {
      // TRANSITION HANDLING: Multiple transition directions from Paramasiva
      if (isTransitioning) {
        if (transitionDirection === 'to-subsystems') {
          // PARAMASIVA → SUBSYSTEMS: Expand to full screen then collapse
          if (secondPhaseCollapse) {
            return "absolute top-0 right-0 w-0 h-screen m-0 !bg-[#090a09]";
          }
          return "absolute top-0 right-0 w-[420px] h-screen m-0 !bg-[#090a09]";
        } else if (transitionDirection === 'to-quaternal') {
          // PARAMASIVA → QUATERNAL LOGIC: Modal collapse sequence (following proven subsystems pattern)
          // PHASE 1: Height reduction - lower edge comes up (heightMorphStarted = true, widthMorphStarted = false)
          if (heightMorphStarted && !widthMorphStarted) {
            return "absolute top-0 right-0 w-[calc(100vw-420px-40px)] h-[calc(60vh-30px)] m-[20px] !bg-[#090a09]";
          }
          // PHASE 2: Width expansion + sidebar coordination (both true)
          if (widthMorphStarted) {
            return "absolute top-0 right-0 w-[calc(100vw-420px-40px)] h-[calc(60vh-30px)] m-[20px_20px_0_0] !bg-[#090a09]";
          }
          // Initial state (before transition starts) - Modal expanded state
          return "absolute top-0 right-0 w-[calc(100vw-420px-40px)] h-[calc(100vh-40px)] m-[20px] !bg-[#090a09]";
        } else if (transitionDirection === 'to-main') {
          // PARAMASIVA → EPI‑LOGOS (collapse-only): collapse X and Y together (faster)
          if (heightMorphStarted) {
            return "absolute top-0 right-0 w-[360px] h-[calc(60vh-30px)] mt-5 mr-5 mb-5 ml-0 !bg-[#090a09]";
          }
          return "absolute top-0 right-0 w-[420px] h-[calc(60vh+35vh)] mt-5 mr-5 mb-5 ml-0 !bg-[#090a09]";
        }
      }
      
      // NORMAL PARAMASIVA STATES - ORIGINAL RIGHT-ALIGNED
      // FIXED: Should be 35vh initially, then 20vh after panel moves (downward shift animation)
      const height = panelMoved ? "h-[calc(60vh+20vh)]" : "h-[calc(60vh+35vh)]";
      
      if (isModalExpanded) {
        // Modal expanded state - conditional utility application
        // Use fast sidebar utilities only when modal transition is complete
        const shouldUseFastSidebarResponse = !isTransitioning && animationPhase === 'complete';
        const widthClass = shouldUseFastSidebarResponse
          ? (isSidebarCollapsed ? "paramasiva-modal-expanded" : "paramasiva-modal-normal")
          : "w-[calc(100vw-420px-40px)]"; // Fallback width, let modal transition utility handle timing
        return `absolute top-0 right-0 ${widthClass} h-[calc(100vh-40px)] m-[20px]`;
      } else {
        // Normal state - FIXED: Was missing bottom margin (mb-5)
        return `absolute top-0 right-0 w-[420px] ${height} mt-5 mr-5 mb-5 ml-0`;
      }
    }

    if (pageType === 'epi-logos') {
      // TRANSITION HANDLING: Keep as flex during transitions to prevent squeeze-out
      if (isTransitioning) {
        // During transition: Stay in flex flow like SubsystemsPage
        return "flex-1 h-screen";
      }
      
      // NORMAL STATE: Use flex-1 for smooth expansion animation
      return "flex-1 h-screen";
    }
    
    return "flex-1"; // Default
  };

  return (
    <div
      className={cn(
        // Base styling
        "flex-shrink-0 relative overflow-hidden",

        // Removed: adjusted-container adjusted-main classes (pure Tailwind v4 approach)

        // Background color based on page type
        // pageType === 'subsystems' && "!bg-[#090a09]", // Black background for subsystems/grid only
        // pageType === 'epi-logos' && "bg-[#f5f5f5]", // Same background as sidebar

        // Dimensions based on page type and state
        getDimensions(),

        // TRANSITION CLASSES: Conditional application to prevent conflicts
        pageType === 'paramasiva' && !isTransitioning && (() => {
          // Calculate if we should use fast sidebar response
          const shouldUseFastSidebarResponse = !isTransitioning && animationPhase === 'complete';

          // Only apply modal transition when NOT using sidebar utilities (prevents CSS conflicts)
          return !shouldUseFastSidebarResponse && (
            isModalExpanded ? "transition-paramasiva-modal-expanded" : "transition-paramasiva-modal-collapsed"
          );
        })(),
        
        // Inter-page transitions use different timing based on direction
        pageType === 'paramasiva' && isTransitioning && transitionDirection === 'to-subsystems' && "transition-paramasiva-transitioning",

        // QUATERNAL TRANSITION: Single coordinated utility (like working modal animations)
        pageType === 'paramasiva' && isTransitioning && transitionDirection === 'to-quaternal' &&
          "transition-paramasiva-to-quaternal",
        
        pageType === 'epi-logos' && isTransitioning && "transition-epi-logos-transitioning",

        // Collapse-only for Paramasiva → Epi‑Logos: faster X and Y
        pageType === 'paramasiva' && isTransitioning && transitionDirection === 'to-main' &&
          "transition-[width,height] duration-[500ms] ease-paramasiva delay-[100ms]",

        className
      )}
    >
      {children}
    </div>
  );
};
