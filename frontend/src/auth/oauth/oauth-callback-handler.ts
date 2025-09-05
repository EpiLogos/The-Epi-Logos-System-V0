/**
 * OAuth Callback Handler
 * Handles OAuth callback processing and token exchange (AC: #3, #8, #11, #12)
 */

import { validateNonce } from './google-oauth-config';

export interface CallbackData {
  code: string;
  state: string;
  error?: string;
  error_description?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

export interface CallbackResult {
  success: boolean;
  tokens?: TokenResponse;
  user?: UserProfile;
  error?: string;
  shouldCleanupSession?: boolean;
}

export interface UserProfile {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

export class OAuthCallbackHandler {
  private clientId: string;
  private redirectUri: string;
  private backendTokenExchangeUrl: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'test-client-id';
    this.redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/oauth/google/callback';
    this.backendTokenExchangeUrl = process.env.NEXT_PUBLIC_TOKEN_EXCHANGE_URL || 'http://localhost:8000/auth/oauth/google/exchange';
  }

  async handleCallback(callbackData: CallbackData): Promise<CallbackResult> {
    try {
      // Handle OAuth errors
      if (callbackData.error) {
        return {
          success: false,
          error: callbackData.error,
          shouldCleanupSession: callbackData.error === 'access_denied'
        };
      }

      // Validate state parameter (CSRF protection)
      if (!(await this.validateState(callbackData.state))) {
        throw new Error('Invalid state parameter - CSRF protection failed');
      }

      // Exchange authorization code for tokens and get user data
      const exchangeResult = await this.exchangeCodeAndGetUser(callbackData.code, callbackData.state);
      
      let user = null;
      
      // Extract user from backend response if available
      if (exchangeResult.backendResponse?.success && exchangeResult.backendResponse.data) {
        user = {
          googleId: exchangeResult.backendResponse.data.oauthProviders?.find(p => p.provider === 'google')?.providerId || '',
          email: exchangeResult.backendResponse.data.email,
          name: `${exchangeResult.backendResponse.data.firstName} ${exchangeResult.backendResponse.data.lastName}`.trim(),
          picture: exchangeResult.backendResponse.data.picture,
          emailVerified: exchangeResult.backendResponse.data.isEmailVerified || false
        };
      } else if (exchangeResult.tokens.id_token) {
        // Fallback: validate nonce and extract from ID token
        await this.validateIdTokenNonce(exchangeResult.tokens.id_token, callbackData.state);
        user = this.extractUserProfile(exchangeResult.tokens.id_token);
      }

      return {
        success: true,
        tokens: exchangeResult.tokens,
        user
      };

    } catch (error) {
      // Handle specific OAuth errors
      if (error.error === 'invalid_grant') {
        return {
          success: false,
          error: 'token_revoked',
          shouldCleanupSession: true
        };
      }

      // Handle nonce validation errors
      if (error.message?.includes('Nonce validation failed')) {
        throw error;
      }

      return {
        success: false,
        error: error.message || 'OAuth callback processing failed'
      };
    }
  }

  async exchangeCodeAndGetUser(code: string, state: string): Promise<{ tokens: TokenResponse; backendResponse: any }> {
    // Get stored OAuth state to retrieve code verifier
    const storedState = await this.getStoredOAuthState(state);
    if (!storedState) {
      throw new Error('Invalid or expired state');
    }

    // SECURITY FIX: Use secure backend endpoint for token exchange
    // This prevents client secret exposure in frontend code
    const response = await fetch(this.backendTokenExchangeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        code,
        state,
        codeVerifier: storedState.codeVerifier,
        redirectUri: this.redirectUri
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const backendResponse = await response.json();
    
    // Debug logging
    console.log('Backend OAuth Exchange Response:', {
      backendResponse,
      hasSuccess: backendResponse?.success,
      hasData: !!backendResponse?.data,
      hasAccessToken: !!backendResponse?.data?.accessToken,
      dataKeys: backendResponse?.data ? Object.keys(backendResponse.data) : []
    });
    
    let tokens: TokenResponse;
    
    // ALWAYS use backend JWT tokens when available, never fallback to Google tokens
    if (backendResponse.success && backendResponse.data && backendResponse.data.accessToken) {
      // Backend created/found user and returned our JWT tokens - USE THESE
      tokens = {
        access_token: backendResponse.data.accessToken,
        refresh_token: backendResponse.data.refreshToken,
        id_token: backendResponse.data.id_token || '', 
        token_type: 'Bearer',
        expires_in: 3600
      };
    } else {
      // This should rarely happen - backend should always create JWT tokens
      throw new Error('Backend failed to create JWT tokens - check server logs');
    }
    
    return { tokens, backendResponse };
  }

  // Legacy method for backward compatibility
  async exchangeCodeForTokens(code: string, state: string): Promise<TokenResponse> {
    const result = await this.exchangeCodeAndGetUser(code, state);
    return result.tokens;
  }

  private async validateState(state: string): Promise<boolean> {
    try {
      const key = `oauth_state_${state}`;
      const serializedState = sessionStorage.getItem(key);
      
      if (!serializedState) {
        return false;
      }

      const parsedState = JSON.parse(serializedState);
      const expiresAt = new Date(parsedState.expiresAt);
      
      // Check if state has expired
      if (expiresAt < new Date()) {
        sessionStorage.removeItem(key);
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private async getStoredOAuthState(state: string): Promise<{ codeVerifier: string; nonce: string } | null> {
    try {
      const key = `oauth_state_${state}`;
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
        codeVerifier: parsedState.codeVerifier,
        nonce: parsedState.nonce
      };
    } catch (error) {
      return null;
    }
  }

  private async validateIdTokenNonce(idToken: string, state: string): Promise<void> {
    const storedState = await this.getStoredOAuthState(state);
    if (!storedState) {
      throw new Error('Cannot validate nonce - state not found');
    }

    validateNonce(idToken, storedState.nonce);
  }

  private extractUserProfile(idToken: string): UserProfile {
    try {
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      
      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || `${payload.given_name} ${payload.family_name}`.trim(),
        picture: payload.picture,
        emailVerified: payload.email_verified || false
      };
    } catch (error) {
      throw new Error('Failed to extract user profile from ID token');
    }
  }
}