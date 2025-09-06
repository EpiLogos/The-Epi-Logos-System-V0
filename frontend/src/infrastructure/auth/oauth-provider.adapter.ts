/**
 * OAuth Provider Adapters
 * Extensible OAuth provider implementations with standardized interface
 * 
 * This module provides a clean abstraction for different OAuth providers
 * with a standardized interface and extensible pattern for future providers.
 */

import type { 
  OAuthCallbackData,
  OAuthTokenResponse,
  OAuthUserProfile,
  OAuthCallbackResult,
  generatePKCEParameters,
  generateNonce,
  validateOAuthCallback,
  validateOAuthTokenResponse,
  validateOAuthUserProfile
} from '@/domains/auth';

/**
 * OAuth provider interface
 */
export interface OAuthProviderAdapter {
  readonly name: string;
  readonly displayName: string;
  readonly scopes: string[];
  
  // Flow initiation
  buildAuthorizationURL(params: AuthorizationParams): Promise<string>;
  
  // Token exchange
  exchangeCodeForTokens(params: TokenExchangeParams): Promise<OAuthTokenResponse>;
  
  // User profile
  getUserProfile(accessToken: string): Promise<OAuthUserProfile>;
  
  // Token refresh
  refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse>;
  
  // Validation
  validateCallback(data: any): OAuthCallbackResult;
  
  // Configuration
  isConfigured(): boolean;
  getConfiguration(): ProviderConfiguration;
}

/**
 * Authorization parameters
 */
export interface AuthorizationParams {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scopes?: string[];
  additionalParams?: Record<string, string>;
}

/**
 * Token exchange parameters
 */
export interface TokenExchangeParams {
  clientId: string;
  clientSecret?: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
  grantType?: string;
}

/**
 * Provider configuration
 */
export interface ProviderConfiguration {
  clientId: string;
  clientSecret?: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  scopes: string[];
  additionalParams?: Record<string, string>;
}

/**
 * OAuth provider error
 */
export class OAuthProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'OAuthProviderError';
  }
}

/**
 * Base OAuth provider implementation
 */
abstract class BaseOAuthProvider implements OAuthProviderAdapter {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly scopes: string[];
  
  protected config: ProviderConfiguration;

  constructor(config: ProviderConfiguration) {
    this.config = config;
  }

  async buildAuthorizationURL(params: AuthorizationParams): Promise<string> {
    const url = new URL(this.config.authorizationEndpoint);
    
    // Standard OAuth 2.0 parameters
    url.searchParams.set('client_id', params.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', params.state);
    url.searchParams.set('nonce', params.nonce);
    url.searchParams.set('code_challenge', params.codeChallenge);
    url.searchParams.set('code_challenge_method', params.codeChallengeMethod);
    
    // Scopes
    const scopes = params.scopes || this.scopes;
    if (scopes.length > 0) {
      url.searchParams.set('scope', scopes.join(' '));
    }
    
    // Provider-specific parameters
    if (this.config.additionalParams) {
      Object.entries(this.config.additionalParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    
    // Additional parameters from request
    if (params.additionalParams) {
      Object.entries(params.additionalParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.toString();
  }

  async exchangeCodeForTokens(params: TokenExchangeParams): Promise<OAuthTokenResponse> {
    const body = new URLSearchParams({
      client_id: params.clientId,
      code: params.code,
      code_verifier: params.codeVerifier,
      redirect_uri: params.redirectUri,
      grant_type: params.grantType || 'authorization_code'
    });

    // Add client secret if available (for confidential clients)
    if (params.clientSecret) {
      body.set('client_secret', params.clientSecret);
    }

    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new OAuthProviderError(
          errorData.error_description || `Token exchange failed: ${response.status}`,
          this.name,
          errorData.error || 'TOKEN_EXCHANGE_FAILED'
        );
      }

      const tokenData = await response.json();
      
      if (!validateOAuthTokenResponse(tokenData)) {
        throw new OAuthProviderError(
          'Invalid token response format',
          this.name,
          'INVALID_TOKEN_RESPONSE'
        );
      }

      return tokenData;
    } catch (error) {
      if (error instanceof OAuthProviderError) {
        throw error;
      }
      
      throw new OAuthProviderError(
        'Network error during token exchange',
        this.name,
        'NETWORK_ERROR',
        error as Error
      );
    }
  }

  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    try {
      const response = await fetch(this.config.userInfoEndpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new OAuthProviderError(
          `Failed to fetch user profile: ${response.status}`,
          this.name,
          'USER_PROFILE_FAILED'
        );
      }

      const profileData = await response.json();
      const normalizedProfile = this.normalizeUserProfile(profileData);
      
      if (!validateOAuthUserProfile(normalizedProfile)) {
        throw new OAuthProviderError(
          'Invalid user profile format',
          this.name,
          'INVALID_PROFILE_FORMAT'
        );
      }

      return normalizedProfile;
    } catch (error) {
      if (error instanceof OAuthProviderError) {
        throw error;
      }
      
      throw new OAuthProviderError(
        'Network error during profile fetch',
        this.name,
        'NETWORK_ERROR',
        error as Error
      );
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    if (this.config.clientSecret) {
      body.set('client_secret', this.config.clientSecret);
    }

    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new OAuthProviderError(
          errorData.error_description || `Token refresh failed: ${response.status}`,
          this.name,
          errorData.error || 'TOKEN_REFRESH_FAILED'
        );
      }

      const tokenData = await response.json();
      
      if (!validateOAuthTokenResponse(tokenData)) {
        throw new OAuthProviderError(
          'Invalid token response format',
          this.name,
          'INVALID_TOKEN_RESPONSE'
        );
      }

      return tokenData;
    } catch (error) {
      if (error instanceof OAuthProviderError) {
        throw error;
      }
      
      throw new OAuthProviderError(
        'Network error during token refresh',
        this.name,
        'NETWORK_ERROR',
        error as Error
      );
    }
  }

  validateCallback(data: any): OAuthCallbackResult {
    if (!validateOAuthCallback(data)) {
      return {
        success: false,
        error: 'Invalid callback data format',
        shouldCleanupSession: true
      };
    }

    if (data.error) {
      return {
        success: false,
        error: data.error_description || data.error,
        shouldCleanupSession: data.error === 'access_denied'
      };
    }

    return {
      success: true
    };
  }

  isConfigured(): boolean {
    return !!(
      this.config.clientId &&
      this.config.authorizationEndpoint &&
      this.config.tokenEndpoint &&
      this.config.userInfoEndpoint
    );
  }

  getConfiguration(): ProviderConfiguration {
    return { ...this.config };
  }

  // Abstract method for provider-specific profile normalization
  protected abstract normalizeUserProfile(profileData: any): OAuthUserProfile;
}

/**
 * Google OAuth Provider
 */
export class GoogleOAuthProvider extends BaseOAuthProvider {
  readonly name = 'google';
  readonly displayName = 'Google';
  readonly scopes = ['openid', 'email', 'profile'];

