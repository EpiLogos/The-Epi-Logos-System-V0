/**
 * Auth Status Components
 * Components for displaying authentication status and user information
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSession } from '../hooks/useSession';

/**
 * Auth Status Display Component
 * 
 * Shows current authentication status with user info.
 * 
 * @example
 * ```tsx
 * <AuthStatus 
 *   showUserInfo 
 *   showSessionInfo 
 *   className="p-4 border rounded"
 * />
 * ```
 */
export function AuthStatus({
  showUserInfo = true,
  showSessionInfo = false,
  showActions = true,
  className = ''
}: {
  showUserInfo?: boolean;
  showSessionInfo?: boolean;
  showActions?: boolean;
  className?: string;
}) {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    error,
    getUserDisplayName,
    getUserTier,
    hasPassword,
    isEmailVerified,
    signOut 
  } = useAuth();

  const { timeRemaining, shouldRefresh } = useSession();

  if (isLoading) {
    return (
      <div className={`auth-status loading ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`auth-status error ${className}`}>
        <div className="text-red-600">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`auth-status unauthenticated ${className}`}>
        <div className="text-gray-600">Not authenticated</div>
      </div>
    );
  }

  return (
    <div className={`auth-status authenticated ${className}`}>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-700 font-medium">Authenticated</span>
        </div>

        {showUserInfo && user && (
          <div className="space-y-1 text-sm">
            <div><strong>Name:</strong> {getUserDisplayName()}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Tier:</strong> {getUserTier()}</div>
            <div className="flex space-x-4">
              <span className={`${hasPassword() ? 'text-green-600' : 'text-orange-600'}`}>
                Password: {hasPassword() ? '✓' : '✗'}
              </span>
              <span className={`${isEmailVerified() ? 'text-green-600' : 'text-orange-600'}`}>
                Email: {isEmailVerified() ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>
        )}

        {showSessionInfo && (
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              <strong>Session:</strong> 
              {timeRemaining > 0 ? (
                <span className="ml-1">
                  Expires in {Math.floor(timeRemaining / 60000)} minutes
                  {shouldRefresh() && <span className="text-orange-600 ml-1">(refreshing soon)</span>}
                </span>
              ) : (
                <span className="text-red-600 ml-1">Expired</span>
              )}
            </div>
          </div>
        )}

        {showActions && (
          <div className="pt-2">
            <button
              onClick={signOut}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * User Avatar Component
 * 
 * Displays user avatar with fallback to initials.
 * 
 * @example
 * ```tsx
 * <UserAvatar size="lg" showName />
 * ```
 */
export function UserAvatar({
  size = 'md',
  showName = false,
  className = ''
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
}) {
  const { user, getUserDisplayName, hasProfilePicture } = useAuth();

  if (!user) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden`}>
        {hasProfilePicture() ? (
          <img
            src={user.profilePicture || user.picture}
            alt={getUserDisplayName()}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-medium">
            {getInitials(getUserDisplayName())}
          </div>
        )}
      </div>
      
      {showName && (
        <span className="text-gray-900 font-medium">
          {getUserDisplayName()}
        </span>
      )}
    </div>
  );
}

/**
 * Session Timer Component
 * 
 * Shows countdown until session expiration.
 * 
 * @example
 * ```tsx
 * <SessionTimer 
 *   showWarning 
 *   warningThreshold={300000} // 5 minutes
 * />
 * ```
 */
export function SessionTimer({
  showWarning = true,
  warningThreshold = 300000, // 5 minutes in milliseconds
  className = ''
}: {
  showWarning?: boolean;
  warningThreshold?: number;
  className?: string;
}) {
  const { timeRemaining, isValid, shouldRefresh } = useSession();

  if (!isValid || timeRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const isWarning = showWarning && timeRemaining <= warningThreshold;

  return (
    <div className={`session-timer ${className}`}>
      <div className={`text-sm ${isWarning ? 'text-orange-600' : 'text-gray-600'}`}>
        Session expires in: {minutes}:{seconds.toString().padStart(2, '0')}
        {shouldRefresh() && (
          <span className="ml-2 text-blue-600">(refreshing...)</span>
        )}
      </div>
    </div>
  );
}

/**
 * Auth Badge Component
 * 
 * Simple badge showing authentication status.
 * 
 * @example
 * ```tsx
 * <AuthBadge variant="dot" />
 * <AuthBadge variant="text" />
 * ```
 */
export function AuthBadge({
  variant = 'dot',
  className = ''
}: {
  variant?: 'dot' | 'text' | 'full';
  className?: string;
}) {
  const { isAuthenticated, isLoading, getUserTier } = useAuth();

  if (isLoading) {
    return (
      <div className={`auth-badge loading ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (variant === 'dot') {
    return (
      <div className={`auth-badge dot ${className}`}>
        <div className={`w-2 h-2 rounded-full ${
          isAuthenticated ? 'bg-green-500' : 'bg-gray-400'
        }`}></div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`auth-badge text ${className}`}>
        <span className={`text-xs font-medium ${
          isAuthenticated ? 'text-green-600' : 'text-gray-600'
        }`}>
          {isAuthenticated ? 'Online' : 'Offline'}
        </span>
      </div>
    );
  }

  return (
    <div className={`auth-badge full ${className}`}>
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
        isAuthenticated 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {isAuthenticated ? `${getUserTier()} User` : 'Guest'}
      </div>
    </div>
  );
}

/**
 * Profile Completion Prompt Component
 * 
 * Shows prompt for incomplete profiles.
 * 
 * @example
 * ```tsx
 * <ProfileCompletionPrompt 
 *   onComplete={() => router.push('/profile')}
 * />
 * ```
 */
export function ProfileCompletionPrompt({
  onComplete,
  onDismiss,
  className = ''
}: {
  onComplete?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  const { needsProfileCompletion, hasPassword, isEmailVerified } = useAuth();

  if (!needsProfileCompletion()) {
    return null;
  }

  const missingItems = [];
  if (!hasPassword()) missingItems.push('Set up password');
  if (!isEmailVerified()) missingItems.push('Verify email');

  return (
    <div className={`profile-completion-prompt bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">!</span>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900">
            Complete your profile
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            Please complete the following to secure your account:
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            {missingItems.map((item, index) => (
              <li key={index} className="flex items-center space-x-2">
                <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          
          <div className="flex space-x-2 mt-3">
            {onComplete && (
              <button
                onClick={onComplete}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Complete Profile
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
