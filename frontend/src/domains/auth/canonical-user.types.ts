/**
 * Canonical User Type Definitions
 * 
 * This is the SINGLE SOURCE OF TRUTH for all user-related types in the frontend.
 * Combines all fields from backend model and frontend requirements.
 * 
 * REPLACES:
 * - frontend/src/types/User.ts
 * - frontend/src/domains/auth/session.domain.ts User interface
 * - frontend/src/contexts/AuthContext.tsx User interface
 * - Any other User type definitions
 */

// Core user data that matches backend model structure
export interface User {
  // Core identity fields (from backend User model)
  id: string;                           // Maps to backend _id (converted to string)
  email: string;                        // Required, validated email
  firstName?: string;                   // From backend firstName
  lastName?: string;                    // From backend lastName
  
  // Display fields (computed/derived)
  name: string;                         // Computed from firstName + lastName or fallback
  displayName?: string;                 // Optional display override
  username?: string;                    // Optional username (frontend extension)
  
  // Profile fields
  profilePicture?: string;              // From backend profilePicture
  picture?: string;                     // Alias for profilePicture (OAuth compatibility)
  avatar?: string;                      // Alias for profilePicture (frontend compatibility)
  
  // Subscription and tier
  tier: 'free' | 'patron';              // From backend tier (normalized case)

  // Authorization fields
  isAdmin: boolean;                     // From backend isAdmin

  // Authentication status fields
  hasPassword: boolean;                 // From backend has_password() method
  isEmailVerified: boolean;             // From backend isEmailVerified

  // MFA (Multi-Factor Authentication) fields
  mfaEnabled: boolean;                  // From backend mfaEnabled
  hasMFA: boolean;                      // From backend has_mfa() method
  
  // OAuth integration
  oauthProviders: OAuthProvider[];      // From backend oauthProviders
  googleId?: string;                    // Computed from oauthProviders (OAuth compatibility)
  
  // Timestamps (ISO strings for frontend)
  createdAt: string;                    // From backend createdAt (ISO string)
  updatedAt?: string;                   // Frontend extension (optional)
  lastLoginAt?: string;                 // From backend lastLoginAt (ISO string)
  lastActiveAt?: string;                // From backend lastActiveAt (ISO string)
  
  // User preferences and profile
  preferences: UserPreferences;         // Enhanced preferences object
  profile?: UserProfile;                // Optional extended profile
  
  // Metadata (optional, for admin/analytics)
  metadata?: UserMetadata;              // From backend metadata
}

// OAuth provider data (matches backend OAuthProvider)
export interface OAuthProvider {
  provider: string;                     // 'google', 'github', etc.
  providerId: string;                   // Provider-specific user ID
  linkedAt: string;                     // ISO string timestamp
  
  // Additional OAuth fields for frontend use
  email?: string;                       // Provider email (may differ from user.email)
  name?: string;                        // Provider display name
  picture?: string;                     // Provider profile picture
}

// Enhanced user preferences (combines backend + frontend needs)
export interface UserPreferences {
  // Core preferences (from backend)
  notifications: boolean;               // From backend notifications
  theme: 'light' | 'dark' | 'auto';    // From backend theme
  language: string;                     // From backend language (ISO code)
  
  // Frontend extensions
  timezone?: string;                    // User timezone
  
  // Detailed notification preferences
  notificationSettings?: {
    email: boolean;
    push: boolean;
    wisdom: boolean;
    updates: boolean;
  };
  
  // Privacy settings
  privacy?: {
    profileVisibility: 'public' | 'private';
    dataSharing: boolean;
  };
}

// Extended user profile (frontend extension)
export interface UserProfile {
  bio?: string;
  location?: string;
  website?: string;
  birthDate?: string;
  interests?: string[];
  practiceAreas?: string[];
  experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

// User metadata (from backend)
export interface UserMetadata {
  registrationSource: string;           // 'email', 'oauth'
  ipAddress?: string;                   // Registration IP
  userAgent?: string;                   // Registration user agent
}

// Authentication-related types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;                     // Optional OAuth ID token
  expiresAt: string;                    // ISO string timestamp
  tokenType?: 'Bearer';                 // Token type (default Bearer)
}

export interface LinkedAccount {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  linkedAt: string;                     // ISO string timestamp
}

// Session and authentication state
export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
  tokens: AuthTokens | null;
  linkedAccount?: LinkedAccount | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  linkedAccount: LinkedAccount | null;
  error: string | null;
}

// Utility types for user operations
export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  profilePicture?: string;
  preferences?: Partial<UserPreferences>;
  profile?: Partial<UserProfile>;
  isAdmin?: boolean;  // Admin status (requires admin privileges to change)
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  acceptTerms: boolean;
}

// Type guards and validation
export const isValidUser = (user: any): user is User => {
  return !!(
    user &&
    typeof user === 'object' &&
    user.id &&
    user.email &&
    user.name &&
    typeof user.hasPassword === 'boolean' &&
    Array.isArray(user.oauthProviders)
  );
};

export const isValidAuthSession = (session: any): session is AuthSession => {
  return !!(
    session &&
    typeof session === 'object' &&
    typeof session.isAuthenticated === 'boolean' &&
    (session.user === null || isValidUser(session.user))
  );
};

// User utility functions
export const getUserDisplayName = (user: User): string => {
  if (user.displayName) return user.displayName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.name) return user.name;
  return user.email.split('@')[0]; // Fallback to email username
};

export const getUserProfilePicture = (user: User): string | undefined => {
  return user.profilePicture || user.picture || user.avatar;
};

export const userHasProfilePicture = (user: User): boolean => {
  return !!(user.profilePicture || user.picture || user.avatar);
};

export const getUserOAuthProvider = (user: User, provider: string): OAuthProvider | undefined => {
  return user.oauthProviders.find(oauth => oauth.provider === provider);
};

export const userHasOAuthProvider = (user: User, provider: string): boolean => {
  return user.oauthProviders.some(oauth => oauth.provider === provider);
};

// Conversion utilities for backend compatibility
export const normalizeUserFromBackend = (backendUser: any): User => {
  if (!backendUser || typeof backendUser !== 'object') {
    throw new Error('Invalid backend user data: user object is null or undefined');
  }

  return {
    id: backendUser._id || backendUser.id,
    email: backendUser.email,
    firstName: backendUser.firstName,
    lastName: backendUser.lastName,
    name: backendUser.name || getUserDisplayName(backendUser),
    displayName: backendUser.displayName,
    profilePicture: backendUser.profilePicture,
    picture: backendUser.profilePicture || backendUser.picture,
    tier: backendUser.tier === 'patron' ? 'patron' : 'free',
    isAdmin: backendUser.isAdmin === true,
    hasPassword: backendUser.hasPassword === true,
    isEmailVerified: backendUser.isEmailVerified === true,
    mfaEnabled: backendUser.mfaEnabled === true,
    hasMFA: backendUser.hasMFA === true,
    oauthProviders: backendUser.oauthProviders || [],
    googleId: backendUser.google_id || backendUser.googleId,
    createdAt: backendUser.createdAt,
    lastLoginAt: backendUser.lastLoginAt,
    lastActiveAt: backendUser.lastActiveAt,
    preferences: {
      notifications: backendUser.preferences?.notifications !== false,
      theme: backendUser.preferences?.theme || 'auto',
      language: backendUser.preferences?.language || 'en',
      ...backendUser.preferences
    },
    profile: backendUser.profile,
    metadata: backendUser.metadata
  };
};
