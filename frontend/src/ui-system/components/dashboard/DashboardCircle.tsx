'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '../../utils/cn';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';
import CircularGlassOverlay from './CircularGlassOverlay';

interface DashboardCircleProps {
  id: string;
  label: string;
  image: string;
  innerImage?: string;
  innerAboveGlass?: boolean;
  showGlassOverlay?: boolean;
  size?: number; // outer circle size in px
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
  showGlassOverlay = true,
  size = 157,
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
        'dashboard-circle-container group relative isolate flex flex-col items-center justify-center w-36 min-h-36 mx-auto outline-none rotate-90',
        enabled ? 'cursor-pointer' : 'cursor-default',
      )}
      onClick={handleClick}
      disabled={!enabled}
    >
      {/* Container for both rotating PNG and static glass overlay */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Rotating PNG container */}
        <div
          className={cn(
            'dashboard-circle-wrapper relative z-0 rounded-full overflow-hidden',
            'dashboard-compositor',
            'dashboard-circle-base',
            'dashboard-rotate',
            enabled && 'dashboard-badge-hover-link',
            enabled && 'dashboard-circle-hover',
            !enabled && 'dashboard-circle-disabled',
            phaseClass,
          )}
          style={{ width: size, height: size }}
        >
          <Image
            src={image}
            alt={`${label} Dashboard Circle`}
            fill
            sizes={`${size}px`}
            className="object-contain dashboard-waves"
            priority={false}
          />
        </div>

        {/* Non-rotating centered inner image layered above circle, below glass by default */}
        {!innerAboveGlass && innerImage ? (
          <div className="dashboard-inner-badge z-[15]">
            <Image
              src={innerImage}
              alt={`${label} Inner`}
              fill
              sizes={`${Math.round(size * 0.56)}px`}
              className="object-contain"
              priority={false}
            />
          </div>
        ) : null}

        {/* Counter-rotating glass overlay - rotates opposite to PNG */}
        {/* Scale wrapper to grow glass on hover without interfering with its rotation transform */}
        {showGlassOverlay && (
          <div className="absolute inset-0 z-10 pointer-events-none dashboard-glass-scale">
            <CircularGlassOverlay
              size={size}
              backgroundOpacity={0.18}
              brightness={enabled ? 70 : 85}
              opacity={enabled ? 0.6 : 0.7}
              blur={12}
              saturation={enabled ? 1.22 : 0.87}
              enableRotation={true}
              rotationPhase={rotationPhase}
              className="dashboard-glass-compositor"
            />
          </div>
        )}

        {/* White border ring - frames the circle */}
        <div
          className={cn(
            'dashboard-border-ring',
            !enabled && 'opacity-40'
          )}
        />

        {/* Same inner image but layered above glass when requested */}
        {innerAboveGlass && innerImage ? (
          <div className="dashboard-inner-badge z-20">
            <Image
              src={innerImage}
              alt={`${label} Inner`}
              fill
              sizes="88px"
              className="object-contain"
              priority={false}
            />
          </div>
        ) : null}
      </div>
      <span
        className={cn(
          'relative z-20 mt-3 text-sm font-mono tracking-wide transition-opacity duration-200',
          // PERFORMANCE: Hide labels by default, show only on hover
          'opacity-0 group-hover:opacity-100',
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

export default React.memo(DashboardCircle);
