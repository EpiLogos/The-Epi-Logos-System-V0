"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlowParticles } from '@/components/system/GlowParticles';
import { Button } from '@/components/ui/Button';
import { useAuth, useOAuth } from '@/auth';
import HexagonNavigation from '@/components/HexagonNavigation';
import PasswordRequirementsComponent from '@/components/auth/PasswordRequirements';
import { TransitionBackground, usePageTransition } from '@/contexts/PageTransitionContext';
import { TransitionParticles, TransitionCard } from '@/components/system/TransitionParticles';
import {
  validatePassword,
  fetchPasswordRequirements,
  DEFAULT_PASSWORD_REQUIREMENTS,
  type PasswordRequirements,
  type PasswordValidationResult
} from '@/utils/passwordValidation';
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon
} from '@heroicons/react/24/outline';

// Coordinate context for template structure
const COORDINATE_CONTEXT = {
  coordinate: '#4.0.0',
  subsystem: 4,
  name: 'User Authentication Gateway',
  context: 'nara-authentication'
};

// OAuth functionality now handled by unified auth hooks

type AuthState = 'idle' | 'loading' | 'error' | 'success';
type AuthMode = 'signin' | 'signup';

interface SignInError {
  code: string;
  message: string;
  userMessage: string;
}

interface AuthFormData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  confirmPassword?: string;
}

/**
 * Unified Authentication Page - Coordinate #4.0.0 (Nara Gateway)
 * 
 * Features:
 * - Unified sign-in/sign-up experience with tabbed interface
 * - Google OAuth integration with secure PKCE flow
 * - Email/password authentication with backend integration
 * - Brand-consistent design with coordinate alignment
 * - Error handling and loading states
 * - Mobile-responsive design
 * - Accessible form elements
 */
