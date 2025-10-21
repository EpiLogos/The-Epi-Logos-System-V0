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
  rotationPhase: number;
}> = [
  { id: 'pratibimba', label: 'Pratibimba', image: '/ui-system/zen-circle.png', innerImage: '/ui-system/account-icon.png', route: 'pratibimba', enabled: true, rotationPhase: 90 },
  { id: 'system', label: 'System', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 150 },
  { id: 'subsystems', label: 'Subsystems', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 210 },
  { id: 'coordinates', label: 'Coordinates', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 270 },
  { id: 'agents', label: 'Chat', image: '/ui-system/zen-circle.png', innerImage: '/ui-system/chat-icon.png', route: 'chat', enabled: true, rotationPhase: 330 },
  { id: 'settings', label: 'Settings', image: '/ui-system/zen-circle.png', route: null, enabled: false, rotationPhase: 30 },
];

// Simple hex layout using two rows with a horizontal offset on the second row
export const HexDashboardGridPerItem: React.FC<HexDashboardGridPerItemProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ size: number }>(() => ({ size: 560 }));

  // PERFORMANCE FIX: Remove ResizeObserver - container is CSS-controlled fixed size
  // Container: w-[min(92vw,700px)] aspect-square - no dynamic resizing needed
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const s = Math.max(360, Math.floor(Math.min(rect.width, rect.height)));
      setBox({ size: s });
    };
    // Measure once on mount only
    measure();
  }, []);

  const CIRCLE_SIZE = 157; // matches DashboardCircle default
  const margin = 8; // breathing room from edge
  const r = Math.max(120, Math.floor(box.size / 2 - CIRCLE_SIZE / 2 - margin));

  // 6 points around a circle (flat-top hexagon ring)
  const angles = useMemo(() => [0, 60, 120, 180, 240, 300].map((a) => (a * Math.PI) / 180), []);
  const center = box.size / 2;

  // Calculate hexagon vertices that pass through circle centers
  const hexagonPoints = useMemo(() => {
    return angles
      .map(angle => {
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
  }, [angles, center, r]);

  return (
    <div className="relative w-[min(92vw,700px)] aspect-square">
      {/* Background flower image - centered behind all content, NOT rotated */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-visible">
        <img
          src="/ui-system/Dashaboard flower.png"
          alt="Dashboard Background"
          className="opacity-40 object-contain absolute"
          style={{
            width: '200px',
            height: '200px',
            top: '50%',
            left: '50%',
            transform: 'translate(calc(-50% + 10px), calc(-50% - 10px))'
          }}
        />
      </div>

      {/* Connecting hexagon framework - links all circle centers */}
      <svg
        className="absolute inset-0 pointer-events-none z-[5] transition-opacity duration-300"
        style={{
          width: box.size,
          height: box.size,
          transform: 'translate(12px, -8.5px) rotate(30deg) scale(1)',
          transformOrigin: 'center'
        }}
      >
        <defs>
          <mask id="hexagon-mask">
            {/* White background allows everything through */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black circles block hexagon lines at each circle position */}
            {angles.map((angle, idx) => {
              const cx = center + r * Math.cos(angle);
              const cy = center + r * Math.sin(angle);
              return (
                <circle
                  key={idx}
                  cx={cx}
                  cy={cy}
                  r={CIRCLE_SIZE / 2 + 5}
                  fill="black"
                />
              );
            })}
          </mask>
        </defs>
        <polygon
          points={hexagonPoints}
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="2"
          mask="url(#hexagon-mask)"
          style={{
            filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.7))',
            opacity: 0.8
          }}
        />
      </svg>

      {/* Rotated container for hex grid */}
      <div ref={containerRef} className="absolute inset-0 -rotate-90 -translate-x-1">
        {/* Dashboard circles */}
        {items.map((it, idx) => {
          const theta = angles[idx];
          const cx = center + r * Math.cos(theta);
          const cy = center + r * Math.sin(theta);
          const left = cx - CIRCLE_SIZE / 2;
          const top = cy - CIRCLE_SIZE / 2;
          return (
            <div key={it.id} className="absolute z-10" style={{ left, top }}>
              <DashboardCircle {...it} onNavigate={onNavigate} size={CIRCLE_SIZE} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(HexDashboardGridPerItem);
