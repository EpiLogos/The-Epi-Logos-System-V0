/**
 * Living Placeholder Component
 * Polished placeholder experience for undeveloped coordinate pages
 * 
 * Features:
 * - Displays coordinate information from existing resolution system
 * - Design laboratory for visual experimentation
 * - Easy replacement when real features are ready
 * - Canvas/dynamic styling options
 */

'use client';

import React from 'react';
import { CoordinateResolution } from '@/lib/coordinateService';
import { DevModeControls } from '@/components/dev/DevModeModal';

export interface LivingPlaceholderProps {
  coordinate?: CoordinateResolution;
  displayMode?: 'placeholder';
  templateVariation?: 'canvas' | 'card' | 'dynamic';
  replacementReady?: boolean;
  stylingControls?: DevModeControls['stylingControls'];
  onReplacementRequest?: () => void;
  className?: string;
}

const SUBSYSTEM_THEMES = {
  0: { name: 'Anuttara', color: 'rgba(147, 51, 234, 0.8)', description: 'Absolute Ground & Proto-Logical Processing' },
  1: { name: 'Paramasiva', color: 'rgba(236, 72, 153, 0.8)', description: 'Foundational Architect of Quaternal Logic' },
  2: { name: 'Parashakti', color: 'rgba(34, 197, 94, 0.8)', description: 'Cosmic Imagination & Vibrational Matrix' },
  3: { name: 'Mahamaya', color: 'rgba(251, 191, 36, 0.8)', description: 'Universal Transcription Engine' },
  4: { name: 'Nara', color: 'rgba(239, 68, 68, 0.8)', description: 'Dialogical-Identity Processing' },
  5: { name: 'Epii', color: 'rgba(59, 130, 246, 0.8)', description: 'Synthesis & Orchestration Processing' },
} as const;

