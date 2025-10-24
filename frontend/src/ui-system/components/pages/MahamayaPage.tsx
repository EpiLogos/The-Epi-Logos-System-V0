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
import { FocusCards } from '../ui/FocusCards';
import { HorizontalTracingBeam } from '../ui/HorizontalTracingBeam';
import { SubnodesSection } from '../ui/SubnodesSection';

import { useModalTransition } from '@/hooks/ui-system/useModalTransition';
import { useInterPageTransition } from '@/hooks/ui-system/useInterPageTransition';
import { useSidebar } from '@/contexts/SidebarContext';
import { HexagonButton } from '../navigation/HexagonButton';
import { mahamayaContent } from '../../content/mahamaya-content';
import { coordinate3_0Summary } from '../../content/coordinates/3-0-summary';
import { coordinate3_5Summary } from '../../content/coordinates/3-5-summary';
import { mahamayaViewContent } from '@/content/mahamaya-view-on-epi-logos';
import { mahamayaModalCards, mahamayaSubnodeCards } from '../../content/mahamaya-focus-cards';

export const MahamayaPage: React.FC<{ coordinate?: string; autoExpand?: boolean }> = ({
  coordinate = '#3',
  autoExpand = false
}) => {
  // Modal + sidebar orchestration
  const [modalState, modalActions] = useModalTransition();
  const { isCollapsed, toggle, expand, openHexagonPanel, panelMode } = useSidebar();

  useEffect(() => {
    if (autoExpand) {
      if (isCollapsed) {
        expand();
      }

      const timer = setTimeout(() => {
        modalActions.openModal();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const getComponentTransitionDirection = (): 'idle' | 'to-subsystems' | 'to-quaternal' => {
    if (!isTransitioning || !currentTransitionDirection) return 'idle';

    switch (currentTransitionDirection) {
      case 'paramasiva-to-subsystems':
      case 'mahamaya-to-subsystems':
        return 'to-subsystems';
      case 'paramasiva-to-quaternal':
        return 'to-quaternal';
      case 'paramasiva-to-epilogos':
        return 'idle';
      default:
        return 'idle';
    }
  };

  const componentTransitionDirection = getComponentTransitionDirection();

  const [logoText, setLogoText] = useState(mahamayaContent.collapsedLogoText);
  const [coordinateTextVisible, setCoordinateTextVisible] = useState(false);
  const [initialPanelAnimation, setInitialPanelAnimation] = useState(true);
  const [wavesVisible, setWavesVisible] = useState(false);
  const [wavesFadeState, setWavesFadeState] = useState<'hidden' | 'visible' | 'modal-hiding' | 'quick-fade-out'>('hidden');
  const [carouselVisible, setCarouselVisible] = useState(false);
  const [particlesVisible, setParticlesVisible] = useState(false);
  const [particlesFadeState, setParticlesFadeState] = useState<'hidden' | 'visible' | 'modal-hiding' | 'quick-fade-out'>('hidden');
  const modalPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLogoText(modalState.isModalExpanded ? mahamayaContent.expandedLogoText : mahamayaContent.collapsedLogoText);
  }, [modalState.isModalExpanded]);

  useEffect(() => {
    const panelTimer = setTimeout(() => {
      setInitialPanelAnimation(false);
    }, 1500);
    return () => clearTimeout(panelTimer);
  }, []);

  useEffect(() => {
    const coordTimer = setTimeout(() => {
      setCoordinateTextVisible(true);
    }, 2200);
    return () => clearTimeout(coordTimer);
  }, []);

  useEffect(() => {
    const waveTimer = setTimeout(() => {
      setWavesVisible(true);
      setWavesFadeState('visible');
    }, 1000);
    return () => clearTimeout(waveTimer);
  }, []);

  useEffect(() => {
    const particleTimer = setTimeout(() => {
      setParticlesVisible(true);
      setParticlesFadeState('visible');
    }, 1000);
    return () => clearTimeout(particleTimer);
  }, []);

  useEffect(() => {
    if (modalState.isModalExpanded) {
      const fadeOutTimer = setTimeout(() => {
        setWavesFadeState('modal-hiding');
        setParticlesFadeState('modal-hiding');
      }, 600);

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

  useEffect(() => {
    if (textFadeStarted && !modalState.isModalExpanded) {
      setWavesFadeState('quick-fade-out');
    }
  }, [textFadeStarted, modalState.isModalExpanded]);

  useEffect(() => {
    if (modalState.isModalExpanded && modalState.animationPhase === 'height-expanding') {
      setWavesFadeState('quick-fade-out');
    }
  }, [modalState.isModalExpanded, modalState.animationPhase]);

  useEffect(() => {
    if (modalState.isModalExpanded && modalState.animationPhase === 'height-expanding') {
      setParticlesFadeState('quick-fade-out');
    }
  }, [modalState.isModalExpanded, modalState.animationPhase]);

  const handleImageClick = () => {
    if (modalState.isModalExpanded) {
      modalActions.closeModal();
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
    transitionToSubsystems('mahamaya');
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
                  {mahamayaViewContent.title}
                </h2>
                <p className="text-[10px] text-[#333]/60 tracking-[1px] italic mb-4">
                  {mahamayaViewContent.subtitle}
                </p>
              </div>

              <ScrollableContent className="flex-1">
                <div className="space-y-4 text-[#333]">
                  {mahamayaViewContent.sections.map((section, index) => (
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
              </ScrollableContent>
            </div>
          </div>

          <Sidebar
            variant="paramasiva"
            isModalExpanded={modalState.isModalExpanded}
            isTransitioning={isTransitioning}
            transitionDirection={componentTransitionDirection}
          >
            <TextSwitch
              text={logoText}
              visible={!textFadeStarted}
              delay={200}
              duration="slow"
              className="text-[18px] font-normal tracking-[2px] text-[#333] mb-6 text-center"
            />

            <div className={`flex flex-col flex-1 ${!modalState.isModalExpanded ? "justify-center" : ""}`}>
              {!modalState.isModalExpanded && (
                <>
                  <TextAnimate
                    visible={!textFadeStarted}
                    delay={600}
                    duration="slow"
                    className="text-[18px] font-normal text-[#333] leading-[1.3] mb-[2px] text-center"
                  >
                    {mahamayaContent.title}
                  </TextAnimate>
                  <TextAnimate
                    visible={!textFadeStarted}
                    delay={1000}
                    className="text-[11px] text-[#666] mt-[20px] tracking-[1px] text-center"
                  >
                    {mahamayaContent.subtitle}
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
                  <div className="flex-1 border border-gray-300 rounded-sm bg-white/50 p-6 flex flex-col">
                    <div className="mb-3">
                      <div className="text-xs font-mono text-gray-500 mb-1">{coordinate3_0Summary.coordinate}</div>
                      <h3 className="text-xs font-semibold text-gray-800 tracking-wide">
                        {coordinate3_0Summary.name.toUpperCase()}
                      </h3>
                    </div>
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      {coordinate3_0Summary.summary}
                    </p>
                  </div>

                  <div className="flex-1 border border-gray-300 rounded-sm bg-white/50 p-6 flex flex-col">
                    <div className="mb-3">
                      <div className="text-xs font-mono text-gray-500 mb-1">{coordinate3_5Summary.coordinate}</div>
                      <h3 className="text-xs font-semibold text-gray-800 tracking-wide">
                        {coordinate3_5Summary.name.toUpperCase()}
                      </h3>
                    </div>
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      {coordinate3_5Summary.summary}
                    </p>
                  </div>
                </div>
              )}
            </div>

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

                {modalState.isModalExpanded && (
                  <div className="mt-6 flex justify-center w-full">
                    <TextAnimate visible={!textFadeStarted} delay={2500} duration="normal">
                      <div className="translate-y-[3px]">
                        <HexagonButton onClick={openHexagonPanel} isOpen={panelMode === 'hexagon-panel'} />
                      </div>
                    </TextAnimate>
                  </div>
                )}
              </div>
            )}
          </Sidebar>

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
          >
            <ModalPanel
              ref={modalPanelRef}
              shouldBlur={textFadeStarted}
              showGridLines={gridLinesVisible}
            >
              <WaveBackground
                isVisible={wavesVisible}
                containerRef={modalPanelRef}
                modalExpanded={modalState.isModalExpanded}
                fadeState={wavesFadeState}
              />

              <GlowParticles
                isVisible={particlesVisible}
                particleCount={50}
                baseHue={200}
                monochrome={true}
                mode="default"
                saturation={90}
                lightness={70}
                radiusScale={0.6}
                parentRef={modalPanelRef}
                showDebug={false}
                fadeState={particlesFadeState}
              />

              {(modalState.isModalExpanded || carouselVisible) && (
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center z-50",
                    modalState.isModalExpanded && carouselVisible ? "carousel-fade-in-delayed" : "carousel-fade-out"
                  )}
                >
                  <FocusCards
                    cards={mahamayaModalCards}
                    className="w-full h-full"
                  />
              </div>
            )}

            <ParamasivaImage
              src="/ui-system/mahamaya-icon.png"
              alt="Mahamaya Glyph"
              isExpanded={modalState.isModalExpanded}
              onClick={handleImageClick}
            />

              {modalState.isModalExpanded && (
                <div className="absolute top-5 right-5 text-[10px] text-ui-medium tracking-wider opacity-60">
                  EXPANDED
                </div>
              )}
            </ModalPanel>
          </ContentPanel>

          <CoordinateText
            coordinate={coordinate}
            visible={textFadeStarted ? false : coordinateTextVisible}
            position="overlay"
            linkToPageCoordinate
          />
        </PortfolioContainer>
      </PageFadeIn>

      <HorizontalTracingBeam startPoint={0.3} endPoint={1.0} />

      <SubnodesSection
        cards={mahamayaSubnodeCards}
        title="Subnodes"
        description="The four functional layers that let Mahamaya translate between binary logic, biological code, tarot theatre, and mythic navigation."
        logoSrc="/ui-system/mahamaya-icon.png"
        logoAlt="Mahamaya Icon"
      />

      <WhiteFadeOverlay visible={whiteOverlayVisible} onAnimationComplete={() => {}} />
    </div>
  );
};

export default MahamayaPage;
