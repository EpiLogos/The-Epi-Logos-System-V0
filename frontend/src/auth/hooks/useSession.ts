"use client";

/**
 * useSession Hook
 * Session management hook with token handling and validation
 *
 * This hook provides session-specific functionality including token
 * management, session validation, and session lifecycle operations.
 */

import { useCallback, useEffect, useState } from 'react';
import { useUnifiedAuth } from '../unified-auth-context';
import type { AuthTokens, AuthSession } from '@/domains/auth';

/**
 * Session hook interface
 */
export interface UseSessionReturn {
  // Session state
  session: AuthSession | null;
  tokens: AuthTokens | null;
  isValid: boolean;
  isExpired: boolean;
  timeRemaining: number; // milliseconds until expiration
  
  // Session actions
  refreshTokens: () => Promise<void>;
  validateSession: () => boolean;
  clearSession: () => Promise<void>;
  
  // Token helpers
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  getAuthHeader: () => string | null;
  shouldRefresh: () => boolean;
  
  // Session info
  getSessionInfo: () => SessionInfo;
}

/**
 * Session information interface
 */
export interface SessionInfo {
  isActive: boolean;
  createdAt?: string;
  expiresAt?: string;
  timeRemaining: number;
  tokenType?: string;
  hasRefreshToken: boolean;
}

/**
 * Session management hook
 * 
 * Provides comprehensive session management functionality including
 * token validation, automatic refresh, and session lifecycle management.
 * 
 * @example
 * ```tsx
 * function SessionStatus() {
 *   const { 
 *     isValid, 
 *     timeRemaining, 
 *     shouldRefresh, 
 *     refreshTokens 
 *   } = useSession();
 * 
 *   useEffect(() => {
 *     if (shouldRefresh()) {
 *       refreshTokens();
 *     }
 *   }, [shouldRefresh, refreshTokens]);
 * 
 *   return (
 *     <div>
 *       Session: {isValid ? 'Valid' : 'Invalid'}
 *       {isValid && <span>Expires in: {Math.floor(timeRemaining / 60000)} minutes</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSession(): UseSessionReturn {
  const context = useUnifiedAuth();
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Calculate time remaining until token expiration
  useEffect(() => {
    if (!context.tokens?.expiresAt) {
      setTimeRemaining(0);
      return;
    }

    const updateTimeRemaining = () => {
      try {
        const expirationTime = new Date(context.tokens!.expiresAt).getTime();
        const currentTime = Date.now();
        const remaining = Math.max(0, expirationTime - currentTime);
        setTimeRemaining(remaining);
      } catch (error) {
        setTimeRemaining(0);
      }
    };

    // Update immediately
    updateTimeRemaining();

    // Update every minute
    const interval = setInterval(updateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [context.tokens?.expiresAt]);

  // Create session object from context
  const session: AuthSession | null = context.isAuthenticated && context.user ? {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    tokens: context.tokens,
    linkedAccount: context.linkedAccount
  } : null;

  // Check if session is expired
  const isExpired = useCallback((): boolean => {
    if (!context.tokens?.expiresAt) return true;
    
    try {
      const expirationTime = new Date(context.tokens.expiresAt).getTime();
      const currentTime = Date.now();
      return currentTime >= expirationTime;
    } catch (error) {
      return true;
    }
  }, [context.tokens?.expiresAt]);

  // Check if tokens should be refreshed (within 10 minutes of expiration)
  const shouldRefresh = useCallback((): boolean => {
    if (!context.tokens?.expiresAt || !context.tokens?.refreshToken) return false;
    
    try {
      const expirationTime = new Date(context.tokens.expiresAt).getTime();
      const currentTime = Date.now();
      const refreshThreshold = 10 * 60 * 1000; // 10 minutes
      
      return currentTime >= (expirationTime - refreshThreshold) && currentTime < expirationTime;
    } catch (error) {
      return false;
    }
  }, [context.tokens]);

  // Validate session
  const validateSession = useCallback((): boolean => {
    return context.isSessionValid();
  }, [context]);

  // Clear session
  const clearSession = useCallback(async () => {
    await context.signOut();
  }, [context]);

  // Token helpers
  const getAccessToken = useCallback((): string | null => {
    return context.tokens?.accessToken || null;
  }, [context.tokens]);

  const getRefreshToken = useCallback((): string | null => {
    return context.tokens?.refreshToken || null;
  }, [context.tokens]);

  const getAuthHeader = useCallback((): string | null => {
    return context.getAuthHeader();
  }, [context]);

  // Get comprehensive session info
  const getSessionInfo = useCallback((): SessionInfo => {
    return {
      isActive: context.isAuthenticated,
      expiresAt: context.tokens?.expiresAt,
      timeRemaining,
      tokenType: context.tokens?.tokenType,
      hasRefreshToken: !!context.tokens?.refreshToken
    };
  }, [context.isAuthenticated, context.tokens, timeRemaining]);

  return {
    // State
    session,
    tokens: context.tokens,
    isValid: validateSession() && !isExpired(),
    isExpired: isExpired(),
    timeRemaining,

    // Actions
    refreshTokens: context.refreshTokens,
    validateSession,
    clearSession,

    // Token helpers
    getAccessToken,
    getRefreshToken,
    getAuthHeader,
    shouldRefresh,

    // Session info
    getSessionInfo
  };
}

/**
 * Session monitor hook
 * 
 * Automatically monitors session state and handles token refresh.
 * 
 * @example
 * ```tsx
 * function App() {
 *   useSessionMonitor({
 *     autoRefresh: true,
 *     onExpired: () => {
 *       console.log('Session expired');
 *       // Redirect to login
 *     },
 *     onRefreshFailed: (error) => {
 *       console.error('Token refresh failed:', error);
 *     }
 *   });
 * 
 *   return <AppContent />;
 * }
 * ```
 */
