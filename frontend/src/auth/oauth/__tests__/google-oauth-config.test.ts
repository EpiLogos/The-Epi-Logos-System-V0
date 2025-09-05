/**
 * Google OAuth Configuration Tests - RED Phase
 * Tests for Google OAuth 2.0 configuration and setup (AC: #1, #11)
 */

import { describe, test, expect, vi } from 'vitest';
import { GoogleOAuthConfig, generatePKCE, generateNonce, validateNonce } from '../google-oauth-config';

describe('GoogleOAuthConfig', () => {
  test('should have required OAuth configuration properties', () => {
    const config = new GoogleOAuthConfig();
    
    expect(config.clientId).toBeDefined();
    expect(config.redirectUri).toBeDefined();
    expect(config.scope).toContain('openid');
    expect(config.scope).toContain('email');
    expect(config.scope).toContain('profile');
    expect(config.responseType).toBe('code');
    expect(config.accessType).toBe('offline');
  });

  test('should generate valid PKCE parameters', () => {
    const pkce = generatePKCE();
    
    expect(pkce.codeVerifier).toBeDefined();
    expect(pkce.codeChallenge).toBeDefined();
    expect(pkce.codeChallengeMethod).toBe('S256');
    expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(pkce.codeVerifier.length).toBeLessThanOrEqual(128);
  });

  test('should generate cryptographically secure OIDC nonce', () => {
    const nonce = generateNonce();
    
    expect(nonce).toBeDefined();
    expect(typeof nonce).toBe('string');
    expect(nonce.length).toBeGreaterThanOrEqual(32);
    expect(nonce).toMatch(/^[A-Za-z0-9-_]+$/); // Base64 URL-safe
  });

  test('should validate OIDC nonce correctly', () => {
    const originalNonce = 'test-nonce-12345';
    const idToken = 'header.' + btoa(JSON.stringify({ nonce: originalNonce })) + '.signature';
    
    expect(() => validateNonce(idToken, originalNonce)).not.toThrow();
  });

  test('should reject mismatched nonce validation', () => {
    const originalNonce = 'test-nonce-12345';
    const wrongNonce = 'wrong-nonce-67890';
    const idToken = 'header.' + btoa(JSON.stringify({ nonce: wrongNonce })) + '.signature';
    
    expect(() => validateNonce(idToken, originalNonce)).toThrow('Nonce validation failed');
  });
});