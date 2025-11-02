/**
 * Communities for Session Hook
 *
 * Fetches etymology communities associated with a session.
 * Used by QL Community Panel to display community visualizations.
 *
 * Story 08.07 Enhancement - Frontend Observability
 * Story 08.13 Enhancement - MEF Resonance Analysis
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { EtymologyCommunity, BimbaResonance, EtymologyCommunityWord } from '@/types/etymology.types';

export interface UseCommunitiesForSessionConfig {
  sessionId: string | null;
  userId: string;  // Required for group_id (multi-tenant isolation)
  enabled?: boolean;
}

export interface UseCommunitiesForSessionReturn {
  communities: EtymologyCommunity[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fetchCommunityResonances: (communityId: string) => Promise<BimbaResonance[]>;
}

export function useCommunitiesForSession(config: UseCommunitiesForSessionConfig): UseCommunitiesForSessionReturn {
  const { sessionId, userId, enabled = true } = config;

  const [communities, setCommunities] = useState<EtymologyCommunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevCommunitiesRef = useRef<EtymologyCommunity[] | null>(null);

  /**
   * Fetch Bimba resonances for a specific community
   * Story 08.13 - MEF Resonance Analysis
   */
  const fetchCommunityResonances = useCallback(async (communityId: string): Promise<BimbaResonance[]> => {
    try {
      const params = new URLSearchParams({
        group_id: userId,
        user_id: userId
      });
      const resp = await fetch(`/api/graphiti/etymology/communities/${communityId}/resonances?${params}`);

      if (!resp.ok) {
        throw new Error(`Failed to fetch resonances: ${resp.statusText}`);
      }

      const data = await resp.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch resonances');
      }

      return data.resonances || [];

    } catch (e: any) {
      console.error(`[useCommunitiesForSession] Error fetching resonances for community ${communityId}:`, e);
      throw e;
    }
  }, [userId]);

  const fetchCommunities = useCallback(async () => {
    if (!sessionId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Backend requires group_id (use userId for multi-tenant isolation)
      const params = new URLSearchParams({
        group_id: userId,
        session_id: sessionId,
        limit: '100'
      });

      const resp = await fetch(`/api/graphiti/etymology/communities?${params}`);

      if (!resp.ok) {
        throw new Error(`Failed to fetch communities: ${resp.statusText}`);
      }

      const data = await resp.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch communities');
      }

      const fetchedCommunities = data.communities || [];

      // Fetch resonances for each community and map them
      const communitiesWithResonances = await Promise.all(
        fetchedCommunities.map(async (community: EtymologyCommunity) => {
          try {
            const resonances = await fetchCommunityResonances(community.id);
            return {
              ...community,
              bimba_resonances: resonances,
              mef_resonance_count: resonances.length,
            };
          } catch (e) {
            // If resonance fetch fails, return community without resonances
            console.warn(`Failed to fetch resonances for community ${community.id}, continuing without them`);
            return community;
          }
        })
      );

      const normalizedCommunities = communitiesWithResonances.map((community) => {
        const wordNodes = Array.isArray(community.word_nodes)
          ? community.word_nodes
              .filter((node): node is EtymologyCommunityWord => Boolean(node && node.word))
              .map((node) => ({
                ...node,
                pie_root: node.pie_root ?? null,
                pie_lineage: node.pie_lineage ?? null,
                lineage: node.lineage ?? null,
                relation_descriptor: node.relation_descriptor ?? null,
                semantic_pattern: node.semantic_pattern ?? null,
                enriched_at: node.enriched_at ?? null,
                ql_position: node.ql_position ?? null
              }))
          : [];

        const words = community.words && community.words.length > 0
          ? community.words
          : wordNodes.map((node) => node.word);

        return {
          ...community,
          word_nodes: wordNodes,
          words
        } satisfies EtymologyCommunity;
      });

      const shouldUpdate = !prevCommunitiesRef.current
        || haveCommunitiesChanged(prevCommunitiesRef.current, normalizedCommunities);

      if (shouldUpdate) {
        prevCommunitiesRef.current = normalizedCommunities;
        setCommunities(normalizedCommunities);
      }

    } catch (e: any) {
      console.error('[useCommunitiesForSession] Error fetching communities:', e);
      setError(e.message || 'Failed to fetch communities');
      prevCommunitiesRef.current = null;
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, userId, enabled, fetchCommunityResonances]);

  useEffect(() => {
    if (sessionId && enabled) {
      void fetchCommunities();
    } else {
      setCommunities([]);
    }
  }, [sessionId, enabled, fetchCommunities]);

  return {
    communities,
    loading,
    error,
    refetch: fetchCommunities,
    fetchCommunityResonances
  };
}

