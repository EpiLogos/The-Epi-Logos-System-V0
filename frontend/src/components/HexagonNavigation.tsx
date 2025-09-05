"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
import HexGridLoader from '@/components/HexGridLoader';

// Preset configurations for common use cases
export const HexagonPresets = {
  // Main logo with overlay image
  logo: {
    size: 240,
    durationSec: 84,
    minOpacity: 0,
    continuousFade: true,
    jitterPx: 0.90,
    opacityJitter: 0.80,
    color: "#badbfff5",
    colorTo: "#122036ff",
    colorDuration: 10,
    overlayImage: {
      src: "/images/output-onlinepngtools.png",
      alt: "Epi-Logos Symbol",
      width: 250,
      height: 240,
      offsetX: 7,
      offsetY: 5,
      opacity: 0.3,
      filter: 'brightness(1.2) contrast(1.2)',
      mixBlendMode: 'screen'
    }
  },

  // Simple loader without overlay
  loader: {
    size: 80,
    durationSec: 12,
    minOpacity: 0.3,
    continuousFade: true,
    jitterPx: 0,
    opacityJitter: 0.5,
    color: "#292069f5",
    colorTo: "#262626ff",
    colorDuration: 8
  },

  // Minimal navigation element
  nav: {
    size: 60,
    durationSec: 20,
    minOpacity: 0.2,
    continuousFade: true,
    jitterPx: 0.5,
    opacityJitter: 0.3,
    color: "#ffffff80",
    colorTo: "#00000080",
    colorDuration: 15
  }
} as const;

export interface HexagonNavigationProps {
  /** Use a preset configuration */
  preset?: keyof typeof HexagonPresets;
  /** Size of the hexagon animation in pixels */
  size?: number;
  /** Animation duration in seconds */
  durationSec?: number;
  /** Minimum opacity for the animation */
  minOpacity?: number;
  /** Whether to use continuous fade animation */
  continuousFade?: boolean;
  /** Position jitter in pixels */
  jitterPx?: number;
  /** Opacity jitter amount (0-1) */
  opacityJitter?: number;
  /** Primary color for the hexagon animation */
  color?: string;
  /** Secondary color for gradient animation */
  colorTo?: string;
  /** Color animation duration in seconds */
  colorDuration?: number;
  /** Optional overlay image */
  overlayImage?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    offsetX?: number;
    offsetY?: number;
    opacity?: number;
    filter?: string;
    mixBlendMode?: string;
  };
  /** Enable additional spinning light overlays (conic gradients). Disabled by default to avoid vertical band artifacts */
  overlayLightingEnabled?: boolean;

  /** Container styling */
  className?: string;
  /** Scale transformation */
  scale?: number;
  /** Transform origin for scaling */
  transformOrigin?: string;
  /** Position styling */
  position?: 'absolute' | 'relative' | 'fixed';
  /** Position coordinates (only used if position is absolute/fixed) */
  coordinates?: {
    top?: string | number;
    left?: string | number;
    right?: string | number;
    bottom?: string | number;
  };
  /** Z-index */
  zIndex?: number;
  /** Click handler */
  onClick?: () => void;
  /** Whether the component is interactive */
  interactive?: boolean;
}

