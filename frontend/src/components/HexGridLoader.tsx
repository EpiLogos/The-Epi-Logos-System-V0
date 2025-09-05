"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

type HexGridLoaderProps = {
  size?: number; // overall visual size in px
  durationSec?: number; // full loop duration
  color?: string; // CSS color for hexes
  colorTo?: string; // gradient end color
  colorDuration?: number; // color animation duration
  backgroundColor?: string; // optional background behind hexes
  minOpacity?: number; // 0..1 fade minimum
  continuousFade?: boolean; // linear fade between nodes
  jitterPx?: number; // random per-step position jitter
  opacityJitter?: number; // randomize min/max opacity per mover (0..1)
};

// Compute flat-top hex grid centers around origin for a loop path
function useHexPath(step: number) {
  return useMemo(() => {
    const r = step; // base radius for spacing
    // For regular hexagon: distance from center to vertex = r
    // For proper proportions, use exact trigonometry
    const dx = r; // horizontal distance from center to vertex
    const dy = r * Math.sqrt(3) / 2; // vertical distance = r * sin(60°)
    // Ring-only positions (6 points) flat-top hex, no center to avoid pauses
    const centers = [
      { x: dx, y: 0 },
      { x: dx * 0.5, y: dy },
      { x: -dx * 0.5, y: dy },
      { x: -dx, y: 0 },
      { x: -dx * 0.5, y: -dy },
      { x: dx * 0.5, y: -dy },
    ];
    return centers;
  }, [step]);
}

function rotate<T>(arr: T[], n: number): T[] {
  const len = arr.length;
  const k = ((n % len) + len) % len;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

export function HexGridLoader({
  size = 96,
  durationSec = 25,
  color = "#fff",
  colorTo,
  colorDuration = 10,
  backgroundColor,
  minOpacity = 0,
  continuousFade = true,
  jitterPx = 0,
  opacityJitter = 0,
}: HexGridLoaderProps) {
  // Base hex visual size
  const hexWidth = 28; // match previous visual size
  const r = hexWidth / 2; // radius from center to corner along x
  const scale = size / 96;

  // Spacing equals radius for a nice compact ring
  const path = useHexPath(r);

  // Build extended keyframes for complete cycle (42 stops = 6 positions × 7 cycles)
  const extendedKeyframesX = [];
  const extendedKeyframesY = [];
  for (let i = 0; i < 48; i++) {
    const pathIndex = i % path.length;
    extendedKeyframesX.push(path[pathIndex].x);
    extendedKeyframesY.push(path[pathIndex].y);
  }
  const keyframesX = extendedKeyframesX;
  const keyframesY = extendedKeyframesY;
  // Base opacity keyframes will be computed per-mover with randomized phase

  // One mover per segment to keep phase coverage
  const movers = new Array(path.length).fill(null).map((_, i) => i);

  return (
    <div style={{ lineHeight: 0 }}>
      <div
        style={{
          width: 96,
          height: 96,
          position: "relative",
          transform: `scale(${scale})`,
          background: backgroundColor,
          overflow: "visible",
        }}
      >
        {movers.map((m) => {
          // Phase-rotate keyframes per mover to stagger without delay
          const kxBase = rotate(keyframesX, m);
          const kyBase = rotate(keyframesY, m);
          // Apply per-step jitter (deterministic for SSR)
          const seedX = (m * 12345 + 67890) % 1000 / 1000; // deterministic pseudo-random
          const seedY = (m * 54321 + 98765) % 1000 / 1000;
          const kx = kxBase.map((x) => x + (jitterPx ? (seedX * 2 - 1) * jitterPx : 1));
          const ky = kyBase.map((y) => y + (jitterPx ? (seedY * 2 - 1) * jitterPx : 1));

          // Opacity as a smooth sinusoid with deterministic amplitude/phase
          const L = kx.length;
          const phase = (m * 0.618) % 1; // deterministic golden ratio phase
          const amp = Math.max(0, Math.min(1, 1 - opacityJitter * ((m * 0.382) % 1)));
          const ko = new Array(L).fill(0).map((_, i) => {
            const t = (i / L + phase) % 1;
            const base = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);
            const o = minOpacity + (1 - minOpacity) * (base * amp + (1 - amp));
            return Math.max(0, Math.min(1, o));
          });
          // Equal time for each of the 35 stops
          const times = kx.map((_, idx) => idx / (kx.length - 1));
          return (
          <motion.div
            key={`${m}-${durationSec}-${minOpacity}-${continuousFade}-${jitterPx}-${opacityJitter}`}
            initial={{ x: kx[0], y: ky[0], opacity: ko[0] }}
            animate={{
              x: kx,
              y: ky,
              opacity: ko,
              backgroundColor: colorTo ? [color, colorTo, color] : color
            }}
            transition={{
              duration: durationSec,
              ease: continuousFade ? "linear" : "easeInOut",
              repeat: Infinity,
              times,
              backgroundColor: colorTo ? {
                duration: colorDuration,
                ease: "easeInOut",
                repeat: Infinity,
                delay: m * 0.5, // variation between start points
              } : undefined,
            }}
            style={{
              position: "absolute",
              top: 48 - r, // center within 96x96
              left: 48 - r,
              width: hexWidth,
              height: (Math.sqrt(3) * r), // hex height
              margin: 2,
              background: color,
              // Flat-top hexagon
              clipPath:
                "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
            }}
          />
        );})}
      </div>
    </div>
  );
}

export default HexGridLoader;
