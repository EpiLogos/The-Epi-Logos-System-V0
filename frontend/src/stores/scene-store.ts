"use client";

// Scene Store (Zustand)
// Manages 3D scene state: camera, controls, overlays, and performance flags.
// This avoids prop drilling and heavy React re-renders for animation state.

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  autoRotate: boolean;
}

interface ParticlesState {
  count: number;
  enabled: boolean;
}

interface SceneState {
  // Visual theme synchronized with UI store (optional)
  theme: 'light' | 'dark' | 'dark-theme';

  // Camera and controls
  camera: CameraState;
  setCamera: (partial: Partial<CameraState>) => void;

  // Performance and layers
  performanceMode: 'quality' | 'balanced' | 'speed';
  setPerformanceMode: (mode: SceneState['performanceMode']) => void;

  // Overlays and particles
  overlaysVisible: boolean;
  setOverlaysVisible: (visible: boolean) => void;
  particles: ParticlesState;
  setParticles: (partial: Partial<ParticlesState>) => void;

  // Theme control
  setTheme: (theme: SceneState['theme']) => void;
}

export const useSceneStore = create<SceneState>()(
  subscribeWithSelector((set) => ({
    theme: 'dark',
    camera: {
      position: [0, 0, 6],
      target: [0, 0, 0],
      autoRotate: true,
    },
    particles: {
      count: 50,
      enabled: true,
    },
    performanceMode: 'balanced',
    overlaysVisible: true,

    setCamera: (partial) => set((s) => ({ camera: { ...s.camera, ...partial } })),
    setPerformanceMode: (mode) => set({ performanceMode: mode }),
    setOverlaysVisible: (visible) => set({ overlaysVisible: visible }),
    setParticles: (partial) => set((s) => ({ particles: { ...s.particles, ...partial } })),
    setTheme: (theme) => set({ theme })
  }))
);

