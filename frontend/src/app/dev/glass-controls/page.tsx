'use client';

import React, { useState } from 'react';
import CircularGlassOverlay from '@/ui-system/components/dashboard/CircularGlassOverlay';

interface GlassParams {
  size: number;
  backgroundOpacity: number;
  brightness: number;
  opacity: number;
  blur: number;
  saturation: number;
  distortionScale: number;
  redOffset: number;
  greenOffset: number;
  blueOffset: number;
}

export default function GlassControlsTestPage() {
  const [params, setParams] = useState<GlassParams>({
    size: 112,
    backgroundOpacity: 0.15,
    brightness: 60,
    opacity: 0.85,
    blur: 8,
    saturation: 1.2,
    distortionScale: -180,
    redOffset: 0,
    greenOffset: 10,
    blueOffset: 20,
  });

  const updateParam = (key: keyof GlassParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setParams({
      size: 112,
      backgroundOpacity: 0.15,
      brightness: 60,
      opacity: 0.85,
      blur: 8,
      saturation: 1.2,
      distortionScale: -180,
      redOffset: 0,
      greenOffset: 10,
      blueOffset: 20,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-12">
                Glass Effect Controls
              </h1>
              <p className="text-gray-400">
                Real-time parameter adjustment for CircularGlassOverlay
              </p>
            </div>
            <a 
              href="/" 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors border border-blue-600/30"
            >
              <span>← Back to Main App</span>
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview Area */}
          <div className="bg-gray-900/30 border border-gray-700 rounded-xl p-8">
            <h2 className="text-xl font-semibold text-center mb-8 text-blue-11">
              Glass Effect Preview - Counter-Rotating
            </h2>
            
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="relative">
                {/* Rotating Background PNG simulation */}
                <div
                  className="rounded-full bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/50 dashboard-rotate"
                  style={{ width: params.size, height: params.size }}
                >
                  <img
                    src="/ui-system/zen-circle.png"
                    alt="Test Circle"
                    className="w-full h-full object-contain dashboard-waves"
                  />
                </div>
                
                {/* Glass Overlay with Counter-Rotation */}
                <CircularGlassOverlay
                  size={params.size}
                  backgroundOpacity={params.backgroundOpacity}
                  brightness={params.brightness}
                  opacity={params.opacity}
                  blur={params.blur}
                  saturation={params.saturation}
                  distortionScale={params.distortionScale}
                  redOffset={params.redOffset}
                  greenOffset={params.greenOffset}
                  blueOffset={params.blueOffset}
                  enableRotation={true}
                  rotationPhase={0}
                  className="z-10"
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-blue-11">Parameters</h2>
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors border border-blue-600/30 text-sm"
              >
                Reset to Defaults
              </button>
            </div>

            <div className="space-y-4">
              {/* Size */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Size: {params.size}px
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={params.size}
                  onChange={(e) => updateParam('size', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Background Opacity */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Background Opacity: {params.backgroundOpacity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={params.backgroundOpacity}
                  onChange={(e) => updateParam('backgroundOpacity', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Brightness */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Brightness: {params.brightness}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.brightness}
                  onChange={(e) => updateParam('brightness', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Opacity */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Opacity: {params.opacity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={params.opacity}
                  onChange={(e) => updateParam('opacity', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Blur */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Blur: {params.blur}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={params.blur}
                  onChange={(e) => updateParam('blur', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Saturation */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Saturation: {params.saturation.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={params.saturation}
                  onChange={(e) => updateParam('saturation', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Advanced Controls */}
            <details className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <summary className="text-sm font-medium text-gray-300 cursor-pointer">
                Advanced Distortion Controls
              </summary>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Distortion Scale: {params.distortionScale}
                  </label>
                  <input
                    type="range"
                    min="-300"
                    max="300"
                    value={params.distortionScale}
                    onChange={(e) => updateParam('distortionScale', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Red Offset: {params.redOffset}
                  </label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={params.redOffset}
                    onChange={(e) => updateParam('redOffset', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Green Offset: {params.greenOffset}
                  </label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={params.greenOffset}
                    onChange={(e) => updateParam('greenOffset', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Blue Offset: {params.blueOffset}
                  </label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={params.blueOffset}
                    onChange={(e) => updateParam('blueOffset', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </details>

            {/* Export Config */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Current Configuration</h3>
              <pre className="text-xs text-gray-400 overflow-x-auto bg-black/50 p-3 rounded">
{JSON.stringify(params, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
