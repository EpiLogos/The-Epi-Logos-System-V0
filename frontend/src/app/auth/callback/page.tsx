"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { GlowParticles } from '@/components/system/GlowParticles';
import { useAuth } from '@/auth/auth-context';
import { OAuthCallbackHandler } from '@/auth/oauth/oauth-callback-handler';
import { AccountLinkingService } from '@/auth/oauth/account-linking-service';
import HexGridLoader from '@/components/HexGridLoader';

// Service instances
const callbackHandler = new OAuthCallbackHandler();
const linkingService = new AccountLinkingService();

type CallbackState = 'processing' | 'success' | 'error' | 'linking_required';

interface CallbackError {
  code: string;
  message: string;
  userMessage: string;
  shouldRetry?: boolean;
}

interface LinkingData {
  googleProfile: any;
  existingUser: any;
  requiresReAuth: boolean;
}

/**
 * OAuth Callback Handler Page
 * 
 * Handles the return flow from Google OAuth including:
 * - Authorization code exchange for tokens
 * - User profile extraction and validation
 * - Account linking flow for existing users
 * - Security validation (state, nonce, PKCE)
 * - Error handling and user feedback
 */
export default function CallbackPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { signIn } = useAuth();
  
  const [callbackState, setCallbackState] = useState<CallbackState>('processing');
  const [error, setError] = useState<CallbackError | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing authentication...');
  const [linkingData, setLinkingData] = useState<LinkingData | null>(null);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // Extract URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      // Handle OAuth errors from provider
      if (error) {
        handleOAuthError(error, errorDescription);
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        throw new Error('Missing authorization code or state parameter');
      }

      // Step 1: Validate state and exchange code for tokens
      setProgress(20);
      setStatusMessage('Validating authorization...');
      await new Promise(resolve => setTimeout(resolve, 500)); // UX delay

      const callbackResult = await callbackHandler.handleCallback({ code, state });
      
      if (!callbackResult.success) {
        throw new Error(callbackResult.error || 'Token exchange failed');
      }

      // Step 2: Handle account linking or create new user
      setProgress(60);
      setStatusMessage('Setting up your account...');
      await new Promise(resolve => setTimeout(resolve, 500)); // UX delay

      const linkingResult = await linkingService.handleOAuthSignIn(callbackResult.user);
      
      if (linkingResult.requiresLinking) {
        // User has existing account - need linking flow
        setLinkingData({
          googleProfile: callbackResult.user,
          existingUser: linkingResult.existingUser,
          requiresReAuth: true
        });
        setCallbackState('linking_required');
        setStatusMessage('Account linking required...');
        return;
      }

      // Step 3: Complete authentication
      setProgress(90);
      setStatusMessage('Finalizing sign-in...');
      await new Promise(resolve => setTimeout(resolve, 500)); // UX delay

      // Normalize token fields to AuthContext shape
      const raw = callbackResult.tokens as any;
      
      // Check if we have backend JWT tokens (preferred) or fallback to Google tokens
      const normalizedTokens = raw
        ? {
            accessToken: raw.access_token || raw.accessToken,
            refreshToken: raw.refresh_token || raw.refreshToken,
            idToken: raw.id_token || raw.idToken || '',
            expiresAt: new Date(Date.now() + (raw.expires_in || 3600) * 1000).toISOString()
          }
        : null;

      // Debug logging
      console.log('OAuth Callback Debug:', {
        rawTokens: raw,
        normalizedTokens,
        hasJwtToken: !!raw?.accessToken,
        hasGoogleToken: !!raw?.access_token
      });

      // Store authentication state via global auth context
      signIn({
        user: callbackResult.user || linkingResult.newUser,
        tokens: normalizedTokens,
        linkedAccount: linkingResult.linkedAccount
      });

      // Success!
      setProgress(100);
      setStatusMessage('Welcome to Epi-Logos!');
      setCallbackState('success');

      // Determine redirect based on user's password status
      const hasPassword = callbackResult.user?.hasPassword === true || linkingResult.newUser?.hasPassword === true;
      const redirectPath = hasPassword ? '/account' : '/account?tab=security';

      // Redirect after short delay
      setTimeout(() => {
        router.push(redirectPath);
      }, 2000);

    } catch (err) {
      console.error('OAuth callback error:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      
      setError({
        code: 'callback_failed',
        message: errorMessage,
        userMessage: getCallbackErrorMessage(errorMessage),
        shouldRetry: !errorMessage.includes('state') && !errorMessage.includes('nonce')
      });
      
      setCallbackState('error');
    }
  };

  const handleOAuthError = (errorCode: string, description?: string | null) => {
    const errorMessages: Record<string, string> = {
      'access_denied': 'You cancelled the sign-in process.',
      'invalid_request': 'There was a problem with the authorization request.',
      'invalid_scope': 'The requested permissions are not available.',
      'server_error': 'Google encountered a server error.',
      'temporarily_unavailable': 'Google authentication is temporarily unavailable.',
    };
    
    const userMessage = errorMessages[errorCode] || 'Authentication was not completed.';
    
    setError({
      code: errorCode,
      message: description || errorCode,
      userMessage,
      shouldRetry: errorCode !== 'access_denied'
    });
    
    setCallbackState('error');
  };

  const getCallbackErrorMessage = (errorMessage: string): string => {
    if (errorMessage.includes('state')) {
      return 'Security validation failed. This may be due to an expired or tampered session.';
    }
    if (errorMessage.includes('nonce')) {
      return 'ID token validation failed. Please try signing in again.';
    }
    if (errorMessage.includes('code_verifier')) {
      return 'PKCE validation failed. Your session may have been compromised.';
    }
    if (errorMessage.includes('network')) {
      return 'Network error occurred. Please check your connection and try again.';
    }
    
    return 'An unexpected error occurred during authentication. Please try again.';
  };

  const handleRetry = () => {
    router.push('/auth/signin');
  };

  const handleLinkAccount = () => {
    // Store linking data for the linking flow
    if (typeof window !== 'undefined' && linkingData) {
      sessionStorage.setItem('pending_link', JSON.stringify(linkingData));
    }
    router.push('/auth/link-account');
  };

  const renderCallbackState = () => {
    switch (callbackState) {
      case 'processing':
        return (
          <div className="text-center">
            <div className="mb-6">
              <HexGridLoader
                size={100}
                durationSec={8}
                minOpacity={0.2}
                continuousFade={true}
                jitterPx={1}
                opacityJitter={0.7}
                color="#292069f5"
                colorTo="#4285f4"
                colorDuration={4}
              />
            </div>
            
            <h2 className="font-heading text-2xl text-white mb-4">
              Processing Authentication
            </h2>
            
            <div className="mb-6">
              <div className="w-full bg-gray-800 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
            
            <p className="font-sans text-gray-300 text-lg">
              {statusMessage}
            </p>
            
            <p className="font-sans text-gray-500 text-sm mt-3">
              Please wait while we securely process your authentication...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h2 className="font-heading text-2xl text-white mb-4">
              Welcome to Epi-Logos!
            </h2>
            
            <p className="font-sans text-gray-300 text-lg mb-2">
              Authentication successful
            </p>
            
            <p className="font-sans text-gray-500 text-sm">
              Redirecting you to the consciousness-computing experience...
            </p>
          </div>
        );

      case 'linking_required':
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>
            
            <h2 className="font-heading text-2xl text-white mb-4">
              Account Linking Required
            </h2>
            
            <p className="font-sans text-gray-300 text-lg mb-6">
              An account with your email already exists. We'll help you link your Google account securely.
            </p>
            
            <button
              onClick={handleLinkAccount}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Continue to Account Linking
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            
            <h2 className="font-heading text-2xl text-white mb-4">
              Authentication Failed
            </h2>
            
            <p className="font-sans text-gray-300 text-lg mb-6">
              {error?.userMessage}
            </p>
            
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <p className="font-mono text-red-400 text-sm">
                  Code: {error.code}
                </p>
                <p className="font-mono text-gray-400 text-xs mt-1">
                  {error.message}
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              {error?.shouldRetry && (
                <button
                  onClick={handleRetry}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors w-full"
                >
                  Try Again
                </button>
              )}
              
              <button
                onClick={() => router.push('/auth/signin')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-colors w-full"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative min-h-screen bg-gradient-to-b from-black to-slate-800 flex items-center justify-center overflow-hidden"
    >
      {/* Background particles */}
      <GlowParticles 
        isVisible={true}
        particleCount={1}
        monochrome={true}
        radiusScale={0.0000001}
        mode="mist"
        parentRef={containerRef as unknown as React.RefObject<HTMLElement>}
      />

      <motion.div 
        className="relative z-10 w-full max-w-md px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.6, 1] }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading font-light text-3xl text-white tracking-wide mb-2">
            Epi:Logos
          </h1>
          <p className="font-sans text-gray-400">
            Consciousness-Aligned Computing
          </p>
        </div>

        {/* Callback Content Card */}
        <motion.div 
          className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
        >
          {renderCallbackState()}
        </motion.div>
      </motion.div>
    </div>
  );
}
