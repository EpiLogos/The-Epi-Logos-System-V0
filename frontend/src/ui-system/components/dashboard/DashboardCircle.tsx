'use client';

import React from 'react';
import { cn } from '../../utils/cn';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';

interface DashboardCircleProps {
  id: string;
  label: string;
  image: string;
  route: EpiLogosBusinessState | null;
  enabled: boolean;
  rotationPhase: 0 | 60 | 120 | 180 | 240 | 300;
  onNavigate: (state: EpiLogosBusinessState) => void;
}

export const DashboardCircle: React.FC<DashboardCircleProps> = ({
  id,
  label,
  image,
  route,
  enabled,
  rotationPhase,
  onNavigate,
}) => {
  const handleClick = () => {
    if (enabled && route) {
      onNavigate(route);
    }
  };

  const phaseClass = `dashboard-circle-phase-${rotationPhase}` as const;

  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'dashboard-circle-container relative flex flex-col items-center justify-center w-36 h-36 mx-auto outline-none',
        enabled ? 'cursor-pointer' : 'cursor-default',
      )}
      onClick={handleClick}
      disabled={!enabled}
    >
      <div
        className={cn(
          'dashboard-circle-wrapper relative w-28 h-28 rounded-full overflow-hidden',
          'dashboard-circle-base',
          'dashboard-gentle-waves',
          enabled && 'dashboard-circle-hover',
          !enabled && 'dashboard-circle-disabled',
          phaseClass,
        )}
      >
        <img src={image} alt={`${label} Dashboard Circle`} className="w-full h-full object-contain" />
      </div>
      <span
        className={cn(
          'mt-3 text-sm font-mono tracking-wide',
          enabled ? 'text-ui-panel' : 'text-ui-coord-text',
        )}
      >
        {label}
      </span>
    </button>
  );
};

export default DashboardCircle;
