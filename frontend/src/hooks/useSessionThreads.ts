/**
 * Session Threads Hook
 *
 * Fetches thread metadata for a specific Etymology Session.
 * Uses the Etymology-aware endpoint that joins session thread_ids with conversations.
 *
 * Infrastructure Fix - Step 6 Frontend Wiring
 */

import { useState, useEffect, useCallback } from 'react';

export interface SessionThread {
  thread_id: string;
  title: string;
  created_at: string | null;
  message_count: number;
}

export interface UseSessionThreadsConfig {
  sessionId: string | null;
  enabled?: boolean;
}

export interface UseSessionThreadsReturn {
  threads: SessionThread[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSessionThreads(config: UseSessionThreadsConfig): UseSessionThreadsReturn {
  const { sessionId, enabled = true } = config;

  const [threads, setThreads] = useState<SessionThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!sessionId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const resp = await fetch(
        `http://localhost:8000/api/graphiti/etymology/sessions/${sessionId}/threads`
      );

      if (!resp.ok) {
        throw new Error(`Failed to fetch threads: ${resp.statusText}`);
      }

      const data = await resp.json();

      if (!data.threads) {
        throw new Error('Invalid response format');
      }

      setThreads(data.threads || []);

    } catch (e: any) {
      console.error('[useSessionThreads] Error fetching threads:', e);
      setError(e.message || 'Failed to fetch threads');
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, enabled]);

  useEffect(() => {
    if (sessionId && enabled) {
      void fetchThreads();
    } else {
      setThreads([]);
    }
  }, [sessionId, enabled, fetchThreads]);

  return {
    threads,
    loading,
    error,
    refetch: fetchThreads
  };
}
