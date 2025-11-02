/**
 * Resonance Panel Component
 *
 * Displays Bimba coordinate resonances for etymology communities.
 * Shows resonance strength, type, and coordinate metadata.
 * Color-coded by strength with drill-down actions.
 *
 * Story 08.07 Enhancement - AC 11: Bimba Resonance Overlay
 * Story 08.13 Enhancement - MEF Resonance Analysis
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/ui-system/utils/cn';
import type { EtymologySession, EtymologyCommunity, BimbaResonance, MEFLensType } from '@/types/etymology.types';
import { WisdomPacketModal } from './WisdomPacketModal';

interface ResonancePanelProps {
  session: EtymologySession | null;
  userId: string;
  communities: EtymologyCommunity[];
  loading: boolean;
  onCoordinateClick?: (coordinate: string) => void;
  onRefetch?: () => Promise<void>;
  headerCollapsed?: boolean;
}

export function ResonancePanel({ session, userId, communities, loading, onCoordinateClick, onRefetch, headerCollapsed = false }: ResonancePanelProps) {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [analyzingMEF, setAnalyzingMEF] = useState(false);
  const [mefAnalysisError, setMefAnalysisError] = useState<string | null>(null);
  const [wisdomPacketModal, setWisdomPacketModal] = useState<{
    isOpen: boolean;
    coordinate: string | null;
  }>({
    isOpen: false,
    coordinate: null
  });

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

  /**
   * Trigger MEF analysis for selected community
   * Story 08.13 - MEF Resonance Analysis
   */
  const triggerMEFAnalysis = async (communityId: string) => {
    if (!userId) return;

    try {
      setAnalyzingMEF(true);
      setMefAnalysisError(null);

      const params = new URLSearchParams({
        group_id: userId,
        user_id: userId
      });

      const resp = await fetch(
        `/api/graphiti/etymology/communities/${communityId}/analyze-mef?${params}`,
        { method: 'POST' }
      );

      if (!resp.ok) {
        const error = await resp.json();
        throw new Error(error.detail || 'Failed to trigger MEF analysis');
      }

      const data = await resp.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to trigger MEF analysis');
      }

      // Show success toast
      showToast('MEF analysis started! Polling for results...', 'success');

      // Capture initial resonance count to detect NEW resonances only
      const initialCommunity = communities.find(c => c.id === communityId);
      const initialResonanceCount = initialCommunity?.bimba_resonances?.length ?? 0;

      // Continuous polling until resonances appear (max 60 seconds)
      const startTime = Date.now();
      const pollInterval = setInterval(async () => {
        if (!onRefetch) {
          clearInterval(pollInterval);
          return;
        }

        await onRefetch();

        // Check if analysis completed (NEW resonances appeared)
        const community = communities.find(c => c.id === communityId);
        const currentResonanceCount = community?.bimba_resonances?.length ?? 0;

        if (currentResonanceCount > initialResonanceCount) {
          clearInterval(pollInterval);
          setAnalyzingMEF(false);
          const newResonances = currentResonanceCount - initialResonanceCount;
          showToast(`MEF analysis complete! Found ${newResonances} new resonance${newResonances === 1 ? '' : 's'}.`, 'success');
        }

        // Timeout after 60 seconds
        if (Date.now() - startTime > 60000) {
          clearInterval(pollInterval);
          setAnalyzingMEF(false);
          showToast('MEF analysis timed out. Please check manually.', 'error');
        }
      }, 3000); // Poll every 3 seconds

    } catch (e: any) {
      console.error('[ResonancePanel] Error triggering MEF analysis:', e);
      const errorMessage = e.message || 'Failed to trigger MEF analysis';
      setMefAnalysisError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setAnalyzingMEF(false);
    }
  };

  /**
   * Simple toast notification system
   */
  const showToast = (message: string, type: 'success' | 'error') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg text-white text-sm font-medium z-50 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove after 4 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 4000);
  };

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
      {/* Compact Resonance Selector Bar - always visible, styled like tab chips */}
      <div className="border-b border-[#e0e0e0] bg-white px-6 py-2">
        <div className="flex items-center gap-3 w-full">
          {/* Left: label fully left (no count) */}
          <div className="text-xs font-medium text-[#666] whitespace-nowrap">
            Bimba Resonances
          </div>

          {/* Left-anchored selector with capped width (< half screen) */}
          <select
            value={selectedCommunityId || ''}
            onChange={(e) => setSelectedCommunityId(e.target.value)}
            className={cn(
              'w-[26vw] max-w-[26vw]',
              'px-3 py-1.5 text-xs rounded',
              'border border-[#e0e0e0] text-[#666] bg-white',
              'transition-colors hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/30'
            )}
          >
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name} ({community.bimba_resonances?.length || 0})
              </option>
            ))}
          </select>

          {/* Right: MEF action pinned far right (session id shown just left) */}
          <div className="ml-auto flex items-center gap-3 whitespace-nowrap">
            <div className="text-[10px] text-gray-500 font-mono">
              {session.session_id.substring(0, 8)}...
            </div>
            {selectedCommunityId && (
              <button
                onClick={() => triggerMEFAnalysis(selectedCommunityId)}
                disabled={analyzingMEF}
                className={cn(
                  'px-3 py-1.5 text-xs border rounded transition-colors',
                  analyzingMEF
                    ? 'border-[#e0e0e0] text-gray-400 cursor-not-allowed'
                    : 'border-purple-500 text-purple-600 hover:bg-purple-50'
                )}
              >
                {analyzingMEF ? 'Analyzing...' : 'Analyze MEF'}
              </button>
            )}
          </div>
        </div>

        {/* Error Message (if any) */}
        {mefAnalysisError && (
          <div className="mt-1 text-[10px] text-red-600">
            {mefAnalysisError}
          </div>
        )}
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
                onCoordinateClick={(coord) => setWisdomPacketModal({ isOpen: true, coordinate: coord })}
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

      {/* Wisdom Packet Modal */}
      {wisdomPacketModal.coordinate && (
        <WisdomPacketModal
          coordinate={wisdomPacketModal.coordinate}
          isOpen={wisdomPacketModal.isOpen}
          onClose={() => setWisdomPacketModal({ isOpen: false, coordinate: null })}
        />
      )}
    </div>
  );
}

