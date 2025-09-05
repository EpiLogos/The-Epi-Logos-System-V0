/**
 * Domains Root Export
 * Central export point for all domain logic across the entire Epi-Logos System
 * 
 * This file provides access to all pure domain logic functions that contain
 * zero React dependencies and can be used by any orchestration layer.
 */

// Auth subsystem domain logic (#4 Nara - User interaction)
export * from './auth';

// Navigation subsystem domain logic (#0-#5 All coordinates)
export * from './navigation';

// AGUI subsystem domain logic (#5 Epii - Synthesis & orchestration) 
export * from './agui';

// Visualization subsystem domain logic (#2 Parashakti - Cosmic imagination)
export * from './visualization';

// Errors subsystem domain logic (Cross-cutting concern)
export * from './errors';

/**
 * Domain Layer Architecture Overview:
 * 
 * This domain layer implements the "Power Plant" pattern from the 
 * Decoupled Domain Pattern specification:
 * 
 * - **Power Plant (Domain Logic)**: Pure TypeScript functions (this layer)
 * - **Wall Sockets (Custom Hooks)**: React-specific orchestration layer  
 * - **Appliances (Components)**: Dumb presentation layer
 * 
 * All functions in these domains are:
 * 1. Pure and side-effect free
 * 2. Fully testable without React or browser APIs
 * 3. Zero dependencies on React or UI frameworks
 * 4. Memoizable and cacheable
 * 5. Aligned with Epi-Logos coordinate system architecture
 */