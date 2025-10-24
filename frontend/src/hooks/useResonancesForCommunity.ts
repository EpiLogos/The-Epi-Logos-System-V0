/**
 * Resonances for Community Hook
 *
 * Fetches Bimba coordinate resonances for an etymology community.
 * Used by Resonance Panel to display coordinate matches and strengths.
 *
 * Story 08.07 Enhancement - Frontend Observability
 */

import { useState, useEffect, useCallback } from 'react';
import type { BimbaResonance } from '@/types/etymology.types';

export interface UseResonancesForCommunityConfig {
  communityId: string | null;
  enabled?: boolean;
}

export interface UseResonancesForCommunityReturn {
  resonances: BimbaResonance[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useResonancesForCommunity(config: UseResonancesForCommunityConfig): UseResonancesForCommunityReturn {
  const { communityId, enabled = true } = config;

  const [resonances, setResonances] = useState<BimbaResonance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResonances = useCallback(async () => {
    if (!communityId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const resp = await fetch(`/api/graphiti/etymology/resonances/${communityId}`);

      if (!resp.ok) {
        throw new Error(`Failed to fetch resonances: ${resp.statusText}`);
      }

      const data = await resp.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch resonances');
      }

      setResonances(data.resonances || []);

    } catch (e: any) {
      console.error('[useResonancesForCommunity] Error fetching resonances:', e);
      setError(e.message || 'Failed to fetch resonances');
      setResonances([]);
    } finally {
      setLoading(false);
    }
  }, [communityId, enabled]);

  useEffect(() => {
    if (communityId && enabled) {
      void fetchResonances();
    } else {
      setResonances([]);
    }
  }, [communityId, enabled, fetchResonances]);

  return {
    resonances,
    loading,
    error,
    refetch: fetchResonances
  };
}
