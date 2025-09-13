"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GlowParticles } from '@/components/system/GlowParticles';
import { Button } from '@/components/ui/Button';
import { AccountLinkingService } from '@/auth/oauth/account-linking-service';
import HexGridLoader from '@/components/HexGridLoader';

// Service instance
const linkingService = new AccountLinkingService();

type LinkingState = 'loading' | 'confirmation' | 're_auth' | 'linking' | 'success' | 'error';

interface LinkingError {
  code: string;
  message: string;
  userMessage: string;
}

interface PendingLinkData {
  googleProfile: any;
  existingUser: any;
  requiresReAuth: boolean;
}

/**
 * Account Linking Page
 * 
 * Handles secure linking of Google OAuth accounts to existing Epi-Logos accounts.
 * Features:
 * - Secure re-authentication requirement
 * - Account ownership validation
 * - Clear user consent flow
 * - Error handling for security failures
 * - Mobile-responsive design
 */
export default function LinkAccountPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [linkingState, setLinkingState] = useState<LinkingState>('loading');
  const [error, setError] = useState<LinkingError | null>(null);
  const [pendingData, setPendingData] = useState<PendingLinkData | null>(null);
  const [password, setPassword] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Load pending link data from session
  useEffect(() => {
    const pendingLinkData = sessionStorage.getItem('pending_link');
    if (!pendingLinkData) {
      // No pending data - redirect to sign in
      router.push('/auth/signin?error=invalid_request&error_description=No pending account link found');
      return;
    }

    try {
      const data: PendingLinkData = JSON.parse(pendingLinkData);
      setPendingData(data);
      setLinkingState('confirmation');
    } catch (err) {
      setError({
        code: 'invalid_data',
        message: 'Invalid pending link data',
        userMessage: 'The linking session data is corrupted. Please try signing in again.'
      });
      setLinkingState('error');
    }
  }, [router]);

  const handleConfirmLinking = () => {
    if (!pendingData?.requiresReAuth) {
      // Should not happen, but handle gracefully
      handleDirectLink();
      return;
    }
    
    setLinkingState('re_auth');
  };

  const handleDirectLink = async () => {
    if (!pendingData) return;
    
    setIsLinking(true);
    setLinkingState('linking');

    try {
      const result = await linkingService.linkGoogleAccount(
        pendingData.existingUser.id,
        pendingData.googleProfile,
        false // No re-authentication (for demo purposes)
      );

      if (!result.success) {
        throw new Error(result.error || 'Account linking failed');
      }

      // Store successful authentication
      sessionStorage.setItem('auth_user', JSON.stringify({
        user: pendingData.existingUser,
        linkedAccount: result.linkedAccount,
        linkTime: new Date().toISOString()
      }));

      // Clean up pending data
      sessionStorage.removeItem('pending_link');

      setLinkingState('success');
      
      // Redirect after success
      setTimeout(() => {
        router.push('/account');
      }, 2000);

    } catch (err) {
      console.error('Account linking failed:', err);
      
      setError({
        code: 'linking_failed',
        message: err instanceof Error ? err.message : 'Unknown error',
        userMessage: 'Failed to link your accounts. Please try the process again.'
      });
      
      setLinkingState('error');
      setIsLinking(false);
    }
  };

  const handleReAuthentication = async () => {
    if (!password.trim() || !pendingData) {
      setError({
        code: 'validation_error',
        message: 'Password is required',
        userMessage: 'Please enter your password to verify account ownership.'
      });
      return;
    }

    setIsLinking(true);
    setLinkingState('linking');

    try {
      // Step 1: Verify re-authentication (mock implementation)
      const reAuthValid = await linkingService.verifyReAuthentication(
        pendingData.existingUser.id,
        password
      );

      if (!reAuthValid) {
        throw new Error('Password verification failed');
      }

      // Step 2: Validate account ownership
      const ownershipValid = await linkingService.validateAccountOwnership(
        pendingData.existingUser.id,
        pendingData.googleProfile.email
      );

      if (!ownershipValid) {
        throw new Error('Account ownership validation failed');
      }

      // Step 3: Link accounts
      const result = await linkingService.linkGoogleAccount(
        pendingData.existingUser.id,
        pendingData.googleProfile,
        true // With re-authentication
      );

      if (!result.success) {
        throw new Error(result.error || 'Account linking failed');
      }

      // Store successful authentication
      sessionStorage.setItem('auth_user', JSON.stringify({
        user: pendingData.existingUser,
        linkedAccount: result.linkedAccount,
        linkTime: new Date().toISOString()
      }));

      // Clean up pending data and password
      sessionStorage.removeItem('pending_link');
      setPassword('');

      setLinkingState('success');
      
      // Redirect after success
      setTimeout(() => {
        router.push('/account');
      }, 2000);

    } catch (err) {
      console.error('Re-authentication failed:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      setError({
        code: 'reauth_failed',
        message: errorMessage,
        userMessage: errorMessage.includes('Password') 
          ? 'Incorrect password. Please check your password and try again.'
          : 'Account verification failed. Please ensure you own both accounts.'
      });
      
      setLinkingState('error');
      setIsLinking(false);
      setPassword('');
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem('pending_link');
    router.push('/auth/signin');
  };

  const resetError = () => {
    setError(null);
    setLinkingState('confirmation');
  };

  const renderLinkingState = () => {
    switch (linkingState) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="mb-6">
              <HexGridLoader
                size={80}
                durationSec={8}
                minOpacity={0.3}
                continuousFade={true}
                jitterPx={0}
                opacityJitter={0.5}
                color="#292069f5"
                colorTo="#262626ff"
                colorDuration={6}
              />
            </div>
            
            <h2 className="font-heading text-2xl text-white mb-4">
              Loading Link Data
            </h2>
            
            <p className="font-sans text-gray-300">
              Preparing account linking flow...
            </p>
          </div>
        );

      case 'confirmation':
        return (
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              
              <h2 className="font-heading text-2xl text-white mb-4">
                Link Your Accounts
              </h2>
            </div>

            {pendingData && (
              <div className="space-y-6">
                {/* Account Information */}
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="font-heading text-lg text-white mb-4">
                    Account Details
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">G</span>
                      </div>
                      <div>
                        <p className="font-sans text-white text-sm font-medium">Google Account</p>
                        <p className="font-sans text-gray-400 text-sm">{pendingData.googleProfile.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">E</span>
                      </div>
                      <div>
                        <p className="font-sans text-white text-sm font-medium">Epi-Logos Account</p>
                        <p className="font-sans text-gray-400 text-sm">{pendingData.existingUser.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <p className="font-sans text-blue-200 text-sm font-medium">
                        Secure Account Linking
                      </p>
                      <p className="font-sans text-blue-300 text-sm mt-1">
                        For security, we&apos;ll need to verify your account ownership before linking. 
                        This prevents unauthorized account access.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={handleConfirmLinking}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    Continue Linking
                  </Button>
                  
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 're_auth':
        return (
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <h2 className="font-heading text-2xl text-white mb-4">
                Verify Account Ownership
              </h2>
              
              <p className="font-sans text-gray-300">
                Please enter your Epi-Logos account password to confirm linking
              </p>
            </div>

            <div className="space-y-6">
              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block font-sans text-sm font-medium text-gray-300 mb-2">
                  Account Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  disabled={isLinking}
                  onKeyPress={(e) => e.key === 'Enter' && handleReAuthentication()}
                />
              </div>

              {/* Security Info */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="font-sans text-gray-400 text-sm">
                  <strong>Why we need this:</strong> Account linking is a sensitive operation. 
                  We verify your password to ensure you truly own the account being linked.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={handleReAuthentication}
                  disabled={!password.trim() || isLinking}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  size="lg"
                >
                  {isLinking ? 'Verifying...' : 'Verify & Link'}
                </Button>
                
                <Button
                  onClick={() => setLinkingState('confirmation')}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                  size="lg"
                  disabled={isLinking}
                >
                  Back
                </Button>
              </div>
            </div>
          </div>
        );

      case 'linking':
        return (
          <div className="text-center">
            <div className="mb-6">
              <HexGridLoader
                size={100}
                durationSec={6}
                minOpacity={0.2}
                continuousFade={true}
                jitterPx={1}
                opacityJitter={0.8}
                color="#292069f5"
                colorTo="#4285f4"
                colorDuration={3}
              />
            </div>
            
            <h2 className="font-heading text-2xl text-white mb-4">
              Linking Accounts
            </h2>
            
            <p className="font-sans text-gray-300 text-lg mb-2">
              Securely connecting your accounts...
            </p>
            
            <p className="font-sans text-gray-500 text-sm">
              This may take a moment while we validate everything
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
              Accounts Successfully Linked!
            </h2>
            
            <p className="font-sans text-gray-300 text-lg mb-2">
              You can now sign in with either method
            </p>
            
            <p className="font-sans text-gray-500 text-sm">
              Redirecting to the consciousness-computing experience...
            </p>
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
              Account Linking Failed
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
              <Button
                onClick={resetError}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                size="lg"
              >
                Try Again
              </Button>
              
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full"
                size="lg"
              >
                Back to Sign In
              </Button>
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
        className="relative z-10 w-full max-w-lg px-6"
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

        {/* Linking Content Card */}
        <motion.div 
          className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
        >
          {/* Error Display */}
          <AnimatePresence>
            {error && linkingState === 'error' && (
              <motion.div
                className="mb-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-sans text-red-200 text-sm font-medium">
                      Account Linking Error
                    </p>
                    <p className="font-sans text-red-300 text-sm mt-1">
                      {error.userMessage}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {renderLinkingState()}
        </motion.div>

        {/* Footer Navigation */}
        {linkingState !== 'linking' && (
          <motion.div 
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Link 
              href="/auth/signin"
              className="inline-flex items-center space-x-2 font-sans text-gray-400 hover:text-white text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Sign In</span>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
