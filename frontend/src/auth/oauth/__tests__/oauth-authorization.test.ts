/**
 * OAuth Authorization URL Generation Tests - RED Phase
 * Tests for OAuth authorization URL generation with PKCE and nonce (AC: #1, #2, #11)
 */

import { describe, test, expect, vi } // Jest globals available;
import { OAuthAuthorizationService } from '../oauth-authorization-service';

describe('OAuthAuthorizationService', () => {
  test('should generate OAuth authorization URL with all required parameters', async () => {
    const service = new OAuthAuthorizationService();
    const result = await service.generateAuthorizationUrl();
    
    expect(result.url).toBeDefined();
    expect(result.state).toBeDefined();
    expect(result.codeVerifier).toBeDefined();
    expect(result.nonce).toBeDefined();
    
    const url = new URL(result.url);
    expect(url.searchParams.get('client_id')).toBeDefined();
    expect(url.searchParams.get('redirect_uri')).toBeDefined();
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toContain('openid email profile');
    expect(url.searchParams.get('state')).toBe(result.state);
    expect(url.searchParams.get('code_challenge')).toBeDefined();
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('nonce')).toBe(result.nonce);
  });

  test('should store OAuth state in secure storage', async () => {
    const service = new OAuthAuthorizationService();
    const result = await service.generateAuthorizationUrl();
    
    const storedState = await service.getStoredState(result.state);
    expect(storedState).toBeDefined();
    expect(storedState.codeVerifier).toBe(result.codeVerifier);
    expect(storedState.nonce).toBe(result.nonce);
    expect(storedState.expiresAt).toBeInstanceOf(Date);
  });

  test('should generate unique state and nonce for each authorization request', async () => {
    const service = new OAuthAuthorizationService();
    const result1 = await service.generateAuthorizationUrl();
    const result2 = await service.generateAuthorizationUrl();
    
    expect(result1.state).not.toBe(result2.state);
    expect(result1.nonce).not.toBe(result2.nonce);
    expect(result1.codeVerifier).not.toBe(result2.codeVerifier);
  });
});