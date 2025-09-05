/**
 * OAuth Authorization Service
 * Handles OAuth URL generation and state management (AC: #1, #2, #11)
 */

import { GoogleOAuthConfig, generatePKCE, generateNonce } from './google-oauth-config';

export interface OAuthState {
  state: string;
  nonce: string;
  codeVerifier: string;
  codeChallenge: string;
  redirectUri: string;
  expiresAt: Date;
}

export interface AuthorizationResult {
  url: string;
  state: string;
  codeVerifier: string;
  nonce: string;
}

export class OAuthAuthorizationService {
  private config: GoogleOAuthConfig;
  private readonly STORAGE_KEY_PREFIX = 'oauth_state_';
  private readonly STATE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.config = new GoogleOAuthConfig();
  }

  async generateAuthorizationUrl(): Promise<AuthorizationResult> {
    const state = this.generateSecureState();
    const nonce = generateNonce();
    const pkce = generatePKCE();
    
    // Store state for later validation
    const oauthState: OAuthState = {
      state,
      nonce,
      codeVerifier: pkce.codeVerifier,
      codeChallenge: pkce.codeChallenge,
      redirectUri: this.config.redirectUri,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };
    
    await this.storeSecureState(state, oauthState);
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: this.config.responseType,
      scope: this.config.scope.join(' '),
      state,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: pkce.codeChallengeMethod,
      nonce,
      access_type: this.config.accessType,
      prompt: 'consent'
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return {
      url,
      state,
      codeVerifier: pkce.codeVerifier,
      nonce
    };
  }

  async getStoredState(state: string): Promise<OAuthState | null> {
    try {
      const key = this.STORAGE_KEY_PREFIX + state;
      const serializedState = sessionStorage.getItem(key);
      
      if (!serializedState) {
        return null;
      }

      const parsedState = JSON.parse(serializedState);
      const expiresAt = new Date(parsedState.expiresAt);
      
      // Check if state has expired
      if (expiresAt < new Date()) {
        sessionStorage.removeItem(key);
        return null;
      }

      return {
        ...parsedState,
        expiresAt
      };
    } catch (error) {
      return null;
    }
  }

  // SECURITY FIX: Secure state storage with session storage and expiration
  private async storeSecureState(state: string, oauthState: OAuthState): Promise<void> {
    try {
      const key = this.STORAGE_KEY_PREFIX + state;
      const serializedState = JSON.stringify({
        ...oauthState,
        expiresAt: oauthState.expiresAt.toISOString()
      });
      
      // Store in sessionStorage for security (cleared on tab close)
      sessionStorage.setItem(key, serializedState);
      
      // Clean up expired states
      this.cleanExpiredStates();
    } catch (error) {
      throw new Error('Failed to store OAuth state securely');
    }
  }

  private generateSecureState(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private cleanExpiredStates(): void {
    try {
      const now = new Date();
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(this.STORAGE_KEY_PREFIX)) {
          const serializedState = sessionStorage.getItem(key);
          if (serializedState) {
            try {
              const parsedState = JSON.parse(serializedState);
              const expiresAt = new Date(parsedState.expiresAt);
              if (expiresAt < now) {
                sessionStorage.removeItem(key);
              }
            } catch {
              // Remove invalid state entries
              sessionStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      // Silently fail cleanup to not break OAuth flow
      console.warn('OAuth state cleanup failed:', error);
    }
  }
}