/**
 * OAuth Domain Logic
 * Pure functions for OAuth 2.0 authentication with PKCE and OIDC nonce validation
 * 
 * EXTRACTED FROM: GoogleSignInButton.tsx:32-62, OAuthContext.tsx:45-75
 * 
 * This domain contains zero React dependencies and pure business logic only.
 */

export interface PKCEParameters {
  codeVerifier: string;
  codeChallenge: string;
}

export interface OAuthFlowParams {
  provider: string;
  returnUrl: string;
  codeVerifier: string;
  codeChallenge: string;
  nonce: string;
  linkAccount?: boolean;
}

export interface OAuthAuthorizationURL {
  url: string;
  codeVerifier: string;
  nonce: string;
}

/**
 * Generate cryptographically secure PKCE parameters
 * EXTRACTED FROM: GoogleSignInButton.tsx:32-52
 */
export const generatePKCEParameters = async (): Promise<PKCEParameters> => {
  // Generate cryptographically secure random bytes for code verifier
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Generate code challenge using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
  const hashArray = new Uint8Array(hashBuffer);
  const codeChallenge = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return { codeVerifier, codeChallenge };
};

/**
 * Generate cryptographically secure nonce for OIDC
 * EXTRACTED FROM: GoogleSignInButton.tsx:54-62
 */
