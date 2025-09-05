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
  NONCE: 'oauth_nonce'
} as const;