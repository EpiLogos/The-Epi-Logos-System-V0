"use client";

import React, { useState } from 'react';
import { Squares } from '@/components/Squares';
import HexagonNavigation from '@/components/HexagonNavigation';

export default function TestSquaresPage() {
  // Dev controls (hex animation only)
  const [useHexGrid, setUseHexGrid] = useState(true);
  const [duration, setDuration] = useState(10);
  const [hexColor, setHexColor] = useState('#ffffff');
  const [minOpacity, setMinOpacity] = useState(0);
  const [continuousFade, setContinuousFade] = useState(true);
  const [jitterPx, setJitterPx] = useState(0);
  const [opacityJitter, setOpacityJitter] = useState(0);

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="relative z-20 text-center space-y-8">
        <h1 className="text-white text-2xl">Testing Squares Component</h1>
        
        {/* Test different sizes */}
        <div className="space-y-4">
          <div>
            <p className="text-white mb-2">Size 80:</p>
            {useHexGrid ? (
              <HexagonNavigation size={80} durationSec={duration} color={hexColor} minOpacity={minOpacity} continuousFade={continuousFade} jitterPx={jitterPx} opacityJitter={opacityJitter} backgroundGlow={{ enabled: false }} />
            ) : (
              <Squares size={80} />
            )}
          </div>

          <div>
            <p className="text-white mb-2">Size 160:</p>
            {useHexGrid ? (
              <HexagonNavigation size={160} durationSec={duration} color={hexColor} minOpacity={minOpacity} continuousFade={continuousFade} jitterPx={jitterPx} opacityJitter={opacityJitter} backgroundGlow={{ enabled: false }} />
            ) : (
              <Squares size={160} />
            )}
          </div>

          <div>
            <p className="text-white mb-2">Default size:</p>
            {useHexGrid ? (
              <HexagonNavigation durationSec={duration} color={hexColor} minOpacity={minOpacity} continuousFade={continuousFade} jitterPx={jitterPx} opacityJitter={opacityJitter} backgroundGlow={{ enabled: false }} />
            ) : (
              <Squares />
            )}
          </div>
        </div>
        
        {/* Simple CSS animation test */}
        <div className="mt-8">
          <p className="text-white mb-2">Simple CSS Test:</p>
          <div className="w-8 h-8 bg-blue-500 animate-spin mx-auto"></div>
        </div>
      </div>

      {/* Dev panel — Hex animation only */}
      <div className="absolute top-4 right-4 z-30 bg-black/70 border border-gray-700 rounded-lg p-4 text-left text-sm text-white space-y-3 w-72">
        <div className="font-semibold">Dev Panel — Hex</div>
        <label className="flex items-center justify-between gap-2">
          <span>Use HexGrid</span>
          <input type="checkbox" checked={useHexGrid} onChange={(e) => setUseHexGrid(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>Loop Duration (s)</span>
          <input
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-20"
            type="number"
            min={1}
            max={30}
            step={0.5}
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 10))}
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>Min Opacity</span>
          <input
            className="w-28"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={minOpacity}
            onChange={(e) => setMinOpacity(Number(e.target.value))}
          />
          <span className="tabular-nums w-10 text-right">{minOpacity.toFixed(2)}</span>
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>Continuous Fade</span>
          <input type="checkbox" checked={continuousFade} onChange={(e) => setContinuousFade(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>Path Jitter (px)</span>
          <input
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-20"
            type="number"
            min={0}
            max={20}
            value={jitterPx}
            onChange={(e) => setJitterPx(Math.max(0, Number(e.target.value) || 0))}
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>Opacity Jitter</span>
          <input
            className="w-28"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacityJitter}
            onChange={(e) => setOpacityJitter(Number(e.target.value))}
          />
          <span className="tabular-nums w-10 text-right">{opacityJitter.toFixed(2)}</span>
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>Hex Color</span>
          <input type="color" value={hexColor} onChange={(e) => setHexColor(e.target.value)} />
        </label>
      </div>
    </div>
  );
}