export const generateNonce = (): string => {
  // Generate 24 random bytes for nonce
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Build OAuth authorization URL with PKCE and security parameters
 * EXTRACTED FROM: OAuthContext.tsx:50-68
 */
export const buildOAuthAuthorizationURL = (
  params: OAuthFlowParams,
  baseOrigin: string
): string => {
  // Build OAuth authorization URL
  const authUrl = new URL('/api/auth/oauth/google/authorize', baseOrigin);
  
  // Add PKCE and security parameters
  authUrl.searchParams.set('code_challenge', params.codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('nonce', params.nonce);
  authUrl.searchParams.set('return_url', params.returnUrl);
  
  if (params.linkAccount) {
    authUrl.searchParams.set('link_account', 'true');
  }

  return authUrl.toString();
};

/**
 * Complete OAuth flow initialization with security parameters
 * Pure function that returns all necessary data for OAuth flow
 */
export const prepareOAuthFlow = async (
  provider: string,
  returnUrl: string,
  linkAccount: boolean = false,
  baseOrigin: string
): Promise<OAuthAuthorizationURL> => {
  // Generate PKCE parameters and nonce
  const { codeVerifier, codeChallenge } = await generatePKCEParameters();
  const nonce = generateNonce();

  // Build authorization URL
  const url = buildOAuthAuthorizationURL({
    provider,
    returnUrl,
    codeVerifier,
    codeChallenge,
    nonce,
    linkAccount
  }, baseOrigin);

  return {
    url,
    codeVerifier,
    nonce
  };
};

/**
 * Validate OAuth flow parameters
 */
export const validateOAuthParams = (params: OAuthFlowParams): boolean => {
  return !!(
    params.provider &&
    params.returnUrl &&
    params.codeVerifier &&
    params.codeChallenge &&
    params.nonce
  );
};

/**
 * Storage keys for OAuth flow parameters
 */
export const OAUTH_STORAGE_KEYS = {
  CODE_VERIFIER: 'oauth_code_verifier',
  NONCE: 'oauth_nonce',
  STATE: 'oauth_state',
  RETURN_URL: 'oauth_return_url',
  LINK_ACCOUNT: 'oauth_link_account'
} as const;

/**
 * OAuth callback data interface
 * NEW: Structure for OAuth callback processing
 */
export interface OAuthCallbackData {
  code: string;
  state: string;
  error?: string;
  error_description?: string;
}

/**
 * OAuth token response interface
 * NEW: Structure for OAuth token exchange response
 */
export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

/**
 * OAuth user profile interface
 * NEW: Structure for OAuth user profile data
 */
export interface OAuthUserProfile {
  id: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email_verified?: boolean;
  locale?: string;
}

/**
 * OAuth callback result interface
 * NEW: Complete OAuth callback processing result
 */
export interface OAuthCallbackResult {
  success: boolean;
  tokens?: OAuthTokenResponse;
  user?: OAuthUserProfile;
  error?: string;
  shouldCleanupSession?: boolean;
}

/**
 * Account linking result interface
 * NEW: Result of account linking operations
 */
export interface AccountLinkingResult {
  success: boolean;
  linkedAccount?: any;
  newUser?: any;
  isExistingUser?: boolean;
  error?: string;
}

/**
 * Validate OAuth callback data
 * NEW: Validate OAuth callback parameters
 */
export const validateOAuthCallback = (data: any): data is OAuthCallbackData => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Must have code and state for successful callback
  if (typeof data.code !== 'string' || typeof data.state !== 'string') {
    return false;
  }

  // Error fields are optional but must be strings if present
  if (data.error && typeof data.error !== 'string') {
    return false;
  }

  if (data.error_description && typeof data.error_description !== 'string') {
    return false;
  }

  return true;
};

/**
 * Validate OAuth token response
 * NEW: Validate OAuth token exchange response
 */
export const validateOAuthTokenResponse = (response: any): response is OAuthTokenResponse => {
  if (!response || typeof response !== 'object') {
    return false;
  }

  return !!(
    typeof response.access_token === 'string' &&
    response.access_token.length > 0 &&
    typeof response.token_type === 'string' &&
    typeof response.expires_in === 'number' &&
    response.expires_in > 0
  );
};

/**
 * Validate OAuth user profile
 * NEW: Validate OAuth user profile data
 */
export const validateOAuthUserProfile = (profile: any): profile is OAuthUserProfile => {
  if (!profile || typeof profile !== 'object') {
    return false;
  }

  return !!(
    typeof profile.id === 'string' &&
    profile.id.length > 0 &&
    typeof profile.email === 'string' &&
    profile.email.length > 0 &&
    typeof profile.name === 'string' &&
    profile.name.length > 0
  );
};

/**
 * Process OAuth callback data
 * NEW: Pure function to process OAuth callback
 */
export const processOAuthCallback = (callbackData: OAuthCallbackData): OAuthCallbackResult => {
  // Handle OAuth errors
  if (callbackData.error) {
    return {
      success: false,
      error: callbackData.error,
      shouldCleanupSession: callbackData.error === 'access_denied'
    };
  }

  // Validate required parameters
  if (!callbackData.code || !callbackData.state) {
    return {
      success: false,
      error: 'Missing required OAuth parameters',
      shouldCleanupSession: true
    };
  }

  // Return success with code and state for further processing
  return {
    success: true
  };
};

/**
 * Convert OAuth tokens to canonical AuthTokens format
 * NEW: Transform OAuth response to internal format
 */
export const convertOAuthTokens = (oauthTokens: OAuthTokenResponse): import('./canonical-user.types').AuthTokens => {
  const expiresAt = new Date(Date.now() + (oauthTokens.expires_in * 1000)).toISOString();

  return {
    accessToken: oauthTokens.access_token,
    refreshToken: oauthTokens.refresh_token || '',
    expiresAt,
    idToken: oauthTokens.id_token,
    tokenType: 'Bearer'
  };
};

/**
 * Convert OAuth profile to canonical User format
 * NEW: Transform OAuth profile to internal User format
 */
export const convertOAuthProfile = (oauthProfile: OAuthUserProfile, provider: string): Partial<import('./canonical-user.types').User> => {
  return {
    id: oauthProfile.id, // Will be replaced with actual user ID from backend
    email: oauthProfile.email,
    name: oauthProfile.name,
    firstName: oauthProfile.given_name,
    lastName: oauthProfile.family_name,
    profilePicture: oauthProfile.picture,
    picture: oauthProfile.picture,
    isEmailVerified: oauthProfile.email_verified === true,
    googleId: provider === 'google' ? oauthProfile.id : undefined,
    oauthProviders: [{
      provider,
      providerId: oauthProfile.id,
      linkedAt: new Date().toISOString(),
      email: oauthProfile.email,
      name: oauthProfile.name,
      picture: oauthProfile.picture
    }],
    tier: 'free', // Default tier for new users
    hasPassword: false, // OAuth users typically don't have passwords initially
    preferences: {
      notifications: true,
      theme: 'auto',
      language: oauthProfile.locale?.substring(0, 2) || 'en'
    },
    createdAt: new Date().toISOString()
  };
};

/**
 * Determine account linking strategy
 * NEW: Business logic for account linking decisions
 */
export const determineAccountLinkingStrategy = (
  oauthProfile: OAuthUserProfile,
  existingUser: any | null
): 'create_new' | 'link_existing' | 'auto_link' => {
  if (!existingUser) {
    return 'create_new';
  }

  // If emails match, auto-link (OAuth email verification is sufficient)
  if (existingUser.email === oauthProfile.email) {
    return 'auto_link';
  }

  // Otherwise, require explicit linking
  return 'link_existing';
};

/**
 * Process account linking
 * NEW: Pure function for account linking logic
 */
export const processAccountLinking = (
  oauthProfile: OAuthUserProfile,
  provider: string,
  existingUser: any | null,
  strategy: 'create_new' | 'link_existing' | 'auto_link'
): AccountLinkingResult => {
  switch (strategy) {
    case 'create_new':
      return {
        success: true,
        newUser: convertOAuthProfile(oauthProfile, provider),
        isExistingUser: false
      };

    case 'auto_link':
      if (!existingUser) {
        return {
          success: false,
          error: 'Cannot auto-link without existing user'
        };
      }

      return {
        success: true,
        linkedAccount: {
          provider,
          providerId: oauthProfile.id,
          email: oauthProfile.email,
          name: oauthProfile.name,
          picture: oauthProfile.picture,
          linkedAt: new Date().toISOString()
        },
        newUser: {
          ...existingUser,
          hasPassword: existingUser.hasPassword ?? true, // Existing users typically have passwords
          isExistingUser: true
        },
        isExistingUser: true
      };

    case 'link_existing':
      return {
        success: false,
        error: 'Explicit account linking not implemented in this flow'
      };

    default:
      return {
        success: false,
        error: 'Unknown account linking strategy'
      };
  }
};

/**
 * Store OAuth flow state
 * NEW: Store OAuth parameters for callback validation
 */
export const storeOAuthState = (
  codeVerifier: string,
  nonce: string,
  state: string,
  returnUrl: string,
  linkAccount: boolean = false
): void => {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(OAUTH_STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
    sessionStorage.setItem(OAUTH_STORAGE_KEYS.NONCE, nonce);
    sessionStorage.setItem(OAUTH_STORAGE_KEYS.STATE, state);
    sessionStorage.setItem(OAUTH_STORAGE_KEYS.RETURN_URL, returnUrl);
    sessionStorage.setItem(OAUTH_STORAGE_KEYS.LINK_ACCOUNT, linkAccount.toString());
  } catch (error) {
    // Storage failed, OAuth flow will fail validation
    console.error('Failed to store OAuth state:', error);
  }
};

/**
 * Retrieve OAuth flow state
 * NEW: Retrieve stored OAuth parameters for validation
 */
export const retrieveOAuthState = (state: string): {
  codeVerifier: string | null;
  nonce: string | null;
  returnUrl: string | null;
  linkAccount: boolean;
} | null => {
  if (typeof window === 'undefined') return null;

  try {
    const storedState = sessionStorage.getItem(OAUTH_STORAGE_KEYS.STATE);

    // Validate state parameter matches
    if (storedState !== state) {
      return null;
    }

    const codeVerifier = sessionStorage.getItem(OAUTH_STORAGE_KEYS.CODE_VERIFIER);
    const nonce = sessionStorage.getItem(OAUTH_STORAGE_KEYS.NONCE);
    const returnUrl = sessionStorage.getItem(OAUTH_STORAGE_KEYS.RETURN_URL);
    const linkAccount = sessionStorage.getItem(OAUTH_STORAGE_KEYS.LINK_ACCOUNT) === 'true';

    return {
      codeVerifier,
      nonce,
      returnUrl,
      linkAccount
    };
  } catch (error) {
    return null;
  }
};

/**
 * Clear OAuth flow state
 * NEW: Clean up OAuth parameters after flow completion
 */
export const clearOAuthState = (): void => {
  if (typeof window === 'undefined') return;

  try {
    Object.values(OAUTH_STORAGE_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
  } catch (error) {
    // Ignore storage errors during cleanup
  }
};

/**
 * Validate OAuth state parameter
 * NEW: CSRF protection for OAuth flow
 */
export const validateOAuthState = (receivedState: string, storedState: string | null): boolean => {
  if (!receivedState || !storedState) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (receivedState.length !== storedState.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < receivedState.length; i++) {
    result |= receivedState.charCodeAt(i) ^ storedState.charCodeAt(i);
  }

  return result === 0;
};

/**
 * Generate OAuth state parameter
 * NEW: Generate cryptographically secure state for CSRF protection
 */
export const generateOAuthState = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Complete OAuth flow preparation with state management
 * NEW: Enhanced OAuth flow preparation with state storage
 */
export const prepareCompleteOAuthFlow = async (
  provider: string,
  returnUrl: string,
  linkAccount: boolean = false,
  baseOrigin: string
): Promise<OAuthAuthorizationURL> => {
  // Generate all security parameters
  const { codeVerifier, codeChallenge } = await generatePKCEParameters();
  const nonce = generateNonce();
  const state = generateOAuthState();

  // Store OAuth state for callback validation
  storeOAuthState(codeVerifier, nonce, state, returnUrl, linkAccount);

  // Build authorization URL with state parameter
  const authUrl = new URL('/api/auth/oauth/google/authorize', baseOrigin);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('nonce', nonce);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('return_url', returnUrl);

  if (linkAccount) {
    authUrl.searchParams.set('link_account', 'true');
  }

  return {
    url: authUrl.toString(),
    codeVerifier,
    nonce
  };
};