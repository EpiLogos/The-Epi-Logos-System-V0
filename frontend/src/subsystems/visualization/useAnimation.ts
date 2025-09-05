/**
 * Animation Orchestration Hook
 * Orchestrates animation domain logic with React state and animation libraries
 * 
 * INTEGRATES: domains/visualization/animation.domain.ts with React state and anime.js
 * 
 * This hook is the ONLY layer that imports both domain logic and React.
 * Components consume this hook and are "dumb" presentation layers.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  createInitialAnimationValues,
  createInitialTorusState,
  createInitialTransitionState,
  calculateGlowIntensity,
  calculateColorHue,
  calculateTorusRotations,
  calculateParticleRotations,
  calculateBackgroundRotations,
  generateParticlePositions,
  calculateThemePalette,
  calculateTransitionPhases,
  calculateTextTransition,
  calculateShaderUniforms,
  isValidTransitionPhase,
  lerp,
  smoothStep,
  type AnimationValues,
  type TorusAnimationState,
  type TransitionState,
  type ThemePalette,
  type ShaderUniforms,
  type ParticleSystemConfig
} from '@/domains/visualization/animation.domain';

export interface UseAnimationReturn {
  // Animation state
  animationValues: AnimationValues;
  torusState: TorusAnimationState;
  transitionState: TransitionState;
  theme: ThemePalette;
  
  // Animation calculations
  calculateGlowIntensity: (elapsedTime: number) => number;
  calculateColorHue: (elapsedTime: number) => number;
  calculateTorusRotations: (elapsedTime: number) => any;
  calculateParticleRotations: (elapsedTime: number) => any;
  calculateBackgroundRotations: (elapsedTime: number) => any;
  calculateTextTransition: (currentY: number, isTransitioning: boolean) => any;
  calculateShaderUniforms: (elapsedTime: number, baseUniforms?: Partial<ShaderUniforms>) => ShaderUniforms;
  
  // Particle system
  generateParticles: (count: number) => ParticleSystemConfig;
  
  // Transition controls
  startTransition: () => void;
  setTransitionPhase: (phase: TransitionState['phase']) => void;
  updateTransitionProgress: (progress: number) => void;
  
  // Theme controls
  setTheme: (theme: string) => void;
  
  // Utility functions
  lerp: (start: number, end: number, factor: number) => number;
  smoothStep: (edge0: number, edge1: number, x: number) => number;
}

export const useAnimation = (initialTheme: string = 'dark'): UseAnimationReturn => {
  const [animationValues, setAnimationValues] = useState<AnimationValues>(createInitialAnimationValues());
  const [torusState, setTorusState] = useState<TorusAnimationState>(createInitialTorusState());
  const [transitionState, setTransitionStateInternal] = useState<TransitionState>(createInitialTransitionState());
  const [theme, setThemeInternal] = useState<ThemePalette>(calculateThemePalette(initialTheme));
  const [particleConfig, setParticleConfig] = useState<ParticleSystemConfig | null>(null);

  // Memoized calculation functions that use domain logic
  const calculateGlow = useCallback((elapsedTime: number): number => {
    return calculateGlowIntensity(elapsedTime, animationValues.glowIntensity);
  }, [animationValues.glowIntensity]);

  const calculateHue = useCallback((elapsedTime: number): number => {
    return calculateColorHue(elapsedTime, animationValues.colorShift);
  }, [animationValues.colorShift]);

  const calculateTorus = useCallback((elapsedTime: number) => {
    return calculateTorusRotations(elapsedTime, torusState);
  }, [torusState]);

  const calculateParticles = useCallback((elapsedTime: number) => {
    return calculateParticleRotations(elapsedTime);
  }, []);

  const calculateBackground = useCallback((elapsedTime: number) => {
    return calculateBackgroundRotations(elapsedTime);
  }, []);

  const calculateText = useCallback((currentY: number, isTransitioning: boolean) => {
    return calculateTextTransition(currentY, isTransitioning);
  }, []);

  const calculateShader = useCallback((elapsedTime: number, baseUniforms?: Partial<ShaderUniforms>): ShaderUniforms => {
    return calculateShaderUniforms(elapsedTime, baseUniforms || {});
  }, []);

  // Particle system management
  const generateParticles = useCallback((count: number): ParticleSystemConfig => {
    const positions = generateParticlePositions(count);
    const config: ParticleSystemConfig = {
      particleCount: count,
      positions,
      rotationSpeed: 0.1,
      oscillationAmount: 0.1
    };
    
    setParticleConfig(config);
    return config;
  }, []);

  // Transition management
  const startTransition = useCallback(() => {
    setTransitionStateInternal(prev => ({
      ...prev,
      phase: 'initiating',
      isTransitioning: true
    }));
  }, []);

  const setTransitionPhase = useCallback((phase: TransitionState['phase']) => {
    if (!isValidTransitionPhase(phase)) {
      console.warn(`Invalid transition phase: ${phase}`);
      return;
    }

    setTransitionStateInternal(prev => ({
      ...prev,
      phase,
      isTransitioning: phase !== 'idle' && phase !== 'complete'
    }));
  }, []);

  const updateTransitionProgress = useCallback((progress: number) => {
    setTransitionStateInternal(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(1, progress))
    }));
  }, []);

  // Theme management
  const setTheme = useCallback((themeName: string) => {
    const newTheme = calculateThemePalette(themeName);
    setThemeInternal(newTheme);
  }, []);

  const value: UseAnimationReturn = {
    // State
    animationValues,
    torusState,
    transitionState,
    theme,
    
    // Calculations
    calculateGlowIntensity: calculateGlow,
    calculateColorHue: calculateHue,
    calculateTorusRotations: calculateTorus,
    calculateParticleRotations: calculateParticles,
    calculateBackgroundRotations: calculateBackground,
    calculateTextTransition: calculateText,
    calculateShaderUniforms: calculateShader,
    
    // Particle system
    generateParticles,
    
    // Transition controls
    startTransition,
    setTransitionPhase,
    updateTransitionProgress,
    
    // Theme controls
    setTheme,
    
    // Utility functions
    lerp,
    smoothStep
  };

  return value;
};