  constructor(config?: Partial<ProviderConfiguration>) {
    const defaultConfig: ProviderConfiguration = {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scopes: ['openid', 'email', 'profile'],
      additionalParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    };

    super({ ...defaultConfig, ...config });
  }

  protected normalizeUserProfile(profileData: any): OAuthUserProfile {
    return {
      id: profileData.id,
      email: profileData.email,
      name: profileData.name,
      given_name: profileData.given_name,
      family_name: profileData.family_name,
      picture: profileData.picture,
      email_verified: profileData.verified_email === true,
      locale: profileData.locale
    };
  }
}

/**
 * GitHub OAuth Provider (example for extensibility)
 */
export class GitHubOAuthProvider extends BaseOAuthProvider {
  readonly name = 'github';
  readonly displayName = 'GitHub';
  readonly scopes = ['user:email'];

  constructor(config?: Partial<ProviderConfiguration>) {
    const defaultConfig: ProviderConfiguration = {
      clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '',
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      tokenEndpoint: 'https://github.com/login/oauth/access_token',
      userInfoEndpoint: 'https://api.github.com/user',
      scopes: ['user:email']
    };

    super({ ...defaultConfig, ...config });
  }

  protected normalizeUserProfile(profileData: any): OAuthUserProfile {
    return {
      id: profileData.id.toString(),
      email: profileData.email,
      name: profileData.name || profileData.login,
      given_name: profileData.name?.split(' ')[0],
      family_name: profileData.name?.split(' ').slice(1).join(' '),
      picture: profileData.avatar_url,
      email_verified: true // GitHub emails are considered verified
    };
  }
}

/**
 * OAuth provider registry
 */
export class OAuthProviderRegistry {
  private providers = new Map<string, OAuthProviderAdapter>();

  register(provider: OAuthProviderAdapter): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): OAuthProviderAdapter | undefined {
    return this.providers.get(name);
  }

  getAll(): OAuthProviderAdapter[] {
    return Array.from(this.providers.values());
  }

  getConfigured(): OAuthProviderAdapter[] {
    return this.getAll().filter(provider => provider.isConfigured());
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }
}

/**
 * Create default OAuth provider registry
 */
export const createOAuthProviderRegistry = (): OAuthProviderRegistry => {
  const registry = new OAuthProviderRegistry();
  
  // Register default providers
  registry.register(new GoogleOAuthProvider());
  registry.register(new GitHubOAuthProvider());
  
  return registry;
};

/**
 * Default provider registry instance
 */
export const oauthProviderRegistry = createOAuthProviderRegistry();
