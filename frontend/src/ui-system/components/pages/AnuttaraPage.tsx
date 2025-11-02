'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { PortfolioContainer } from '../ui/PortfolioContainer';
import { Sidebar } from '../ui/Sidebar';
import { ContentPanel } from '../ui/ContentPanel';
import { ModalPanel } from '../ui/ModalPanel';
import { CoordinateText } from '../ui/CoordinateText';
import { ParamasivaImage } from '../ui/ParamasivaImage';
import { WhiteFadeOverlay } from '../ui/WhiteFadeOverlay';
import { PageFadeIn } from '../ui/PageFadeIn';
import { TextAnimate } from '../ui/TextAnimate';
import { TextSwitch } from '../ui/TextSwitch';
import { WaveBackground } from '../ui/WaveBackground';
import { GlowParticles } from '../ui/GlowParticles';
import { FocusCards } from '../ui/FocusCards';
import { HorizontalTracingBeam } from '../ui/HorizontalTracingBeam';
import { SubnodesSection } from '../ui/SubnodesSection';

import { useModalTransition } from '@/hooks/ui-system/useModalTransition';
import { useInterPageTransition } from '@/hooks/ui-system/useInterPageTransition';
import { useSidebar } from '@/contexts/SidebarContext';
import { HexagonButton } from '../navigation/HexagonButton';
import { anuttaraContent } from '../../content/anuttara-content';
import { coordinate0_0Summary } from '../../content/coordinates/0-0-summary';
import { coordinate0_5Summary } from '../../content/coordinates/0-5-summary';
import { anuttaraViewContent } from '@/content/anuttara-view-on-epi-logos';
import { anuttaraModalCards, anuttaraSubnodeCards } from '../../content/anuttara-focus-cards';

