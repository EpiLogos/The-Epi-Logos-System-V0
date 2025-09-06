/**
 * Auth Domain Logic
 * Pure functions for general authentication business logic
 *
 * EXTRACTED FROM: GoogleSignInButton.tsx:24-30, AuthContext.tsx
 * UPDATED: Now uses canonical User types and enhanced validation
 *
 * This domain contains zero React dependencies and pure business logic only.
 */

import type {
  User,
  AuthState,
  AuthTokens,
  LinkedAccount
} from './canonical-user.types';

import {
  isValidUser,
  getUserDisplayName,
  userHasProfilePicture
} from './canonical-user.types';

export interface SignInButtonState {
  canSignIn: boolean;
  buttonText: string;
  ariaLabel: string;
  showAlreadySignedIn: boolean;
}

/**
 * Determine authentication display state for sign-in components
 * EXTRACTED FROM: GoogleSignInButton.tsx:24-30, 140-141
 * UPDATED: Enhanced with provider-specific messaging
 */
export const getSignInButtonState = (
  isAuthenticated: boolean,
  linkAccount: boolean = false,
  provider: string = 'Google'
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

  const buttonText = linkAccount
    ? `Link ${provider} Account`
    : `Sign in with ${provider}`;
  const ariaLabel = linkAccount
    ? `Link ${provider} Account`
    : `Sign in with ${provider}`;

  return {
    canSignIn: true,
    buttonText,
    ariaLabel,
    showAlreadySignedIn: false
  };
};

/**
 * Create initial authentication state
 * UPDATED: Enhanced with better type safety
 */
export const createInitialAuthState = (): AuthState => {
  return {
    isAuthenticated: false,
    isLoading: true,
    error: null,
    user: null,
    tokens: null,
    linkedAccount: null
  };
};

/**
 * Create authenticated state
 * UPDATED: Includes tokens and linked account data
 */
export const createAuthenticatedState = (
  user: User,
  tokens?: AuthTokens | null,
  linkedAccount?: LinkedAccount | null
): AuthState => {
  if (!isValidUser(user)) {
    throw new Error('Invalid user data provided to createAuthenticatedState');
  }

  return {
    isAuthenticated: true,
    isLoading: false,
    error: null,
    user,
    tokens: tokens || null,
    linkedAccount: linkedAccount || null
  };
};

/**
 * Create unauthenticated state
 * UPDATED: Clears all auth-related data
 */
export const createUnauthenticatedState = (error?: string): AuthState => {
  return {
    isAuthenticated: false,
    isLoading: false,
    error: error || null,
    user: null,
    tokens: null,
    linkedAccount: null
  };
};

/**
 * Create loading state
 * UPDATED: Preserves existing auth data during loading
 */
export const createLoadingState = (
  currentUser?: User | null,
  currentTokens?: AuthTokens | null,
  currentLinkedAccount?: LinkedAccount | null
): AuthState => {
  return {
    isAuthenticated: !!currentUser,
    isLoading: true,
    error: null,
    user: currentUser || null,
    tokens: currentTokens || null,
    linkedAccount: currentLinkedAccount || null
  };
};

/**
 * Create error state
 * UPDATED: Preserves auth data but adds error
 */
export const createErrorState = (
  error: string,
  currentUser?: User | null,
  currentTokens?: AuthTokens | null,
  currentLinkedAccount?: LinkedAccount | null
): AuthState => {
  return {
    isAuthenticated: !!currentUser,
    isLoading: false,
    error,
    user: currentUser || null,
    tokens: currentTokens || null,
    linkedAccount: currentLinkedAccount || null
  };
};

/**
 * Sanitize user data for display
 * UPDATED: Uses canonical user fields and enhanced security
 */
export const sanitizeUserForDisplay = (user: User): Partial<User> => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    displayName: user.displayName,
    profilePicture: user.profilePicture,
    picture: user.picture,
    tier: user.tier,
    isEmailVerified: user.isEmailVerified
    // Exclude sensitive fields like googleId, metadata
  };
};



/**
 * Check if auth state represents a complete authentication
 * NEW: Validates that user has all required data for app usage
 */
export const isCompleteAuthentication = (state: AuthState): boolean => {
  if (!state.isAuthenticated || !state.user) {
    return false;
  }

  const user = state.user;

  // Check required fields for app functionality
  return !!(
    user.id &&
    user.email &&
    user.name &&
    typeof user.hasPassword === 'boolean' &&
    user.tier &&
    user.createdAt
  );
};

/**
 * Authorization: Check if user can access protected resources
 * NEW: Pure function for authorization logic
 */
export const canUserAccessResource = (
  user: User | null,
  requiredTier?: 'free' | 'patron',
  requireEmailVerification: boolean = false
): boolean => {
  if (!user) {
    return false;
  }

  // Check email verification if required
  if (requireEmailVerification && !user.isEmailVerified) {
    return false;
  }

  // Check tier requirement
  if (requiredTier === 'patron' && user.tier !== 'patron') {
    return false;
  }

  return true;
};

/**
 * Authorization: Check if user can perform specific actions
 * NEW: Action-based authorization
 */
export const canUserPerformAction = (
  user: User | null,
  action: 'view_account' | 'edit_profile' | 'change_password' | 'manage_subscription' | 'admin_access'
): boolean => {
  if (!user) {
    return false;
  }

  switch (action) {
    case 'view_account':
      return true; // All authenticated users can view their account

    case 'edit_profile':
      return user.isEmailVerified; // Must have verified email

    case 'change_password':
      return user.hasPassword; // Must have existing password

    case 'manage_subscription':
      return user.isEmailVerified; // Must have verified email

    case 'admin_access':
      return user.tier === 'patron' && user.isEmailVerified; // Patron tier only

    default:
      return false;
  }
};

/**
 * User state transitions: Handle sign-in process
 * NEW: Pure function for sign-in state management
 */
export const processSignIn = (
  currentState: AuthState,
  userData: any,
  tokens?: AuthTokens | null,
  linkedAccount?: LinkedAccount | null
): AuthState => {
  // Validate user data
  if (!isValidUser(userData)) {
    return createErrorState('Invalid user data received', currentState.user, currentState.tokens, currentState.linkedAccount);
  }

  // Create authenticated state
  return createAuthenticatedState(userData, tokens, linkedAccount);
};

/**
 * User state transitions: Handle sign-out process
 * NEW: Pure function for sign-out state management
 */
export const processSignOut = (currentState: AuthState): AuthState => {
  return createUnauthenticatedState();
};

/**
 * User state transitions: Handle token refresh
 * NEW: Pure function for token refresh state management
 */
export const processTokenRefresh = (
  currentState: AuthState,
  newTokens: AuthTokens
): AuthState => {
  if (!currentState.isAuthenticated || !currentState.user) {
    return createErrorState('Cannot refresh tokens for unauthenticated user');
  }

  return {
    ...currentState,
    tokens: newTokens,
    error: null // Clear any previous errors
  };
};

/**
 * User state transitions: Handle user data updates
 * NEW: Pure function for user update state management
 */
export const processUserUpdate = (
  currentState: AuthState,
  updatedUserData: Partial<User>
): AuthState => {
  if (!currentState.isAuthenticated || !currentState.user) {
    return createErrorState('Cannot update user data for unauthenticated user');
  }

  const updatedUser = {
    ...currentState.user,
    ...updatedUserData
  };

  // Validate updated user
  if (!isValidUser(updatedUser)) {
    return createErrorState('Invalid user data in update', currentState.user, currentState.tokens, currentState.linkedAccount);
  }

  return {
    ...currentState,
    user: updatedUser,
    error: null
  };
};