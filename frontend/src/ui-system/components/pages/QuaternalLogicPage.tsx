'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PortfolioContainer } from '../ui/PortfolioContainer';
import { Sidebar } from '../ui/Sidebar';
import { ProjectDetails } from '../ui/ProjectDetails';
import { WhiteFadeOverlay } from '../ui/WhiteFadeOverlay';
import { PageFadeIn } from '../ui/PageFadeIn';
import { TextAnimate } from '../ui/TextAnimate';
import { WaveBackground } from '../ui/WaveBackground';
import { GlowParticles } from '../ui/GlowParticles';
import { useInterPageTransition } from '@/hooks/ui-system/useInterPageTransition';
import { DetailsModalSystem } from '../ui/DetailsModalSystem';
import { cn } from '../../lib/utils';

export const QuaternalLogicPage: React.FC = () => {
  // Page transition state
  const {
    whiteOverlayVisible,
    isTransitioning,
    textFadeStarted,
    transitionToSubsystems
  } = useInterPageTransition();
  
  // Current page state for content switching
  const [currentPage, setCurrentPage] = useState(0);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [isBlurring, setIsBlurring] = useState(false);
  
  // PNG image loaded state - applied after fade-in animation completes
  const [pngImageLoaded, setPngImageLoaded] = useState(false);
  
  // Panel 2 PNG image loaded state
  const [panel2ImageLoaded, setPanel2ImageLoaded] = useState(false);
  
  // Coordinate text animation state
  const [coordinateTextVisible, setCoordinateTextVisible] = useState(false);
  
  // Wave and particles background state
  const [wavesVisible, setWavesVisible] = useState(false);
  const [wavesFadeState, setWavesFadeState] = useState<'hidden' | 'visible' | 'modal-hiding'>('hidden');
  const [particlesVisible, setParticlesVisible] = useState(false);
  const [particlesFadeState, setParticlesFadeState] = useState<'hidden' | 'visible' | 'modal-hiding'>('hidden');
  const modalPanelRef = useRef<HTMLDivElement>(null);
  
  // QL Modal state for hover effect
  const [showQLModal, setShowQLModal] = useState(false);
  
  // Modal expansion state for Panel 2 
  const [isModalExpanded, setIsModalExpanded] = useState(false);
  
  // Bottom panel expansion state
  const [isBottomPanelExpanded, setIsBottomPanelExpanded] = useState(false);
  
  // Panel transition state for hover timing
  const [isPanelTransitioning, setIsPanelTransitioning] = useState(false);

  // Coordinate text animation - becomes visible after initial load
  useEffect(() => {
    const coordTimer = setTimeout(() => {
      setCoordinateTextVisible(true);
    }, 2500);

    return () => clearTimeout(coordTimer);
  }, []);

  // PNG image loaded state - applied after fade-in animation completes (0.8s delay + 1.5s duration = 2.3s)
  useEffect(() => {
    const pngTimer = setTimeout(() => {
      setPngImageLoaded(true);
    }, 2300);

    return () => clearTimeout(pngTimer);
  }, []);

  // Panel 2 PNG image loaded state - triggered when switching to page 2
  useEffect(() => {
    if (currentPage === 1) {
      const panel2Timer = setTimeout(() => {
        setPanel2ImageLoaded(true);
      }, 2300);

      return () => clearTimeout(panel2Timer);
    } else {
      setPanel2ImageLoaded(false);
    }
  }, [currentPage]);

  // Wave background initialization
  useEffect(() => {
    if (currentPage === 0) {
      const waveTimer = setTimeout(() => {
        setWavesVisible(true);
        setWavesFadeState('visible');
      }, 1000);

      return () => clearTimeout(waveTimer);
    } else {
      setWavesVisible(false);
    }
  }, [currentPage]);

  // Particles initialization for page 2
  useEffect(() => {
    if (currentPage === 1) {
      // Immediately set visible but hidden state for smooth fade-in
      setParticlesVisible(true);
      setParticlesFadeState('hidden');
      
      // Short delay then fade in smoothly
      const particleTimer = setTimeout(() => {
        setParticlesFadeState('visible');
      }, 300);

      return () => clearTimeout(particleTimer);
    } else {
      setParticlesVisible(false);
      setParticlesFadeState('hidden');
    }
  }, [currentPage]);

  // Navigation handlers
  const handleParamasivaClick = () => {
    window.location.href = '/paramasiva';
  };

  const handleSubsystemsClick = () => {
    transitionToSubsystems();
  };

  const handleEpiLogosClick = () => {
    window.location.href = '/';
  };

  const handleBottomPanelToggle = () => {
    setIsPanelTransitioning(true);
    setIsBottomPanelExpanded(!isBottomPanelExpanded);
    
    // Clear transition state after animation completes (matches ProjectDetails duration)
    setTimeout(() => {
      setIsPanelTransitioning(false);
    }, 800);
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (isPageTransitioning) return;
    
    setIsPageTransitioning(true);
    setIsBlurring(true);
    
    // FIXED: Synchronize canvas fade with page blur transitions
    setWavesFadeState('hidden');
    setParticlesFadeState('hidden');
    
    // Fade out existing text
    setTimeout(() => {
      if (direction === 'next' && currentPage === 0) {
        setCurrentPage(1);
      } else if (direction === 'prev' && currentPage === 1) {
        setCurrentPage(0);
      }
      
      // Start unblur and fade in new content
      setTimeout(() => {
        setIsBlurring(false);
        // FIXED: Restore canvas visibility after page transition
        setTimeout(() => {
          setWavesFadeState('visible');
          setParticlesFadeState('visible');
        }, 100);
      }, 200);
    }, 300);
    
    setTimeout(() => setIsPageTransitioning(false), 900);
  };

  const getProjectContent = () => {
    if (currentPage === 0) {
      return {
        title: "COORDINATE : DETAILS",
        items: [
          { label: "Core", value: "Paramasiva transforms unified potential into complete logical framework governing reality" },
          { label: "Foundation", value: "100% = 64+36 = 16/9 = 4²/3² mathematical genesis with 6-stage nested development" },
          { label: "Operation", value: "Contextual frames prioritized over structural-logical, each context as recursive system" },
          { label: "Progression", value: "Basic 4/6 → bi-directional synthesis → contextual flowering → harmonic meta-frames → Map-Compass-Lens integration" },
          { label: "Symbol", value: "Map (triangular foundation) + Compass (orientational stability) + Lens (infinite reflectivity) = epistemic philosopher's stone" },
          { label: "Realization", value: "Observer-observed uncertainty relationship leading to Pratyabhijna through consciousness-unconscious recursion" }
        ]
      };
    } else {
      return {
        title: "QUATERNAL LOGIC : ALGEBRAIC TOPOLOGY",
        items: [
          { label: "Position 0 (Implicate)", value: "Represents the initial point, the transcendent origin of the square. This is the unmanifest potential from which the entire drawing process emerges." },
          { label: "Position 1 (Explicate)", value: "Adds the first line, defining the initial dimension and direction. This aligns with QL's \"what\" function, establishing the material cause and content of the system." },
          { label: "Position 2 (Explicate)", value: "Adds a second line at a right angle, creating a dynamic tension and a new form. This is QL's \"how\" function, introducing the efficient cause and the process of change." },
          { label: "Position 3 (Explicate)", value: "Adds the third line, forming an incomplete three-sided shape. This represents formal mediation, the \"which/who\" dimension that seeks to integrate the previous two sides into a coherent pattern." },
          { label: "Position 4 (Explicate)", value: "Adds the final line, completing the square. This is the contextual arena, the \"when/where\" function that situates the entire process within a stable, four-sided framework." },
          { label: "Position 5 (Implicate)", value: "The square is now complete, and the drawing process is finalized. Position 5 synthesizes this completed form, preparing to loop back to Position 0, which seeds a new cycle of creation. This is a Möbius-like twist where the final synthesis becomes a new beginning." }
        ]
      };
    }
  };

  return (
    <>
      <PageFadeIn>
        <PortfolioContainer 
          pageType="quaternal-logic"
          isModalExpanded={isModalExpanded}
          isTransitioning={isTransitioning}
          transitionDirection="to-subsystems"
        >
          {/* Left Sidebar */}
          <Sidebar 
            variant="main" 
            isModalExpanded={false}
            isTransitioning={isTransitioning}

          >
            {/* Logo */}
            <TextAnimate 
              visible={!textFadeStarted}
              delay={200}
              duration="slow"
              className="text-[18px] font-normal tracking-[2px] text-[#333] mb-10 text-center"
            >
              EPI : LOGOS
            </TextAnimate>

            {/* Title Section */}
            <div className="flex flex-col flex-1 justify-center">
              <TextAnimate 
                visible={!textFadeStarted}
                delay={600}
                duration="slow"
                className="text-[18px] font-normal text-[#333] leading-[1.3] mb-[2px] text-center"
              >
                QUATERNAL LOGIC FLOWERING
              </TextAnimate>
              <TextAnimate 
                visible={!textFadeStarted}
                delay={1000}
                className="text-[11px] text-[#666] mt-[20px] tracking-[1px] text-center"
              >
                PARAMASIVA LVL 4
              </TextAnimate>
            </div>

            {/* Footer Links - EXACT SAME PATTERN AS PARAMASIVA */}
            <div className="flex flex-col gap-[10px] items-start text-left">
              <div onClick={handleParamasivaClick}>
                <TextAnimate 
                  visible={!textFadeStarted}
                  delay={1300}
                  duration="normal"
                  className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]"
                >
                  Paramasiva
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
              <div onClick={handleEpiLogosClick}>
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
          </Sidebar>

          {/* Main Content - ORIGINAL STRUCTURE */}
          <div className="flex-1 flex flex-col relative">
            {/* Page Container - THE CONTAINER THAT EXPANDS */}
            <div className={cn(
              "relative overflow-hidden m-[20px_20px_0_0] bg-[#090a09]", 
              // FIXED: Base transition for bidirectional smoothness
              "transition-[height,z-index] duration-700 ease-out",
              // FIXED: Apply expansion for BOTH page transitions AND modal hover
              (isTransitioning || isModalExpanded)
                ? "page-container-quaternal-expanded"  // QUATERNAL LOGIC SPECIFIC: Expand during page transitions OR hover
                : "h-[60vh]"
            )}>
              {/* Image Placeholder - EXACT original structure */}
              <div 
                ref={modalPanelRef}
                className={cn(
                  "h-full bg-[#090a09] relative overflow-hidden transition-[border] duration-300 ease-in-out",
                  isPageTransitioning ? 'border-2 border-transparent' : 'border-2 border-[#ccc]',
                  isPageTransitioning && 'page-content-transitioning',
                  isBlurring ? 'page-content-blurring' : 'page-content-active'
                )}
                onMouseEnter={() => {
                  if (currentPage === 0 && !isBottomPanelExpanded) {
                    setShowQLModal(true);
                  }
                }}
                onMouseLeave={() => {
                  if (currentPage === 0 && !isBottomPanelExpanded) {
                    setShowQLModal(false);
                  }
                }}
              >
                {/* Wave Background for Page 1 */}
                {currentPage === 0 && (
                  <WaveBackground
                    isVisible={wavesVisible}
                    containerRef={modalPanelRef}
                    modalExpanded={false}
                    fadeState={wavesFadeState}
                  />
                )}
                
                {/* Particles for Page 2 */}
                {currentPage === 1 && (
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
                    scaleOnHover={isModalExpanded}
                    hoverParticleCount={500}
                    hoverOpacity={0.4}
                    fadeState={particlesFadeState}
                  />
                )}

                {/* PNG Image - positioned absolutely in panel, always visible on page 1 */}
                {currentPage === 0 && (
                  <img 
                    src="/ui-system/Gemini_Generated_Image_ctzwt7ctzwt7ctzw (1).png" 
                    alt="Quaternal Logic Visualization" 
                    className={cn(
                      "ql-image-positioning ql-image-fade-in",
                      // Apply loaded state only after fade-in animation completes
                      pngImageLoaded && "ql-image-loaded ql-image-hover",
                      // Fade out during page transitions
                      isPageTransitioning && "ql-image-transition-out"
                    )}
                  />
                )}

                {/* Page 1 Content - QL Overview Modal INSIDE image area */}
                {currentPage === 0 && (
                  <>
                    {/* QL Overview Modal - EXACT original CSS positioning in pure Tailwind */}
                    <div className={`absolute top-[12%] left-[25%] -translate-x-[35%] w-[52%] max-w-[650px] h-[80%] max-h-[800px] bg-gray-300/10 border-0 rounded-none px-[25px] py-[30px] transition-[opacity,visibility] duration-300 ease-in-out z-[50] pointer-events-none overflow-y-auto ${showQLModal ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                      <h2 className="font-mono text-[24px] font-normal text-[#f5f5f5] text-center mb-[25px] tracking-[2px] uppercase">QL Overview</h2>
                      <div className="font-mono text-[11px] leading-[1.6] text-[#f5f5f5] tracking-[0.5px]">
                        <p className="mb-[16px] text-justify text-[#f5f5f5]">Quaternal Logic represents a revolutionary approach to computational reasoning, integrating four-dimensional thinking patterns that transcend traditional binary frameworks.</p>
                        <p className="mb-[16px] text-justify text-[#f5f5f5]">This system enables deeper cognitive processing through multi-layered decision trees and adaptive intelligence pathways.</p>
                        <p className="mb-0 text-justify text-[#f5f5f5]">The QL framework supports advanced pattern recognition and complex problem-solving methodologies across diverse application domains.</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Page 2 Content - Algebraic Topology Visualization */}
                {currentPage === 1 && (
                  <div 
                    className={cn(
                      "w-full h-full flex items-center justify-center relative transition-opacity duration-300",
                      isModalExpanded && "page-two-left-expanded page-two-children-expanded",
                      isModalExpanded && 'page-two-debug-active'
                    )}
                    onMouseEnter={() => {
                      if (!isBottomPanelExpanded && !isPanelTransitioning) {
                        setIsModalExpanded(true);
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isBottomPanelExpanded && !isPanelTransitioning) {
                        setIsModalExpanded(false);
                      }
                    }}
                  >
                    <img 
                      src="/ui-system/Gemini_Generated_Image_8esm0e8esm0e8esm (1).png" 
                      alt="Algebraic Topology Visualization" 
                      className={cn(
                        "w-[480px] h-[360px] object-contain translate-y-[5px]",
                        // Apply same fade system as Panel 1 PNG
                        "ql-image-fade-in",
                        panel2ImageLoaded && "ql-image-loaded",
                        // Fade out during page transitions
                        isPageTransitioning && "ql-image-transition-out",
                        // BASE TRANSITION - Always present for smooth bidirectional transitions
                        "panel-two-png-smooth-transition",
                        // STATE CHANGES - Priority: Bottom Panel > Modal Hover > Normal
                        isBottomPanelExpanded && "panel-two-png-bottom-state",
                        !isBottomPanelExpanded && isModalExpanded && "panel-two-png-modal-state",
                        // CONTAINER-BASED HOVER - Triggered by container hover state
                        !isBottomPanelExpanded && isModalExpanded && panel2ImageLoaded && "ql-image-container-hover"
                      )}
                    />
                    
                    {/* Geometric annotations - using original CSS approach with fade-in */}
                    <div className="geometry-annotations">
                      <div className={cn(
                        "annotation-square",
                        // Fade-in timing - appears with panel 2 image
                        panel2ImageLoaded && "annotation-square-visible",
                        // Page transition fade-out
                        isPageTransitioning && "annotation-square-transition-out",
                        // Keep existing expansion animation
                        isModalExpanded && "geometry-text-unified-expanded"
                      )}>
                        4G SIDES
                      </div>
                      <div className={cn(
                        "annotation-torus",
                        // Fade-in timing - appears with panel 2 image
                        panel2ImageLoaded && "annotation-torus-visible",
                        // Page transition fade-out
                        isPageTransitioning && "annotation-torus-transition-out",
                        // Keep existing expansion animation
                        isModalExpanded && "geometry-text-unified-expanded"
                      )}>
                        2G LOOPS
                      </div>
                    </div>

                    {/* COMMENTED OUT: Previous calc() approach for testing */}
                    {/*
                    <div className="absolute inset-0 pointer-events-none z-20">
                      <div className={cn(
                        "absolute font-mono text-[10px] font-normal text-[#f5f5f5] tracking-[1px] uppercase opacity-80",
                        "left-[40%] -translate-x-1/2",
                        "geometry-text-unified",
                        isModalExpanded && "geometry-text-unified-expanded"
                      )}
                      style={{ top: `calc(35% + 158px)` }}
                      >
                        4G SIDES
                      </div>
                      <div className={cn(
                        "absolute font-mono text-[10px] font-normal text-[#f5f5f5] tracking-[1px] uppercase opacity-80",
                        "translate-x-1/2",
                        "geometry-text-unified",
                        isModalExpanded && "geometry-text-unified-expanded"
                      )}
                      style={{ 
                        top: `calc(30% + 180px)`, 
                        right: `calc(18% + 240px)` 
                      }}
                      >
                        2G LOOPS
                      </div>
                    </div>
                    */}

                    {/* Details Modal System */}
                    <DetailsModalSystem 
                      isVisible={isModalExpanded}
                      isExpanded={isModalExpanded}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Project Details - SIBLING to page-container, not nested */}
            <ProjectDetails 
              title={getProjectContent().title}
              items={getProjectContent().items}
              currentPage={currentPage}
              isPageTransitioning={isPageTransitioning}
              isBlurring={isBlurring}
              textFadeStarted={textFadeStarted}
              onPageChange={handlePageChange}
              isModalExpanded={isModalExpanded}
              isBottomPanelExpanded={isBottomPanelExpanded}
              onExpandBottomPanel={handleBottomPanelToggle}
            />

            {/* Coordinate Text Overlay - CONVERTED FROM ORIGINAL CSS */}
            <div 
              className={cn(
                "coordinate-text-overlay",
                // FIXED: Use converted CSS utilities + ADD MISSING HOVER STATE
                (!textFadeStarted && coordinateTextVisible && !isModalExpanded) 
                  && 'coordinate-text-overlay-visible'
              )}
            >
              #1-4
            </div>
          </div>
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

export default QuaternalLogicPage;