/**
 * Validation Domain Tests
 * Comprehensive unit tests for auth validation functions
 */

import {
  isValidEmail,
  isValidUserId,
  isValidUserTier,
  isValidOAuthProvider,
  isValidUserPreferences,
  isValidUserProfile,
  validateCompleteUser,
  isValidAuthTokens,
  areTokensExpired,
  validateAuthSession,
  validateAuthState,
  canUserPerformAdminActions,
  doesUserNeedProfileCompletion,
  canUserAccessPremiumFeatures,
  shouldPromptPasswordSetup
} from '../validation.domain';

import { User, AuthTokens, AuthSession, AuthState, OAuthProvider } from '../canonical-user.types';

describe('Validation Domain', () => {
  // Test data fixtures
  const mockOAuthProvider: OAuthProvider = {
    provider: 'google',
    providerId: 'google-123',
    linkedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockValidUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    name: 'Test User',
    tier: 'free',
    hasPassword: true,
    isEmailVerified: true,
    oauthProviders: [mockOAuthProvider],
    createdAt: '2024-01-01T00:00:00.000Z',
    preferences: {
      notifications: true,
      theme: 'dark',
      language: 'en'
    }
  };

  const mockValidTokens: AuthTokens = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-123',
    expiresAt: '2024-12-31T23:59:59.000Z',
    tokenType: 'Bearer'
  };

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('user123@test-domain.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('user space@domain.com')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidEmail(null as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
      expect(isValidEmail(123 as any)).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(isValidEmail('  test@example.com  ')).toBe(true);
      expect(isValidEmail('   ')).toBe(false);
    });
  });

  describe('isValidUserId', () => {
    it('should validate correct user ID formats', () => {
      expect(isValidUserId('user-123')).toBe(true);
      expect(isValidUserId('507f1f77bcf86cd799439011')).toBe(true); // MongoDB ObjectId
      expect(isValidUserId('550e8400-e29b-41d4-a716-446655440000')).toBe(true); // UUID
    });

    it('should reject invalid user IDs', () => {
      expect(isValidUserId('')).toBe(false);
      expect(isValidUserId('short')).toBe(false); // Too short
      expect(isValidUserId('   ')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isValidUserId(null as any)).toBe(false);
      expect(isValidUserId(undefined as any)).toBe(false);
      expect(isValidUserId(123 as any)).toBe(false);
    });
  });

  describe('isValidUserTier', () => {
    it('should validate correct tier values', () => {
      expect(isValidUserTier('free')).toBe(true);
      expect(isValidUserTier('patron')).toBe(true);
    });

    it('should reject invalid tier values', () => {
      expect(isValidUserTier('premium')).toBe(false);
      expect(isValidUserTier('basic')).toBe(false);
      expect(isValidUserTier('')).toBe(false);
      expect(isValidUserTier('FREE')).toBe(false); // Case sensitive
    });
  });

  describe('isValidOAuthProvider', () => {
    it('should validate correct OAuth provider', () => {
      expect(isValidOAuthProvider(mockOAuthProvider)).toBe(true);
    });

    it('should reject OAuth provider with missing fields', () => {
      expect(isValidOAuthProvider({})).toBe(false);
      expect(isValidOAuthProvider({ provider: 'google' })).toBe(false);
      expect(isValidOAuthProvider({ provider: 'google', providerId: 'id' })).toBe(false);
    });

    it('should reject OAuth provider with empty strings', () => {
      const invalidProvider = {
        provider: '',
        providerId: 'id',
        linkedAt: '2024-01-01T00:00:00.000Z'
      };
      expect(isValidOAuthProvider(invalidProvider)).toBe(false);
    });

    it('should reject non-object values', () => {
      expect(isValidOAuthProvider(null)).toBe(false);
      expect(isValidOAuthProvider('string')).toBe(false);
    });
  });

  describe('isValidUserPreferences', () => {
    const validPreferences = {
      notifications: true,
      theme: 'dark',
      language: 'en'
    };

    it('should validate correct preferences', () => {
      expect(isValidUserPreferences(validPreferences)).toBe(true);
    });

    it('should reject preferences with invalid notifications', () => {
      const invalid = { ...validPreferences, notifications: 'true' };
      expect(isValidUserPreferences(invalid)).toBe(false);
    });

    it('should reject preferences with invalid theme', () => {
      const invalid = { ...validPreferences, theme: 'blue' };
      expect(isValidUserPreferences(invalid)).toBe(false);
    });

    it('should reject preferences with empty language', () => {
      const invalid = { ...validPreferences, language: '' };
      expect(isValidUserPreferences(invalid)).toBe(false);
    });

    it('should reject non-object values', () => {
      expect(isValidUserPreferences(null)).toBe(false);
      expect(isValidUserPreferences('string')).toBe(false);
    });
  });

  describe('validateCompleteUser', () => {
    it('should validate complete valid user', () => {
      const result = validateCompleteUser(mockValidUser);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject user with invalid email', () => {
      const invalidUser = { ...mockValidUser, email: 'invalid-email' };
      const result = validateCompleteUser(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email address');
    });

    it('should reject user with missing name', () => {
      const invalidUser = { ...mockValidUser, name: '' };
      const result = validateCompleteUser(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User name is required');
    });

    it('should reject user with invalid hasPassword type', () => {
      const invalidUser = { ...mockValidUser, hasPassword: 'true' as any };
      const result = validateCompleteUser(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('hasPassword must be a boolean');
    });

    it('should reject non-object values', () => {
      const result = validateCompleteUser(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User must be an object');
    });
  });

  describe('isValidAuthTokens', () => {
    it('should validate correct auth tokens', () => {
      expect(isValidAuthTokens(mockValidTokens)).toBe(true);
    });

    it('should reject tokens with missing fields', () => {
      expect(isValidAuthTokens({})).toBe(false);
      expect(isValidAuthTokens({ accessToken: 'token' })).toBe(false);
    });

    it('should reject tokens with empty strings', () => {
      const invalidTokens = { ...mockValidTokens, accessToken: '' };
      expect(isValidAuthTokens(invalidTokens)).toBe(false);
    });

    it('should reject non-object values', () => {
      expect(isValidAuthTokens(null)).toBe(false);
      expect(isValidAuthTokens('string')).toBe(false);
    });
  });

  describe('areTokensExpired', () => {
    it('should return false for future expiration', () => {
      const futureTokens = {
        ...mockValidTokens,
        expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      };
      expect(areTokensExpired(futureTokens)).toBe(false);
    });

    it('should return true for past expiration', () => {
      const pastTokens = {
        ...mockValidTokens,
        expiresAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      };
      expect(areTokensExpired(pastTokens)).toBe(true);
    });

    it('should return true for tokens expiring within buffer time', () => {
      const soonToExpireTokens = {
        ...mockValidTokens,
        expiresAt: new Date(Date.now() + 60000).toISOString() // 1 minute from now (within 5 min buffer)
      };
      expect(areTokensExpired(soonToExpireTokens)).toBe(true);
    });

    it('should return true for invalid expiration date', () => {
      const invalidTokens = { ...mockValidTokens, expiresAt: 'invalid-date' };
      expect(areTokensExpired(invalidTokens)).toBe(true);
    });
  });

  describe('Business Rules', () => {
    describe('canUserPerformAdminActions', () => {
      it('should allow patron users with verified email', () => {
        const patronUser = { ...mockValidUser, tier: 'patron' as const };
        expect(canUserPerformAdminActions(patronUser)).toBe(true);
      });

      it('should deny free tier users', () => {
        expect(canUserPerformAdminActions(mockValidUser)).toBe(false);
      });

      it('should deny unverified patron users', () => {
        const unverifiedPatron = { ...mockValidUser, tier: 'patron' as const, isEmailVerified: false };
        expect(canUserPerformAdminActions(unverifiedPatron)).toBe(false);
      });
    });

    describe('doesUserNeedProfileCompletion', () => {
      it('should return false for complete profile', () => {
        expect(doesUserNeedProfileCompletion(mockValidUser)).toBe(false);
      });

      it('should return true for missing firstName', () => {
        const incompleteUser = { ...mockValidUser, firstName: undefined };
        expect(doesUserNeedProfileCompletion(incompleteUser)).toBe(true);
      });

      it('should return true for unverified email', () => {
        const unverifiedUser = { ...mockValidUser, isEmailVerified: false };
        expect(doesUserNeedProfileCompletion(unverifiedUser)).toBe(true);
      });
    });

    describe('canUserAccessPremiumFeatures', () => {
      it('should allow patron tier users', () => {
        const patronUser = { ...mockValidUser, tier: 'patron' as const };
        expect(canUserAccessPremiumFeatures(patronUser)).toBe(true);
      });

      it('should deny free tier users', () => {
        expect(canUserAccessPremiumFeatures(mockValidUser)).toBe(false);
      });
    });

    describe('shouldPromptPasswordSetup', () => {
      it('should prompt OAuth users without password', () => {
        const oauthUserWithoutPassword = { ...mockValidUser, hasPassword: false };
        expect(shouldPromptPasswordSetup(oauthUserWithoutPassword)).toBe(true);
      });

      it('should not prompt OAuth users with password', () => {
        expect(shouldPromptPasswordSetup(mockValidUser)).toBe(false);
      });

      it('should not prompt users without OAuth providers', () => {
        const userWithoutOAuth = { ...mockValidUser, oauthProviders: [], hasPassword: false };
        expect(shouldPromptPasswordSetup(userWithoutOAuth)).toBe(false);
      });
    });
  });
});
