/**
 * Centralized Subsystem Color Palette System
 * 
 * Establishes the cosmic black backgrounds and philosopher white text styling
 * with subsystem-specific color palettes for each coordinate branch.
 * Implements sleek, minimalistic, modern styling with thin borders.
 */

export interface SubsystemTheme {
  name: string;
  color: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundAlt: string;
  text: string;
  textMuted: string;
  border: string;
  borderThin: string;
  glow: string;
  description: string;
}

export interface ThemeSystem {
  cosmic: {
    black: string;
    blackAlt: string;
    white: string;
    whiteMuted: string;
    border: string;
    borderThin: string;
  };
  subsystems: Record<number, SubsystemTheme>;
}

// Base cosmic colors - the foundation of the design system
const COSMIC_COLORS = {
  black: '#000000',
  blackAlt: '#0a0a0a',
  white: '#ffffff',
  whiteMuted: 'rgba(255, 255, 255, 0.8)',
  border: 'rgba(255, 255, 255, 0.2)',
  borderThin: 'rgba(255, 255, 255, 0.1)',
} as const;

// Enhanced subsystem themes with full color definitions
export const SUBSYSTEM_THEMES: Record<number, SubsystemTheme> = {
  0: {
    name: 'Anuttara',
    color: 'rgba(147, 51, 234, 0.8)',
    primary: '#9333ea',
    secondary: '#a855f7',
    accent: '#c084fc',
    background: COSMIC_COLORS.black,
    backgroundAlt: COSMIC_COLORS.blackAlt,
    text: COSMIC_COLORS.white,
    textMuted: COSMIC_COLORS.whiteMuted,
    border: 'rgba(147, 51, 234, 0.3)',
    borderThin: 'rgba(147, 51, 234, 0.15)',
    glow: 'rgba(147, 51, 234, 0.5)',
    description: 'Absolute Ground & Proto-Logical Processing'
  },
  1: {
    name: 'Paramasiva',
    color: 'rgba(236, 72, 153, 0.8)',
    primary: '#ec4899',
    secondary: '#f472b6',
    accent: '#f9a8d4',
    background: COSMIC_COLORS.black,
    backgroundAlt: COSMIC_COLORS.blackAlt,
    text: COSMIC_COLORS.white,
    textMuted: COSMIC_COLORS.whiteMuted,
    border: 'rgba(236, 72, 153, 0.3)',
    borderThin: 'rgba(236, 72, 153, 0.15)',
    glow: 'rgba(236, 72, 153, 0.5)',
    description: 'Foundational Architect of Quaternal Logic'
  },
  2: {
    name: 'Parashakti',
    color: 'rgba(34, 197, 94, 0.8)',
    primary: '#22c55e',
    secondary: '#4ade80',
    accent: '#86efac',
    background: COSMIC_COLORS.black,
    backgroundAlt: COSMIC_COLORS.blackAlt,
    text: COSMIC_COLORS.white,
    textMuted: COSMIC_COLORS.whiteMuted,
    border: 'rgba(34, 197, 94, 0.3)',
    borderThin: 'rgba(34, 197, 94, 0.15)',
    glow: 'rgba(34, 197, 94, 0.5)',
    description: 'Cosmic Imagination & Vibrational Matrix'
  },
  3: {
    name: 'Mahamaya',
    color: 'rgba(251, 191, 36, 0.8)',
    primary: '#fbbf24',
    secondary: '#fcd34d',
    accent: '#fde68a',
    background: COSMIC_COLORS.black,
    backgroundAlt: COSMIC_COLORS.blackAlt,
    text: COSMIC_COLORS.white,
    textMuted: COSMIC_COLORS.whiteMuted,
    border: 'rgba(251, 191, 36, 0.3)',
    borderThin: 'rgba(251, 191, 36, 0.15)',
    glow: 'rgba(251, 191, 36, 0.5)',
    description: 'Universal Transcription Engine'
  },
  4: {
    name: 'Nara',
    color: 'rgba(239, 68, 68, 0.8)',
    primary: '#ef4444',
    secondary: '#f87171',
    accent: '#fca5a5',
    background: COSMIC_COLORS.black,
    backgroundAlt: COSMIC_COLORS.blackAlt,
    text: COSMIC_COLORS.white,
    textMuted: COSMIC_COLORS.whiteMuted,
    border: 'rgba(239, 68, 68, 0.3)',
    borderThin: 'rgba(239, 68, 68, 0.15)',
    glow: 'rgba(239, 68, 68, 0.5)',
    description: 'Dialogical-Identity Processing'
  },
  5: {
    name: 'Epii',
    color: 'rgba(59, 130, 246, 0.8)',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#93c5fd',
    background: COSMIC_COLORS.black,
    backgroundAlt: COSMIC_COLORS.blackAlt,
    text: COSMIC_COLORS.white,
    textMuted: COSMIC_COLORS.whiteMuted,
    border: 'rgba(59, 130, 246, 0.3)',
    borderThin: 'rgba(59, 130, 246, 0.15)',
    glow: 'rgba(59, 130, 246, 0.5)',
    description: 'Synthesis & Orchestration Processing'
  },
} as const;

// Complete theme system export
export const THEME_SYSTEM: ThemeSystem = {
  cosmic: COSMIC_COLORS,
  subsystems: SUBSYSTEM_THEMES,
} as const;

// Helper function to get subsystem theme by coordinate
export function getSubsystemTheme(coordinate: string): SubsystemTheme | null {
  const match = coordinate.match(/^#(\d)/);
  if (!match) return null;
  
  const subsystemIndex = parseInt(match[1], 10);
  return SUBSYSTEM_THEMES[subsystemIndex] || null;
}

// Helper function to apply theme styles
export function applyThemeStyles(theme: SubsystemTheme): React.CSSProperties {
  return {
    backgroundColor: theme.background,
    color: theme.text,
    borderColor: theme.borderThin,
    '--theme-primary': theme.primary,
    '--theme-secondary': theme.secondary,
    '--theme-accent': theme.accent,
    '--theme-glow': theme.glow,
  } as React.CSSProperties;
}

export default THEME_SYSTEM;