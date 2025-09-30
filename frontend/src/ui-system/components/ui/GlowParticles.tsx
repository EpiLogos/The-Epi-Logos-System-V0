import React, { useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface GlowParticlesProps {
  isVisible?: boolean;
  particleCount?: number;
  baseHue?: number;
  monochrome?: boolean;
  parentRef?: React.RefObject<HTMLDivElement | null>;
  mode?: 'default' | 'mist';
  saturation?: number;
  lightness?: number;
  radiusScale?: number;
  showDebug?: boolean;
  scaleOnHover?: boolean;
  hoverParticleCount?: number;
  hoverOpacity?: number;
  fadeState?: 'hidden' | 'visible' | 'modal-hiding' | 'quick-fade-out';
  animationParticleCount?: number;
  animationActive?: boolean;
  scaleState?: 'normal' | 'shrinking' | 'expanding';
  countState?: 'normal' | 'building' | 'resetting';
}

export const GlowParticles: React.FC<GlowParticlesProps> = ({
  isVisible = false,
  particleCount = 300,
  baseHue = 240,
  monochrome = false,
  parentRef,
  mode = 'default',
  saturation = 70,
  lightness = 60,
  radiusScale = 1,
  scaleOnHover = false,
  hoverParticleCount = null,
  hoverOpacity = null,
  fadeState = 'visible',
  animationParticleCount = null,
  animationActive = false,
  scaleState = 'normal',
  countState = 'normal'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | undefined>(undefined);
  const baseParticleCount = particleCount;
  // Use a fixed maximum that accommodates the 10x scaling (1000 particles)
  const maxParticleCount = Math.max(baseParticleCount, hoverParticleCount || baseParticleCount, 1000);
  const particlePropsLength = maxParticleCount * 9;
  const particleProps = useRef(new Float32Array(particlePropsLength));
  const tick = useRef(0);
  const currentScale = useRef(1);
  const targetScale = useRef(1);
  const currentParticleCount = useRef(particleCount);
  const targetParticleCount = useRef(particleCount);
  const currentOpacity = useRef(1);
  const targetOpacity = useRef(1);
  const currentAnimationScale = useRef(1);
  const targetAnimationScale = useRef(1);

  const rand = (n: number) => n * Math.random();
  const randRange = (n: number) => n - rand(2 * n);

  const initParticle = (i: number, canvas: HTMLCanvasElement) => {
    // Expand spawn area beyond canvas bounds for organic flow
    const margin = Math.min(canvas.width, canvas.height) * 0.3;
    const x = rand(canvas.width + margin * 2) - margin;
    const y = rand(canvas.height + margin * 2) - margin;
    const vx = randRange(2);
    const vy = randRange(2);
    const life = 0;
    const ttl = 50 + rand(100);
    const speed = mode === 'mist' ? 0.2 + rand(0.5) : 0.5 + rand(1);
    const baseRadius = mode === 'mist' ? 6 + rand(10) : 1 + rand(3);
    const radius = Math.max(0.5, baseRadius * Math.max(0.1, radiusScale));
    const hue = monochrome ? 0 : baseHue + rand(60);

    particleProps.current.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
  };

  const updateParticle = (i: number, canvas: HTMLCanvasElement) => {
    const props = particleProps.current;
    const x = props[i];
    const y = props[i + 1];
    const vx = props[i + 2];
    const vy = props[i + 3];
    const life = props[i + 4];
    const ttl = props[i + 5];
    const speed = props[i + 6];

    const newX = x + vx * speed;
    const newY = y + vy * speed;
    const newLife = life + 1;

    // Expand boundary area to allow particles to move beyond visible canvas
    const margin = Math.min(canvas.width, canvas.height) * 0.4;
    const leftBound = -margin;
    const rightBound = canvas.width + margin;
    const topBound = -margin;
    const bottomBound = canvas.height + margin;

    if (newLife > ttl || newX < leftBound || newX > rightBound || newY < topBound || newY > bottomBound) {
      initParticle(i, canvas);
    } else {
      props[i] = newX;
      props[i + 1] = newY;
      props[i + 4] = newLife;
    }
  };

  const drawParticle = (i: number, ctx: CanvasRenderingContext2D) => {
    const props = particleProps.current;
    const x = props[i];
    const y = props[i + 1];
    const life = props[i + 4];
    const ttl = props[i + 5];
    const radius = props[i + 7];
    const hue = props[i + 8];

    const alpha = 1 - (life / ttl);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    
    if (monochrome) {
      gradient.addColorStop(0, `hsla(0, 0%, 100%, ${alpha})`);
      gradient.addColorStop(1, `hsla(0, 0%, 100%, 0)`);
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
    // Update target scale based on scaleOnHover
    targetScale.current = scaleOnHover ? 0.01 : 1;
    
    // Update target particle count, opacity, and animation scale based on state
    if (animationActive && animationParticleCount) {
      // Animation mode takes priority
      targetParticleCount.current = animationParticleCount;
      targetOpacity.current = 1;
      // Scale state determines target scale: shrinking=0.01, expanding=1, normal=1
      if (scaleState === 'shrinking') {
        targetAnimationScale.current = 0.01;
      } else {
        targetAnimationScale.current = 1;
      }
    } else if (scaleOnHover) {
      targetParticleCount.current = hoverParticleCount || maxParticleCount;
      targetOpacity.current = hoverOpacity !== null ? hoverOpacity : 0.3;
      targetAnimationScale.current = 1;
    } else {
      targetParticleCount.current = baseParticleCount;
      targetOpacity.current = 1;
      targetAnimationScale.current = 1;
    }
    
    // Smooth interpolations (rapid but smooth)
    const scaleDiff = targetScale.current - currentScale.current;
    currentScale.current += scaleDiff * 0.014; // Scale transition
    
    const particleCountDiff = targetParticleCount.current - currentParticleCount.current;
    // CSS timing: 2000ms transitions, use frame-rate adjusted interpolation
    // At 60fps, 2000ms = 120 frames, so 1/120 ≈ 0.008 for linear, but use easing
    const isResetting = currentParticleCount.current > baseParticleCount && !animationActive;
    const isShrinking = scaleState === 'shrinking';
    const isExpanding = scaleState === 'expanding';
    
    let particleSpeed;
    if (isShrinking || (animationActive && animationParticleCount)) {
      // Building up - slower, smooth buildup (CSS: 2000ms cubic-bezier(0.25, 0.1, 0.25, 1))
      particleSpeed = 0.015; // Slower for smooth buildup
    } else if (isExpanding || isResetting) {
      // Resetting - faster, smooth return (CSS: 2000ms cubic-bezier(0.19, 1, 0.22, 1))  
      particleSpeed = 0.025; // Faster for smooth return
    } else {
      particleSpeed = 0.02; // Default
    }
    
    currentParticleCount.current += particleCountDiff * particleSpeed;
    
    const opacityDiff = targetOpacity.current - currentOpacity.current;
    currentOpacity.current += opacityDiff * 0.1; // Fast opacity transition
    
    const animationScaleDiff = targetAnimationScale.current - currentAnimationScale.current;
    // CSS timing: 2000ms transition, match easing to state
    let scaleSpeed;
    if (isShrinking) {
      // CSS: cubic-bezier(0.19, 1, 0.22, 1) - ease-out for shrinking
      scaleSpeed = 0.03;
    } else if (isExpanding) {
      // CSS: cubic-bezier(0.25, 0.1, 0.25, 1) - ease-in-out for expanding
      scaleSpeed = 0.025;
    } else {
      scaleSpeed = 0.02; // Default
    }
    currentAnimationScale.current += animationScaleDiff * scaleSpeed;

    if (mode === 'mist') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.27)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Apply global opacity and combined scaling (hover + animation scale)
    ctx.save();
    ctx.globalAlpha = currentOpacity.current;
    
    // Combine hover scale with animation scale - animation scale shrinks to center
    const combinedScale = currentScale.current * currentAnimationScale.current;
    
    // Transform from center (like PNG shrink) instead of top-left
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(combinedScale, combinedScale);
    ctx.translate(-centerX, -centerY);
    
    // Draw particles using current interpolated count
    const activeParticleCount = Math.floor(currentParticleCount.current);
    for (let i = 0; i < activeParticleCount * 9; i += 9) {
      updateParticle(i, canvas);
      drawParticle(i, ctx);
    }
    
    ctx.restore();

    tick.current++;
    animationFrameId.current = requestAnimationFrame(() => draw(canvas, ctx));
  };

  const setup = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (parentRef?.current) {
      const rect = parentRef.current.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

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
  }, [isVisible, parentRef, mode, particleCount, monochrome, baseHue, scaleOnHover, animationActive, animationParticleCount, scaleState, countState]);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "absolute inset-0 pointer-events-none z-10",
        // Particle fade utilities
        fadeState === 'visible' && 'particle-fade-visible',
        fadeState === 'hidden' && 'particle-fade-hidden', 
        fadeState === 'modal-hiding' && 'particle-fade-modal-hiding',
        fadeState === 'quick-fade-out' && 'particle-fade-out-quick',
        // Particle count utilities
        countState === 'normal' && 'particle-count-normal',
        countState === 'building' && 'particle-count-building',
        countState === 'resetting' && 'particle-count-resetting'
      )}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "particles-canvas w-full h-full",
          scaleOnHover && "particles-expanded-blur",
          // CSS-based scaling animation
          scaleState === 'normal' && 'particle-scale-normal',
          scaleState === 'shrinking' && 'particle-scale-shrinking', 
          scaleState === 'expanding' && 'particle-scale-expanding'
        )}
      />
    </div>
  );
};