/**
 * OAuth Orchestration Hook
 * Orchestrates OAuth domain logic with React state and infrastructure
 * 
 * INTEGRATES: domains/auth/oauth.domain.ts with React state management
 * 
 * This hook is the ONLY layer that imports both domain logic and React.
 * Components consume this hook and are "dumb" presentation layers.
 */

import { useState, useCallback } from 'react';
import {
  prepareOAuthFlow,
  validateOAuthParams,
  OAUTH_STORAGE_KEYS,
  type OAuthFlowParams,
  type OAuthAuthorizationURL
} from '@/domains/auth/oauth.domain';
import {
  clearStoredAuthData
} from '@/domains/auth/session.domain';

export interface UseOAuthReturn {
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  initiateOAuthFlow: (params: OAuthFlowParams) => Promise<void>;
  clearError: () => void;
}

export const useOAuth = (): UseOAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const initiateOAuthFlow = useCallback(async (params: OAuthFlowParams) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate parameters using domain logic
      if (!validateOAuthParams(params)) {
        throw new Error('Invalid OAuth parameters');
      }

      // Prepare OAuth flow using pure domain functions
      const authData: OAuthAuthorizationURL = await prepareOAuthFlow(
        params.provider,
        params.returnUrl,
        params.linkAccount || false,
        window.location.origin
      );

      // Store PKCE verifier and nonce for callback (infrastructure concern)
      sessionStorage.setItem(OAUTH_STORAGE_KEYS.CODE_VERIFIER, authData.codeVerifier);
      sessionStorage.setItem(OAUTH_STORAGE_KEYS.NONCE, authData.nonce);

      // Redirect to OAuth authorization (infrastructure concern)
      window.location.href = authData.url;

    } catch (err) {
      console.error('OAuth flow initiation failed:', err);
      setError('Failed to initiate sign-in process');
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: UseOAuthReturn = {
    isLoading,
    error,
    isAuthenticated,
    initiateOAuthFlow,
    clearError
  };

  return value;
};