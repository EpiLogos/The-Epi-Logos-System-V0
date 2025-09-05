/**
 * Auth Orchestration Hook
 * Orchestrates auth domain logic with React state and session management
 * 
 * INTEGRATES: domains/auth/auth.domain.ts + domains/auth/session.domain.ts with React
 * 
 * This hook is the ONLY layer that imports both domain logic and React.
 * Components consume this hook and are "dumb" presentation layers.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  createInitialAuthState,
  createAuthenticatedState,
  createUnauthenticatedState,
  createLoadingState,
  isValidUser,
  getSignInButtonState,
  getUserDisplayName,
  userHasProfilePicture,
  type AuthState,
  type User,
  type SignInButtonState
} from '@/domains/auth/auth.domain';
import {
  prepareSessionInitialization,
  createAuthSession,
  createEmptySession,
  isValidSession,
  extractUserFromToken,
  isTokenExpired,
  clearStoredAuthData,
  storeAuthTokens,
  type AuthSession
} from '@/domains/auth/session.domain';

export interface UseAuthReturn {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  signIn: (user: User, accessToken: string, refreshToken?: string) => void;
  getButtonState: (linkAccount?: boolean) => SignInButtonState;
  getUserDisplayName: () => string;
  hasProfilePicture: () => boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>(createInitialAuthState());
  const [session, setSession] = useState<AuthSession>(createEmptySession());

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setAuthState(createLoadingState());
        
        // Use domain logic to prepare session initialization
        const initData = prepareSessionInitialization();
        
        if (initData.hasStoredToken && initData.accessToken) {
          // Check if token is expired (client-side check only)
          if (isTokenExpired(initData.accessToken)) {
            // Token expired, clear stored data
            clearStoredAuthData();
            setAuthState(createUnauthenticatedState());
            setSession(createEmptySession());
            return;
          }
          
          // Extract user from token (for display purposes only)
          const user = extractUserFromToken(initData.accessToken);
          
          if (user && isValidUser(user)) {
            const newSession = createAuthSession(user, initData.accessToken, initData.refreshToken || undefined);
            
            if (isValidSession(newSession)) {
              setSession(newSession);
              setAuthState(createAuthenticatedState(user));
              return;
            }
          }
        }
        
        // No valid session found
        setAuthState(createUnauthenticatedState());
        setSession(createEmptySession());
        
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setAuthState(createUnauthenticatedState('Authentication initialization failed'));
        setSession(createEmptySession());
      }
    };

    initializeAuth();
  }, []);

  const signIn = useCallback((user: User, accessToken: string, refreshToken?: string) => {
    if (!isValidUser(user)) {
      console.error('Invalid user data provided to signIn');
      return;
    }

    // Store tokens using domain logic
    storeAuthTokens(accessToken, refreshToken);
    
    // Create session using domain logic
    const newSession = createAuthSession(user, accessToken, refreshToken);
    
    // Update state using domain logic
    setSession(newSession);
    setAuthState(createAuthenticatedState(user));
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Clear stored data using domain logic
      clearStoredAuthData();
      
      // Reset state using domain logic
      setSession(createEmptySession());
      setAuthState(createUnauthenticatedState());
      
      // Optionally make API call to invalidate server-side session
      // This would be handled by infrastructure layer in a real implementation
      // await fetch('/api/auth/signout', { method: 'POST' });
      
    } catch (error) {
      console.error('Sign out failed:', error);
      // Even if server call fails, still clear local state
      setSession(createEmptySession());
      setAuthState(createUnauthenticatedState('Sign out completed with warnings'));
    }
  }, []);

  const getButtonState = useCallback((linkAccount: boolean = false): SignInButtonState => {
    return getSignInButtonState(authState.isAuthenticated, linkAccount);
  }, [authState.isAuthenticated]);

  const getDisplayName = useCallback((): string => {
    if (!authState.user) return 'Unknown User';
    return getUserDisplayName(authState.user);
  }, [authState.user]);

  const hasProfilePicture = useCallback((): boolean => {
    if (!authState.user) return false;
    return userHasProfilePicture(authState.user);
  }, [authState.user]);

  const value: UseAuthReturn = {
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    signOut,
    signIn,
    getButtonState,
    getUserDisplayName: getDisplayName,
    hasProfilePicture
  };

  return value;
};