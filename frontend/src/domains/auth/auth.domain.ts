/**
 * Auth Domain Logic
 * Pure functions for general authentication business logic
 * 
 * EXTRACTED FROM: GoogleSignInButton.tsx:24-30, AuthContext.tsx
 * 
 * This domain contains zero React dependencies and pure business logic only.
 */

import type { User } from './session.domain';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: User | null;
}

export interface SignInButtonState {
  canSignIn: boolean;
  buttonText: string;
  ariaLabel: string;
  showAlreadySignedIn: boolean;
}

/**
 * Determine authentication display state for sign-in components
 * EXTRACTED FROM: GoogleSignInButton.tsx:24-30, 140-141
 */
export const getSignInButtonState = (
  isAuthenticated: boolean,
  linkAccount: boolean = false
): SignInButtonState => {
  // Don't render button if user is already authenticated (unless linking)
  if (isAuthenticated && !linkAccount) {
    return {
      canSignIn: false,
      buttonText: '',
      ariaLabel: '',
      showAlreadySignedIn: true
    };
  }

  const buttonText = linkAccount ? 'Link Google Account' : 'Sign in with Google';
  const ariaLabel = linkAccount ? 'Link Google Account' : 'Sign in with Google';

  return {
    canSignIn: true,
    buttonText,
    ariaLabel,
    showAlreadySignedIn: false
  };
};

/**
 * Validate user object has required fields
 */
export const isValidUser = (user: any): user is User => {
  return !!(
    user &&
    typeof user === 'object' &&
    user.id &&
    user.email &&
    user.name
  );
};

/**
 * Create initial authentication state
 */
export const createInitialAuthState = (): AuthState => {
  return {
    isAuthenticated: false,
    isLoading: true,
    error: null,
    user: null
  };
};

/**
 * Create authenticated state
 */
export const createAuthenticatedState = (user: User): AuthState => {
  return {
    isAuthenticated: true,
    isLoading: false,
    error: null,
    user
  };
};

/**
 * Create unauthenticated state
 */
export const createUnauthenticatedState = (error?: string): AuthState => {
  return {
    isAuthenticated: false,
    isLoading: false,
    error: error || null,
    user: null
  };
};

/**
 * Create loading state
 */
export const createLoadingState = (currentUser?: User | null): AuthState => {
  return {
    isAuthenticated: !!currentUser,
    isLoading: true,
    error: null,
    user: currentUser || null
  };
};

/**
 * Create error state
 */
export const createErrorState = (error: string, currentUser?: User | null): AuthState => {
  return {
    isAuthenticated: !!currentUser,
    isLoading: false,
    error,
    user: currentUser || null
  };
};

/**
 * Sanitize user data for display
 */
export const sanitizeUserForDisplay = (user: User): Partial<User> => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture
    // Exclude sensitive fields like google_id from general display
  };
};

/**
 * Generate display name from user data
 */
export const getUserDisplayName = (user: User): string => {
  return user.name || user.email || 'Unknown User';
};

/**
 * Check if user has profile picture
 */
export const userHasProfilePicture = (user: User): boolean => {
  return !!(user.picture && user.picture.trim().length > 0);
};