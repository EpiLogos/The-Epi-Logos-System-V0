'use client';

import { useState, useCallback } from 'react';
import { useUnifiedAuth } from '@/auth/unified-auth-context';

export interface ModalOAuthState {
  isLoading: boolean;
  error: string | null;
  oauthWindow: Window | null;
}

export interface ModalOAuthActions {
  initiateModalOAuth: (provider: string) => Promise<void>;
  clearError: () => void;
}

export const useModalOAuth = (
  onSuccess?: () => void,
  onError?: (error: string) => void
): [ModalOAuthState, ModalOAuthActions] => {
  
  const { initiateOAuth, completeOAuth } = useUnifiedAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthWindow, setOauthWindow] = useState<Window | null>(null);

  const initiateModalOAuth = useCallback(async (provider: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate OAuth URL with modal-aware callback
      const baseUrl = window.location.origin;
      const callbackUrl = `${baseUrl}/auth/modal-callback`;

      const oauthUrl = await initiateOAuth(provider, callbackUrl);
      
      // Open popup window
      const popup = window.open(
        oauthUrl,
        'oauth-popup',
        'width=500,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      setOauthWindow(popup);
      
      // Listen for popup completion (fallback if no message received)
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsLoading(false);
          setOauthWindow(null);
          
          // Only show cancellation error if we didn't already get a message
          setError('Authentication was cancelled');
          onError?.('Authentication was cancelled');
        }
      }, 1000);

      // Listen for messages from popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'oauth-success') {
          clearInterval(checkClosed);
          popup.close();
          setIsLoading(false);
          setOauthWindow(null);
          
          // Direct success callback - no localStorage
          onSuccess?.();
        } else if (event.data.type === 'oauth-error') {
          clearInterval(checkClosed);
          popup.close();
          setIsLoading(false);
          setOauthWindow(null);
          
          const errorMessage = event.data.error || 'OAuth authentication failed';
          setError(errorMessage);
          onError?.(errorMessage);
        }
      };

      window.addEventListener('message', handleMessage);
      
      // Cleanup on component unmount or popup close
      return () => {
        window.removeEventListener('message', handleMessage);
        clearInterval(checkClosed);
        if (popup && !popup.closed) {
          popup.close();
        }
      };
      
    } catch (err) {
      console.error('Modal OAuth failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start OAuth process';
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
    }
  }, [initiateOAuth, onSuccess, onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const state: ModalOAuthState = {
    isLoading,
    error,
    oauthWindow,
  };

  const actions: ModalOAuthActions = {
    initiateModalOAuth,
    clearError,
  };

  return [state, actions];
};