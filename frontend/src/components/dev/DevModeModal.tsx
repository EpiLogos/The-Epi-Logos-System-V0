/**
 * DevModeModal Component
 * 
 * Provides collapsible development controls for live coordinate switching,
 * styling experimentation, and template variations.
 * Implements cosmic black background, thin borders, and philosopher white text.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { SUBSYSTEM_THEMES, getSubsystemTheme } from '@/theme/subsystemPalette';

export interface DevModeControls {
  coordinate: string;
  templateVariation: 'canvas' | 'card' | 'dynamic';
  stylingControls: {
    borderWidth: number;
    glowIntensity: number;
    animationSpeed: number;
    useSubsystemColors: boolean;
    customBackground?: string;
    customText?: string;
  };
  previewMode: boolean;
}

export interface DevModeModalProps {
  isOpen: boolean;
  controls: DevModeControls;
  onControlsChange: (controls: DevModeControls) => void;
  onToggle: () => void;
  className?: string;
}

export const DevModeModal: React.FC<DevModeModalProps> = ({
  isOpen,
  controls,
  onControlsChange,
  onToggle,
  className = ''
}) => {
  const [localControls, setLocalControls] = useState<DevModeControls>(controls);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setLocalControls(controls);
  }, [controls]);

  useEffect(() => {
    // Listen for Ctrl+Shift+D to toggle the modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);

  const handleControlChange = <K extends keyof DevModeControls>(
    key: K,
    value: DevModeControls[K]
  ) => {
    const newControls = { ...localControls, [key]: value };
    setLocalControls(newControls);
    onControlsChange(newControls);
  };

  const handleStylingChange = <K extends keyof DevModeControls['stylingControls']>(
    key: K,
    value: DevModeControls['stylingControls'][K]
  ) => {
    const newStyling = { ...localControls.stylingControls, [key]: value };
    handleControlChange('stylingControls', newStyling);
  };

  const handleExport = () => {
    const config = JSON.stringify(localControls, null, 2);
    navigator.clipboard.writeText(config);
    alert('Configuration copied to clipboard!');
  };

  const currentTheme = getSubsystemTheme(localControls.coordinate);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 ${isCollapsed ? 'w-12' : 'w-96'} transition-all duration-300 ${className}`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-white/10">
        <h3 className="text-white text-sm font-medium">
          {!isCollapsed && 'Dev Mode Controls'}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white/60 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '◀' : '▶'}
          </button>
          <button
            onClick={onToggle}
            className="text-white/60 hover:text-white transition-colors"
            title="Close (Ctrl+Shift+D)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Coordinate Selector */}
          <div>
            <label className="block text-white/80 text-xs mb-2">
              Coordinate
            </label>
            <select
              value={localControls.coordinate}
              onChange={(e) => handleControlChange('coordinate', e.target.value)}
              className="w-full bg-black/50 text-white border border-white/20 rounded px-3 py-2 text-sm focus:border-white/40 outline-none"
            >
              {Object.entries(SUBSYSTEM_THEMES).map(([index, theme]) => (
                <optgroup key={index} label={theme.name}>
                  {[0, 1, 2, 3, 4, 5].map((terminal) => (
                    <option key={`${index}-${terminal}`} value={`#${index}-${terminal}`}>
                      #{index}-{terminal} ({theme.name} → {SUBSYSTEM_THEMES[terminal]?.name})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Template Variation */}
          <div>
            <label className="block text-white/80 text-xs mb-2">
              Template Variation
            </label>
            <div className="flex gap-2">
              {(['canvas', 'card', 'dynamic'] as const).map((variation) => (
                <button
                  key={variation}
                  onClick={() => handleControlChange('templateVariation', variation)}
                  className={`flex-1 px-3 py-2 text-xs rounded border transition-all ${
                    localControls.templateVariation === variation
                      ? 'bg-white/10 border-white/40 text-white'
                      : 'bg-black/30 border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  {variation.charAt(0).toUpperCase() + variation.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Styling Controls */}
          <div className="space-y-3">
            <h4 className="text-white/80 text-xs font-medium">Styling</h4>
            
            {/* Border Width */}
            <div>
              <label className="block text-white/60 text-xs mb-1">
                Border Width: {localControls.stylingControls.borderWidth}px
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={localControls.stylingControls.borderWidth}
                onChange={(e) => handleStylingChange('borderWidth', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Glow Intensity */}
            <div>
              <label className="block text-white/60 text-xs mb-1">
                Glow Intensity: {localControls.stylingControls.glowIntensity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={localControls.stylingControls.glowIntensity}
                onChange={(e) => handleStylingChange('glowIntensity', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Animation Speed */}
            <div>
              <label className="block text-white/60 text-xs mb-1">
                Animation Speed: {localControls.stylingControls.animationSpeed}x
              </label>
              <input
                type="range"
                min="0"
                max="3"
                step="0.5"
                value={localControls.stylingControls.animationSpeed}
                onChange={(e) => handleStylingChange('animationSpeed', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Use Subsystem Colors */}
            <div className="flex items-center justify-between">
              <label className="text-white/60 text-xs">
                Use Subsystem Colors
              </label>
              <button
                onClick={() => handleStylingChange('useSubsystemColors', !localControls.stylingControls.useSubsystemColors)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  localControls.stylingControls.useSubsystemColors
                    ? 'bg-green-500'
                    : 'bg-gray-600'
                }`}
              >
                <div 
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    localControls.stylingControls.useSubsystemColors
                      ? 'translate-x-6'
                      : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Preview Mode */}
          <div className="flex items-center justify-between">
            <label className="text-white/60 text-xs">
              Preview Mode
            </label>
            <button
              onClick={() => handleControlChange('previewMode', !localControls.previewMode)}
              className={`w-12 h-6 rounded-full transition-colors ${
                localControls.previewMode
                  ? 'bg-blue-500'
                  : 'bg-gray-600'
              }`}
            >
              <div 
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  localControls.previewMode
                    ? 'translate-x-6'
                    : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Current Theme Info */}
          {currentTheme && (
            <div className="p-3 bg-white/5 rounded border border-white/10">
              <h5 className="text-white/80 text-xs font-medium mb-2">
                Current Theme: {currentTheme.name}
              </h5>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: currentTheme.primary }}
                  />
                  <span className="text-white/60 text-xs">Primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: currentTheme.secondary }}
                  />
                  <span className="text-white/60 text-xs">Secondary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: currentTheme.accent }}
                  />
                  <span className="text-white/60 text-xs">Accent</span>
                </div>
              </div>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded border border-white/20 transition-colors"
          >
            Export Configuration
          </button>
        </div>
      )}
    </div>
  );
};

export default DevModeModal;