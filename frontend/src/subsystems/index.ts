/**
 * Subsystems Root Export
 * Central export point for all orchestration hooks across the Epi-Logos System
 * 
 * This file provides access to all orchestration hooks that bridge domain logic
 * with React state management and infrastructure concerns.
 */

// Auth subsystem orchestration hooks (#4 Nara - User interaction)
export * from './auth';

// Navigation subsystem orchestration hooks (#0-#5 All coordinates)
export * from './navigation';

// AGUI subsystem orchestration hooks (#5 Epii - Synthesis & orchestration) 
export * from './agui';

// Visualization subsystem orchestration hooks (#2 Parashakti - Cosmic imagination)
export * from './visualization';

/**
 * Orchestration Layer Architecture Overview:
 * 
 * This orchestration layer implements the "Wall Sockets" pattern from the 
 * Decoupled Domain Pattern specification:
 * 
 * - **Power Plant (Domain Logic)**: Pure TypeScript functions (domains/)
 * - **Wall Sockets (Custom Hooks)**: React-specific orchestration layer (this layer)
 * - **Appliances (Components)**: Dumb presentation layer (components/)
 * 
 * All hooks in this layer:
 * 1. Import and orchestrate domain functions
 * 2. Manage React state (useState, useEffect, useReducer)
 * 3. Handle infrastructure calls (API clients, storage, routing)
 * 4. Provide clean interface to components
 * 5. Are the ONLY layer importing both domain and React
 * 6. Follow coordinate-aware subsystem boundaries
 */