export default function HexagonNavigation({
  preset,
  size = 240,
  durationSec = 84,
  minOpacity = 0,
  continuousFade = true,
  jitterPx = 0.90,
  opacityJitter = 0.80,
  color = "#badbfff5",
  colorTo = "#122036ff",
  colorDuration = 10,
  overlayImage,
  overlayLightingEnabled = true,
  className = "",
  scale = 1,
  transformOrigin = "center",
  position = "relative",
  coordinates,
  zIndex = 10,
  onClick,
  interactive = false
}: HexagonNavigationProps) {
  // Apply preset if specified, with props overriding preset values
  const presetConfig = preset ? HexagonPresets[preset] : {};
  const config = {
    size: size ?? presetConfig.size ?? 240,
    durationSec: durationSec ?? presetConfig.durationSec ?? 84,
    minOpacity: minOpacity ?? presetConfig.minOpacity ?? 0,
    continuousFade: continuousFade ?? presetConfig.continuousFade ?? true,
    jitterPx: jitterPx ?? presetConfig.jitterPx ?? 0.90,
    opacityJitter: opacityJitter ?? presetConfig.opacityJitter ?? 0.80,
    color: color ?? presetConfig.color ?? "#badbfff5",
    colorTo: colorTo ?? presetConfig.colorTo ?? "#122036ff",
    colorDuration: colorDuration ?? presetConfig.colorDuration ?? 10,
    overlayImage: overlayImage ?? presetConfig.overlayImage
  };
  const containerRef = useRef<HTMLDivElement>(null);

  // Build position styles
  const positionStyles: React.CSSProperties = {
    position,
    zIndex,
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: scale !== 1 ? transformOrigin : undefined,
    cursor: interactive ? 'pointer' : undefined,
    ...coordinates
  };

  return (
    <>
      {/* CSS keyframes for breathing animation */}
      <style jsx>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.255;
          }
          25% {
            transform: scale(1.05) rotate(90deg);
            opacity: 0.51;
          }
          50% {
            transform: scale(0.95) rotate(180deg);
            opacity: 0.17;
          }
          75% {
            transform: scale(1.08) rotate(270deg);
            opacity: 0.595;
          }
        }
      `}</style>

      <div
        ref={containerRef}
        className={`${className}`}
        style={positionStyles}
        onClick={interactive ? onClick : undefined}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
      >
      <div className="relative flex items-center justify-center">
        {/* Main hexagon animation */}
        <HexGridLoader
          size={config.size}
          durationSec={config.durationSec}
          minOpacity={config.minOpacity}
          continuousFade={config.continuousFade}
          jitterPx={config.jitterPx}
          opacityJitter={config.opacityJitter}
          color={config.color}
          colorTo={config.colorTo}
          colorDuration={config.colorDuration}
        />



        {/* Enhanced dynamic rotating light overlays */}
        {config.overlayImage && overlayLightingEnabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Primary rotating light - fast rotation with breathing effect */}
            <div
              className="absolute rounded-full"
              style={{
                width: `${config.size * 1.2}px`,
                height: `${config.size * 1.2}px`,
                background: `conic-gradient(from 0deg, transparent 0%, rgba(186, 219, 255, 0.2125) 15%, transparent 30%, rgba(186, 219, 255, 0.0425) 45%, transparent 60%, rgba(186, 219, 255, 0.153) 75%, transparent 90%)`,
                filter: 'blur(6px)',
                clipPath: 'ellipse(50% 50% at center)',
                animation: 'spin 18s linear infinite, breathe 12s ease-in-out infinite'
              }}
            />

            {/* Secondary rotating light - medium speed, counter-rotation */}
            <div
              className="absolute rounded-full"
              style={{
                width: `${config.size * 1.0}px`,
                height: `${config.size * 1.0}px`,
                background: `conic-gradient(from 120deg, transparent 0%, rgba(255, 255, 255, 0.1275) 25%, transparent 50%, rgba(186, 219, 255, 0.068) 75%, transparent 100%)`,
                filter: 'blur(10px)',
                clipPath: 'ellipse(50% 50% at center)',
                animation: 'spin 30s linear infinite reverse, breathe 18s ease-in-out infinite 3s'
              }}
            />

            {/* Tertiary rotating light - slow rotation with different breathing */}
            <div
              className="absolute rounded-full"
              style={{
                width: `${config.size * 1.13}px`,
                height: `${config.size * 1.13}px`,
                background: `conic-gradient(from 240deg, transparent 0%, rgba(186, 219, 255, 0.102) 20%, transparent 40%, rgba(255, 255, 255, 0.051) 50%, transparent 60%, rgba(186, 219, 255, 0.0765) 95%)`,
                filter: 'blur(20px)',
                clipPath: 'ellipse(50% 50% at center)',
                animation: 'spin 45s linear infinite, breathe 24s ease-in-out infinite 6s'
              }}
            />
          </div>
        )}

        {/* Image overlay */}
        {config.overlayImage && (
          <div className="absolute flex items-center justify-center pointer-events-none">
            <div style={{
              position: "relative",
              width: `${config.overlayImage.width || Math.floor(config.size * 1.04)}px`,
              height: `${config.overlayImage.height || config.size}px`,
              left: `${config.overlayImage.offsetX || 7}px`,
              top: `${config.overlayImage.offsetY || 5}px`
            }}>
              <Image
                src={config.overlayImage.src}
                alt={config.overlayImage.alt}
                fill
                sizes={`${config.overlayImage.width || Math.floor(config.size * 1.04)}px`}
                priority
                style={{
                  objectFit: "contain",
                  filter: config.overlayImage.filter || 'brightness(1.2) contrast(1.2)',
                  mixBlendMode: (config.overlayImage.mixBlendMode as any) || 'screen',
                  opacity: config.overlayImage.opacity || 0.3
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