function haveCommunitiesChanged(prev: EtymologyCommunity[], next: EtymologyCommunity[]): boolean {
  if (prev.length !== next.length) {
    return true;
  }

  for (let i = 0; i < prev.length; i += 1) {
    const prevCommunity = prev[i];
    const nextCommunity = next[i];

    if (
      prevCommunity.id !== nextCommunity.id ||
      prevCommunity.name !== nextCommunity.name ||
      prevCommunity.description !== nextCommunity.description ||
      prevCommunity.quaternal_type !== nextCommunity.quaternal_type ||
      prevCommunity.pie_root !== nextCommunity.pie_root ||
      prevCommunity.semantic_pattern !== nextCommunity.semantic_pattern ||
      prevCommunity.bimba_coordinate !== nextCommunity.bimba_coordinate ||
      prevCommunity.formed_at !== nextCommunity.formed_at ||
      prevCommunity.last_activity !== nextCommunity.last_activity
    ) {
      return true;
    }

    if (haveStringArrayChanges(prevCommunity.words, nextCommunity.words)) {
      return true;
    }

    if (haveWordNodesChanged(prevCommunity.word_nodes ?? [], nextCommunity.word_nodes ?? [])) {
      return true;
    }

    const prevResonances = prevCommunity.bimba_resonances ?? [];
    const nextResonances = nextCommunity.bimba_resonances ?? [];

    if (haveResonanceChanges(prevResonances, nextResonances)) {
      return true;
    }
  }

  return false;
}

function haveStringArrayChanges(prev: string[], next: string[]): boolean {
  if (prev.length !== next.length) {
    return true;
  }

  for (let i = 0; i < prev.length; i += 1) {
    if (prev[i] !== next[i]) {
      return true;
    }
  }

  return false;
}

function haveResonanceChanges(prev: BimbaResonance[], next: BimbaResonance[]): boolean {
  if (prev.length !== next.length) {
    return true;
  }

  for (let i = 0; i < prev.length; i += 1) {
    const prevRes = prev[i];
    const nextRes = next[i];

    if (
      prevRes.id !== nextRes.id ||
      prevRes.coordinate !== nextRes.coordinate ||
      prevRes.resonance_strength !== nextRes.resonance_strength ||
      prevRes.resonance_type !== nextRes.resonance_type ||
      prevRes.detected_at !== nextRes.detected_at
    ) {
      return true;
    }
  }

  return false;
}

function haveWordNodesChanged(prev: EtymologyCommunityWord[], next: EtymologyCommunityWord[]): boolean {
  if (prev.length !== next.length) {
    return true;
  }

  for (let i = 0; i < prev.length; i += 1) {
    const prevNode = prev[i];
    const nextNode = next[i];

    if (
      prevNode.word !== nextNode.word ||
      prevNode.pie_root !== nextNode.pie_root ||
      prevNode.pie_lineage !== nextNode.pie_lineage ||
      prevNode.lineage !== nextNode.lineage ||
      prevNode.relation_descriptor !== nextNode.relation_descriptor ||
      prevNode.semantic_pattern !== nextNode.semantic_pattern ||
      prevNode.ql_position !== nextNode.ql_position ||
      prevNode.enriched_at !== nextNode.enriched_at
    ) {
      return true;
    }
  }

  return false;
}
