/**
 * Session Data Sidebar Component
 *
 * Displays real-time session statistics with visual badges.
 * Shows counts for words explored, communities created, PIE roots, and resonances.
 * Pulse animation when new data arrives.
 * Click badges to switch to relevant tabs.
 *
 * Story 08.07 Enhancement - Frontend Observability
 */

'use client';

import React from 'react';
import { cn } from '@/ui-system/utils/cn';
import type { EtymologySession } from '@/types/etymology.types';

interface SessionDataSidebarProps {
  session: EtymologySession | null;
  hasUpdates: boolean;
  onTabSwitch: (tab: 'chat' | 'tree' | 'community' | 'resonance') => void;
}

export function SessionDataSidebar({ session, hasUpdates, onTabSwitch }: SessionDataSidebarProps) {
  if (!session) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-700/50">
        <div className="text-xs text-gray-500 text-center">
          Create or select a session to begin
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Words',
      count: session.words_explored.length,
      tab: 'tree' as const,
      icon: '🔤',
      description: 'Words explored'
    },
    {
      label: 'Communities',
      count: session.communities_created.length,
      tab: 'community' as const,
      icon: '⬡',
      description: 'QL communities'
    },
    {
      label: 'PIE Roots',
      count: session.pie_roots_discovered.length,
      tab: 'tree' as const,
      icon: '🌳',
      description: 'Proto-Indo-European roots'
    },
    {
      label: 'Resonances',
      count: session.resonances_found.length,
      tab: 'resonance' as const,
      icon: '✨',
      description: 'Bimba coordinate matches'
    }
  ];

  return (
    <div className="mt-6 pt-6 border-t border-gray-700/50">
      {/* Header */}
      <div className="text-xs text-gray-400 mb-4 text-center font-mono">
        Session Data
      </div>

      {/* Stats Grid */}
      <div className="space-y-2">
        {stats.map((stat) => (
          <StatBadge
            key={stat.label}
            label={stat.label}
            count={stat.count}
            icon={stat.icon}
            description={stat.description}
            hasUpdates={hasUpdates}
            onClick={() => onTabSwitch(stat.tab)}
          />
        ))}
      </div>

      {/* Session Meta */}
      <div className="mt-4 pt-4 border-t border-gray-700/30">
        <div className="text-[10px] text-gray-600 space-y-1">
          <div>Status: <span className="text-gray-400">{session.status}</span></div>
          <div>Context: <span className="text-purple-400 font-mono">{session.coordinate_context}</span></div>
        </div>
      </div>
    </div>
  );
}

interface StatBadgeProps {
  label: string;
  count: number;
  icon: string;
  description: string;
  hasUpdates: boolean;
  onClick: () => void;
}

function StatBadge({ label, count, icon, description, hasUpdates, onClick }: StatBadgeProps) {
  return (
    <button
      onClick={onClick}
      title={description}
      className={cn(
        'w-full flex items-center justify-between',
        'p-2.5 rounded border transition-all duration-200',
        'hover:border-purple-500/50 hover:bg-purple-600/5 cursor-pointer',
        'border-gray-700/50 bg-gray-900/20',
        hasUpdates && count > 0 && 'animate-pulse'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-gray-300 font-mono">{label}</span>
      </div>
      <div
        className={cn(
          'px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-colors',
          count > 0
            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
            : 'bg-gray-800/50 text-gray-600 border border-gray-700/50'
        )}
      >
        {count}
      </div>
    </button>
  );
}
