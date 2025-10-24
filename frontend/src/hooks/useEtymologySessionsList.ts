/**
 * Etymology Sessions List Hook
 *
 * Fetches and manages list of Etymology Sessions (NOT threads) for session history sidebar.
 * Sessions are the top-level container - each session can have multiple threads.
 */

import { useCallback, useEffect, useState } from 'react';
import type { EtymologySession } from '@/types/etymology.types';

export interface UseEtymologySessionsListConfig {
  userId: string;
  status?: 'active' | 'paused' | 'archived';
  limit?: number;
}

export interface UseEtymologySessionsListReturn {
  sessions: EtymologySession[];
  loading: boolean;
  error: string | null;
  activeSessionId: string | null;
  loadSessions: () => Promise<void>;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => Promise<boolean>;
}

export function useEtymologySessionsList(config: UseEtymologySessionsListConfig): UseEtymologySessionsListReturn {
  const { userId, status, limit = 50 } = config;
  const [sessions, setSessions] = useState<EtymologySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      // Build query params
      let url = `http://localhost:8000/api/graphiti/etymology/sessions?user_id=${encodeURIComponent(userId)}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }

      const resp = await fetch(url);
      const data = await resp.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load etymology sessions');
      }

      const sessionList = (data.sessions || []) as EtymologySession[];
      setSessions(sessionList);

      // REMOVED: No auto-selection on load
      // User must explicitly select a session to activate it
    } catch (e: any) {
      console.error('[useEtymologySessionsList] Error loading sessions:', e);
      setError(e.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [userId, status, limit]); // FIXED: Removed activeSessionId dependency

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const resp = await fetch(
        `http://localhost:8000/api/graphiti/etymology/sessions/${sessionId}`,
        { method: 'DELETE' }
      );

      const data = await resp.json();

      if (!resp.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete session');
      }

      console.log('✅ Session deleted:', sessionId);

      // Remove from list
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));

      // Clear active if this was the active session
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }

      return true;
    } catch (e: any) {
      console.error('[useEtymologySessionsList] Error deleting session:', e);
      return false;
    }
  }, [activeSessionId]);

  // Load sessions on mount and when userId changes
  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    loading,
    error,
    activeSessionId,
    loadSessions,
    selectSession,
    deleteSession
  };
}
