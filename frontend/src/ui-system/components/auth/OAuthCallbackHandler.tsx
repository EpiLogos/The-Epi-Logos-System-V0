'use client';

import React, { useEffect } from 'react';
import { useUnifiedAuth } from '@/auth/unified-auth-context';

export const OAuthCallbackHandler: React.FC = () => {
  const { completeOAuth } = useUnifiedAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Check if this is a popup window (has opener)
        const isPopup = window.opener && window.opener !== window;
        
        if (isPopup) {
          // Parse URL parameters for OAuth callback
          const urlParams = new URLSearchParams(window.location.search);
          const hash = window.location.hash.substring(1);
          const hashParams = new URLSearchParams(hash);
          
          const code = urlParams.get('code') || hashParams.get('code');
          const state = urlParams.get('state') || hashParams.get('state');
          const error = urlParams.get('error') || hashParams.get('error');
          
          if (error) {
            // Notify parent window of error
            window.opener.postMessage({ 
              type: 'oauth-error', 
              error: error 
            }, window.location.origin);
            window.close();
            return;
          }
          
          if (code && state) {
            try {
              // Complete OAuth flow
              await completeOAuth('google', code, state);
              
              // Notify parent window of success
              window.opener.postMessage({ 
                type: 'oauth-success' 
              }, window.location.origin);
              window.close();
            } catch (err) {
              console.error('OAuth completion failed:', err);
              window.opener.postMessage({ 
                type: 'oauth-error', 
                error: err instanceof Error ? err.message : 'OAuth completion failed'
              }, window.location.origin);
              window.close();
            }
          }
        } else {
          // Regular page load - redirect to original OAuth flow
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          const state = urlParams.get('state');
          const error = urlParams.get('error');
          
          if (error) {
            // Redirect to auth page with error
            window.location.href = `/auth/signin?error=${error}`;
            return;
          }
          
          if (code && state) {
            try {
              await completeOAuth('google', code, state);
              // Redirect to account page on success
              window.location.href = '/account';
            } catch (err) {
              console.error('OAuth completion failed:', err);
              window.location.href = `/auth/signin?error=oauth_completion_failed`;
            }
          }
        }
      } catch (err) {
        console.error('OAuth callback handling failed:', err);
        
        if (window.opener && window.opener !== window) {
          window.opener.postMessage({ 
            type: 'oauth-error', 
            error: 'Callback handling failed'
          }, window.location.origin);
          window.close();
        } else {
          window.location.href = `/auth/signin?error=callback_failed`;
        }
      }
    };

    handleOAuthCallback();
  }, [completeOAuth]);

  return (
    <div className="auth-modal-container">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 border-4 border-ui-coord-text border-t-ui-panel rounded-full animate-spin"></div>
        </div>
        <div>
          <h3 className="text-xl font-heading text-ui-panel mb-2">
            Completing Authentication...
          </h3>
          <p className="text-ui-coord-text font-sans">
            Please wait while we complete your sign-in.
          </p>
        </div>
      </div>
    </div>
  );
};