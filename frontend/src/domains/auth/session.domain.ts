/**
 * Session Domain Logic
 * Pure functions for session and token management
 * 
 * EXTRACTED FROM: AuthContext.tsx:47-92
 * 
 * This domain contains zero React dependencies and pure business logic only.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  google_id?: string;
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface TokenValidationResult {
  isValid: boolean;
  user: User | null;
  error?: string;
}

/**
 * Storage keys for authentication tokens
 */
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token'
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
 * Store authentication tokens
 */
export const storeAuthTokens = (accessToken: string, refreshToken?: string): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  if (refreshToken) {
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
};

/**
 * Clear all stored authentication data
 * EXTRACTED FROM: AuthContext.tsx:75-81
 */
export const clearStoredAuthData = (): void => {
  if (typeof window === 'undefined') return;
  
  // Clear local storage
  localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  
  // Clear session storage
  sessionStorage.clear();
};

/**
 * Create authenticated session from user data
 * EXTRACTED FROM: AuthContext.tsx:67-71
 */
export const createAuthSession = (user: User, accessToken: string, refreshToken?: string): AuthSession => {
  return {
    user,
    isAuthenticated: true,
    accessToken,
    refreshToken: refreshToken || null
  };
};

/**
 * Create empty/unauthenticated session
 */
export const createEmptySession = (): AuthSession => {
  return {
    user: null,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null
  };
};

/**
 * Validate if session has required authentication data
 */
export const isValidSession = (session: AuthSession): boolean => {
  return !!(
    session.isAuthenticated &&
    session.user &&
    session.user.id &&
    session.user.email &&
    session.accessToken
  );
};

/**
 * Extract user data from JWT token (without verification)
 * This is for display purposes only - verification must be done server-side
 */
export const extractUserFromToken = (token: string): User | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    
    const decoded = JSON.parse(atob(payload));
    
    if (!decoded.user_id || !decoded.email) return null;
    
    return {
      id: decoded.user_id,
      email: decoded.email,
      name: decoded.name || decoded.email,
      picture: decoded.picture || undefined,
      google_id: decoded.google_id || undefined
    };
  } catch (error) {
    console.error('Failed to extract user from token:', error);
    return null;
  }
};

/**
 * Check if token is expired (client-side check only)
 * Note: This is not secure - server must validate expiration
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp;
    
    if (!exp) return true;
    
    return Date.now() >= exp * 1000;
  } catch (error) {
    return true;
  }
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