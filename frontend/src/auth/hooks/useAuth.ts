"use client";

/**
 * useAuth Hook
 * Primary authentication hook that exposes core auth functionality
 *
 * This hook provides a clean interface to the unified auth context
 * with domain-driven patterns and comprehensive error handling.
 */

import { useCallback } from 'react';
import { useUnifiedAuth } from '../unified-auth-context';
import type { User } from '@/domains/auth';

/**
 * Core authentication hook interface
 */
export interface UseAuthReturn {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;

  // Authentication actions
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshTokens: () => Promise<void>;

  // User management
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;

  // Utility functions
  clearError: () => void;
  isSessionValid: () => boolean;
  getAuthHeader: () => string | null;

  // Authorization helpers
  canAccess: (requiredTier?: 'free' | 'patron', requireEmailVerification?: boolean) => boolean;
  canPerform: (action: string) => boolean;

  // User info helpers
  getUserDisplayName: () => string;
  hasProfilePicture: () => boolean;
  needsProfileCompletion: () => boolean;
  hasPassword: () => boolean;
  isEmailVerified: () => boolean;
  hasMFA: () => boolean;
  getUserTier: () => 'free' | 'patron';
}

/**
 * Primary authentication hook
 * 
 * Provides access to all core authentication functionality.
 * This should be the main hook used by most components.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { 
 *     isAuthenticated, 
 *     user, 
 *     signIn, 
 *     signOut,
 *     canAccess 
 *   } = useAuth();
 * 
 *   if (!isAuthenticated) {
 *     return <SignInForm onSignIn={signIn} />;
 *   }
 * 
 *   return (
 *     <div>
 *       <h1>Welcome, {user?.name}!</h1>
 *       {canAccess('patron') && <PremiumFeatures />}
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const context = useUnifiedAuth();

  // Enhanced user management with better error handling
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      await context.updateUser(updates);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }, [context]);

  const refreshProfile = useCallback(async () => {
    try {
      await context.refreshUser();
    } catch (error) {
      console.error('Profile refresh failed:', error);
      throw error;
    }
  }, [context]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      await context.changePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }, [context]);

  // Enhanced authorization helpers
  const canAccess = useCallback((
    requiredTier?: 'free' | 'patron',
    requireEmailVerification?: boolean
  ) => {
    return context.canAccess(requiredTier, requireEmailVerification);
  }, [context]);

  const canPerform = useCallback((action: string) => {
    return context.canPerform(action);
  }, [context]);

  // User info helpers
  const hasPassword = useCallback(() => {
    return context.user?.hasPassword ?? false;
  }, [context.user]);

  const isEmailVerified = useCallback(() => {
    return context.user?.isEmailVerified ?? false;
  }, [context.user]);

  const hasMFA = useCallback(() => {
    return context.user?.hasMFA ?? false;
  }, [context.user]);

  const getUserTier = useCallback((): 'free' | 'patron' => {
    return context.user?.tier ?? 'free';
  }, [context.user]);

  return {
    // State
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    user: context.user,
    error: context.error,

    // Actions
    signIn: context.signIn,
    signOut: context.signOut,
    refreshTokens: context.refreshTokens,
    updateProfile,
    refreshProfile,
    changePassword,

    // Utilities
    clearError: context.clearError,
    isSessionValid: context.isSessionValid,
    getAuthHeader: context.getAuthHeader,

    // Authorization
    canAccess,
    canPerform,

    // User info
    getUserDisplayName: context.getUserDisplayName,
    hasProfilePicture: context.hasProfilePicture,
    needsProfileCompletion: context.needsProfileCompletion,
    hasPassword,
    isEmailVerified,
    hasMFA,
    getUserTier
  };
}

/**
 * Simplified authentication hook for basic use cases
 * 
 * Provides only the most essential auth functionality.
 * Use this for components that only need basic auth state.
 * 
 * @example
 * ```tsx
 * function SimpleComponent() {
 *   const { isAuthenticated, user, signOut } = useAuthSimple();
 * 
 *   return isAuthenticated ? (
 *     <div>Hello {user?.name} <button onClick={signOut}>Sign Out</button></div>
 *   ) : (
 *     <div>Please sign in</div>
 *   );
 * }
 * ```
 */
export function useAuthSimple() {
  const { isAuthenticated, isLoading, user, signOut, error } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    user,
    signOut,
    error
  };
}

/**
 * Authentication state hook
 * 
 * Provides only the authentication state without actions.
 * Useful for components that only need to read auth state.
 * 
 * @example
 * ```tsx
 * function UserAvatar() {
 *   const { user, isAuthenticated } = useAuthState();
 * 
 *   if (!isAuthenticated || !user) {
 *     return <DefaultAvatar />;
 *   }
 * 
 *   return <img src={user.profilePicture} alt={user.name} />;
 * }
 * ```
 */
export function useAuthState() {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    error,
    getUserDisplayName,
    hasProfilePicture,
    needsProfileCompletion,
    hasPassword,
    isEmailVerified,
    getUserTier
  } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    getUserDisplayName,
    hasProfilePicture,
    needsProfileCompletion,
    hasPassword,
    isEmailVerified,
    getUserTier
  };
}

/**
 * Authentication actions hook
 * 
 * Provides only the authentication actions without state.
 * Useful for components that only need to trigger auth actions.
 * 
 * @example
 * ```tsx
 * function SignInForm() {
 *   const { signIn, clearError } = useAuthActions();
 *   const [credentials, setCredentials] = useState({ email: '', password: '' });
 * 
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     try {
 *       await signIn(credentials);
 *     } catch (error) {
 *       // Error is handled by context
 *     }
 *   };
 * 
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useAuthActions() {
  const { 
    signIn, 
    signOut, 
    refreshTokens,
    updateProfile,
    changePassword,
    clearError
  } = useAuth();

  return {
    signIn,
    signOut,
    refreshTokens,
    updateProfile,
    changePassword,
    clearError
  };
}

/**
 * Authorization hook
 * 
 * Provides authorization helpers for checking permissions.
 * 
 * @example
 * ```tsx
 * function PremiumFeature() {
 *   const { canAccess, canPerform } = useAuthz();
 * 
 *   if (!canAccess('patron')) {
 *     return <UpgradePrompt />;
 *   }
 * 
 *   if (!canPerform('admin_access')) {
 *     return <AccessDenied />;
 *   }
 * 
 *   return <AdminPanel />;
 * }
 * ```
 */
export function useAuthz() {
  const { canAccess, canPerform, user } = useAuth();

  return {
    canAccess,
    canPerform,
    user
  };
}
