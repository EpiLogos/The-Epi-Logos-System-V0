'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { PortfolioContainer } from '../ui/PortfolioContainer';
import { Sidebar } from '../ui/Sidebar';
import { ContentPanel } from '../ui/ContentPanel';
import { ModalPanel } from '../ui/ModalPanel';
import { CoordinateText } from '../ui/CoordinateText';
import { ParamasivaImage } from '../ui/ParamasivaImage';
import { ScrollableContent } from '../ui/ScrollableContent';
import { WhiteFadeOverlay } from '../ui/WhiteFadeOverlay';
import { PageFadeIn } from '../ui/PageFadeIn';
import { TextAnimate } from '../ui/TextAnimate';
import { TextSwitch } from '../ui/TextSwitch';
import { WaveBackground } from '../ui/WaveBackground';
import { GlowParticles } from '../ui/GlowParticles';
import { ProjectCarousel } from '../ui/ProjectCarousel';
import { HorizontalTracingBeam } from '../ui/HorizontalTracingBeam';
import { ProjectsSection } from '../ui/ProjectsSection';

import { useModalTransition } from '@/hooks/ui-system/useModalTransition';
import { useInterPageTransition } from '@/hooks/ui-system/useInterPageTransition';
import { useSidebar } from '@/contexts/SidebarContext';