export const AnuttaraPage: React.FC<{ coordinate?: string; autoExpand?: boolean }> = ({
  coordinate = '#0',
  autoExpand = false
}) => {
  // Use custom hooks for state management
  const [modalState, modalActions] = useModalTransition();
  const { isCollapsed, toggle, expand, openHexagonPanel, panelMode } = useSidebar();

  // Auto-expand modal on mount if autoExpand is true - ONCE ONLY
  // Also ensures sidebar is expanded for the initial auto-expand, then never interferes again
  useEffect(() => {
    if (autoExpand) {
      // Ensure sidebar is expanded for the auto-expand navigation from archive/atelier
      if (isCollapsed) {
        expand();
      }

      const timer = setTimeout(() => {
        modalActions.openModal();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run ONCE on mount only, never interfere with user's sidebar toggle after that

  const {
    whiteOverlayVisible,
    isTransitioning,
    currentTransitionDirection,
    textFadeStarted,
    heightMorphStarted,
    widthMorphStarted,
    gridLinesVisible,
    transitionToSubsystems,
    transitionToQuaternalFromParamasiva,
    transitionToEpiLogosFromParamasiva
  } = useInterPageTransition();

  // Convert hook transition direction to component transition direction
  const getComponentTransitionDirection = (): 'idle' | 'to-subsystems' | 'to-quaternal' => {
    if (!isTransitioning || !currentTransitionDirection) return 'idle';

    switch (currentTransitionDirection) {
      case 'paramasiva-to-subsystems':
      case 'mahamaya-to-subsystems':
      case 'anuttara-to-subsystems':
        return 'to-subsystems';
      case 'paramasiva-to-quaternal':
        return 'to-quaternal';
      case 'paramasiva-to-epilogos':
        return 'idle'; // Map to idle since 'to-main' is not in Sidebar's type
      default:
        return 'idle';
    }
  };

  const componentTransitionDirection = getComponentTransitionDirection();

  // Logo text state
  const [logoText, setLogoText] = useState(anuttaraContent.collapsedLogoText);

  // Coordinate text animation state
  const [coordinateTextVisible, setCoordinateTextVisible] = useState(false);

  // Initial panel height animation state
  const [initialPanelAnimation, setInitialPanelAnimation] = useState(true);

  // Wave background state and ref
  const [wavesVisible, setWavesVisible] = useState(false);
  const [wavesFadeState, setWavesFadeState] = useState<'hidden' | 'visible' | 'modal-hiding' | 'quick-fade-out'>('hidden');

  // Focus cards visibility - only show after modal expansion animation completes
  const [carouselVisible, setCarouselVisible] = useState(false);

  // Particles state - EXACT SAME PATTERN AS WAVES
  const [particlesVisible, setParticlesVisible] = useState(false);
  const [particlesFadeState, setParticlesFadeState] = useState<'hidden' | 'visible' | 'modal-hiding' | 'quick-fade-out'>('hidden');
  const modalPanelRef = useRef<HTMLDivElement>(null);

  // Update logo text based on modal state
  useEffect(() => {
    setLogoText(modalState.isModalExpanded ? anuttaraContent.expandedLogoText : anuttaraContent.collapsedLogoText);
  }, [modalState.isModalExpanded]);

  // Initial panel height animation - lifts panel after 1.5 seconds (like HTML)
  useEffect(() => {
    const panelTimer = setTimeout(() => {
      setInitialPanelAnimation(false);
    }, 1500);

    return () => clearTimeout(panelTimer);
  }, []);

  // Coordinate text animation - becomes visible after panel lifts up (2200ms like subsystems)
  useEffect(() => {
    const coordTimer = setTimeout(() => {
      setCoordinateTextVisible(true);
    }, 2200);

    return () => clearTimeout(coordTimer);
  }, []);

  // Wave background initialization - follows EXACT original timing
  useEffect(() => {
    const waveTimer = setTimeout(() => {
      setWavesVisible(true);
      setWavesFadeState('visible'); // Start visible after DOM ready
    }, 1000); // Delay to ensure DOM is ready

    return () => clearTimeout(waveTimer);
  }, []);

  // Particles initialization - SAME TIMING AS WAVES
  useEffect(() => {
    const particleTimer = setTimeout(() => {
      setParticlesVisible(true);
      setParticlesFadeState('visible'); // Start visible after DOM ready
    }, 1000); // Same delay as waves

    return () => clearTimeout(particleTimer);
  }, []);

  // ✅ EXACT ORIGINAL: Wave + Particles fade coordination with modal transitions
  useEffect(() => {
    if (modalState.isModalExpanded) {
      // MODAL OPENING SEQUENCE:
      // 1. GRADUAL FADE: Let waves linger longer before fading out
      const fadeOutTimer = setTimeout(() => {
        setWavesFadeState('modal-hiding'); // blur(8px) + opacity(0) - smooth fade during height expansion
        setParticlesFadeState('modal-hiding'); // blur(8px) + opacity(0)
      }, 600); // Longer delay - let waves stay visible during early modal expansion

      // 2. After modal animations complete, recreate only particles (waves stay gone)
      const recreateTimer = setTimeout(() => {
        setWavesVisible(false); // Destroy waves and keep them gone in modal state
        setParticlesVisible(false); // Destroy current particle instance
        setTimeout(() => {
          // setWavesVisible(true);   // ✅ REMOVED: Waves don't recreate in modal expanded state
          setParticlesVisible(true);   // Create new particle instance (starts hidden)
          // 3. Keep hidden extra 200ms to avoid seeing rerender flash
          setTimeout(() => {
            // setWavesFadeState('visible'); // ✅ REMOVED: No waves to fade in
            setParticlesFadeState('visible'); // Then fade in particles smoothly
          }, 200); // Extended delay to hide canvas recreation
        }, 100);
      }, 1800); // After text-fade(200ms) + height(800ms) + width(1000ms)

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(recreateTimer);
      };
    } else {
      // MODAL CLOSING SEQUENCE:
      // 1. SMOOTH FADE: Start fade-out immediately as modal begins closing
      const fadeOutTimer = setTimeout(() => {
        setWavesFadeState('modal-hiding'); // blur(8px) + opacity(0)
        setParticlesFadeState('modal-hiding'); // blur(8px) + opacity(0)
      }, 100); // Small delay for smooth fade during modal close start

      // 2. After modal close, recreate and show both
      const recreateTimer = setTimeout(() => {
        setWavesVisible(false); // Destroy current instance
        setParticlesVisible(false); // Destroy current instance
        setTimeout(() => {
          setWavesVisible(true);   // Create new instance (starts hidden)
          setParticlesVisible(true);   // Create new instance (starts hidden)
          // 3. Keep hidden extra 200ms to avoid seeing rerender flash
          setTimeout(() => {
            setWavesFadeState('visible'); // Then fade in smoothly
            setParticlesFadeState('visible'); // Then fade in smoothly
          }, 200); // Extended delay to hide canvas recreation
        }, 100);
      }, 1200); // After modal close transitions

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(recreateTimer);
      };
    }
  }, [modalState.isModalExpanded]);

  // Focus cards timing control - show after PNG animation completes
  useEffect(() => {
    if (modalState.isModalExpanded) {
      // FOCUS CARDS APPEAR: After text-fade(200ms) + height(800ms) + width(1000ms) + PNG animation + 600ms delay
      const showCarouselTimer = setTimeout(() => {
        setCarouselVisible(true);
      }, 1800); // 1200ms modal + 600ms delay for smooth fade-in

      return () => clearTimeout(showCarouselTimer);
    } else {
      // FOCUS CARDS FADE-OUT: Give time for fade-out animation before hiding
      const hideCarouselTimer = setTimeout(() => {
        setCarouselVisible(false);
      }, 500); // 500ms to complete fade-out animation (300ms earlier)

      return () => clearTimeout(hideCarouselTimer);
    }
  }, [modalState.isModalExpanded]);

  // Quick wave fade-out for paramasiva → subsystems transition
  useEffect(() => {
    if (textFadeStarted && !modalState.isModalExpanded) {
      // QUICK FADE-OUT: 200ms ease when transition to subsystems starts
      setWavesFadeState('quick-fade-out');
    }
  }, [textFadeStarted, modalState.isModalExpanded]);

  // Quick waves fade-out when PNG click triggers modal expansion (works WITH existing modal logic)
  useEffect(() => {
    if (modalState.isModalExpanded && modalState.animationPhase === 'height-expanding') {
      // QUICK FADE-OUT: Immediate 200ms fade when PNG clicked (happens BEFORE the 600ms modal timer)
      setWavesFadeState('quick-fade-out');
    }
  }, [modalState.isModalExpanded, modalState.animationPhase]);

  // Quick particles fade-out when modal expansion starts (PNG click)
  useEffect(() => {
    if (modalState.isModalExpanded && modalState.animationPhase === 'height-expanding') {
      // QUICK FADE-OUT: 200ms ease when modal expansion begins
      setParticlesFadeState('quick-fade-out');
    }
  }, [modalState.isModalExpanded, modalState.animationPhase]);

  const handleImageClick = () => {
    if (modalState.isModalExpanded) {
      modalActions.closeModal();
      // Auto-expand sidebar when modal closes if it's collapsed
      if (isCollapsed) {
        toggle();
      }
    } else {
      modalActions.openModal();
    }
  };

  const handleBackToMain = () => {
    transitionToEpiLogosFromParamasiva();
  };

  const handleQuaternalLogicClick = () => {
    transitionToQuaternalFromParamasiva();
  };

  const handleSubsystemsClick = () => {
    transitionToSubsystems('anuttara');
  };

  return (
    <div data-coordinate={coordinate}>
      <PageFadeIn>
        <PortfolioContainer
          pageType="paramasiva"
          isModalExpanded={modalState.isModalExpanded}
          isTransitioning={isTransitioning}
          transitionDirection={componentTransitionDirection}
          className="min-h-screen"
        >
          {/* Anuttara's View Content - Behind sidebar, revealed when sidebar collapsed in modal collapsed state */}
          <div
            className={cn(
              "absolute top-[20px] left-[80px] w-[900px] h-[calc(100vh-140px)] z-0",
              "transition-opacity duration-300",
              !modalState.isModalExpanded && isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
              <div className="w-full h-full border border-gray-800 p-[20px] flex flex-col">
                <div className="mb-5">
                  <h2 className="text-[18px] font-normal tracking-[2px] text-[#333] mb-1">
                    {anuttaraViewContent.title}
                  </h2>
                  <p className="text-[10px] text-[#333]/60 tracking-[1px] italic mb-4">
                    {anuttaraViewContent.subtitle}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin-custom">
                  <div className="space-y-4 text-[#333]">
                    {anuttaraViewContent.sections.map((section, index) => (
                      <div key={index} className={index === 0 ? "" : "pl-4 border-l border-[#333]/30"}>
                        <p className="text-[11px] font-normal mb-1 tracking-[0.5px]">{section.heading}</p>
                        <p
                          className="text-[11px] leading-[1.7]"
                          dangerouslySetInnerHTML={{
                            __html: section.content
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                              .replace(/\n\n/g, '<br/><br/>')
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
          </div>

          {/* Text Content Sidebar */}
          <Sidebar
            variant="paramasiva"
            isModalExpanded={modalState.isModalExpanded}
            isTransitioning={isTransitioning}
            transitionDirection={componentTransitionDirection}
          >
          {/* Logo */}
          <TextSwitch
            text={logoText}
            visible={!textFadeStarted}
            delay={200}
            duration="slow"
            className="text-[18px] font-normal tracking-[2px] text-[#333] mb-6 text-center"
          />

          {/* Content Section */}
          <div className={`flex flex-col flex-1 ${!modalState.isModalExpanded ? "justify-center" : ""}`}>
            {!modalState.isModalExpanded && (
              <>
                <TextAnimate
                  visible={!textFadeStarted}
                  delay={600}
                  duration="slow"
                  className="text-[18px] font-normal text-[#333] leading-[1.3] mb-[2px] text-center"
                >
                  {anuttaraContent.title}
                </TextAnimate>
                <TextAnimate
                  visible={!textFadeStarted}
                  delay={1000}
                  className="text-[11px] text-[#666] mt-[20px] tracking-[1px] text-center"
                >
                  {anuttaraContent.subtitle}
                </TextAnimate>
              </>
            )}

            {modalState.isModalExpanded && (
              <div
                className={cn(
                  "flex flex-col gap-4 h-full transition-opacity duration-500",
                  modalState.modalTextVisible ? "opacity-100" : "opacity-0"
                )}
              >
                {/* Ground Field Summary - #0-0 */}
                <div className="flex-1 border border-gray-300 rounded-sm bg-white/50 p-6 flex flex-col">
                  <div className="mb-3">
                    <div className="text-xs font-mono text-gray-500 mb-1">{coordinate0_0Summary.coordinate}</div>
                    <h3 className="text-xs font-semibold text-gray-800 tracking-wide">
                      {coordinate0_0Summary.name.toUpperCase()}
                    </h3>
                  </div>
                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    {coordinate0_0Summary.summary}
                  </p>
                </div>

                {/* Resonator Summary - #0-5 */}
                <div className="flex-1 border border-gray-300 rounded-sm bg-white/50 p-6 flex flex-col">
                  <div className="mb-3">
                    <div className="text-xs font-mono text-gray-500 mb-1">{coordinate0_5Summary.coordinate}</div>
                    <h3 className="text-xs font-semibold text-gray-800 tracking-wide">
                      {coordinate0_5Summary.name.toUpperCase()}
                    </h3>
                  </div>
                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    {coordinate0_5Summary.summary}
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Footer Links - EXACT SAME AS SUBSYSTEMS WITH TRANSITION EFFECTS */}
          {!modalState.isModalExpanded && (
            <div className="flex flex-col gap-[10px] mt-6">
              <div className="flex flex-col gap-[10px] items-start text-left">
                <div onClick={handleQuaternalLogicClick}>
                  <TextAnimate
                    visible={!textFadeStarted}
                    delay={1300}
                    duration="normal"
                    className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]"
                  >
                    Quaternal Logic
                  </TextAnimate>
                </div>
                <div onClick={handleSubsystemsClick}>
                  <TextAnimate
                    visible={!textFadeStarted}
                    delay={1600}
                    duration="normal"
                    className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]"
                  >
                    Subsystems
                  </TextAnimate>
                </div>
                <div onClick={handleBackToMain}>
                  <TextAnimate
                    visible={!textFadeStarted}
                    delay={1900}
                    duration="normal"
                    className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]"
                  >
                    Epi:Logos
                  </TextAnimate>
                </div>
                <TextAnimate
                  visible={!textFadeStarted}
                  delay={2200}
                  duration="normal"
                  className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]"
                >
                  Account
                </TextAnimate>
              </div>

              {/* Hexagon Button - Centered, only visible when modal is expanded */}
              {modalState.isModalExpanded && (
                <div className="mt-6 flex justify-center w-full">
                  <TextAnimate
                    visible={!textFadeStarted}
                    delay={2500}
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
              )}
            </div>
          )}
          </Sidebar>

          {/* Main Content Panel */}
          <ContentPanel
            pageType="paramasiva"
            isModalExpanded={modalState.isModalExpanded}
            animationPhase={modalState.animationPhase}
            panelMoved={!initialPanelAnimation}
            isTransitioning={isTransitioning}
            secondPhaseCollapse={gridLinesVisible}
            transitionDirection={componentTransitionDirection}
            heightMorphStarted={heightMorphStarted}
            widthMorphStarted={widthMorphStarted}
            isSidebarCollapsed={isCollapsed}
            className={cn()}
          >
          {/* Main Panel Content */}
          <ModalPanel
            ref={modalPanelRef}
            shouldBlur={textFadeStarted}
            showGridLines={gridLinesVisible}
          >
            {/* Wave Background - LOWEST Z-INDEX */}
            <WaveBackground
              isVisible={wavesVisible}
              containerRef={modalPanelRef}
              modalExpanded={modalState.isModalExpanded}
              fadeState={wavesFadeState}
            />

            {/* Glow Particles - EXACT VALUES FROM ORIGINAL */}
            <GlowParticles
              isVisible={particlesVisible}
              particleCount={50}
              baseHue={180}
              monochrome={true}
              mode="default"
              saturation={90}
              lightness={70}
              radiusScale={0.6}
              parentRef={modalPanelRef}
              showDebug={false}
              fadeState={particlesFadeState}
            />

            {/* Focus Cards - Stay in DOM during modal state for proper fade-out */}
            {(modalState.isModalExpanded || carouselVisible) && (
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center z-50",
                  // COORDINATED TRANSITION: Apply transition and state together with 400ms delay
                  modalState.isModalExpanded && carouselVisible
                    ? "carousel-fade-in-delayed"
                    : "carousel-fade-out"
                )}
              >
                <FocusCards
                  cards={anuttaraModalCards}
                  className="w-full h-full"
                />
              </div>
            )}

            {/* Anuttara Image - Always clickable for modal close - Custom sizing for Anuttara */}
            <ParamasivaImage
              src="/ui-system/anuttara-icon.png"
              alt="Anuttara Ground Glyph"
              isExpanded={modalState.isModalExpanded}
              onClick={handleImageClick}
              className={cn(
                modalState.isModalExpanded && [
                  "!w-[96px] !h-[96px]",  // 0.8x of standard 120px
                  "!top-[3px] !left-[3px]"  // 2px border + 1px gap from visible corner
                ]
              )}
            />

            {/* Corner Modal Indicator */}
            {modalState.isModalExpanded && (
              <div className="absolute top-5 right-5 text-[10px] text-ui-medium tracking-wider opacity-60">
                EXPANDED
              </div>
            )}
          </ModalPanel>

          </ContentPanel>

          {/* Coordinate Text - Page-bound, scrolls with content */}
          <CoordinateText
            coordinate={coordinate}
            visible={textFadeStarted ? false : coordinateTextVisible}
            position="overlay"
            linkToPageCoordinate
          />
        </PortfolioContainer>
      </PageFadeIn>

      {/* Horizontal Tracing Beam - Between Pages */}
      <HorizontalTracingBeam startPoint={0.3} endPoint={1.0} />

      {/* Second Page - Subnodes Section */}
      <SubnodesSection
        cards={anuttaraSubnodeCards}
        title="Subnodes"
        description="Four differentiations inside the Anuttara ground field: structural balance, resonance telemetry, stillpoint handoffs, and the silent apprenticeship."
        logoSrc="/ui-system/anuttara-icon.png"
        logoAlt="Anuttara Mark"
      />

      {/* White Fade Overlay for Page Transitions */}
      <WhiteFadeOverlay
        visible={whiteOverlayVisible}
        onAnimationComplete={() => {}}
      />
    </div>
  );
};

export default AnuttaraPage;
