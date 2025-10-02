'use client';

import React, { useCallback } from 'react';
import { useAuth } from '@/auth';
import { cn } from '../../utils/cn';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';
import { HexDashboardGridPerItem } from './HexDashboardGridPerItem';


interface DashboardModalContentProps {
  onStateChange: (state: EpiLogosBusinessState) => void;
}

export const DashboardModalContent: React.FC<DashboardModalContentProps> = ({ onStateChange }) => {
  const { user, signOut } = useAuth();
  const handleNavigate = useCallback((s: EpiLogosBusinessState) => onStateChange(s), [onStateChange]);

  return <HexDashboardGridPerItem onNavigate={handleNavigate} />;
};

export default DashboardModalContent;
