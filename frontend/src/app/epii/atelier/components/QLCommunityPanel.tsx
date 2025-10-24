/**
 * QL Community Panel Component
 *
 * Displays etymology communities with QL structure visualization.
 * Shows geometric patterns (3/4/6-fold) and community metadata.
 * Real data from useCommunitiesForSession hook.
 *
 * Story 08.07 Enhancement - AC 10: QL Community Building
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/ui-system/utils/cn';
import type { EtymologySession, EtymologyCommunity, QuaternalType } from '@/types/etymology.types';

interface QLCommunityPanelProps {
  session: EtymologySession | null;
  communities: EtymologyCommunity[];
  loading: boolean;
  onCommunitySelect?: (communityId: string) => void;
}

export function QLCommunityPanel({ session, communities, loading, onCommunitySelect }: QLCommunityPanelProps) {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);

  const handleCommunityClick = (communityId: string) => {
    setSelectedCommunityId(communityId);
    onCommunitySelect?.(communityId);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          <div className="text-sm text-gray-600">Loading communities...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-white">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⬡</div>
          <div className="text-sm text-gray-600">
            Select or create a session to view QL communities
          </div>
        </div>
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-white">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⬡</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Communities Yet</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Start exploring words in chat. When patterns emerge (3/4/6-fold structures),
            Epii will suggest creating a QL community.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with count */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            QL Communities ({communities.length})
          </h3>
          <div className="text-xs text-gray-500 font-mono">
            Session: {session.session_id.substring(0, 8)}...
          </div>
        </div>
      </div>

      {/* Communities List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          {communities.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              isSelected={selectedCommunityId === community.id}
              onClick={() => handleCommunityClick(community.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface CommunityCardProps {
  community: EtymologyCommunity;
  isSelected: boolean;
  onClick: () => void;
}

function CommunityCard({ community, isSelected, onClick }: CommunityCardProps) {
  const foldCount = getFoldCount(community.quaternal_type);
  const foldColor = getFoldColor(foldCount);

  return (
    <div
      onClick={onClick}
      className={cn(
        'border rounded-lg p-5 cursor-pointer transition-all',
        isSelected
          ? 'border-purple-400 bg-purple-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-base font-semibold text-gray-900 mb-1">
            {community.name}
          </h4>
          {community.description && (
            <p className="text-xs text-gray-600 leading-relaxed">
              {community.description}
            </p>
          )}
        </div>
        <div
          className={cn(
            'px-2.5 py-1 rounded text-xs font-bold',
            foldColor
          )}
        >
          {foldCount}-fold
        </div>
      </div>

      {/* Words */}
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-500 mb-1.5">Words:</div>
        <div className="flex flex-wrap gap-1.5">
          {community.words.map((word, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded border border-purple-200"
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {community.pie_root && (
          <div>
            <span className="text-gray-500">PIE Root:</span>{' '}
            <span className="font-mono text-gray-800">{community.pie_root}</span>
          </div>
        )}
        {community.semantic_pattern && (
          <div className="col-span-2">
            <span className="text-gray-500">Pattern:</span>{' '}
            <span className="text-gray-700">{community.semantic_pattern}</span>
          </div>
        )}
        {community.bimba_coordinate && (
          <div>
            <span className="text-gray-500">Coordinate:</span>{' '}
            <span className="font-mono text-purple-600">{community.bimba_coordinate}</span>
          </div>
        )}
        <div>
          <span className="text-gray-500">Created:</span>{' '}
          <span className="text-gray-700">
            {new Date(community.formed_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* QL Pattern Visualization */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <QLPatternVisualization
          foldCount={foldCount}
          words={community.words}
        />
      </div>
    </div>
  );
}

interface QLPatternVisualizationProps {
  foldCount: number;
  words: string[];
}

function QLPatternVisualization({ foldCount, words }: QLPatternVisualizationProps) {
  // Simple geometric visualization
  // For MVP, show as labeled positions
  // Future: SVG geometric rendering

  const positions = Array.from({ length: foldCount }, (_, i) => ({
    position: i,
    word: words[i] || '...',
    filled: i < words.length
  }));

  return (
    <div className="flex items-center justify-center gap-2">
      {positions.map((pos) => (
        <div
          key={pos.position}
          className={cn(
            'w-12 h-12 rounded flex items-center justify-center text-xs font-medium transition-colors',
            pos.filled
              ? 'bg-purple-100 text-purple-700 border-2 border-purple-400'
              : 'bg-gray-100 text-gray-400 border-2 border-gray-300 border-dashed'
          )}
          title={pos.filled ? pos.word : 'Empty position'}
        >
          {pos.position}
        </div>
      ))}
    </div>
  );
}

function getFoldCount(type: QuaternalType): number {
  const map: Record<QuaternalType, number> = {
    two_part: 2,
    three_part: 3,
    four_part: 4,
    five_part: 5,
    six_part: 6,
    seven_part: 7,
    eight_part: 8,
    nine_part: 9,
    ten_part: 10,
    eleven_part: 11,
    twelve_part: 12
  };
  return map[type] || 4;
}

function getFoldColor(foldCount: number): string {
  if (foldCount === 3) return 'bg-blue-100 text-blue-700 border border-blue-300';
  if (foldCount === 4) return 'bg-purple-100 text-purple-700 border border-purple-300';
  if (foldCount === 6) return 'bg-green-100 text-green-700 border border-green-300';
  if (foldCount === 12) return 'bg-amber-100 text-amber-700 border border-amber-300';
  return 'bg-gray-100 text-gray-700 border border-gray-300';
}
