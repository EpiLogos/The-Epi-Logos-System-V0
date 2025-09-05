"use client";

import React, { Suspense } from "react";
import { motion } from "framer-motion";
import { WorkingThreeScene } from "@/components/system/WorkingThreeScene";
import type { SubsystemDef } from "@/lib/constants/subsystems";

function SceneLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-slate-600 flex items-center justify-center">
      <div className="text-white text-center space-y-3">
        <div className="animate-pulse text-sm opacity-70">Loading subsystem scene…</div>
      </div>
    </div>
  );
}

export interface SubsystemScenePageProps {
  subsystem: SubsystemDef;
}

export default function SubsystemScenePage({ subsystem }: SubsystemScenePageProps) {
  const { palette, name } = subsystem;

  const gradientStyle = {
    background:
      `linear-gradient(180deg, rgba(0,0,0,1) 0%, ${palette.wash} 35%, rgba(2,6,23,1) 100%)`,
  } as React.CSSProperties;

  const hexToRgba = (hex: string, alpha = 0.35) => {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const overlayTint = hexToRgba(palette.primary, 0.35);

  return (
    <motion.div
      className="min-h-screen"
      style={gradientStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Title overlay */}
      <div className="pointer-events-none select-none z-[40] relative">
        <motion.h1
          className="absolute left-1/2 -translate-x-1/2 text-center text-5xl md:text-7xl font-heading z-[40]"
          style={{ color: palette.primary, top: '88px', textShadow: '0 2px 16px rgba(0,0,0,0.35)' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {name}
        </motion.h1>
      </div>

      {/* Scene */}
      <div className="relative h-screen">
        <Suspense fallback={<SceneLoader />}>
          <WorkingThreeScene
            theme="dark"
            initiallyTransitioned
            hideThree
            hideUiOverlays
            overlayTint={overlayTint}
            onEnterExperience={undefined}
            {...(palette.glow
              ? {
                  glow: {
                    baseHue: palette.glow.baseHue,
                    saturation: palette.glow.saturation,
                    lightness: palette.glow.lightness,
                    monochrome: palette.glow.monochrome,
                    particleCount: palette.glow.particleCount,
                    mode: palette.glow.mode,
                    radiusScale: palette.glow.radiusScale,
                  },
                }
              : {})}
          />
        </Suspense>
      </div>
    </motion.div>
  );
}