export const ParamasivaPage: React.FC<{ coordinate?: string }> = ({ coordinate = '#1' }) => {
  // Use custom hooks for state management
  const [modalState, modalActions] = useModalTransition();
  const { isCollapsed, toggle } = useSidebar();
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
  const getComponentTransitionDirection = () => {
    if (!isTransitioning || !currentTransitionDirection) return 'idle';

    switch (currentTransitionDirection) {
      case 'paramasiva-to-subsystems':
        return 'to-subsystems';
      case 'paramasiva-to-quaternal':
        return 'to-quaternal';
      case 'paramasiva-to-epilogos':
        return 'to-main';
      default:
        return 'idle';
    }
  };

  const componentTransitionDirection = getComponentTransitionDirection();

  // Logo text state
  const [logoText, setLogoText] = useState("EPI : LOGOS");

  // Coordinate text animation state
  const [coordinateTextVisible, setCoordinateTextVisible] = useState(false);

  // Initial panel height animation state
  const [initialPanelAnimation, setInitialPanelAnimation] = useState(true);

  // Wave background state and ref
  const [wavesVisible, setWavesVisible] = useState(false);
  const [wavesFadeState, setWavesFadeState] = useState<'hidden' | 'visible' | 'modal-hiding' | 'quick-fade-out'>('hidden');

  // Carousel navigation state
  const [carouselNavigation, setCarouselNavigation] = useState<React.ReactNode>(null);

  // Carousel visibility - only show after modal expansion animation completes
  const [carouselVisible, setCarouselVisible] = useState(false);

  // Particles state - EXACT SAME PATTERN AS WAVES
  const [particlesVisible, setParticlesVisible] = useState(false);
  const [particlesFadeState, setParticlesFadeState] = useState<'hidden' | 'visible' | 'modal-hiding' | 'quick-fade-out'>('hidden');
  const modalPanelRef = useRef<HTMLDivElement>(null);

  // Update logo text based on modal state
  useEffect(() => {
    setLogoText(modalState.isModalExpanded ? "PARAMASIVA" : "EPI : LOGOS");
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

  // Carousel timing control - show after PNG animation completes
  useEffect(() => {
    if (modalState.isModalExpanded) {
      // CAROUSEL APPEARS: After text-fade(200ms) + height(800ms) + width(1000ms) + PNG animation + 600ms delay
      const showCarouselTimer = setTimeout(() => {
        setCarouselVisible(true);
      }, 1800); // 1200ms modal + 600ms delay for smooth fade-in

      return () => clearTimeout(showCarouselTimer);
    } else {
      // CAROUSEL FADE-OUT: Give time for fade-out animation before hiding
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
    transitionToSubsystems();
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
            className="text-[18px] font-normal tracking-[2px] text-[#333] mb-10 text-center"
          />

          {/* Content Section */}
          <div className={`flex flex-col ${!modalState.isModalExpanded ? "flex-1 justify-center" : ""}`}>
            {!modalState.isModalExpanded && (
              <>
                <TextAnimate
                  visible={!textFadeStarted}
                  delay={600}
                  duration="slow"
                  className="text-[18px] font-normal text-[#333] leading-[1.3] mb-[2px] text-center"
                >
                  PARAMASIVA TRANSFORMATION
                </TextAnimate>
                <TextAnimate
                  visible={!textFadeStarted}
                  delay={1000}
                  className="text-[11px] text-[#666] mt-[20px] tracking-[1px] text-center"
                >
                  MODAL EXPERIENCE
                </TextAnimate>
              </>
            )}

            {modalState.isModalExpanded && (
              <div className="flex flex-col">
                <ScrollableContent
                  visible={modalState.modalTextVisible}
                  className="flex-1"
                >
                  <p>Paramasiva represents the absolute, formless aspect of consciousness—the primordial awareness that underlies all manifestation. In the Shaivite tradition, Paramasiva is the transcendent dimension of Shiva, beyond all attributes, qualities, and limitations.</p>

                  <p>This state of pure consciousness is characterized by perfect stillness, infinite potential, and absolute freedom. It is the source from which all creation emerges and to which it returns—the eternal witness that remains unchanged throughout the cosmic dance of manifestation and dissolution.</p>

                  <p>In the context of Quaternal Logic, Paramasiva corresponds to the implicate order—the unmanifest dimension that contains all possibilities in potential form. It is the zero-point consciousness that precedes the emergence of the four fundamental positions of logical-causal relationship.</p>

                  <p>The geometric patterns surrounding this visualization represent the mathematical and topological structures that emerge from this primordial awareness. Each circle, triangle, and intersection point signifies a node of consciousness where infinite potential crystallizes into specific manifestations of being.</p>

                  <p>Through contemplation of these sacred geometries, one can glimpse the underlying order that governs both consciousness and cosmos—the eternal dance between the unmanifest and the manifest, between Paramasiva and Parashakti, between pure awareness and dynamic creativity.</p>

                  <p>This is the foundation of true knowledge: to recognize that all apparent multiplicity arises from and returns to the singular source of unlimited consciousness—the Paramasiva that is both the essence of all being and the witness of all becoming.</p>
                </ScrollableContent>
              </div>
            )}

          </div>

          {/* Footer Links - EXACT SAME AS SUBSYSTEMS WITH TRANSITION EFFECTS */}
          {!modalState.isModalExpanded && (
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

            {/* Carousel - Stay in DOM during modal state for proper fade-out */}
            {(modalState.isModalExpanded || carouselVisible) && (
              <div
                className={cn(
                  "absolute inset-4 flex items-center justify-center z-50",
                  // COORDINATED TRANSITION: Apply transition and state together with 400ms delay
                  modalState.isModalExpanded && carouselVisible
                    ? "carousel-fade-in-delayed"
                    : "carousel-fade-out"
                )}
              >
                <ProjectCarousel
                  visible={modalState.modalTextVisible && carouselVisible}
                  className="w-full max-w-full"
                  showArrows={false}
                  showDots={false}
                  onNavigationRender={setCarouselNavigation}
                />
              </div>
            )}

            {/* Paramasiva Image - Always clickable for modal close */}
            <ParamasivaImage
              src="/ui-system/paramasiva-icon.png"
              alt="Paramasiva Geometric Pattern"
              isExpanded={modalState.isModalExpanded}
              onClick={handleImageClick}
            />

            {/* Corner Modal Indicator */}
            {modalState.isModalExpanded && (
              <div className="absolute top-5 right-5 text-[10px] text-ui-medium tracking-wider opacity-60">
                EXPANDED
              </div>
            )}
          </ModalPanel>

          </ContentPanel>

          {/* Carousel Navigation - Centered relative to modal area, responsive to sidebar state */}
          {modalState.isModalExpanded && carouselNavigation && carouselVisible && (
            <div className={cn(
              "absolute bottom-8 right-8 flex justify-center z-20 carousel-nav-transition",
              isCollapsed ? "left-[74px]" : "left-[420px]" // Account for sidebar width + 20px margin
            )}>
              {carouselNavigation}
            </div>
          )}

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

      {/* Second Page - Projects Section */}
      <ProjectsSection />

      {/* White Fade Overlay for Page Transitions */}
      <WhiteFadeOverlay
        visible={whiteOverlayVisible}
        onAnimationComplete={() => {}}
      />
    </div>
  );
};

export default ParamasivaPage;
