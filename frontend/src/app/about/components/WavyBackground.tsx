"use client";

import { cn } from '@/ui-system/utils/cn';
import React, { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  isLightMode = false,
  ...props
}: {
  children?: any;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
  isLightMode?: boolean;
  [key: string]: any;
}) => {
  const noise = createNoise3D();
  let w: number,
    h: number,
    nt: number,
    i: number,
    x: number,
    ctx: any,
    canvas: any;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getSpeed = () => {
    switch (speed) {
      case "slow":
        return 0.001;
      case "fast":
        return 0.002;
      default:
        return 0.001;
    }
  };

  const init = () => {
    canvas = canvasRef.current;
    if (!canvas) return;
    ctx = canvas.getContext("2d");

    // Use parent container dimensions instead of window
    const parent = canvas.parentElement;
    w = ctx.canvas.width = parent?.clientWidth || window.innerWidth;
    h = ctx.canvas.height = parent?.clientHeight || window.innerHeight;

    ctx.filter = `blur(${blur}px)`;
    nt = 0;

    window.onresize = function () {
      const parent = canvas.parentElement;
      w = ctx.canvas.width = parent?.clientWidth || window.innerWidth;
      h = ctx.canvas.height = parent?.clientHeight || window.innerHeight;
      ctx.filter = `blur(${blur}px)`;
    };
    render();
  };

  // Monochrome grayscale palette - clean slate tones for light mode
  const waveColors = colors ?? (isLightMode ? [
    "#f1f5f9", // slate-100
    "#e2e8f0", // slate-200
    "#cbd5e1", // slate-300
    "#94a3b8", // slate-400
    "#64748b", // slate-500
  ] : [
    "#1a1a1a",
    "#2a2a2a",
    "#3a3a3a",
    "#4a4a4a",
    "#5a5a5a",
  ]);

  const drawWave = (n: number) => {
    nt += getSpeed();
    for (i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.lineWidth = waveWidth || 50;
      ctx.strokeStyle = waveColors[i % waveColors.length];
      for (x = 0; x < w; x += 5) {
        var y = noise(x / 800, 0.3 * i, nt) * 100;
        ctx.lineTo(x, y + h * 0.5); // adjust for height, currently at 50% of the container
      }
      ctx.stroke();
      ctx.closePath();
    }
  };

  let animationId: number;
  const render = () => {
    ctx.fillStyle = backgroundFill || (isLightMode ? "white" : "black");
    ctx.globalAlpha = waveOpacity || 0.5;
    ctx.fillRect(0, 0, w, h);
    drawWave(5);
    animationId = requestAnimationFrame(render);
  };

  useEffect(() => {
    init();
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isLightMode, backgroundFill, colors]);

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    // Safari support
    setIsSafari(
      typeof window !== "undefined" &&
        navigator.userAgent.includes("Safari") &&
        !navigator.userAgent.includes("Chrome")
    );
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        containerClassName
      )}
    >
      <canvas
        className="absolute inset-0 z-0 w-full h-full"
        ref={canvasRef}
        id="canvas"
        style={{
          ...(isSafari ? { filter: `blur(${blur}px)` } : {}),
        }}
      ></canvas>
      <div className={cn("relative z-10 w-full h-full", className)} {...props}>
        {children}
      </div>
    </div>
  );
};
