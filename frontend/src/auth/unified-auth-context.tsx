"use client";

/**
 * Unified Auth Context
 * Domain-driven authentication context that replaces all existing auth implementations
 * 
 * This context uses:
 * - Domain layer for pure business logic
 * - Infrastructure layer for external dependencies
 * - Clean separation of concerns
 * - Comprehensive error handling
 * - Type safety throughout
 */

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

// Domain imports
import {
  User,
  AuthState,
  AuthTokens,
  AuthSession,
  LinkedAccount,
  createInitialAuthState,
  createAuthenticatedState,
  createUnauthenticatedState,
  createLoadingState,
  createErrorState,
  validateAuthState,
  isCompleteAuthentication,
  canUserAccessResource,
  canUserPerformAction,
  processSignIn,
  processSignOut,
  processTokenRefresh,
  processUserUpdate,
  isValidUser,
  getUserDisplayName
} from '@/domains/auth';

// Infrastructure imports
import {
  SessionStorageAdapter,
  createSessionStorageAdapter,
  APIClientAdapter,
  createAPIClient,
  APIError,
  TokenExpiredError,
  NetworkError
} from '@/infrastructure/auth';

/**
 * Auth context value interface
 */
export interface UnifiedAuthContextValue extends AuthState {
  // Authentication actions
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  
  // OAuth actions
  initiateOAuth: (provider: string, returnUrl?: string, linkAccount?: boolean) => Promise<string>;
  completeOAuth: (provider: string, code: string, state: string) => Promise<void>;
  setAuthFromData: (authData: { user: User; tokens: AuthTokens; linkedAccount?: LinkedAccount }) => Promise<void>;
  
  // User actions
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  reloadFromStorage: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Account linking
  linkAccount: (provider: string, code: string, state: string) => Promise<void>;
  unlinkAccount: (provider: string) => Promise<void>;
  
  // Utility functions
  clearError: () => void;
  isSessionValid: () => boolean;
  getAuthHeader: () => string | null;
  canAccess: (requiredTier?: 'free' | 'patron', requireEmailVerification?: boolean) => boolean;
  canPerform: (action: string) => boolean;
  
  // State helpers
  getUserDisplayName: () => string;
  hasProfilePicture: () => boolean;
  needsProfileCompletion: () => boolean;
}

/**
 * Auth context configuration
 */
interface AuthContextConfig {
  apiBaseURL?: string;
  enableAutoRefresh?: boolean;
  refreshThresholdMinutes?: number;
  storageType?: 'localStorage' | 'sessionStorage';
  onAuthError?: (error: Error) => void;
  onTokenRefresh?: (tokens: AuthTokens) => void;
}

// Context creation
const UnifiedAuthContext = createContext<UnifiedAuthContextValue | undefined>(undefined);

/**
 * Unified Auth Provider
 */
