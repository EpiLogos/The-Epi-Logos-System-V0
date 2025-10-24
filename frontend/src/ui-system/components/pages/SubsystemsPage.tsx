'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { TextAnimate } from '../ui/TextAnimate';
import { PageFadeIn } from '../ui/PageFadeIn';
import { CoordinateTextWithModal } from '../ui/CoordinateTextWithModal';
import { useInterPageTransition } from '@/hooks/ui-system/useInterPageTransition';
import { HexagonButton } from '../navigation/HexagonButton';
import { useSidebar } from '@/contexts/SidebarContext';


// Use UI system asset paths - CORRECTED to use -icon.png files
const image0 = '/ui-system/anuttara-icon.png';
const image1 = '/ui-system/paramasiva-icon.png';
const image2 = '/ui-system/parashakti-icon.png';
const image3 = '/ui-system/mahamaya-icon.png';
const image4 = '/ui-system/nara-icon.png';
const image5 = '/ui-system/epii-icon.png';

interface SubsystemPanelProps {
  id: string;
  image: string;
  alt: string;
  scaled?: boolean;
  coordinateTextVisible: boolean;
  onClick?: () => void;
  shouldBlurImage?: boolean;
  heightMorphStarted?: boolean;
  widthMorphStarted?: boolean;
  disableModal?: boolean;
}

const SubsystemPanel: React.FC<SubsystemPanelProps> = ({ 
  id, 
  image, 
  alt, 
  scaled = false, 
  coordinateTextVisible,
  onClick,
  shouldBlurImage = false,
  disableModal = false
}) => {
  return (
    <div 
      className={cn(
        // PURE TAILWIND: Base panel styling with transition border colors
        "bg-[#090a09] relative flex items-center justify-center border-[1.222px] rounded-none overflow-hidden",
        // Border color transition: white → black during animation
        shouldBlurImage ? "border-[#090a09]" : "border-[#cacaca]",
        // Conditional border removal for seamless grid
        id === '1' && "border-l-0",
        id === '2' && "border-l-0", 
        id === '3' && "border-t-0",
        id === '4' && "border-t-0 border-l-0",
        id === '5' && "border-t-0 border-l-0"
      )}
      style={{
        // Smooth border color transition
        transition: 'border-color 450ms cubic-bezier(0.25, 0.1, 0.25, 1)'
      }}
    >
      <img
        src={image}
        alt={alt}
        onClick={onClick}
        className={cn(
          // Image styling - 100% Tailwind v4
          "max-w-[60%] max-h-[60%] object-contain transition-all duration-300",
          // Base scale for panels 3,4,5 - with hover that maintains the scale ratio
          scaled && !shouldBlurImage && "scale-[1.3] hover:scale-[1.365]",  // 1.3 * 1.05 = 1.365
          scaled && shouldBlurImage && "scale-[1.3]",
          // Base scale for panels 0,1,2 - with standard hover
          !scaled && !shouldBlurImage && "hover:scale-105",
          onClick && "cursor-pointer transition-transform duration-200",  // Clickable styling
          shouldBlurImage
            ? "opacity-10 blur-[12px] brightness-[0.3] transition-[opacity,filter] duration-[1800ms] delay-phase-2a ease-gentle"
            : "opacity-80 hover:opacity-100"
        )}
      />
      <CoordinateTextWithModal
        coordinate={`#${id}`}
        visible={coordinateTextVisible}
        position="panel"
        disableModal={disableModal}
      />
    </div>
  );
};


