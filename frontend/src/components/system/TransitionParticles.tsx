'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GlowParticles } from './GlowParticles';
import { usePageTransition } from '@/contexts/PageTransitionContext';

interface TransitionParticlesProps {
  currentPage: 'auth' | 'account';
  parentRef?: React.RefObject<HTMLElement>;
  className?: string;
}

export function TransitionParticles({ 
  currentPage, 
  parentRef,
  className = '' 
}: TransitionParticlesProps) {
  const { transitionState } = usePageTransition();
  const [particleConfig, setParticleConfig] = useState({
    baseHue: currentPage === 'auth' ? 20 : 140, // Orange vs Green
    saturation: 70,
    lightness: 60,
    particleCount: 200,
  });

  // Update particle configuration based on transition state
  useEffect(() => {
    if (transitionState.isTransitioning) {
      if (transitionState.transitionType === 'auth-to-account') {
        // Transition from orange to green
        setParticleConfig({
          baseHue: 80, // Amber/yellow transition color
          saturation: 65,
          lightness: 55,
          particleCount: 300, // More particles during transition
        });
        
        // Complete transition to green
        setTimeout(() => {
          setParticleConfig({
            baseHue: 140, // Green
            saturation: 60,
            lightness: 55,
            particleCount: 260,
          });
        }, 750);
      } else if (transitionState.transitionType === 'account-to-auth') {
        // Transition from green to orange
        setParticleConfig({
          baseHue: 80, // Amber/yellow transition color
          saturation: 65,
          lightness: 55,
          particleCount: 300,
        });
        
        // Complete transition to orange
        setTimeout(() => {
          setParticleConfig({
            baseHue: 20, // Orange
            saturation: 70,
            lightness: 60,
            particleCount: 200,
          });
        }, 750);
      }
    } else {
      // Set final state based on current page
      if (currentPage === 'auth') {
        setParticleConfig({
          baseHue: 20, // Orange
          saturation: 70,
          lightness: 60,
          particleCount: 200,
        });
      } else {
        setParticleConfig({
          baseHue: 140, // Green
          saturation: 60,
          lightness: 55,
          particleCount: 260,
        });
      }
    }
  }, [transitionState, currentPage]);

  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      animate={{
        opacity: transitionState.isTransitioning ? [1, 0.7, 1] : 1,
      }}
      transition={{
        duration: transitionState.isTransitioning ? 1.5 : 0.5,
        ease: "easeInOut"
      }}
    >
      <GlowParticles
        isVisible={true}
        particleCount={particleConfig.particleCount}
        baseHue={particleConfig.baseHue}
        saturation={particleConfig.saturation}
        lightness={particleConfig.lightness}
        monochrome={false}
        mode="default"
        radiusScale={transitionState.isTransitioning ? 1.2 : 1.0}
        parentRef={parentRef}
      />
    </motion.div>
  );
}

// Card transition wrapper for auth/account content
interface TransitionCardProps {
  children: React.ReactNode;
  isVisible: boolean;
  delay?: number;
  className?: string;
}

export function TransitionCard({ 
  children, 
  isVisible, 
  delay = 0,
  className = '' 
}: TransitionCardProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        y: isVisible ? 0 : 20,
        scale: isVisible ? 1 : 0.95
      }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        duration: 0.6,
        delay,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
}
