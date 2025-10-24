/**
 * Etymology Session Hook
 *
 * Polls etymology session data every 5 seconds to detect updates from async background processes.
 * Provides real-time visibility into communities created, resonances found, and words explored.
 *
 * Story 08.07 Enhancement - Frontend Observability
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { EtymologySession } from '@/types/etymology.types';

export interface UseEtymologySessionConfig {
  sessionId: string | null;
  pollingInterval?: number; // milliseconds, default 5000 (5s)
  enabled?: boolean; // default true
  inactivityTimeout?: number; // milliseconds, default 30000 (30s) - stops polling after this period of no activity
  onlyPollWhenActive?: boolean; // default false - only poll when tab/component is active
}

export interface UseEtymologySessionReturn {
  session: EtymologySession | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasUpdates: boolean; // True if session changed since last poll
  lastUpdate: Date | null;
}

export function useEtymologySession(config: UseEtymologySessionConfig): UseEtymologySessionReturn {
  const {
    sessionId,
    pollingInterval = 5000,
    enabled = true,
    inactivityTimeout = 30000, // 30 seconds default
    onlyPollWhenActive = false
  } = config;

  const [session, setSession] = useState<EtymologySession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUpdates, setHasUpdates] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const prevSessionRef = useRef<EtymologySession | null>(null);
  const isInitialMount = useRef(true);
  const lastActivityRef = useRef<number>(Date.now());
  const pollingEnabledRef = useRef<boolean>(true);

  const fetchSession = useCallback(async () => {
    if (!sessionId || !enabled) return;

    try {
      const isFirstLoad = isInitialMount.current;
      if (isFirstLoad) {
        setLoading(true);
      }

      const resp = await fetch(`/api/graphiti/etymology/sessions/${sessionId}`);

      if (!resp.ok) {
        throw new Error(`Failed to fetch session: ${resp.statusText}`);
      }

      const data = await resp.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch session');
      }

      const newSession = data.session as EtymologySession;

      // Detect updates by comparing with previous session
      if (prevSessionRef.current && !isFirstLoad) {
        const hasChanges = detectSessionChanges(prevSessionRef.current, newSession);
        if (hasChanges) {
          setHasUpdates(true);
          setLastUpdate(new Date());
        }
      }

      setSession(newSession);
      prevSessionRef.current = newSession;
      setError(null);

      if (isFirstLoad) {
        isInitialMount.current = false;
      }

    } catch (e: any) {
      console.error('[useEtymologySession] Error fetching session:', e);
      setError(e.message || 'Failed to fetch session');
    } finally {
      setLoading(false);
    }
  }, [sessionId, enabled]);

  // Initial fetch
  useEffect(() => {
    if (sessionId && enabled) {
      void fetchSession();
    }
  }, [sessionId, enabled, fetchSession]);

  // Polling with inactivity timeout and optional active-only mode
  useEffect(() => {
    if (!sessionId || !enabled || pollingInterval <= 0) return;

    const intervalId = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;

      // Check inactivity timeout
      if (timeSinceLastActivity > inactivityTimeout) {
        if (pollingEnabledRef.current) {
          console.log(`[useEtymologySession] Stopping polling after ${inactivityTimeout}ms inactivity`);
          pollingEnabledRef.current = false;
        }
        return; // Stop polling
      }

      // Check active-only mode (document visibility)
      if (onlyPollWhenActive && document.hidden) {
        return; // Skip this poll - document not visible
      }

      void fetchSession();
    }, pollingInterval);

    return () => clearInterval(intervalId);
  }, [sessionId, enabled, pollingInterval, inactivityTimeout, onlyPollWhenActive, fetchSession]);

  // Reset activity timer on session changes (user interaction)
  useEffect(() => {
    if (session) {
      lastActivityRef.current = Date.now();
      pollingEnabledRef.current = true; // Resume polling on activity
    }
  }, [session]);

  // Reset hasUpdates flag after a delay (3 seconds)
  useEffect(() => {
    if (hasUpdates) {
      const timeout = setTimeout(() => {
        setHasUpdates(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [hasUpdates]);

  return {
    session,
    loading,
    error,
    refetch: fetchSession,
    hasUpdates,
    lastUpdate
  };
}

/**
 * Detect if session data has changed between polls.
 *
 * Compares array lengths for:
 * - words_explored
 * - communities_created
 * - resonances_found
 * - pie_roots_discovered
 * - aphorisms
 */
function detectSessionChanges(prev: EtymologySession, current: EtymologySession): boolean {
  if (!prev || !current) return false;

  return (
    prev.words_explored.length !== current.words_explored.length ||
    prev.communities_created.length !== current.communities_created.length ||
    prev.resonances_found.length !== current.resonances_found.length ||
    prev.pie_roots_discovered.length !== current.pie_roots_discovered.length ||
    prev.aphorisms.length !== current.aphorisms.length ||
    prev.semantic_patterns.length !== current.semantic_patterns.length
  );
}
