/**
 * Development Mode Modal Component
 * Provides live design experimentation controls for placeholder pages
 * 
 * Features:
 * - Real-time coordinate switching
 * - Template variation selection
 * - Live styling controls
 * - Settings export/import
 * - Collapsible interface
 */

'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as Collapsible from '@radix-ui/react-collapsible';
import React, { useState } from 'react';

export interface DevModeControls {
  coordinateSelector: string;
  templateVariation: 'canvas' | 'card' | 'dynamic';
  stylingControls: {
    // Colors
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    accentColor: string;
    glowColor: string;
    shadowColor: string;
    // Card Layout
    cardWidth: number;
    cardHeight: number;
    cardSpacing: number;
    cardColumns: number;
    // Typography
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
    // Spacing & Layout
    padding: number;
    margin: number;
    borderRadius: number;
    borderWidth: number;
    // Effects
    glowIntensity: number;
    shadowIntensity: number;
    opacity: number;
    blurIntensity: number;
    animationSpeed: number;
    // Layout Properties
    justifyContent: string;
    alignItems: string;
    flexDirection: string;
  };
  previewMode: 'dev' | 'production';
}

export interface DevModeModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  currentCoordinate?: string;
  onCoordinateChange?: (coordinate: string) => void;
  onControlsChange?: (controls: DevModeControls) => void;
  onExportSettings?: (settings: DevModeControls) => void;
  className?: string;
}

// Template variations
const TEMPLATE_VARIATIONS = [
  { value: 'canvas', label: 'Canvas Style' },
  { value: 'card', label: 'Card Layout' },
  { value: 'dynamic', label: 'Dynamic Flow' },
] as const;

