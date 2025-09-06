/**
 * Session Domain Logic
 * Pure functions for session and token management
 *
 * EXTRACTED FROM: AuthContext.tsx:47-92
 * UPDATED: Now uses canonical User types and enhanced session management
 *
 * This domain contains zero React dependencies and pure business logic only.
 */

import type {
  User,
  AuthSession,
  AuthTokens,
  isValidUser,
  normalizeUserFromBackend
} from './canonical-user.types';

export interface TokenValidationResult {
  isValid: boolean;
  user: User | null;
  error?: string;
}

/**
 * Storage keys for authentication data
 * UPDATED: Enhanced with additional auth data keys
 */
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  ID_TOKEN: 'id_token',
  TOKEN_EXPIRES_AT: 'token_expires_at',
  AUTH_USER: 'auth_user',
  AUTH_LINKED_ACCOUNT: 'auth_linked_account'
} as const;

/**
 * Get stored access token
 * EXTRACTED FROM: AuthContext.tsx:47
 */
export const getStoredAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Get stored refresh token
 */
export const getStoredRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Get stored ID token
 * NEW: For OAuth ID token storage
 */
export const getStoredIdToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.ID_TOKEN);
};

/**
 * Get stored token expiration
 * NEW: For token expiration tracking
 */
export const getStoredTokenExpiration = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRES_AT);
};

/**
 * Store authentication tokens
 * UPDATED: Enhanced to store complete token set
 */
export const storeAuthTokens = (tokens: AuthTokens): void => {
  if (typeof window === 'undefined') return;

  localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
  localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRES_AT, tokens.expiresAt);

  if (tokens.idToken) {
    localStorage.setItem(AUTH_STORAGE_KEYS.ID_TOKEN, tokens.idToken);
  }
};

/**
 * Store authentication tokens (legacy signature)
 * DEPRECATED: Use storeAuthTokens(tokens: AuthTokens) instead
 */
export const storeAuthTokensLegacy = (accessToken: string, refreshToken?: string): void => {
  if (typeof window === 'undefined') return;

  localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  if (refreshToken) {
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
};

/**
 * Get stored auth tokens as complete object
 * NEW: Returns complete AuthTokens object
 */
export const getStoredAuthTokens = (): AuthTokens | null => {
  if (typeof window === 'undefined') return null;

  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();
  const expiresAt = getStoredTokenExpiration();
  const idToken = getStoredIdToken();

  if (!accessToken || !refreshToken || !expiresAt) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    expiresAt,
    idToken: idToken || undefined,
    tokenType: 'Bearer'
  };
};

/**
 * Clear all stored authentication data
 * EXTRACTED FROM: AuthContext.tsx:75-81
 * UPDATED: Clears all auth-related storage keys
 */
export const clearStoredAuthData = (): void => {
  if (typeof window === 'undefined') return;

  // Clear local storage auth data
  Object.values(AUTH_STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });

  // Clear session storage auth data
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.AUTH_USER);
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.AUTH_LINKED_ACCOUNT);
};

/**
 * Create authenticated session from user data
 * EXTRACTED FROM: AuthContext.tsx:67-71
 * UPDATED: Uses canonical types and enhanced validation
 */
export const createAuthSession = (
  user: User,
  tokens?: AuthTokens | null,
  linkedAccount?: any
): AuthSession => {
  if (!isValidUser(user)) {
    throw new Error('Invalid user data provided to createAuthSession');
  }

  return {
    user,
    isAuthenticated: true,
    tokens: tokens || null,
    linkedAccount: linkedAccount || null
  };
};

/**
 * Create empty/unauthenticated session
 * UPDATED: Uses canonical AuthSession type
 */
export const createEmptySession = (): AuthSession => {
  return {
    user: null,
    isAuthenticated: false,
    tokens: null,
    linkedAccount: null
  };
};

/**
 * Validate if session has required authentication data
 * UPDATED: Enhanced validation with canonical types
 */
export const isValidSession = (session: AuthSession): boolean => {
  return !!(
    session.isAuthenticated &&
    session.user &&
    isValidUser(session.user) &&
    session.tokens &&
    session.tokens.accessToken
  );
};

/**
 * Check if session tokens are expired
 * NEW: Session-specific token expiration check
 */
export const isSessionExpired = (session: AuthSession): boolean => {
  if (!session.isAuthenticated || !session.tokens) {
    return true;
  }

  try {
    const expirationTime = new Date(session.tokens.expiresAt).getTime();
    const currentTime = Date.now();

    // Add 5 minute buffer for clock skew
    const bufferTime = 5 * 60 * 1000;

    return currentTime >= (expirationTime - bufferTime);
  } catch (error) {
    // If we can't parse the expiration time, consider session expired
    return true;
  }
};

/**
 * Get time until session expires (in milliseconds)
 * NEW: Calculate remaining session time
 */
export const getSessionTimeRemaining = (session: AuthSession): number => {
  if (!session.isAuthenticated || !session.tokens) {
    return 0;
  }

  try {
    const expirationTime = new Date(session.tokens.expiresAt).getTime();
    const currentTime = Date.now();

    return Math.max(0, expirationTime - currentTime);
  } catch (error) {
    return 0;
  }
};

/**
 * Check if session needs token refresh
 * NEW: Determine if tokens should be refreshed proactively
 */
export const shouldRefreshTokens = (session: AuthSession, refreshThresholdMinutes: number = 10): boolean => {
  if (!session.isAuthenticated || !session.tokens) {
    return false;
  }

  const timeRemaining = getSessionTimeRemaining(session);
  const refreshThreshold = refreshThresholdMinutes * 60 * 1000; // Convert to milliseconds

  return timeRemaining <= refreshThreshold && timeRemaining > 0;
};