export const SubsystemsPage: React.FC<{ coordinate?: string }> = ({ coordinate = '#' }) => {
  const [coordinateTextVisible, setCoordinateTextVisible] = useState(false);
  const { openHexagonPanel, panelMode } = useSidebar();

  // Inter-page transition hook - simplified like original CSS class approach
  const {
    isTransitioning,
    currentTransitionDirection,
    textFadeStarted,
    heightMorphStarted,
    widthMorphStarted,
    whiteOverlayVisible,
    transitionToParamasiva,
    transitionToParashakti,
    transitionToMahamaya,
    transitionToNara,
    transitionToEpii,
    transitionToAnuttara,
    transitionToEpiLogosFromSubsystems
  } = useInterPageTransition();

  const handleBackToMain = () => {
    transitionToEpiLogosFromSubsystems();
  };

  // Coordinate text animation after 2200ms (matching original timing)
  useEffect(() => {
    const coordTimer = setTimeout(() => {
      setCoordinateTextVisible(true);
    }, 2200);

    return () => clearTimeout(coordTimer);
  }, []);

  const handleAnuttaraClick = () => {
    transitionToAnuttara();
  };

  const handleParamasivaClick = () => {
    transitionToParamasiva();
  };

  const handleParashaktiClick = () => {
    transitionToParashakti();
  };

  const handleMahamayaClick = () => {
    transitionToMahamaya();
  };

  const handleNaraClick = () => {
    transitionToNara();
  };

  const handleEpiiClick = () => {
    transitionToEpii();
  };

  const subsystemPanels: Array<{
    id: string;
    image: string;
    alt: string;
    scaled: boolean;
    onClick?: () => void;
  }> = [
    { id: '0', image: image0, alt: 'Anuttara Icon', scaled: false, onClick: handleAnuttaraClick },
    { id: '1', image: image1, alt: 'Paramasiva Icon', scaled: false, onClick: handleParamasivaClick },
    { id: '2', image: image2, alt: 'Parashakti Icon', scaled: false, onClick: handleParashaktiClick },
    { id: '3', image: image3, alt: 'Mahamaya Icon', scaled: true, onClick: handleMahamayaClick },
    { id: '4', image: image4, alt: 'Nara Icon', scaled: true, onClick: handleNaraClick },
    { id: '5', image: image5, alt: 'Epii Icon', scaled: true, onClick: handleEpiiClick },
  ];

  return (
    <div data-coordinate={coordinate}>
      {/* White overlay for inter-page transitions */}
      <div className={cn(
        "fixed -top-[5px] -left-[5px] w-[calc(100vw+10px)] h-[calc(100vh+10px)] bg-[#f5f5f5] z-[9999] transition-[opacity,transform] duration-[600ms] ease-paramasiva pointer-events-none",
        whiteOverlayVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-full"
      )} />
      
      <PageFadeIn>
        <div className={cn(
          "flex h-screen bg-[#f5f5f5]",
          // Only center for focus transitions (all subsystem transitions); keep normal flow for epi-logos
          isTransitioning &&
            (
              currentTransitionDirection === 'subsystems-to-paramasiva' ||
              currentTransitionDirection === 'paramasiva-to-subsystems' ||
              currentTransitionDirection === 'subsystems-to-parashakti' ||
              currentTransitionDirection === 'parashakti-to-subsystems' ||
              currentTransitionDirection === 'subsystems-to-mahamaya' ||
              currentTransitionDirection === 'mahamaya-to-subsystems' ||
              currentTransitionDirection === 'subsystems-to-nara' ||
              currentTransitionDirection === 'nara-to-subsystems' ||
              currentTransitionDirection === 'subsystems-to-epii' ||
              currentTransitionDirection === 'epii-to-subsystems' ||
              currentTransitionDirection === 'subsystems-to-anuttara' ||
              currentTransitionDirection === 'anuttara-to-subsystems'
            ) &&
            "justify-center items-center"
        )}>
      {/* Sidebar - PURE TAILWIND like ContentPanel */}
      <div 
        className={cn(
          "bg-[#f5f5f5] px-10 py-8 flex flex-col justify-between border-r border-[#e0e0e0] h-screen max-h-screen overflow-hidden flex-shrink-0",
          // Sidebar width per route
          currentTransitionDirection === 'subsystems-to-epilogos' && isTransitioning && "transition-subsys-epilogos-sidebar",
          currentTransitionDirection === 'subsystems-to-epilogos' && isTransitioning
            ? (heightMorphStarted ? "w-[420px]" : "w-[300px]")
            : (!isTransitioning
                ? "w-[300px]"
                : (
                    currentTransitionDirection === 'subsystems-to-paramasiva' ||
                    currentTransitionDirection === 'paramasiva-to-subsystems' ||
                    currentTransitionDirection === 'subsystems-to-parashakti' ||
                    currentTransitionDirection === 'parashakti-to-subsystems' ||
                    currentTransitionDirection === 'subsystems-to-mahamaya' ||
                    currentTransitionDirection === 'mahamaya-to-subsystems' ||
                    currentTransitionDirection === 'subsystems-to-nara' ||
                    currentTransitionDirection === 'nara-to-subsystems' ||
                    currentTransitionDirection === 'subsystems-to-epii' ||
                    currentTransitionDirection === 'epii-to-subsystems' ||
                    currentTransitionDirection === 'subsystems-to-anuttara' ||
                    currentTransitionDirection === 'anuttara-to-subsystems'
                  )
                ? "w-[calc(100vw-420px)]"
                : "w-[300px]"),
          // Restore smooth width animation for subsystems → subsystem transitions via utility
          (isTransitioning &&
            (
              currentTransitionDirection === 'subsystems-to-paramasiva' ||
              currentTransitionDirection === 'paramasiva-to-subsystems' ||
              currentTransitionDirection === 'subsystems-to-parashakti' ||
              currentTransitionDirection === 'parashakti-to-subsystems' ||
              currentTransitionDirection === 'subsystems-to-mahamaya' ||
              currentTransitionDirection === 'mahamaya-to-subsystems' ||
              currentTransitionDirection === 'subsystems-to-nara' ||
              currentTransitionDirection === 'nara-to-subsystems' ||
              currentTransitionDirection === 'subsystems-to-epii' ||
              currentTransitionDirection === 'epii-to-subsystems' ||
              currentTransitionDirection === 'subsystems-to-anuttara' ||
              currentTransitionDirection === 'anuttara-to-subsystems'
            ) &&
            'transition-subsys-paramasiva-sidebar')
        )}>
        {/* Logo */}
        <TextAnimate 
          visible={!textFadeStarted}
          delay={200}
          duration="slow"
          className="text-[18px] font-normal tracking-[2px] text-[#333] mb-10 text-center"
        >
          EPI : LOGOS
        </TextAnimate>

        {/* Title Section - EXACT original CSS values */}
        <div className="flex-1 flex flex-col justify-center">
          <TextAnimate 
            visible={!textFadeStarted}
            delay={600}
            duration="slow"
            className="text-[18px] font-normal text-[#333] leading-[1.3] mb-[2px] text-center"
          >
            SUBSYSTEMS
          </TextAnimate>
          <TextAnimate 
            visible={!textFadeStarted}
            delay={1000}
            className="text-[11px] text-[#666] mt-[20px] tracking-[1px] text-center"
          >
            QUATERNAL LOGIC
          </TextAnimate>
        </div>

        {/* Footer Links */}
        <div className="flex flex-col gap-[10px]">
          <div className="flex flex-col gap-[10px] items-start text-left">
            <TextAnimate
              visible={!textFadeStarted}
              delay={1300}
              duration="normal"
              className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]"
            >
              Subsystems
            </TextAnimate>
            <div onClick={handleBackToMain}>
              <TextAnimate
                visible={!textFadeStarted}
                delay={1600}
                duration="normal"
                className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]"
              >
                Epi:Logos
              </TextAnimate>
            </div>
            <TextAnimate
              visible={!textFadeStarted}
              delay={1900}
              duration="normal"
              className="text-[12px] text-[#333] cursor-pointer tracking-[1px] hover:text-[#666]"
            >
              Account
            </TextAnimate>
          </div>

          {/* Hexagon Button - Centered */}
          <div className="mt-6 flex justify-center w-full">
            <TextAnimate
              visible={!textFadeStarted}
              delay={2200}
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
      </div>

      {/* Grid Area - PURE TAILWIND like ContentPanel */}
      <div
        className={cn(
          'grid grid-cols-3 grid-rows-2 gap-0 bg-[#090a09]',
          // Apply margin/height transition only for epi-logos route
          currentTransitionDirection === 'subsystems-to-epilogos' && isTransitioning && 'transition-subsys-epilogos-grid',
          // For epi-logos route, keep flexible width so it follows sidebar smoothly (no hard cuts)
          currentTransitionDirection === 'subsystems-to-epilogos'
            ? [
                'flex-1 h-screen',
                // Collapse height from the beginning of the transition
                isTransitioning && 'state-grid-height-0',
                // Apply final margin at morph start
                heightMorphStarted && 'state-grid-margin-20',
              ]
            : (!isTransitioning
                ? 'w-[calc(100vw-300px)] h-screen'
                : [
                    // Width changes immediately when transitioning starts
                    'w-[420px]',
                    // Height only changes when heightMorphStarted is true (200ms delay)
                    heightMorphStarted ? 'h-[calc(73vh+20.75vh)]' : 'h-screen',
                    // Margins only apply when heightMorphStarted
                    heightMorphStarted && 'mt-5 mr-5 mb-0 ml-0'
                  ]),
          // Restore smooth grid transition for non-epi-logos transitions via utility
          (currentTransitionDirection !== 'subsystems-to-epilogos' && isTransitioning && 'transition-subsys-default-grid'),
          // Apply focus translate for Mahamaya transitions
          (isTransitioning &&
            (currentTransitionDirection === 'subsystems-to-mahamaya' || currentTransitionDirection === 'mahamaya-to-subsystems') &&
            'focus-mahamaya-translate'),
          // Apply focus translate for Parashakti transitions (panel 2)
          (isTransitioning &&
            (currentTransitionDirection === 'subsystems-to-parashakti' || currentTransitionDirection === 'parashakti-to-subsystems') &&
            'focus-parashakti-translate'),
          // Apply focus translate for Nara transitions (panel 4)
          (isTransitioning &&
            (currentTransitionDirection === 'subsystems-to-nara' || currentTransitionDirection === 'nara-to-subsystems') &&
            'focus-nara-translate'),
          // Apply focus translate for Epii transitions (panel 5)
          (isTransitioning &&
            (currentTransitionDirection === 'subsystems-to-epii' || currentTransitionDirection === 'epii-to-subsystems') &&
            'focus-epii-translate')
        )}
      >
        {subsystemPanels.map((panel) => (
          <SubsystemPanel
            key={panel.id}
            id={panel.id}
            image={panel.image}
            alt={panel.alt}
            scaled={panel.scaled}
            coordinateTextVisible={textFadeStarted ? false : coordinateTextVisible}
            onClick={panel.onClick}
            shouldBlurImage={textFadeStarted}
            heightMorphStarted={heightMorphStarted}
            widthMorphStarted={widthMorphStarted}
            disableModal={textFadeStarted}
          />
        ))}
      </div>
      </div>
    </PageFadeIn>
    </div>
  );
};

export default SubsystemsPage;
