/**
 * Auth Module Exports
 * Central export point for the unified authentication system
 * 
 * This module provides a complete authentication solution with:
 * - Domain-driven architecture
 * - Type-safe React integration
 * - Comprehensive route protection
 * - OAuth provider support
 * - Session management
 */

// Core context and provider
export { UnifiedAuthProvider, useUnifiedAuth } from './unified-auth-context';

// Domain-driven hooks
export * from './hooks';

// Route protection and UI components
export * from './components';

// Re-export domain types for convenience
export type {
  User,
  AuthState,
  AuthTokens,
  AuthSession,
  LinkedAccount,
  OAuthProvider,
  UserPreferences,
  UserProfile,
  UserMetadata
} from '@/domains/auth';

// Re-export infrastructure types for advanced usage
export type {
  SessionStorageAdapter,
  APIClientAdapter,
  OAuthProviderAdapter
} from '@/infrastructure/auth';
