'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/ui-system/utils/cn';
import { PortfolioContainer } from '@/ui-system/components/ui/PortfolioContainer';
import { Sidebar } from '@/ui-system/components/ui/Sidebar';
import { ContentPanel } from '@/ui-system/components/ui/ContentPanel';
import { ModalPanel } from '@/ui-system/components/ui/ModalPanel';
import { CoordinateText } from '@/ui-system/components/ui/CoordinateText';
import { ParamasivaImage } from '@/ui-system/components/ui/ParamasivaImage';
import { PageFadeIn } from '@/ui-system/components/ui/PageFadeIn';
import { TextAnimate } from '@/ui-system/components/ui/TextAnimate';
import { TextSwitch } from '@/ui-system/components/ui/TextSwitch';
import { WaveBackground } from '@/ui-system/components/ui/WaveBackground';
import { GlowParticles } from '@/ui-system/components/ui/GlowParticles';
import { FocusCards } from '@/ui-system/components/ui/FocusCards';
import { SubnodesSection } from '@/ui-system/components/ui/SubnodesSection';

import { useModalTransition } from '@/hooks/ui-system/useModalTransition';
import { useSidebar } from '@/contexts/SidebarContext';
import { aboutContent } from '@/ui-system/content/about-content';
import { aboutScreenshotCards } from '@/ui-system/content/about-focus-cards';

