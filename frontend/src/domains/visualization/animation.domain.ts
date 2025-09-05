/**
 * Animation Domain Logic
 * Pure functions for shader logic, animation calculations, and 3D scene management
 * 
 * EXTRACTED FROM: ThreeScene.tsx:245-360, 483-522, animation and shader logic
 * 
 * This domain contains zero React dependencies and pure business logic only.
 */

export interface AnimationValues {
  glowIntensity: number;
  colorShift: number;
  letterSpacing: number;
}

export interface TorusAnimationState {
  speedA: number;
  speedB: number;
  scale: number;
}

export interface TransitionState {
  phase: 'idle' | 'initiating' | 'frosting' | 'repositioning' | 'complete';
  progress: number;
  isTransitioning: boolean;
}

export interface ThemePalette {
  bgStart: string;
  bgEnd: string;
  primary: string;
  accent: string;
  text: string;
}

export interface ShaderUniforms {
  uTime: number;
  uColorA: string;
  uColorB: string;
  uAmplitude: number;
  uFrequency: number;
}

export interface ParticleSystemConfig {
  particleCount: number;
  positions: Float32Array;
  rotationSpeed: number;
  oscillationAmount: number;
}

/**
 * Animation timeline calculation functions
 * EXTRACTED FROM: ThreeScene.tsx:245-266
 */
export const calculateGlowIntensity = (elapsedTime: number, baseIntensity: number): number => {
  const glow = Math.sin(elapsedTime * 2) * 0.2 + 0.8;
  return baseIntensity * glow;
};

/**
 * Color shifting calculations for animations
 * EXTRACTED FROM: ThreeScene.tsx:275-276
 */
export const calculateColorHue = (elapsedTime: number, colorShift: number): number => {
  return (elapsedTime * 0.1 + colorShift) % 1;
};

/**
 * Torus rotation calculations
 * EXTRACTED FROM: ThreeScene.tsx:349-360
 */
export const calculateTorusRotations = (
  elapsedTime: number,
  animState: TorusAnimationState
) => {
  return {
    torusA: {
      rotationX: elapsedTime * 0.06 * animState.speedA,
      rotationY: elapsedTime * 0.09 * animState.speedA
    },
    torusB: {
      rotationY: -elapsedTime * 0.07 * animState.speedB,
      rotationZ: elapsedTime * 0.1 * animState.speedB
    }
  };
};

/**
 * Particle system rotation calculations
 * EXTRACTED FROM: ThreeScene.tsx:411-414
 */
export const calculateParticleRotations = (elapsedTime: number) => {
  return {
    rotationY: elapsedTime * 0.1,
    rotationX: Math.sin(elapsedTime * 0.2) * 0.1
  };
};

/**
 * Background elements rotation calculations  
 * EXTRACTED FROM: ThreeScene.tsx:447-451
 */
export const calculateBackgroundRotations = (elapsedTime: number) => {
  return {
    rotationY: elapsedTime * 0.05,
    rotationX: Math.sin(elapsedTime * 0.1) * 0.1
  };
};

/**
 * Generate particle positions
 * EXTRACTED FROM: ThreeScene.tsx:400-408
 */
export const generateParticlePositions = (particleCount: number): Float32Array => {
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  return positions;
};

/**
 * Theme palette calculation
 * EXTRACTED FROM: ThreeScene.tsx:549-578
 */
export const calculateThemePalette = (theme: string): ThemePalette => {
  switch (theme) {
    case 'light':
      return {
        bgStart: '#e8ebff',
        bgEnd: '#ffffff',
        primary: '#6366f1',
        accent: '#3b82f6',
        text: '#111827',
      };
    case 'dark-theme':
      return {
        bgStart: '#1a3c47',
        bgEnd: '#000000',
        primary: '#8b5cf6',
        accent: '#60a5fa',
        text: '#e5e7eb',
      };
    case 'dark':
    default:
      return {
        bgStart: '#1e1b4b',
        bgEnd: '#000000',
        primary: '#8b5cf6',
        accent: '#3b82f6',
        text: '#ffffff',
      };
  }
};

/**
 * Transition timeline calculation
 * EXTRACTED FROM: ThreeScene.tsx:483-522
 */
export const calculateTransitionPhases = () => {
  return {
    frostPhase: {
      duration: 2500,
      delay: 500,
      easing: 'easeInOutQuad'
    },
    repositioningPhase: {
      duration: 2000,
      delay: -1500,
      easing: 'easeInOutCubic'
    }
  };
};

/**
 * Text position calculations during transition
 * EXTRACTED FROM: ThreeScene.tsx:279-290
 */
export const calculateTextTransition = (
  currentY: number,
  isTransitioning: boolean,
  lerpFactor: number = 0.02
): { positionY: number; scale: number } => {
  if (!isTransitioning) {
    return { positionY: currentY, scale: 1.0 };
  }

  const targetY = 0;
  const targetScale = 1.4;
  
  return {
    positionY: currentY + (targetY - currentY) * lerpFactor,
    scale: 1.0 + (targetScale - 1.0) * lerpFactor
  };
};

/**
 * Shader uniform calculations
 */
export const calculateShaderUniforms = (
  elapsedTime: number,
  baseUniforms: Partial<ShaderUniforms>
): ShaderUniforms => {
  return {
    uTime: elapsedTime,
    uColorA: baseUniforms.uColorA || '#ff6b6b',
    uColorB: baseUniforms.uColorB || '#4ecdc4',
    uAmplitude: baseUniforms.uAmplitude || 0.5,
    uFrequency: baseUniforms.uFrequency || 2.0,
  };
};

/**
 * Create initial animation values
 */
export const createInitialAnimationValues = (): AnimationValues => {
  return {
    glowIntensity: 0.5,
    colorShift: 0.0,
    letterSpacing: 0.1
  };
};

/**
 * Create initial torus animation state
 */
export const createInitialTorusState = (): TorusAnimationState => {
  return {
    speedA: 0.6,
    speedB: 0.8,
    scale: 1.0
  };
};

/**
 * Create initial transition state
 */
export const createInitialTransitionState = (): TransitionState => {
  return {
    phase: 'idle',
    progress: 0,
    isTransitioning: false
  };
};

/**
 * Validate transition phase
 */
export const isValidTransitionPhase = (
  phase: string
): phase is TransitionState['phase'] => {
  return ['idle', 'initiating', 'frosting', 'repositioning', 'complete'].includes(phase);
};

/**
 * Calculate lerp between two values
 */
export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

/**
 * Calculate smooth step interpolation
 */
export const smoothStep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};