/**
 * Unified Auth Context Tests
 * Comprehensive tests for React auth context integration
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnifiedAuthProvider, useUnifiedAuth } from '../unified-auth-context';
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
  expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  tokenType: 'Bearer'
};

// Test component that uses auth context
function TestComponent() {
  const {
    isAuthenticated,
    isLoading,
    user,
    error,
    signIn,
    signOut,
    getUserDisplayName,
    canAccess,
    canPerform
  } = useUnifiedAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {isLoading ? 'Loading' : isAuthenticated ? 'Authenticated' : 'Unauthenticated'}
      </div>
      
      {error && <div data-testid="error">{error}</div>}
      
      {user && (
        <div data-testid="user-info">
          <div data-testid="user-name">{getUserDisplayName()}</div>
          <div data-testid="user-email">{user.email}</div>
          <div data-testid="user-tier">{user.tier}</div>
          <div data-testid="has-password">{user.hasPassword ? 'Yes' : 'No'}</div>
        </div>
      )}
      
      <div data-testid="permissions">
        <div data-testid="can-access-free">{canAccess('free') ? 'Yes' : 'No'}</div>
        <div data-testid="can-access-patron">{canAccess('patron') ? 'Yes' : 'No'}</div>
        <div data-testid="can-view-account">{canPerform('view_account') ? 'Yes' : 'No'}</div>
      </div>
      
      <button 
        data-testid="sign-in-btn" 
        onClick={() => signIn({ email: 'test@example.com', password: 'password' })}
      >
        Sign In
      </button>
      
      <button data-testid="sign-out-btn" onClick={signOut}>
        Sign Out
      </button>
    </div>
  );
}

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <UnifiedAuthProvider config={{ apiBaseURL: 'http://localhost:8000' }}>
      {children}
    </UnifiedAuthProvider>
  );
}

describe('UnifiedAuthContext', () => {
  let mockStorageAdapter: any;
  let mockAPIClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get mocked adapters
    const { createSessionStorageAdapter, createAPIClient } = require('@/infrastructure/auth');
    mockStorageAdapter = createSessionStorageAdapter();
    mockAPIClient = createAPIClient();
  });

  describe('Initial State', () => {
    it('should start with loading state', async () => {
      mockStorageAdapter.retrieveSession.mockResolvedValue(null);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should start loading
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Loading');

      // Should resolve to unauthenticated
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
      });
    });

    it('should restore session from storage', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });
    });

    it('should handle corrupted session data', async () => {
      const corruptedSession = {
        user: { id: 'invalid' }, // Missing required fields
        isAuthenticated: true,
        tokens: null,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(corruptedSession);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
        expect(mockStorageAdapter.clearSession).toHaveBeenCalled();
      });
    });
  });

  describe('Sign In Flow', () => {
    it('should handle successful sign in', async () => {
      mockStorageAdapter.retrieveSession.mockResolvedValue(null);
      mockAPIClient.signIn.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
        linkedAccount: null
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
      });

      // Click sign in
      await act(async () => {
        await user.click(screen.getByTestId('sign-in-btn'));
      });

      // Should show loading then authenticated
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      });

      // Should store session
      expect(mockStorageAdapter.storeSession).toHaveBeenCalledWith({
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      });

      // Should set API token
      expect(mockAPIClient.setAuthToken).toHaveBeenCalledWith(mockTokens.accessToken);
    });

    it('should handle sign in errors', async () => {
      mockStorageAdapter.retrieveSession.mockResolvedValue(null);
      mockAPIClient.signIn.mockRejectedValue(new Error('Invalid credentials'));

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
      });

      await act(async () => {
        await user.click(screen.getByTestId('sign-in-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Sign-in failed');
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
      });
    });
  });

  describe('Sign Out Flow', () => {
    it('should handle successful sign out', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);
      mockAPIClient.signOut.mockResolvedValue(undefined);

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Wait for session to load
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      // Click sign out
      await act(async () => {
        await user.click(screen.getByTestId('sign-out-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
      });

      // Should clear storage and API token
      expect(mockStorageAdapter.clearSession).toHaveBeenCalled();
      expect(mockAPIClient.clearAuthToken).toHaveBeenCalled();
    });

    it('should handle sign out API errors gracefully', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);
      mockAPIClient.signOut.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      await act(async () => {
        await user.click(screen.getByTestId('sign-out-btn'));
      });

      // Should still sign out locally even if API fails
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
      });

      expect(mockStorageAdapter.clearSession).toHaveBeenCalled();
      expect(mockAPIClient.clearAuthToken).toHaveBeenCalled();
    });
  });

  describe('Authorization Helpers', () => {
    it('should correctly check access permissions', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      // Free tier user should have access to free but not patron
      expect(screen.getByTestId('can-access-free')).toHaveTextContent('Yes');
      expect(screen.getByTestId('can-access-patron')).toHaveTextContent('No');
      expect(screen.getByTestId('can-view-account')).toHaveTextContent('Yes');
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

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      // Patron user should have access to both tiers
      expect(screen.getByTestId('can-access-free')).toHaveTextContent('Yes');
      expect(screen.getByTestId('can-access-patron')).toHaveTextContent('Yes');
    });
  });

  describe('User Display Helpers', () => {
    it('should display user information correctly', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('user-tier')).toHaveTextContent('free');
        expect(screen.getByTestId('has-password')).toHaveTextContent('Yes');
      });
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

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('has-password')).toHaveTextContent('No');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle storage initialization errors', async () => {
      mockStorageAdapter.retrieveSession.mockRejectedValue(new Error('Storage error'));

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to initialize authentication');
      });
    });

    it('should handle invalid auth state', async () => {
      // Mock an invalid state that would fail validation
      mockAPIClient.signIn.mockResolvedValue({
        user: null, // Invalid: authenticated but no user
        tokens: mockTokens,
        linkedAccount: null
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
      });

      await act(async () => {
        await user.click(screen.getByTestId('sign-in-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Sign-in failed');
      });
    });
  });

  describe('Context Provider Error', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useUnifiedAuth must be used within a UnifiedAuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
