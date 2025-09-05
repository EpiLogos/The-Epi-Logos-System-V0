/**
 * OAuth Context Integration Tests
 * RED Phase - These tests will fail until account management integration is complete
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { OAuthProvider, useOAuth } from '../OAuthContext';

// Mock fetch for OAuth API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Google OAuth API
const mockGoogleAuth = {
  generateAuthUrl: vi.fn(),
  getTokenInfo: vi.fn(),
  exchangeCodeForTokens: vi.fn(),
};

vi.mock('../googleAuth', () => ({
  GoogleAuth: vi.fn().mockImplementation(() => mockGoogleAuth),
}));

// Test component that uses OAuth context
const TestComponent = () => {
  const {
    isAuthenticated,
    isLoading,
    user,
    error,
    signIn,
    signOut,
    refreshToken,
  } = useOAuth();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <div>Welcome, {user?.firstName || 'User'}</div>
          <div>Email: {user?.email}</div>
          <div>Tier: {user?.tier}</div>
          <button onClick={signOut}>Sign Out</button>
          <button onClick={refreshToken}>Refresh Token</button>
        </div>
      ) : (
        <div>
          <div>Please sign in</div>
          <button onClick={() => signIn()}>Sign In with Google</button>
        </div>
      )}
    </div>
  );
};

// Mock user data
const mockUserData = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  profilePicture: 'https://example.com/avatar.jpg',
  tier: 'free' as const,
  preferences: {
    theme: 'dark' as const,
    notifications: true,
    language: 'en',
  },
};

describe('OAuth Context Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    
    // Reset Google OAuth mocks
    mockGoogleAuth.generateAuthUrl.mockReturnValue('https://accounts.google.com/oauth/authorize');
    mockGoogleAuth.getTokenInfo.mockResolvedValue({
      access_token: 'mock-access-token',
      id_token: 'mock-id-token',
      expires_in: 3600,
    });
    mockGoogleAuth.exchangeCodeForTokens.mockResolvedValue({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      id_token: 'mock-id-token',
      expires_in: 3600,
    });

    // Clear localStorage
    localStorage.clear();
    
    // Mock window.location
    delete (window as any).location;
    window.location = { ...window.location, href: 'http://localhost:3000' };
  });

  describe('Authentication Flow Integration', () => {
    it('should handle complete OAuth sign-in flow', async () => {
      // Mock successful user profile fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserData),
      });

      const user = userEvent.setup();
      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      expect(screen.getByText('Please sign in')).toBeInTheDocument();

      const signInButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(signInButton);

      // Should redirect to OAuth URL
      expect(mockGoogleAuth.generateAuthUrl).toHaveBeenCalled();
    });

    it('should handle OAuth callback with authorization code', async () => {
      // Mock successful token exchange and user fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserData),
      });

      // Simulate OAuth callback URL
      window.location.search = '?code=auth-code&state=oauth-state';

      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(mockGoogleAuth.exchangeCodeForTokens).toHaveBeenCalledWith('auth-code');
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome, John')).toBeInTheDocument();
        expect(screen.getByText('Email: test@example.com')).toBeInTheDocument();
        expect(screen.getByText('Tier: free')).toBeInTheDocument();
      });
    });

    it('should handle OAuth error callback', async () => {
      // Simulate OAuth error callback
      window.location.search = '?error=access_denied&error_description=User denied access';

      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/error.*access_denied/i)).toBeInTheDocument();
      });
    });

    it('should restore authentication from localStorage', async () => {
      // Mock stored tokens in localStorage
      localStorage.setItem('oauth_access_token', 'stored-access-token');
      localStorage.setItem('oauth_refresh_token', 'stored-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() + 3600000));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserData),
      });

      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome, John')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/users/profile', expect.any(Object));
    });
  });

  describe('Token Management Integration', () => {
    it('should automatically refresh expired tokens', async () => {
      // Mock expired token
      localStorage.setItem('oauth_access_token', 'expired-token');
      localStorage.setItem('oauth_refresh_token', 'valid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() - 1000)); // Expired

      // Mock token refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
        }),
      });

      // Mock user profile fetch with new token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserData),
      });

      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', expect.any(Object));
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome, John')).toBeInTheDocument();
      });
    });

    it('should handle refresh token failure and sign out user', async () => {
      localStorage.setItem('oauth_access_token', 'expired-token');
      localStorage.setItem('oauth_refresh_token', 'invalid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() - 1000));

      // Mock failed token refresh
      mockFetch.mockRejectedValueOnce(new Error('Invalid refresh token'));

      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Please sign in')).toBeInTheDocument();
      });

      // Should clear localStorage
      expect(localStorage.getItem('oauth_access_token')).toBeNull();
      expect(localStorage.getItem('oauth_refresh_token')).toBeNull();
    });

    it('should handle manual token refresh', async () => {
      localStorage.setItem('oauth_access_token', 'current-token');
      localStorage.setItem('oauth_refresh_token', 'valid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() + 3600000));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'refreshed-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
          }),
        });

      const user = userEvent.setup();
      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome, John')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh token/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', expect.any(Object));
      });
    });
  });

  describe('User Profile Integration', () => {
    it('should fetch and update user profile data', async () => {
      localStorage.setItem('oauth_access_token', 'valid-token');
      localStorage.setItem('oauth_refresh_token', 'valid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() + 3600000));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserData),
      });

      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/profile',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer valid-token',
            }),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome, John')).toBeInTheDocument();
        expect(screen.getByText('Email: test@example.com')).toBeInTheDocument();
      });
    });

    it('should handle user profile fetch failure', async () => {
      localStorage.setItem('oauth_access_token', 'valid-token');
      localStorage.setItem('oauth_refresh_token', 'valid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() + 3600000));

      mockFetch.mockRejectedValueOnce(new Error('Profile fetch failed'));

      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/error.*profile fetch failed/i)).toBeInTheDocument();
      });
    });

    it('should handle unauthorized profile access', async () => {
      localStorage.setItem('oauth_access_token', 'invalid-token');
      localStorage.setItem('oauth_refresh_token', 'valid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() + 3600000));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Please sign in')).toBeInTheDocument();
      });

      // Should clear invalid tokens
      expect(localStorage.getItem('oauth_access_token')).toBeNull();
    });
  });

  describe('Sign Out Integration', () => {
    it('should handle complete sign out flow', async () => {
      localStorage.setItem('oauth_access_token', 'valid-token');
      localStorage.setItem('oauth_refresh_token', 'valid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() + 3600000));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserData),
      });

      const user = userEvent.setup();
      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome, John')).toBeInTheDocument();
      });

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);

      await waitFor(() => {
        expect(screen.getByText('Please sign in')).toBeInTheDocument();
      });

      // Should clear localStorage
      expect(localStorage.getItem('oauth_access_token')).toBeNull();
      expect(localStorage.getItem('oauth_refresh_token')).toBeNull();
      expect(localStorage.getItem('oauth_expires_at')).toBeNull();
    });

    it('should handle sign out API call', async () => {
      localStorage.setItem('oauth_access_token', 'valid-token');
      localStorage.setItem('oauth_refresh_token', 'valid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() + 3600000));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const user = userEvent.setup();
      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome, John')).toBeInTheDocument();
      });

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      await user.click(signOutButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/signout', expect.any(Object));
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      localStorage.setItem('oauth_access_token', 'valid-token');
      localStorage.setItem('oauth_refresh_token', 'valid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() + 3600000));

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/error.*network error/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid JSON responses', async () => {
      localStorage.setItem('oauth_access_token', 'valid-token');
      localStorage.setItem('oauth_refresh_token', 'valid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() + 3600000));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/error.*invalid json/i)).toBeInTheDocument();
      });
    });

    it('should handle server errors with fallback', async () => {
      localStorage.setItem('oauth_access_token', 'valid-token');
      localStorage.setItem('oauth_refresh_token', 'valid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() + 3600000));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      });

      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/error.*internal server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States Integration', () => {
    it('should show loading state during authentication', async () => {
      const slowFetch = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      mockFetch.mockImplementation(slowFetch);

      localStorage.setItem('oauth_access_token', 'valid-token');
      localStorage.setItem('oauth_refresh_token', 'valid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() + 3600000));

      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show loading state during token refresh', async () => {
      localStorage.setItem('oauth_access_token', 'expired-token');
      localStorage.setItem('oauth_refresh_token', 'valid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() - 1000));

      const slowRefresh = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      mockFetch.mockImplementation(slowRefresh);

      render(
        <OAuthProvider>
          <TestComponent />
        </OAuthProvider>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Account Management Integration', () => {
    it('should provide user data for account management components', async () => {
      localStorage.setItem('oauth_access_token', 'valid-token');
      localStorage.setItem('oauth_refresh_token', 'valid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() + 3600000));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockUserData,
          subscription: {
            tier: 'patron',
            status: 'active',
            currentPeriodEnd: new Date('2025-02-01'),
          },
        }),
      });

      const AccountIntegrationComponent = () => {
        const { user, isAuthenticated } = useOAuth();
        if (!isAuthenticated || !user) return <div>Not authenticated</div>;
        
        return (
          <div>
            <div>User ID: {user.id}</div>
            <div>Subscription: {user.subscription?.tier}</div>
            <div>Status: {user.subscription?.status}</div>
          </div>
        );
      };

      render(
        <OAuthProvider>
          <AccountIntegrationComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('User ID: user-123')).toBeInTheDocument();
        expect(screen.getByText('Subscription: patron')).toBeInTheDocument();
        expect(screen.getByText('Status: active')).toBeInTheDocument();
      });
    });

    it('should support updating user preferences through context', async () => {
      localStorage.setItem('oauth_access_token', 'valid-token');
      localStorage.setItem('oauth_refresh_token', 'valid-refresh-token');
      localStorage.setItem('oauth_expires_at', String(Date.now() + 3600000));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockUserData,
            preferences: {
              ...mockUserData.preferences,
              theme: 'light',
            },
          }),
        });

      const PreferenceUpdateComponent = () => {
        const { user, updateUser } = useOAuth();
        
        const handleUpdatePreferences = async () => {
          if (!user) return;
          
          await updateUser({
            preferences: {
              ...user.preferences,
              theme: 'light' as const,
            },
          });
        };

        return (
          <div>
            <div>Theme: {user?.preferences.theme}</div>
            <button onClick={handleUpdatePreferences}>Update Theme</button>
          </div>
        );
      };

      const user = userEvent.setup();
      render(
        <OAuthProvider>
          <PreferenceUpdateComponent />
        </OAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Theme: dark')).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update theme/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText('Theme: light')).toBeInTheDocument();
      });
    });
  });
});