export const LivingPlaceholder: React.FC<LivingPlaceholderProps> = ({
  coordinate,
  displayMode = 'placeholder',
  templateVariation = 'canvas',
  replacementReady = false,
  stylingControls,
  onReplacementRequest,
  className = ''
}) => {
  if (!coordinate) {
    return (
      <div className={`living-placeholder living-placeholder--loading ${className}`}>
        <div className="placeholder-content">
          <div className="loading-animation">
            <div className="loading-hexagon"></div>
            <p>Resolving coordinate...</p>
          </div>
        </div>
      </div>
    );
  }

  const subsystemTheme = SUBSYSTEM_THEMES[coordinate?.subsystem as keyof typeof SUBSYSTEM_THEMES] || SUBSYSTEM_THEMES[0];
  
  const dynamicStyles = {
    '--theme-color': subsystemTheme.color,
    '--bg-color': stylingControls?.backgroundColor || '#1e293b',
    '--text-color': stylingControls?.textColor || '#f8fafc',
    '--border-color': stylingControls?.borderColor || '#475569',
    '--accent-color': stylingControls?.accentColor || '#3b82f6',
    '--border-radius': stylingControls?.borderRadius ? `${stylingControls.borderRadius}px` : '8px',
    '--border-width': stylingControls?.borderWidth ? `${stylingControls.borderWidth}px` : '1px',
    '--glow-intensity': stylingControls?.glowIntensity ? stylingControls.glowIntensity / 100 : 0.5,
    '--glow-color': stylingControls?.glowColor || '#3b82f6',
    '--shadow-intensity': stylingControls?.shadowIntensity ? stylingControls.shadowIntensity / 100 : 0.3,
    '--shadow-color': stylingControls?.shadowColor || '#000000',
    '--animation-speed': stylingControls?.animationSpeed ? stylingControls.animationSpeed / 100 : 1,
    '--opacity': stylingControls?.opacity ? stylingControls.opacity / 100 : 0.95,
    '--blur-intensity': stylingControls?.blurIntensity ? `${stylingControls.blurIntensity}px` : '10px',
    '--font-size': stylingControls?.fontSize ? `${stylingControls.fontSize}px` : '16px',
    '--font-weight': stylingControls?.fontWeight || 400,
    '--line-height': stylingControls?.lineHeight || 1.5,
    '--letter-spacing': stylingControls?.letterSpacing ? `${stylingControls.letterSpacing}px` : '0px',
    '--padding': stylingControls?.padding ? `${stylingControls.padding}px` : '16px',
    '--card-width': stylingControls?.cardWidth ? `${stylingControls.cardWidth}px` : '320px',
    '--card-height': stylingControls?.cardHeight ? `${stylingControls.cardHeight}px` : '240px',
    '--card-spacing': stylingControls?.cardSpacing ? `${stylingControls.cardSpacing}px` : '16px',
    '--card-columns': stylingControls?.cardColumns || 3,
  } as React.CSSProperties;

  return (
    <div 
      className={`living-placeholder living-placeholder--${templateVariation} ${className}`}
      style={dynamicStyles}
      data-testid="living-placeholder"
    >
      <div className="placeholder-background">
        <div className="background-pattern"></div>
        <div className="background-glow"></div>
      </div>

      <div className="placeholder-content">
        <header className="placeholder-header">
          <div className="coordinate-badge">
            <span className="coordinate-id">{coordinate?.coordinate || 'Unknown'}</span>
            <span className="subsystem-name">{subsystemTheme.name}</span>
          </div>
          
          <h1 className="coordinate-title">{coordinate?.name || 'Loading...'}</h1>
          <p className="coordinate-description">{subsystemTheme.description}</p>
        </header>

        <main className="placeholder-main">
          {templateVariation === 'canvas' && (
            <div className="canvas-content">
              <div className="canvas-area">
                <div className="coordinate-visualization">
                  <div className="center-node"></div>
                  <div className="connecting-lines">
                    <div className="line line-1"></div>
                    <div className="line line-2"></div>
                    <div className="line line-3"></div>
                  </div>
                </div>
                <p className="canvas-hint">Canvas-style dynamic interface coming soon...</p>
              </div>
            </div>
          )}

          {templateVariation === 'card' && (
            <div className="card-content">
              <div className="info-cards">
                <div className="info-card">
                  <h3>Subsystem</h3>
                  <p>#{coordinate.subsystem} - {subsystemTheme.name}</p>
                </div>
                <div className="info-card">
                  <h3>Status</h3>
                  <p>In Development</p>
                </div>
                <div className="info-card">
                  <h3>Resolution</h3>
                  <p>{coordinate.responseTime}ms</p>
                </div>
              </div>
            </div>
          )}

          {templateVariation === 'dynamic' && (
            <div className="dynamic-content">
              <div className="flowing-elements">
                <div className="flow-particle"></div>
                <div className="flow-particle"></div>
                <div className="flow-particle"></div>
              </div>
              <p className="dynamic-hint">Dynamic flow interface in development...</p>
            </div>
          )}
        </main>

        <footer className="placeholder-footer">
          <div className="development-info">
            <span className="status-indicator"></span>
            <span className="status-text">Feature in development</span>
          </div>
          
          {replacementReady && (
            <button 
              className="replacement-button"
              onClick={onReplacementRequest}
              data-testid="replacement-button"
            >
              Activate Feature
            </button>
          )}
        </footer>
      </div>

      <style jsx>{`
        .living-placeholder {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg-color);
          color: var(--text-color);
        }

        .coordinate-details {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--border-radius);
          border: 1px solid var(--border-color);
        }

        .coordinate-details p {
          color: var(--text-color-muted);
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0;
        }

        .living-placeholder--loading {
          justify-content: center;
          align-items: center;
        }

        .placeholder-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .background-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.02) 0%, transparent 50%);
          animation: patternFloat calc(20s * var(--animation-speed, 1)) infinite linear;
        }

        .background-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
          background: var(--theme-color, rgba(147, 51, 234, 0.8));
          border-radius: 50%;
          filter: blur(100px);
          opacity: calc(0.1 * var(--glow-intensity, 0.5));
          animation: glowPulse calc(6s * var(--animation-speed, 1)) ease-in-out infinite;
        }

        .placeholder-content {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }

        .loading-animation {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .loading-hexagon {
          width: 60px;
          height: 60px;
          background: var(--theme-color, rgba(147, 51, 234, 0.8));
          clip-path: polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%);
          animation: spin 2s linear infinite;
        }

        .placeholder-header {
          margin-bottom: 3rem;
        }

        .coordinate-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--border-radius, 8px);
          padding: 0.5rem 1rem;
          margin-bottom: 1.5rem;
        }

        .coordinate-id {
          color: white;
          font-family: 'Monaco', 'Menlo', monospace;
          font-weight: 600;
          font-size: 1rem;
        }

        .subsystem-name {
          color: var(--theme-color, rgba(147, 51, 234, 0.8));
          font-weight: 600;
          font-size: 0.875rem;
        }

        .coordinate-title {
          color: white;
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
          line-height: 1.2;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .coordinate-description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.125rem;
          margin: 0;
          max-width: 600px;
        }

        .placeholder-main {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 3rem;
          width: 100%;
        }

        /* Canvas Template Styles */
        .canvas-content {
          width: 100%;
          max-width: 400px;
        }

        .canvas-area {
          position: relative;
          background: rgba(255, 255, 255, 0.05);
          border: 2px dashed rgba(255, 255, 255, 0.3);
          border-radius: var(--border-radius, 8px);
          padding: 3rem;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .coordinate-visualization {
          position: relative;
          width: 120px;
          height: 120px;
          margin-bottom: 2rem;
        }

        .center-node {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: var(--theme-color, rgba(147, 51, 234, 0.8));
          border-radius: 50%;
          box-shadow: 0 0 20px var(--theme-color, rgba(147, 51, 234, 0.8));
          animation: nodePulse calc(2s * var(--animation-speed, 1)) ease-in-out infinite;
        }

        .connecting-lines {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .line {
          position: absolute;
          background: rgba(255, 255, 255, 0.3);
          height: 2px;
          width: 60px;
          top: 50%;
          left: 50%;
          transform-origin: left center;
          animation: lineGlow calc(3s * var(--animation-speed, 1)) ease-in-out infinite;
        }

        .line-1 { transform: translate(-50%, -50%) rotate(0deg); animation-delay: 0s; }
        .line-2 { transform: translate(-50%, -50%) rotate(120deg); animation-delay: 1s; }
        .line-3 { transform: translate(-50%, -50%) rotate(240deg); animation-delay: 2s; }

        .canvas-hint {
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
          margin: 0;
        }

        /* Card Template Styles */
        .card-content {
          width: 100%;
          max-width: 600px;
        }

        .info-cards {
          display: grid;
          grid-template-columns: repeat(var(--card-columns), 1fr);
          gap: var(--card-spacing);
        }

        .info-card {
          background: var(--bg-color);
          backdrop-filter: blur(var(--blur-intensity));
          border: var(--border-width) solid var(--border-color);
          border-radius: var(--border-radius);
          padding: var(--padding);
          width: var(--card-width);
          height: var(--card-height);
          text-align: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px var(--shadow-color);
        }

        .info-card:hover {
          background: var(--accent-color);
          transform: translateY(-4px);
          box-shadow: 0 8px 32px var(--shadow-color);
          border-color: var(--accent-color);
        }

        .info-card h3 {
          color: var(--theme-color, rgba(147, 51, 234, 0.8));
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .info-card p {
          color: white;
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
        }

        /* Dynamic Template Styles */
        .dynamic-content {
          position: relative;
          width: 100%;
          max-width: 400px;
          height: 300px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--border-radius, 8px);
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        .flowing-elements {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .flow-particle {
          position: absolute;
          width: 20px;
          height: 20px;
          background: var(--theme-color, rgba(147, 51, 234, 0.8));
          border-radius: 50%;
          animation: flowAnimation calc(8s * var(--animation-speed, 1)) linear infinite;
        }

        .flow-particle:nth-child(1) { animation-delay: 0s; top: 20%; }
        .flow-particle:nth-child(2) { animation-delay: 2s; top: 50%; }
        .flow-particle:nth-child(3) { animation-delay: 4s; top: 80%; }

        .dynamic-hint {
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
          margin: 0;
          z-index: 1;
          position: relative;
        }

        .placeholder-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          gap: 1rem;
        }

        .development-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          background: var(--theme-color, rgba(147, 51, 234, 0.8));
          border-radius: 50%;
          animation: statusBlink calc(2s * var(--animation-speed, 1)) ease-in-out infinite;
        }

        .status-text {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
        }

        .replacement-button {
          background: var(--theme-color, rgba(147, 51, 234, 0.8));
          border: none;
          border-radius: var(--border-radius, 8px);
          color: white;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .replacement-button:hover {
          background: var(--theme-color, rgba(147, 51, 234, 1));
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        /* Animations */
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes patternFloat {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(-20px, -20px) rotate(360deg); }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: calc(0.1 * var(--glow-intensity, 0.5)); transform: translate(-50%, -50%) scale(1); }
          50% { opacity: calc(0.2 * var(--glow-intensity, 0.5)); transform: translate(-50%, -50%) scale(1.1); }
        }

        @keyframes nodePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
        }

        @keyframes lineGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; box-shadow: 0 0 10px var(--theme-color, rgba(147, 51, 234, 0.8)); }
        }

        @keyframes flowAnimation {
          0% { left: -20px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }

        @keyframes statusBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .placeholder-content {
            padding: 1rem;
          }

          .coordinate-title {
            font-size: 2rem;
          }

          .placeholder-footer {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .info-cards {
            grid-template-columns: 1fr;
          }

          .canvas-area,
          .dynamic-content {
            min-height: 250px;
          }
        }
      `}</style>
    </div>
  );
};

export default LivingPlaceholder;