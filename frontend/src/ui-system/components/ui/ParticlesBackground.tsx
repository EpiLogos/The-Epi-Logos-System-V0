import React, { useEffect, useRef } from 'react';

interface ParticlesBackgroundProps {
  isVisible?: boolean;
  particleCount?: number;
  baseHue?: number;
  monochrome?: boolean;
  mode?: 'default' | 'mist';
  saturation?: number;
  lightness?: number;
  radiusScale?: number;
  scaleOnHover?: boolean;
  className?: string;
}

export const ParticlesBackground: React.FC<ParticlesBackgroundProps> = ({
  isVisible = true,
  particleCount = 300,
  baseHue = 240,
  monochrome = false,
  mode = 'default',
  saturation = 70,
  lightness = 60,
  radiusScale = 1,
  scaleOnHover = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const particlePropsLength = particleCount * 9;
  const particlePropsRef = useRef<Float32Array>(new Float32Array(particlePropsLength));
  const tickRef = useRef(0);
  const currentScaleRef = useRef(1);
  const targetScaleRef = useRef(1);

  const rand = (n: number) => n * Math.random();
  const randRange = (n: number) => n - rand(2 * n);

  const initParticle = (i: number, canvas: HTMLCanvasElement) => {
    const particleProps = particlePropsRef.current;
    const x = rand(canvas.width);
    const y = rand(canvas.height);
    const vx = randRange(2);
    const vy = randRange(2);
    const life = 0;
    const ttl = 50 + rand(100);
    const speed = mode === 'mist' ? 0.2 + rand(0.5) : 0.5 + rand(1);
    const baseRadius = mode === 'mist' ? 6 + rand(10) : 1 + rand(3);
    const radius = Math.max(0.5, baseRadius * Math.max(0.1, radiusScale));
    const hue = monochrome ? 0 : baseHue + rand(60);

    particleProps.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
  };

  const updateParticle = (i: number, canvas: HTMLCanvasElement) => {
    const particleProps = particlePropsRef.current;
    const x = particleProps[i];
    const y = particleProps[i + 1];
    const vx = particleProps[i + 2];
    const vy = particleProps[i + 3];
    const life = particleProps[i + 4];
    const ttl = particleProps[i + 5];
    const speed = particleProps[i + 6];

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
    const particleProps = particlePropsRef.current;
    const x = particleProps[i];
    const y = particleProps[i + 1];
    const life = particleProps[i + 4];
    const ttl = particleProps[i + 5];
    const radius = particleProps[i + 7];
    const hue = particleProps[i + 8];

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
    targetScaleRef.current = scaleOnHover ? 0.01 : 1;
    
    // Smooth scale interpolation (easing)
    const scaleDiff = targetScaleRef.current - currentScaleRef.current;
    currentScaleRef.current += scaleDiff * 0.014; // Much slower transition

    if (mode === 'mist') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.27)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Apply scale transform
    ctx.save();
    ctx.scale(currentScaleRef.current, currentScaleRef.current);
    
    for (let i = 0; i < particlePropsLength; i += 9) {
      updateParticle(i, canvas);
      drawParticle(i, ctx);
    }
    
    ctx.restore();

    tickRef.current++;
    animationFrameId.current = requestAnimationFrame(() => draw(canvas, ctx));
  };

  const setup = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get parent dimensions
    const parent = canvas.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
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
  }, [isVisible, mode, particleCount, monochrome, baseHue, scaleOnHover]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && isVisible) {
        setup();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none z-0 ${className}`}>
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
};

export default ParticlesBackground;