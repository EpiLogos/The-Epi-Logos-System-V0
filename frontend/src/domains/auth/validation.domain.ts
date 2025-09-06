/**
 * Auth Validation Domain Logic
 * Pure functions for validating authentication data and business rules
 * 
 * This domain contains zero React dependencies and pure business logic only.
 */

import type { 
  User, 
  AuthState, 
  AuthTokens, 
  AuthSession,
  OAuthProvider,
  UserPreferences,
  UserProfile,
  UserMetadata
} from './canonical-user.types';

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validate user ID format
 */
export const isValidUserId = (id: string): boolean => {
  if (!id || typeof id !== 'string') {
    return false;
  }
  // Allow various ID formats (UUID, MongoDB ObjectId, etc.)
  return id.trim().length >= 8;
};

/**
 * Validate user tier
 */
export const isValidUserTier = (tier: string): tier is 'free' | 'patron' => {
  return tier === 'free' || tier === 'patron';
};

/**
 * Validate OAuth provider data
 */
export const isValidOAuthProvider = (provider: any): provider is OAuthProvider => {
  return !!(
    provider &&
    typeof provider === 'object' &&
    typeof provider.provider === 'string' &&
    typeof provider.providerId === 'string' &&
    typeof provider.linkedAt === 'string' &&
    provider.provider.length > 0 &&
    provider.providerId.length > 0
  );
};

/**
 * Validate user preferences
 */
export const isValidUserPreferences = (preferences: any): preferences is UserPreferences => {
  if (!preferences || typeof preferences !== 'object') {
    return false;
  }

  // Check required fields
  if (typeof preferences.notifications !== 'boolean') {
    return false;
  }

  if (!['light', 'dark', 'auto'].includes(preferences.theme)) {
    return false;
  }

  if (typeof preferences.language !== 'string' || preferences.language.length === 0) {
    return false;
  }

  return true;
};

/**
 * Validate user profile data
 */
