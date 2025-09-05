"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Helper functions for name normalization
function extractFirstName(fullName?: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || '';
}

function extractLastName(fullName?: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(' ') : '';
}

// Types for authentication state
export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  googleId?: string;
  emailVerified: boolean;
  picture?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: string;
}

export interface LinkedAccount {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  linkedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  linkedAccount: LinkedAccount | null;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  signIn: (userData: any) => void;
  signOut: () => void;
  refreshTokens: () => Promise<void>;
  clearError: () => void;
  isSessionValid: () => boolean;
  getAuthHeader: () => string | null;
}

// Context creation
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  AUTH_USER: 'auth_user',
  AUTH_TOKENS: 'auth_tokens',
  AUTH_LINKED: 'auth_linked_account'
} as const;

// Session validation helper
const isTokenExpired = (expiresAt: string): boolean => {
  const expiry = new Date(expiresAt);
  const now = new Date();
  // Add 5 minutes buffer for token refresh
  const buffer = 5 * 60 * 1000;
  return expiry.getTime() - buffer < now.getTime();
};

/**
 * Authentication Context Provider
 * 
 * Manages authentication state across the entire application:
 * - Session persistence with sessionStorage
 * - Token validation and refresh
 * - User profile management
 * - OAuth account linking state
 * - Secure sign-out with cleanup
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    tokens: null,
    linkedAccount: null,
    error: null
  });

  // Initialize authentication state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check for existing session data
      const authUserData = sessionStorage.getItem(STORAGE_KEYS.AUTH_USER);
      const authTokensData = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKENS);
      const linkedAccountData = sessionStorage.getItem(STORAGE_KEYS.AUTH_LINKED);

      if (!authUserData) {
        // No existing session
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Parse stored data
      const rawUserData = JSON.parse(authUserData);
      const tokensData = authTokensData ? JSON.parse(authTokensData) : null;
      const linkedData = linkedAccountData ? JSON.parse(linkedAccountData) : null;

      // Normalize stored user data to ensure firstName/lastName exist
      const userData = rawUserData.user || rawUserData;
      const normalizedUser = {
        ...userData,
        firstName: userData.firstName || extractFirstName(userData.name),
        lastName: userData.lastName || extractLastName(userData.name)
      };

      // Validate token expiration
      if (tokensData && isTokenExpired(tokensData.expiresAt)) {
        console.log('Tokens expired, attempting refresh...');

        try {
          await refreshAuthTokens(tokensData.refreshToken);
          return; // refreshAuthTokens will update the state
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          await signOut();
          return;
        }
      }

      // Restore valid session
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: normalizedUser,
        tokens: tokensData,
        linkedAccount: linkedData || rawUserData.linkedAccount,
        error: null
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        linkedAccount: null,
        error: 'Failed to initialize authentication session'
      });
      
      // Clear potentially corrupted data
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKENS);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_LINKED);
    }
  };

  const signIn = (authData: any) => {
    try {
      // Extract data from OAuth callback or direct sign-in
      const rawUser = authData.user || authData.newUser;
      const tokens = authData.tokens;
      const linkedAccount = authData.linkedAccount;

      // Validate required data
      if (!rawUser || !rawUser.email) {
        throw new Error('Invalid user data provided to signIn');
      }

      // Normalize user data to include firstName/lastName
      const normalizedUser = {
        ...rawUser,
        firstName: rawUser.firstName || extractFirstName(rawUser.name),
        lastName: rawUser.lastName || extractLastName(rawUser.name)
      };

      // Update state
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: normalizedUser,
        tokens,
        linkedAccount,
        error: null
      });

      // Persist to sessionStorage
      sessionStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(normalizedUser));
      
      if (tokens) {
        sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKENS, JSON.stringify(tokens));
      }
      
      if (linkedAccount) {
        sessionStorage.setItem(STORAGE_KEYS.AUTH_LINKED, JSON.stringify(linkedAccount));
      }

      console.log('User signed in:', normalizedUser.email);

    } catch (error) {
      console.error('Sign-in error:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign-in failed'
      }));
    }
  };

  const signOut = async () => {
    try {
      // Clear all auth data
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        linkedAccount: null,
        error: null
      });

      // Clear sessionStorage
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKENS);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_LINKED);
      
      // Clear any OAuth state
      const oauthKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('oauth_state_') || key === 'pending_link'
      );
      oauthKeys.forEach(key => sessionStorage.removeItem(key));

      console.log('User signed out');

    } catch (error) {
      console.error('Sign-out error:', error);
      // Force clear state even if there's an error
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        linkedAccount: null,
        error: null
      });
    }
  };

  const refreshAuthTokens = async (refreshToken?: string): Promise<void> => {
    try {
      const tokenToUse = refreshToken || authState.tokens?.refreshToken;
      
      if (!tokenToUse) {
        throw new Error('No refresh token available');
      }

      // Call backend token refresh endpoint (Phase 3)
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${base}/api/auth/oauth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: tokenToUse }),
      });

      if (!response.ok) {
        throw new Error('Token refresh request failed');
      }

      const raw = await response.json();
      // Normalize to AuthTokens shape
      const normalized = {
        accessToken: raw.access_token,
        refreshToken: raw.refresh_token ?? authState.tokens?.refreshToken ?? '',
        idToken: raw.id_token ?? authState.tokens?.idToken ?? '',
        expiresAt: new Date(Date.now() + (raw.expires_in || 3600) * 1000).toISOString(),
      };

      // Update tokens in state and storage
      setAuthState(prev => ({
        ...prev,
        tokens: normalized,
        error: null
      }));

      sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKENS, JSON.stringify(normalized));

      console.log('Tokens refreshed successfully');

    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, sign out the user
      await signOut();
      throw error;
    }
  };

  const refreshTokens = async (): Promise<void> => {
    return refreshAuthTokens();
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const isSessionValid = (): boolean => {
    if (!authState.isAuthenticated || !authState.tokens) {
      return false;
    }

    return !isTokenExpired(authState.tokens.expiresAt);
  };

  const getAuthHeader = (): string | null => {
    if (!authState.tokens?.accessToken || !isSessionValid()) {
      return null;
    }

    return `Bearer ${authState.tokens.accessToken}`;
  };

  // Context value
  const contextValue: AuthContextValue = {
    ...authState,
    signIn,
    signOut,
    refreshTokens,
    clearError,
    isSessionValid,
    getAuthHeader
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Higher-order component for protected routes
export interface WithAuthOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = { requireAuth: true, redirectTo: '/auth/signin' }
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    
    useEffect(() => {
      if (!isLoading && options.requireAuth && !isAuthenticated) {
        // In a real app, you'd use Next.js router here
        window.location.href = options.redirectTo || '/auth/signin';
      }
    }, [isAuthenticated, isLoading]);

    // Show loading spinner while checking auth
    if (isLoading) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      );
    }

    // Don't render if auth is required but user is not authenticated
    if (options.requireAuth && !isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Route protection hook
export function useRequireAuth(redirectTo: string = '/auth/signin') {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  return { isAuthenticated, isLoading };
}