export function UnifiedAuthProvider({ 
  children, 
  config = {} 
}: { 
  children: ReactNode;
  config?: AuthContextConfig;
}) {
  // State management
  const [authState, setAuthState] = useState<AuthState>(createInitialAuthState());
  const [mounted, setMounted] = useState(false);
  
  // Infrastructure adapters
  const [storageAdapter] = useState<SessionStorageAdapter>(() => 
    createSessionStorageAdapter({
      storageType: config.storageType || 'sessionStorage',
      useEncryption: false // Can be enabled in production
    })
  );
  
  const [apiClient] = useState<APIClientAdapter>(() => 
    createAPIClient({
      baseURL: config.apiBaseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      enableAutoRefresh: config.enableAutoRefresh !== false,
      onTokenRefresh: config.onTokenRefresh,
      onAuthError: config.onAuthError
    })
  );

  // Initialize authentication state on mount
  useEffect(() => {
    setMounted(true);
    initializeAuth();
  }, []);

  // Update API client token when auth state changes
  useEffect(() => {
    if (authState.tokens?.accessToken) {
      apiClient.setAuthToken(authState.tokens.accessToken);
    } else {
      apiClient.clearAuthToken();
    }
  }, [authState.tokens, apiClient]);

  /**
   * Initialize authentication from stored session
   */
  const initializeAuth = useCallback(async () => {
    try {
      setAuthState(createLoadingState());

      // Retrieve session from storage
      const session = await storageAdapter.retrieveSession();
      
      if (!session || !session.isAuthenticated || !session.user) {
        setAuthState(createUnauthenticatedState());
        return;
      }

      // Validate session data
      if (!isValidUser(session.user)) {
        console.warn('Invalid user data in stored session, clearing...');
        await storageAdapter.clearSession();
        setAuthState(createUnauthenticatedState());
        return;
      }

      // Check if tokens are expired and need refresh
      if (session.tokens && shouldRefreshTokens(session.tokens)) {
        try {
          await performTokenRefresh(session.tokens.refreshToken);
          return; // performTokenRefresh will update the state
        } catch (error) {
          console.error('Token refresh failed during initialization:', error);
          await handleSignOut();
          return;
        }
      }

      // Session is valid, set authenticated state
      setAuthState(createAuthenticatedState(session.user, session.tokens, session.linkedAccount));
      
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setAuthState(createErrorState('Failed to initialize authentication'));
    }
  }, [storageAdapter]);

  /**
   * Check if tokens should be refreshed
   */
  const shouldRefreshTokens = (tokens: AuthTokens): boolean => {
    try {
      const expirationTime = new Date(tokens.expiresAt).getTime();
      const currentTime = Date.now();
      const refreshThreshold = (config.refreshThresholdMinutes || 10) * 60 * 1000;
      
      return currentTime >= (expirationTime - refreshThreshold);
    } catch (error) {
      return true; // If we can't parse expiration, assume refresh needed
    }
  };

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      setAuthState(prev => createLoadingState(prev.user, prev.tokens, prev.linkedAccount));

      const response = await apiClient.signIn(credentials);
      
      // Process sign-in through domain logic
      const newState = processSignIn(authState, response.user, response.tokens, response.linkedAccount);
      
      // Validate the new state
      if (!validateAuthState(newState)) {
        throw new Error('Invalid authentication state after sign-in');
      }

      // Persist session
      if (newState.isAuthenticated && newState.user && newState.tokens) {
        const session: AuthSession = {
          user: newState.user,
          isAuthenticated: true,
          tokens: newState.tokens,
          linkedAccount: newState.linkedAccount
        };
        await storageAdapter.storeSession(session);
      }

      setAuthState(newState);
      
    } catch (error) {
      console.error('Sign-in failed:', error);
      
      let errorMessage = 'Sign-in failed';
      if (error instanceof APIError) {
        errorMessage = error.message;
      } else if (error instanceof NetworkError) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setAuthState(prev => createErrorState(errorMessage, prev.user, prev.tokens, prev.linkedAccount));
      throw error;
    }
  }, [authState, apiClient, storageAdapter]);

  /**
   * Sign out and clear all auth data
   */
  const signOut = useCallback(async () => {
    await handleSignOut();
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      // Call API sign-out endpoint if authenticated
      if (authState.isAuthenticated) {
        try {
          await apiClient.signOut();
        } catch (error) {
          // Continue with local sign-out even if API call fails
          console.warn('API sign-out failed, continuing with local sign-out:', error);
        }
      }

      // Clear storage
      await storageAdapter.clearSession();
      
      // Clear API client token
      apiClient.clearAuthToken();
      
      // Update state through domain logic
      const newState = processSignOut(authState);
      setAuthState(newState);
      
    } catch (error) {
      console.error('Sign-out failed:', error);
      
      // Force local sign-out even if there are errors
      await storageAdapter.clearSession();
      apiClient.clearAuthToken();
      setAuthState(createUnauthenticatedState());
    }
  }, [authState, apiClient, storageAdapter]);

  /**
   * Refresh authentication tokens
   */
  const refreshTokens = useCallback(async () => {
    if (!authState.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    await performTokenRefresh(authState.tokens.refreshToken);
  }, [authState.tokens]);

  const performTokenRefresh = useCallback(async (refreshToken: string) => {
    try {
      setAuthState(prev => createLoadingState(prev.user, prev.tokens, prev.linkedAccount));

      const response = await apiClient.refreshTokens(refreshToken);
      
      // Process token refresh through domain logic
      const newState = processTokenRefresh(authState, response.tokens);
      
      // Update storage
      if (newState.isAuthenticated && newState.user && newState.tokens) {
        const session: AuthSession = {
          user: newState.user,
          isAuthenticated: true,
          tokens: newState.tokens,
          linkedAccount: newState.linkedAccount
        };
        await storageAdapter.storeSession(session);
      }

      setAuthState(newState);
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      if (error instanceof TokenExpiredError || error instanceof APIError) {
        // Refresh token is invalid, sign out
        await handleSignOut();
      } else {
        setAuthState(prev => createErrorState('Token refresh failed', prev.user, prev.tokens, prev.linkedAccount));
      }
      
      throw error;
    }
  }, [authState, apiClient, storageAdapter, handleSignOut]);

  /**
   * Initiate OAuth flow
   */
  const initiateOAuth = useCallback(async (
    provider: string, 
    returnUrl: string = window.location.href,
    linkAccount: boolean = false
  ): Promise<string> => {
    try {
      // Generate PKCE parameters (this would use domain logic)
      const codeChallenge = 'mock-challenge'; // TODO: Use actual PKCE generation
      const state = 'mock-state'; // TODO: Use actual state generation
      const nonce = 'mock-nonce'; // TODO: Use actual nonce generation

      const response = await apiClient.initiateOAuth(provider, {
        returnUrl,
        linkAccount,
        codeChallenge,
        codeChallengeMethod: 'S256',
        nonce,
        state
      });

      return response.authorizationUrl;
      
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      throw error;
    }
  }, [apiClient]);

  /**
   * Complete OAuth flow
   */
  const completeOAuth = useCallback(async (provider: string, code: string, state: string) => {
    try {
      console.log('UnifiedAuth.completeOAuth: Starting OAuth completion', { provider, code: code.substring(0, 10) + '...', state });
      setAuthState(prev => createLoadingState(prev.user, prev.tokens, prev.linkedAccount));

      // TODO: Retrieve stored PKCE parameters
      const codeVerifier = 'mock-verifier';
      const nonce = 'mock-nonce';

      console.log('UnifiedAuth.completeOAuth: Calling API client...');
      const response = await apiClient.completeOAuth(provider, {
        code,
        state,
        codeVerifier,
        nonce
      });
      console.log('UnifiedAuth.completeOAuth: API response received', { hasUser: !!response.user, hasTokens: !!response.tokens });

      // Process OAuth completion through domain logic
      console.log('UnifiedAuth.completeOAuth: Processing sign-in through domain logic...');
      const newState = processSignIn(authState, response.user, response.tokens, response.linkedAccount);
      console.log('UnifiedAuth.completeOAuth: New auth state created', { isAuthenticated: newState.isAuthenticated, hasUser: !!newState.user });
      
      // Persist session
      if (newState.isAuthenticated && newState.user && newState.tokens) {
        console.log('UnifiedAuth.completeOAuth: Storing session to storage...');
        const session: AuthSession = {
          user: newState.user,
          isAuthenticated: true,
          tokens: newState.tokens,
          linkedAccount: newState.linkedAccount
        };
        await storageAdapter.storeSession(session);
        console.log('UnifiedAuth.completeOAuth: Session stored successfully');
      }

      console.log('UnifiedAuth.completeOAuth: Setting final auth state...');
      setAuthState(newState);
      console.log('UnifiedAuth.completeOAuth: OAuth completion finished successfully');
      
    } catch (error) {
      console.error('OAuth completion failed:', error);
      setAuthState(prev => createErrorState('OAuth authentication failed', prev.user, prev.tokens, prev.linkedAccount));
      throw error;
    }
  }, [authState, apiClient, storageAdapter]);

  /**
   * Set auth state from completed OAuth data (for popup OAuth flows)
   */
  const setAuthFromData = useCallback(async (authData: { user: User; tokens: AuthTokens; linkedAccount?: LinkedAccount }) => {
    try {
      // Validate the auth data
      if (!isValidUser(authData.user)) {
        throw new Error('Invalid user data received from OAuth');
      }

      // Process sign-in through domain logic
      const newState = processSignIn(authState, authData.user, authData.tokens, authData.linkedAccount);
      
      // Validate the new state
      if (!validateAuthState(newState)) {
        throw new Error('Invalid authentication state after OAuth data processing');
      }

      // Persist session
      if (newState.isAuthenticated && newState.user && newState.tokens) {
        const session: AuthSession = {
          user: newState.user,
          isAuthenticated: true,
          tokens: newState.tokens,
          linkedAccount: newState.linkedAccount
        };
        await storageAdapter.storeSession(session);
      }

      setAuthState(newState);
      
    } catch (error) {
      console.error('Setting auth from OAuth data failed:', error);
      setAuthState(prev => createErrorState('Failed to process OAuth authentication', prev.user, prev.tokens, prev.linkedAccount));
      throw error;
    }
  }, [authState, storageAdapter]);

  /**
   * Update user profile
   */
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User must be authenticated to update profile');
    }

    try {
      setAuthState(prev => createLoadingState(prev.user, prev.tokens, prev.linkedAccount));

      const updatedUser = await apiClient.updateUser(updates);

      // Process user update through domain logic
      const newState = processUserUpdate(authState, updatedUser);

      // Update storage
      if (newState.isAuthenticated && newState.user && newState.tokens) {
        const session: AuthSession = {
          user: newState.user,
          isAuthenticated: true,
          tokens: newState.tokens,
          linkedAccount: newState.linkedAccount
        };
        await storageAdapter.storeSession(session);
      }

      setAuthState(newState);

    } catch (error) {
      console.error('User update failed:', error);
      setAuthState(prev => createErrorState('Failed to update profile', prev.user, prev.tokens, prev.linkedAccount));
      throw error;
    }
  }, [authState, apiClient, storageAdapter]);

  /**
   * Refresh user data from server
   */
  const refreshUser = useCallback(async () => {
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error('User must be authenticated to refresh profile');
    }

    try {
      const currentUser = await apiClient.getCurrentUser();

      // Process user update through domain logic
      const newState = processUserUpdate(authState, currentUser);

      // Update storage
      if (newState.isAuthenticated && newState.user && newState.tokens) {
        const session: AuthSession = {
          user: newState.user,
          isAuthenticated: true,
          tokens: newState.tokens,
          linkedAccount: newState.linkedAccount
        };
        await storageAdapter.storeSession(session);
      }

      setAuthState(newState);

    } catch (error) {
      console.error('User refresh failed:', error);
      setAuthState(prev => createErrorState('Failed to refresh user data', prev.user, prev.tokens, prev.linkedAccount));
      throw error;
    }
  }, [authState, apiClient, storageAdapter]);

  /**
   * Change password
   */
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!authState.isAuthenticated) {
      throw new Error('User must be authenticated to change password');
    }

    try {
      await apiClient.changePassword({ currentPassword, newPassword });
      
      // Password change doesn't affect auth state, but we might want to
      // update the hasPassword flag if it was previously false
      if (authState.user && !authState.user.hasPassword) {
        const updatedUser = { ...authState.user, hasPassword: true };
        const newState = processUserUpdate(authState, updatedUser);
        setAuthState(newState);
        
        // Update storage
        if (newState.isAuthenticated && newState.user && newState.tokens) {
          const session: AuthSession = {
            user: newState.user,
            isAuthenticated: true,
            tokens: newState.tokens,
            linkedAccount: newState.linkedAccount
          };
          await storageAdapter.storeSession(session);
        }
      }
      
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }, [authState, apiClient, storageAdapter]);

  /**
   * Force reload auth state from storage (for popup OAuth completion)
   */
  const reloadFromStorage = useCallback(async () => {
    try {
      setAuthState(createLoadingState());
      // Retrieve session from storage
      const session = await storageAdapter.retrieveSession();
      
      if (!session || !session.isAuthenticated || !session.user) {
        setAuthState(createUnauthenticatedState());
        return;
      }
      
      // Validate session data
      if (!isValidUser(session.user)) {
        console.warn('Invalid user data in stored session, clearing...');
        await storageAdapter.clearSession();
        setAuthState(createUnauthenticatedState());
        return;
      }
      
      // Create authenticated state
      setAuthState(createAuthenticatedState(
        session.user,
        session.tokens,
        session.linkedAccount
      ));
    } catch (error) {
      console.error('Failed to reload from storage:', error);
      setAuthState(createUnauthenticatedState());
    }
  }, [storageAdapter]);

  /**
   * Link OAuth account
   */
  const linkAccount = useCallback(async (provider: string, code: string, state: string) => {
    if (!authState.isAuthenticated) {
      throw new Error('User must be authenticated to link accounts');
    }

    try {
      const response = await apiClient.linkAccount({ provider, code, state });
      
      // Update user with linked account
      const newState = processUserUpdate(authState, response.user);
      setAuthState(newState);
      
      // Update storage
      if (newState.isAuthenticated && newState.user && newState.tokens) {
        const session: AuthSession = {
          user: newState.user,
          isAuthenticated: true,
          tokens: newState.tokens,
          linkedAccount: response.linkedAccount
        };
        await storageAdapter.storeSession(session);
      }
      
    } catch (error) {
      console.error('Account linking failed:', error);
      throw error;
    }
  }, [authState, apiClient, storageAdapter]);

  /**
   * Unlink OAuth account
   */
  const unlinkAccount = useCallback(async (provider: string) => {
    if (!authState.isAuthenticated) {
      throw new Error('User must be authenticated to unlink accounts');
    }

    try {
      await apiClient.unlinkAccount(provider);
      
      // Refresh user data to reflect unlinked account
      const updatedUser = await apiClient.getCurrentUser();
      const newState = processUserUpdate(authState, updatedUser);
      setAuthState(newState);
      
      // Update storage
      if (newState.isAuthenticated && newState.user && newState.tokens) {
        const session: AuthSession = {
          user: newState.user,
          isAuthenticated: true,
          tokens: newState.tokens,
          linkedAccount: newState.linkedAccount
        };
        await storageAdapter.storeSession(session);
      }
      
    } catch (error) {
      console.error('Account unlinking failed:', error);
      throw error;
    }
  }, [authState, apiClient, storageAdapter]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    if (authState.error) {
      setAuthState(prev => ({ ...prev, error: null }));
    }
  }, [authState.error]);

  /**
   * Check if session is valid
   */
  const isSessionValid = useCallback((): boolean => {
    return isCompleteAuthentication(authState) && 
           (!authState.tokens || !shouldRefreshTokens(authState.tokens));
  }, [authState]);

  /**
   * Get authorization header
   */
  const getAuthHeader = useCallback((): string | null => {
    return authState.tokens?.accessToken ? `Bearer ${authState.tokens.accessToken}` : null;
  }, [authState.tokens]);

  /**
   * Check if user can access resource
   */
  const canAccess = useCallback((
    requiredTier?: 'free' | 'patron',
    requireEmailVerification?: boolean
  ): boolean => {
    return canUserAccessResource(authState.user, requiredTier, requireEmailVerification);
  }, [authState.user]);

  /**
   * Check if user can perform action
   */
  const canPerform = useCallback((action: string): boolean => {
    return canUserPerformAction(authState.user, action as any);
  }, [authState.user]);

  /**
   * Get user display name
   */
  const getUserDisplayNameValue = useCallback((): string => {
    return authState.user ? getUserDisplayName(authState.user) : '';
  }, [authState.user]);

  /**
   * Check if user has profile picture
   */
  const hasProfilePicture = useCallback((): boolean => {
    return !!(authState.user?.profilePicture || authState.user?.picture);
  }, [authState.user]);

  /**
   * Check if user needs profile completion
   */
  const needsProfileCompletion = useCallback((): boolean => {
    if (!authState.user) return false;
    return !authState.user.firstName || !authState.user.lastName || !authState.user.isEmailVerified;
  }, [authState.user]);

  // Context value - ensure consistent SSR/client rendering
  const contextValue: UnifiedAuthContextValue = {
    // State - force loading state during SSR to prevent hydration mismatch
    ...authState,
    isLoading: !mounted || authState.isLoading,

    // Actions
    signIn,
    signOut,
    refreshTokens,
    initializeAuth,
    initiateOAuth,
    completeOAuth,
    setAuthFromData,
    updateUser,
    refreshUser,
    reloadFromStorage,
    changePassword,
    linkAccount,
    unlinkAccount,

    // Utilities
    clearError,
    isSessionValid,
    getAuthHeader,
    canAccess,
    canPerform,
    getUserDisplayName: getUserDisplayNameValue,
    hasProfilePicture,
    needsProfileCompletion
  };

  return (
    <UnifiedAuthContext.Provider value={contextValue}>
      {children}
    </UnifiedAuthContext.Provider>
  );
}

/**
 * Hook to use unified auth context
 */
export function useUnifiedAuth(): UnifiedAuthContextValue {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
}

/**
 * Export for compatibility during migration
 */
export { UnifiedAuthContext };
