"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';
import { DashboardCircle } from './DashboardCircle';

interface HexDashboardGridPerItemProps {
  onNavigate: (state: EpiLogosBusinessState) => void;
}

const items: Array<{
  id: string;
  label: string;
  image: string;
  innerImage?: string;
  route: EpiLogosBusinessState | null;
  enabled: boolean;
  rotationPhase: 0 | 60 | 120 | 180 | 240 | 300;
}> = [
  { id: 'account', label: 'Account', image: '/ui-system/zen-circle.png', innerImage: '/ui-system/account-icon.png', route: 'account-profile', enabled: true, rotationPhase: 0 },
  { id: 'system', label: 'System', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 60 },
  { id: 'subsystems', label: 'Subsystems', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 120 },
  { id: 'coordinates', label: 'Coordinates', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 180 },
  { id: 'agents', label: 'Chat', image: '/ui-system/zen-circle.png', innerImage: '/ui-system/chat-icon.png', route: 'chat', enabled: true, rotationPhase: 240 },
  { id: 'settings', label: 'Settings', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 300 },
];

// Simple hex layout using two rows with a horizontal offset on the second row
export const HexDashboardGridPerItem: React.FC<HexDashboardGridPerItemProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ size: number }>(() => ({ size: 560 }));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const s = Math.max(360, Math.floor(Math.min(rect.width, rect.height)));
      setBox({ size: s });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const CIRCLE_SIZE = 157; // matches DashboardCircle default
  const margin = 8; // breathing room from edge
  const r = Math.max(120, Math.floor(box.size / 2 - CIRCLE_SIZE / 2 - margin));

  // 6 points around a circle (flat-top hexagon ring)
  const angles = useMemo(() => [0, 60, 120, 180, 240, 300].map((a) => (a * Math.PI) / 180), []);
  const center = box.size / 2;

  return (
    <div ref={containerRef} className="relative w-[min(92vw,700px)] aspect-square">
      {items.map((it, idx) => {
        const theta = angles[idx];
        const cx = center + r * Math.cos(theta);
        const cy = center + r * Math.sin(theta);
        const left = cx - CIRCLE_SIZE / 2;
        const top = cy - CIRCLE_SIZE / 2;
        return (
          <div key={it.id} className="absolute" style={{ left, top }}>
            <DashboardCircle {...it} onNavigate={onNavigate} size={CIRCLE_SIZE} />
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(HexDashboardGridPerItem);
