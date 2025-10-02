"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';
import { DashboardCircle } from './DashboardCircle';
import CircularGlassOverlay from './CircularGlassOverlay';

interface HexDashboardGridProps {
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

// Compute flat-top hex ring centers at radius r
function hexRingCenters(r: number) {
  const dx = r;
  const dy = r * Math.sqrt(3) / 2;
  return [
    { x: dx, y: 0 },
    { x: dx * 0.5, y: dy },
    { x: -dx * 0.5, y: dy },
    { x: -dx, y: 0 },
    { x: -dx * 0.5, y: -dy },
    { x: dx * 0.5, y: -dy },
  ];
}

export const HexDashboardGrid: React.FC<HexDashboardGridProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [overlaySize, setOverlaySize] = useState<number>(600); // safe fallback to avoid initial disappearance
  const [circleSize, setCircleSize] = useState<number>(180);
  const hoverScale = 1.10; // matches dashboard-circle-hover
  const gap = 32; // subtle spacing
  const labelMargin = 56; // generous label allowance under circles to avoid clipping
  const topBottomMargin = 20; // required margin from panel top/bottom
  const sideMargin = 20; // required margin from panel sides
  const CENTER_TOP_PERCENT = 0.6; // place visual center ~60% down the panel
  const SCALE_MULT = 1.3; // requested ~1.3x scale boost
  const [r, setR] = useState<number>(240);
  const centers = useMemo(() => hexRingCenters(r), [r]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver((entries) => setPaused(!entries[0].isIntersecting), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const updateGeometry = useCallback(() => {
    const host = containerRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    let W = rect.width;
    let H = rect.height;
    if (!W || !H) {
      // Fallback to offset sizes if getBoundingClientRect is 0 early in lifecycle
      W = host.offsetWidth || 600;
      H = host.offsetHeight || 600;
    }
    // Compute allowable overlay radius around the chosen visual center (55% height)
    const centerY = H * CENTER_TOP_PERCENT;
    const verticalRadius = Math.floor(Math.min(centerY - topBottomMargin, H - topBottomMargin - centerY));
    const horizontalRadius = Math.floor(W / 2 - sideMargin);
    let overlayRadius = Math.max(160, Math.min(horizontalRadius, verticalRadius));
    let overlaySize = overlayRadius * 2;

    // Circle size scales with overlay; apply requested scale factor
    const baseCircle = Math.floor(overlaySize * 0.23);
    let newCircle = Math.max(150, Math.min(260, Math.floor(baseCircle * SCALE_MULT)));
    let circleRadiusWithHover = (newCircle * hoverScale) / 2;

    // Ring radius: ensure circles + labels stay inside overlay
    const spacingPad = 24; // subtle looseness
    const MIN_R = 140;
    let newR = overlayRadius - circleRadiusWithHover - labelMargin - spacingPad;
    if (newR < MIN_R) {
      const allowableCircleRadius = overlayRadius - labelMargin - spacingPad - MIN_R;
      const allowableCircle = Math.floor((allowableCircleRadius * 2) / hoverScale);
      newCircle = Math.max(150, Math.min(newCircle, allowableCircle));
      circleRadiusWithHover = (newCircle * hoverScale) / 2;
      newR = Math.max(MIN_R, overlayRadius - circleRadiusWithHover - labelMargin - spacingPad);
    }

    setOverlaySize(overlaySize);
    setCircleSize(newCircle);
    setR(newR);
  }, [hoverScale, labelMargin, sideMargin, topBottomMargin]);

  useEffect(() => {
    updateGeometry();
    const host = containerRef.current;
    if (!host || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => updateGeometry());
    ro.observe(host);
    return () => ro.disconnect();
  }, [updateGeometry]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Cluster wrapper sized to fit hex ring */}
      <div
        ref={wrapperRef}
        className={[
          'absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2',
          'content-visibility-auto',
          paused ? 'dashboard-animations-paused' : '',
        ].join(' ')}
        style={{ width: overlaySize || 0, height: overlaySize || 0 }}
      >
        {/* Single glass overlay centered over cluster */}
        <div
          ref={overlayRef}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] dashboard-glass-compositor"
          style={{ width: overlaySize, height: overlaySize }}
        >
          <CircularGlassOverlay
            size={overlaySize}
            backgroundOpacity={0.10}
            brightness={60}
            opacity={0.92}
            blur={12}
            saturation={1.0}
            enableRotation={true}
            rotationPhase={0}
          />
        </div>

        {/* Six circles positioned at hex ring centers */}
        {items.map((item, idx) => {
          const c = centers[idx];
          const left = (overlaySize / 2) + c.x - circleSize / 2;
          const top = (overlaySize / 2) + c.y - circleSize / 2;
          return (
            <div key={item.id} className="absolute overflow-visible" style={{ left, top }}>
              <DashboardCircle
                {...item}
                innerAboveGlass={true}
                showGlassOverlay={false}
                size={circleSize}
                onNavigate={onNavigate}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(HexDashboardGrid);
