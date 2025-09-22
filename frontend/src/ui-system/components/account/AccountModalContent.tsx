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
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';

interface AccountModalContentProps {
  businessState: 'account-profile' | 'account-security' | 'account-billing';
  onStateChange: (state: EpiLogosBusinessState) => void;
}

export const AccountModalContent: React.FC<AccountModalContentProps> = ({ 
  businessState, 
  onStateChange 
}) => {
  const { user, isAuthenticated, hasPassword, hasMFA } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

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
            <p className="text-ui-coord-text font-sans">Redirecting to sign in...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderNavigation = () => (
    <div className="flex items-center justify-between mb-8 border-b border-ui-coord-text/30 pb-4">
      <div className="flex space-x-1">
        <button
          onClick={() => onStateChange('account-profile')}
          className={cn(
            'px-4 py-2 text-sm font-sans transition-all',
            businessState === 'account-profile'
              ? 'bg-ui-coord-text text-ui-gray'
              : 'text-ui-panel hover:text-ui-coord-text hover:bg-ui-coord-text/10'
          )}
        >
          Profile
        </button>
        <button
          onClick={() => onStateChange('account-security')}
          className={cn(
            'px-4 py-2 text-sm font-sans transition-all',
            businessState === 'account-security'
              ? 'bg-ui-coord-text text-ui-gray'
              : 'text-ui-panel hover:text-ui-coord-text hover:bg-ui-coord-text/10'
          )}
        >
          Security
        </button>
        <button
          onClick={() => onStateChange('account-billing')}
          className={cn(
            'px-4 py-2 text-sm font-sans transition-all',
            businessState === 'account-billing'
              ? 'bg-ui-coord-text text-ui-gray'
              : 'text-ui-panel hover:text-ui-coord-text hover:bg-ui-coord-text/10'
          )}
        >
          Billing
        </button>
      </div>
      <button
        onClick={() => onStateChange('png-displayed')}
        className="text-ui-coord-text hover:text-ui-panel transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5" />
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
      default:
        return <ProfileModalSection isEditing={isEditing} setIsEditing={setIsEditing} user={user} />;
    }
  };

  return (
    <div className="account-modal-container">
      {renderNavigation()}
      {renderContent()}
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
                <div className="flex items-center gap-3 text-ui-coord-text mt-1">
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
                    : 'bg-ui-panel/20 text-ui-coord-text border-ui-coord-text/30 hover:bg-ui-coord-text/20 hover:text-ui-panel hover:border-ui-coord-text/50'
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
                <span className="text-ui-coord-text font-sans block mb-1">Member since:</span>
                <p className="font-heading text-ui-panel">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'January 2024'}</p>
              </div>
              <div className="border border-ui-coord-text/30 p-3 bg-ui-panel/20">
                <span className="text-ui-coord-text font-sans block mb-1">Last active:</span>
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
          <p className="font-sans text-ui-coord-text text-sm mt-1">Manage your personal details and contact information</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-sans text-ui-coord-text text-sm">First Name</label>
              <input
                type="text"
                defaultValue={user?.firstName || 'John'}
                disabled={!isEditing}
                className="w-full border border-ui-coord-text/30 px-3 py-2 bg-ui-panel/20 font-sans text-ui-panel focus:outline-none focus:ring-2 focus:ring-ui-coord-text/50 focus:border-ui-coord-text/50 disabled:bg-ui-panel/10 disabled:text-ui-coord-text transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="font-sans text-ui-coord-text text-sm">Last Name</label>
              <input
                type="text"
                defaultValue={user?.lastName || 'Doe'}
                disabled={!isEditing}
                className="w-full border border-ui-coord-text/30 px-3 py-2 bg-ui-panel/20 font-sans text-ui-panel focus:outline-none focus:ring-2 focus:ring-ui-coord-text/50 focus:border-ui-coord-text/50 disabled:bg-ui-panel/10 disabled:text-ui-coord-text transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-sans text-ui-coord-text text-sm">Bio</label>
            <textarea
              placeholder="Tell us about yourself..."
              defaultValue="Exploring consciousness-aligned computing and personal growth."
              disabled={!isEditing}
              className="w-full min-h-[80px] border border-ui-coord-text/30 px-3 py-2 bg-ui-panel/20 font-sans text-ui-panel focus:outline-none focus:ring-2 focus:ring-ui-coord-text/50 focus:border-ui-coord-text/50 disabled:bg-ui-panel/10 disabled:text-ui-coord-text resize-none transition-all placeholder:text-ui-coord-text/50 text-sm"
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
        <p className="text-ui-coord-text font-sans text-sm">Manage your account security and privacy settings</p>
      </div>

      {/* Security Tab Navigation */}
      <div className="flex bg-ui-panel/20 border border-ui-coord-text/30 p-1">
        <button
          onClick={() => setActiveSecurityTab('overview')}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-sans transition-all',
            activeSecurityTab === 'overview'
              ? 'bg-ui-coord-text/30 text-ui-panel border border-ui-coord-text/50'
              : 'text-ui-coord-text hover:text-ui-panel hover:bg-ui-coord-text/20'
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
              : 'text-ui-coord-text hover:text-ui-panel hover:bg-ui-coord-text/20'
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
              : 'text-ui-coord-text hover:text-ui-panel hover:bg-ui-coord-text/20'
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
              <p className="font-sans text-ui-coord-text text-sm mb-4">
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
                <p className="font-sans text-ui-coord-text text-xs">
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
                <p className="font-sans text-ui-coord-text text-xs">
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
          <p className="text-ui-coord-text font-sans text-sm">Manage your subscription and billing information</p>
        </div>
        <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ui-coord-text"></div>
            <span className="ml-3 text-ui-coord-text font-sans">Loading billing information...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-heading text-ui-panel mb-2">Billing & Plans</h1>
        <p className="text-ui-coord-text font-sans text-sm">Manage your subscription and billing information</p>
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
            <p className="font-sans text-ui-coord-text text-sm mt-1">View your past invoices and payments</p>
          </div>
          <div className="p-6">
            <BillingHistory events={billingHistory} />
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-4">
        <div className="text-sm text-ui-coord-text font-sans">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheckIcon className="h-4 w-4" />
            <span className="font-medium">Secure Payment Processing</span>
          </div>
          <p className="text-ui-coord-text/80">
            All payments are processed securely through Stripe. We never store your payment information.
          </p>
        </div>
      </div>
    </div>
  );
}