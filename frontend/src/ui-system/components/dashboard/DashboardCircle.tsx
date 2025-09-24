'use client';

import React from 'react';
import { cn } from '../../utils/cn';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';
import CircularGlassOverlay from './CircularGlassOverlay';

interface DashboardCircleProps {
  id: string;
  label: string;
  image: string;
  innerImage?: string;
  innerAboveGlass?: boolean;
  route: EpiLogosBusinessState | null;
  enabled: boolean;
  rotationPhase: 0 | 60 | 120 | 180 | 240 | 300;
  onNavigate: (state: EpiLogosBusinessState) => void;
}

export const DashboardCircle: React.FC<DashboardCircleProps> = ({
  id,
  label,
  image,
  innerImage,
  innerAboveGlass = false,
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
        'dashboard-circle-container relative isolate flex flex-col items-center justify-center w-36 min-h-36 mx-auto outline-none',
        enabled ? 'cursor-pointer' : 'cursor-default',
      )}
      onClick={handleClick}
      disabled={!enabled}
    >
      {/* Container for both rotating PNG and static glass overlay */}
      <div className="relative w-[157px] h-[157px]">
        {/* Rotating PNG container */}
        <div
          className={cn(
            'dashboard-circle-wrapper relative z-0 w-[157px] h-[157px] rounded-full overflow-hidden',
            'dashboard-circle-base',
            'dashboard-rotate',
            enabled && 'dashboard-badge-hover-link',
            enabled && 'dashboard-circle-hover',
            !enabled && 'dashboard-circle-disabled',
            phaseClass,
          )}
        >
          <img src={image} alt={`${label} Dashboard Circle`} className="w-full h-full object-contain dashboard-waves" />
        </div>

        {/* Non-rotating centered inner image layered above circle, below glass by default */}
        {!innerAboveGlass && innerImage ? (
          <img src={innerImage} alt={`${label} Inner`} className="dashboard-inner-badge" />
        ) : null}

        {/* Counter-rotating glass overlay - rotates opposite to PNG */}
        {/* Scale wrapper to grow glass on hover without interfering with its rotation transform */}
        <div className="absolute inset-0 z-10 pointer-events-none dashboard-glass-scale">
          <CircularGlassOverlay
            size={157} // 1.4x of 112px → ~157px
            backgroundOpacity={0.15}
            brightness={enabled ? 60 : 40}
            opacity={enabled ? 0.85 : 0.95}
            blur={8}
            saturation={enabled ? 1.2 : 0.8}
            enableRotation={true}
            rotationPhase={rotationPhase}
            className=""
          />
        </div>

        {/* Same inner image but layered above glass when requested */}
        {innerAboveGlass && innerImage ? (
          <img src={innerImage} alt={`${label} Inner`} className="dashboard-inner-badge z-20" />
        ) : null}
      </div>
      <span
        className={cn(
          'relative z-10 mt-3 text-sm font-mono tracking-wide',
          enabled
            ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]'
            : 'text-ui-coord-text',
        )}
      >
        {label}
      </span>
    </button>
  );
};

export default DashboardCircle;
