/**
 * User and authentication type definitions
 */

export interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  tier: 'Free' | 'Patron';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  preferences?: UserPreferences;
  profile?: UserProfile;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    wisdom: boolean;
    updates: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    dataSharing: boolean;
  };
}

export interface UserProfile {
  bio?: string;
  location?: string;
  website?: string;
  birthDate?: string;
  interests?: string[];
  practiceAreas?: string[];
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

// Authentication types
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: 'Bearer';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
  acceptTerms: boolean;
}

export interface OAuthProvider {
  provider: 'google' | 'github';
  redirectUrl: string;
  state?: string;
}

// Session types
export interface UserSession {
  user: User;
  token: AuthToken;
  isAuthenticated: boolean;
  permissions: string[];
}
