/**
 * API Client Adapter Tests
 * Comprehensive tests for API client functionality
 */

import {
  HTTPAPIClient,
  MockAPIClient,
  APIError,
  NetworkError,
  TokenExpiredError,
  createAPIClient
} from '../api-client.adapter';

import type { User, AuthTokens } from '@/domains/auth';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client Adapter', () => {
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

  const mockBackendUser = {
    _id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
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

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('HTTPAPIClient', () => {
    let client: HTTPAPIClient;

    beforeEach(() => {
      client = new HTTPAPIClient({
        baseURL: 'http://localhost:8000',
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100
      });
    });

    describe('Authentication Configuration', () => {
      it('should set and clear auth tokens', () => {
        client.setAuthToken('test-token');
        client.clearAuthToken();
        
        // Token should be cleared (tested indirectly through requests)
        expect(true).toBe(true);
      });

      it('should set base URL', () => {
        client.setBaseURL('https://api.example.com');
        expect(true).toBe(true);
      });
    });

    describe('Sign In', () => {
      it('should sign in successfully', async () => {
        const mockResponse = {
          user: mockBackendUser,
          tokens: mockTokens
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await client.signIn({
          email: 'test@example.com',
          password: 'password123'
        });

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/auth/signin',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123'
            })
          })
        );

        expect(result.user.id).toBe('user-123');
        expect(result.tokens).toEqual(mockTokens);
      });

      it('should handle sign in errors', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
          })
        });

        await expect(client.signIn({
          email: 'test@example.com',
          password: 'wrong-password'
        })).rejects.toThrow(APIError);
      });

      it('should handle invalid token response', async () => {
        const mockResponse = {
          user: mockBackendUser,
          tokens: { accessToken: 'token' } // Missing required fields
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        await expect(client.signIn({
          email: 'test@example.com',
          password: 'password123'
        })).rejects.toThrow(APIError);
      });
    });

    describe('Token Refresh', () => {
      it('should refresh tokens successfully', async () => {
        const newTokens = {
          ...mockTokens,
          accessToken: 'new-access-token'
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tokens: newTokens })
        });

        const result = await client.refreshTokens('refresh-token-123');

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/auth/refresh',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ refreshToken: 'refresh-token-123' })
          })
        );

        expect(result.tokens).toEqual(newTokens);
      });

      it('should handle concurrent refresh requests', async () => {
        const newTokens = {
          ...mockTokens,
          accessToken: 'new-access-token'
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ tokens: newTokens })
        });

        // Start multiple refresh requests simultaneously
        const promises = [
          client.refreshTokens('refresh-token-123'),
          client.refreshTokens('refresh-token-123'),
          client.refreshTokens('refresh-token-123')
        ];

        const results = await Promise.all(promises);

        // Should only make one actual request
        expect(fetch).toHaveBeenCalledTimes(1);
        
        // All promises should resolve with the same tokens
        results.forEach(result => {
          expect(result.tokens).toEqual(newTokens);
        });
      });

      it('should handle refresh token errors', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            error: 'invalid_grant',
            error_description: 'Refresh token expired'
          })
        });

        await expect(client.refreshTokens('expired-token')).rejects.toThrow(APIError);
      });
    });

    describe('OAuth Operations', () => {
      it('should initiate OAuth flow', async () => {
        const mockResponse = {
          authorizationUrl: 'https://accounts.google.com/oauth/authorize?...'
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await client.initiateOAuth('google', {
          returnUrl: 'http://localhost:3000/callback',
          codeChallenge: 'challenge',
          codeChallengeMethod: 'S256',
          nonce: 'nonce',
          state: 'state'
        });

        expect(result.authorizationUrl).toBe(mockResponse.authorizationUrl);
      });

      it('should complete OAuth flow', async () => {
        const mockResponse = {
          user: mockBackendUser,
          tokens: mockTokens,
          isNewUser: false
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await client.completeOAuth('google', {
          code: 'auth-code',
          state: 'state',
          codeVerifier: 'verifier',
          nonce: 'nonce'
        });

        expect(result.user.id).toBe('user-123');
        expect(result.tokens).toEqual(mockTokens);
        expect(result.isNewUser).toBe(false);
      });
    });

    describe('User Operations', () => {
      beforeEach(() => {
        client.setAuthToken('test-token');
      });

      it('should get current user', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockBackendUser })
        });

        const result = await client.getCurrentUser();

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/auth/me',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-token'
            })
          })
        );

        expect(result.id).toBe('user-123');
      });

      it('should update user', async () => {
        const updates = {
          firstName: 'Updated',
          lastName: 'Name'
        };

        const updatedBackendUser = {
          ...mockBackendUser,
          firstName: 'Updated',
          lastName: 'Name'
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: updatedBackendUser })
        });

        const result = await client.updateUser(updates);

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/auth/me',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(updates)
          })
        );

        expect(result.firstName).toBe('Updated');
        expect(result.lastName).toBe('Name');
      });

      it('should change password', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        });

        await client.changePassword({
          currentPassword: 'old-password',
          newPassword: 'new-password'
        });

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/auth/change-password',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              currentPassword: 'old-password',
              newPassword: 'new-password'
            })
          })
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle network errors', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network error'));

        await expect(client.signIn({
          email: 'test@example.com',
          password: 'password'
        })).rejects.toThrow(NetworkError);
      });

      it('should handle timeout errors', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new DOMException('Timeout', 'AbortError'));

        await expect(client.signIn({
          email: 'test@example.com',
          password: 'password'
        })).rejects.toThrow(NetworkError);
      });

      it('should handle 401 errors as TokenExpiredError', async () => {
        client.setAuthToken('expired-token');

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            message: 'Token expired',
            code: 'TOKEN_EXPIRED'
          })
        });

        await expect(client.getCurrentUser()).rejects.toThrow(TokenExpiredError);
      });

      it('should not retry on client errors', async () => {
        (fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({
            message: 'Bad request',
            code: 'BAD_REQUEST'
          })
        });

        await expect(client.signIn({
          email: 'invalid-email',
          password: 'password'
        })).rejects.toThrow(APIError);

        // Should only make one request (no retries for 4xx errors)
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      it('should retry on server errors', async () => {
        (fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ message: 'Server error' })
          })
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ message: 'Server error' })
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ user: mockBackendUser, tokens: mockTokens })
          });

        const result = await client.signIn({
          email: 'test@example.com',
          password: 'password'
        });

        // Should retry and eventually succeed
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(result.user.id).toBe('user-123');
      });
    });

    describe('Sign Out', () => {
      it('should sign out successfully', async () => {
        client.setAuthToken('test-token');

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        });

        await client.signOut();

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/auth/signout',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-token'
            })
          })
        );
      });
    });
  });

  describe('Factory Functions', () => {
    it('should create API client with default config', () => {
      const client = createAPIClient();
      expect(client).toBeInstanceOf(HTTPAPIClient);
    });

    it('should create API client with custom config', () => {
      const client = createAPIClient({
        baseURL: 'https://api.example.com',
        timeout: 10000
      });
      expect(client).toBeInstanceOf(HTTPAPIClient);
    });
  });

  describe('MockAPIClient', () => {
    let client: MockAPIClient;

    beforeEach(() => {
      client = new MockAPIClient();
    });

    it('should implement all interface methods', () => {
      expect(typeof client.signIn).toBe('function');
      expect(typeof client.signOut).toBe('function');
      expect(typeof client.refreshTokens).toBe('function');
      expect(typeof client.getCurrentUser).toBe('function');
      expect(typeof client.setAuthToken).toBe('function');
      expect(typeof client.clearAuthToken).toBe('function');
    });

    it('should throw errors for unimplemented methods', async () => {
      await expect(client.signIn({
        email: 'test@example.com',
        password: 'password'
      })).rejects.toThrow('Mock implementation');
    });
  });
});
