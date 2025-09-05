"use client";

/**
 * OAuth Context for managing OAuth authentication state and flows
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

interface OAuthFlowParams {
  provider: string;
  returnUrl: string;
  codeVerifier: string;
  codeChallenge: string;
  nonce: string;
  linkAccount?: boolean;
}

interface OAuthContextValue {
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  initiateOAuthFlow: (params: OAuthFlowParams) => Promise<void>;
  clearError: () => void;
}

const OAuthContext = createContext<OAuthContextValue | undefined>(undefined);

export const useOAuth = () => {
  const context = useContext(OAuthContext);
  if (context === undefined) {
    throw new Error('useOAuth must be used within an OAuthProvider');
  }
  return context;
};

interface OAuthProviderProps {
  children: React.ReactNode;
}

export const OAuthProvider: React.FC<OAuthProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const initiateOAuthFlow = useCallback(async (params: OAuthFlowParams) => {
    try {
      setIsLoading(true);
      setError(null);

      // Build OAuth authorization URL
      const authUrl = new URL('/api/auth/oauth/google/authorize', window.location.origin);
      
      // Add PKCE and security parameters
      authUrl.searchParams.set('code_challenge', params.codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('nonce', params.nonce);
      authUrl.searchParams.set('return_url', params.returnUrl);
      
      if (params.linkAccount) {
        authUrl.searchParams.set('link_account', 'true');
      }

      // Store PKCE verifier for callback
      sessionStorage.setItem('oauth_code_verifier', params.codeVerifier);
      sessionStorage.setItem('oauth_nonce', params.nonce);

      // Redirect to OAuth authorization
      window.location.href = authUrl.toString();

    } catch (err) {
      console.error('OAuth flow initiation failed:', err);
      setError('Failed to initiate sign-in process');
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: OAuthContextValue = {
    isLoading,
    error,
    isAuthenticated,
    initiateOAuthFlow,
    clearError
  };

  return (
    <OAuthContext.Provider value={value}>
      {children}
    </OAuthContext.Provider>
  );
};
