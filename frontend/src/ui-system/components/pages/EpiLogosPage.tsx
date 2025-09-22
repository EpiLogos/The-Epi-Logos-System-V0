'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PortfolioContainer } from '../ui/PortfolioContainer';
import { Sidebar } from '../ui/Sidebar';
import { ContentPanel } from '../ui/ContentPanel';
import { CoordinateText } from '../ui/CoordinateText';
import { WhiteFadeOverlay } from '../ui/WhiteFadeOverlay';
import { PageFadeIn } from '../ui/PageFadeIn';
import { TextAnimate } from '../ui/TextAnimate';
import { TextSwitch } from '../ui/TextSwitch';
import { GlowParticles } from '../ui/GlowParticles';
import { useEpiLogosTransition } from '@/hooks/ui-system/useEpiLogosTransition';
import { useInterPageTransition } from '@/hooks/ui-system/useInterPageTransition';
import { AuthModalContent } from '../auth/AuthModalContent';
import { cn } from '../../utils/cn';

export const EpiLogosPage: React.FC = () => {
  // SEPARATED CONCERNS: Modal hook + Navigation hook (like ParamasivaPage)
  const [epiLogosState, epiLogosActions] = useEpiLogosTransition();
  const {
    whiteOverlayVisible,
    isTransitioning,
    textFadeStarted,
    currentTransitionDirection,
    transitionToSubsystemsFromEpiLogos
  } = useInterPageTransition();
  
  
  // Logo text state
  const [logoText] = useState("EPI : LOGOS");
  
  // Coordinate text animation state (only visible in expanded state)
  const [coordinateTextVisible, setCoordinateTextVisible] = useState(false);

  // Particles state - EXACT same pattern as Quaternal Logic page
  const [particlesVisible, setParticlesVisible] = useState(false);
  const [particlesFadeState, setParticlesFadeState] = useState<'hidden' | 'visible' | 'modal-hiding'>('hidden');
  const modalPanelRef = useRef<HTMLDivElement>(null);

  // Update coordinate text visibility based on expansion state
  useEffect(() => {
    if (epiLogosState.isExpanded && epiLogosState.animationPhase === 'complete') {
      const coordTimer = setTimeout(() => {
        // setCoordinateTextVisible(true); // ✅ COMMENTED OUT: Keep coordinate text transparent
      }, 500); // Short delay after content appears
      return () => clearTimeout(coordTimer);
    } else {
      setCoordinateTextVisible(false);
    }
  }, [epiLogosState.isExpanded, epiLogosState.animationPhase]);

  // Particles initialization - EXACT same pattern as QuaternalLogic page
  useEffect(() => {
    if (epiLogosState.isExpanded) {
      // Delay particle mounting until ContentPanel animation is fully complete
      // Modal sequence: text-fade(300ms) → width-expand(1200ms+800ms) → height-expand(1000ms) → content-fade(600ms) = ~4000ms
      const mountDelay = setTimeout(() => {
        // ✅ CRITICAL: Set up proper fade-in sequence like QuaternalLogic
        setParticlesVisible(true);
        setParticlesFadeState('hidden'); // Start hidden first
        
        // Short delay then fade in smoothly
        const particleTimer = setTimeout(() => {
          setParticlesFadeState('visible');
        }, 300);

        return () => clearTimeout(particleTimer);
      }, 4200); // Wait for full animation sequence + buffer

      return () => clearTimeout(mountDelay);
    } else {
      setParticlesVisible(false);
      setParticlesFadeState('hidden');
    }
  }, [epiLogosState.isExpanded]);

  const handleBackToParamasiva = () => {
    window.location.href = '/paramasiva';
  };

  const handleSubsystemsClick = () => {
    transitionToSubsystemsFromEpiLogos();
  };


  const handleEnterClick = () => {
    epiLogosActions.enterModal();
  };

  const handleDashboardClick = () => {
    epiLogosActions.transitionToDashboard();
  };

  return (
    <>
      <PageFadeIn>
        <PortfolioContainer 
          pageType="epi-logos"
          isModalExpanded={epiLogosState.isExpanded}
          isTransitioning={isTransitioning}
          transitionDirection="to-subsystems"
          className="min-h-screen"
        >
          {/* Sidebar - Full width initially, shrinks to 420px when expanded */}
          <Sidebar 
            variant="epi-logos"
            isModalExpanded={epiLogosState.isExpanded}
            isTransitioning={isTransitioning}

            animationPhase={epiLogosState.animationPhase}
          >
            {/* Logo - Always visible */}
            <TextSwitch 
              text={logoText}
              visible={epiLogosState.logoVisible && !textFadeStarted}
              delay={200}
              duration="slow"
              className="text-[18px] font-normal tracking-[2px] text-[#333] mb-10 text-center mt-[5%]"
            />

            {/* SVG Image - ALWAYS RENDERED, container-based positioning */}
            <div className={cn(
              // DELAYED TRANSITION: Wait for height morph (1200ms) for proper sidebar expansion timing
              isTransitioning
                ? "epi-svg-container-center-absolute" // Smooth transition to center (absolute)
                : epiLogosState.animationPhase === 'initial' || epiLogosState.animationPhase === 'text-fading'
                ? "epi-svg-container-center" // Normal center (flex)
                : "epi-svg-container-corner" // Corner (absolute)
            )}>
              <img 
                src="/ui-system/image2vector (10).svg"
                alt="EPI Logos Symbol"
                className={cn(
                  "epi-svg-base", // INCLUDES DEFAULT 20px crop padding
                  
                  // PATTERN C: Choose ONE base transition based on phase
                  isTransitioning && currentTransitionDirection === 'epilogos-to-subsystems'
                    ? "epi-svg-reverse-transition" // Visible reverse grow-back during Epi→Subsystems
                    : isTransitioning
                    ? "epi-svg-delayed-fadeout-transition" // Other transitions fade out
                    : epiLogosState.animationPhase === 'text-fading'
                    ? "epi-svg-smooth-transition" // Slow fade timing
                    : epiLogosState.animationPhase === 'initial'
                    ? "epi-svg-smooth-transition" // Slow fade timing  
                    : "epi-svg-fast-transition", // Fast size change timing
                  
                  // PATTERN C: Choose ONE state utility based on phase
                  isTransitioning && currentTransitionDirection === 'epilogos-to-subsystems'
                    ? "epi-svg-large-state" // Reverse transition returns to large state
                    : isTransitioning
                    ? "epi-svg-hidden-state" // Other page transitions fade out
                    : epiLogosState.animationPhase === 'initial'
                    ? "epi-svg-large-state" // Initial large state
                    : epiLogosState.animationPhase === 'text-fading' 
                    ? "epi-svg-faded-state" // Faded during text transition
                    : "epi-svg-small-state" // Small state for width/height/complete phases
                )}
              />
            </div>

            {/* Initial State: Only Enter Button */}
            {!epiLogosState.isExpanded && (
              <div className="flex flex-col items-center justify-center flex-1 -mt-[20%] relative z-20">
                <div onClick={handleEnterClick} className="cursor-pointer relative z-20">
                  <TextAnimate 
                    visible={epiLogosState.showEnterButton && !textFadeStarted}
                    delay={600}
                    duration="slow"
                    className="text-[18px] font-normal text-[#333] tracking-[2px] hover:text-[#666]"
                  >
                    ENTER
                  </TextAnimate>
                </div>
              </div>
            )}

            {/* Expanded State: Full Content */}
            {epiLogosState.isExpanded && (
              <>
                {/* Main Section */}
                <div className="flex flex-col">
                  <TextAnimate 
                    visible={epiLogosState.showExpandedContent && !textFadeStarted}
                    delay={200}
                    duration="slow"
                    className="text-[18px] font-normal text-[#333] leading-[1.3] mb-[2px] text-center"
                  >
                    EPI : LOGOS
                  </TextAnimate>
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col gap-[10px] items-start text-left">
                  <div onClick={handleSubsystemsClick}>
                    <TextAnimate 
                      visible={epiLogosState.showExpandedContent && !textFadeStarted}
                      delay={600}
                      duration="normal"
                      className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]"
                    >
                      Subsystems
                    </TextAnimate>
                  </div>
                  <div onClick={handleBackToParamasiva}>
                    <TextAnimate 
                      visible={epiLogosState.showExpandedContent && !textFadeStarted}
                      delay={800}
                      duration="normal"
                      className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]"
                    >
                      Paramasiva
                    </TextAnimate>
                  </div>
                  <TextAnimate 
                    visible={epiLogosState.showExpandedContent && !textFadeStarted}
                    delay={1000}
                    duration="normal"
                    className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]"
                  >
                    Account
                  </TextAnimate>
                </div>
              </>
            )}
          </Sidebar>

          {/* Main Content Panel - Always visible during transitions, like Paramasiva */}
          {(epiLogosState.isExpanded || isTransitioning || epiLogosState.imageFullyVisible) && (
            <ContentPanel 
              pageType="epi-logos"
              isModalExpanded={epiLogosState.isExpanded}
              isTransitioning={isTransitioning}
            >
              {/* Particle Container - Same pattern as Quaternal Logic */}
              <div 
                ref={modalPanelRef}
                className={cn(
                  "w-full bg-[#f5f5f5] relative overflow-hidden",
                  // During transition: flexible height, otherwise full height
                  isTransitioning ? "h-auto" : "h-full"
                )}
              >
                {/* Modal Panel with Phased Animation - Width first, then Height expansion upward */}
                <div 
                  className={cn(
                    // VISUAL STYLING - Always applied for consistent appearance
                    "epi-panel-visual",
                    
                    // POSITIONING - Only when not transitioning to avoid flex conflicts
                    !isTransitioning && "epi-panel-positioned",
                    
                    // TRANSITION EFFECTS - Only blur, no movement (let flex handle layout)
                    textFadeStarted && "epi-panel-transition-blur",
                    
                    // NORMAL MODAL TRANSITIONS - Only when not in page transition
                    !isTransitioning && "epi-panel-smooth-transition",
                    
                    // During page transition: Maintain current expanded state + add margin
                    isTransitioning && "m-5",
                    isTransitioning && epiLogosState.animationPhase === 'complete' && "epi-panel-height-expanded",
                    
                    // ANIMATION PHASE STATES - Only when not transitioning
                    !isTransitioning && epiLogosState.animationPhase === 'initial' && "epi-panel-initial-state",
                    !isTransitioning && epiLogosState.animationPhase === 'text-fading' && "epi-panel-initial-state",
                    !isTransitioning && epiLogosState.animationPhase === 'width-expanding' && "epi-panel-width-expanded", 
                    !isTransitioning && epiLogosState.animationPhase === 'height-expanding' && "epi-panel-height-expanded",
                    !isTransitioning && epiLogosState.animationPhase === 'complete' && "epi-panel-height-expanded"
                  )}
                >
                  {/* Particles Background - INSIDE the modal panel */}
                  {particlesVisible && (
                    <GlowParticles
                      isVisible={particlesVisible}
                      particleCount={50}  
                      baseHue={180}
                      monochrome={true}
                      mode="default"
                      saturation={120}
                      lightness={70}
                      radiusScale={0.6}
                      parentRef={modalPanelRef}
                      showDebug={false}
                      scaleOnHover={false}
                      fadeState={particlesFadeState}
                    />
                  )}

                {/* Image - Direct render like ParamasivaImage */}
                {epiLogosState.imageFullyVisible && !epiLogosState.showAuthModal && (
                  <img 
                    src="/ui-system/modal-image.png" 
                    alt="Modal Design"
                    onClick={handleDashboardClick}
                    className={cn(
                      "epi-png-base",
                      "png-gentle-waves",
                      // ✅ CRITICAL: Apply hover utilities when image is fully visible (loaded state)
                      epiLogosState.imageFullyVisible && "epi-png-loaded epi-png-hover",
                      // CONDITIONAL TRANSITIONS - Fast pop, then slow shrink
                      epiLogosState.imageExpanded && !epiLogosState.imageMovedToCorner 
                        ? "epi-png-pop-transition" 
                        : "epi-png-smooth-transition",
                      // THREE-STEP ANIMATION: expand slightly, then shrink to center
                      epiLogosState.imageExpanded && !epiLogosState.imageMovedToCorner && "epi-png-expand-state",
                      epiLogosState.imageMovedToCorner && "epi-png-corner-state"
                    )}
                  />
                )}

                {/* Auth Modal Content - Using existing working component */}
                {epiLogosState.showAuthModal && epiLogosState.authModalType && (
                  <div className="content-transition-container content-visible auth-modal-container">
                    <div className="auth-modal-content">
                      <AuthModalContent
                      businessState={epiLogosState.authModalType}
                      onStateChange={(newState) => {
                        if (newState === 'auth-signin') {
                          epiLogosActions.showSigninModal();
                        } else if (newState === 'auth-signup') {
                          epiLogosActions.showSignupModal();
                        } else if (newState === 'auth-success') {
                          // Handle auth success - transition to success modal state
                          epiLogosActions.showAuthSuccessModal();
                        } else if (newState === 'png-displayed') {
                          // Back button clicked
                          epiLogosActions.hideAuthModal();
                        }
                      }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Coordinate Text */}
                <CoordinateText 
                  coordinate="#5"
                  visible={coordinateTextVisible}
                  position="bottom-right"
                />
                </div>
              </div>
            </ContentPanel>
          )}
          {/* )} */}
        </PortfolioContainer>
      </PageFadeIn>

      {/* White Fade Overlay for Page Transitions */}
      <WhiteFadeOverlay 
        visible={whiteOverlayVisible}
        onAnimationComplete={() => {}}
      />
    </>
  );
};

export default EpiLogosPage;
