/**
 * Placeholder Page Template
 * Base template for all placeholder pages with navbar, coordinate display, and dev mode
 * 
 * Features:
 * - Integrates navbar with coordinate display component
 * - Includes development mode modal for live experimentation
 * - Supports easy replacement when real features are ready
 * - Uses existing navigation patterns
 */

'use client';

import React, { useState } from 'react';
// import { HexagonNavigation } from '@/components/navigation/hexagon-navigation'; // DEPRECATED - Replaced by EpiiNavigation
import { CoordinateDisplay } from '@/components/coordinate/CoordinateDisplay';
import { useCoordinateDisplay } from '@/components/coordinate/useCoordinateDisplay';
import { LivingPlaceholder } from '@/components/placeholder/LivingPlaceholder';
import { DevModeModal, DevModeControls } from '@/components/dev/DevModeModal';

export interface PlaceholderPageTemplateProps {
  coordinate: string;
  enableDevMode?: boolean;
  onFeatureReady?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const PlaceholderPageTemplate: React.FC<PlaceholderPageTemplateProps> = ({
  coordinate,
  enableDevMode = process.env.NODE_ENV === 'development',
  onFeatureReady,
  className = '',
  children
}) => {
  // Development mode state
  const [isDevModeOpen, setIsDevModeOpen] = useState(false);
  const [currentCoordinate, setCurrentCoordinate] = useState(coordinate);
  
  // Coordinate resolution - CRITICAL: This MUST use REAL GraphQL resolution
  const { coordinateData, isLoading, error, resolveCurrentCoordinate } = useCoordinateDisplay({
    coordinate: currentCoordinate,
    autoResolve: true,
    enableCaching: true
  });
  const [devControls, setDevControls] = useState<DevModeControls>({
    coordinateSelector: currentCoordinate,
    templateVariation: 'canvas',
    stylingControls: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 8,
      glowIntensity: 50,
      animationSpeed: 100,
    },
    previewMode: 'dev'
  });

  // Handle coordinate changes from dev mode
  const handleCoordinateChange = async (newCoordinate: string) => {
    setCurrentCoordinate(newCoordinate);
    // resolveCurrentCoordinate will be called automatically via useCoordinateDisplay dependency
  };

  // Handle dev mode controls changes
  const handleDevControlsChange = (controls: DevModeControls) => {
    setDevControls(controls);
  };

  // Handle settings export
  const handleExportSettings = (settings: DevModeControls) => {
    console.log('Exported Dev Settings:', settings);
    // Could save to localStorage or send to backend for persistence
    localStorage.setItem('epi-logos-dev-settings', JSON.stringify(settings));
  };

