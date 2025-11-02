/**
 * Etymology Threads Hook
 *
 * CRITICAL ARCHITECTURE:
 * - Etymology SESSIONS are the top-level container (stored in MongoDB/Redis via EtymologySessionService)
 * - Threads are chat conversations linked TO a session
 * - Flow: Create Session → Create Thread → Link Thread to Session
 * - Session ID is used for polling session data (words, communities, resonances)
 * - Thread ID is used for chat messages
 */

import { useCallback, useState, useEffect } from 'react';
import { useThreads, type UseThreadsConfig, type UseThreadsReturn } from './useThreads';
import { DEFAULT_ENDPOINTS, createRequestConfig, parseAPIResponse } from '@/domains/chat/api.domain';

export interface UseEtymologyThreadsConfig extends Omit<UseThreadsConfig, 'endpoints'> {
  endpoints?: Partial<typeof DEFAULT_ENDPOINTS>;
}

export interface UseEtymologyThreadsReturn extends Omit<UseThreadsReturn, 'createThread'> {
  createThread: (existingSessionId?: string) => Promise<string | null>;
  currentSessionId: string | null;  // CRITICAL: Session ID for polling
}

export function useEtymologyThreads(config: UseEtymologyThreadsConfig): UseEtymologyThreadsReturn {
  const endpoints = { ...DEFAULT_ENDPOINTS, ...config.endpoints };
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Use base useThreads hook with context filter for #5-5 etymology threads
  const baseThreads = useThreads({
    ...config,
    endpoints,
    context: "#5-5"  // Filter threads by #5-5 context
  });

  /**
   * CRITICAL FIX: Restore session ID when thread is selected after page reload
   *
   * When user selects a thread from the sidebar, fetch that thread's session_id
   * and update currentSessionId so session data/stats/communities load properly.
   */
  useEffect(() => {
    const fetchSessionForThread = async () => {
      if (!baseThreads.activeThreadId) {
        setCurrentSessionId(null);
        return;
      }

      try {
        // Fetch thread metadata which includes session_id
        const resp = await fetch(
          `http://localhost:8000/api/graphiti/etymology/sessions/thread/${baseThreads.activeThreadId}`
        );

        if (!resp.ok) {
          console.warn(`Failed to fetch session for thread ${baseThreads.activeThreadId}`);
          return;
        }

        const data = await resp.json();

        if (data.success && data.session_id) {
          console.log(`✅ Restored session ${data.session_id} for thread ${baseThreads.activeThreadId}`);
          setCurrentSessionId(data.session_id);
        }
      } catch (e) {
        console.error('Error fetching session for thread:', e);
      }
    };

    fetchSessionForThread();
  }, [baseThreads.activeThreadId]);

  /**
   * Create Etymology Session → Thread → Link them
   *
   * PROPER FLOW:
   * Option A (New Session):
   * 1. POST /api/graphiti/etymology/sessions - Creates Etymology Session
   * 2. POST /api/graphiti/etymology/sessions/{session_id}/threads - Links thread to session
   * 3. Returns thread_id for chat + stores session_id for polling
   *
   * Option B (Existing Session):
   * 1. Generate thread_id
   * 2. POST /api/graphiti/etymology/sessions/{existing_session_id}/threads - Links thread to existing session
   * 3. Returns thread_id for chat
   */
  const createEtymologyThread = useCallback(async (existingSessionId?: string) => {
    try {
      let sessionId: string;

      if (existingSessionId) {
        // Option B: Add thread to existing session
        console.log('🔗 Adding new thread to existing session:', existingSessionId);
        sessionId = existingSessionId;
        setCurrentSessionId(sessionId);
      } else {
        // Option A: Create new Etymology Session
        const sessionResp = await fetch(
          'http://localhost:8000/api/graphiti/etymology/sessions',
          createRequestConfig({
            user_id: config.userId,
            title: `Etymology Session ${new Date().toLocaleDateString()}`,
            description: 'Etymological archaeology exploration',
            coordinate_context: '#5-5'
          })
        );

        const sessionData = await parseAPIResponse(sessionResp);
        if (!sessionData.success) {
          throw new Error(sessionData.message || 'Failed to create etymology session');
        }

        sessionId = sessionData.session?.session_id;
        if (!sessionId) {
          throw new Error('No session_id returned from session creation');
        }

        console.log('✅ Created Etymology Session:', sessionId);
        setCurrentSessionId(sessionId);
      }

      // Create Thread and link to session (both new and existing)
      const threadId = `thread-${crypto.randomUUID()}`;
      const threadResp = await fetch(
        `http://localhost:8000/api/graphiti/etymology/sessions/${sessionId}/threads?thread_id=${encodeURIComponent(threadId)}`,
        { method: 'POST' }
      );

      const threadData = await parseAPIResponse(threadResp);
      if (!threadData.success) {
        throw new Error(threadData.message || 'Failed to link thread to session');
      }

      console.log('✅ Linked Thread to Session:', { sessionId, threadId });

      // Set Redis metadata for context injection
      try {
        const metadataResp = await fetch(
          `http://localhost:8000/api/conversations/sessions/${threadId}/metadata`,
          createRequestConfig({
            context: '#5-5',  // Etymology Archaeology coordinate
            etymology_session_id: sessionId,
            coordinate_context: '#5-5'
          })
        );

        const metadataData = await parseAPIResponse(metadataResp);
        if (!metadataData.success) {
          console.warn('⚠️ Failed to set Redis metadata (non-critical):', metadataData.message);
        } else {
          console.log('✅ Set Redis metadata for thread:', threadId);
        }
      } catch (metadataError: any) {
        console.warn('⚠️ Redis metadata call failed (non-critical):', metadataError.message);
      }

      // Reload threads to show new thread in sidebar
      await baseThreads.loadThreads();

      // Return thread_id for chat binding (session_id stored in state)
      return threadId;

    } catch (e: any) {
      console.error('❌ Error creating etymology session/thread:', e.message);
      return null;
    }
  }, [config.userId, baseThreads]);

  // Override deleteThread to NOT auto-create new threads
  // (Etymology uses Sessions, not individual threads for continuity)
  const deleteThread = useCallback(async (threadId: string) => {
    try {
      const resp = await fetch(`${endpoints.backendConversations}/threads/${encodeURIComponent(threadId)}`, { method: 'DELETE' });
      const data = await parseAPIResponse(resp);
      if (!data.success) throw new Error(data.error || 'Failed to delete thread');

      // Just remove from list - DON'T auto-create like base useThreads does
      await baseThreads.loadThreads();

      return true;
    } catch (e: any) {
      console.error('Failed to delete thread:', e);
      return false;
    }
  }, [endpoints, baseThreads]);

  return {
    ...baseThreads,
    createThread: createEtymologyThread,
    deleteThread,  // Override with non-auto-creating version
    currentSessionId  // Expose session ID for useEtymologySession polling
  };
}
