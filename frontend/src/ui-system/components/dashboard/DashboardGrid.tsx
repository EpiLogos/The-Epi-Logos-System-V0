'use client';

import React from 'react';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';
import { DashboardCircle } from './DashboardCircle';

interface DashboardGridProps {
  onNavigate: (state: EpiLogosBusinessState) => void;
}

const dashboardCircles: Array<{
  id: string;
  label: string;
  image: string;
  route: EpiLogosBusinessState | null;
  enabled: boolean;
  rotationPhase: 0 | 60 | 120 | 180 | 240 | 300;
}> = [
  { id: 'account', label: 'Account', image: '/ui-system/zen-circle.png', route: 'account-profile', enabled: true, rotationPhase: 0 },
  { id: 'system', label: 'System', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 60 },
  { id: 'subsystems', label: 'Subsystems', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 120 },
  { id: 'coordinates', label: 'Coordinates', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 180 },
  { id: 'agents', label: 'Chat', image: '/ui-system/zen-circle.png', route: 'chat', enabled: true, rotationPhase: 240 },
  { id: 'settings', label: 'Settings', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 300 },
];

export const DashboardGrid: React.FC<DashboardGridProps> = ({ onNavigate }) => {
  return (
    <div className="dashboard-grid flex items-center justify-center min-h-[400px] pt-12">
      <div className="grid grid-cols-3 grid-rows-2 gap-x-12 gap-y-24 w-full max-w-3xl">
        {dashboardCircles.map((circle) => (
          <DashboardCircle key={circle.id} {...circle} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
};

export default DashboardGrid;