export default function SignInPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { startTransition, completeTransition, transitionState } = usePageTransition();
  const { signIn } = useAuth();
  const { initiateOAuth, isLoading: isOAuthLoading } = useOAuth();

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [error, setError] = useState<SignInError | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation state
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>(DEFAULT_PASSWORD_REQUIREMENTS);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult | null>(null);

  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  });

  // Fetch password requirements on component mount
  useEffect(() => {
    const loadPasswordRequirements = async () => {
      try {
        const requirements = await fetchPasswordRequirements();
        setPasswordRequirements(requirements);
      } catch (_error) {
        console.warn('Failed to load password requirements, using defaults');
      }
    };

    loadPasswordRequirements();
  }, []);

  // Handle URL error parameters from OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (errorParam) {
      setError({
        code: errorParam,
        message: errorDescription || 'Authentication failed',
        userMessage: getErrorMessage(errorParam)
      });
      setAuthState('error');

      // Clean up URL without causing navigation
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'access_denied': 'You cancelled the sign-in process. Please try again to continue.',
      'invalid_request': 'There was a problem with your sign-in request. Please try again.',
      'server_error': 'We encountered a server error. Please try again in a moment.',
      'temporarily_unavailable': 'Authentication is temporarily unavailable. Please try again later.',
      'token_expired': 'Your session has expired. Please sign in again.',
      'token_revoked': 'Your authentication has been revoked. Please sign in again.',
      'invalid_credentials': 'Invalid email or password. Please check your credentials and try again.',
      'user_not_found': 'No account found with this email. Please sign up or check your email address.',
      'user_exists': 'An account with this email already exists. Please sign in instead.',
    };
    
    return errorMessages[errorCode] || 'An unexpected error occurred during authentication. Please try again.';
  };

  const handleInputChange = (field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Real-time password validation for signup mode
    if (field === 'password' && authMode === 'signup') {
      const validation = validatePassword(value, passwordRequirements);
      setPasswordValidation(validation);
    }

    // Clear errors when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    const { email, password, firstName, lastName, confirmPassword } = formData;
    
    if (!email || !password) {
      setError({
        code: 'validation_error',
        message: 'Email and password are required',
        userMessage: 'Please fill in all required fields.'
      });
      return false;
    }

    if (authMode === 'signup') {
      if (!firstName || !lastName) {
        setError({
          code: 'validation_error',
          message: 'First name and last name are required',
          userMessage: 'Please provide your first and last name.'
        });
        return false;
      }

      if (password !== confirmPassword) {
        setError({
          code: 'validation_error',
          message: 'Passwords do not match',
          userMessage: 'Passwords do not match. Please check and try again.'
        });
        return false;
      }

      // Validate password strength
      const passwordValidation = validatePassword(password, passwordRequirements);
      if (!passwordValidation.isValid) {
        setError({
          code: 'validation_error',
          message: 'Password does not meet requirements',
          userMessage: `Password requirements not met: ${passwordValidation.failedRules.join(', ')}`
        });
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError({
        code: 'validation_error',
        message: 'Invalid email format',
        userMessage: 'Please enter a valid email address.'
      });
      return false;
    }

    return true;
  };

  const handleEmailAuth = async () => {
    if (!validateForm()) return;

    setAuthState('loading');
    setError(null);

    try {
      const endpoint = authMode === 'signin' ? '/api/users/login' : '/api/users/register';
      const payload = authMode === 'signin' 
        ? { email: formData.email, password: formData.password }
        : { 
            email: formData.email, 
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName 
          };

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Sign in the user using AuthContext
        if (result.data) {
          // Extract tokens from the response data
          const tokens = {
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            idToken: result.data.idToken || '', // Optional
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
          };

          // Create user object (remove tokens from user data)
          const { accessToken: _accessToken, refreshToken: _refreshToken, idToken: _idToken, ...userData } = result.data;

          signIn({
            user: userData,
            tokens: tokens
          });
        }

        setAuthState('success');

        // Start transition and redirect to account page
        startTransition('/auth/signin', '/account', 'auth-to-account');

        setTimeout(() => {
          router.push('/account');
        }, 600); // Sync with transition timing
      } else {
        // Handle API errors with detailed validation feedback
        let errorMessage = result.message || 'Authentication failed';

        // Handle validation errors specifically
        if (response.status === 422 && result.field_errors) {
          const fieldErrors = Object.entries(result.field_errors)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage = `Validation failed: ${fieldErrors}`;
        } else if (result.errors && Array.isArray(result.errors)) {
          errorMessage = result.errors.map((err: any) =>
            typeof err === 'string' ? err : err.message || 'Validation error'
          ).join('; ');
        }

        setError({
          code: response.status === 422 ? 'validation_error' : 'api_error',
          message: errorMessage,
          userMessage: errorMessage
        });
        setAuthState('error');
      }
    } catch (err) {
      console.error('Email auth failed:', err);
      setError({
        code: 'network_error',
        message: 'Network error',
        userMessage: 'Unable to connect to authentication server. Please check your connection and try again.'
      });
      setAuthState('error');
    }
  };

  const handleGoogleSignIn = async () => {
    if (isOAuthLoading) return;

    setAuthState('loading');
    setError(null);

    try {
      const authUrl = await initiateOAuth('google', '/account');
      window.location.href = authUrl;
    } catch (err) {
      console.error('OAuth initiation failed:', err);

      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to start sign-in process';

      setError({
        code: 'oauth_init_failed',
        message: errorMessage,
        userMessage: 'Unable to start Google sign-in. Please check your connection and try again.'
      });

      setAuthState('error');
    }
  };

  const resetError = () => {
    setError(null);
    setAuthState('idle');
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      confirmPassword: ''
    });
    setError(null);
    setAuthState('idle');
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      data-coordinate={COORDINATE_CONTEXT.coordinate}
    >
      {/* Transition-aware background */}
      <TransitionBackground currentPage="auth" />

      {/* Transition-aware particles */}
      <TransitionParticles
        currentPage="auth"
        parentRef={containerRef as unknown as React.RefObject<HTMLElement>}
      />

      <TransitionCard
        isVisible={!transitionState.isTransitioning || transitionState.fromPage === '/auth/signin'}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <HexagonNavigation
              preset="logo"
              scale={0.33}
              color="#ea580cff"
              colorTo="#dc2626ff"
              colorDuration={8}
            />
          </div>

          <h1 className="font-heading font-light text-4xl text-white tracking-wide mb-2">
            Epi:Logos
          </h1>
          <p className="font-sans text-orange-200 text-lg">
            Consciousness-Aligned Computing
          </p>
          <p className="font-mono text-orange-300 text-sm mt-2">
            {COORDINATE_CONTEXT.coordinate} | Authentication Gateway
          </p>
        </div>

        {/* Auth Card */}
        <motion.div 
          className="bg-white/10 backdrop-blur-sm border border-orange-300/30 rounded-2xl p-8 shadow-2xl"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
        >
          {/* Mode Toggle */}
          <div className="flex mb-8 bg-orange-900/50 rounded-xl p-1">
            <button
              onClick={() => setAuthMode('signin')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                authMode === 'signin'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-orange-200 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                authMode === 'signup'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-orange-200 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl text-white mb-3">
              {authMode === 'signin' ? 'Welcome Back' : 'Join the System'}
            </h2>
            <p className="font-sans text-orange-100 text-sm leading-relaxed">
              {authMode === 'signin' 
                ? 'Sign in to continue your journey through consciousness-computing synthesis.'
                : 'Create your account to explore the six-fold architecture of Epi-Logos.'
              }
            </p>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="mb-6 p-4 bg-red-900/30 border border-red-400/50 rounded-lg"
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
                      Authentication Error
                    </p>
                    <p className="font-sans text-red-300 text-sm mt-1">
                      {error.userMessage}
                    </p>
                  </div>
                  <button
                    onClick={resetError}
                    className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
                    aria-label="Dismiss error"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Display */}
          <AnimatePresence>
            {authState === 'success' && (
              <motion.div
                className="mb-6 p-4 bg-green-900/30 border border-green-400/50 rounded-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="font-sans text-green-200 text-sm font-medium">
                    {authMode === 'signin' ? 'Welcome back! Redirecting...' : 'Account created successfully! Redirecting...'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email/Password Form */}
          <div className="space-y-4 mb-6">
            {/* Name fields for signup */}
            {authMode === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-sans text-orange-100 text-sm font-medium">First Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-orange-300/30 rounded-lg text-white placeholder-orange-300/70 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition-all"
                      placeholder="John"
                      disabled={authState === 'loading'}
                    />
                    <UserIcon className="absolute right-3 top-3.5 h-5 w-5 text-orange-300/70" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-sans text-orange-100 text-sm font-medium">Last Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-orange-300/30 rounded-lg text-white placeholder-orange-300/70 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition-all"
                      placeholder="Doe"
                      disabled={authState === 'loading'}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <label className="font-sans text-orange-100 text-sm font-medium">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-white/10 border border-orange-300/30 rounded-lg text-white placeholder-orange-300/70 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition-all"
                  placeholder="your@email.com"
                  disabled={authState === 'loading'}
                />
                <EnvelopeIcon className="absolute left-3 top-3.5 h-5 w-5 text-orange-300/70" />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="font-sans text-orange-100 text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-12 bg-white/10 border border-orange-300/30 rounded-lg text-white placeholder-orange-300/70 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition-all"
                  placeholder={authMode === 'signup' ? 'At least 8 characters' : 'Your password'}
                  disabled={authState === 'loading'}
                />
                <LockClosedIcon className="absolute left-3 top-3.5 h-5 w-5 text-orange-300/70" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 h-5 w-5 text-orange-300/70 hover:text-orange-200 transition-colors"
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Password Requirements for signup */}
            {authMode === 'signup' && passwordValidation && (
              <PasswordRequirementsComponent
                validation={passwordValidation}
                requirements={passwordRequirements}
                password={formData.password}
              />
            )}

            {/* Confirm password for signup */}
            {authMode === 'signup' && (
              <div className="space-y-2">
                <label className="font-sans text-orange-100 text-sm font-medium">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-3 pl-12 pr-12 bg-white/10 border border-orange-300/30 rounded-lg text-white placeholder-orange-300/70 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition-all"
                    placeholder="Confirm your password"
                    disabled={authState === 'loading'}
                  />
                  <LockClosedIcon className="absolute left-3 top-3.5 h-5 w-5 text-orange-300/70" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 h-5 w-5 text-orange-300/70 hover:text-orange-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            )}

            {/* Email Auth Button */}
            <Button
              onClick={handleEmailAuth}
              disabled={authState === 'loading'}
              size="lg"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white border-0 font-medium text-base h-12 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: authState === 'loading' ? 1 : 1.02 }}
              whileTap={{ scale: authState === 'loading' ? 1 : 0.98 }}
            >
              {authState === 'loading' ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-orange-200 border-t-white rounded-full animate-spin" />
                  <span>{authMode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : (
                <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center my-6">
            <div className="flex-1 border-t border-orange-300/30" />
            <span className="px-4 text-orange-200 text-sm font-medium">or</span>
            <div className="flex-1 border-t border-orange-300/30" />
          </div>

          {/* OAuth Sign-In Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isOAuthLoading || authState === 'loading'}
            size="lg"
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border-0 font-medium text-base h-12 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isOAuthLoading ? 1 : 1.02 }}
            whileTap={{ scale: isOAuthLoading ? 1 : 0.98 }}
          >
            <div className="flex items-center justify-center space-x-3">
              {isOAuthLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285f4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34a853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#fbbc05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#ea4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </div>
          </Button>

          {/* Security Notice */}
          <div className="text-center mt-6">
            <p className="font-sans text-xs text-orange-200/70 leading-relaxed">
              By continuing, you agree to our secure authentication practices. 
              We use industry-standard OAuth 2.0 with PKCE and encrypted password storage.
            </p>
          </div>
        </motion.div>

        {/* Footer Navigation */}
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 font-sans text-orange-200 hover:text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Return to Foundation</span>
          </Link>
        </motion.div>
      </TransitionCard>
    </div>
  );
}