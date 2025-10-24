/**
 * Session Stats Modal Component
 *
 * Modal overlay displaying real-time session statistics.
 * Triggered from Etymology Explorer header button.
 * Shows counts for words explored, communities created, PIE roots, and resonances.
 *
 * Story 08.07 Enhancement - Frontend Observability
 */

'use client';

import React from 'react';
import { cn } from '@/ui-system/utils/cn';
import type { EtymologySession } from '@/types/etymology.types';

interface SessionStatsModalProps {
  session: EtymologySession | null;
  hasUpdates: boolean;
  isOpen: boolean;
  onClose: () => void;
  onTabSwitch: (tab: 'chat' | 'tree' | 'community' | 'resonance') => void;
}

export function SessionStatsModal({
  session,
  hasUpdates,
  isOpen,
  onClose,
  onTabSwitch
}: SessionStatsModalProps) {
  if (!isOpen) return null;

  const handleTabSwitch = (tab: 'chat' | 'tree' | 'community' | 'resonance') => {
    onTabSwitch(tab);
    onClose();
  };

  if (!session) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-sm text-gray-600">
              No active session. Create or select a session to view stats.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Words Explored',
      count: session.words_explored.length,
      tab: 'tree' as const,
      icon: '🔤',
      description: 'Total words analyzed in this session',
      color: 'blue'
    },
    {
      label: 'QL Communities',
      count: session.communities_created.length,
      tab: 'community' as const,
      icon: '⬡',
      description: 'Quaternal Logic communities formed',
      color: 'purple'
    },
    {
      label: 'PIE Roots',
      count: session.pie_roots_discovered.length,
      tab: 'tree' as const,
      icon: '🌳',
      description: 'Proto-Indo-European roots discovered',
      color: 'green'
    },
    {
      label: 'Bimba Resonances',
      count: session.resonances_found.length,
      tab: 'resonance' as const,
      icon: '✨',
      description: 'Canonical coordinate resonances detected',
      color: 'amber'
    }
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Session Statistics</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-1 text-xs text-gray-500 font-mono">
            Session: {session.session_id.substring(0, 12)}...
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                count={stat.count}
                icon={stat.icon}
                description={stat.description}
                color={stat.color}
                hasUpdates={hasUpdates}
                onClick={() => handleTabSwitch(stat.tab)}
              />
            ))}
          </div>

          {/* Session Metadata */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <div className="font-medium text-gray-900 capitalize">{session.status}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Coordinate Context</div>
                <div className="font-mono text-sm text-purple-600">{session.coordinate_context}</div>
              </div>
              {session.created_at && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Created</div>
                  <div className="text-sm text-gray-700">
                    {new Date(session.created_at).toLocaleString()}
                  </div>
                </div>
              )}
              {session.updated_at && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                  <div className="text-sm text-gray-700">
                    {new Date(session.updated_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600 text-center">
            Click any stat card to view detailed visualization
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  count: number;
  icon: string;
  description: string;
  color: string;
  hasUpdates: boolean;
  onClick: () => void;
}

function StatCard({ label, count, icon, description, color, hasUpdates, onClick }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    purple: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    green: 'bg-green-50 border-green-200 hover:border-green-400',
    amber: 'bg-amber-50 border-amber-200 hover:border-amber-400'
  };

  const countColorClasses = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    amber: 'text-amber-600'
  };

  return (
    <button
      onClick={onClick}
      title={description}
      className={cn(
        'p-4 rounded-lg border-2 transition-all duration-200 text-left',
        'hover:shadow-md cursor-pointer',
        colorClasses[color as keyof typeof colorClasses],
        hasUpdates && count > 0 && 'animate-pulse'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <div className={cn(
          'text-3xl font-bold font-mono',
          countColorClasses[color as keyof typeof countColorClasses]
        )}>
          {count}
        </div>
      </div>
      <div className="text-sm font-medium text-gray-900">{label}</div>
      <div className="text-xs text-gray-500 mt-1">{description}</div>
    </button>
  );
}
