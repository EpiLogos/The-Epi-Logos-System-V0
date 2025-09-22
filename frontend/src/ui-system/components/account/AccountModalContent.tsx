'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/auth';
import { cn } from '../../utils/cn';
import UserAvatar from '@/components/ui/UserAvatar';
import PasswordSetupComponent from '@/components/auth/PasswordSetupComponent';
import SubscriptionManager from '@/components/account/SubscriptionManager';
import BillingHistory from '@/components/account/BillingHistory';
import MfaSetupComponent from '@/components/security/MfaSetupComponent';
import PasswordResetComponent from '@/components/security/PasswordResetComponent';
import {
  UserIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  PencilIcon,
  CameraIcon,
  CheckIcon,
  EnvelopeIcon,
  KeyIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  ComputerDesktopIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { type EpiLogosBusinessState, type AccountBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';

interface AccountModalContentProps {
  businessState: AccountBusinessState;
  onStateChange: (state: EpiLogosBusinessState) => void;
}

export const AccountModalContent: React.FC<AccountModalContentProps> = ({ 
  businessState, 
  onStateChange 
}) => {
  const { user, isAuthenticated, hasPassword, hasMFA, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      onStateChange('auth-signin');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      onStateChange('auth-signin');
    }
  }, [isAuthenticated, onStateChange]);

  if (!isAuthenticated || !user) {
    return (
      <div className="account-modal-container">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 border-4 border-ui-coord-text border-t-ui-panel rounded-full animate-spin"></div>
          </div>
          <div>
            <p className="text-gray-300 font-sans">Redirecting to sign in...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderNavigation = () => (
    <div className="flex items-center justify-between mb-8 border-b border-ui-coord-text/30 pb-4">
      <div className="grid grid-cols-3 gap-1 flex-1 mr-4">
        <button
          onClick={() => onStateChange('account-profile')}
          className={cn(
            'px-3 py-2 text-xs font-sans transition-all flex items-center gap-2',
            businessState === 'account-profile'
              ? 'bg-ui-coord-text text-ui-gray'
              : 'text-ui-panel hover:text-white hover:bg-ui-coord-text/20'
          )}
        >
          <UserIcon className="h-4 w-4" />
          Profile
        </button>
        <button
          onClick={() => onStateChange('account-security')}
          className={cn(
            'px-3 py-2 text-xs font-sans transition-all flex items-center gap-2',
            businessState === 'account-security'
              ? 'bg-ui-coord-text text-ui-gray'
              : 'text-ui-panel hover:text-white hover:bg-ui-coord-text/20'
          )}
        >
          <ShieldCheckIcon className="h-4 w-4" />
          Security
        </button>
        <button
          onClick={() => onStateChange('account-billing')}
          className={cn(
            'px-3 py-2 text-xs font-sans transition-all flex items-center gap-2',
            businessState === 'account-billing'
              ? 'bg-ui-coord-text text-ui-gray'
              : 'text-ui-panel hover:text-white hover:bg-ui-coord-text/20'
          )}
        >
          <CreditCardIcon className="h-4 w-4" />
          Billing
        </button>
        <button
          onClick={() => onStateChange('account-notifications')}
          className={cn(
            'px-3 py-2 text-xs font-sans transition-all flex items-center gap-2',
            businessState === 'account-notifications'
              ? 'bg-ui-coord-text text-ui-gray'
              : 'text-ui-panel hover:text-white hover:bg-ui-coord-text/20'
          )}
        >
          <BellIcon className="h-4 w-4" />
          Notifications
        </button>
        <button
          onClick={() => onStateChange('account-sessions')}
          className={cn(
            'px-3 py-2 text-xs font-sans transition-all flex items-center gap-2',
            businessState === 'account-sessions'
              ? 'bg-ui-coord-text text-ui-gray'
              : 'text-ui-panel hover:text-white hover:bg-ui-coord-text/20'
          )}
        >
          <ComputerDesktopIcon className="h-4 w-4" />
          Sessions
        </button>
        <button
          onClick={() => onStateChange('account-preferences')}
          className={cn(
            'px-3 py-2 text-xs font-sans transition-all flex items-center gap-2',
            businessState === 'account-preferences'
              ? 'bg-ui-coord-text text-ui-gray'
              : 'text-ui-panel hover:text-white hover:bg-ui-coord-text/20'
          )}
        >
          <CogIcon className="h-4 w-4" />
          Preferences
        </button>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-red-600/20 transition-all text-xs font-sans"
      >
        <ArrowRightOnRectangleIcon className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );

  const renderContent = () => {
    switch (businessState) {
      case 'account-profile':
        return <ProfileModalSection isEditing={isEditing} setIsEditing={setIsEditing} user={user} />;
      case 'account-security':
        return <SecurityModalSection user={user} hasPassword={hasPassword()} hasMFA={hasMFA()} />;
      case 'account-billing':
        return <BillingModalSection />;
      case 'account-notifications':
        return <NotificationsModalSection user={user} />;
      case 'account-sessions':
        return <SessionsModalSection user={user} />;
      case 'account-preferences':
        return <PreferencesModalSection user={user} />;
      default:
        return <ProfileModalSection isEditing={isEditing} setIsEditing={setIsEditing} user={user} />;
    }
  };

  return (
    <div className="account-modal-container h-full flex flex-col">
      {renderNavigation()}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

// Profile Section adapted for modal
function ProfileModalSection({ isEditing, setIsEditing, user }: { isEditing: boolean; setIsEditing: (editing: boolean) => void; user: any }) {
  return (
    <div className="space-y-8">
      {/* Profile Header Card */}
      <div className="relative bg-ui-panel/10 border border-ui-coord-text/30 p-6">
        <div className="flex items-start gap-6">
          <div className="relative">
            <UserAvatar
              user={{
                firstName: user?.firstName,
                lastName: user?.lastName,
                name: user?.name,
                picture: user?.profilePicture,
                email: user?.email
              }}
              size="lg"
              className="h-24 w-24 border-2 border-ui-coord-text/50"
              showBorder={false}
            />
            {isEditing && (
              <button className="absolute -bottom-2 -right-2 h-8 w-8 bg-ui-coord-text/30 hover:bg-ui-coord-text/50 text-ui-panel border border-ui-coord-text/50 hover:border-ui-panel flex items-center justify-center transition-all group">
                <CameraIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={`${user?.firstName || ''} ${user?.lastName || ''}`}
                    className="text-xl font-heading mb-2 max-w-xs border border-ui-coord-text/30 px-3 py-2 bg-ui-panel/20 text-ui-panel focus:outline-none focus:ring-2 focus:ring-ui-coord-text/50 focus:border-ui-coord-text/50"
                  />
                ) : (
                  <h1 className="text-xl font-heading text-ui-panel">
                    {user?.firstName || 'User'} {user?.lastName || 'Account'}
                  </h1>
                )}
                <div className="flex items-center gap-3 text-gray-300 mt-1">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span className="font-sans text-sm">{user?.email || 'user@example.com'}</span>
                  <span className="ml-2 bg-green-600/30 text-green-300 px-2 py-1 border border-green-400/50 font-sans text-xs">
                    Verified
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className={cn(
                  'gap-2 font-sans border px-3 py-2 text-sm transition-all flex items-center',
                  isEditing
                    ? 'bg-ui-coord-text/30 text-ui-panel border-ui-coord-text/50 hover:bg-ui-coord-text/40'
                    : 'bg-ui-panel/20 text-gray-300 border-ui-coord-text/30 hover:bg-ui-coord-text/20 hover:text-ui-panel hover:border-ui-coord-text/50'
                )}
              >
                {isEditing ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Save
                  </>
                ) : (
                  <>
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="border border-ui-coord-text/30 p-3 bg-ui-panel/20">
                <span className="text-gray-300 font-sans block mb-1">Member since:</span>
                <p className="font-heading text-ui-panel">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'January 2024'}</p>
              </div>
              <div className="border border-ui-coord-text/30 p-3 bg-ui-panel/20">
                <span className="text-gray-300 font-sans block mb-1">Last active:</span>
                <p className="font-heading text-ui-panel">Recently</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="relative bg-ui-panel/10 border border-ui-coord-text/30">
        <div className="border-b border-ui-coord-text/30 p-4">
          <h3 className="flex items-center gap-3 text-lg font-heading text-ui-panel">
            <UserIcon className="h-5 w-5" />
            Personal Information
          </h3>
          <p className="font-sans text-gray-300 text-sm mt-1">Manage your personal details and contact information</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-sans text-gray-300 text-sm">First Name</label>
              <input
                type="text"
                defaultValue={user?.firstName || 'John'}
                disabled={!isEditing}
                className="w-full border border-ui-coord-text/30 px-3 py-2 bg-ui-panel/20 font-sans text-ui-panel focus:outline-none focus:ring-2 focus:ring-ui-coord-text/50 focus:border-ui-coord-text/50 disabled:bg-ui-panel/10 disabled:text-gray-300 transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="font-sans text-gray-300 text-sm">Last Name</label>
              <input
                type="text"
                defaultValue={user?.lastName || 'Doe'}
                disabled={!isEditing}
                className="w-full border border-ui-coord-text/30 px-3 py-2 bg-ui-panel/20 font-sans text-ui-panel focus:outline-none focus:ring-2 focus:ring-ui-coord-text/50 focus:border-ui-coord-text/50 disabled:bg-ui-panel/10 disabled:text-gray-300 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-sans text-gray-300 text-sm">Bio</label>
            <textarea
              placeholder="Tell us about yourself..."
              defaultValue="Exploring consciousness-aligned computing and personal growth."
              disabled={!isEditing}
              className="w-full min-h-[80px] border border-ui-coord-text/30 px-3 py-2 bg-ui-panel/20 font-sans text-ui-panel focus:outline-none focus:ring-2 focus:ring-ui-coord-text/50 focus:border-ui-coord-text/50 disabled:bg-ui-panel/10 disabled:text-gray-300 resize-none transition-all placeholder:text-gray-300/50 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Security section adapted for modal
function SecurityModalSection({ user, hasPassword: hasPasswordProp, hasMFA: hasMFAProp }: { user: any; hasPassword: boolean; hasMFA: boolean }) {
  const [activeSecurityTab, setActiveSecurityTab] = useState<'overview' | 'mfa' | 'password'>('overview');
  const [mfaEnabled, setMfaEnabled] = useState(hasMFAProp);
  const hasPassword = hasPasswordProp;
  const isOAuthUser = user?.oauthProviders?.length > 0 || user?.googleId;

  const handlePasswordSetupSuccess = () => {
    console.log('Password setup successful');
  };

  const handleMfaSetupSuccess = () => {
    setMfaEnabled(true);
    setActiveSecurityTab('overview');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-heading text-ui-panel mb-2">Security & Privacy</h1>
        <p className="text-gray-300 font-sans text-sm">Manage your account security and privacy settings</p>
      </div>

      {/* Security Tab Navigation */}
      <div className="flex bg-ui-panel/20 border border-ui-coord-text/30 p-1">
        <button
          onClick={() => setActiveSecurityTab('overview')}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-sans transition-all',
            activeSecurityTab === 'overview'
              ? 'bg-ui-coord-text/30 text-ui-panel border border-ui-coord-text/50'
              : 'text-gray-300 hover:text-ui-panel hover:bg-ui-coord-text/20'
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSecurityTab('mfa')}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-sans transition-all',
            activeSecurityTab === 'mfa'
              ? 'bg-ui-coord-text/30 text-ui-panel border border-ui-coord-text/50'
              : 'text-gray-300 hover:text-ui-panel hover:bg-ui-coord-text/20'
          )}
        >
          Two-Factor
        </button>
        <button
          onClick={() => setActiveSecurityTab('password')}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-sans transition-all',
            activeSecurityTab === 'password'
              ? 'bg-ui-coord-text/30 text-ui-panel border border-ui-coord-text/50'
              : 'text-gray-300 hover:text-ui-panel hover:bg-ui-coord-text/20'
          )}
        >
          Password
        </button>
      </div>

      {/* Security Content */}
      {activeSecurityTab === 'overview' && (
        <div className="space-y-4">
          {/* Password Setup for OAuth users */}
          {isOAuthUser && !hasPassword && (
            <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-4">
              <h3 className="flex items-center gap-3 text-lg font-heading text-ui-panel mb-2">
                <ShieldCheckIcon className="h-5 w-5" />
                Set Up Password Authentication
              </h3>
              <p className="font-sans text-gray-300 text-sm mb-4">
                Add password authentication for enhanced security options
              </p>
              <PasswordSetupComponent onSuccess={handlePasswordSetupSuccess} />
            </div>
          )}

          {/* Security Overview */}
          <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-ui-panel/20 border border-ui-coord-text/30">
              <div>
                <h4 className="font-sans text-ui-panel font-medium text-sm">Password Authentication</h4>
                <p className="font-sans text-gray-300 text-xs">
                  {hasPassword ? 'Password is active' : 'No password configured'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'px-2 py-1 text-xs font-sans',
                  hasPassword 
                    ? 'bg-green-600/30 text-green-300 border border-green-400/50'
                    : 'bg-yellow-600/30 text-yellow-300 border border-yellow-400/50'
                )}>
                  {hasPassword ? 'Active' : 'Not Set'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-ui-panel/20 border border-ui-coord-text/30">
              <div>
                <h4 className="font-sans text-ui-panel font-medium text-sm">Two-Factor Authentication</h4>
                <p className="font-sans text-gray-300 text-xs">
                  Enhanced security with authenticator app
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'px-2 py-1 text-xs font-sans',
                  mfaEnabled
                    ? 'bg-green-600/30 text-green-300 border border-green-400/50'
                    : 'bg-yellow-600/30 text-yellow-300 border border-yellow-400/50'
                )}>
                  {mfaEnabled ? 'Active' : 'Not Set'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSecurityTab === 'mfa' && (
        <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-4">
          <h3 className="flex items-center gap-3 text-lg font-heading text-ui-panel mb-2">
            <ShieldCheckIcon className="h-5 w-5" />
            Two-Factor Authentication
          </h3>
          {mfaEnabled ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 bg-green-600/30 border border-green-400/50 rounded-full flex items-center justify-center">
                  <CheckIcon className="h-6 w-6 text-green-300" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-heading text-ui-panel mb-2">
                  Two-Factor Authentication is Active
                </h3>
                <button
                  onClick={() => setMfaEnabled(false)}
                  className="px-4 py-2 bg-red-600/30 hover:bg-red-600/40 text-red-300 border border-red-400/50 hover:border-red-300 font-sans transition-all text-sm"
                >
                  Disable MFA
                </button>
              </div>
            </div>
          ) : (
            <MfaSetupComponent onSuccess={handleMfaSetupSuccess} />
          )}
        </div>
      )}

      {activeSecurityTab === 'password' && (
        <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-4">
          <h3 className="flex items-center gap-3 text-lg font-heading text-ui-panel mb-2">
            <KeyIcon className="h-5 w-5" />
            Password Management
          </h3>
          {hasPassword ? (
            <PasswordResetComponent mode="change" onSuccess={() => {}} />
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 bg-yellow-600/20 border border-yellow-500/30 rounded-full flex items-center justify-center">
                  <KeyIcon className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-heading text-yellow-300 mb-2">
                  No Password Set
                </h3>
                <p className="text-yellow-400/80 font-sans mb-4 text-sm">
                  Set up a password in the Overview tab first.
                </p>
                <button
                  onClick={() => setActiveSecurityTab('overview')}
                  className="px-4 py-2 bg-ui-coord-text/30 hover:bg-ui-coord-text/40 text-ui-panel border border-ui-coord-text/50 hover:border-ui-panel font-sans transition-all text-sm"
                >
                  Go to Password Setup
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Notifications section for account modal
function NotificationsModalSection({ user }: { user: any }) {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-heading text-ui-panel mb-2">Notification Preferences</h1>
        <p className="text-gray-300 font-sans text-sm">Manage how and when you receive notifications</p>
      </div>

      {/* Email Notifications */}
      <div className="bg-ui-panel/10 border border-ui-coord-text/30">
        <div className="border-b border-ui-coord-text/30 p-4">
          <h3 className="flex items-center gap-3 text-lg font-heading text-ui-panel">
            <EnvelopeIcon className="h-5 w-5" />
            Email Notifications
          </h3>
          <p className="font-sans text-gray-300 text-sm mt-1">Control which emails you receive</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-ui-panel/20 border border-ui-coord-text/30">
            <div>
              <h4 className="font-sans text-ui-panel font-medium text-sm">Account Notifications</h4>
              <p className="font-sans text-gray-300 text-xs">Security alerts, password changes, account updates</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-4 w-4 border-ui-coord-text/30 bg-ui-panel/20 text-gray-300"
              />
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-ui-panel/20 border border-ui-coord-text/30">
            <div>
              <h4 className="font-sans text-ui-panel font-medium text-sm">System Alerts</h4>
              <p className="font-sans text-gray-300 text-xs">System maintenance, outages, important updates</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={systemAlerts}
                onChange={(e) => setSystemAlerts(e.target.checked)}
                className="h-4 w-4 border-ui-coord-text/30 bg-ui-panel/20 text-gray-300"
              />
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-ui-panel/20 border border-ui-coord-text/30">
            <div>
              <h4 className="font-sans text-ui-panel font-medium text-sm">Marketing Communications</h4>
              <p className="font-sans text-gray-300 text-xs">Product updates, feature announcements, newsletters</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={marketingEmails}
                onChange={(e) => setMarketingEmails(e.target.checked)}
                className="h-4 w-4 border-ui-coord-text/30 bg-ui-panel/20 text-gray-300"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-ui-panel/10 border border-ui-coord-text/30">
        <div className="border-b border-ui-coord-text/30 p-4">
          <h3 className="flex items-center gap-3 text-lg font-heading text-ui-panel">
            <BellIcon className="h-5 w-5" />
            Push Notifications
          </h3>
          <p className="font-sans text-gray-300 text-sm mt-1">Browser and mobile push notifications</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-ui-panel/20 border border-ui-coord-text/30">
            <div>
              <h4 className="font-sans text-ui-panel font-medium text-sm">Browser Notifications</h4>
              <p className="font-sans text-gray-300 text-xs">Real-time notifications in your browser</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="h-4 w-4 border-ui-coord-text/30 bg-ui-panel/20 text-gray-300"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sessions section for account modal
function SessionsModalSection({ user }: { user: any }) {
  const [sessions, setSessions] = useState([
    {
      id: '1',
      device: 'Chrome on macOS',
      location: 'San Francisco, CA',
      lastActive: '2 minutes ago',
      current: true,
      ip: '192.168.1.100'
    },
    {
      id: '2', 
      device: 'Safari on iPhone',
      location: 'San Francisco, CA',
      lastActive: '1 hour ago',
      current: false,
      ip: '192.168.1.101'
    },
    {
      id: '3',
      device: 'Chrome on Windows',
      location: 'New York, NY',
      lastActive: '3 days ago',
      current: false,
      ip: '10.0.0.50'
    }
  ]);

  const handleTerminateSession = (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  const handleTerminateAllOther = () => {
    setSessions(sessions.filter(s => s.current));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-heading text-ui-panel mb-2">Active Sessions</h1>
        <p className="text-gray-300 font-sans text-sm">Manage your active login sessions across devices</p>
      </div>

      {/* Sessions List */}
      <div className="bg-ui-panel/10 border border-ui-coord-text/30">
        <div className="border-b border-ui-coord-text/30 p-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-3 text-lg font-heading text-ui-panel">
              <ComputerDesktopIcon className="h-5 w-5" />
              Login Sessions ({sessions.length})
            </h3>
            <p className="font-sans text-gray-300 text-sm mt-1">Active sessions where you're logged in</p>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={handleTerminateAllOther}
              className="px-4 py-2 bg-red-600/30 hover:bg-red-600/40 text-red-300 border border-red-400/50 hover:border-red-300 font-sans transition-all text-sm"
            >
              Terminate All Others
            </button>
          )}
        </div>
        <div className="divide-y divide-ui-coord-text/30">
          {sessions.map((session) => (
            <div key={session.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-ui-coord-text/30 border border-ui-coord-text/50 flex items-center justify-center">
                  <ComputerDesktopIcon className="h-5 w-5 text-ui-panel" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-sans text-ui-panel font-medium text-sm">{session.device}</h4>
                    {session.current && (
                      <span className="bg-green-600/30 text-green-300 px-2 py-1 border border-green-400/50 font-sans text-xs">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-gray-300 text-xs">
                    {session.location} • Last active {session.lastActive}
                  </p>
                  <p className="font-sans text-gray-300/60 text-xs">IP: {session.ip}</p>
                </div>
              </div>
              {!session.current && (
                <button
                  onClick={() => handleTerminateSession(session.id)}
                  className="px-3 py-1 bg-red-600/30 hover:bg-red-600/40 text-red-300 border border-red-400/50 hover:border-red-300 font-sans transition-all text-xs"
                >
                  Terminate
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-4">
        <div className="text-sm text-gray-300 font-sans">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheckIcon className="h-4 w-4" />
            <span className="font-medium">Security Notice</span>
          </div>
          <p className="text-gray-300/80">
            If you see any sessions you don't recognize, terminate them immediately and change your password.
            Consider enabling two-factor authentication for enhanced security.
          </p>
        </div>
      </div>
    </div>
  );
}

// Preferences section for account modal
function PreferencesModalSection({ user }: { user: any }) {
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [dataExportRequested, setDataExportRequested] = useState(false);

  const handleExportData = () => {
    setDataExportRequested(true);
    // In real implementation, trigger data export
    setTimeout(() => {
      setDataExportRequested(false);
      alert('Data export initiated. You will receive an email when ready.');
    }, 2000);
  };

  const handleDeleteAccount = () => {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmed) {
      alert('Account deletion initiated. You will receive confirmation via email.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-heading text-ui-panel mb-2">Account Preferences</h1>
        <p className="text-gray-300 font-sans text-sm">Customize your account settings and preferences</p>
      </div>

      {/* General Preferences */}
      <div className="bg-ui-panel/10 border border-ui-coord-text/30">
        <div className="border-b border-ui-coord-text/30 p-4">
          <h3 className="flex items-center gap-3 text-lg font-heading text-ui-panel">
            <CogIcon className="h-5 w-5" />
            General Settings
          </h3>
          <p className="font-sans text-gray-300 text-sm mt-1">Basic account preferences</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-sans text-gray-300 text-sm">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full border border-ui-coord-text/30 px-3 py-2 bg-ui-panel/20 font-sans text-ui-panel focus:outline-none focus:ring-2 focus:ring-ui-coord-text/50 focus:border-ui-coord-text/50 text-sm"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-sans text-gray-300 text-sm">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border border-ui-coord-text/30 px-3 py-2 bg-ui-panel/20 font-sans text-ui-panel focus:outline-none focus:ring-2 focus:ring-ui-coord-text/50 focus:border-ui-coord-text/50 text-sm"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-sans text-gray-300 text-sm">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full border border-ui-coord-text/30 px-3 py-2 bg-ui-panel/20 font-sans text-ui-panel focus:outline-none focus:ring-2 focus:ring-ui-coord-text/50 focus:border-ui-coord-text/50 text-sm"
            >
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="Europe/London">GMT</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-ui-panel/10 border border-ui-coord-text/30">
        <div className="border-b border-ui-coord-text/30 p-4">
          <h3 className="flex items-center gap-3 text-lg font-heading text-ui-panel">
            <ShieldCheckIcon className="h-5 w-5" />
            Data & Privacy
          </h3>
          <p className="font-sans text-gray-300 text-sm mt-1">Manage your data and privacy settings</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-ui-panel/20 border border-ui-coord-text/30">
            <div>
              <h4 className="font-sans text-ui-panel font-medium text-sm">Export Your Data</h4>
              <p className="font-sans text-gray-300 text-xs">Download a copy of all your account data</p>
            </div>
            <button
              onClick={handleExportData}
              disabled={dataExportRequested}
              className={cn(
                'px-4 py-2 font-sans transition-all text-sm',
                dataExportRequested
                  ? 'bg-ui-coord-text/20 text-gray-300/60 border border-ui-coord-text/30 cursor-not-allowed'
                  : 'bg-ui-coord-text/30 hover:bg-ui-coord-text/40 text-ui-panel border border-ui-coord-text/50 hover:border-ui-panel'
              )}
            >
              {dataExportRequested ? 'Processing...' : 'Export Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/20 border border-red-500/30">
        <div className="border-b border-red-500/30 p-4">
          <h3 className="flex items-center gap-3 text-lg font-heading text-red-300">
            <ShieldCheckIcon className="h-5 w-5" />
            Danger Zone
          </h3>
          <p className="font-sans text-red-400/80 text-sm mt-1">Irreversible account actions</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between p-3 bg-red-900/20 border border-red-500/30">
            <div>
              <h4 className="font-sans text-red-300 font-medium text-sm">Delete Account</h4>
              <p className="font-sans text-red-400/80 text-xs">Permanently delete your account and all data</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-600/30 hover:bg-red-600/40 text-red-300 border border-red-400/50 hover:border-red-300 font-sans transition-all text-sm"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Billing section adapted for modal
function BillingModalSection() {
  const { getAuthHeader, isSessionValid } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadBillingService() {
      try {
        const { billingService } = await import('@/services/billing-service');
        
        billingService.setAuthContext({ getAuthHeader, isSessionValid });
        
        const subData = await billingService.getSubscription();
        if (subData) {
          setSubscription(subData);
        }

        const historyData = await billingService.getBillingHistory();
        setBillingHistory(historyData.events || []);
        
      } catch (err) {
        console.error('Failed to load billing data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadBillingService();
  }, [getAuthHeader, isSessionValid]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-heading text-ui-panel mb-2">Billing & Plans</h1>
          <p className="text-gray-300 font-sans text-sm">Manage your subscription and billing information</p>
        </div>
        <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ui-coord-text"></div>
            <span className="ml-3 text-gray-300 font-sans">Loading billing information...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-heading text-ui-panel mb-2">Billing & Plans</h1>
        <p className="text-gray-300 font-sans text-sm">Manage your subscription and billing information</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 p-4">
          <div className="text-red-400 font-sans text-sm">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Subscription Management */}
      <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-6">
        <SubscriptionManager
          subscription={subscription}
          onUpgrade={() => {}}
          onManage={() => {}}
          onCancel={() => {}}
        />
      </div>

      {/* Billing History */}
      {billingHistory.length > 0 && (
        <div className="bg-ui-panel/10 border border-ui-coord-text/30">
          <div className="border-b border-ui-coord-text/30 p-4">
            <h3 className="flex items-center gap-3 text-lg font-heading text-ui-panel">
              <CreditCardIcon className="h-5 w-5" />
              Billing History
            </h3>
            <p className="font-sans text-gray-300 text-sm mt-1">View your past invoices and payments</p>
          </div>
          <div className="p-6">
            <BillingHistory events={billingHistory} />
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-4">
        <div className="text-sm text-gray-300 font-sans">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheckIcon className="h-4 w-4" />
            <span className="font-medium">Secure Payment Processing</span>
          </div>
          <p className="text-gray-300/80">
            All payments are processed securely through Stripe. We never store your payment information.
          </p>
        </div>
      </div>
    </div>
  );
}