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

import { useCallback, useState } from 'react';
import { useThreads, type UseThreadsConfig, type UseThreadsReturn } from './useThreads';
import { DEFAULT_ENDPOINTS, createRequestConfig, parseAPIResponse } from '@/domains/chat/api.domain';

export interface UseEtymologyThreadsConfig extends Omit<UseThreadsConfig, 'endpoints'> {
  endpoints?: Partial<typeof DEFAULT_ENDPOINTS>;
}

export interface UseEtymologyThreadsReturn extends Omit<UseThreadsReturn, 'createThread'> {
  createThread: () => Promise<string | null>;
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
   * Create Etymology Session → Thread → Link them
   *
   * PROPER FLOW:
   * 1. POST /api/graphiti/etymology/sessions - Creates Etymology Session
   * 2. POST /api/graphiti/etymology/sessions/{session_id}/threads - Links thread to session
   * 3. Returns thread_id for chat + stores session_id for polling
   */
  const createEtymologyThread = useCallback(async () => {
    try {
      // Step 1: Create Etymology Session
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

      const sessionId = sessionData.session?.session_id;
      if (!sessionId) {
        throw new Error('No session_id returned from session creation');
      }

      console.log('✅ Created Etymology Session:', sessionId);
      setCurrentSessionId(sessionId);

      // Step 2: Create Thread linked to this session
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

      // Step 3: Set Redis metadata for context injection
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

      // Step 4: Reload threads to show new thread in sidebar
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
