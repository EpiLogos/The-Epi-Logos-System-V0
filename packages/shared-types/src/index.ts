/**
 * Shared TypeScript type definitions for the Epi-Logos System
 * 
 * This package provides the core type definitions used across
 * the tri-laminar architecture (Frontend, Agentic, Backend).
 */

// Core Bimba Map types
export * from './BimbaNode';
export * from './User';
export * from './WisdomPacket';

// API and communication types
export * from './ApiTypes';
export * from './GraphQLTypes';

// Agentic layer types
export * from './PersonaTypes';
export * from './AgenticTypes';

// Database types
export * from './DatabaseTypes';
