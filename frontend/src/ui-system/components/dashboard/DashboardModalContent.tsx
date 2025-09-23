'use client';

import React from 'react';
import { useAuth } from '@/auth';
import { cn } from '../../utils/cn';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';
import { DashboardGrid } from './DashboardGrid';

interface DashboardModalContentProps {
  onStateChange: (state: EpiLogosBusinessState) => void;
}

export const DashboardModalContent: React.FC<DashboardModalContentProps> = ({ onStateChange }) => {
  const { user, signOut } = useAuth();

  return (
    <div className="dashboard-modal-container p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="dashboard-header mb-8 text-center">
        <h1 className="text-2xl font-mono text-ui-panel mb-2">
          Welcome, {user?.firstName || user?.name || 'User'}
        </h1>
        <p className="text-ui-coord-text font-mono text-sm">Epi:Logos System Dashboard</p>
      </div>

      {/* Grid */}
      <DashboardGrid onNavigate={onStateChange} />

      {/* Footer */}
      <div className="dashboard-footer mt-12 pt-6 border-t border-ui-coord-text/20 text-center">
        <button
          onClick={() => {
            void signOut().then(() => onStateChange('auth-signin'));
          }}
          className="text-ui-coord-text hover:text-ui-panel transition-colors font-mono text-sm"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default DashboardModalContent;

