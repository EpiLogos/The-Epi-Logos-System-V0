/**
 * Etymology Tree Panel Component
 *
 * Displays etymological trees for explored words.
 * Shows PIE roots → cognates → modern words hierarchy.
 * MVP: Hierarchical list view (future: D3.js force-directed graph).
 *
 * Story 08.07 Enhancement - AC 9: Etymology Tree Visualization
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/ui-system/utils/cn';
import type { EtymologySession } from '@/types/etymology.types';

interface EtymologyTreePanelProps {
  session: EtymologySession | null;
  loading: boolean;
}

export function EtymologyTreePanel({ session, loading }: EtymologyTreePanelProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [expandedRoots, setExpandedRoots] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          <div className="text-sm text-gray-600">Loading etymology trees...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-white">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🌳</div>
          <div className="text-sm text-gray-600">
            Select or create a session to view etymology trees
          </div>
        </div>
      </div>
    );
  }

  if (session.words_explored.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-white">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🌳</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Words Explored Yet</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Start exploring words in chat. Etymology trees will appear here
            showing PIE roots, cognates, and semantic evolution.
          </p>
        </div>
      </div>
    );
  }

  const toggleRoot = (root: string) => {
    const newExpanded = new Set(expandedRoots);
    if (newExpanded.has(root)) {
      newExpanded.delete(root);
    } else {
      newExpanded.add(root);
    }
    setExpandedRoots(newExpanded);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            Etymology Trees ({session.words_explored.length} words, {session.pie_roots_discovered.length} roots)
          </h3>
          <div className="text-xs text-gray-500 font-mono">
            Session: {session.session_id.substring(0, 8)}...
          </div>
        </div>
      </div>

      {/* Two-column layout: Words list + Tree view */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: Words list */}
        <div className="w-64 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="text-xs text-gray-600 font-medium mb-3">Explored Words</div>
            <div className="space-y-1">
              {session.words_explored.map((word) => (
                <button
                  key={word}
                  onClick={() => setSelectedWord(word)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm rounded transition-colors',
                    selectedWord === word
                      ? 'bg-purple-100 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Tree view */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedWord ? (
            <WordEtymologyTree word={selectedWord} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="text-4xl mb-3">🌳</div>
                <p className="text-sm text-gray-600">
                  Select a word from the list to view its etymology tree
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer: PIE Roots discovered */}
      {session.pie_roots_discovered.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600 font-medium mb-2">PIE Roots Discovered</div>
          <div className="flex flex-wrap gap-2">
            {session.pie_roots_discovered.map((root) => (
              <button
                key={root}
                onClick={() => toggleRoot(root)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-mono transition-colors',
                  expandedRoots.has(root)
                    ? 'bg-purple-600 text-white border border-purple-700'
                    : 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200'
                )}
              >
                {root}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface WordEtymologyTreeProps {
  word: string;
}

function WordEtymologyTree({ word }: WordEtymologyTreeProps) {
  // For MVP: Mock tree structure
  // Future: Fetch from `GET /api/graphiti/etymology/tree/{word}`

  const mockTree = {
    word,
    pieRoot: '*weyd-',
    meaning: 'to see, to know',
    branches: [
      {
        language: 'Proto-Indo-European',
        form: '*weyd-',
        meaning: 'to see, to know',
        level: 0
      },
      {
        language: 'Latin',
        form: 'vidēre',
        meaning: 'to see',
        level: 1
      },
      {
        language: 'Old French',
        form: 'veoir',
        meaning: 'to see',
        level: 2
      },
      {
        language: 'Middle English',
        form: 'veue',
        meaning: 'sight, appearance',
        level: 3
      },
      {
        language: 'Modern English',
        form: word,
        meaning: 'current meaning',
        level: 4
      }
    ],
    cognates: [
      { word: 'vision', language: 'English', pieRoot: '*weyd-' },
      { word: 'wise', language: 'English', pieRoot: '*weyd-' },
      { word: 'wit', language: 'English', pieRoot: '*weyd-' },
      { word: 'witness', language: 'English', pieRoot: '*weyd-' }
    ]
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-1">{word}</h4>
        <div className="text-sm text-gray-600">
          PIE Root: <span className="font-mono text-purple-600">{mockTree.pieRoot}</span>
          {' • '}
          <span className="italic">{mockTree.meaning}</span>
        </div>
      </div>

      {/* Etymology Path */}
      <div className="mb-6">
        <div className="text-xs text-gray-600 font-medium mb-3">Etymology Path</div>
        <div className="space-y-3">
          {mockTree.branches.map((branch, idx) => (
            <div key={idx} className="flex items-start gap-4">
              {/* Level indicator */}
              <div
                className="flex-shrink-0 w-20 text-xs text-gray-500 font-mono pt-1"
                style={{ paddingLeft: `${branch.level * 8}px` }}
              >
                {branch.language}
              </div>

              {/* Branch card */}
              <div
                className={cn(
                  'flex-1 border rounded p-3 transition-colors',
                  branch.level === 0
                    ? 'bg-purple-50 border-purple-300'
                    : branch.level === 4
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-gray-900">
                    {branch.form}
                  </span>
                  {idx < mockTree.branches.length - 1 && (
                    <span className="text-gray-400 text-xs">↓</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-1 italic">
                  "{branch.meaning}"
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cognates */}
      <div>
        <div className="text-xs text-gray-600 font-medium mb-3">
          Related Cognates (same PIE root)
        </div>
        <div className="grid grid-cols-2 gap-2">
          {mockTree.cognates.map((cognate, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded p-2.5 bg-white hover:border-purple-300 transition-colors cursor-pointer"
            >
              <div className="text-sm font-medium text-gray-900">{cognate.word}</div>
              <div className="text-xs text-gray-500">{cognate.language}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Future D3.js placeholder */}
      <div className="mt-6 p-4 border border-dashed border-gray-300 rounded bg-gray-50">
        <div className="text-xs text-gray-600 text-center">
          <p className="font-medium mb-1">🎨 Future Enhancement</p>
          <p>Interactive D3.js force-directed graph visualization with QL pattern highlighting</p>
        </div>
      </div>
    </div>
  );
}