export const isValidUserProfile = (profile: any): profile is UserProfile => {
  if (!profile || typeof profile !== 'object') {
    return true; // Profile is optional
  }

  // All profile fields are optional, just check types if present
  if (profile.bio && typeof profile.bio !== 'string') {
    return false;
  }

  if (profile.location && typeof profile.location !== 'string') {
    return false;
  }

  if (profile.website && typeof profile.website !== 'string') {
    return false;
  }

  if (profile.experienceLevel && 
      !['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(profile.experienceLevel)) {
    return false;
  }

  return true;
};

/**
 * Validate complete user object
 * Enhanced version of isValidUser from canonical types
 */
export const validateCompleteUser = (user: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!user || typeof user !== 'object') {
    return { isValid: false, errors: ['User must be an object'] };
  }

  // Required fields
  if (!isValidUserId(user.id)) {
    errors.push('Invalid user ID');
  }

  if (!isValidEmail(user.email)) {
    errors.push('Invalid email address');
  }

  if (!user.name || typeof user.name !== 'string' || user.name.trim().length === 0) {
    errors.push('User name is required');
  }

  if (typeof user.hasPassword !== 'boolean') {
    errors.push('hasPassword must be a boolean');
  }

  if (!isValidUserTier(user.tier)) {
    errors.push('Invalid user tier');
  }

  if (typeof user.isEmailVerified !== 'boolean') {
    errors.push('isEmailVerified must be a boolean');
  }

  if (!Array.isArray(user.oauthProviders)) {
    errors.push('oauthProviders must be an array');
  } else {
    user.oauthProviders.forEach((provider: any, index: number) => {
      if (!isValidOAuthProvider(provider)) {
        errors.push(`Invalid OAuth provider at index ${index}`);
      }
    });
  }

  if (!user.createdAt || typeof user.createdAt !== 'string') {
    errors.push('createdAt is required and must be an ISO string');
  }

  if (!isValidUserPreferences(user.preferences)) {
    errors.push('Invalid user preferences');
  }

  if (user.profile && !isValidUserProfile(user.profile)) {
    errors.push('Invalid user profile');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate authentication tokens
 */
export const isValidAuthTokens = (tokens: any): tokens is AuthTokens => {
  if (!tokens || typeof tokens !== 'object') {
    return false;
  }

  return !!(
    typeof tokens.accessToken === 'string' &&
    tokens.accessToken.length > 0 &&
    typeof tokens.refreshToken === 'string' &&
    tokens.refreshToken.length > 0 &&
    typeof tokens.expiresAt === 'string' &&
    tokens.expiresAt.length > 0
  );
};

/**
 * Check if tokens are expired
 */
export const areTokensExpired = (tokens: AuthTokens): boolean => {
  try {
    const expirationTime = new Date(tokens.expiresAt).getTime();
    const currentTime = Date.now();
    
    // Add 5 minute buffer for clock skew
    const bufferTime = 5 * 60 * 1000;
    
    return currentTime >= (expirationTime - bufferTime);
  } catch (error) {
    // If we can't parse the expiration time, consider tokens expired
    return true;
  }
};

/**
 * Validate authentication session
 */
export const validateAuthSession = (session: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!session || typeof session !== 'object') {
    return { isValid: false, errors: ['Session must be an object'] };
  }

  if (typeof session.isAuthenticated !== 'boolean') {
    errors.push('isAuthenticated must be a boolean');
  }

  if (session.isAuthenticated) {
    if (!session.user) {
      errors.push('Authenticated session must have user data');
    } else {
      const userValidation = validateCompleteUser(session.user);
      if (!userValidation.isValid) {
        errors.push(...userValidation.errors.map(err => `User validation: ${err}`));
      }
    }

    if (!session.tokens) {
      errors.push('Authenticated session must have tokens');
    } else if (!isValidAuthTokens(session.tokens)) {
      errors.push('Invalid authentication tokens');
    }
  } else {
    // Unauthenticated session should not have user or tokens
    if (session.user !== null) {
      errors.push('Unauthenticated session should not have user data');
    }

    if (session.tokens !== null) {
      errors.push('Unauthenticated session should not have tokens');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate authentication state
 */
export const validateAuthState = (state: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!state || typeof state !== 'object') {
    return { isValid: false, errors: ['Auth state must be an object'] };
  }

  // Check required boolean fields
  if (typeof state.isAuthenticated !== 'boolean') {
    errors.push('isAuthenticated must be a boolean');
  }

  if (typeof state.isLoading !== 'boolean') {
    errors.push('isLoading must be a boolean');
  }

  // Error can be string or null
  if (state.error !== null && typeof state.error !== 'string') {
    errors.push('error must be string or null');
  }

  // Validate consistency between isAuthenticated and user/tokens
  if (state.isAuthenticated) {
    if (!state.user) {
      errors.push('Authenticated state must have user data');
    } else {
      const userValidation = validateCompleteUser(state.user);
      if (!userValidation.isValid) {
        errors.push(...userValidation.errors.map(err => `User validation: ${err}`));
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Business rule: Check if user can perform admin actions
 */
export const canUserPerformAdminActions = (user: User): boolean => {
  // For now, only patron tier users can perform admin actions
  // This can be extended with role-based permissions later
  return user.tier === 'patron' && user.isEmailVerified;
};

/**
 * Business rule: Check if user needs to complete profile
 */
export const doesUserNeedProfileCompletion = (user: User): boolean => {
  // User needs profile completion if they're missing key information
  return !user.firstName || !user.lastName || !user.isEmailVerified;
};

/**
 * Business rule: Check if user can access premium features
 */
export const canUserAccessPremiumFeatures = (user: User): boolean => {
  return user.tier === 'patron';
};

/**
 * Business rule: Check if user should be prompted for password setup
 */
export const shouldPromptPasswordSetup = (user: User): boolean => {
  // Prompt if user has OAuth providers but no password
  return user.oauthProviders.length > 0 && !user.hasPassword;
};
