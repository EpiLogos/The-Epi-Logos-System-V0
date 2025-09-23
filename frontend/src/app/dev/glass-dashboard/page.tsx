'use client';

import React, { useState } from 'react';
import { DashboardGrid } from '@/ui-system/components/dashboard/DashboardGrid';
import { DashboardModalContent } from '@/ui-system/components/dashboard/DashboardModalContent';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';

export default function GlassDashboardTestPage() {
  const [selectedState, setSelectedState] = useState<EpiLogosBusinessState | null>(null);
  const [showSplashTest, setShowSplashTest] = useState(false);

  const handleNavigate = (state: EpiLogosBusinessState) => {
    setSelectedState(state);
    console.log('Navigation triggered:', state);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-12">
                Glass Effect Dashboard Test
              </h1>
              <p className="text-gray-400">
                Testing CircularGlassOverlay integration and Dashboard Splash Cursor
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

      {/* Dashboard Test Area */}
      <div className="container mx-auto px-4 py-8">
        {/* Test Mode Toggle */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setShowSplashTest(false)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !showSplashTest
                ? 'bg-blue-600/30 border border-blue-600/50 text-blue-300'
                : 'bg-gray-700/30 border border-gray-600/50 text-gray-400 hover:bg-gray-600/30'
            }`}
          >
            Glass Overlay Test
          </button>
          <button
            onClick={() => setShowSplashTest(true)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showSplashTest
                ? 'bg-blue-600/30 border border-blue-600/50 text-blue-300'
                : 'bg-gray-700/30 border border-gray-600/50 text-gray-400 hover:bg-gray-600/30'
            }`}
          >
            Splash Cursor Test
          </button>
        </div>

        {/* Status Display */}
        {selectedState && (
          <div className="mb-8 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
            <h2 className="text-lg font-semibold text-green-400 mb-2">Navigation Event</h2>
            <p className="text-gray-300">Selected state: <code className="text-blue-400">{selectedState}</code></p>
          </div>
        )}

        {/* Test Content */}
        {!showSplashTest ? (
          /* Dashboard Grid with Glass Effects */
          <div className="bg-gray-900/30 border border-gray-700 rounded-xl p-8">
            <h2 className="text-xl font-semibold text-center mb-8 text-blue-11">
              Dashboard Circles with Glass Overlay
            </h2>

            <DashboardGrid onNavigate={handleNavigate} />

            <div className="mt-8 text-center text-gray-400 text-sm">
              <p>• Glass overlay is embedded within each PNG circle</p>
              <p>• Click and hover interactions are preserved</p>
              <p>• Perfect circular shape maintained</p>
              <p>• Enabled circles have brighter glass effect</p>
              <p>• Disabled circles have dimmer glass effect</p>
            </div>
          </div>
        ) : (
          /* Dashboard Modal with Splash Cursor */
          <div className="bg-gray-900/30 border border-gray-700 rounded-xl p-8 min-h-[600px]">
            <h2 className="text-xl font-semibold text-center mb-8 text-blue-11">
              Dashboard Modal with Subtle Splash Cursor Effect
            </h2>

            <div className="bg-black/50 border border-gray-600 rounded-lg overflow-hidden" style={{ height: '500px' }}>
              <DashboardModalContent onStateChange={handleNavigate} />
            </div>

            <div className="mt-8 text-center text-gray-400 text-sm">
              <p>• Move your mouse around to see the subtle monochrome fluid effect</p>
              <p>• Effect is restricted to dashboard modal only</p>
              <p>• Reduced opacity and force for subtlety</p>
              <p>• Monochrome grayscale palette only</p>
              <p>• WebGL-based fluid simulation with reduced parameters</p>
            </div>
          </div>
        )}

        {/* Technical Details */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {!showSplashTest ? (
            <>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-11 mb-4">Glass Effect Features</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• <strong>Circular Shape:</strong> Perfect circle using borderRadius: '50%'</li>
                  <li>• <strong>Non-blocking:</strong> pointer-events-none on overlay</li>
                  <li>• <strong>Responsive:</strong> Adapts to PNG size (112px)</li>
                  <li>• <strong>Dark Mode:</strong> Automatic theme detection</li>
                  <li>• <strong>Browser Fallbacks:</strong> SVG filters → backdrop-filter → basic styles</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-11 mb-4">Integration Details</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• <strong>Position:</strong> Absolute overlay within wrapper</li>
                  <li>• <strong>Z-index:</strong> Above PNG but below interactions</li>
                  <li>• <strong>State-aware:</strong> Different opacity for enabled/disabled</li>
                  <li>• <strong>Performance:</strong> ResizeObserver for dynamic updates</li>
                  <li>• <strong>Accessibility:</strong> No interference with screen readers</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-11 mb-4">Splash Cursor Features</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• <strong>WebGL Fluid:</strong> Real-time fluid simulation using WebGL shaders</li>
                  <li>• <strong>Monochrome:</strong> Grayscale palette (0.05-0.15 intensity range)</li>
                  <li>• <strong>Subtle Effect:</strong> Reduced force (2000 vs 6000) and opacity (30%)</li>
                  <li>• <strong>Dashboard Only:</strong> Restricted to dashboard modal state</li>
                  <li>• <strong>Performance:</strong> Optimized resolution and dissipation settings</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-11 mb-4">Technical Implementation</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• <strong>Position:</strong> Absolute overlay with z-index 0</li>
                  <li>• <strong>Blend Mode:</strong> Screen blend mode for subtle integration</li>
                  <li>• <strong>Mouse Tracking:</strong> Real-time cursor position tracking</li>
                  <li>• <strong>Non-blocking:</strong> pointer-events-none preserves interactions</li>
                  <li>• <strong>Clean Integration:</strong> Only active in dashboard modal</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Component Code Preview */}
        <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-11 mb-4">Implementation</h3>
          <pre className="text-xs text-gray-300 overflow-x-auto">
{!showSplashTest ? `<CircularGlassOverlay
  size={112} // w-28 h-28 = 112px
  backgroundOpacity={0.15}
  brightness={enabled ? 60 : 40}
  opacity={enabled ? 0.85 : 0.95}
  blur={8}
  saturation={enabled ? 1.2 : 0.8}
  className="z-10"
/>` : `<DashboardModalContent onStateChange={onStateChange}>
  {/* Subtle Splash Cursor Effect - Only for Dashboard Modal */}
  <DashboardSplashCursor
    SIM_RESOLUTION={64}
    DYE_RESOLUTION={512}
    SPLAT_FORCE={2000}
    DENSITY_DISSIPATION={2.0}
    VELOCITY_DISSIPATION={1.5}
    SHADING={false}
  />

  {/* Dashboard content with relative z-10 positioning */}
  <div className="relative z-10">
    <DashboardGrid onNavigate={onNavigate} />
  </div>
</DashboardModalContent>`}
          </pre>
        </div>
      </div>
    </div>
  );
}
