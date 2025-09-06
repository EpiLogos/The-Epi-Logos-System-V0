"use client";

/**
 * useOAuth Hook
 * OAuth-specific authentication hook with provider management
 *
 * This hook provides OAuth functionality including provider management,
 * account linking, and OAuth flow handling.
 */

import { useCallback, useState } from 'react';
import { useUnifiedAuth } from '../unified-auth-context';
import type { OAuthProvider } from '@/domains/auth';

/**
 * OAuth hook interface
 */
export interface UseOAuthReturn {
  // OAuth state
  isLoading: boolean;
  error: string | null;
  
  // OAuth actions
  initiateOAuth: (provider: string, returnUrl?: string) => Promise<string>;
  completeOAuth: (provider: string, code: string, state: string) => Promise<void>;
  
  // Account linking
  linkAccount: (provider: string, code: string, state: string) => Promise<void>;
  unlinkAccount: (provider: string) => Promise<void>;
  
  // Provider helpers
  getLinkedProviders: () => OAuthProvider[];
  hasProvider: (provider: string) => boolean;
  getProviderData: (provider: string) => OAuthProvider | undefined;
  
  // Utility
  clearError: () => void;
}

/**
 * OAuth authentication hook
 * 
 * Provides OAuth-specific functionality including provider management
 * and account linking capabilities.
 * 
 * @example
 * ```tsx
 * function OAuthSignIn() {
 *   const { initiateOAuth, isLoading, error } = useOAuth();
 * 
 *   const handleGoogleSignIn = async () => {
 *     try {
 *       const authUrl = await initiateOAuth('google', '/dashboard');
 *       window.location.href = authUrl;
 *     } catch (error) {
 *       console.error('OAuth initiation failed:', error);
 *     }
 *   };
 * 
 *   return (
 *     <button onClick={handleGoogleSignIn} disabled={isLoading}>
 *       {isLoading ? 'Loading...' : 'Sign in with Google'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useOAuth(): UseOAuthReturn {
  const context = useUnifiedAuth();
  const [oauthLoading, setOAuthLoading] = useState(false);
  const [oauthError, setOAuthError] = useState<string | null>(null);

  // Enhanced OAuth initiation with loading state
  const initiateOAuth = useCallback(async (provider: string, returnUrl?: string) => {
    try {
      setOAuthLoading(true);
      setOAuthError(null);
      
      const authUrl = await context.initiateOAuth(provider, returnUrl);
      return authUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth initiation failed';
      setOAuthError(errorMessage);
      throw error;
    } finally {
      setOAuthLoading(false);
    }
  }, [context]);

  // Enhanced OAuth completion with loading state
  const completeOAuth = useCallback(async (provider: string, code: string, state: string) => {
    try {
      setOAuthLoading(true);
      setOAuthError(null);
      
      await context.completeOAuth(provider, code, state);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth completion failed';
      setOAuthError(errorMessage);
      throw error;
    } finally {
      setOAuthLoading(false);
    }
  }, [context]);

  // Enhanced account linking with loading state
  const linkAccount = useCallback(async (provider: string, code: string, state: string) => {
    try {
      setOAuthLoading(true);
      setOAuthError(null);
      
      await context.linkAccount(provider, code, state);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Account linking failed';
      setOAuthError(errorMessage);
      throw error;
    } finally {
      setOAuthLoading(false);
    }
  }, [context]);

  // Enhanced account unlinking with loading state
  const unlinkAccount = useCallback(async (provider: string) => {
    try {
      setOAuthLoading(true);
      setOAuthError(null);
      
      await context.unlinkAccount(provider);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Account unlinking failed';
      setOAuthError(errorMessage);
      throw error;
    } finally {
      setOAuthLoading(false);
    }
  }, [context]);

  // Provider helpers
  const getLinkedProviders = useCallback((): OAuthProvider[] => {
    return context.user?.oauthProviders || [];
  }, [context.user]);

  const hasProvider = useCallback((provider: string): boolean => {
    return getLinkedProviders().some(p => p.provider === provider);
  }, [getLinkedProviders]);

  const getProviderData = useCallback((provider: string): OAuthProvider | undefined => {
    return getLinkedProviders().find(p => p.provider === provider);
  }, [getLinkedProviders]);

  // Clear OAuth-specific errors
  const clearError = useCallback(() => {
    setOAuthError(null);
    context.clearError();
  }, [context]);

  return {
    // State (combine context loading with OAuth-specific loading)
    isLoading: context.isLoading || oauthLoading,
    error: oauthError || context.error,

    // Actions
    initiateOAuth,
    completeOAuth,
    linkAccount,
    unlinkAccount,

    // Provider helpers
    getLinkedProviders,
    hasProvider,
    getProviderData,

    // Utility
    clearError
  };
}

/**
 * OAuth provider management hook
 * 
 * Provides functionality for managing linked OAuth providers.
 * 
 * @example
 * ```tsx
 * function LinkedAccounts() {
 *   const { 
 *     linkedProviders, 
 *     unlinkProvider, 
 *     canUnlink 
 *   } = useOAuthProviders();
 * 
 *   return (
 *     <div>
 *       {linkedProviders.map(provider => (
 *         <div key={provider.provider}>
 *           <span>{provider.provider}: {provider.email}</span>
 *           {canUnlink && (
 *             <button onClick={() => unlinkProvider(provider.provider)}>
 *               Unlink
 *             </button>
 *           )}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOAuthProviders() {
  const { 
    getLinkedProviders, 
    hasProvider, 
    getProviderData, 
    unlinkAccount,
    isLoading,
    error 
  } = useOAuth();
  
  const { user, hasPassword } = useUnifiedAuth();

  const linkedProviders = getLinkedProviders();

  // Check if user can unlink providers (must have password or multiple providers)
  const canUnlink = useCallback((provider?: string) => {
    if (!user) return false;
    
    // If user has a password, they can unlink any provider
    if (hasPassword()) return true;
    
    // If user has no password, they can only unlink if they have multiple providers
    // (to ensure they don't lock themselves out)
    return linkedProviders.length > 1;
  }, [user, hasPassword, linkedProviders.length]);

  const unlinkProvider = useCallback(async (provider: string) => {
    if (!canUnlink(provider)) {
      throw new Error('Cannot unlink provider: would leave account inaccessible');
    }
    
    await unlinkAccount(provider);
  }, [canUnlink, unlinkAccount]);

  return {
    linkedProviders,
    hasProvider,
    getProviderData,
    unlinkProvider,
    canUnlink,
    isLoading,
    error
  };
}

/**
 * OAuth callback hook
 * 
 * Handles OAuth callback processing with URL parameter parsing.
 * 
 * @example
 * ```tsx
 * function OAuthCallback() {
 *   const { 
 *     processCallback, 
 *     isProcessing, 
 *     error 
 *   } = useOAuthCallback();
 * 
 *   useEffect(() => {
 *     const urlParams = new URLSearchParams(window.location.search);
 *     const code = urlParams.get('code');
 *     const state = urlParams.get('state');
 *     const provider = 'google'; // or get from route params
 * 
 *     if (code && state) {
 *       processCallback(provider, code, state);
 *     }
 *   }, [processCallback]);
 * 
 *   if (isProcessing) return <div>Processing OAuth callback...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   
 *   return <div>OAuth callback processed successfully!</div>;
 * }
 * ```
 */