export function useSessionMonitor(options: {
  autoRefresh?: boolean;
  refreshThresholdMinutes?: number;
  onExpired?: () => void;
  onRefreshSuccess?: () => void;
  onRefreshFailed?: (error: Error) => void;
} = {}) {
  const {
    autoRefresh = true,
    refreshThresholdMinutes = 10,
    onExpired,
    onRefreshSuccess,
    onRefreshFailed
  } = options;

  const { 
    isValid, 
    isExpired, 
    shouldRefresh, 
    refreshTokens, 
    timeRemaining,
    tokens 
  } = useSession();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<number>(0);

  // Monitor session expiration
  useEffect(() => {
    if (isExpired && onExpired) {
      onExpired();
    }
  }, [isExpired, onExpired]);

  // Auto-refresh tokens
  useEffect(() => {
    if (!autoRefresh || !shouldRefresh() || isRefreshing) return;

    // Prevent multiple refresh attempts within 1 minute
    const now = Date.now();
    if (now - lastRefreshAttempt < 60000) return;

    const performRefresh = async () => {
      try {
        setIsRefreshing(true);
        setLastRefreshAttempt(now);
        
        await refreshTokens();
        
        if (onRefreshSuccess) {
          onRefreshSuccess();
        }
      } catch (error) {
        console.error('Automatic token refresh failed:', error);
        
        if (onRefreshFailed) {
          onRefreshFailed(error as Error);
        }
      } finally {
        setIsRefreshing(false);
      }
    };

    performRefresh();
  }, [
    autoRefresh, 
    shouldRefresh, 
    refreshTokens, 
    isRefreshing, 
    lastRefreshAttempt,
    onRefreshSuccess,
    onRefreshFailed
  ]);

  return {
    isValid,
    isExpired,
    isRefreshing,
    timeRemaining,
    shouldRefresh: shouldRefresh(),
    hasTokens: !!tokens
  };
}

/**
 * Session storage hook
 * 
 * Provides direct access to session storage operations.
 * 
 * @example
 * ```tsx
 * function SessionDebug() {
 *   const { 
 *     getStoredSession, 
 *     clearStoredSession, 
 *     hasStoredSession 
 *   } = useSessionStorage();
 * 
 *   const handleClearStorage = async () => {
 *     await clearStoredSession();
 *     console.log('Session storage cleared');
 *   };
 * 
 *   return (
 *     <div>
 *       <p>Has stored session: {hasStoredSession ? 'Yes' : 'No'}</p>
 *       <button onClick={handleClearStorage}>Clear Storage</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSessionStorage() {
  const [hasStoredSession, setHasStoredSession] = useState(false);

  // Check if there's a stored session
  useEffect(() => {
    const checkStoredSession = () => {
      try {
        const authUser = sessionStorage.getItem('epi_logos_auth_user');
        const authTokens = sessionStorage.getItem('epi_logos_auth_tokens');
        setHasStoredSession(!!(authUser && authTokens));
      } catch (error) {
        setHasStoredSession(false);
      }
    };

    checkStoredSession();

    // Listen for storage changes
    const handleStorageChange = () => {
      checkStoredSession();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getStoredSession = useCallback(async (): Promise<AuthSession | null> => {
    try {
      const authUser = sessionStorage.getItem('epi_logos_auth_user');
      const authTokens = sessionStorage.getItem('epi_logos_auth_tokens');
      const authLinked = sessionStorage.getItem('epi_logos_auth_linked_account');

      if (!authUser) return null;

      const user = JSON.parse(authUser);
      const tokens = authTokens ? JSON.parse(authTokens) : null;
      const linkedAccount = authLinked ? JSON.parse(authLinked) : null;

      return {
        user,
        isAuthenticated: true,
        tokens,
        linkedAccount
      };
    } catch (error) {
      console.error('Failed to get stored session:', error);
      return null;
    }
  }, []);

  const clearStoredSession = useCallback(async (): Promise<void> => {
    try {
      sessionStorage.removeItem('epi_logos_auth_user');
      sessionStorage.removeItem('epi_logos_auth_tokens');
      sessionStorage.removeItem('epi_logos_auth_linked_account');
      setHasStoredSession(false);
    } catch (error) {
      console.error('Failed to clear stored session:', error);
    }
  }, []);

  return {
    hasStoredSession,
    getStoredSession,
    clearStoredSession
  };
}
