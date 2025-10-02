'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';
import { DashboardCircle } from './DashboardCircle';

interface DashboardGridProps {
  onNavigate: (state: EpiLogosBusinessState) => void;
}

const dashboardCircles: Array<{
  id: string;
  label: string;
  image: string;
  innerImage?: string;
  innerAboveGlass?: boolean;
  route: EpiLogosBusinessState | null;
  enabled: boolean;
  rotationPhase: 0 | 60 | 120 | 180 | 240 | 300;
}> = [
  {
    id: 'account',
    label: 'Account',
    image: '/ui-system/zen-circle.png',
    innerImage: '/ui-system/account-icon.png', // 1080x1080 PNG, scaled and centered
    innerAboveGlass: true,
    route: 'account-profile',
    enabled: true,
    rotationPhase: 0,
  },
  { id: 'system', label: 'System', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 60 },
  { id: 'subsystems', label: 'Subsystems', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 120 },
  { id: 'coordinates', label: 'Coordinates', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 180 },
  {
    id: 'agents',
    label: 'Chat',
    image: '/ui-system/zen-circle.png',
    innerImage: '/ui-system/chat-icon.png',
    innerAboveGlass: true,
    route: 'chat',
    enabled: true,
    rotationPhase: 240,
  },
  { id: 'settings', label: 'Settings', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 300 },
];

export const DashboardGrid: React.FC<DashboardGridProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setPaused(!entry.isIntersecting);
      },
      { root: null, threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const circles = useMemo(() => dashboardCircles, []);

  return (
    <div className="dashboard-grid flex items-center justify-center min-h-[400px] pt-12">
      <div
        ref={containerRef}
        className={[
          'grid grid-cols-3 grid-rows-2 gap-x-12 gap-y-24 w-full max-w-3xl',
          paused ? 'dashboard-animations-paused' : '',
          'content-visibility-auto',
        ].join(' ')}
      >
        {circles.map((circle) => (
          <DashboardCircle key={circle.id} {...circle} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(DashboardGrid);
