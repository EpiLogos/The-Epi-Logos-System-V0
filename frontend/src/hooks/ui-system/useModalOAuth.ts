'use client';

import { useState, useCallback } from 'react';
import { useUnifiedAuth } from '@/auth/unified-auth-context';

export interface ModalOAuthState {
  isLoading: boolean;
  error: string | null;
  oauthUrl: string | null;
  showIframe: boolean;
}

export interface ModalOAuthActions {
  initiateModalOAuth: (provider: string) => Promise<void>;
  cancelOAuth: () => void;
  clearError: () => void;
}

export const useModalOAuth = (
  onSuccess?: () => void,
  onError?: (error: string) => void
): [ModalOAuthState, ModalOAuthActions] => {
  
  const { initiateOAuth, completeOAuth, reloadFromStorage } = useUnifiedAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [showIframe, setShowIframe] = useState(false);

  const initiateModalOAuth = useCallback(async (provider: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate OAuth URL with same callback as normal flow
      const baseUrl = window.location.origin;
      const callbackUrl = `${baseUrl}/auth/callback`;

      const generatedOauthUrl = await initiateOAuth(provider, callbackUrl);

      // Parse state for BroadcastChannel name
      const authUrl = new URL(generatedOauthUrl);
      const stateParam = authUrl.searchParams.get('state');
      if (!stateParam) {
        throw new Error('OAuth state not present in authorization URL');
      }

      let completed = false;
      const channel = new BroadcastChannel(`oauth_${stateParam}`);

      // 3-minute timeout
      const timeoutId = window.setTimeout(() => {
        if (!completed) {
          setIsLoading(false);
          setError('Authentication timed out');
          onError?.('Authentication timed out');
          try { channel.close(); } catch {}
        }
      }, 3 * 60 * 1000);

      channel.onmessage = async (evt) => {
        const data = evt.data || {};
        if (data.type === 'oauth-code' && data.code && data.state === stateParam) {
          try {
            setIsLoading(true);
            await completeOAuth(provider, data.code, data.state);
            completed = true;
            window.clearTimeout(timeoutId);
            setIsLoading(false);
            await reloadFromStorage();
            await new Promise(r => setTimeout(r, 150));
            onSuccess?.();
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'OAuth completion failed';
            setError(msg);
            onError?.(msg);
          } finally {
            try { channel.close(); } catch {}
          }
        } else if (data.type === 'oauth-error') {
          completed = true;
          window.clearTimeout(timeoutId);
          setIsLoading(false);
          const msg = data.error || 'OAuth authentication failed';
          setError(msg);
          onError?.(msg);
          try { channel.close(); } catch {}
        }
      };

      // Open provider in a new tab (not popup) so the opener stays alive
      window.open(generatedOauthUrl, '_blank');
      setOauthUrl(generatedOauthUrl);
      setShowIframe(false);
      setIsLoading(false);

    } catch (err) {
      console.error('Modal OAuth failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start OAuth process';
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
    }
  }, [initiateOAuth, completeOAuth, reloadFromStorage, onError]);

  const handleOAuthSuccess = useCallback(async () => {
    try {
      setShowIframe(false);
      setIsLoading(true);
      
      // Force reload from storage after iframe OAuth completion
      await reloadFromStorage();
      
      // Wait a bit to ensure auth context is fully updated
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setIsLoading(false);
      
      // Auth state refreshed - trigger success callback
      onSuccess?.();
    } catch (err) {
      console.error('Failed to complete OAuth after iframe success:', err);
      const errorMessage = 'Failed to complete authentication';
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
    }
  }, [reloadFromStorage, onSuccess, onError]);

  const handleOAuthError = useCallback((errorMessage: string) => {
    setShowIframe(false);
    setIsLoading(false);
    setError(errorMessage);
    onError?.(errorMessage);
  }, [onError]);

  const cancelOAuth = useCallback(() => {
    setShowIframe(false);
    setIsLoading(false);
    setOauthUrl(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const state: ModalOAuthState = {
    isLoading,
    error,
    oauthUrl,
    showIframe,
  };

  const actions: ModalOAuthActions = {
    initiateModalOAuth,
    cancelOAuth,
    clearError,
  };

  // Expose success and error handlers for iframe component
  const iframeHandlers = {
    onSuccess: handleOAuthSuccess,
    onError: handleOAuthError,
    onCancel: cancelOAuth,
  };

  return [state, actions, iframeHandlers] as const;
};
