/**
 * Auth Domain Exports
 * Central export point for all auth domain logic
 *
 * UPDATED: Now includes canonical types and validation logic
 */

// Canonical types - SINGLE SOURCE OF TRUTH
export * from './canonical-user.types';

// Validation domain logic
export * from './validation.domain';

// Core auth domain logic
export * from './auth.domain';

// OAuth domain logic
export * from './oauth.domain';

// Session management domain logic
export * from './session.domain';