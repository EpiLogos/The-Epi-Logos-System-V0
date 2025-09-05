"use client";

import React, { useMemo, useRef, useState } from 'react';
import { GlowParticles } from '@/components/system/GlowParticles';

function hexToHue(hex: string): number {
  try {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    const d = max - min;
    if (d === 0) h = 0;
    else if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    return h;
  } catch {
    return 240;
  }
}

export default function TestParticlesPage() {
  // Dev controls (particles only)
  const [particleCount, setParticleCount] = useState(220);
  const [mist, setMist] = useState(true);
  const [monochrome, setMonochrome] = useState(true);
  const [particleColor, setParticleColor] = useState('#aab0b8');

  const containerRef = useRef<HTMLDivElement>(null);
  const baseHue = useMemo(() => (monochrome ? 0 : hexToHue(particleColor)), [particleColor, monochrome]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden">
      {/* Localized particle overlay */}
      <GlowParticles 
        isVisible={true}
        particleCount={particleCount}
        monochrome={monochrome}
        baseHue={baseHue}
        parentRef={containerRef as unknown as React.RefObject<HTMLElement>}
        mode={mist ? 'mist' : 'default'}
      />

      <div className="relative z-20 text-center space-y-4">
        <h1 className="text-white text-2xl">Testing Particles</h1>
        <p className="text-gray-300">Adjust the parameters from the dev panel.</p>
      </div>

      {/* Dev panel */}
      <div className="absolute top-4 right-4 z-30 bg-black/70 border border-gray-700 rounded-lg p-4 text-left text-sm text-white space-y-3 w-72">
        <div className="font-semibold">Dev Panel — Particles</div>
        <label className="flex items-center justify-between gap-2">
          <span>Particle Count</span>
          <input
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-20"
            type="number"
            min={20}
            max={2000}
            value={particleCount}
            onChange={(e) => setParticleCount(Math.max(1, Number(e.target.value) || 200))}
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>Mist Mode</span>
          <input type="checkbox" checked={mist} onChange={(e) => setMist(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>Monochrome</span>
          <input type="checkbox" checked={monochrome} onChange={(e) => setMonochrome(e.target.checked)} />
        </label>
        {!monochrome && (
          <label className="flex items-center justify-between gap-2">
            <span>Particle Color</span>
            <input type="color" value={particleColor} onChange={(e) => setParticleColor(e.target.value)} />
          </label>
        )}
      </div>
    </div>
  );
}

