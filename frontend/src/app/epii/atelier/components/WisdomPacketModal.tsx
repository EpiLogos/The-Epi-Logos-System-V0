/**
 * Wisdom Packet Modal Component
 *
 * Displays synthesized wisdom and insights for a Bimba coordinate.
 * Fetches data from GraphQL getWisdomPacket query with Redis caching.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/ui-system/utils/cn';

interface WisdomPacketModalProps {
  coordinate: string;
  isOpen: boolean;
  onClose: () => void;
}

interface BimbaNodeBasic {
  coordinate: string;
  name: string;
  subsystem: string;
  description?: string;
  operationalEssence?: string;
}

interface KeyConcept {
  concept: string;
  sourceCoordinates: string[];
  relevanceScore: number;
  description?: string;
}

interface ApophaticPointer {
  missingTheme: string;
  expectedCoordinates: string[];
  suggestion: string;
}

interface WisdomPacket {
  centralNode: BimbaNodeBasic;
  keyConcepts: KeyConcept[];
  narrativeSummary: string;
  apophaticPointers: ApophaticPointer[];
  contextualThemes: string[];
  synthesisScore: number;
  generatedAt: string;
  cacheHit: boolean;
  depth: number;
}

export function WisdomPacketModal({ coordinate, isOpen, onClose }: WisdomPacketModalProps) {
  const [wisdomPacket, setWisdomPacket] = useState<WisdomPacket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentLoaded, setContentLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && coordinate) {
      fetchWisdomPacket();
    }
  }, [isOpen, coordinate]);

  useEffect(() => {
    if (wisdomPacket) {
      // Delay to create smooth fade-in
      setTimeout(() => setContentLoaded(true), 100);
    } else {
      setContentLoaded(false);
    }
  }, [wisdomPacket]);

  const fetchWisdomPacket = async () => {
    setLoading(true);
    setError(null);
    setContentLoaded(false);

    try {
      const response = await fetch('http://localhost:8000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetWisdomPacket($coordinate: String!, $depth: Int) {
              getWisdomPacket(coordinate: $coordinate, depth: $depth) {
                centralNode {
                  coordinate
                  name
                  subsystem
                  description
                  operationalEssence
                }
                keyConcepts {
                  concept
                  sourceCoordinates
                  relevanceScore
                  description
                }
                narrativeSummary
                contextualThemes
                apophaticPointers {
                  missingTheme
                  expectedCoordinates
                  suggestion
                }
                synthesisScore
                generatedAt
                cacheHit
                depth
              }
            }
          `,
          variables: {
            coordinate,
            depth: 2
          }
        })
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      setWisdomPacket(result.data?.getWisdomPacket || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wisdom packet');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-purple-50">
          <div className="flex items-center gap-3">
            <div className="text-2xl">✨</div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Wisdom Packet</h2>
              {wisdomPacket && (
                <p className="text-xs text-gray-600 font-mono">
                  {wisdomPacket.centralNode.coordinate} · {wisdomPacket.centralNode.name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-white rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4" />
              <div className="text-sm text-gray-600">Synthesizing wisdom packet...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-800 font-medium mb-2">Failed to load wisdom packet</div>
              <div className="text-xs text-red-600 mb-3">{error}</div>
              <button
                onClick={fetchWisdomPacket}
                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {wisdomPacket && (
            <div
              className={cn(
                'transition-opacity duration-500 ease-in-out space-y-6',
                contentLoaded ? 'opacity-100' : 'opacity-0'
              )}
            >
              {/* Cache Hit Indicator */}
              {wisdomPacket.cacheHit && (
                <div className="text-xs text-green-600 flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded border border-green-200 w-fit">
                  <span>⚡</span>
                  <span>Cached result (instant retrieval)</span>
                </div>
              )}

              {/* Operational Essence */}
              {wisdomPacket.centralNode.operationalEssence && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-xs font-medium text-purple-800 mb-2">Operational Essence</div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {wisdomPacket.centralNode.operationalEssence}
                  </div>
                </div>
              )}

              {/* Narrative Summary */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-5">
                <div className="text-xs font-medium text-purple-800 mb-3 uppercase tracking-wide">
                  Narrative Synthesis
                </div>
                <div className="text-base text-gray-800 leading-relaxed">
                  {wisdomPacket.narrativeSummary}
                </div>
              </div>

              {/* Key Concepts */}
              {wisdomPacket.keyConcepts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Key Concepts ({wisdomPacket.keyConcepts.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {wisdomPacket.keyConcepts.map((concept, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-sm text-purple-700">{concept.concept}</div>
                          <div className={cn(
                            'text-xs font-bold px-2 py-0.5 rounded',
                            concept.relevanceScore >= 0.8 ? 'bg-green-100 text-green-700' :
                            concept.relevanceScore >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          )}>
                            {(concept.relevanceScore * 100).toFixed(0)}%
                          </div>
                        </div>
                        {concept.description && (
                          <div className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                            {concept.description}
                          </div>
                        )}
                        <div className="text-[10px] text-gray-500 mt-2">
                          Sources: {concept.sourceCoordinates.slice(0, 3).join(', ')}
                          {concept.sourceCoordinates.length > 3 && ` +${concept.sourceCoordinates.length - 3} more`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contextual Themes */}
              {wisdomPacket.contextualThemes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Contextual Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {wisdomPacket.contextualThemes.map((theme, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                      >
                        {theme}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apophatic Pointers */}
              {wisdomPacket.apophaticPointers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Apophatic Pointers (Missing Themes)
                  </h3>
                  <div className="space-y-2">
                    {wisdomPacket.apophaticPointers.map((pointer, idx) => (
                      <details
                        key={idx}
                        className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                      >
                        <summary className="cursor-pointer text-sm font-medium text-amber-800 hover:text-amber-900">
                          ⚠ {pointer.missingTheme}
                        </summary>
                        <div className="mt-3 space-y-2">
                          <div className="text-xs text-gray-700">
                            <span className="font-medium">Suggestion:</span> {pointer.suggestion}
                          </div>
                          <div className="text-[10px] text-gray-600">
                            Expected coordinates: {pointer.expectedCoordinates.join(', ')}
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {wisdomPacket && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <div>
                <span className="font-medium">Synthesis Score:</span>{' '}
                <span className="font-mono font-bold text-purple-600">
                  {(wisdomPacket.synthesisScore * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="font-medium">Depth:</span>{' '}
                <span className="font-mono">{wisdomPacket.depth}</span>
              </div>
            </div>
            <div className="text-[10px] text-gray-500">
              Generated: {new Date(wisdomPacket.generatedAt).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
