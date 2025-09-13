"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface GlowParticlesProps {
  isVisible?: boolean;
  particleCount?: number;
  baseHue?: number;
  monochrome?: boolean; // render in black/white/grey
  parentRef?: React.RefObject<HTMLElement>; // localize to container
  mode?: "default" | "mist"; // misty look
  saturation?: number; // 0-100 for HSL
  lightness?: number; // 0-100 for HSL
  radiusScale?: number; // scale particle radius
}

export const GlowParticles = ({ 
  isVisible = false, 
  particleCount = 300,
  baseHue = 240, // Blue-purple base
  monochrome = false,
  parentRef,
  mode = "default",
  saturation = 70,
  lightness = 60,
  radiusScale = 1,
}: GlowParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const particlePropsLength = particleCount * 9;
  const particleProps = new Float32Array(particlePropsLength);
  let tick = 0;

  const rand = (n: number): number => n * Math.random();
  const randRange = (n: number): number => n - rand(2 * n);

  const initParticle = (i: number, canvas: HTMLCanvasElement) => {
    const x = rand(canvas.width);
    const y = rand(canvas.height);
    const vx = randRange(2);
    const vy = randRange(2);
    const life = 0;
    const ttl = 50 + rand(100);
    const speed = mode === "mist" ? 0.2 + rand(0.5) : 0.5 + rand(1);
    const baseRadius = mode === "mist" ? 6 + rand(10) : 1 + rand(3);
    const radius = Math.max(0.5, baseRadius * Math.max(0.1, radiusScale));
    const hue = monochrome ? 0 : baseHue + rand(60); // hue ignored when monochrome

    particleProps.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
  };

  const updateParticle = (i: number, canvas: HTMLCanvasElement) => {
    const x = particleProps[i];
    const y = particleProps[i + 1];
    const vx = particleProps[i + 2];
    const vy = particleProps[i + 3];
    const life = particleProps[i + 4];
    const ttl = particleProps[i + 5];
    const speed = particleProps[i + 6];
    const radius = particleProps[i + 7];
    const hue = particleProps[i + 8];

    const newX = x + vx * speed;
    const newY = y + vy * speed;
    const newLife = life + 1;

    if (newLife > ttl || newX < 0 || newX > canvas.width || newY < 0 || newY > canvas.height) {
      initParticle(i, canvas);
    } else {
      particleProps[i] = newX;
      particleProps[i + 1] = newY;
      particleProps[i + 4] = newLife;
    }
  };

  const drawParticle = (i: number, ctx: CanvasRenderingContext2D) => {
    const x = particleProps[i];
    const y = particleProps[i + 1];
    const life = particleProps[i + 4];
    const ttl = particleProps[i + 5];
    const radius = particleProps[i + 7];
    const hue = particleProps[i + 8];

    const alpha = 1 - (life / ttl);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    if (monochrome) {
      // Shades of grey: 90% to 10% lightness, no saturation
      gradient.addColorStop(0, `hsla(0, 0%, 85%, ${alpha})`);
      gradient.addColorStop(1, `hsla(0, 0%, 85%, 0)`);
    } else {
      gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`);
      gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    // Light mist trail by drawing a translucent black rect over previous frame
    if (mode === "mist") {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    for (let i = 0; i < particlePropsLength; i += 9) {
      updateParticle(i, canvas);
      drawParticle(i, ctx);
    }

    tick++;
    animationFrameId.current = requestAnimationFrame(() => draw(canvas, ctx));
  };

  const setup = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size to parent container or window
    if (parentRef?.current) {
      const rect = parentRef.current.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    // Initialize particles
    for (let i = 0; i < particlePropsLength; i += 9) {
      initParticle(i, canvas);
    }

    draw(canvas, ctx);
  };

  useEffect(() => {
    if (isVisible) {
      setup();
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isVisible, parentRef, mode, particleCount, monochrome, baseHue]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute inset-0 z-10 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, delay: 0.5 }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'transparent' }}
      />
    </motion.div>
  );
};
