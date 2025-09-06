'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { validatePassword, DEFAULT_PASSWORD_REQUIREMENTS } from '@/utils/passwordValidation';
import PasswordRequirementsComponent from './PasswordRequirements';
import { useAuth } from '@/auth';

interface PasswordSetupComponentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export default function PasswordSetupComponent({ 
  onSuccess, 
  onCancel, 
  className = '' 
}: PasswordSetupComponentProps) {
  const { getAuthHeader } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordRequirements = DEFAULT_PASSWORD_REQUIREMENTS;
  const passwordValidation = validatePassword(password, passwordRequirements);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = passwordValidation.isValid && passwordsMatch && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      console.log('Password Setup Debug:', {
        authHeader: authHeader ? authHeader.substring(0, 50) + '...' : 'null',
        authHeaderLength: authHeader?.length,
        hasBearer: authHeader?.startsWith('Bearer ')
      });

      const response = await fetch('http://localhost:8000/api/users/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set up password');
      }

      setSuccess(true);
      
      // Brief success display before callback
      setTimeout(() => {
        onSuccess?.();
      }, 1500);

    } catch (err) {
      console.error('Password setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to set up password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        className={`${className}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-heading text-xl text-white mb-2">
            Password Set Successfully!
          </h3>
          <p className="text-green-400">
            Your account now has password authentication enabled.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h3 className="font-heading text-xl text-white mb-2">
          Set Up Password Authentication
        </h3>
        <p className="text-gray-400 text-sm">
          Add password authentication to your OAuth account for enhanced security and backup access.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Password Input */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-green-400">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-colors"
              placeholder="Enter your new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <PasswordRequirementsComponent
          validation={passwordValidation}
          requirements={passwordRequirements}
          password={password}
          className="mt-2"
        />

        {/* Confirm Password Input */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-green-400">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-colors"
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {/* Password Match Indicator */}
          <AnimatePresence>
            {confirmPassword.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`flex items-center space-x-2 text-sm mt-1 ${
                  passwordsMatch ? 'text-green-400' : 'text-red-400'
                }`}>
                  {passwordsMatch ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3 bg-red-900/50 border border-red-500/50 rounded-lg"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              canSubmit
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Setting Up...</span>
              </div>
            ) : (
              'Set Up Password'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
}