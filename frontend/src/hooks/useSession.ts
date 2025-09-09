/**
 * Session Management Hook
 * Handles session info fetching and thread/session ID management
 * 
 * Separated from useChat for cleaner architecture - handles the new
 * thread_id -> session_id flow via dedicated /sessions/{thread_id} endpoint
 */

import { useCallback, useState } from 'react';
import {
  buildSessionInfoURL,
  parseSessionInfo,
  createGetRequestConfig,
  DEFAULT_ENDPOINTS,
  type APIEndpoints,
  type SessionInfo
} from '@/domains/chat/api.domain';

export interface UseSessionConfig {
  endpoints?: Partial<APIEndpoints>;
}

export interface UseSessionReturn {
  sessionInfo: SessionInfo | null;
  loading: boolean;
  error: string | null;
  fetchSessionInfo: (threadId: string) => Promise<SessionInfo | null>;
  clearSession: () => void;
}

export function useSession(config: UseSessionConfig = {}): UseSessionReturn {
  const endpoints = { ...DEFAULT_ENDPOINTS, ...config.endpoints };
  
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionInfo = useCallback(async (threadId: string): Promise<SessionInfo | null> => {
    if (!threadId) return null;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        buildSessionInfoURL(endpoints.sessions, threadId),
        createGetRequestConfig()
      );
      
      const info = await parseSessionInfo(response);
      setSessionInfo(info);
      return info;
      
    } catch (sessionError: any) {
      const errorMessage = sessionError.message || 'Failed to fetch session info';
      setError(errorMessage);
      console.error('Session fetch error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoints.sessions]);

  const clearSession = useCallback(() => {
    setSessionInfo(null);
    setError(null);
  }, []);

  return {
    sessionInfo,
    loading,
    error,
    fetchSessionInfo,
    clearSession
  };
}