/**
 * API Client Adapter
 * Type-safe HTTP client for authentication API calls with automatic token refresh
 * 
 * This adapter provides a clean interface for making authenticated API calls
 * with automatic token refresh, retry logic, and comprehensive error handling.
 */

import type {
  AuthTokens,
  User
} from '@/domains/auth';

import {
  isValidAuthTokens,
  normalizeUserFromBackend
} from '@/domains/auth';

/**
 * API client interface
 */
export interface APIClientAdapter {
  // Authentication endpoints
  signIn(credentials: SignInRequest): Promise<SignInResponse>;
  signOut(): Promise<void>;
  refreshTokens(refreshToken: string): Promise<TokenRefreshResponse>;
  
  // OAuth endpoints
  initiateOAuth(provider: string, params: OAuthInitiateRequest): Promise<OAuthInitiateResponse>;
  completeOAuth(provider: string, params: OAuthCompleteRequest): Promise<OAuthCompleteResponse>;
  
  // User endpoints
  getCurrentUser(): Promise<User>;
  updateUser(updates: UserUpdateRequest): Promise<User>;
  changePassword(request: ChangePasswordRequest): Promise<void>;
  
  // Account linking
  linkAccount(request: LinkAccountRequest): Promise<LinkAccountResponse>;
  unlinkAccount(provider: string): Promise<void>;
  
  // Configuration
  setAuthToken(token: string): void;
  clearAuthToken(): void;
  setBaseURL(url: string): void;
}

/**
 * Request/Response types
 */
export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  user: User;
  tokens: AuthTokens;
  linkedAccount?: any;
}

export interface TokenRefreshResponse {
  tokens: AuthTokens;
  user?: User;
}

export interface OAuthInitiateRequest {
  returnUrl: string;
  linkAccount?: boolean;
  codeChallenge: string;
  codeChallengeMethod: string;
  nonce: string;
  state: string;
}

export interface OAuthInitiateResponse {
  authorizationUrl: string;
}

export interface OAuthCompleteRequest {
  code: string;
  state: string;
  codeVerifier: string;
  nonce: string;
}

export interface OAuthCompleteResponse {
  user: User;
  tokens: AuthTokens;
  linkedAccount?: any;
  isNewUser: boolean;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  profilePicture?: string;
  preferences?: any;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface LinkAccountRequest {
  provider: string;
  code: string;
  state: string;
}

export interface LinkAccountResponse {
  linkedAccount: any;
  user: User;
}

/**
 * API error types
 */
export class APIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TokenExpiredError extends APIError {
  constructor() {
    super('Token has expired', 401, 'TOKEN_EXPIRED');
    this.name = 'TokenExpiredError';
  }
}

/**
 * API client configuration
 */
export interface APIClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableAutoRefresh: boolean;
  onTokenRefresh?: (tokens: AuthTokens) => void;
  onAuthError?: (error: APIError) => void;
}

/**
 * HTTP client implementation
 */
export class HTTPAPIClient implements APIClientAdapter {
  private config: APIClientConfig;
  private authToken: string | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor(config: Partial<APIClientConfig> = {}) {
    this.config = {
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableAutoRefresh: true,
      ...config
    };
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Set base URL
   */
  setBaseURL(url: string): void {
    this.config.baseURL = url;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = true
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add auth header if required and available
    if (requiresAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout)
    };

    let lastError: Error;

    // Retry logic
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, requestOptions);

        // Handle authentication errors
        if (response.status === 401 && requiresAuth) {
          throw new TokenExpiredError();
        }