export function useOAuthCallback() {
  const { completeOAuth, linkAccount, isLoading, error, clearError } = useOAuth();
  const { isAuthenticated } = useUnifiedAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const processCallback = useCallback(async (
    provider: string, 
    code: string, 
    state: string,
    isLinking: boolean = false
  ) => {
    try {
      setIsProcessing(true);
      clearError();

      if (isLinking || isAuthenticated) {
        // User is already authenticated, this is account linking
        await linkAccount(provider, code, state);
      } else {
        // User is not authenticated, this is sign-in
        await completeOAuth(provider, code, state);
      }
    } catch (error) {
      console.error('OAuth callback processing failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [completeOAuth, linkAccount, isAuthenticated, clearError]);

  return {
    processCallback,
    isProcessing: isProcessing || isLoading,
    error,
    clearError
  };
}

/**
 * OAuth sign-in button hook
 * 
 * Provides functionality for OAuth sign-in buttons with state management.
 * 
 * @example
 * ```tsx
 * function GoogleSignInButton() {
 *   const { 
 *     handleSignIn, 
 *     isLoading, 
 *     buttonText, 
 *     canSignIn 
 *   } = useOAuthSignIn('google');
 * 
 *   if (!canSignIn) return null;
 * 
 *   return (
 *     <button onClick={handleSignIn} disabled={isLoading}>
 *       {isLoading ? 'Loading...' : buttonText}
 *     </button>
 *   );
 * }
 * ```
 */
export function useOAuthSignIn(provider: string, returnUrl?: string) {
  const { initiateOAuth, isLoading, error } = useOAuth();
  const { isAuthenticated } = useUnifiedAuth();

  const handleSignIn = useCallback(async () => {
    try {
      const authUrl = await initiateOAuth(provider, returnUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error(`${provider} sign-in failed:`, error);
      // Error is handled by the OAuth hook
    }
  }, [initiateOAuth, provider, returnUrl]);

  // Determine button state
  const canSignIn = !isAuthenticated;
  const buttonText = `Sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`;

  return {
    handleSignIn,
    isLoading,
    error,
    buttonText,
    canSignIn
  };
}

/**
 * OAuth account linking button hook
 * 
 * Provides functionality for OAuth account linking buttons.
 * 
 * @example
 * ```tsx
 * function LinkGoogleButton() {
 *   const { 
 *     handleLink, 
 *     isLoading, 
 *     buttonText, 
 *     canLink,
 *     isLinked 
 *   } = useOAuthLink('google');
 * 
 *   if (isLinked) return <span>✓ Google account linked</span>;
 *   if (!canLink) return null;
 * 
 *   return (
 *     <button onClick={handleLink} disabled={isLoading}>
 *       {isLoading ? 'Loading...' : buttonText}
 *     </button>
 *   );
 * }
 * ```
 */
export function useOAuthLink(provider: string, returnUrl?: string) {
  const { initiateOAuth, hasProvider, isLoading, error } = useOAuth();
  const { isAuthenticated } = useUnifiedAuth();

  const handleLink = useCallback(async () => {
    try {
      const authUrl = await initiateOAuth(provider, returnUrl, true); // true = linking mode
      window.location.href = authUrl;
    } catch (error) {
      console.error(`${provider} account linking failed:`, error);
      // Error is handled by the OAuth hook
    }
  }, [initiateOAuth, provider, returnUrl]);

  // Determine button state
  const canLink = isAuthenticated && !hasProvider(provider);
  const isLinked = hasProvider(provider);
  const buttonText = `Link ${provider.charAt(0).toUpperCase() + provider.slice(1)} Account`;

  return {
    handleLink,
    isLoading,
    error,
    buttonText,
    canLink,
    isLinked
  };
}
