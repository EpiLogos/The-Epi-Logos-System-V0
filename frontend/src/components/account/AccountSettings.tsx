/**
 * AccountSettings Component
 * Manages user preferences, security settings, and account data
 */

'use client';

import { useState } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
    emailFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
    autoBackup: boolean;
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    privacyLevel: 'minimal' | 'standard' | 'strict';
  };
}

interface AccountSettingsProps {
  user: User;
  onSave: (data: { preferences: Partial<User['preferences']> }) => Promise<void> | void;
  onDeleteAccount: () => Promise<void> | void;
  onExportData: () => Promise<void> | void;
  onToggle2FA: (enabled: boolean) => Promise<void> | void;
}

export default function AccountSettings({ 
  user, 
  onSave, 
  onDeleteAccount, 
  onExportData, 
  onToggle2FA 
}: AccountSettingsProps) {
  const [preferences, setPreferences] = useState(user.preferences);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const handlePreferenceChange = <K extends keyof User['preferences']>(
    key: K,
    value: User['preferences'][K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    // Clear any existing errors
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (preferences.sessionTimeout < 5) {
      newErrors.sessionTimeout = 'Session timeout must be at least 5 minutes';
    } else if (preferences.sessionTimeout > 1440) {
      newErrors.sessionTimeout = 'Session timeout cannot exceed 24 hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setSuccessMessage('');
    
    try {
      await onSave({ preferences });
      setSuccessMessage('Preferences saved successfully');
    } catch (error) {
      setErrors({ general: 'Failed to save preferences. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    setIsLoading(true);
    try {
      await onToggle2FA(!preferences.twoFactorEnabled);
      setPreferences(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
    } catch (error) {
      setErrors({ general: 'Failed to update 2FA settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      await onExportData();
    } catch (error) {
      setErrors({ general: 'Failed to export data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await onDeleteAccount();
      setShowDeleteDialog(false);
    } catch (error) {
      setErrors({ general: 'Failed to delete account' });
    } finally {
      setIsLoading(false);
    }
  };

  // Mobile viewport detection
  const [isMobile, setIsMobile] = useState(false);
  
  useState(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });

  return (
    <section 
      role="region" 
      aria-label="Account Settings"
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
        isMobile ? 'mobile-settings-layout' : ''
      }`}
      data-testid={isMobile ? 'mobile-settings-layout' : 'desktop-settings-layout'}
    >
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Account Settings
      </h2>

      {/* Success Message */}
      {successMessage && (
        <div role="status" aria-live="polite" className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {errors.general && (
        <div role="alert" className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-800 dark:text-red-200">{errors.general}</p>
          <button
            onClick={handleSave}
            className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Preferences Section */}
      <div className="space-y-8">
        <fieldset role="group" aria-labelledby="preferences-heading">
          <legend id="preferences-heading" className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Preferences
          </legend>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme */}
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Theme
              </label>
              <select
                id="theme"
                value={preferences.theme}
                onChange={(e) => handlePreferenceChange('theme', e.target.value as 'light' | 'dark')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Language
              </label>
              <select
                id="language"
                value={preferences.language}
                onChange={(e) => handlePreferenceChange('language', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            {/* Email Frequency */}
            <div>
              <label htmlFor="emailFrequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Frequency
              </label>
              <select
                id="emailFrequency"
                value={preferences.emailFrequency}
                onChange={(e) => handlePreferenceChange('emailFrequency', e.target.value as any)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>

          {/* Notifications Toggle */}
          <div className="mt-6 flex items-center">
            <input
              type="checkbox"
              id="notifications"
              checked={preferences.notifications}
              onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="notifications" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Notifications
            </label>
          </div>
        </fieldset>

        {/* Security Settings */}
        <fieldset role="group" aria-labelledby="security-heading">
          <legend id="security-heading" className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Security Settings
          </legend>

          <div className="space-y-6">
            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-300">
                  Two-Factor Authentication
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {preferences.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <button
                onClick={handleToggle2FA}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                  preferences.twoFactorEnabled
                    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                {preferences.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>

            {/* Session Timeout */}
            <div>
              <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                id="sessionTimeout"
                min="5"
                max="1440"
                value={preferences.sessionTimeout}
                onChange={(e) => handlePreferenceChange('sessionTimeout', parseInt(e.target.value) || 30)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                aria-describedby="sessionTimeout-help"
                aria-invalid={!!errors.sessionTimeout}
              />
              <p id="sessionTimeout-help" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Automatically sign out after this many minutes of inactivity
              </p>
              {errors.sessionTimeout && (
                <div role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.sessionTimeout}
                </div>
              )}
            </div>

            {/* Privacy Level */}
            <div>
              <label htmlFor="privacyLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Privacy Level
              </label>
              <select
                id="privacyLevel"
                value={preferences.privacyLevel}
                onChange={(e) => handlePreferenceChange('privacyLevel', e.target.value as any)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="minimal">Minimal</option>
                <option value="standard">Standard</option>
                <option value="strict">Strict</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Privacy Settings */}
        <fieldset role="group" aria-labelledby="privacy-heading">
          <legend id="privacy-heading" className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Privacy Settings
          </legend>

          <div className="space-y-4">
            {/* Auto Backup */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoBackup"
                checked={preferences.autoBackup}
                onChange={(e) => handlePreferenceChange('autoBackup', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoBackup" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Auto Backup
              </label>
            </div>
          </div>
        </fieldset>

        {/* Data Management */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Data Management
          </h3>

          <div className="space-y-3">
            <button
              onClick={handleExportData}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Preparing Export...' : 'Export Data'}
            </button>

            <button
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading}
              className="ml-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Saving Preferences...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Consciousness-Aligned Messaging */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium mb-1">Consciousness-aligned technology</p>
          <p>These settings protect your privacy and digital wellbeing. Our Sacred Boundary approach ensures your inner digital space remains yours.</p>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            role="alertdialog"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6"
          >
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 id="delete-dialog-title" className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Permanently delete your account?
              </h3>
              <p id="delete-dialog-description" className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This action cannot be undone. All your data will be permanently deleted from our servers.
              </p>
            </div>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Collapsible Sections */}
      {isMobile && (
        <>
          <button
            role="button"
            aria-label="Toggle section"
            className="w-full text-left p-2 bg-gray-100 dark:bg-gray-700 rounded mt-4"
          >
            Preferences
          </button>
          <button
            role="button"
            aria-label="Toggle section"
            className="w-full text-left p-2 bg-gray-100 dark:bg-gray-700 rounded mt-2"
          >
            Security
          </button>
          <button
            role="button"
            aria-label="Toggle section"
            className="w-full text-left p-2 bg-gray-100 dark:bg-gray-700 rounded mt-2"
          >
            Privacy
          </button>
        </>
      )}

      {/* Status for screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {isLoading && 'Processing request'}
        {successMessage && successMessage}
        {errors.general && `Error: ${errors.general}`}
      </div>
    </section>
  );
}