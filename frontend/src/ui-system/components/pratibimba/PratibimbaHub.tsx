/**
 * PratibimbaHub Component
 * Primary view in dashboard panel - Personal Pratibimba visualization
 * Account/Settings views are nested within this component
 */

'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/auth';
import { usePratibimba } from '@/hooks/usePratibimba';
import { pratibimbaSync } from '@/services/pratibimba-sync.service';
import { cn } from '../../utils/cn';
import {
  UserIcon,
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  BeakerIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';
import { type EpiLogosBusinessState, type AccountBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';

// Import Account modal content for nesting
import { AccountModalContent } from '../account/AccountModalContent';

interface PratibimbaHubProps {
  businessState: EpiLogosBusinessState;
  onStateChange: (state: EpiLogosBusinessState) => void;
}

// Client-side only component (uses IndexedDB)
const PratibimbaHubContent: React.FC<PratibimbaHubProps> = ({
  businessState,
  onStateChange
}) => {
  const { user, isAuthenticated, getAuthHeader } = useAuth();
  const { pratibimba, loading, initializePratibimba, exportData } = usePratibimba(user?.id || '');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [showAccount, setShowAccount] = useState(false);

  // Initialize Pratibimba on first load (eagerly, don't wait for loading to be false)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Always try to initialize - it will check if already exists
      initializePratibimba();
    }
  }, [isAuthenticated, user?.id, initializePratibimba]);

  // Start background sync on mount
  useEffect(() => {
    if (isAuthenticated && user?.id && pratibimba) {
      const authToken = getAuthHeader()?.replace('Bearer ', '') || '';

      // Initial sync to cloud
      pratibimbaSync.syncToCloud(user.id, authToken)
        .then(() => {
          setSyncStatus('synced');
          // Start background sync
          pratibimbaSync.startBackgroundSync(user.id, authToken);
        })
        .catch((error) => {
          console.error('Initial sync failed:', error);
          setSyncStatus('idle');
        });

      // Cleanup: stop sync on unmount
      return () => {
        pratibimbaSync.stopBackgroundSync();
      };
    }
  }, [isAuthenticated, user?.id, pratibimba, getAuthHeader]);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      onStateChange('auth-signin');
    }
  }, [isAuthenticated, onStateChange]);

  const handleExportPratibimba = async () => {
    try {
      const blob = await exportData('json');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pratibimba-${user?.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export Pratibimba:', error);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="pratibimba-hub-container h-full flex items-center justify-center">
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

  if (loading) {
    return (
      <div className="pratibimba-hub-container h-full flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <SparklesIcon className="h-16 w-16 text-ui-coord-text animate-pulse" />
          </div>
          <div>
            <p className="text-gray-300 font-sans">Loading your Personal Pratibimba...</p>
          </div>
        </div>
      </div>
    );
  }

  // If account view is active, show nested account content
  if (showAccount || (businessState as string).startsWith('account-')) {
    return (
      <AccountModalContent
        businessState={businessState as AccountBusinessState}
        onStateChange={(state) => {
          if (state === 'dashboard') {
            setShowAccount(false);
            onStateChange('pratibimba');
          } else {
            onStateChange(state);
          }
        }}
      />
    );
  }

  return (
    <div className="pratibimba-hub-container h-full flex flex-col pt-6 pb-1 px-4">
      {/* Header with back button */}
      <div className="pratibimba-header mb-4">
        <button
          onClick={() => onStateChange('dashboard')}
          className="flex items-center text-ui-coord-text hover:text-ui-panel transition-colors font-mono text-sm mb-2"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
      </div>

      {/* Pratibimba Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading text-ui-panel mb-2 flex items-center gap-3">
          <SparklesIcon className="h-7 w-7 text-ui-coord-text" />
          Your Personal Pratibimba
        </h1>
        <p className="text-gray-300 font-sans text-sm">
          Your phenomenological hub - where lived experience meets archetypal patterns
        </p>
      </div>

      {/* Sync Status Indicator */}
      <div className="mb-4 flex items-center justify-between border-b border-ui-coord-text/30 pb-3">
        <div className="flex items-center gap-2 text-sm">
          <CloudArrowDownIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-400 font-sans">
            {syncStatus === 'syncing' && 'Syncing to cloud...'}
            {syncStatus === 'synced' && 'Synced with cloud session'}
            {syncStatus === 'idle' && 'Local storage only'}
          </span>
          {syncStatus === 'synced' && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          )}
        </div>
        <button
          onClick={handleExportPratibimba}
          className="text-xs text-ui-coord-text hover:text-ui-panel transition-colors font-sans"
        >
          Export Data
        </button>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Archetypal State Card */}
        <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-6">
          <h2 className="text-lg font-heading text-ui-panel mb-4 flex items-center gap-2">
            <BeakerIcon className="h-5 w-5 text-ui-coord-text" />
            Archetypal State
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-gray-300 font-sans text-sm block">Current Phase</span>
              <p className="text-ui-panel font-heading text-lg">
                {pratibimba?.archetypalPhase || 'Initial Awakening'}
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-gray-300 font-sans text-sm block">Dominant Archetype</span>
              <p className="text-ui-panel font-heading text-lg">
                {pratibimba?.dominantArchetype || 'Seeker'}
              </p>
            </div>
          </div>
          {pratibimba?.shadowArchetype && pratibimba.shadowArchetype !== 'Unknown' && (
            <div className="mt-4 pt-4 border-t border-ui-coord-text/20">
              <span className="text-gray-300 font-sans text-sm block mb-2">Shadow Work</span>
              <p className="text-ui-panel/80 font-heading">
                {pratibimba.shadowArchetype}
              </p>
            </div>
          )}
        </div>

        {/* Growth Tracking Card */}
        <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-6">
          <h2 className="text-lg font-heading text-ui-panel mb-4">Knowledge Growth</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-ui-coord-text/30 p-3 bg-ui-panel/20">
              <span className="text-gray-300 font-sans block mb-1 text-sm">Unlocked Nodes</span>
              <p className="font-heading text-ui-panel text-2xl">
                {pratibimba?.growthNodes?.length || 0}
              </p>
            </div>
            <div className="border border-ui-coord-text/30 p-3 bg-ui-panel/20">
              <span className="text-gray-300 font-sans block mb-1 text-sm">Learning Velocity</span>
              <p className="font-heading text-ui-panel text-2xl">
                {pratibimba?.interactionPatterns?.learningVelocity?.toFixed(1) || '0.0'}
                <span className="text-sm text-gray-400 ml-1">nodes/week</span>
              </p>
            </div>
          </div>
        </div>

        {/* Interaction Patterns Card */}
        <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-6">
          <h2 className="text-lg font-heading text-ui-panel mb-4">Engagement Patterns</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 border-l-2 border-ui-coord-text/50 pl-3">
              <span className="text-gray-300 font-sans text-sm">Journal Entries</span>
              <span className="text-ui-panel font-heading">
                {pratibimba?.interactionPatterns?.journalingFrequency || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 border-l-2 border-ui-coord-text/50 pl-3">
              <span className="text-gray-300 font-sans text-sm">Oracle Consultations</span>
              <span className="text-ui-panel font-heading">
                {pratibimba?.interactionPatterns?.oracleConsultations || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 border-l-2 border-ui-coord-text/50 pl-3">
              <span className="text-gray-300 font-sans text-sm">Avg. Session Duration</span>
              <span className="text-ui-panel font-heading">
                {pratibimba?.interactionPatterns?.chatSessionDuration?.toFixed(0) || 0} min
              </span>
            </div>
          </div>
        </div>

        {/* Account & Settings Access (Nested) */}
        <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-6">
          <h2 className="text-lg font-heading text-ui-panel mb-4 flex items-center gap-2">
            <CogIcon className="h-5 w-5 text-ui-coord-text" />
            Account & Settings
          </h2>
          <p className="text-gray-300 font-sans text-sm mb-4">
            Manage your account, security, billing, and preferences
          </p>
          <button
            onClick={() => {
              setShowAccount(true);
              onStateChange('account-profile');
            }}
            className="w-full flex items-center justify-between px-4 py-3 bg-ui-coord-text/20 hover:bg-ui-coord-text/30 border border-ui-coord-text/50 text-ui-panel transition-all group"
          >
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5" />
              <span className="font-sans">Open Account Settings</span>
            </div>
            <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="bg-ui-panel/10 border border-ui-coord-text/30 p-4 mb-4">
          <div className="text-sm text-gray-300 font-sans">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="h-4 w-4 text-ui-coord-text" />
              <span className="font-medium text-ui-panel">Local-First Data Sovereignty</span>
            </div>
            <p className="text-gray-300/80">
              Your Pratibimba is stored locally in your browser. Cloud sync is active only during
              your session and automatically purges when you sign out. Export your data anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export with SSR disabled (IndexedDB is client-only)
const PratibimbaHub = dynamic(
  () => Promise.resolve(PratibimbaHubContent),
  { ssr: false }
);

export default PratibimbaHub;
