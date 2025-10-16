import React from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { Sidebar } from './Sidebar';
import { HexagonSidebarPanel } from '../navigation/HexagonSidebarPanel';
import { HexagonButton } from '../navigation/HexagonButton';
import { subsystemFeatures } from '@/config/subsystemFeatures';
import { useHexagonPanelKeyboard } from '@/hooks/useHexagonPanelKeyboard';

interface SidebarWithHexagonProps {
  children: React.ReactNode;
  variant: 'subsystems' | 'paramasiva' | 'epi-logos' | 'main';
  isModalExpanded?: boolean;
  isTransitioning?: boolean;
  transitionDirection?: 'to-subsystems' | 'to-quaternal' | 'idle';
  animationPhase?: string;
  className?: string;
}

export const SidebarWithHexagon: React.FC<SidebarWithHexagonProps> = (props) => {
  const { panelMode, openHexagonPanel, closeHexagonPanel } = useSidebar();

  // Enable keyboard shortcuts for hexagon panel
  useHexagonPanelKeyboard();

  // Handle feature clicks (stubbed for now)
  const handleFeatureClick = (subsystemId: string, feature: 'left' | 'right') => {
    console.log(`Navigate to subsystem ${subsystemId}, feature: ${feature}`);
    // TODO: Implement routing to feature modals/pages
  };

  // Handle action button clicks (stubbed for now)
  const handleNotesClick = () => {
    console.log('Open notes modal');
    // TODO: Implement notes modal
  };

  const handleChatClick = () => {
    console.log('Open AI chat modal');
    // TODO: Implement AI chat modal
  };

  // If in hexagon-panel mode, show hexagon panel
  if (panelMode === 'hexagon-panel') {
    return (
      <HexagonSidebarPanel
        subsystems={subsystemFeatures}
        onClose={closeHexagonPanel}
        onFeatureClick={handleFeatureClick}
        onNotesClick={handleNotesClick}
        onChatClick={handleChatClick}
      />
    );
  }

  // Otherwise show normal sidebar with hexagon button in footer
  return (
    <Sidebar {...props}>
      {/* Original sidebar content */}
      {props.children}

      {/* Add hexagon button to footer (only on normal pages, not during transitions) */}
      {!props.isTransitioning && (
        <div className="mt-4 flex justify-center">
          <HexagonButton
            onClick={openHexagonPanel}
            isOpen={false}
          />
        </div>
      )}
    </Sidebar>
  );
};