  // Toggle dev mode with keyboard shortcut
  React.useEffect(() => {
    if (!enableDevMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D to toggle dev mode
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setIsDevModeOpen(!isDevModeOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableDevMode, isDevModeOpen]);

  // Debug logging
  React.useEffect(() => {
    console.log('PlaceholderPageTemplate state:', {
      enableDevMode,
      isDevModeOpen,
      currentCoordinate,
      coordinateData: coordinateData ? 'loaded' : 'null',
      isLoading,
      error
    });
  }, [enableDevMode, isDevModeOpen, currentCoordinate, coordinateData, isLoading, error]);

  // Broadcast coordinate data to global navbar
  React.useEffect(() => {
    if (coordinateData) {
      // Store on window for immediate access
      (window as any).__CURRENT_COORDINATE_DATA__ = coordinateData;
      
      // Dispatch event for listeners
      const event = new CustomEvent('coordinate-updated', { detail: coordinateData });
      window.dispatchEvent(event);
    }
  }, [coordinateData]);

  const showDevMode = enableDevMode && devControls.previewMode === 'dev';

  return (
    <div className={`placeholder-page-template ${className}`} data-testid="placeholder-page-template">
      {/* Page Header */}
      <header className="page-header">
        <nav className="main-navigation">
          {/* Coordinate now shown in global navbar */}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="page-main">
        {/* Development Mode Toggle */}
        {enableDevMode && (
          <div 
            className="fixed top-[90px] right-4 z-[1000]"
            style={{ position: 'fixed', top: '90px', right: '1rem', zIndex: 1000 }}
          >
            <button
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white/80 cursor-pointer transition-all duration-200 backdrop-blur-[10px] flex items-center justify-center p-0 hover:bg-white/20 hover:text-white hover:-translate-y-px hover:scale-105"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
              onClick={() => setIsDevModeOpen(!isDevModeOpen)}
              data-testid="dev-mode-toggle"
              title="Toggle Development Mode (Ctrl/Cmd + Shift + D)"
              aria-label="Toggle Development Mode"
            >
              <span style={{ fontSize: '16px', display: 'block' }}>⚙</span>
            </button>
          </div>
        )}
        {children || (
          <LivingPlaceholder
            coordinate={coordinateData}
            displayMode="placeholder"
            templateVariation={devControls.templateVariation}
            stylingControls={devControls.stylingControls}
            replacementReady={false}
            onReplacementRequest={onFeatureReady}
            className="main-placeholder"
          />
        )}

        {/* Loading/Error States */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner">Loading coordinate data...</div>
          </div>
        )}

        {error && (
          <div className="error-overlay">
            <div className="error-message">
              <h3>Coordinate Resolution Error</h3>
              <p>{error}</p>
              <button 
                className="retry-button"
                onClick={() => resolveCurrentCoordinate(currentCoordinate)}
              >
                Retry
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Development Mode Modal */}
      {enableDevMode && (
        <DevModeModal
          isOpen={isDevModeOpen}
          onOpenChange={setIsDevModeOpen}
          currentCoordinate={currentCoordinate}
          onCoordinateChange={handleCoordinateChange}
          onControlsChange={handleDevControlsChange}
          onExportSettings={handleExportSettings}
          className="page-dev-modal"
        />
      )}

      <style jsx>{`
        .placeholder-page-template {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: radial-gradient(ellipse at center, 
            rgba(20, 20, 30, 0.9) 0%, 
            rgba(10, 10, 20, 0.95) 70%);
        }

        .page-header {
          position: relative;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 10;
        }

        .main-navigation {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 0 1rem;
          min-height: 70px;
        }

        .coordinate-display-area {
          margin-right: auto;
        }

        .navbar-coordinate-display {
          /* Additional navbar-specific styling if needed */
        }

        .dev-mode-toggle-area {
          position: fixed;
          top: 90px;
          right: 1rem;
          z-index: 1000;
        }

        .dev-mode-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .dev-mode-circle:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          transform: translateY(-1px) scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .dev-icon {
          font-size: 16px;
          display: block;
        }

        .page-main {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .main-placeholder {
          flex: 1;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(4px);
          z-index: 5;
        }

        .loading-spinner {
          background: rgba(20, 20, 30, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          color: white;
          backdrop-filter: blur(20px);
        }

        .error-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(4px);
          z-index: 5;
        }

        .error-message {
          background: rgba(20, 20, 30, 0.95);
          border: 1px solid rgba(239, 68, 68, 0.5);
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          max-width: 400px;
          backdrop-filter: blur(20px);
        }

        .error-message h3 {
          color: rgba(239, 68, 68, 0.9);
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .error-message p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 1.5rem 0;
          line-height: 1.5;
        }

        .retry-button {
          background: rgba(239, 68, 68, 0.8);
          border: none;
          border-radius: 6px;
          color: white;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .retry-button:hover {
          background: rgba(239, 68, 68, 1);
          transform: translateY(-1px);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .main-navigation {
            flex-direction: column;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            min-height: auto;
          }

          .coordinate-display-area {
            margin-left: 0;
            margin-top: 0.5rem;
          }

          .dev-mode-toggle-area {
            position: static;
            margin-top: 0.5rem;
          }

          .error-message,
          .loading-spinner {
            margin: 1rem;
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PlaceholderPageTemplate;