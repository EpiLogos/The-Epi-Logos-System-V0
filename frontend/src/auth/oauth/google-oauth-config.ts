/**
 * Google OAuth 2.0 Configuration
 * Implements PKCE and OIDC nonce security (AC: #1, #11)
 */

import { randomBytes, createHash } from 'crypto';

// Utility: Convert standard base64 to URL-safe base64 (RFC 4648 §5)
// - Replace '+' with '-'
// - Replace '/' with '_'
// - Remove trailing '=' padding
function toBase64Url(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export interface PKCEParams {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

export class GoogleOAuthConfig {
  public readonly clientId: string;
  public readonly redirectUri: string;
  public readonly scope: string[] = ['openid', 'email', 'profile'];
  public readonly responseType: string = 'code';
  public readonly accessType: string = 'offline';

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'test-client-id';
    this.redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/oauth/google/callback';
  }
}

/**
 * Generates PKCE parameters for OAuth 2.0 security
 */
export function generatePKCE(): PKCEParams {
  // Generate verifier as URL-safe base64
  const codeVerifier = toBase64Url(randomBytes(32).toString('base64'));
  // SHA-256(verifier) then URL-safe base64 encode
  const codeChallenge = toBase64Url(
    createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
  );
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256'
  };
}

/**
 * Generates cryptographically secure OIDC nonce
 */
export function generateNonce(): string {
  return toBase64Url(randomBytes(32).toString('base64'));
}

/**
 * Validates OIDC nonce to prevent replay attacks
 */
export function validateNonce(idToken: string, expectedNonce: string): void {
  try {
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
    
    if (payload.nonce !== expectedNonce) {
      throw new Error('Nonce validation failed - replay attack detected');
    }
  } catch (error) {
    throw new Error('Nonce validation failed');
  }
}
