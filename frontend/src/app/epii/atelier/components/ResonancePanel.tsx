/**
 * Resonance Panel Component
 *
 * Displays Bimba coordinate resonances for etymology communities.
 * Shows resonance strength, type, and coordinate metadata.
 * Color-coded by strength with drill-down actions.
 *
 * Story 08.07 Enhancement - AC 11: Bimba Resonance Overlay
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/ui-system/utils/cn';
import type { EtymologySession, EtymologyCommunity, BimbaResonance } from '@/types/etymology.types';

interface ResonancePanelProps {
  session: EtymologySession | null;
  communities: EtymologyCommunity[];
  loading: boolean;
  onCoordinateClick?: (coordinate: string) => void;
}

export function ResonancePanel({ session, communities, loading, onCoordinateClick }: ResonancePanelProps) {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);

  // Auto-select first community with resonances
  useEffect(() => {
    if (communities.length > 0 && !selectedCommunityId) {
      const communityWithResonances = communities.find(c => c.bimba_resonances && c.bimba_resonances.length > 0);
      if (communityWithResonances) {
        setSelectedCommunityId(communityWithResonances.id);
      } else {
        setSelectedCommunityId(communities[0].id);
      }
    }
  }, [communities, selectedCommunityId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          <div className="text-sm text-gray-600">Loading resonances...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-white">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✨</div>
          <div className="text-sm text-gray-600">
            Select or create a session to view Bimba resonances
          </div>
        </div>
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-white">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Communities Yet</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Communities must form before Bimba resonances can be detected.
            Start exploring words to create QL communities.
          </p>
        </div>
      </div>
    );
  }

  const selectedCommunity = communities.find(c => c.id === selectedCommunityId) || communities[0];
  const resonances = selectedCommunity.bimba_resonances || [];

  // Sort by strength descending
  const sortedResonances = [...resonances].sort((a, b) => b.resonance_strength - a.resonance_strength);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            Bimba Resonances ({session.resonances_found.length})
          </h3>
          <div className="text-xs text-gray-500 font-mono">
            Session: {session.session_id.substring(0, 8)}...
          </div>
        </div>
      </div>

      {/* Community Selector */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <label className="text-xs text-gray-600 font-medium mb-2 block">
          Community:
        </label>
        <select
          value={selectedCommunityId || ''}
          onChange={(e) => setSelectedCommunityId(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400/30"
        >
          {communities.map((community) => (
            <option key={community.id} value={community.id}>
              {community.name} ({community.bimba_resonances?.length || 0} resonances)
            </option>
          ))}
        </select>
      </div>

      {/* Resonances List */}
      <div className="flex-1 overflow-y-auto p-6">
        {resonances.length === 0 ? (
          <div className="text-center max-w-md mx-auto py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm text-gray-600">
              No Bimba resonances detected yet for this community.
              Resonances are found during background MEF analysis.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {sortedResonances.map((resonance, idx) => (
              <ResonanceCard
                key={idx}
                resonance={resonance}
                onClick={() => onCoordinateClick?.(resonance.coordinate)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {resonances.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              <span className="font-medium">Avg Strength:</span>{' '}
              <span className="font-mono">
                {(resonances.reduce((sum, r) => sum + r.resonance_strength, 0) / resonances.length * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="font-medium">Types:</span>{' '}
              <span className="font-mono">
                {new Set(resonances.map(r => r.resonance_type)).size} unique
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ResonanceCardProps {
  resonance: BimbaResonance;
  onClick: () => void;
}

function ResonanceCard({ resonance, onClick }: ResonanceCardProps) {
  const strengthPercent = resonance.resonance_strength * 100;
  const strengthClass = getStrengthClass(resonance.resonance_strength);
  const typeColor = getTypeColor(resonance.resonance_type);

  return (
    <div
      onClick={onClick}
      className={cn(
        'border rounded-lg p-4 cursor-pointer transition-all',
        'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
      )}
    >
      {/* Header with coordinate and strength */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-semibold text-purple-600">
              {resonance.coordinate}
            </span>
            <div className={cn('px-2 py-0.5 rounded text-xs font-bold', typeColor)}>
              {resonance.resonance_type}
            </div>
          </div>
          {resonance.coordinate_name && (
            <div className="text-xs text-gray-600">
              {resonance.coordinate_name}
            </div>
          )}
        </div>

        {/* Strength indicator */}
        <div className="text-right">
          <div className={cn('text-lg font-bold font-mono', strengthClass)}>
            {strengthPercent.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">strength</div>
        </div>
      </div>

      {/* Strength bar */}
      <div className="mb-3">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all', strengthClass.replace('text-', 'bg-'))}
            style={{ width: `${strengthPercent}%` }}
          />
        </div>
      </div>

      {/* Description if available */}
      {resonance.description && (
        <div className="text-xs text-gray-700 leading-relaxed">
          {resonance.description}
        </div>
      )}

      {/* Metadata */}
      {resonance.detected_at && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-[10px] text-gray-500">
            Detected: {new Date(resonance.detected_at).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

function getStrengthClass(strength: number): string {
  if (strength >= 0.7) return 'text-green-600';
  if (strength >= 0.5) return 'text-yellow-600';
  if (strength >= 0.3) return 'text-orange-600';
  return 'text-gray-500';
}

function getTypeColor(type: string): string {
  if (type === 'semantic') return 'bg-blue-100 text-blue-700 border border-blue-300';
  if (type === 'structural') return 'bg-purple-100 text-purple-700 border border-purple-300';
  if (type === 'hybrid') return 'bg-green-100 text-green-700 border border-green-300';
  return 'bg-gray-100 text-gray-700 border border-gray-300';
}
