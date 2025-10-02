'use client';

import React, { useCallback } from 'react';
import { useAuth } from '@/auth';
import { cn } from '../../utils/cn';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';
import { DashboardGrid } from './DashboardGrid';


interface DashboardModalContentProps {
  onStateChange: (state: EpiLogosBusinessState) => void;
}

export const DashboardModalContent: React.FC<DashboardModalContentProps> = ({ onStateChange }) => {
  const { user, signOut } = useAuth();
  const handleNavigate = useCallback((s: EpiLogosBusinessState) => onStateChange(s), [onStateChange]);

  return (
    <div className="dashboard-modal-container pt-6 pb-0 px-4 max-w-4xl mx-auto relative">

      {/* Header */}
      <div className="dashboard-header mb-8 text-center relative z-10">
        <h1 className="text-2xl font-mono text-ui-gray mb-2">
          Welcome, {user?.firstName || user?.name || 'User'}
        </h1>
        <p className="text-ui-coord-text font-mono text-sm">Epi:Logos System Dashboard</p>
      </div>

      {/* Grid */}
      <div className="relative z-10">
        <DashboardGrid onNavigate={handleNavigate} />
      </div>

      {/* Footer */}
      <div className="dashboard-footer mt-12 pt-4 border-t border-ui-coord-text/20 text-center relative z-10">
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
