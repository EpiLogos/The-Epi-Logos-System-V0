/**
 * OAuth Callback Handler Tests - RED Phase
 * Tests for OAuth callback handling and token exchange (AC: #3, #8, #11, #12)
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { OAuthCallbackHandler } from '../oauth-callback-handler';
import { setupOAuthTests, createMockTokenResponse, createMockIdToken } from './test-setup';

describe('OAuthCallbackHandler', () => {
  let handler: OAuthCallbackHandler;
  let mocks: ReturnType<typeof setupOAuthTests>;

  beforeEach(() => {
    mocks = setupOAuthTests();
    handler = new OAuthCallbackHandler();
    
    // Setup successful OAuth state in sessionStorage
    const mockState = {
      state: 'test_state_456',
      nonce: 'test_nonce_789',
      codeVerifier: 'test_code_verifier_abc',
      codeChallenge: 'test_code_challenge_def',
      redirectUri: 'http://localhost:3000/auth/callback',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    };
    
    mocks.sessionStorage.setItem('oauth_state_test_state_456', JSON.stringify(mockState));
  });

  test('should handle OAuth callback with valid authorization code', async () => {
    const callbackData = {
      code: 'auth_code_123',
      state: 'test_state_456'
    };

    const result = await handler.handleCallback(callbackData);
    
    expect(result.success).toBe(true);
    expect(result.tokens).toBeDefined();
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
    expect(result.tokens.idToken).toBeDefined();
    expect(result.user).toBeDefined();
  });

  test('should validate state parameter to prevent CSRF attacks', async () => {
    const callbackData = {
      code: 'auth_code_123',
      state: 'invalid_state' // This state won't exist in sessionStorage
    };

    // This should return success: false, not throw
    const result = await handler.handleCallback(callbackData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid state parameter');
  });

  test('should validate OIDC nonce to prevent replay attacks', async () => {
    const callbackData = {
      code: 'auth_code_123',
      state: 'valid_state'
    };

    // Mock invalid nonce in ID token
    vi.mocked(handler.exchangeCodeForTokens).mockResolvedValue({
      access_token: 'access_123',
      refresh_token: 'refresh_123',
      id_token: 'header.' + btoa(JSON.stringify({ nonce: 'wrong_nonce' })) + '.signature'
    });

    await expect(handler.handleCallback(callbackData))
      .rejects.toThrow('Nonce validation failed - replay attack detected');
  });

  test('should handle external token revocation gracefully', async () => {
    const callbackData = {
      code: 'revoked_auth_code',
      state: 'valid_state'
    };

    // Mock Google API returning invalid_grant error
    vi.mocked(handler.exchangeCodeForTokens).mockRejectedValue({
      error: 'invalid_grant',
      error_description: 'Token has been revoked'
    });

    const result = await handler.handleCallback(callbackData);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('token_revoked');
    expect(result.shouldCleanupSession).toBe(true);
  });

  test('should create user account from Google profile data', async () => {
    const callbackData = {
      code: 'auth_code_123',
      state: 'valid_state'
    };

    const result = await handler.handleCallback(callbackData);
    
    expect(result.user.googleId).toBeDefined();
    expect(result.user.email).toBeDefined();
    expect(result.user.name).toBeDefined();
    expect(result.user.emailVerified).toBe(true);
  });
});