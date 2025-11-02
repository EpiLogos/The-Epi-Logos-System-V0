/**
 * Etymology Tree Panel Component
 *
 * Displays etymological trees for explored words using force-directed graph.
 * Shows PIE roots → cognates → modern words hierarchy.
 *
 * Story 08.07 Enhancement - AC 9: Etymology Tree Visualization
 * Story 08.10 Enhancement - Force-directed graph visualization
 */

'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/ui-system/utils/cn';
import type { EtymologySession, EtymologyCommunity } from '@/types/etymology.types';
import { EtymologyTreeForceGraph } from './visualizations/etymology-tree/EtymologyTreeForceGraph';
import type { TreeNode } from './visualizations/etymology-tree/types';
import { CLASSIFICATION_META, LEGEND_CLASSIFICATIONS } from './visualizations/etymology-tree/constants';

interface EtymologyTreePanelProps {
  session: EtymologySession | null;
  communities: EtymologyCommunity[];
  loading: boolean;
}

export function EtymologyTreePanel({ session, communities, loading }: EtymologyTreePanelProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [expandedRoots, setExpandedRoots] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [selectedGraphNode, setSelectedGraphNode] = useState<TreeNode | null>(null);

  useEffect(() => {
    setSelectedGraphNode(null);
  }, [session?.session_id]);

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

  // Don't check session.words_explored - communities have the actual data!

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
    <div className="h-full min-h-0 flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            Etymology Trees ({communities.length} communities)
          </h3>
          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded">
              <button
                onClick={() => setViewMode('graph')}
                className={cn(
                  'px-2 py-0.5 text-xs rounded transition-colors',
                  viewMode === 'graph'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                )}
              >
                Graph
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-2 py-0.5 text-xs rounded transition-colors',
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                )}
              >
                List
              </button>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              Session: {session.session_id.substring(0, 8)}...
            </div>
          </div>
        </div>
      </div>

      {/* Graph View or List View */}
      {viewMode === 'graph' ? (
        <div className="flex-1 overflow-hidden min-h-0 relative">
          <GraphLegend />
          <EtymologyTreeForceGraph
            session={session}
            communities={communities}
            className="w-full h-full"
            onNodeSelect={setSelectedGraphNode}
            selectedNodePath={selectedGraphNode?.path ?? null}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Words list */}
          <div className="w-64 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="text-xs text-gray-600 font-medium mb-3">Words from Communities</div>
              <div className="space-y-1">
                {(() => {
                  const allWords = Array.from(new Set(communities.flatMap(c => c.words)));
                  return allWords.map((word) => (
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
                  ));
                })()}
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
      )}

      {/* Footer: PIE Roots from communities */}
      {(() => {
        const pieRoots = Array.from(new Set(communities.map(c => c.pie_root).filter(Boolean)));
        return (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="lg:max-w-lg">
                {pieRoots.length > 0 && (
                  <>
                    <div className="text-xs text-gray-600 font-medium mb-2">PIE Roots ({pieRoots.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {pieRoots.map((root) => (
                        <button
                          key={root}
                          onClick={() => toggleRoot(root!)}
                          className={cn(
                            'px-2.5 py-1 rounded text-xs font-mono transition-colors',
                            expandedRoots.has(root!)
                              ? 'bg-purple-600 text-white border border-purple-700'
                              : 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200'
                          )}
                        >
                          {root}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <GraphNodeInfo node={selectedGraphNode} communities={communities} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}

const GRAPH_LEGEND_ITEMS = LEGEND_CLASSIFICATIONS.map((classification) => {
  const meta = CLASSIFICATION_META[classification];
  return {
    key: classification,
    label: meta.label,
    description: meta.legendDescription,
    fill: meta.fill,
    stroke: meta.stroke
  } as const;
});

function GraphLegend() {
  return (
    <div className="absolute top-3 right-3 z-20 max-w-xs rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-3 backdrop-blur shadow-lg">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 mb-2">
        Legend
      </div>
      <div className="space-y-2.5">
        {GRAPH_LEGEND_ITEMS.map((item) => (
          <div key={item.key} className="flex items-start gap-3">
            <div
              className="mt-0.5 h-4 w-4 shrink-0 rounded-full border"
              style={{
                backgroundColor: item.fill,
                borderColor: item.stroke
              }}
            />
            <div className="text-[11px] leading-snug text-slate-100">
              <div className="font-semibold text-slate-100">{item.label}</div>
              <div className="text-[10px] text-slate-400">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface GraphNodeInfoProps {
  node: TreeNode | null;
  communities: EtymologyCommunity[];
}

function GraphNodeInfo({ node, communities }: GraphNodeInfoProps) {
  if (!node) {
    return (
      <div className="max-w-sm rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
        <div className="font-semibold uppercase tracking-[0.18em] text-slate-400 text-[10px] mb-1">
          Context
        </div>
        <p>Select a node to view lineage and community details.</p>
      </div>
    );
  }

  const meta = CLASSIFICATION_META[node.classification] ?? CLASSIFICATION_META['non-pie'];
  const badgeStyle = {
    backgroundColor: meta.fill,
    borderColor: meta.stroke,
    color: meta.text
  } as React.CSSProperties;

  if (node.nodeType === 'root' || node.nodeType === 'session-root') {
    const linkedCommunities = (node.communityIds || [])
      .map((id) => communities.find((c) => c.id === id))
      .filter((c): c is EtymologyCommunity => Boolean(c));

    return (
      <div className="max-w-sm rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{node.leaf}</div>
            {node.pieRoot && (
              <div className="text-xs text-slate-500 mt-0.5">
                PIE Root: <span className="font-mono text-slate-700">{node.pieRoot}</span>
              </div>
            )}
          </div>
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={badgeStyle}
          >
            {meta.label}
          </span>
        </div>

        {linkedCommunities.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
              Communities
            </div>
            <ul className="space-y-1.5">
              {linkedCommunities.map((community) => (
                <li key={community.id} className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium text-slate-700">{community.name}</span>
                  {community.pie_root && (
                    <span className="font-mono text-[10px] text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5">
                      {community.pie_root}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const community = node.communityId
    ? communities.find((c) => c.id === node.communityId)
    : undefined;

  const rows = [
    community && { label: 'Community', value: community.name },
    (node.pieRoot || community?.pie_root) && {
      label: 'PIE Root',
      value: node.pieRoot || community?.pie_root
    },
    community?.quaternal_type && {
      label: 'QL Pattern',
      value: formatQuaternalType(community.quaternal_type)
    },
    (node.lineage || node.pieLineage) && {
      label: 'Lineage',
      value: node.lineage || node.pieLineage
    },
    node.relationDescriptor && {
      label: 'Relation',
      value: node.relationDescriptor
    },
    node.semanticPattern && {
      label: 'Semantic Pattern',
      value: node.semanticPattern
    }
  ].filter((entry): entry is { label: string; value: string } => Boolean(entry && entry.value));

  return (
    <div className="max-w-sm rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{node.leaf}</div>
          {community && (
            <div className="text-xs text-slate-500 mt-0.5">{community.name}</div>
          )}
        </div>
        <span
          className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={badgeStyle}
        >
          {meta.label}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        {rows.length === 0 ? (
          <div className="text-xs text-slate-500">No additional lineage data available yet.</div>
        ) : (
          rows.map((row) => (
            <div key={row.label} className="text-xs text-slate-600">
              <span className="font-semibold text-slate-500 uppercase tracking-[0.18em] text-[10px] mr-2">
                {row.label}
              </span>
              <span className="align-middle whitespace-pre-wrap text-slate-600">{row.value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatQuaternalType(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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
    </div>
  );
}
