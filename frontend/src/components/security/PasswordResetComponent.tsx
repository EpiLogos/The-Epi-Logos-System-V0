'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/auth';
import { 
  LockClosedIcon, 
  KeyIcon, 
  CheckIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import PasswordRequirementsComponent from '@/components/auth/PasswordRequirements';
import { validatePassword, DEFAULT_PASSWORD_REQUIREMENTS } from '@/utils/passwordValidation';

interface PasswordResetComponentProps {
  mode: 'request' | 'change';
  onSuccess?: () => void;
}

export default function PasswordResetComponent({ mode, onSuccess }: PasswordResetComponentProps) {
  const { getAuthHeader } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Password request form
  const [email, setEmail] = useState('');
  
  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation
  const passwordValidation = useMemo(() => {
    return validatePassword(newPassword, DEFAULT_PASSWORD_REQUIREMENTS);
  }, [newPassword]);

  const handlePasswordRequest = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/security/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Password reset request failed');
      }

      const result = await response.json();
      if (result.success) {
        setSuccess(result.message);
        setEmail('');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(result.message || 'Password reset request failed');
      }
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(err instanceof Error ? err.message : 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (!passwordValidation.isValid) {
      setError('New password does not meet requirements');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const authHeader = await getAuthHeader();
      const response = await fetch('/api/security/password-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Password change failed');
      }

      const result = await response.json();
      if (result.success) {
        setSuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(result.message || 'Password change failed');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'request') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-600/20 border border-green-500/30 rounded-full flex items-center justify-center">
              <EnvelopeIcon className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h3 className="text-xl font-heading text-green-300 mb-2">
            Reset Your Password
          </h3>
          <p className="text-green-400/80 font-sans">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 p-6 bg-green-900/20 border border-green-400/30">
            <CheckIcon className="h-12 w-12 text-green-300 mx-auto" />
            <div className="space-y-2">
              <h4 className="font-heading text-green-300">Email Sent!</h4>
              <p className="text-green-400/80 font-sans text-sm">{success}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-green-400 font-sans text-sm mb-2">
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-green-500/30 px-4 py-3 bg-black/20 text-green-300 font-sans focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 backdrop-blur-sm"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 font-sans text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handlePasswordRequest}
              disabled={isLoading || !email}
              className="w-full py-3 px-4 bg-green-600/30 hover:bg-green-600/40 text-green-300 border border-green-400/50 hover:border-green-300 font-sans transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'change') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-600/20 border border-green-500/30 rounded-full flex items-center justify-center">
              <LockClosedIcon className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h3 className="text-xl font-heading text-green-300 mb-2">
            Change Password
          </h3>
          <p className="text-green-400/80 font-sans">
            Update your password to keep your account secure.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 p-6 bg-green-900/20 border border-green-400/30">
            <CheckIcon className="h-12 w-12 text-green-300 mx-auto" />
            <div className="space-y-2">
              <h4 className="font-heading text-green-300">Password Updated!</h4>
              <p className="text-green-400/80 font-sans text-sm">{success}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label htmlFor="current-password" className="block text-green-400 font-sans text-sm mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full border border-green-500/30 px-4 py-3 pr-12 bg-black/20 text-green-300 font-sans focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-green-300"
                >
                  {showCurrentPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new-password" className="block text-green-400 font-sans text-sm mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full border border-green-500/30 px-4 py-3 pr-12 bg-black/20 text-green-300 font-sans focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-green-300"
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <PasswordRequirementsComponent
                validation={passwordValidation}
                requirements={DEFAULT_PASSWORD_REQUIREMENTS}
                password={newPassword}
                className="mt-2"
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirm-password" className="block text-green-400 font-sans text-sm mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full border border-green-500/30 px-4 py-3 pr-12 bg-black/20 text-green-300 font-sans focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-green-300"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 font-sans text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handlePasswordChange}
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || !passwordValidation.isValid || newPassword !== confirmPassword}
              className="w-full py-3 px-4 bg-green-600/30 hover:bg-green-600/40 text-green-300 border border-green-400/50 hover:border-green-300 font-sans transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}