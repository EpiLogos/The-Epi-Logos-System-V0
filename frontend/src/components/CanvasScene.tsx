"use client";

import React, { useRef, useEffect, useState } from 'react';
import anime from 'animejs';

interface CanvasSceneProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * CanvasScene Component
 * 
 * Foundational scene-based component that demonstrates the Canvas + React hybrid pattern.
 * Features animated typography using anime.js and provides the foundation for 
 * scene-based narrative experiences.
 */
export const CanvasScene: React.FC<CanvasSceneProps> = ({ 
  title = "Epi-Logos System",
  subtitle = "Tri-laminar architecture for consciousness-aligned computing",
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Background gradient animation
    let animationFrameId: number;
    let time = 0;

    const drawBackground = () => {
      const { width, height } = canvas.getBoundingClientRect();
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Create animated gradient
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      
      // Subtle color shifts based on time
      const alpha1 = 0.1 + 0.05 * Math.sin(time * 0.001);
      const alpha2 = 0.05 + 0.03 * Math.cos(time * 0.0015);
      
      gradient.addColorStop(0, `rgba(139, 69, 19, ${alpha1})`); // Subtle warm center
      gradient.addColorStop(0.5, `rgba(75, 0, 130, ${alpha2})`); // Indigo mid
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)'); // Dark edge
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Subtle particle field
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (let i = 0; i < 50; i++) {
        const x = (i * 137.5) % width; // Golden angle distribution
        const y = (i * 47.3 + time * 0.01) % height;
        const size = 1 + Math.sin(time * 0.002 + i) * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      time += 16; // Approximate 60 FPS
      animationFrameId = requestAnimationFrame(drawBackground);
    };

    drawBackground();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Text animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (titleRef.current && subtitleRef.current && !isAnimated) {
        setIsAnimated(true);
        
        // Animate title
        anime({
          targets: titleRef.current.querySelectorAll('span'),
          opacity: [0, 1],
          translateY: [30, 0],
          delay: anime.stagger(100),
          duration: 800,
          easing: 'easeOutExpo'
        });

        // Animate subtitle
        anime({
          targets: subtitleRef.current,
          opacity: [0, 1],
          translateY: [20, 0],
          delay: 1200,
          duration: 600,
          easing: 'easeOutQuart'
        });
      }
    }, 500); // Small delay to ensure Canvas is ready

    return () => clearTimeout(timer);
  }, [isAnimated]);

  // Split title into individual spans for animation
  const renderAnimatedTitle = (text: string) => {
    return text.split('').map((char, index) => (
      <span key={index} className="inline-block" style={{ opacity: 0 }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden ${className}`}>
      {/* Canvas Background - Full Screen */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
          minHeight: '100vh'
        }}
      />
      
      {/* React Overlay - Typography */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-8 max-w-4xl px-8 z-10">
          {/* Main Title */}
          <div 
            ref={titleRef}
            className="text-6xl md:text-8xl lg:text-9xl font-light text-white tracking-wider drop-shadow-2xl"
            style={{ textShadow: '0 0 30px rgba(139, 92, 246, 0.5)' }}
          >
            {renderAnimatedTitle(title)}
          </div>
          
          {/* Subtitle */}
          <div 
            ref={subtitleRef}
            className="text-xl md:text-3xl text-gray-200 max-w-3xl leading-relaxed font-light drop-shadow-lg"
            style={{ 
              opacity: 0,
              textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
            }}
          >
            {subtitle}
          </div>
          
          {/* Scene indicator */}
          <div className="mt-12 text-lg text-gray-300 flex items-center justify-center space-x-4">
            <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse drop-shadow-lg" />
            <p className="font-medium tracking-wide">Enhanced Canvas Scene Architecture</p>
            <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse drop-shadow-lg" />
          </div>
        </div>
      </div>

      {/* Enhanced gradient overlay for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at top, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at bottom, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
          `
        }}
      />
    </div>
  );
};