import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_ENDPOINTS,
  buildThreadsListURL,
  buildThreadMessagesURL,
  buildCreateThreadURL,
  buildDeleteThreadURL,
  createGetRequestConfig,
  createRequestConfig,
  parseAPIResponse
} from '@/domains/chat/api.domain';

export interface ThreadSummary {
  thread_id: string;
  title?: string;
  last_message?: string;
  created_at?: string;
  last_activity?: string;
  persona?: string;
  model?: string;
}

export interface UseThreadsConfig {
  userId: string;
  endpoints?: Partial<typeof DEFAULT_ENDPOINTS>;
  context?: string;  // Optional coordinate context filter (e.g., "#5-5" for etymology)
}

export interface UseThreadsReturn {
  threads: ThreadSummary[];
  loading: boolean;
  error: string | null;
  activeThreadId: string | null;
  loadThreads: () => Promise<void>;
  createThread: () => Promise<string | null>;
  selectThread: (threadId: string) => void;
  deleteThread: (threadId: string) => Promise<boolean>;
}

export function useThreads(config: UseThreadsConfig): UseThreadsReturn {
  const endpoints = { ...DEFAULT_ENDPOINTS, ...config.endpoints };
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    if (!config.userId) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        buildThreadsListURL(endpoints.backendConversations, config.userId, 50, 1, config.context),
        createGetRequestConfig()
      );
      const data = await parseAPIResponse(resp);
      if (!data.success) throw new Error(data.error || 'Failed to load threads');
      const list = (data.threads || []) as ThreadSummary[];
      setThreads(list);
      if (!activeThreadId && list.length) setActiveThreadId(list[0].thread_id);
    } catch (e: any) {
      setError(e.message || 'Failed to load threads');
    } finally {
      setLoading(false);
    }
  }, [config.userId, config.context, endpoints.backendConversations, activeThreadId]);

  const createThread = useCallback(async (): Promise<string | null> => {
    try {
      const resp = await fetch(buildCreateThreadURL(endpoints.backendConversations), createRequestConfig({ user_id: config.userId } as any));
      const data = await parseAPIResponse(resp);
      if (!data.success) throw new Error(data.error || 'Failed to create thread');
      const threadId = (data.thread_id || data.data?.thread_id) as string;
      // Optimistic add to improve perceived performance
      if (threadId) {
        setThreads(prev => [{
          thread_id: threadId,
          title: 'Untitled',
          last_message: '',
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          persona: 'system',
          model: ''
        }, ...prev]);
      }
      // Reload list and activate (reconcile)
      await loadThreads();
      if (threadId) {
        setActiveThreadId(threadId);
        // Notify chat to bind to the new thread immediately
        window.dispatchEvent(new CustomEvent('chat-select-thread', { detail: { threadId } }));
      }
      return threadId || null;
    } catch (e) {
      setError((e as any).message || 'Failed to create thread');
      return null;
    }
  }, [config.userId, endpoints.backendConversations, loadThreads]);

  const selectThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
    // Notify chat modal to load
    window.dispatchEvent(new CustomEvent('chat-select-thread', { detail: { threadId } }));
  }, []);

  const deleteThread = useCallback(async (threadId: string) => {
    try {
      const resp = await fetch(buildDeleteThreadURL(endpoints.backendConversations, threadId), { method: 'DELETE' });
      const data = await parseAPIResponse(resp);
      if (!data.success) throw new Error(data.error || 'Failed to delete thread');
      // Update list client-side
      setThreads(prev => prev.filter(t => t.thread_id !== threadId));
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        // Kick off a new chat creation to keep UX continuous
        void createThread();
      }
      return true;
    } catch (e) {
      setError((e as any).message || 'Failed to delete thread');
      return false;
    }
  }, [endpoints.backendConversations, activeThreadId, createThread]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  return { threads, loading, error, activeThreadId, loadThreads, createThread, selectThread, deleteThread };
}