        // Handle other HTTP errors
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response);
          throw new APIError(
            errorData.message || `HTTP ${response.status}`,
            response.status,
            errorData.code || 'HTTP_ERROR',
            errorData.details
          );
        }

        // Parse successful response
        const data = await response.json();
        return data;

      } catch (error) {
        lastError = error as Error;

        // Don't retry on authentication errors
        if (error instanceof TokenExpiredError) {
          if (this.config.enableAutoRefresh && this.config.onAuthError) {
            this.config.onAuthError(error);
          }
          throw error;
        }

        // Don't retry on client errors (4xx)
        if (error instanceof APIError && error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Retry on network errors and server errors
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt));
          continue;
        }

        // Convert fetch errors to NetworkError
        if (error instanceof TypeError || error.name === 'AbortError') {
          throw new NetworkError('Network request failed', error);
        }

        throw error;
      }
    }

    throw lastError!;
  }

  /**
   * Parse error response
   */
  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return {
        message: response.statusText || 'Unknown error',
        code: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods

  async signIn(credentials: SignInRequest): Promise<SignInResponse> {
    const response = await this.makeRequest<any>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }, false);

    // Normalize user data from backend
    const user = normalizeUserFromBackend(response.user);
    
    // Validate tokens
    if (!isValidAuthTokens(response.tokens)) {
      throw new APIError('Invalid tokens received', 500, 'INVALID_TOKENS');
    }

    return {
      user,
      tokens: response.tokens,
      linkedAccount: response.linkedAccount
    };
  }

  async signOut(): Promise<void> {
    await this.makeRequest('/api/auth/signout', {
      method: 'POST'
    });
  }

  async refreshTokens(refreshToken: string): Promise<TokenRefreshResponse> {
    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      const tokens = await this.refreshPromise;
      return { tokens };
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken);
    
    try {
      const tokens = await this.refreshPromise;
      
      // Update auth token
      this.setAuthToken(tokens.accessToken);
      
      // Notify callback
      if (this.config.onTokenRefresh) {
        this.config.onTokenRefresh(tokens);
      }

      return { tokens };
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<AuthTokens> {
    const response = await this.makeRequest<any>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    }, false);

    if (!isValidAuthTokens(response.tokens)) {
      throw new APIError('Invalid tokens received', 500, 'INVALID_TOKENS');
    }

    return response.tokens;
  }

  async initiateOAuth(provider: string, params: OAuthInitiateRequest): Promise<OAuthInitiateResponse> {
    // For stateless JWT system, we generate the Google OAuth URL directly
    // This avoids the Redis-based backend authorize endpoint

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google Client ID not configured');
    }

    // Generate PKCE parameters
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Generate state and nonce
    const state = this.generateRandomString(32);
    const nonce = this.generateRandomString(32);

    // Store PKCE parameters and callback URL for later use in completeOAuth
    sessionStorage.setItem(`oauth_${state}_code_verifier`, codeVerifier);
    sessionStorage.setItem(`oauth_${state}_nonce`, nonce);
    sessionStorage.setItem(`oauth_${state}_callback_url`, params.returnUrl);

    // Build Google OAuth URL directly - must use registered callback
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = 'openid email profile';

    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;

    return {
      authorizationUrl: authUrl
    };
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substring(0, length);
  }

  async completeOAuth(provider: string, params: OAuthCompleteRequest): Promise<OAuthCompleteResponse> {
    // Retrieve stored PKCE parameters and callback URL
    const codeVerifier = sessionStorage.getItem(`oauth_${params.state}_code_verifier`);
    const nonce = sessionStorage.getItem(`oauth_${params.state}_nonce`);
    const callbackUrl = sessionStorage.getItem(`oauth_${params.state}_callback_url`);

    if (!codeVerifier || !nonce || !callbackUrl) {
      throw new APIError('OAuth state not found or expired', 400, 'INVALID_STATE');
    }

    // Clean up stored parameters
    sessionStorage.removeItem(`oauth_${params.state}_code_verifier`);
    sessionStorage.removeItem(`oauth_${params.state}_nonce`);
    sessionStorage.removeItem(`oauth_${params.state}_callback_url`);

    // Use the stateless JWT exchange endpoint
    const exchangeParams = {
      code: params.code,
      state: params.state,
      codeVerifier,
      redirectUri: `${window.location.origin}/auth/callback`
    };

    const response = await this.makeRequest<any>(`/auth/oauth/${provider}/exchange`, {
      method: 'POST',
      body: JSON.stringify(exchangeParams)
    }, false);

    // The backend returns user data directly in response.data
    if (!response.success || !response.data) {
      throw new APIError('OAuth exchange failed', 500, 'OAUTH_EXCHANGE_FAILED');
    }

    const userData = response.data;

    // Extract tokens from user data
    const tokens = {
      accessToken: userData.accessToken,
      refreshToken: userData.refreshToken,
      expiresAt: new Date(Date.now() + (3600 * 1000)).toISOString(), // Default 1 hour
      tokenType: 'Bearer'
    };

    // Normalize user data (remove token fields)
    const { accessToken, refreshToken, sessionId, ...userFields } = userData;
    const user = normalizeUserFromBackend(userFields);

    if (!user) {
      throw new APIError('Invalid user data received', 500, 'INVALID_USER_DATA');
    }

    return {
      user,
      tokens,
      linkedAccount: null, // Stateless system doesn't track linked accounts this way
      isNewUser: false // Could be determined from response if backend provides this info
    };
  }


  async getCurrentUser(): Promise<User> {
    const response = await this.makeRequest<any>('/api/auth/me');

    // Debug: Log the actual response structure
    console.log('getCurrentUser response:', response);

    // The backend returns: { success: true, data: { user: {...} } }
    if (!response.data || !response.data.user) {
      console.error('Invalid response structure:', response);
      throw new APIError('Invalid user data received', 500, 'INVALID_USER_DATA');
    }

    return normalizeUserFromBackend(response.data.user);
  }

  async updateUser(updates: UserUpdateRequest): Promise<User> {
    const response = await this.makeRequest<any>('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });

    // The backend returns: { success: true, data: { user: {...} } }
    if (!response.data || !response.data.user) {
      throw new APIError('Invalid user data received', 500, 'INVALID_USER_DATA');
    }

    return normalizeUserFromBackend(response.data.user);
  }

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await this.makeRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async linkAccount(request: LinkAccountRequest): Promise<LinkAccountResponse> {
    const response = await this.makeRequest<any>('/api/auth/link-account', {
      method: 'POST',
      body: JSON.stringify(request)
    });

    return {
      linkedAccount: response.linkedAccount,
      user: normalizeUserFromBackend(response.user)
    };
  }

  async unlinkAccount(provider: string): Promise<void> {
    await this.makeRequest(`/api/auth/unlink-account/${provider}`, {
      method: 'DELETE'
    });
  }
}

