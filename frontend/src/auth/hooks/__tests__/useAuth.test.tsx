/**
 * useAuth Hook Tests
 * Comprehensive tests for the primary authentication hook
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAuth, useAuthSimple, useAuthState, useAuthActions, useAuthz } from '../useAuth';
import { UnifiedAuthProvider } from '../../unified-auth-context';
import type { User, AuthTokens } from '@/domains/auth';

// Mock infrastructure adapters
jest.mock('@/infrastructure/auth', () => ({
  createSessionStorageAdapter: jest.fn(() => ({
    storeUser: jest.fn(),
    retrieveUser: jest.fn(),
    clearUser: jest.fn(),
    storeTokens: jest.fn(),
    retrieveTokens: jest.fn(),
    clearTokens: jest.fn(),
    storeSession: jest.fn(),
    retrieveSession: jest.fn(),
    clearSession: jest.fn(),
    isAvailable: jest.fn(() => true)
  })),
  createAPIClient: jest.fn(() => ({
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshTokens: jest.fn(),
    getCurrentUser: jest.fn(),
    updateUser: jest.fn(),
    changePassword: jest.fn(),
    initiateOAuth: jest.fn(),
    completeOAuth: jest.fn(),
    linkAccount: jest.fn(),
    unlinkAccount: jest.fn(),
    setAuthToken: jest.fn(),
    clearAuthToken: jest.fn()
  }))
}));

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
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  tokenType: 'Bearer'
};

// Test wrapper
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <UnifiedAuthProvider config={{ apiBaseURL: 'http://localhost:8000' }}>
      {children}
    </UnifiedAuthProvider>
  );
}

describe('useAuth Hook', () => {
  let mockStorageAdapter: any;
  let mockAPIClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { createSessionStorageAdapter, createAPIClient } = require('@/infrastructure/auth');
    mockStorageAdapter = createSessionStorageAdapter();
    mockAPIClient = createAPIClient();
  });

  describe('Basic Functionality', () => {
    it('should return initial unauthenticated state', async () => {
      mockStorageAdapter.retrieveSession.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      });

      // Should start loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should return authenticated state when session exists', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('Authentication Actions', () => {
    it('should handle sign in', async () => {
      mockStorageAdapter.retrieveSession.mockResolvedValue(null);
      mockAPIClient.signIn.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
        linkedAccount: null
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isAuthenticated).toBe(false);

      await act(async () => {
        await result.current.signIn({
          email: 'test@example.com',
          password: 'password'
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(mockAPIClient.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });

    it('should handle sign out', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);
      mockAPIClient.signOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockAPIClient.signOut).toHaveBeenCalled();
    });

    it('should handle profile updates', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      const updatedUser = { ...mockUser, firstName: 'Updated' };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);
      mockAPIClient.updateUser.mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.updateProfile({ firstName: 'Updated' });
      });

      expect(mockAPIClient.updateUser).toHaveBeenCalledWith({ firstName: 'Updated' });
    });

    it('should handle password changes', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);
      mockAPIClient.changePassword.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.changePassword('oldPassword', 'newPassword');
      });

      expect(mockAPIClient.changePassword).toHaveBeenCalledWith('oldPassword', 'newPassword');
    });
  });

  describe('Authorization Helpers', () => {
    it('should check access permissions correctly', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Free tier user
      expect(result.current.canAccess('free')).toBe(true);
      expect(result.current.canAccess('patron')).toBe(false);
      expect(result.current.canPerform('view_account')).toBe(true);
    });

    it('should handle patron tier permissions', async () => {
      const patronUser = { ...mockUser, tier: 'patron' as const };
      const mockSession = {
        user: patronUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.canAccess('free')).toBe(true);
      expect(result.current.canAccess('patron')).toBe(true);
    });
  });

  describe('User Info Helpers', () => {
    it('should provide user information helpers', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.getUserDisplayName()).toBe('Test User');
      expect(result.current.hasPassword()).toBe(true);
      expect(result.current.isEmailVerified()).toBe(true);
      expect(result.current.getUserTier()).toBe('free');
    });

    it('should handle users without passwords', async () => {
      const userWithoutPassword = { ...mockUser, hasPassword: false };
      const mockSession = {
        user: userWithoutPassword,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.hasPassword()).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('should provide auth header', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.getAuthHeader()).toBe(`Bearer ${mockTokens.accessToken}`);
    });

    it('should validate session', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isSessionValid()).toBe(true);
    });
  });
});

describe('useAuthSimple Hook', () => {
  it('should return simplified auth interface', async () => {
    const mockSession = {
      user: mockUser,
      isAuthenticated: true,
      tokens: mockTokens,
      linkedAccount: null
    };

    const { createSessionStorageAdapter } = require('@/infrastructure/auth');
    const mockStorageAdapter = createSessionStorageAdapter();
    mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);

    const { result } = renderHook(() => useAuthSimple(), {
      wrapper: TestWrapper
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current).toHaveProperty('isAuthenticated', true);
    expect(result.current).toHaveProperty('user', mockUser);
    expect(result.current).toHaveProperty('signOut');
    expect(result.current).not.toHaveProperty('updateProfile');
  });
});

describe('useAuthState Hook', () => {
  it('should return only state without actions', async () => {
    const mockSession = {
      user: mockUser,
      isAuthenticated: true,
      tokens: mockTokens,
      linkedAccount: null
    };

    const { createSessionStorageAdapter } = require('@/infrastructure/auth');
    const mockStorageAdapter = createSessionStorageAdapter();
    mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);

    const { result } = renderHook(() => useAuthState(), {
      wrapper: TestWrapper
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current).toHaveProperty('isAuthenticated', true);
    expect(result.current).toHaveProperty('user', mockUser);
    expect(result.current).not.toHaveProperty('signIn');
    expect(result.current).not.toHaveProperty('signOut');
  });
});

describe('useAuthActions Hook', () => {
  it('should return only actions without state', async () => {
    const { result } = renderHook(() => useAuthActions(), {
      wrapper: TestWrapper
    });

    expect(result.current).toHaveProperty('signIn');
    expect(result.current).toHaveProperty('signOut');
    expect(result.current).toHaveProperty('updateProfile');
    expect(result.current).not.toHaveProperty('isAuthenticated');
    expect(result.current).not.toHaveProperty('user');
  });
});

describe('useAuthz Hook', () => {
  it('should return authorization helpers', async () => {
    const mockSession = {
      user: mockUser,
      isAuthenticated: true,
      tokens: mockTokens,
      linkedAccount: null
    };

    const { createSessionStorageAdapter } = require('@/infrastructure/auth');
    const mockStorageAdapter = createSessionStorageAdapter();
    mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);

    const { result } = renderHook(() => useAuthz(), {
      wrapper: TestWrapper
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current).toHaveProperty('canAccess');
    expect(result.current).toHaveProperty('canPerform');
    expect(result.current).toHaveProperty('user', mockUser);
    expect(result.current.canAccess('free')).toBe(true);
  });
});