interface ResonanceCardProps {
  resonance: BimbaResonance;
  onClick: () => void;
  onCoordinateClick: (coordinate: string) => void;
}

function ResonanceCard({ resonance, onClick, onCoordinateClick }: ResonanceCardProps) {
  const [showDeepSeek, setShowDeepSeek] = useState(false);
  const [showLenses, setShowLenses] = useState(false);
  const [expandedLens, setExpandedLens] = useState<MEFLensType | null>(null);

  const strengthPercent = resonance.resonance_strength * 100;
  const strengthClass = getStrengthClass(resonance.resonance_strength);
  const typeColor = getTypeColor(resonance.resonance_type);

  const lenses: { key: MEFLensType; label: string }[] = [
    { key: 'archetypal', label: 'Archetypal' },
    { key: 'causal', label: 'Causal' },
    { key: 'logical', label: 'Logical' },
    { key: 'processual', label: 'Processual' },
    { key: 'meta_epistemic', label: 'Meta-Epistemic' },
    { key: 'divine_scalar', label: 'Divine-Scalar' }
  ];

  return (
    <div
      className={cn(
        'border rounded-lg p-4 transition-all',
        'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
      )}
    >
      {/* Header with coordinate and strength */}
      <div
        onClick={onClick}
        className="cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCoordinateClick(resonance.coordinate);
                }}
                className="font-mono text-sm font-semibold text-purple-600 hover:text-purple-800 hover:underline transition-colors cursor-pointer"
              >
                {resonance.coordinate}
              </button>
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
      </div>

      {/* MEF Reasoning Summary */}
      {resonance.reasoning_summary && (
        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
          <div className="text-xs font-medium text-purple-800 mb-1">MEF Reasoning</div>
          <div className="text-xs text-gray-700 leading-relaxed">
            {resonance.reasoning_summary}
          </div>
          {resonance.detected_via_lens && (
            <div className="mt-2 text-[10px] text-purple-600">
              Detected via: {resonance.detected_via_lens} lens
            </div>
          )}
        </div>
      )}

      {/* DeepSeek Reasoning Chain (Expandable) */}
      {resonance.deepseek_reasoning && (
        <div className="mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeepSeek(!showDeepSeek);
            }}
            className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span className={cn('transform transition-transform', showDeepSeek ? 'rotate-90' : '')}>
              ▶
            </span>
            DeepSeek Reasoning Chain
          </button>
          {showDeepSeek && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded">
              <pre className="text-[10px] text-gray-700 whitespace-pre-wrap font-mono">
                {resonance.deepseek_reasoning}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* MEF Lens Insights (Expandable) */}
      <div className="mt-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowLenses(!showLenses);
          }}
          className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span className={cn('transform transition-transform', showLenses ? 'rotate-90' : '')}>
            ▶
          </span>
          MEF Lens Insights (6 Lenses)
        </button>
        {showLenses && (
          <div className="mt-2 space-y-2">
            {lenses.map(({ key, label }) => {
              const lensData = resonance[`mef_${key}` as keyof BimbaResonance];
              if (!lensData) return null;

              const isExpanded = expandedLens === key;

              return (
                <div key={key} className="border border-gray-200 rounded">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedLens(isExpanded ? null : key);
                    }}
                    className="w-full flex items-center justify-between p-2 text-xs hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className={cn('transform transition-transform', isExpanded ? 'rotate-90' : '')}>
                      ▶
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                      <pre className="text-[10px] text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(lensData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
