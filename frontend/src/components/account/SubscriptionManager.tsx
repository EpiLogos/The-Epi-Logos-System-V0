/**
 * SubscriptionManager Component
 * Manages subscription tiers, upgrades, and billing
 */

'use client';

import { useState } from 'react';

interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'patron';
  status: 'active' | 'inactive' | 'canceled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
}

interface SubscriptionManagerProps {
  subscription: Subscription | null;
  onUpgrade: () => Promise<void> | void;
  onManage: () => Promise<void> | void;
  onCancel: () => Promise<void> | void;
}

export default function SubscriptionManager({ 
  subscription, 
  onUpgrade, 
  onManage, 
  onCancel 
}: SubscriptionManagerProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      await onUpgrade();
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManage = async () => {
    setIsLoading(true);
    try {
      await onManage();
    } catch (error) {
      console.error('Failed to manage billing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    setIsLoading(true);
    try {
      await onCancel();
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  if (!subscription) {
    return (
      <section 
        role="region" 
        aria-label="Subscription Management"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Subscription
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No active subscription found
          </p>
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Get Started
          </button>
        </div>
      </section>
    );
  }

  const isFreeTier = subscription.tier === 'free';
  const isPatronTier = subscription.tier === 'patron';
  const isPendingCancellation = subscription.cancelAtPeriodEnd;

  return (
    <section 
      role="region" 
      aria-label="Subscription Management"
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Subscription Management
      </h2>

      {/* Current Tier Display */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {isFreeTier ? 'Free Tier' : 'Patron Tier'}
            </h3>
            {isFreeTier ? (
              <p className="text-gray-600 dark:text-gray-400">
                You are currently on the free tier
              </p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Thank you for supporting consciousness-aligned technology!
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              isFreeTier 
                ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {isFreeTier ? 'Free' : 'Patron'}
            </span>
          </div>
        </div>

        {/* Cancellation Warning */}
        {isPendingCancellation && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Subscription will cancel
                </h3>
                <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>Your subscription will cancel at the end of your current period.</p>
                  <p>You'll have access until {formatDate(subscription.currentPeriodEnd)}</p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={handleManage}
                    disabled={isLoading}
                    className="bg-yellow-600 text-white px-3 py-1 text-sm rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                  >
                    Reactivate Subscription
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Renewal Information */}
        {isPatronTier && !isPendingCancellation && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Renews on {formatDate(subscription.currentPeriodEnd)}</p>
          </div>
        )}
      </div>

      {/* Features Comparison */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {isFreeTier ? 'Current Features' : 'Your Benefits'}
        </h4>
        
        <div className="space-y-3">
          {isFreeTier ? (
            <>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">100 monthly queries</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">1 concurrent session</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">50MB storage</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">10,000 monthly queries</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">5 concurrent sessions</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">1GB storage</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Priority support</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isFreeTier ? (
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Upgrade to Patron'}
          </button>
        ) : (
          <>
            <button
              onClick={handleManage}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Manage Billing'}
            </button>
            {!isPendingCancellation && (
              <button
                onClick={() => setShowCancelDialog(true)}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancel Subscription
              </button>
            )}
          </>
        )}
      </div>

      {/* Consciousness-Aligned Messaging */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {isFreeTier ? (
            <div>
              <p className="font-medium mb-1">No dark patterns, no pressure</p>
              <p>Upgrade only when it truly serves your journey. Support consciousness-aligned computing when you're ready.</p>
            </div>
          ) : (
            <div>
              <p className="font-medium mb-1">Thank you for supporting</p>
              <p>Your patronage enables us to develop consciousness-aligned technology that serves human flourishing.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-labelledby="cancel-dialog-title"
            aria-describedby="cancel-dialog-description"
            className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6"
          >
            <h3 id="cancel-dialog-title" className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Are you sure you want to cancel?
            </h3>
            <p id="cancel-dialog-description" className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Your subscription will remain active until {formatDate(subscription.currentPeriodEnd)}, 
              after which you'll return to the free tier.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelConfirm}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Confirm Cancel'}
              </button>
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status announcements for screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {isLoading && 'Processing request'}
      </div>
    </section>
  );
}