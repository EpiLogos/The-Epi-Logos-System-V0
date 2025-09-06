/**
 * Canonical User Types Tests
 * Comprehensive unit tests for user type validation and utility functions
 */

import {
  User,
  AuthState,
  AuthTokens,
  AuthSession,
  OAuthProvider,
  UserPreferences,
  isValidUser,
  isValidAuthSession,
  getUserDisplayName,
  getUserProfilePicture,
  userHasProfilePicture,
  getUserOAuthProvider,
  userHasOAuthProvider,
  normalizeUserFromBackend
} from '../canonical-user.types';

describe('Canonical User Types', () => {
  // Test data fixtures
  const mockOAuthProvider: OAuthProvider = {
    provider: 'google',
    providerId: 'google-123',
    linkedAt: '2024-01-01T00:00:00.000Z',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg'
  };

  const mockUserPreferences: UserPreferences = {
    notifications: true,
    theme: 'dark',
    language: 'en'
  };

  const mockValidUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    name: 'Test User',
    profilePicture: 'https://example.com/avatar.jpg',
    tier: 'free',
    hasPassword: true,
    isEmailVerified: true,
    oauthProviders: [mockOAuthProvider],
    createdAt: '2024-01-01T00:00:00.000Z',
    preferences: mockUserPreferences
  };

  const mockAuthTokens: AuthTokens = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-123',
    expiresAt: '2024-12-31T23:59:59.000Z',
    tokenType: 'Bearer'
  };

  describe('isValidUser', () => {
    it('should validate a complete valid user', () => {
      expect(isValidUser(mockValidUser)).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(isValidUser(null)).toBe(false);
      expect(isValidUser(undefined)).toBe(false);
    });

    it('should reject non-object values', () => {
      expect(isValidUser('string')).toBe(false);
      expect(isValidUser(123)).toBe(false);
      expect(isValidUser([])).toBe(false);
    });

    it('should reject user without required fields', () => {
      expect(isValidUser({})).toBe(false);
      expect(isValidUser({ id: 'test' })).toBe(false);
      expect(isValidUser({ id: 'test', email: 'test@example.com' })).toBe(false);
    });

    it('should reject user with invalid hasPassword type', () => {
      const invalidUser = { ...mockValidUser, hasPassword: 'true' };
      expect(isValidUser(invalidUser)).toBe(false);
    });

    it('should reject user with invalid oauthProviders type', () => {
      const invalidUser = { ...mockValidUser, oauthProviders: 'not-array' };
      expect(isValidUser(invalidUser)).toBe(false);
    });
  });

  describe('isValidAuthSession', () => {
    const mockValidSession: AuthSession = {
      user: mockValidUser,
      isAuthenticated: true,
      tokens: mockAuthTokens,
      linkedAccount: null
    };

    it('should validate a complete valid session', () => {
      expect(isValidAuthSession(mockValidSession)).toBe(true);
    });

    it('should validate unauthenticated session', () => {
      const unauthenticatedSession: AuthSession = {
        user: null,
        isAuthenticated: false,
        tokens: null,
        linkedAccount: null
      };
      expect(isValidAuthSession(unauthenticatedSession)).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(isValidAuthSession(null)).toBe(false);
      expect(isValidAuthSession(undefined)).toBe(false);
    });

    it('should reject non-object values', () => {
      expect(isValidAuthSession('string')).toBe(false);
      expect(isValidAuthSession(123)).toBe(false);
    });

    it('should reject session without isAuthenticated boolean', () => {
      const invalidSession = { ...mockValidSession, isAuthenticated: 'true' };
      expect(isValidAuthSession(invalidSession)).toBe(false);
    });
  });

  describe('getUserDisplayName', () => {
    it('should return displayName if available', () => {
      const user = { ...mockValidUser, displayName: 'Custom Display Name' };
      expect(getUserDisplayName(user)).toBe('Custom Display Name');
    });

    it('should return firstName + lastName if available', () => {
      const user = { ...mockValidUser, firstName: 'John', lastName: 'Doe' };
      expect(getUserDisplayName(user)).toBe('John Doe');
    });

    it('should return firstName only if lastName missing', () => {
      const user = { ...mockValidUser, firstName: 'John', lastName: undefined };
      expect(getUserDisplayName(user)).toBe('John');
    });

    it('should return name if firstName/lastName missing', () => {
      const user = { ...mockValidUser, firstName: undefined, lastName: undefined, name: 'Test User' };
      expect(getUserDisplayName(user)).toBe('Test User');
    });

    it('should return email username as fallback', () => {
      const user = { 
        ...mockValidUser, 
        firstName: undefined, 
        lastName: undefined, 
        name: undefined,
        displayName: undefined,
        email: 'testuser@example.com'
      };
      expect(getUserDisplayName(user)).toBe('testuser');
    });
  });

  describe('getUserProfilePicture', () => {
    it('should return profilePicture if available', () => {
      const user = { ...mockValidUser, profilePicture: 'profile.jpg' };
      expect(getUserProfilePicture(user)).toBe('profile.jpg');
    });

    it('should return picture if profilePicture missing', () => {
      const user = { ...mockValidUser, profilePicture: undefined, picture: 'picture.jpg' };
      expect(getUserProfilePicture(user)).toBe('picture.jpg');
    });

    it('should return avatar if both profilePicture and picture missing', () => {
      const user = { ...mockValidUser, profilePicture: undefined, picture: undefined, avatar: 'avatar.jpg' };
      expect(getUserProfilePicture(user)).toBe('avatar.jpg');
    });

    it('should return undefined if no picture fields available', () => {
      const user = { ...mockValidUser, profilePicture: undefined, picture: undefined, avatar: undefined };
      expect(getUserProfilePicture(user)).toBeUndefined();
    });
  });

  describe('userHasProfilePicture', () => {
    it('should return true if user has profilePicture', () => {
      const user = { ...mockValidUser, profilePicture: 'profile.jpg' };
      expect(userHasProfilePicture(user)).toBe(true);
    });

    it('should return true if user has picture', () => {
      const user = { ...mockValidUser, profilePicture: undefined, picture: 'picture.jpg' };
      expect(userHasProfilePicture(user)).toBe(true);
    });

    it('should return false if user has no picture fields', () => {
      const user = { ...mockValidUser, profilePicture: undefined, picture: undefined, avatar: undefined };
      expect(userHasProfilePicture(user)).toBe(false);
    });
  });

  describe('getUserOAuthProvider', () => {
    it('should return OAuth provider if found', () => {
      const provider = getUserOAuthProvider(mockValidUser, 'google');
      expect(provider).toEqual(mockOAuthProvider);
    });

    it('should return undefined if provider not found', () => {
      const provider = getUserOAuthProvider(mockValidUser, 'github');
      expect(provider).toBeUndefined();
    });

    it('should handle empty oauthProviders array', () => {
      const user = { ...mockValidUser, oauthProviders: [] };
      const provider = getUserOAuthProvider(user, 'google');
      expect(provider).toBeUndefined();
    });
  });

  describe('userHasOAuthProvider', () => {
    it('should return true if user has OAuth provider', () => {
      expect(userHasOAuthProvider(mockValidUser, 'google')).toBe(true);
    });

    it('should return false if user does not have OAuth provider', () => {
      expect(userHasOAuthProvider(mockValidUser, 'github')).toBe(false);
    });

    it('should handle empty oauthProviders array', () => {
      const user = { ...mockValidUser, oauthProviders: [] };
      expect(userHasOAuthProvider(user, 'google')).toBe(false);
    });
  });

  describe('normalizeUserFromBackend', () => {
    const mockBackendUser = {
      _id: 'backend-user-123',
      email: 'backend@example.com',
      firstName: 'Backend',
      lastName: 'User',
      profilePicture: 'backend-avatar.jpg',
      tier: 'patron',
      hasPassword: true,
      isEmailVerified: true,
      oauthProviders: [mockOAuthProvider],
      createdAt: '2024-01-01T00:00:00.000Z',
      preferences: {
        notifications: false,
        theme: 'light',
        language: 'es'
      }
    };

    it('should normalize backend user data correctly', () => {
      const normalized = normalizeUserFromBackend(mockBackendUser);
      
      expect(normalized.id).toBe('backend-user-123');
      expect(normalized.email).toBe('backend@example.com');
      expect(normalized.firstName).toBe('Backend');
      expect(normalized.lastName).toBe('User');
      expect(normalized.tier).toBe('patron');
      expect(normalized.hasPassword).toBe(true);
      expect(normalized.isEmailVerified).toBe(true);
      expect(normalized.preferences.notifications).toBe(false);
      expect(normalized.preferences.theme).toBe('light');
      expect(normalized.preferences.language).toBe('es');
    });

    it('should handle missing optional fields', () => {
      const minimalBackendUser = {
        _id: 'minimal-user',
        email: 'minimal@example.com'
      };

      const normalized = normalizeUserFromBackend(minimalBackendUser);
      
      expect(normalized.id).toBe('minimal-user');
      expect(normalized.email).toBe('minimal@example.com');
      expect(normalized.tier).toBe('free'); // Default
      expect(normalized.hasPassword).toBe(false); // Default
      expect(normalized.isEmailVerified).toBe(false); // Default
      expect(normalized.oauthProviders).toEqual([]); // Default
      expect(normalized.preferences.notifications).toBe(true); // Default
      expect(normalized.preferences.theme).toBe('auto'); // Default
      expect(normalized.preferences.language).toBe('en'); // Default
    });

    it('should handle alternative field names', () => {
      const backendUserWithAlternatives = {
        id: 'alt-user-123', // Using 'id' instead of '_id'
        email: 'alt@example.com',
        picture: 'alt-picture.jpg', // Using 'picture' instead of 'profilePicture'
        google_id: 'google-alt-123' // Using 'google_id' instead of 'googleId'
      };

      const normalized = normalizeUserFromBackend(backendUserWithAlternatives);
      
      expect(normalized.id).toBe('alt-user-123');
      expect(normalized.picture).toBe('alt-picture.jpg');
      expect(normalized.googleId).toBe('google-alt-123');
    });
  });
});
