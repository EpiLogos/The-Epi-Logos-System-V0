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
// Simple type definition for business states
type EpiLogosBusinessState = 'png-displayed' | 'auth-signin' | 'auth-signup' | 'auth-oauth' | 'auth-success' | 'account-profile' | 'account-security' | 'account-billing';

interface AuthModalContentProps {
  businessState: 'auth-signin' | 'auth-signup' | 'auth-oauth' | 'auth-success';
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
  const { signIn, isLoading: isUnifiedAuthLoading } = useUnifiedAuth();
  
  // Modal OAuth integration
  const [modalOAuthState, modalOAuthActions] = useModalOAuth(
    () => {
      // OAuth success callback
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
          const tokens = {
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            idToken: result.data.idToken || '',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          };

          const { accessToken, refreshToken, idToken, ...userData } = result.data;

          await signIn({
            user: userData,
            tokens: tokens
          });
        }

        setAuthState('success');
        onStateChange('auth-success');
      } else {
        let errorMessage = result.message || 'Authentication failed';

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

  // Render different states
  if (businessState === 'auth-oauth') {
    return (
      <div className="auth-modal-container">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 border-4 border-ui-coord-text border-t-ui-panel rounded-full animate-spin"></div>
          </div>
          <div>
            <h3 className="text-xl font-heading text-ui-panel mb-2">
              Connecting with Google...
            </h3>
            <p className="text-ui-coord-text font-mono">
              You'll be redirected to Google for authentication.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (businessState === 'auth-success') {
    return (
      <div className="auth-modal-container">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-green-600/30 border border-green-400/50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-heading text-ui-panel mb-2">
              {authMode === 'signin' ? 'Welcome back!' : 'Account created successfully!'}
            </h3>
            <p className="text-ui-coord-text font-mono">
              Redirecting to your account...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-modal-container">
      {/* Mode Toggle */}
      <div className="flex mb-8 bg-ui-panel/10 border border-ui-coord-text/30 p-1">
        <button
          onClick={() => onStateChange('auth-signin')}
          className={cn(
            'flex-1 py-3 px-4 font-medium text-sm transition-all',
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
            'flex-1 py-3 px-4 font-medium text-sm transition-all',
            authMode === 'signup'
              ? 'bg-ui-coord-text text-ui-gray'
              : 'text-ui-panel hover:text-ui-coord-text'
          )}
        >
          Sign Up
        </button>
      </div>

      {/* Welcome Message */}
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl text-ui-panel mb-3">
          {authMode === 'signin' ? 'Welcome Back' : 'Join the System'}
        </h2>
        <p className="font-mono text-ui-coord-text text-sm leading-relaxed">
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
      <div className="space-y-4 mb-6">
        {/* Name fields for signup */}
        {authMode === 'signup' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-mono text-ui-panel text-sm font-medium">First Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="auth-form-input"
                  placeholder="John"
                  disabled={authState === 'loading'}
                />
                {!formData.firstName && (
                  <UserIcon className="absolute right-3 top-3.5 h-5 w-5 text-ui-coord-text" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-mono text-ui-panel text-sm font-medium">Last Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="auth-form-input"
                  placeholder="Doe"
                  disabled={authState === 'loading'}
                />
              </div>
            </div>
          </div>
        )}

        {/* Email field */}
        <div className="space-y-2">
          <label className="font-mono text-ui-panel text-sm font-medium">Email Address</label>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`auth-form-input ${!formData.email ? 'pl-12' : ''}`}
              placeholder="your@email.com"
              disabled={authState === 'loading'}
            />
            {!formData.email && (
              <EnvelopeIcon className="absolute left-3 top-3.5 h-5 w-5 text-ui-coord-text" />
            )}
          </div>
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <label className="font-mono text-ui-panel text-sm font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`auth-form-input pr-12 ${!formData.password ? 'pl-12' : ''}`}
              placeholder={authMode === 'signup' ? 'At least 8 characters' : 'Your password'}
              disabled={authState === 'loading'}
            />
            {!formData.password && (
              <LockClosedIcon className="absolute left-3 top-3.5 h-5 w-5 text-ui-coord-text" />
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
          <div className="space-y-2">
            <label className="font-mono text-ui-panel text-sm font-medium">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`auth-form-input pr-12 ${!formData.confirmPassword ? 'pl-12' : ''}`}
                placeholder="Confirm your password"
                disabled={authState === 'loading'}
              />
              {!formData.confirmPassword && (
                <LockClosedIcon className="absolute left-3 top-3.5 h-5 w-5 text-ui-coord-text" />
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
      </div>

      {/* Divider */}
      <div className="relative flex items-center my-6">
        <div className="flex-1 border-t border-ui-coord-text/30" />
        <span className="px-4 text-ui-coord-text text-sm font-medium">or</span>
        <div className="flex-1 border-t border-ui-coord-text/30" />
      </div>

      {/* OAuth Sign-In Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={modalOAuthState.isLoading || authState === 'loading'}
        className="w-full bg-ui-coord-text/10 hover:bg-ui-coord-text/20 text-ui-panel border border-ui-coord-text/30 hover:border-ui-panel/50 font-mono font-medium text-sm h-12 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center rounded-md"
      >
        <div className="flex items-center justify-center space-x-3">
          {modalOAuthState.isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-ui-coord-text/30 border-t-ui-panel rounded-full animate-spin" />
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
      </button>

      {/* Security Notice */}
      <div className="text-center mt-6">
        <p className="font-mono text-xs text-ui-coord-text leading-relaxed">
          By continuing, you agree to our secure authentication practices. 
          We use industry-standard OAuth 2.0 with PKCE and encrypted password storage.
        </p>
      </div>

      {/* Auth Mode Toggle */}
      <div className="text-center mt-6 pt-4 border-t border-ui-coord-text/20">
        <p className="font-mono text-sm text-ui-coord-text">
          {authMode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={toggleAuthMode}
            className="ml-2 text-ui-panel hover:text-ui-coord-text transition-colors font-medium underline"
          >
            {authMode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};