/**
 * Create session from stored data
 * NEW: Reconstruct session from browser storage
 */
export const createSessionFromStorage = (): AuthSession => {
  const tokens = getStoredAuthTokens();

  if (!tokens) {
    return createEmptySession();
  }

  // Try to get stored user data
  let userData = null;
  try {
    const storedUser = sessionStorage.getItem(AUTH_STORAGE_KEYS.AUTH_USER);
    if (storedUser) {
      userData = JSON.parse(storedUser);
    }
  } catch (error) {
    // If we can't parse stored user data, clear storage and return empty session
    clearStoredAuthData();
    return createEmptySession();
  }

  if (!userData || !isValidUser(userData)) {
    // If no valid user data, clear storage and return empty session
    clearStoredAuthData();
    return createEmptySession();
  }

  // Check if tokens are expired
  if (isSessionExpired({ user: userData, isAuthenticated: true, tokens, linkedAccount: null })) {
    clearStoredAuthData();
    return createEmptySession();
  }

  // Try to get linked account data
  let linkedAccount = null;
  try {
    const storedLinkedAccount = sessionStorage.getItem(AUTH_STORAGE_KEYS.AUTH_LINKED_ACCOUNT);
    if (storedLinkedAccount) {
      linkedAccount = JSON.parse(storedLinkedAccount);
    }
  } catch (error) {
    // Linked account is optional, continue without it
  }

  return createAuthSession(userData, tokens, linkedAccount);
};

/**
 * Persist session to storage
 * NEW: Store session data in browser storage
 */
export const persistSession = (session: AuthSession): void => {
  if (typeof window === 'undefined') return;

  if (!session.isAuthenticated || !session.user || !session.tokens) {
    clearStoredAuthData();
    return;
  }

  try {
    // Store tokens in localStorage
    storeAuthTokens(session.tokens);

    // Store user data in sessionStorage
    sessionStorage.setItem(AUTH_STORAGE_KEYS.AUTH_USER, JSON.stringify(session.user));

    // Store linked account if present
    if (session.linkedAccount) {
      sessionStorage.setItem(AUTH_STORAGE_KEYS.AUTH_LINKED_ACCOUNT, JSON.stringify(session.linkedAccount));
    }
  } catch (error) {
    // If storage fails, clear all data to prevent inconsistent state
    clearStoredAuthData();
  }
};

/**
 * Extract user data from JWT token (client-side only, for display purposes)
 * UPDATED: Enhanced with better error handling
 */
export const extractUserFromToken = (token: string): User | null => {
  try {
    // Split JWT token and decode payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));

    // Extract user data from JWT payload
    const userData = {
      id: payload.user_id || payload.sub,
      email: payload.email,
      name: payload.name,
      firstName: payload.firstName,
      lastName: payload.lastName,
      profilePicture: payload.profilePicture,
      picture: payload.picture,
      tier: payload.tier || 'free',
      hasPassword: payload.hasPassword === true,
      isEmailVerified: payload.isEmailVerified === true,
      oauthProviders: payload.oauthProviders || [],
      googleId: payload.google_id || payload.googleId,
      createdAt: payload.createdAt,
      lastLoginAt: payload.lastLoginAt,
      preferences: payload.preferences || {
        notifications: true,
        theme: 'auto',
        language: 'en'
      }
    };

    // Validate extracted user data
    if (!isValidUser(userData)) {
      return null;
    }

    return userData;
  } catch (error) {
    return null;
  }
};

/**
 * Check if token is expired (client-side check only)
 * UPDATED: Enhanced with better error handling
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }

    const payload = JSON.parse(atob(parts[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    // Add 5 minute buffer for clock skew
    const bufferTime = 5 * 60 * 1000;

    return currentTime >= (expirationTime - bufferTime);
  } catch (error) {
    return true;
  }
};

/**
 * Session lifecycle: Initialize session from storage
 * NEW: Complete session initialization logic
 */
export const initializeSession = (): AuthSession => {
  if (typeof window === 'undefined') {
    return createEmptySession();
  }

  return createSessionFromStorage();
};

/**
 * Session lifecycle: Update session with new data
 * NEW: Pure function for session updates
 */
export const updateSession = (
  currentSession: AuthSession,
  updates: Partial<AuthSession>
): AuthSession => {
  const updatedSession = {
    ...currentSession,
    ...updates
  };

  // Validate updated session consistency
  if (updatedSession.isAuthenticated && (!updatedSession.user || !updatedSession.tokens)) {
    // If marked as authenticated but missing required data, mark as unauthenticated
    return createEmptySession();
  }

  if (!updatedSession.isAuthenticated && (updatedSession.user || updatedSession.tokens)) {
    // If marked as unauthenticated but has auth data, clear the data
    return {
      ...updatedSession,
      user: null,
      tokens: null,
      linkedAccount: null
    };
  }

  return updatedSession;
};

/**
 * Session lifecycle: Destroy session and clear storage
 * NEW: Complete session cleanup
 */
export const destroySession = (): AuthSession => {
  clearStoredAuthData();
  return createEmptySession();
};





/**
 * Prepare session initialization data
 * EXTRACTED FROM: AuthContext.tsx:44-62 logic
 */
export const prepareSessionInitialization = (): {
  hasStoredToken: boolean;
  accessToken: string | null;
  refreshToken: string | null;
} => {
  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();
  
  return {
    hasStoredToken: !!accessToken,
    accessToken,
    refreshToken
  };
};