export const DevModeModal: React.FC<DevModeModalProps> = ({
  isOpen = false,
  onOpenChange,
  currentCoordinate = '#0',
  onCoordinateChange,
  onControlsChange,
  onExportSettings,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localCoordinateInput, setLocalCoordinateInput] = useState(currentCoordinate);
  const [controls, setControls] = useState<DevModeControls>({
    coordinateSelector: currentCoordinate,
    templateVariation: 'canvas',
    stylingControls: {
      // Colors
      backgroundColor: '#1e293b',
      textColor: '#f8fafc',
      borderColor: '#475569',
      accentColor: '#3b82f6',
      glowColor: '#3b82f6',
      shadowColor: '#000000',
      // Card Layout
      cardWidth: 320,
      cardHeight: 240,
      cardSpacing: 16,
      cardColumns: 3,
      // Typography
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: 0,
      // Spacing & Layout
      padding: 16,
      margin: 8,
      borderRadius: 8,
      borderWidth: 1,
      // Effects
      glowIntensity: 50,
      shadowIntensity: 30,
      opacity: 95,
      blurIntensity: 10,
      animationSpeed: 100,
      // Layout Properties
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
    },
    previewMode: 'dev'
  });

  // Debug logging
  React.useEffect(() => {
    console.log('DevModeModal render:', { isOpen, currentCoordinate, className });
  }, [isOpen, currentCoordinate, className]);

  // Debounced coordinate change to prevent spamming while typing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localCoordinateInput !== controls.coordinateSelector) {
        handleControlChange('coordinateSelector', localCoordinateInput);
        onCoordinateChange?.(localCoordinateInput);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [localCoordinateInput]);

  // Sync local input with prop changes
  React.useEffect(() => {
    setLocalCoordinateInput(currentCoordinate);
  }, [currentCoordinate]);

  const handleControlChange = (key: keyof DevModeControls, value: any) => {
    const newControls = { ...controls, [key]: value };
    setControls(newControls);
    onControlsChange?.(newControls);
  };

  const handleStylingControlChange = (key: keyof DevModeControls['stylingControls'], value: any) => {
    const newStyling = { ...controls.stylingControls, [key]: value };
    const newControls = { ...controls, stylingControls: newStyling };
    setControls(newControls);
    onControlsChange?.(newControls);
  };

  const handleCoordinateInputChange = (coordinate: string) => {
    // Just update local input - debounced effect will handle the actual change
    setLocalCoordinateInput(coordinate);
  };

  const handleExportSettings = () => {
    onExportSettings?.(controls);
    // Also copy to clipboard for convenience
    navigator.clipboard.writeText(JSON.stringify(controls, null, 2));
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm" />
        <Dialog.Content 
          className={`fixed top-5 right-5 z-[10000] w-80 max-h-[calc(100vh-40px)] overflow-hidden bg-slate-900/95 border border-white/20 rounded-xl shadow-2xl backdrop-blur-xl ${className}`}
          data-testid="dev-mode-modal"
        >
          <Dialog.Description className="sr-only">
            Development mode for live design experimentation with coordinate switching, template variations, and real-time styling controls.
          </Dialog.Description>
          
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex-1">
              <Dialog.Title className="text-white text-lg font-semibold mb-1">
                Development Mode
              </Dialog.Title>
              <span className="text-white/60 text-sm">
                Live Design Experimentation
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="bg-white/10 border border-white/20 rounded-md text-white text-sm px-3 py-1.5 cursor-pointer transition-all duration-200 hover:bg-white/15"
                onClick={() => handleControlChange('previewMode', 
                  controls.previewMode === 'dev' ? 'production' : 'dev')}
                data-testid="preview-mode-toggle"
              >
                {controls.previewMode === 'dev' ? '👁️ Preview' : '🔧 Dev'}
              </button>

              <Dialog.Close className="bg-transparent border-none text-white/70 text-xl cursor-pointer p-1 leading-none transition-colors duration-200 hover:text-white">
                ×
              </Dialog.Close>
            </div>
          </div>

          <Collapsible.Root open={isExpanded} onOpenChange={setIsExpanded}>
            <Collapsible.Trigger 
              className="w-full bg-white/5 border-none text-white font-semibold p-3 flex items-center justify-between cursor-pointer transition-colors duration-200 hover:bg-white/10"
              data-testid="collapse-trigger"
            >
              <span>Development Controls</span>
              <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </Collapsible.Trigger>

            <Collapsible.Content className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Coordinate Input */}
              <div className="mb-6">
                <h3 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">
                  Coordinate
                </h3>
                <input
                  type="text"
                  value={localCoordinateInput}
                  onChange={(e) => handleCoordinateInputChange(e.target.value)}
                  placeholder="e.g. #2-3, #1-4-2, #0"
                  className="w-full bg-white/10 border border-white/20 rounded-md text-white p-2 transition-all duration-200 focus:outline-none focus:bg-white/15 focus:border-blue-500/50"
                  data-testid="coordinate-input"
                />
                <p className="text-white/50 text-xs mt-1">Enter any coordinate: #0, #2-3, #1-4-2, etc.</p>
              </div>

              {/* Template Variation */}
              <div className="mb-6">
                <h3 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">
                  Template
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {TEMPLATE_VARIATIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      className={`flex-1 border rounded-md text-xs px-3 py-1.5 cursor-pointer transition-all duration-200 text-center min-w-[80px] ${
                        controls.templateVariation === value
                          ? 'bg-blue-500/50 border-blue-500/80 text-white'
                          : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                      }`}
                      onClick={() => handleControlChange('templateVariation', value)}
                      data-testid={`template-${value}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Styling Controls */}
              <div className="mb-6">
                <h3 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">
                  Card Design Controls
                </h3>
                
                {/* Color Pickers */}
                <div className="mb-4">
                  <h4 className="text-white/90 text-xs font-medium mb-2">Colors</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-white/80 text-xs font-medium w-16">Background</label>
                      <input
                        type="color"
                        value={controls.stylingControls.backgroundColor}
                        onChange={(e) => handleStylingControlChange('backgroundColor', e.target.value)}
                        className="w-8 h-6 rounded border border-white/20 cursor-pointer"
                        data-testid="background-color"
                      />
                      <input
                        type="text"
                        value={controls.stylingControls.backgroundColor}
                        onChange={(e) => handleStylingControlChange('backgroundColor', e.target.value)}
                        className="flex-1 bg-white/10 border border-white/20 rounded text-white text-xs p-1 transition-all duration-200 focus:outline-none focus:bg-white/15 focus:border-blue-500/50"
                        data-testid="background-hex"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-white/80 text-xs font-medium w-16">Text</label>
                      <input
                        type="color"
                        value={controls.stylingControls.textColor}
                        onChange={(e) => handleStylingControlChange('textColor', e.target.value)}
                        className="w-8 h-6 rounded border border-white/20 cursor-pointer"
                        data-testid="text-color"
                      />
                      <input
                        type="text"
                        value={controls.stylingControls.textColor}
                        onChange={(e) => handleStylingControlChange('textColor', e.target.value)}
                        className="flex-1 bg-white/10 border border-white/20 rounded text-white text-xs p-1 transition-all duration-200 focus:outline-none focus:bg-white/15 focus:border-blue-500/50"
                        data-testid="text-hex"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-white/80 text-xs font-medium w-16">Border</label>
                      <input
                        type="color"
                        value={controls.stylingControls.borderColor}
                        onChange={(e) => handleStylingControlChange('borderColor', e.target.value)}
                        className="w-8 h-6 rounded border border-white/20 cursor-pointer"
                        data-testid="border-color"
                      />
                      <input
                        type="text"
                        value={controls.stylingControls.borderColor}
                        onChange={(e) => handleStylingControlChange('borderColor', e.target.value)}
                        className="flex-1 bg-white/10 border border-white/20 rounded text-white text-xs p-1 transition-all duration-200 focus:outline-none focus:bg-white/15 focus:border-blue-500/50"
                        data-testid="border-hex"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-white/80 text-xs font-medium w-16">Accent</label>
                      <input
                        type="color"
                        value={controls.stylingControls.accentColor}
                        onChange={(e) => handleStylingControlChange('accentColor', e.target.value)}
                        className="w-8 h-6 rounded border border-white/20 cursor-pointer"
                        data-testid="accent-color"
                      />
                      <input
                        type="text"
                        value={controls.stylingControls.accentColor}
                        onChange={(e) => handleStylingControlChange('accentColor', e.target.value)}
                        className="flex-1 bg-white/10 border border-white/20 rounded text-white text-xs p-1 transition-all duration-200 focus:outline-none focus:bg-white/15 focus:border-blue-500/50"
                        data-testid="accent-hex"
                      />
                    </div>
                  </div>
                </div>

                {/* Card Layout Controls */}
                <div className="mb-4">
                  <h4 className="text-white/90 text-xs font-medium mb-2">Card Layout</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-white/80 text-xs font-medium">Card Width</label>
                      <input
                        type="range"
                        min="200"
                        max="600"
                        value={controls.stylingControls.cardWidth}
                        onChange={(e) => handleStylingControlChange('cardWidth', parseInt(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                        data-testid="card-width-slider"
                      />
                      <span className="text-white/60 text-xs">{controls.stylingControls.cardWidth}px</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-white/80 text-xs font-medium">Card Height</label>
                      <input
                        type="range"
                        min="150"
                        max="500"
                        value={controls.stylingControls.cardHeight}
                        onChange={(e) => handleStylingControlChange('cardHeight', parseInt(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                        data-testid="card-height-slider"
                      />
                      <span className="text-white/60 text-xs">{controls.stylingControls.cardHeight}px</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-white/80 text-xs font-medium">Card Spacing</label>
                      <input
                        type="range"
                        min="0"
                        max="48"
                        value={controls.stylingControls.cardSpacing}
                        onChange={(e) => handleStylingControlChange('cardSpacing', parseInt(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                        data-testid="card-spacing-slider"
                      />
                      <span className="text-white/60 text-xs">{controls.stylingControls.cardSpacing}px</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-white/80 text-xs font-medium">Columns</label>
                      <input
                        type="range"
                        min="1"
                        max="6"
                        value={controls.stylingControls.cardColumns}
                        onChange={(e) => handleStylingControlChange('cardColumns', parseInt(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                        data-testid="card-columns-slider"
                      />
                      <span className="text-white/60 text-xs">{controls.stylingControls.cardColumns} cols</span>
                    </div>
                  </div>
                </div>

                {/* Typography Controls */}
                <div className="mb-4">
                  <h4 className="text-white/90 text-xs font-medium mb-2">Typography</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-white/80 text-xs font-medium">Font Size</label>
                      <input
                        type="range"
                        min="10"
                        max="48"
                        value={controls.stylingControls.fontSize}
                        onChange={(e) => handleStylingControlChange('fontSize', parseInt(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                        data-testid="font-size-slider"
                      />
                      <span className="text-white/60 text-xs">{controls.stylingControls.fontSize}px</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-white/80 text-xs font-medium">Font Weight</label>
                      <input
                        type="range"
                        min="100"
                        max="900"
                        step="100"
                        value={controls.stylingControls.fontWeight}
                        onChange={(e) => handleStylingControlChange('fontWeight', parseInt(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                        data-testid="font-weight-slider"
                      />
                      <span className="text-white/60 text-xs">{controls.stylingControls.fontWeight}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-white/80 text-xs font-medium">Line Height</label>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={controls.stylingControls.lineHeight}
                        onChange={(e) => handleStylingControlChange('lineHeight', parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                        data-testid="line-height-slider"
                      />
                      <span className="text-white/60 text-xs">{controls.stylingControls.lineHeight}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-white/80 text-xs font-medium">Letter Spacing</label>
                      <input
                        type="range"
                        min="-2"
                        max="8"
                        step="0.1"
                        value={controls.stylingControls.letterSpacing}
                        onChange={(e) => handleStylingControlChange('letterSpacing', parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                        data-testid="letter-spacing-slider"
                      />
                      <span className="text-white/60 text-xs">{controls.stylingControls.letterSpacing}px</span>
                    </div>
                  </div>
                </div>

                {/* Layout & Effects */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-white/80 text-xs font-medium">Border Radius</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={controls.stylingControls.borderRadius}
                      onChange={(e) => handleStylingControlChange('borderRadius', parseInt(e.target.value))}
                      className="slider"
                      data-testid="radius-slider"
                    />
                    <span className="text-white/60 text-xs">{controls.stylingControls.borderRadius}px</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-white/80 text-xs font-medium">Border Width</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={controls.stylingControls.borderWidth}
                      onChange={(e) => handleStylingControlChange('borderWidth', parseInt(e.target.value))}
                      className="slider"
                      data-testid="border-width-slider"
                    />
                    <span className="text-white/60 text-xs">{controls.stylingControls.borderWidth}px</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-white/80 text-xs font-medium">Padding</label>
                    <input
                      type="range"
                      min="0"
                      max="64"
                      value={controls.stylingControls.padding}
                      onChange={(e) => handleStylingControlChange('padding', parseInt(e.target.value))}
                      className="slider"
                      data-testid="padding-slider"
                    />
                    <span className="text-white/60 text-xs">{controls.stylingControls.padding}px</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-white/80 text-xs font-medium">Opacity</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={controls.stylingControls.opacity}
                      onChange={(e) => handleStylingControlChange('opacity', parseInt(e.target.value))}
                      className="slider"
                      data-testid="opacity-slider"
                    />
                    <span className="text-white/60 text-xs">{controls.stylingControls.opacity}%</span>
                  </div>
                </div>
              </div>


              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                <button
                  className="flex-1 bg-blue-500/50 border border-blue-500/70 rounded-md text-white text-xs font-semibold px-4 py-2.5 cursor-pointer transition-all duration-200 hover:bg-blue-500/70 hover:border-blue-500/90"
                  onClick={handleExportSettings}
                  data-testid="export-settings"
                >
                  Export Settings
                </button>
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default DevModeModal;