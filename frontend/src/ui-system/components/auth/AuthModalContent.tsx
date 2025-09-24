'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnifiedAuth } from '@/auth/unified-auth-context';
import { useModalOAuth } from '@/hooks/ui-system/useModalOAuth';
import { cn } from '../../utils/cn';
import {
  validatePassword,
  fetchPasswordRequirements,
  DEFAULT_PASSWORD_REQUIREMENTS,
  type PasswordRequirements,
  type PasswordValidationResult
} from '@/utils/passwordValidation';
import PasswordRequirementsComponent from '@/components/auth/PasswordRequirements';
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { type EpiLogosBusinessState, type AuthBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';
import { OAuthIframe } from './OAuthIframe';

interface AuthModalContentProps {
  businessState: AuthBusinessState;
  onStateChange: (state: EpiLogosBusinessState) => void;
}

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

export const AuthModalContent: React.FC<AuthModalContentProps> = ({
  businessState,
  onStateChange
}) => {
  const { signIn, isLoading: isUnifiedAuthLoading, isAuthenticated } = useUnifiedAuth();

  // Modal OAuth integration
  const [modalOAuthState, modalOAuthActions, iframeHandlers] = useModalOAuth(
    () => {
      // OAuth success callback - bridge through auth-success
      onStateChange('auth-success');
    },
    (error) => {
      // OAuth error callback
      setError({
        code: 'oauth_error',
        message: error,
        userMessage: error
      });
      setAuthState('error');
    }
  );

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [error, setError] = useState<SignInError | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

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

  // Sync auth mode with business state
  useEffect(() => {
    if (businessState === 'auth-signin') {
      setAuthMode('signin');
    } else if (businessState === 'auth-signup') {
      setAuthMode('signup');
    }
  }, [businessState]);

  // Fetch password requirements on component mount
  useEffect(() => {
    const loadPasswordRequirements = async () => {
      try {
        const requirements = await fetchPasswordRequirements();
        setPasswordRequirements(requirements);
      } catch (error) {
        console.warn('Failed to load password requirements, using defaults');
      }
    };

    loadPasswordRequirements();
  }, []);

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      // Network/Server
      'network_error': 'Unable to connect to authentication server. Please check your connection and try again.',
      'server_error': 'We encountered a server error. Please try again in a moment.',

      // Auth-specific
      'invalid_credentials': 'Invalid email or password. Please check your credentials and try again.',
      'invalid_password': 'The password you entered is incorrect. Please try again.',
      'user_not_found': 'No account found with this email. Please sign up or check your email address.',
      'user_exists': 'An account with this email already exists. Please sign in instead.',

      // OAuth/UI flow
      'access_denied': 'You cancelled the sign-in process. Please try again to continue.',
      'invalid_request': 'There was a problem with your sign-in request. Please try again.',
      'temporarily_unavailable': 'Authentication is temporarily unavailable. Please try again later.',
      'token_expired': 'Your session has expired. Please sign in again.',
      'token_revoked': 'Your authentication has been revoked. Please sign in again.',

      // Validation
      'validation_error': 'Please check your input and try again.'
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
      if (authMode === 'signin') {
        // Use unified auth context for signin
        await signIn({
          email: formData.email,
          password: formData.password
        });
      } else {
        // For signup, still use direct API call as unified auth context doesn't handle registration
        const payload = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        };

        const response = await fetch(`http://localhost:8000/api/users/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Registration failed');
        }

        // After successful registration, sign in with the new credentials
        await signIn({
          email: formData.email,
          password: formData.password
        });
      }

      setAuthState('success');
      onStateChange('auth-success');
    } catch (err) {
      console.error('Email auth failed:', err);

      // Map specific API error codes to user-friendly messages
      let code = 'auth_error';
      let userMessage = 'Authentication failed';
      if (err && typeof err === 'object' && 'name' in err && (err as any).name === 'APIError') {
        const apiErr = err as any as { code?: string; message: string };
        if (apiErr.code) {
          code = apiErr.code;
          userMessage = getErrorMessage(apiErr.code);
        } else {
          userMessage = apiErr.message || userMessage;
        }
      } else if (err instanceof Error) {
        userMessage = err.message;
      }

      setError({
        code,
        message: userMessage,
        userMessage
      });
      setAuthState('error');
    }
  };

  const handleGoogleSignIn = async () => {
    if (modalOAuthState.isLoading || isOAuthLoading) return;

    setAuthState('loading');
    setError(null);
    onStateChange('auth-oauth');

    try {
      await modalOAuthActions.initiateModalOAuth('google');
    } catch (err) {
      console.error('Modal OAuth initiation failed:', err);
      // Error handling is done by the useModalOAuth hook callbacks
      setAuthState('error');
    }
  };

  const resetError = () => {
    setError(null);
    setAuthState('idle');
  };

  // Auto-transition from auth-success to account-profile
  useEffect(() => {
    if (businessState === 'auth-success') {
      const timer = setTimeout(() => {
        // Only transition if user is actually authenticated in the auth context
        // This prevents the OAuth bug where success fires before auth state updates
        if (isAuthenticated && !isUnifiedAuthLoading) {
          onStateChange('account-profile');
        } else {
          // If still loading or not authenticated, wait a bit more and try again
          console.warn('Auth success state triggered but user not authenticated yet, retrying...');
          const retryTimer = setTimeout(() => {
            if (isAuthenticated && !isUnifiedAuthLoading) {
              onStateChange('account-profile');
            } else {
              // Final fallback - transition anyway to avoid being stuck
              console.warn('Final fallback: transitioning to account despite auth state');
              onStateChange('account-profile');
            }
          }, 1000);

          return () => clearTimeout(retryTimer);
        }
      }, 2000); // 2 second delay to show success message

      return () => clearTimeout(timer);
    }
  }, [businessState, onStateChange, isAuthenticated, isUnifiedAuthLoading]);

  const toggleAuthMode = () => {
    const newMode = authMode === 'signin' ? 'signup' : 'signin';
    setAuthMode(newMode);
    onStateChange(newMode === 'signup' ? 'auth-signup' : 'auth-signin');
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

  // Render different states with smooth transitions
  if (businessState === 'auth-oauth') {
    return (
      <motion.div
        className="auth-modal-container h-full flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar max-h-[calc(100vh-120px)]">
          <div className="max-w-[500px] mx-auto px-4 pt-6 pb-1">
            <div className="text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]">
              <div className="flex justify-center">
                <div className="h-16 w-16 border-4 border-ui-coord-text border-t-ui-panel rounded-full animate-spin"></div>
              </div>
              <div>
                <h3 className="text-xl font-heading text-ui-panel mb-2">
                  Connecting with Google...
                </h3>
                <p className="text-ui-coord-text font-mono">
                  A secure browser tab has been opened for Google sign-in.
                </p>
              </div>
            </div>

            {/* OAuth Iframe overlay for in-modal flow */}
            <AnimatePresence>
              {modalOAuthState.showIframe && modalOAuthState.oauthUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <OAuthIframe
                    oauthUrl={modalOAuthState.oauthUrl}
                    onSuccess={iframeHandlers.onSuccess}
                    onError={iframeHandlers.onError}
                    onCancel={iframeHandlers.onCancel}
                    isVisible={modalOAuthState.showIframe}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }

  if (businessState === 'auth-success') {
    return (
      <motion.div
        className="auth-modal-container h-full flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
              <motion.div
                className="flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
              >
                <div className="h-16 w-16 bg-green-600/30 border border-green-400/50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <h3 className="text-xl font-heading text-ui-panel mb-2">
                  {authMode === 'signin' ? 'Welcome back!' : 'Account created successfully!'}
                </h3>
                <p className="text-ui-coord-text font-mono">
                  Redirecting to your account...
                </p>
              </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="auth-modal-container h-full flex flex-col pt-6 pb-1 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Scrollable Content Container - Panel-relative scroll (no viewport math) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="max-w-[500px] mx-auto">{/* Content wrapper for proper centering and padding */}
      {/* Mode Toggle */}
      <motion.div
        className="flex mb-6 bg-ui-panel/10 border border-ui-coord-text/30 p-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <button
          onClick={() => onStateChange('auth-signin')}
          className={cn(
            'flex-1 py-3 px-4 font-medium text-sm transition-all duration-200',
            authMode === 'signin'
              ? 'bg-ui-coord-text text-ui-gray'
              : 'text-ui-panel hover:text-ui-coord-text'
          )}
        >
          Sign In
        </button>
        <button
          onClick={() => onStateChange('auth-signup')}
          className={cn(
            'flex-1 py-3 px-4 font-medium text-sm transition-all duration-200',
            authMode === 'signup'
              ? 'bg-ui-coord-text text-ui-gray'
              : 'text-ui-panel hover:text-ui-coord-text'
          )}
        >
          Sign Up
        </button>
      </motion.div>

      {/* Welcome Message */}
      <motion.div
        className="text-center mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <h2 className="font-heading text-xl text-ui-panel mb-2">
          {authMode === 'signin' ? 'Welcome Back' : 'Join the System'}
        </h2>
        <p className="font-mono text-ui-coord-text text-xs leading-relaxed">
          {authMode === 'signin'
            ? 'Sign in to continue your journey through consciousness-computing synthesis.'
            : 'Create your account to explore the six-fold architecture of Epi-Logos.'
          }
        </p>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mb-6 p-4 bg-red-900/30 border border-red-400/50"
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
                <p className="font-mono text-ui-panel text-sm font-medium">
                  Authentication Error
                </p>
                <p className="font-mono text-ui-coord-text text-sm mt-1">
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

      {/* Email/Password Form */}
      <motion.div
        className="space-y-2 mb-3"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        {/* Name fields for signup */}
        <AnimatePresence>
          {authMode === 'signup' && (
            <motion.div
              className="auth-name-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-1">
                <label className="font-mono text-ui-panel text-sm font-medium">First Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="auth-name-input transition-all duration-200"
                    placeholder="First Name"
                    disabled={authState === 'loading'}
                  />
                  {!formData.firstName && (
                    <UserIcon className="absolute right-3 top-3.5 h-4 w-4 text-ui-coord-text/60 transition-opacity duration-200" />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-mono text-ui-panel text-sm font-medium">Last Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="auth-name-input transition-all duration-200"
                    placeholder="Last Name"
                    disabled={authState === 'loading'}
                  />
                  {!formData.lastName && (
                    <UserIcon className="absolute right-3 top-3.5 h-4 w-4 text-ui-coord-text/60 transition-opacity duration-200" />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email field */}
        <div className="space-y-1">
          <label className="font-mono text-ui-panel text-sm font-medium">Email Address</label>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={cn(
                'auth-email-input transition-all duration-200',
                !formData.email ? 'has-left-icon' : ''
              )}
              placeholder="your@email.com"
              disabled={authState === 'loading'}
            />
            <AnimatePresence>
              {!formData.email && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <EnvelopeIcon className="absolute left-3 top-3.5 h-4 w-4 text-ui-coord-text/60" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Password field */}
        <div className="space-y-1">
          <label className="font-mono text-ui-panel text-sm font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`auth-password-input ${!formData.password ? 'has-left-icon' : ''}`}
              placeholder={authMode === 'signup' ? 'At least 8 characters' : 'Your password'}
              autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
              disabled={authState === 'loading'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEmailAuth();
                }
              }}
            />
            {!formData.password && (
              <LockClosedIcon className="absolute left-3 top-3.5 h-4 w-4 text-ui-coord-text/60" />
            )}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 h-5 w-5 text-ui-coord-text hover:text-ui-panel transition-colors"
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
          <div className="space-y-1">
            <label className="font-mono text-ui-panel text-sm font-medium">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`auth-password-input ${!formData.confirmPassword ? 'has-left-icon' : ''}`}
                placeholder="Confirm your password"
                disabled={authState === 'loading'}
              />
              {!formData.confirmPassword && (
                <LockClosedIcon className="absolute left-3 top-3.5 h-4 w-4 text-ui-coord-text/60" />
              )}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3.5 h-5 w-5 text-ui-coord-text hover:text-ui-panel transition-colors"
              >
                {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
        )}

        {/* Email Auth Button */}
        <button
          onClick={handleEmailAuth}
          disabled={authState === 'loading'}
          className="auth-form-button w-full h-12 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {authState === 'loading' ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="w-5 h-5 border-2 border-ui-gray border-t-ui-panel rounded-full animate-spin" />
              <span>{authMode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
            </div>
          ) : (
            <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
          )}
        </button>
      </motion.div>

      {/* Divider */}
      <motion.div
        className="relative flex items-center my-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <div className="flex-1 border-t border-ui-coord-text/30" />
        <span className="px-4 text-ui-coord-text text-sm font-medium">or</span>
        <div className="flex-1 border-t border-ui-coord-text/30" />
      </motion.div>

      {/* OAuth Sign-In Button */}
      <motion.button
        onClick={handleGoogleSignIn}
        disabled={modalOAuthState.isLoading || authState === 'loading'}
        className="group w-full bg-ui-coord-text/10 hover:bg-ui-coord-text/20 text-gray-200 hover:text-white border border-ui-coord-text/30 hover:border-ui-panel/50 font-mono font-medium text-sm h-12 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center rounded-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-center space-x-3">
          {modalOAuthState.isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-ui-coord-text/30 border-t-ui-panel rounded-full animate-spin" />
              <span className="text-gray-200">Connecting to Google...</span>
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
              <span className="text-gray-200 group-hover:text-white transition-colors">Continue with Google</span>
            </>
          )}
        </div>
      </motion.button>

      {/* Security Notice */}
      <motion.div
        className="text-center mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        <p className="font-mono text-xs text-ui-coord-text leading-relaxed">
          By continuing, you agree to our secure authentication practices.
          We use industry-standard OAuth 2.0 with PKCE and encrypted password storage.
        </p>
      </motion.div>

      {/* Auth Mode Toggle */}
      <motion.div
        className="text-center mt-4 pt-3 border-t border-ui-coord-text/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.3 }}
      >
        <p className="font-mono text-sm text-ui-coord-text">
          {authMode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={toggleAuthMode}
            className="ml-2 text-ui-panel hover:text-ui-coord-text transition-colors duration-200 font-medium underline"
          >
            {authMode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>

      {/* OAuth Iframe - Render when OAuth is initiated */}
      <AnimatePresence>
        {modalOAuthState.showIframe && modalOAuthState.oauthUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <OAuthIframe
              oauthUrl={modalOAuthState.oauthUrl}
              onSuccess={iframeHandlers.onSuccess}
              onError={iframeHandlers.onError}
              onCancel={iframeHandlers.onCancel}
              isVisible={modalOAuthState.showIframe}
            />
          </motion.div>
        )}
        {/* End content wrapper moved below */}
      </AnimatePresence>
        </div>{/* End content wrapper */}
      </div>{/* End scrollable container */}
    </motion.div>
  );
};
