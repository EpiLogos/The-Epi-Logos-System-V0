/**
 * Auth Domain Tests
 * Comprehensive unit tests for authentication business logic
 */

import {
  SignInButtonState,
  getSignInButtonState,
  createInitialAuthState,
  createAuthenticatedState,
  createUnauthenticatedState,
  createLoadingState,
  createErrorState,
  sanitizeUserForDisplay,
  validateAuthState,
  isCompleteAuthentication,
  canUserAccessResource,
  canUserPerformAction,
  processSignIn,
  processSignOut,
  processTokenRefresh,
  processUserUpdate
} from '../auth.domain';

import { User, AuthState, AuthTokens } from '../canonical-user.types';

describe('Auth Domain', () => {
  // Test data fixtures
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    name: 'Test User',
    tier: 'free',
    hasPassword: true,
    isEmailVerified: true,
    oauthProviders: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    preferences: {
      notifications: true,
      theme: 'dark',
      language: 'en'
    }
  };

  const mockTokens: AuthTokens = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-123',
    expiresAt: '2024-12-31T23:59:59.000Z',
    tokenType: 'Bearer'
  };

  describe('getSignInButtonState', () => {
    it('should return sign-in state for unauthenticated user', () => {
      const state = getSignInButtonState(false);
      
      expect(state.canSignIn).toBe(true);
      expect(state.buttonText).toBe('Sign in with Google');
      expect(state.ariaLabel).toBe('Sign in with Google');
      expect(state.showAlreadySignedIn).toBe(false);
    });

    it('should return already signed in state for authenticated user', () => {
      const state = getSignInButtonState(true);
      
      expect(state.canSignIn).toBe(false);
      expect(state.buttonText).toBe('');
      expect(state.ariaLabel).toBe('');
      expect(state.showAlreadySignedIn).toBe(true);
    });

    it('should return link account state for authenticated user with linkAccount=true', () => {
      const state = getSignInButtonState(true, true);
      
      expect(state.canSignIn).toBe(true);
      expect(state.buttonText).toBe('Link Google Account');
      expect(state.ariaLabel).toBe('Link Google Account');
      expect(state.showAlreadySignedIn).toBe(false);
    });

    it('should support custom provider names', () => {
      const state = getSignInButtonState(false, false, 'GitHub');
      
      expect(state.buttonText).toBe('Sign in with GitHub');
      expect(state.ariaLabel).toBe('Sign in with GitHub');
    });
  });

  describe('Auth State Creation Functions', () => {
    describe('createInitialAuthState', () => {
      it('should create initial loading state', () => {
        const state = createInitialAuthState();
        
        expect(state.isAuthenticated).toBe(false);
        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
        expect(state.user).toBeNull();
        expect(state.tokens).toBeNull();
        expect(state.linkedAccount).toBeNull();
      });
    });

    describe('createAuthenticatedState', () => {
      it('should create authenticated state with user only', () => {
        const state = createAuthenticatedState(mockUser);
        
        expect(state.isAuthenticated).toBe(true);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
        expect(state.user).toEqual(mockUser);
        expect(state.tokens).toBeNull();
        expect(state.linkedAccount).toBeNull();
      });

      it('should create authenticated state with user and tokens', () => {
        const state = createAuthenticatedState(mockUser, mockTokens);
        
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(mockUser);
        expect(state.tokens).toEqual(mockTokens);
      });

      it('should throw error for invalid user data', () => {
        const invalidUser = { id: 'test' } as any;
        
        expect(() => createAuthenticatedState(invalidUser)).toThrow('Invalid user data provided');
      });
    });

    describe('createUnauthenticatedState', () => {
      it('should create unauthenticated state without error', () => {
        const state = createUnauthenticatedState();
        
        expect(state.isAuthenticated).toBe(false);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
        expect(state.user).toBeNull();
        expect(state.tokens).toBeNull();
        expect(state.linkedAccount).toBeNull();
      });

      it('should create unauthenticated state with error', () => {
        const state = createUnauthenticatedState('Authentication failed');
        
        expect(state.isAuthenticated).toBe(false);
        expect(state.error).toBe('Authentication failed');
      });
    });

    describe('createLoadingState', () => {
      it('should create loading state without user', () => {
        const state = createLoadingState();
        
        expect(state.isAuthenticated).toBe(false);
        expect(state.isLoading).toBe(true);
        expect(state.user).toBeNull();
      });

      it('should create loading state with existing user', () => {
        const state = createLoadingState(mockUser, mockTokens);
        
        expect(state.isAuthenticated).toBe(true);
        expect(state.isLoading).toBe(true);
        expect(state.user).toEqual(mockUser);
        expect(state.tokens).toEqual(mockTokens);
      });
    });

    describe('createErrorState', () => {
      it('should create error state without user', () => {
        const state = createErrorState('Something went wrong');
        
        expect(state.isAuthenticated).toBe(false);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Something went wrong');
        expect(state.user).toBeNull();
      });

      it('should create error state with existing user', () => {
        const state = createErrorState('Token refresh failed', mockUser, mockTokens);
        
        expect(state.isAuthenticated).toBe(true);
        expect(state.error).toBe('Token refresh failed');
        expect(state.user).toEqual(mockUser);
        expect(state.tokens).toEqual(mockTokens);
      });
    });
  });

  describe('sanitizeUserForDisplay', () => {
    it('should include safe fields for display', () => {
      const sanitized = sanitizeUserForDisplay(mockUser);
      
      expect(sanitized.id).toBe(mockUser.id);
      expect(sanitized.email).toBe(mockUser.email);
      expect(sanitized.name).toBe(mockUser.name);
      expect(sanitized.tier).toBe(mockUser.tier);
      expect(sanitized.isEmailVerified).toBe(mockUser.isEmailVerified);
    });

    it('should exclude sensitive fields', () => {
      const userWithSensitiveData = {
        ...mockUser,
        googleId: 'google-123',
        metadata: { ipAddress: '192.168.1.1' }
      };
      
      const sanitized = sanitizeUserForDisplay(userWithSensitiveData);
      
      expect(sanitized).not.toHaveProperty('googleId');
      expect(sanitized).not.toHaveProperty('metadata');
    });
  });

  describe('validateAuthState', () => {
    it('should validate consistent authenticated state', () => {
      const state = createAuthenticatedState(mockUser, mockTokens);
      expect(validateAuthState(state)).toBe(true);
    });

    it('should validate consistent unauthenticated state', () => {
      const state = createUnauthenticatedState();
      expect(validateAuthState(state)).toBe(true);
    });

    it('should reject authenticated state without user', () => {
      const invalidState = {
        isAuthenticated: true,
        isLoading: false,
        error: null,
        user: null,
        tokens: mockTokens,
        linkedAccount: null
      };
      expect(validateAuthState(invalidState)).toBe(false);
    });

    it('should reject unauthenticated state with user', () => {
      const invalidState = {
        isAuthenticated: false,
        isLoading: false,
        error: null,
        user: mockUser,
        tokens: null,
        linkedAccount: null
      };
      expect(validateAuthState(invalidState)).toBe(false);
    });
  });

  describe('isCompleteAuthentication', () => {
    it('should return true for complete authentication', () => {
      const state = createAuthenticatedState(mockUser, mockTokens);
      expect(isCompleteAuthentication(state)).toBe(true);
    });

    it('should return false for unauthenticated state', () => {
      const state = createUnauthenticatedState();
      expect(isCompleteAuthentication(state)).toBe(false);
    });

    it('should return false for authenticated state with incomplete user', () => {
      const incompleteUser = { ...mockUser, name: '' };
      const state = createAuthenticatedState(incompleteUser, mockTokens);
      expect(isCompleteAuthentication(state)).toBe(false);
    });
  });

  describe('canUserAccessResource', () => {
    it('should allow free tier user to access free resources', () => {
      expect(canUserAccessResource(mockUser)).toBe(true);
    });

    it('should deny access to patron resources for free tier user', () => {
      expect(canUserAccessResource(mockUser, 'patron')).toBe(false);
    });

    it('should allow patron tier user to access patron resources', () => {
      const patronUser = { ...mockUser, tier: 'patron' as const };
      expect(canUserAccessResource(patronUser, 'patron')).toBe(true);
    });

    it('should deny access if email verification required but not verified', () => {
      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      expect(canUserAccessResource(unverifiedUser, undefined, true)).toBe(false);
    });

    it('should deny access for null user', () => {
      expect(canUserAccessResource(null)).toBe(false);
    });
  });

  describe('canUserPerformAction', () => {
    it('should allow all authenticated users to view account', () => {
      expect(canUserPerformAction(mockUser, 'view_account')).toBe(true);
    });

    it('should require email verification for profile editing', () => {
      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      expect(canUserPerformAction(unverifiedUser, 'edit_profile')).toBe(false);
      expect(canUserPerformAction(mockUser, 'edit_profile')).toBe(true);
    });

    it('should require existing password for password changes', () => {
      const userWithoutPassword = { ...mockUser, hasPassword: false };
      expect(canUserPerformAction(userWithoutPassword, 'change_password')).toBe(false);
      expect(canUserPerformAction(mockUser, 'change_password')).toBe(true);
    });

    it('should require patron tier for admin access', () => {
      expect(canUserPerformAction(mockUser, 'admin_access')).toBe(false);
      
      const patronUser = { ...mockUser, tier: 'patron' as const };
      expect(canUserPerformAction(patronUser, 'admin_access')).toBe(true);
    });

    it('should deny all actions for null user', () => {
      expect(canUserPerformAction(null, 'view_account')).toBe(false);
    });
  });
});
