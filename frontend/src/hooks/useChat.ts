/**
 * Core Chat Hook - React Orchestration Layer
 * Orchestrates domain logic with React state management
 * 
 * EXTRACTED FROM: chat/page.tsx:291-413, simple-chat.tsx:116-287
 * Provides complete chat functionality using domain layer
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createDefaultSession,
  addMessage,
  updateLastMessage,
  setLoading,
  setError,
  clearError,
  clearMessages,
  updateConfig,
  canSendMessage,
  generateThreadId,
  setThreadId,
  setSessionId,
  type ChatSession,
  type ModelInfo
} from '@/domains/chat/session.domain';
import {
  createUserMessage,
  createAssistantMessage,
  createSystemMessage,
  appendToMessage,
  parseStreamingChunk,
  updateMessageDiagnostics,
  type ChatMessage,
  type StreamingChunk
} from '@/domains/chat/message.domain';
import {
  buildAGUIRequest,
  buildSimpleChatRequest,
  buildStreamRequest,
  createRequestConfig,
  createGetRequestConfig,
  parseAPIResponse,
  createStreamReader,
  readStreamChunk,
  closeStreamReader,
  createNetworkError,
  createAPIError,
  buildSessionInfoURL,
  parseSessionInfo,
  isCLICommand,
  parseCLICommand,
  DEFAULT_ENDPOINTS,
  type APIEndpoints,
  type StreamReader
} from '@/domains/chat/api.domain';

export interface UseChatConfig {
  persona: string;
  model: string;
  streamingEnabled: boolean;
  endpoints?: Partial<APIEndpoints>;
}

export interface UseChatReturn {
  session: ChatSession;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  updateConfig: (config: Partial<UseChatConfig>) => void;
  isLoading: boolean;
  error: string | null;
  canSend: (input: string) => boolean;
}

export function useChat(initialConfig: UseChatConfig): UseChatReturn {
  const endpoints = { ...DEFAULT_ENDPOINTS, ...initialConfig.endpoints };
  
  const [session, setSession] = useState(() => 
    createDefaultSession()
  );
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch session info after thread ID is set
  const fetchSessionInfo = useCallback(async (threadId: string) => {
    try {
      const response = await fetch(
        buildSessionInfoURL(endpoints.sessions, threadId),
        createGetRequestConfig()
      );
      
      const sessionInfo = await parseSessionInfo(response);
      if (sessionInfo) {
        setSession(prev => setSessionId(prev, sessionInfo.session_id));
      }
    } catch (error) {
      console.error('Failed to fetch session info:', error);
    }
  }, [endpoints.sessions]);

  // Initialize session with config
  useEffect(() => {
    setSession(prev => updateConfig(prev, {
      persona: initialConfig.persona,
      model: initialConfig.model,
      streamingEnabled: initialConfig.streamingEnabled
    }));
  }, [initialConfig.persona, initialConfig.model, initialConfig.streamingEnabled]);

  // Handle streaming response
  const handleStreamingResponse = useCallback(async (
    response: Response, 
    assistantMessage: ChatMessage
  ) => {
    const streamReader = createStreamReader(response);
    if (!streamReader) {
      throw new Error('No stream reader available');
    }

    const start = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    let firstTokenMs: number | undefined;

    try {
      while (true) {
        const chunk = await readStreamChunk(streamReader);
        if (chunk === null) break;

        const lines = chunk.split('\n');
        for (const line of lines) {
          const parsed = parseStreamingChunk(line);
          if (parsed?.type === 'TEXT_MESSAGE_CONTENT' && parsed.delta) {
            if (firstTokenMs === undefined) {
              const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
              firstTokenMs = Math.round(now - start);
            }
            setSession(prev => updateLastMessage(prev, msg => 
              appendToMessage(msg, parsed.delta!)
            ));
          } else if (parsed?.type === 'RUN_ERROR') {
            throw new Error(parsed.message || 'Stream error');
          }
        }
      }
    } finally {
      closeStreamReader(streamReader);
      const end = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      const totalMs = Math.round(end - start);
      setSession(prev => updateLastMessage(prev, msg => ({
        ...msg,
        metadata: {
          ...msg.metadata,
          timing: {
            total_ms: totalMs,
            ...(firstTokenMs !== undefined ? { first_token_ms: firstTokenMs } : {})
          }
        }
      })));
    }
  }, []);

  // Handle non-streaming response
  const handleSimpleResponse = useCallback(async (response: Response) => {
    const result = await parseAPIResponse(response);
    
    if (!result.success) {
      throw new Error(createAPIError(result));
    }
    
    const content = result.response || result.message || 'No response received';
    setSession(prev => updateLastMessage(prev, msg => ({ 
      ...msg, 
      content,
      metadata: {
        ...msg.metadata,
        diagnostics: { sse_events: 0, sse_bytes: 0 },
        timing: { total_ms: 500 }
      }
    })));
  }, []);

  // Send message function
  const sendMessage = useCallback(async (content: string) => {
    if (!canSendMessage(session, content)) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear any existing error
    setSession(prev => clearError(prev));

    // Add user message
    const userMessage = createUserMessage(content, session.config.persona, session.config.model);
    setSession(prev => addMessage(prev, userMessage));

    // Set loading state
    setSession(prev => setLoading(prev, true));

    try {
      abortControllerRef.current = new AbortController();

      if (session.config.streamingEnabled) {
        // Generate thread ID if needed
        const currentThreadId = session.threadId || generateThreadId();
        if (!session.threadId) {
          setSession(prev => setThreadId(prev, currentThreadId));
        }

        // Create assistant message for streaming
        const assistantMessage = createAssistantMessage(session.config.persona, session.config.model);
        setSession(prev => addMessage(prev, assistantMessage));

        // Use AG-UI streaming endpoint
        const requestBody = buildAGUIRequest({ ...session, threadId: currentThreadId }, userMessage);
        const response = await fetch(endpoints.agui, createRequestConfig(
          requestBody, 
          abortControllerRef.current.signal
        ));

        if (!response.ok) {
          const result = await parseAPIResponse(response);
          throw new Error(createAPIError(result));
        }

        await handleStreamingResponse(response, assistantMessage);

        // Fetch session info after chat interaction
        setTimeout(() => fetchSessionInfo(currentThreadId), 1000);
      } else {
        // Use simple endpoint
        const requestBody = buildSimpleChatRequest(
          content,
          session.config.persona,
          session.config.model
        );
        
        const response = await fetch(endpoints.simple, createRequestConfig(
          requestBody,
          abortControllerRef.current.signal
        ));

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Create assistant message
        const assistantMessage = createAssistantMessage(session.config.persona, session.config.model);
        setSession(prev => addMessage(prev, assistantMessage));

        await handleSimpleResponse(response);
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        const errorMessage = error instanceof Error ? createNetworkError(error) : 'Unknown error';
        setSession(prev => setError(prev, errorMessage));
      }
    } finally {
      setSession(prev => setLoading(prev, false));
      abortControllerRef.current = null;
    }
  }, [session, endpoints, handleStreamingResponse, handleSimpleResponse, fetchSessionInfo]);

  // Clear chat function
  const clearChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSession(prev => clearMessages(prev));
  }, []);

  // Update configuration
  const updateChatConfig = useCallback((configUpdates: Partial<UseChatConfig>) => {
    setSession(prev => updateConfig(prev, {
      persona: configUpdates.persona || prev.config.persona,
      model: configUpdates.model || prev.config.model,
      streamingEnabled: configUpdates.streamingEnabled ?? prev.config.streamingEnabled
    }));
  }, []);

  // Check if can send message
  const canSend = useCallback((input: string) => 
    canSendMessage(session, input), [session]);

  return {
    session,
    sendMessage,
    clearChat,
    updateConfig: updateChatConfig,
    isLoading: session.isLoading,
    error: session.error,
    canSend
  };
}
