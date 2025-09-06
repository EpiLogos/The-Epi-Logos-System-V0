/**
 * OAuth Provider Adapter Tests
 * Comprehensive tests for OAuth provider functionality
 */

import {
  GoogleOAuthProvider,
  GitHubOAuthProvider,
  OAuthProviderRegistry,
  OAuthProviderError,
  createOAuthProviderRegistry
} from '../oauth-provider.adapter';

// Mock fetch globally
global.fetch = jest.fn();

describe('OAuth Provider Adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('GoogleOAuthProvider', () => {
    let provider: GoogleOAuthProvider;

    beforeEach(() => {
      provider = new GoogleOAuthProvider({
        clientId: 'test-client-id'
      });
    });

    describe('Configuration', () => {
      it('should have correct provider details', () => {
        expect(provider.name).toBe('google');
        expect(provider.displayName).toBe('Google');
        expect(provider.scopes).toEqual(['openid', 'email', 'profile']);
      });

      it('should be configured with client ID', () => {
        expect(provider.isConfigured()).toBe(true);
      });

      it('should not be configured without client ID', () => {
        const unconfiguredProvider = new GoogleOAuthProvider({
          clientId: ''
        });
        expect(unconfiguredProvider.isConfigured()).toBe(false);
      });

      it('should return configuration', () => {
        const config = provider.getConfiguration();
        expect(config.clientId).toBe('test-client-id');
        expect(config.authorizationEndpoint).toBe('https://accounts.google.com/o/oauth2/v2/auth');
      });
    });

    describe('Authorization URL Building', () => {
      it('should build correct authorization URL', async () => {
        const params = {
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000/callback',
          state: 'test-state',
          nonce: 'test-nonce',
          codeChallenge: 'test-challenge',
          codeChallengeMethod: 'S256'
        };

        const url = await provider.buildAuthorizationURL(params);
        const parsedUrl = new URL(url);

        expect(parsedUrl.origin + parsedUrl.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
        expect(parsedUrl.searchParams.get('client_id')).toBe('test-client-id');
        expect(parsedUrl.searchParams.get('redirect_uri')).toBe('http://localhost:3000/callback');
        expect(parsedUrl.searchParams.get('response_type')).toBe('code');
        expect(parsedUrl.searchParams.get('state')).toBe('test-state');
        expect(parsedUrl.searchParams.get('nonce')).toBe('test-nonce');
        expect(parsedUrl.searchParams.get('code_challenge')).toBe('test-challenge');
        expect(parsedUrl.searchParams.get('code_challenge_method')).toBe('S256');
        expect(parsedUrl.searchParams.get('scope')).toBe('openid email profile');
        expect(parsedUrl.searchParams.get('access_type')).toBe('offline');
        expect(parsedUrl.searchParams.get('prompt')).toBe('consent');
      });

      it('should include custom scopes', async () => {
        const params = {
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000/callback',
          state: 'test-state',
          nonce: 'test-nonce',
          codeChallenge: 'test-challenge',
          codeChallengeMethod: 'S256',
          scopes: ['openid', 'email']
        };

        const url = await provider.buildAuthorizationURL(params);
        const parsedUrl = new URL(url);

        expect(parsedUrl.searchParams.get('scope')).toBe('openid email');
      });

      it('should include additional parameters', async () => {
        const params = {
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000/callback',
          state: 'test-state',
          nonce: 'test-nonce',
          codeChallenge: 'test-challenge',
          codeChallengeMethod: 'S256',
          additionalParams: {
            custom_param: 'custom_value'
          }
        };

        const url = await provider.buildAuthorizationURL(params);
        const parsedUrl = new URL(url);

        expect(parsedUrl.searchParams.get('custom_param')).toBe('custom_value');
      });
    });

    describe('Token Exchange', () => {
      it('should exchange code for tokens successfully', async () => {
        const mockTokenResponse = {
          access_token: 'access-token-123',
          refresh_token: 'refresh-token-123',
          id_token: 'id-token-123',
          token_type: 'Bearer',
          expires_in: 3600
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse
        });

        const params = {
          clientId: 'test-client-id',
          code: 'auth-code',
          codeVerifier: 'code-verifier',
          redirectUri: 'http://localhost:3000/callback'
        };

        const tokens = await provider.exchangeCodeForTokens(params);

        expect(fetch).toHaveBeenCalledWith(
          'https://oauth2.googleapis.com/token',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            }
          })
        );

        expect(tokens).toEqual(mockTokenResponse);
      });

      it('should handle token exchange errors', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'invalid_grant',
            error_description: 'Invalid authorization code'
          })
        });

        const params = {
          clientId: 'test-client-id',
          code: 'invalid-code',
          codeVerifier: 'code-verifier',
          redirectUri: 'http://localhost:3000/callback'
        };

        await expect(provider.exchangeCodeForTokens(params)).rejects.toThrow(OAuthProviderError);
      });

      it('should handle network errors during token exchange', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        const params = {
          clientId: 'test-client-id',
          code: 'auth-code',
          codeVerifier: 'code-verifier',
          redirectUri: 'http://localhost:3000/callback'
        };

        await expect(provider.exchangeCodeForTokens(params)).rejects.toThrow(OAuthProviderError);
      });

      it('should validate token response format', async () => {
        const invalidTokenResponse = {
          access_token: 'token'
          // Missing required fields
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => invalidTokenResponse
        });

        const params = {
          clientId: 'test-client-id',
          code: 'auth-code',
          codeVerifier: 'code-verifier',
          redirectUri: 'http://localhost:3000/callback'
        };

        await expect(provider.exchangeCodeForTokens(params)).rejects.toThrow(OAuthProviderError);
      });
    });

    describe('User Profile', () => {
      it('should get user profile successfully', async () => {
        const mockGoogleProfile = {
          id: 'google-user-123',
          email: 'test@example.com',
          name: 'Test User',
          given_name: 'Test',
          family_name: 'User',
          picture: 'https://example.com/avatar.jpg',
          verified_email: true,
          locale: 'en'
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoogleProfile
        });

        const profile = await provider.getUserProfile('access-token-123');

        expect(fetch).toHaveBeenCalledWith(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer access-token-123',
              'Accept': 'application/json'
            }
          })
        );

        expect(profile).toEqual({
          id: 'google-user-123',
          email: 'test@example.com',
          name: 'Test User',
          given_name: 'Test',
          family_name: 'User',
          picture: 'https://example.com/avatar.jpg',
          email_verified: true,
          locale: 'en'
        });
      });

      it('should handle profile fetch errors', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 401
        });

        await expect(provider.getUserProfile('invalid-token')).rejects.toThrow(OAuthProviderError);
      });
    });

    describe('Token Refresh', () => {
      it('should refresh access token successfully', async () => {
        const mockRefreshResponse = {
          access_token: 'new-access-token',
          token_type: 'Bearer',
          expires_in: 3600
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockRefreshResponse
        });

        const tokens = await provider.refreshAccessToken('refresh-token-123');

        expect(fetch).toHaveBeenCalledWith(
          'https://oauth2.googleapis.com/token',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            }
          })
        );

        expect(tokens).toEqual(mockRefreshResponse);
      });

      it('should handle refresh token errors', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'invalid_grant',
            error_description: 'Refresh token expired'
          })
        });

        await expect(provider.refreshAccessToken('expired-token')).rejects.toThrow(OAuthProviderError);
      });
    });

    describe('Callback Validation', () => {
      it('should validate successful callback', () => {
        const callbackData = {
          code: 'auth-code',
          state: 'test-state'
        };

        const result = provider.validateCallback(callbackData);

        expect(result.success).toBe(true);
      });

      it('should validate error callback', () => {
        const callbackData = {
          error: 'access_denied',
          error_description: 'User denied access',
          state: 'test-state'
        };

        const result = provider.validateCallback(callbackData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('User denied access');
        expect(result.shouldCleanupSession).toBe(true);
      });

      it('should validate invalid callback data', () => {
        const callbackData = {
          // Missing required fields
        };

        const result = provider.validateCallback(callbackData);

        expect(result.success).toBe(false);
        expect(result.shouldCleanupSession).toBe(true);
      });
    });
  });

  describe('GitHubOAuthProvider', () => {
    let provider: GitHubOAuthProvider;

    beforeEach(() => {
      provider = new GitHubOAuthProvider({
        clientId: 'github-client-id'
      });
    });

    it('should have correct provider details', () => {
      expect(provider.name).toBe('github');
      expect(provider.displayName).toBe('GitHub');
      expect(provider.scopes).toEqual(['user:email']);
    });

    it('should normalize GitHub user profile', async () => {
      const mockGitHubProfile = {
        id: 12345,
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://github.com/avatar.jpg'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubProfile
      });

      const profile = await provider.getUserProfile('access-token-123');

      expect(profile).toEqual({
        id: '12345',
        email: 'test@example.com',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://github.com/avatar.jpg',
        email_verified: true
      });
    });
  });

  describe('OAuthProviderRegistry', () => {
    let registry: OAuthProviderRegistry;

    beforeEach(() => {
      registry = new OAuthProviderRegistry();
    });

    it('should register and retrieve providers', () => {
      const googleProvider = new GoogleOAuthProvider({ clientId: 'test' });
      
      registry.register(googleProvider);
      
      expect(registry.has('google')).toBe(true);
      expect(registry.get('google')).toBe(googleProvider);
    });

    it('should get all providers', () => {
      const googleProvider = new GoogleOAuthProvider({ clientId: 'test' });
      const githubProvider = new GitHubOAuthProvider({ clientId: 'test' });
      
      registry.register(googleProvider);
      registry.register(githubProvider);
      
      const allProviders = registry.getAll();
      expect(allProviders).toHaveLength(2);
      expect(allProviders).toContain(googleProvider);
      expect(allProviders).toContain(githubProvider);
    });

    it('should get only configured providers', () => {
      const configuredProvider = new GoogleOAuthProvider({ clientId: 'test' });
      const unconfiguredProvider = new GitHubOAuthProvider({ clientId: '' });
      
      registry.register(configuredProvider);
      registry.register(unconfiguredProvider);
      
      const configuredProviders = registry.getConfigured();
      expect(configuredProviders).toHaveLength(1);
      expect(configuredProviders[0]).toBe(configuredProvider);
    });
  });

  describe('Factory Functions', () => {
    it('should create provider registry with default providers', () => {
      const registry = createOAuthProviderRegistry();
      
      expect(registry.has('google')).toBe(true);
      expect(registry.has('github')).toBe(true);
    });
  });
});
