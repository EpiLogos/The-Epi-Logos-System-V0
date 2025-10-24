/**
 * Exploration Boxes Component
 *
 * 3-box non-linear grid layout for exploration tracking:
 * - Box 1: Recent explorations
 * - Box 2: Active QL communities
 * - Box 3: Bimba resonances heat map
 *
 * Design: Unfilled borders (transparent background), non-linear grid positioning
 */

'use client';

import React from 'react';
import { cn } from '@/ui-system/utils/cn';

interface ExplorationBoxesProps {
  session?: {
    currentWords: string[];
    qlCommunities: Array<{ id: string; pattern: string; words: string[] }>;
    bimbaResonances: Array<{ coordinate: string; strength: number; type: string }>;
  };
}

export function ExplorationBoxes({ session }: ExplorationBoxesProps) {
  return (
    <div className="exploration-boxes">
      {/* Box 1: Recent Explorations (Top-left, smaller square) */}
      <div className={cn(
        "box-1",
        "border border-[#e0e0e0] rounded-lg",
        "bg-white/50",
        "hover:border-[#ccc] transition-colors",
        "p-4"
      )}>
        <h3 className="text-xs font-semibold text-[#333] uppercase tracking-wide mb-3">
          Recent Explorations
        </h3>
        {session && session.currentWords.length > 0 ? (
          <div className="space-y-1.5">
            {session.currentWords.slice(0, 5).map((word, idx) => (
              <div key={idx} className="text-xs text-[#666]">
                {word}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#888] italic">
            No explorations yet
          </p>
        )}
      </div>

      {/* Box 2: Active QL Communities (Top-right, medium rectangle) */}
      <div className={cn(
        "box-2",
        "border border-[#e0e0e0] rounded-lg",
        "bg-white/50",
        "hover:border-[#ccc] transition-colors",
        "p-4"
      )}>
        <h3 className="text-xs font-semibold text-[#333] uppercase tracking-wide mb-3">
          Active QL Communities
        </h3>
        {session && session.qlCommunities.length > 0 ? (
          <div className="space-y-2">
            {session.qlCommunities.map(community => (
              <div key={community.id} className="text-xs">
                <div className="text-purple-600 font-medium">{community.pattern}</div>
                <div className="text-[#888] text-[10px]">
                  {community.words.length} words
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#888] italic">
            No communities built
          </p>
        )}
      </div>

      {/* Box 3: Bimba Resonances (Bottom-center, larger rectangle) */}
      <div className={cn(
        "box-3",
        "border border-[#e0e0e0] rounded-lg",
        "bg-white/50",
        "hover:border-[#ccc] transition-colors",
        "p-4"
      )}>
        <h3 className="text-xs font-semibold text-[#333] uppercase tracking-wide mb-3">
          Bimba Resonances
        </h3>
        {session && session.bimbaResonances.length > 0 ? (
          <div className="space-y-1.5">
            {session.bimbaResonances.slice(0, 3).map((resonance, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-purple-600 font-mono">{resonance.coordinate}</span>
                <span className="text-[#888]">{(resonance.strength * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#888] italic">
            No resonances detected
          </p>
        )}
      </div>

      <style jsx>{`
        .exploration-boxes {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-template-rows: repeat(8, 1fr);
          gap: 1rem;
          min-height: 400px;
        }

        .box-1 {
          grid-column: 1 / 5;
          grid-row: 1 / 4;
        }

        .box-2 {
          grid-column: 6 / 12;
          grid-row: 1 / 3;
        }

        .box-3 {
          grid-column: 4 / 10;
          grid-row: 5 / 8;
        }
      `}</style>
    </div>
  );
}
