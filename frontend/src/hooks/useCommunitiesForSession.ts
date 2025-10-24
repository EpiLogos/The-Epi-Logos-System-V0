/**
 * Communities for Session Hook
 *
 * Fetches etymology communities associated with a session.
 * Used by QL Community Panel to display community visualizations.
 *
 * Story 08.07 Enhancement - Frontend Observability
 */

import { useState, useEffect, useCallback } from 'react';
import type { EtymologyCommunity } from '@/types/etymology.types';

export interface UseCommunitiesForSessionConfig {
  sessionId: string | null;
  enabled?: boolean;
}

export interface UseCommunitiesForSessionReturn {
  communities: EtymologyCommunity[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCommunitiesForSession(config: UseCommunitiesForSessionConfig): UseCommunitiesForSessionReturn {
  const { sessionId, enabled = true } = config;

  const [communities, setCommunities] = useState<EtymologyCommunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunities = useCallback(async () => {
    if (!sessionId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const resp = await fetch(`/api/graphiti/etymology/communities?session_id=${sessionId}&limit=100`);

      if (!resp.ok) {
        throw new Error(`Failed to fetch communities: ${resp.statusText}`);
      }

      const data = await resp.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch communities');
      }

      setCommunities(data.communities || []);

    } catch (e: any) {
      console.error('[useCommunitiesForSession] Error fetching communities:', e);
      setError(e.message || 'Failed to fetch communities');
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, enabled]);

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
    refetch: fetchCommunities
  };
}