export default function AboutPage() {
  // Use custom hooks for state management
  const [modalState, modalActions] = useModalTransition();
  const { isCollapsed } = useSidebar();

  // Logo text state
  const [logoText, setLogoText] = useState(aboutContent.collapsedLogoText);

  // Coordinate text animation state
  const [coordinateTextVisible, setCoordinateTextVisible] = useState(false);

  // Initial panel height animation state
  const [initialPanelAnimation, setInitialPanelAnimation] = useState(true);

  // Wave background state and ref
  const [wavesVisible, setWavesVisible] = useState(false);
  const [wavesFadeState, setWavesFadeState] = useState<'hidden' | 'visible' | 'modal-hiding' | 'quick-fade-out'>('hidden');

  // Focus cards visibility - only show after modal expansion animation completes
  const [carouselVisible, setCarouselVisible] = useState(false);

  // Particles state
  const [particlesVisible, setParticlesVisible] = useState(false);
  const [particlesFadeState, setParticlesFadeState] = useState<'hidden' | 'visible' | 'modal-hiding' | 'quick-fade-out'>('hidden');
  const modalPanelRef = useRef<HTMLDivElement>(null);

  // Update logo text based on modal state
  useEffect(() => {
    setLogoText(modalState.isModalExpanded ? aboutContent.expandedLogoText : aboutContent.collapsedLogoText);
  }, [modalState.isModalExpanded]);

  // Initial panel height animation - lifts panel after 1.5 seconds
  useEffect(() => {
    const panelTimer = setTimeout(() => {
      setInitialPanelAnimation(false);
    }, 1500);

    return () => clearTimeout(panelTimer);
  }, []);

  // Coordinate text animation - becomes visible after panel lifts up
  useEffect(() => {
    const coordTimer = setTimeout(() => {
      setCoordinateTextVisible(true);
    }, 2200);

    return () => clearTimeout(coordTimer);
  }, []);

  // Wave background initialization
  useEffect(() => {
    const waveTimer = setTimeout(() => {
      setWavesVisible(true);
      setWavesFadeState('visible');
    }, 1000);

    return () => clearTimeout(waveTimer);
  }, []);

  // Particles initialization
  useEffect(() => {
    const particleTimer = setTimeout(() => {
      setParticlesVisible(true);
      setParticlesFadeState('visible');
    }, 1000);

    return () => clearTimeout(particleTimer);
  }, []);

  // Wave + Particles fade coordination with modal transitions
  useEffect(() => {
    if (modalState.isModalExpanded) {
      // Modal opening: fade out waves and particles
      const fadeOutTimer = setTimeout(() => {
        setWavesFadeState('modal-hiding');
        setParticlesFadeState('modal-hiding');
      }, 600);

      // After modal animations complete, recreate only particles
      const recreateTimer = setTimeout(() => {
        setWavesVisible(false);
        setParticlesVisible(false);
        setTimeout(() => {
          setParticlesVisible(true);
          setTimeout(() => {
            setParticlesFadeState('visible');
          }, 200);
        }, 100);
      }, 1800);

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(recreateTimer);
      };
    } else {
      // Modal closing: recreate both
      const fadeOutTimer = setTimeout(() => {
        setWavesFadeState('modal-hiding');
        setParticlesFadeState('modal-hiding');
      }, 100);

      const recreateTimer = setTimeout(() => {
        setWavesVisible(false);
        setParticlesVisible(false);
        setTimeout(() => {
          setWavesVisible(true);
          setParticlesVisible(true);
          setTimeout(() => {
            setWavesFadeState('visible');
            setParticlesFadeState('visible');
          }, 200);
        }, 100);
      }, 1200);

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(recreateTimer);
      };
    }
  }, [modalState.isModalExpanded]);

  // Focus cards timing control
  useEffect(() => {
    if (modalState.isModalExpanded) {
      const showCarouselTimer = setTimeout(() => {
        setCarouselVisible(true);
      }, 1800);

      return () => clearTimeout(showCarouselTimer);
    } else {
      const hideCarouselTimer = setTimeout(() => {
        setCarouselVisible(false);
      }, 500);

      return () => clearTimeout(hideCarouselTimer);
    }
  }, [modalState.isModalExpanded]);

  // Quick particles fade-out when modal expansion starts
  useEffect(() => {
    if (modalState.isModalExpanded && modalState.animationPhase === 'height-expanding') {
      setWavesFadeState('quick-fade-out');
      setParticlesFadeState('quick-fade-out');
    }
  }, [modalState.isModalExpanded, modalState.animationPhase]);

  const handleImageClick = () => {
    if (modalState.isModalExpanded) {
      modalActions.closeModal();
    } else {
      modalActions.openModal();
    }
  };

  return (
    <div data-page="about">
      <PageFadeIn>
        <PortfolioContainer
          pageType="paramasiva"
          isModalExpanded={modalState.isModalExpanded}
          isTransitioning={false}
          transitionDirection="idle"
          className="min-h-screen"
        >
          {/* Text Content Sidebar */}
          <Sidebar
            variant="paramasiva"
            isModalExpanded={modalState.isModalExpanded}
            isTransitioning={false}
            transitionDirection="idle"
          >
            {/* Logo */}
            <TextSwitch
              text={logoText}
              visible={true}
              delay={200}
              duration="slow"
              className="text-[18px] font-normal tracking-[2px] text-[#333] mb-6 text-center"
            />

            {/* Content Section */}
            <div className={`flex flex-col flex-1 ${!modalState.isModalExpanded ? "justify-center" : ""}`}>
              {!modalState.isModalExpanded && (
                <>
                  <TextAnimate
                    visible={true}
                    delay={600}
                    duration="slow"
                    className="text-[18px] font-normal text-[#333] leading-[1.3] mb-[2px] text-center"
                  >
                    {aboutContent.title}
                  </TextAnimate>
                  <TextAnimate
                    visible={true}
                    delay={1000}
                    className="text-[11px] text-[#666] mt-[20px] tracking-[1px] text-center"
                  >
                    {aboutContent.subtitle}
                  </TextAnimate>
                  <TextAnimate
                    visible={true}
                    delay={1300}
                    className="text-[10px] text-[#666] mt-[30px] tracking-[0.5px] text-center leading-[1.6] px-4"
                  >
                    {aboutContent.hero.tagline}
                  </TextAnimate>
                </>
              )}

              {modalState.isModalExpanded && (
                <div
                  className={cn(
                    "flex flex-col gap-6 h-full transition-opacity duration-500 overflow-y-auto scrollbar-thin-custom px-2",
                    modalState.modalTextVisible ? "opacity-100" : "opacity-0"
                  )}
                >
                  {/* Quaternal Logic Section */}
                  <div className="border border-gray-300 rounded-sm bg-white/50 p-5">
                    <div className="mb-2">
                      <div className="text-xs font-mono text-gray-500 mb-1">#QL</div>
                      <h3 className="text-xs font-semibold text-gray-800 tracking-wide">
                        {aboutContent.sections.quternalLogic.title}
                      </h3>
                      <p className="text-[9px] text-gray-500 italic mt-1">
                        {aboutContent.sections.quternalLogic.subtitle}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      {aboutContent.sections.quternalLogic.description}
                    </p>
                  </div>

                  {/* MEF Section */}
                  <div className="border border-gray-300 rounded-sm bg-white/50 p-5">
                    <div className="mb-2">
                      <div className="text-xs font-mono text-gray-500 mb-1">#MEF</div>
                      <h3 className="text-xs font-semibold text-gray-800 tracking-wide">
                        {aboutContent.sections.mef.title}
                      </h3>
                      <p className="text-[9px] text-gray-500 italic mt-1">
                        {aboutContent.sections.mef.subtitle}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      {aboutContent.sections.mef.description}
                    </p>
                  </div>

                  {/* Geometric Epistemology Section */}
                  <div className="border border-gray-300 rounded-sm bg-white/50 p-5">
                    <div className="mb-2">
                      <div className="text-xs font-mono text-gray-500 mb-1">#GEOMETRY</div>
                      <h3 className="text-xs font-semibold text-gray-800 tracking-wide">
                        {aboutContent.sections.geometricEpistemology.title}
                      </h3>
                      <p className="text-[9px] text-gray-500 italic mt-1">
                        {aboutContent.sections.geometricEpistemology.subtitle}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      {aboutContent.sections.geometricEpistemology.description}
                    </p>
                  </div>

                  {/* CAG Section */}
                  <div className="border border-gray-300 rounded-sm bg-white/50 p-5">
                    <div className="mb-2">
                      <div className="text-xs font-mono text-gray-500 mb-1">#CAG</div>
                      <h3 className="text-xs font-semibold text-gray-800 tracking-wide">
                        {aboutContent.sections.cag.title}
                      </h3>
                      <p className="text-[9px] text-gray-500 italic mt-1">
                        {aboutContent.sections.cag.subtitle}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      {aboutContent.sections.cag.description}
                    </p>
                  </div>

                  {/* Vision/Telos Section */}
                  <div className="border border-gray-300 rounded-sm bg-white/50 p-5">
                    <div className="mb-2">
                      <div className="text-xs font-mono text-gray-500 mb-1">#TELOS</div>
                      <h3 className="text-xs font-semibold text-gray-800 tracking-wide">
                        {aboutContent.vision.title}
                      </h3>
                    </div>
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      {aboutContent.vision.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Sidebar>

          {/* Main Content Panel */}
          <ContentPanel
            pageType="paramasiva"
            isModalExpanded={modalState.isModalExpanded}
            animationPhase={modalState.animationPhase}
            panelMoved={!initialPanelAnimation}
            isTransitioning={false}
            secondPhaseCollapse={false}
            transitionDirection="idle"
            heightMorphStarted={false}
            widthMorphStarted={false}
            isSidebarCollapsed={isCollapsed}
          >
            {/* Main Panel Content */}
            <ModalPanel
              ref={modalPanelRef}
              shouldBlur={false}
              showGridLines={false}
            >
              {/* Wave Background */}
              <WaveBackground
                isVisible={wavesVisible}
                containerRef={modalPanelRef}
                modalExpanded={modalState.isModalExpanded}
                fadeState={wavesFadeState}
              />

              {/* Glow Particles */}
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

              {/* Focus Cards - Screenshot Showcase */}
              {(modalState.isModalExpanded || carouselVisible) && (
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center z-50",
                    modalState.isModalExpanded && carouselVisible
                      ? "carousel-fade-in-delayed"
                      : "carousel-fade-out"
                  )}
                >
                  <FocusCards
                    cards={aboutScreenshotCards}
                    className="w-full h-full"
                  />
                </div>
              )}

              {/* Logo Image - Using the new geometric spiral */}
              <ParamasivaImage
                src="/ui-system/Generated Image August 28, 2025 - 11_22PM.png"
                alt="Epi-Logos Geometric Pattern"
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

          {/* Coordinate Text */}
          <CoordinateText
            coordinate="#ABOUT"
            visible={coordinateTextVisible}
            position="overlay"
          />
        </PortfolioContainer>
      </PageFadeIn>

      {/* Second Page - Screenshot Showcase in Subnodes Format */}
      <SubnodesSection
        cards={aboutScreenshotCards}
        title="Platform Features"
        description="A glimpse into the Epi-Logos system: etymological archaeology, temporal knowledge synthesis, and coordinate-aware AI orchestration."
      />
    </div>
  );
}
