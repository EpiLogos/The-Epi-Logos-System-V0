/**
 * SessionManager Component
 * Manages active user sessions with security monitoring
 */

'use client';

import { useState, useEffect } from 'react';

interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  location: string;
}

interface Session {
  id: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  lastActivity: Date;
  createdAt: Date;
  isCurrent: boolean;
  userAgent: string;
  securityFlags?: {
    suspicious?: boolean;
    newLocation?: boolean;
    reason?: string;
  };
}

interface SessionManagerProps {
  sessions: Session[];
  onTerminateSession: (sessionId: string) => Promise<void> | void;
  onTerminateAllSessions: () => Promise<void> | void;
  onRefresh: () => Promise<void> | void;
  currentSessionId: string;
}

export default function SessionManager({ 
  sessions, 
  onTerminateSession, 
  onTerminateAllSessions, 
  onRefresh,
  currentSessionId 
}: SessionManagerProps) {
  const [showTerminateDialog, setShowTerminateDialog] = useState<string | null>(null);
  const [showTerminateAllDialog, setShowTerminateAllDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh();
      setLastUpdated(new Date());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [onRefresh]);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTerminateSession = async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onTerminateSession(sessionId);
      setShowTerminateDialog(null);
    } catch (err) {
      setError('Failed to terminate session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminateAllSessions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onTerminateAllSessions();
      setShowTerminateAllDialog(false);
    } catch (err) {
      setError('Failed to terminate all sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onRefresh();
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to refresh sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const maskIpAddress = (ip: string) => {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    return ip.substring(0, ip.length - 3) + 'xxx';
  };

  const nonCurrentSessions = sessions.filter(session => !session.isCurrent);

  if (sessions.length === 0) {
    return (
      <section 
        role="region" 
        aria-label="Session Manager"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Active Sessions
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            No active sessions found. Sign in to create a session.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section 
      role="region" 
      aria-label="Session Manager"
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Active Sessions
        </h2>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {formatRelativeTime(lastUpdated)}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            aria-label="Refresh sessions"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="mb-4 text-center">
          <div role="status" aria-live="polite" className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Refreshing sessions...
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div 
        role="list" 
        aria-label="Active Sessions"
        className={`space-y-4 ${isMobile ? 'mobile-session-layout' : ''}`}
        data-testid={isMobile ? 'mobile-session-layout' : 'desktop-session-layout'}
      >
        {sessions.map((session) => (
          <div
            key={session.id}
            role="listitem"
            data-testid="session-card"
            data-current={session.isCurrent}
            className={`p-4 border rounded-lg ${
              session.isCurrent
                ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
            } ${isMobile ? 'mobile-stack' : ''}`}
            aria-current={session.isCurrent ? 'true' : 'false'}
          >
            {/* Security Warning */}
            {session.securityFlags?.suspicious && (
              <div role="alert" aria-live="assertive" className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <span className="font-medium text-red-800 dark:text-red-200">Security Warning</span>
                    <p className="text-sm text-red-700 dark:text-red-300">{session.securityFlags.reason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* New Location Badge */}
            {session.securityFlags?.newLocation && (
              <div className="mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  New Location
                </span>
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {session.deviceInfo.device}
                  </h3>
                  {session.isCurrent && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Current Session
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <span className="font-medium">{session.deviceInfo.browser}</span> on{' '}
                    <span className="font-medium">{session.deviceInfo.os}</span>
                  </p>
                  <p>{session.deviceInfo.location}</p>
                  <p>IP: {maskIpAddress(session.ipAddress)}</p>
                  <p>Last active: {formatDate(session.lastActivity)}</p>
                </div>
              </div>

              <div className="ml-4">
                {!session.isCurrent && (
                  <button
                    onClick={() => setShowTerminateDialog(session.id)}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                    aria-label={`Terminate session on ${session.deviceInfo.device}`}
                    aria-describedby={`session-${session.id}-description`}
                  >
                    Terminate Session
                  </button>
                )}
              </div>
            </div>

            <div id={`session-${session.id}-description`} className="sr-only">
              Session on {session.deviceInfo.device} using {session.deviceInfo.browser} from {session.deviceInfo.location}
            </div>
          </div>
        ))}
      </div>

      {/* Terminate All Sessions Button */}
      {nonCurrentSessions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowTerminateAllDialog(true)}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Terminate All Other Sessions
          </button>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            This will sign you out of all devices except this one
          </p>
        </div>
      )}

      {/* Consciousness-Aligned Messaging */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium mb-1">Sacred Boundary & Mindful Digital Presence</p>
          <p>Monitor your sessions mindfully. Our consciousness-aligned security approach protects your digital presence while maintaining transparency.</p>
        </div>
      </div>

      {/* Terminate Session Confirmation Dialog */}
      {showTerminateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-labelledby="terminate-dialog-title"
            aria-describedby="terminate-dialog-description"
            className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6"
          >
            <h3 id="terminate-dialog-title" className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Terminate this session?
            </h3>
            <p id="terminate-dialog-description" className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This will immediately sign out the selected device. The user will need to sign in again.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleTerminateSession(showTerminateDialog)}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                autoFocus
              >
                {isLoading ? 'Terminating Session...' : 'Confirm Terminate'}
              </button>
              <button
                onClick={() => setShowTerminateDialog(null)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate All Sessions Confirmation Dialog */}
      {showTerminateAllDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-labelledby="terminate-all-dialog-title"
            aria-describedby="terminate-all-dialog-description"
            className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6"
          >
            <h3 id="terminate-all-dialog-title" className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Terminate all other sessions?
            </h3>
            <p id="terminate-all-dialog-description" className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This will sign you out of all devices except the current one. You&apos;ll remain signed in on this device.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleTerminateAllSessions}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                autoFocus
              >
                {isLoading ? 'Terminating...' : 'Confirm Terminate All'}
              </button>
              <button
                onClick={() => setShowTerminateAllDialog(false)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status announcements for screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {isLoading && 'Processing session management request'}
        {error && `Error: ${error}`}
        {showTerminateDialog && 'Session termination dialog opened'}
        {showTerminateAllDialog && 'Terminate all sessions dialog opened'}
      </div>
    </section>
  );
}