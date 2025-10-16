'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PortfolioContainer } from '../ui/PortfolioContainer';
import { Sidebar } from '../ui/Sidebar';

import { CoordinateText } from '../ui/CoordinateText';
import { WhiteFadeOverlay } from '../ui/WhiteFadeOverlay';
import { PageFadeIn } from '../ui/PageFadeIn';
import { TextSwitch } from '../ui/TextSwitch';
import { GlowParticles } from '../ui/GlowParticles';
import { useEpiLogosTransition } from '@/hooks/ui-system/useEpiLogosTransition';
import { useInterPageTransition } from '@/hooks/ui-system/useInterPageTransition';
import { AuthModalContent } from '../auth/AuthModalContent';
import { ModalContentManager } from '../modal/ModalContentManager';
import { ThreadHistoryPanel } from '../chat/ThreadHistoryPanel';
import { TextAnimate } from '../ui/TextAnimate';
import { useUnifiedAuth } from '@/auth/unified-auth-context';
import { cn } from '../../utils/cn';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';
import { HexagonButton } from '../navigation/HexagonButton';
import { useSidebar } from '@/contexts/SidebarContext';

export const EpiLogosPage: React.FC<{ initialEntered?: boolean }> = ({ initialEntered = false }) => {
  // SEPARATED CONCERNS: Modal hook + Navigation hook (like ParamasivaPage)
  const [epiLogosState, epiLogosActions] = useEpiLogosTransition({
    initialMode: initialEntered ? 'post' : 'pre',
  });
  const {
    whiteOverlayVisible,
    isTransitioning,
    textFadeStarted,
    currentTransitionDirection,
    transitionToSubsystemsFromEpiLogos
  } = useInterPageTransition();

  const { openHexagonPanel, panelMode } = useSidebar();

  // Authentication and business state management
  const { isAuthenticated, completeOAuth } = useUnifiedAuth();
  const [businessState, setBusinessState] = useState<EpiLogosBusinessState>('png-displayed');
  // Two-phase handoff: fade out non-threads, then unmount; mount threads afterward
  const [nonThreadsMounted, setNonThreadsMounted] = useState(true);
  const [nonThreadsVisible, setNonThreadsVisible] = useState(true);
  const [showThreads, setShowThreads] = useState(false);
  const [threadsVisible, setThreadsVisible] = useState(false);
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout> | null = null;
    let t2: ReturnType<typeof setTimeout> | null = null;
    if (businessState === 'chat') {
      // Start fading out non-threads now
      setNonThreadsVisible(false);
      // After fade completes (staggered TextAnimate ~350ms + delays), unmount, then mount Threads
      t1 = setTimeout(() => {
        setNonThreadsMounted(false);
        t2 = setTimeout(() => { setShowThreads(true); setThreadsVisible(true); }, 50);
      }, 1450);
    } else {
      // Leaving chat: fade out threads, then unmount; remount non-threads and fade them in
      if (showThreads) {
        setThreadsVisible(false);
        t1 = setTimeout(() => setShowThreads(false), 400);
      } else {
        setShowThreads(false);
      }
      setNonThreadsMounted(true);
      // Allow mount, then make visible
      t1 = setTimeout(() => setNonThreadsVisible(true), 0);
    }
    return () => { if (t1) clearTimeout(t1); if (t2) clearTimeout(t2); };
  }, [businessState]);
  
  
  // Logo text state
  const [logoText] = useState("EPI : LOGOS");
  
  // Coordinate text animation state (only visible in expanded state)
  const [coordinateTextVisible, setCoordinateTextVisible] = useState(false);

  // Particles state - EXACT same pattern as Quaternal Logic page
  const [particlesVisible, setParticlesVisible] = useState(false);
  const [particlesFadeState, setParticlesFadeState] = useState<'hidden' | 'visible' | 'modal-hiding'>('hidden');
  
  // Enhanced particle animation state
  const [particleAnimationActive, setParticleAnimationActive] = useState(false);
  const [particleAnimationCount, setParticleAnimationCount] = useState(33); // GENTLER: reduced from 100 to 33
  const [particleScaleState, setParticleScaleState] = useState<'normal' | 'shrinking' | 'expanding'>('normal');
  const [particleCountState, setParticleCountState] = useState<'normal' | 'building' | 'resetting'>('normal');

  // PNG fade state - Same two-step pattern as particles
  const [pngFadeState, setPngFadeState] = useState<'hidden' | 'visible'>('hidden');
  
  // White fade state for dashboard transition
  const [whiteFadeVisible, setWhiteFadeVisible] = useState(false);
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

  // PNG fade-in effect - Same pattern as particles
  useEffect(() => {
    if (epiLogosState.imageFullyVisible) {
      // Start hidden, then fade in after short delay
      setPngFadeState('hidden');
      const fadeTimer = setTimeout(() => {
        setPngFadeState('visible');
      }, 100); // Short delay for smooth fade-in

      return () => clearTimeout(fadeTimer);
    } else {
      setPngFadeState('hidden');
    }
  }, [epiLogosState.imageFullyVisible]);

  const handleBackToParamasiva = () => {
    window.location.href = '/paramasiva';
  };

  const handleSubsystemsClick = () => {
    transitionToSubsystemsFromEpiLogos();
  };


  const handleEnterClick = () => {
    epiLogosActions.enterModal();
    try {
      // Mark this browser session as having entered the app
      document.cookie = 'epilogos_entered=1; path=/; samesite=lax';
      sessionStorage.setItem('epilogos_entered', '1');
    } catch {}
  };

  const handleDashboardClick = () => {
    // Start enhanced PNG animation with particle scaling and white fade
    epiLogosActions.transitionToDashboard();
    
    // Start particle animation - JavaScript interpolation with CSS timing patterns
    setParticleAnimationActive(true);
    setParticleScaleState('shrinking'); // Tells JS to target 0.01 scale

    // GENTLER buildup: 33 to 1000 over PNG animation duration
    const startTime = Date.now();
    const startCount = 33;
    const endCount = 1000;
    const duration = 2500; // Slightly longer for gentler feel (was 2000ms)

    const animateParticleCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Gentler easing: ease-out cubic for smoother buildup
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentCount = Math.floor(startCount + (endCount - startCount) * easeProgress);
      setParticleAnimationCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animateParticleCount);
      }
    };

    requestAnimationFrame(animateParticleCount);
    
    // CORRECT TIMING: White fade starts at 1400ms (200ms expand + 1200ms into shrink) 
    // More gentle, slower fade timing
    setTimeout(() => {
      setWhiteFadeVisible(true);
    }, 1400); // Start white fade deeper into PNG shrink for more gentle effect
    
    // Dashboard modal appears at 2000ms (200ms + 1800ms), fade down after modal loads
    setTimeout(() => {
      // Set business state to trigger modal content
      if (isAuthenticated) {
        setBusinessState('dashboard');
      } else {
        setBusinessState('auth-signin');
      }
      
      // Gentle fade down after modal content is ready with longer timing
      setTimeout(() => {
        setWhiteFadeVisible(false);
        // Reset particles after fade completes - JavaScript interpolation with CSS timing
        setTimeout(() => {
          setParticleScaleState('expanding'); // Tells JS to target 1.0 scale

          // GENTLER return: 1000 → 33 particles (was 100) with longer, smoother animation
          const resetStartTime = Date.now();
          const resetDuration = 3000; // 3 seconds for gentler, more relaxed return (was 2000ms)
          const fromCount = particleAnimationCount;

          const resetParticleCount = () => {
            const elapsed = Date.now() - resetStartTime;
            const progress = Math.min(elapsed / resetDuration, 1);

            // Gentler easing: ease-out quartic for very smooth, gentle return
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const currentCount = Math.floor(fromCount + (33 - fromCount) * easeProgress);

            setParticleAnimationCount(currentCount);

            if (progress < 1) {
              requestAnimationFrame(resetParticleCount);
            } else {
              // Final cleanup after animations complete
              setTimeout(() => {
                setParticleAnimationActive(false);
                setParticleScaleState('normal');
              }, 500); // Brief delay for final transitions
            }
          };

          requestAnimationFrame(resetParticleCount);
        }, 1200); // Wait longer for white fade to complete gently
      }, 600); // Wait longer for framer motion + content settling
    }, 2000); // When PNG shrink completes and modal shows
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
            {/* Logo */}
            <TextSwitch 
              text={logoText}
              visible={epiLogosState.logoVisible && !textFadeStarted && nonThreadsVisible}
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

            {/* Initial State: Only Enter Button (original behavior) */}
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
                {/* Main Section - fades out in chat state */}
                {nonThreadsMounted && (
                  <div className="flex flex-col">
                    <TextAnimate 
                      visible={epiLogosState.showExpandedContent && !textFadeStarted && nonThreadsVisible}
                      delay={200}
                      duration="slow"
                      className="text-[18px] font-normal text-[#333] leading-[1.3] mb-[2px] text-center"
                    >
                      EPI : LOGOS
                    </TextAnimate>
                  </div>
                )}

                {/* Chat Threads Sidebar Panel: mounts after ~300ms, then fades in (200ms delay) */}
                {epiLogosState.showAuthModal && showThreads && (
                  <div className={cn('sidebar-threads-abs no-scrollbar', threadsVisible ? 'sidebar-threads-fadein-200' : 'sidebar-threads-fadeout')}>
                    <ThreadHistoryPanel />
                  </div>
                )}

                {/* Navigation Links - fade out then unmount in chat state */}
                {nonThreadsMounted && (
                <div className="flex flex-col gap-[10px]">
                  <div className="flex flex-col gap-[10px] items-start text-left">
                    <div onClick={handleSubsystemsClick}>
                      <TextAnimate
                        visible={epiLogosState.showExpandedContent && !textFadeStarted && nonThreadsVisible}
                        delay={600}
                        duration="normal"
                        className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]"
                      >
                        Subsystems
                      </TextAnimate>
                    </div>
                    <div onClick={handleBackToParamasiva}>
                      <TextAnimate
                        visible={epiLogosState.showExpandedContent && !textFadeStarted && nonThreadsVisible}
                        delay={800}
                        duration="normal"
                        className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]"
                      >
                        Paramasiva
                      </TextAnimate>
                    </div>
                    <TextAnimate
                      visible={epiLogosState.showExpandedContent && !textFadeStarted && nonThreadsVisible}
                      delay={1000}
                      duration="normal"
                      className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]"
                    >
                      Account
                    </TextAnimate>
                  </div>

                  {/* Hexagon Button - Centered */}
                  <div className="mt-6 flex justify-center w-full">
                    <TextAnimate
                      visible={epiLogosState.showExpandedContent && !textFadeStarted && nonThreadsVisible}
                      delay={1300}
                      duration="normal"
                    >
                      <div className="translate-y-[3px]">
                        <HexagonButton
                          onClick={openHexagonPanel}
                          isOpen={panelMode === 'hexagon-panel'}
                        />
                      </div>
                    </TextAnimate>
                  </div>
                </div>
                )}
              </>
            )}
          </Sidebar>

          {/* Main Content - Flex Container like QuaternalLogicPage */}
          {(epiLogosState.isExpanded || isTransitioning || epiLogosState.imageFullyVisible) && (
            <div className="flex-1 flex flex-col relative">
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

                    // During page transition: Maintain current expanded state
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
                      particleCount={33}
                      baseHue={180}
                      monochrome={true}
                      mode="default"
                      saturation={120}
                      lightness={70}
                      radiusScale={0.3}
                      parentRef={modalPanelRef}
                      showDebug={false}
                      scaleOnHover={false}
                      fadeState={particlesFadeState}
                      animationParticleCount={particleAnimationCount}
                      animationActive={particleAnimationActive}
                      scaleState={particleScaleState}
                      countState={particleCountState}
                    />
                  )}

                  {/* White Fade Overlay for Dashboard Transition - Inside Modal */}
                  <div 
                    className="absolute inset-0 bg-[#f5f5f5] z-[100] pointer-events-none transition-opacity duration-[1500ms] ease-in-out"
                    style={{ opacity: whiteFadeVisible ? 1 : 0 }}
                  />

                {/* Image - Direct render like ParamasivaImage */}
                {epiLogosState.imageFullyVisible && !epiLogosState.showAuthModal && (
                  <img 
                    src="/ui-system/modal-image.png" 
                    alt="Modal Design"
                    onClick={handleDashboardClick}
                    className={cn(
                      "epi-png-base",
                      "png-gentle-waves",
                      // ✅ FADE STATE: Apply opacity based on fade state, not immediate visibility
                      pngFadeState === 'visible' ? "epi-png-loaded epi-png-hover" : "opacity-0",
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

                {/* Modal Content Manager - Handles both auth and account states */}
                {epiLogosState.showAuthModal && businessState !== 'png-displayed' && (
                  <ModalContentManager
                    businessState={businessState}
                    onStateChange={(newState) => {
                      setBusinessState(newState);
                      if (newState === 'png-displayed') {
                        // Back button clicked - hide modal
                        epiLogosActions.hideAuthModal();
                      }
                    }}
                    onPNGClick={() => {
                      setBusinessState('png-displayed');
                      epiLogosActions.hideAuthModal();
                    }}
                    imageFullyVisible={epiLogosState.imageFullyVisible}
                    imageMovedToCorner={epiLogosState.imageMovedToCorner}
                    imageExpanded={epiLogosState.imageExpanded}
                    showContent={epiLogosState.showAuthModal}
                    modalExpansionComplete={epiLogosState.animationPhase === 'complete'}
                  />
                )}
                
                {/* Coordinate Text */}
                <CoordinateText 
                  coordinate="#"
                  visible={coordinateTextVisible}
                  position="bottom-right"
                />
                </div>
              </div>
            </div>
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
