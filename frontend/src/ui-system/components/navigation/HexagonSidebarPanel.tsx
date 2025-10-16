import React from 'react';
import { cn } from '../../utils/cn';
import { SubsystemFeature } from '@/config/subsystemFeatures';
import { SubsystemQuickAccess } from './SubsystemQuickAccess';
import { FoundationalActions } from './FoundationalActions';
import { HexagonButton } from './HexagonButton';
import { SidebarToggle } from '../ui/SidebarToggle';

interface HexagonSidebarPanelProps {
  subsystems: SubsystemFeature[];
  onClose: () => void;
  onFeatureClick: (subsystemId: string, feature: 'left' | 'right') => void;
  onNotesClick: () => void;
  onChatClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isTransitioning?: boolean;
}

export const HexagonSidebarPanel: React.FC<HexagonSidebarPanelProps> = ({
  subsystems,
  onClose,
  onFeatureClick,
  onNotesClick,
  onChatClick,
  isCollapsed,
  onToggleCollapse,
  isTransitioning = false
}) => {
  return (
    <div
      className={cn(
        'bg-[#f5f5f5] flex flex-col justify-between h-screen max-h-screen relative border-r border-[#e0e0e0] flex-shrink-0',
        // Width and padding based on collapse state (reusing sidebar patterns)
        isCollapsed ? 'sidebar-collapsed' : 'w-[420px] px-10 py-8',
        // Collapse transition (reusing sidebar pattern)
        'sidebar-collapse-transition',
        // Fade animation
        isTransitioning ? 'animate-fade-out' : 'animate-fade-in'
      )}
    >
      {/* Sidebar Toggle */}
      <div className="absolute top-4 right-2 z-10">
        <SidebarToggle
          isCollapsed={isCollapsed}
          onToggle={onToggleCollapse}
        />
      </div>

      {/* Content area with fade - matching Sidebar.tsx pattern */}
      <div className={cn(
        'flex flex-col flex-1',
        isCollapsed ? 'sidebar-content-collapsed' : 'sidebar-content-expanded'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[18px] font-normal tracking-[2px] text-[#333]">
            QUICK ACCESS
          </h2>
        </div>

        {/* Content Area - Subsystem Grid (3x2 for active subsystems only) */}
        <div className="hexagon-panel-content flex-1 flex flex-col">
          <SubsystemQuickAccess
            subsystems={subsystems.filter(s => ['1', '4', '5'].includes(s.id))}
            onFeatureClick={onFeatureClick}
          />
        </div>

        {/* Footer Area - Action Buttons */}
        <div className="hexagon-panel-footer mt-6">
          <FoundationalActions
            onNotesClick={onNotesClick}
            onChatClick={onChatClick}
          />
        </div>
      </div>

      {/* Hexagon Button - OUTSIDE content fade wrapper, same simple positioning as grey hexagon */}
      <div className={cn(
        'flex justify-center pb-4',
        isCollapsed && 'hexagon-button-collapsed' // Only use utility when collapsed for center positioning
      )}>
        <div className="translate-y-[3px]">
          <HexagonButton
            onClick={onClose}
            isOpen={true}
          />
        </div>
      </div>
    </div>
  );
};