/**
 * Create default API client
 */
export const createAPIClient = (config?: Partial<APIClientConfig>): APIClientAdapter => {
  return new HTTPAPIClient(config);
};

/**
 * Mock API client for testing
 */
export class MockAPIClient implements APIClientAdapter {
  private authToken: string | null = null;
  private baseURL: string = '';

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = null;
  }

  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  async signIn(credentials: SignInRequest): Promise<SignInResponse> {
    // Mock implementation
    throw new Error('Mock implementation');
  }

  async signOut(): Promise<void> {
    // Mock implementation
  }

  async refreshTokens(refreshToken: string): Promise<TokenRefreshResponse> {
    // Mock implementation
    throw new Error('Mock implementation');
  }

  async initiateOAuth(provider: string, params: OAuthInitiateRequest): Promise<OAuthInitiateResponse> {
    // Mock implementation
    throw new Error('Mock implementation');
  }

  async completeOAuth(provider: string, params: OAuthCompleteRequest): Promise<OAuthCompleteResponse> {
    // Mock implementation
    throw new Error('Mock implementation');
  }

  async getCurrentUser(): Promise<User> {
    // Mock implementation
    throw new Error('Mock implementation');
  }

  async updateUser(updates: UserUpdateRequest): Promise<User> {
    // Mock implementation
    throw new Error('Mock implementation');
  }

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    // Mock implementation
  }

  async linkAccount(request: LinkAccountRequest): Promise<LinkAccountResponse> {
    // Mock implementation
    throw new Error('Mock implementation');
  }

  async unlinkAccount(provider: string): Promise<void> {
    // Mock implementation
  }
}
