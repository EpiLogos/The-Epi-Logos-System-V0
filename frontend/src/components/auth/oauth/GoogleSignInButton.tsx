/**
 * Google Sign-In Button Component
 * Pure presentation layer consuming useOAuth hook
 * 
 * REFACTORED: Phase 3 - Removed duplicate business logic, now consumes domain functions via hook
 */

import React, { useState } from 'react';
import { useOAuth } from '../../../auth/hooks/useOAuth';

interface GoogleSignInButtonProps {
  returnUrl?: string;
  linkAccount?: boolean;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  returnUrl,
  linkAccount = false,
  className = ''
}) => {
  const { initiateOAuthFlow, isLoading, error, isAuthenticated, clearError } = useOAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Don't render button if user is already authenticated (unless linking)
  if (isAuthenticated && !linkAccount) {
    return (
      <div className="text-sm text-green-600" data-testid="signed-in-status">
        Signed in
      </div>
    );
  }

  // REMOVED: PKCE generation moved to oauth.domain.ts
  // REMOVED: Nonce generation moved to oauth.domain.ts

  const handleSignIn = async () => {
    try {
      setIsProcessing(true);
      
      // Clear any existing errors
      if (error) {
        clearError();
      }

      // SIMPLIFIED: Hook handles all domain logic (PKCE, nonce, URL building)
      await initiateOAuthFlow({
        provider: 'google',
        returnUrl: returnUrl || window.location.pathname,
        linkAccount
      });

    } catch (err) {
      console.error('OAuth initiation failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    if (clearError) {
      clearError();
    }
    handleSignIn();
  };

  // Show loading state
  if (isLoading || isProcessing) {
    return (
      <button
        type="button"
        disabled
        className={`google-signin-button ${className}`}
        aria-label="Signing in with Google"
      >
        <div className="flex items-center justify-center space-x-2">
          <div 
            className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"
            data-testid="loading-spinner"
          />
          <span>Signing in...</span>
        </div>
      </button>
    );
  }

  // Show error state with retry
  if (error) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-red-600">
          {error}
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className={`google-signin-button ${className}`}
          aria-label="Try again"
        >
          Try Again
        </button>
      </div>
    );
  }

  const buttonText = linkAccount ? 'Link Google Account' : 'Sign in with Google';
  const ariaLabel = linkAccount ? 'Link Google Account' : 'Sign in with Google';

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSignIn}
        className={`google-signin-button flex items-center justify-center space-x-3 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        aria-label={ariaLabel}
        disabled={isLoading}
      >
        {/* Google Icon */}
        <div data-testid="google-icon" className="w-5 h-5">
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </div>
        
        <span className="text-gray-700 font-medium">
          {buttonText}
        </span>
      </button>
      
      {linkAccount && (
        <div className="text-xs text-gray-500 px-2">
          This will link your Google account to your existing profile
        </div>
      )}
    </div>
  );
};