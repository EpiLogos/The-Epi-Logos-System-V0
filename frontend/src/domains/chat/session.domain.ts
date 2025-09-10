/**
 * Chat Session Domain Logic
 * Pure functions for session management and state transitions
 * 
 * EXTRACTED FROM: chat/page.tsx:49-60, simple-chat.tsx:29-37
 * Zero React dependencies - pure TypeScript functions only
 */

import { ChatMessage } from './message.domain';

export interface ChatSession {
  threadId: string | null;
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  config: {
    persona: string;
    model: string;
    streamingEnabled: boolean;
  };
}

export interface SessionStatus {
  session_id: string;
  model_name: string;
  active_persona: string;
  system_hash: string;
  streaming_enabled: boolean;
  stream_timeout: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  available: boolean;
  ready?: boolean;
}

// Pure session creation functions
export const createSession = (config: ChatSession['config']): ChatSession => ({
  threadId: null,
  sessionId: null,
  messages: [],
  isLoading: false,
  error: null,
  config
});

export const createDefaultSession = (): ChatSession => 
  createSession({
    persona: 'system',
    model: '',
    streamingEnabled: true
  });

// Pure session state transitions
export const addMessage = (session: ChatSession, message: ChatMessage): ChatSession => ({
  ...session,
  messages: [...session.messages, message]
});

export const addMessages = (session: ChatSession, newMessages: ChatMessage[]): ChatSession => ({
  ...session,
  messages: [...session.messages, ...newMessages]
});

export const updateLastMessage = (
  session: ChatSession,
  updater: (msg: ChatMessage) => ChatMessage
): ChatSession => {
  if (session.messages.length === 0) return session;
  
  return {
    ...session,
    messages: [
      ...session.messages.slice(0, -1),
      updater(session.messages[session.messages.length - 1])
    ]
  };
};

export const replaceMessage = (
  session: ChatSession,
  messageId: string,
  newMessage: ChatMessage
): ChatSession => ({
  ...session,
  messages: session.messages.map(msg => 
    msg.id === messageId ? newMessage : msg
  )
});

export const removeMessage = (session: ChatSession, messageId: string): ChatSession => ({
  ...session,
  messages: session.messages.filter(msg => msg.id !== messageId)
});

// Session loading state management
export const setLoading = (session: ChatSession, loading: boolean): ChatSession => ({
  ...session,
  isLoading: loading
});

// Session error management
export const setError = (session: ChatSession, error: string | null): ChatSession => ({
  ...session,
  error
});

export const clearError = (session: ChatSession): ChatSession => ({
  ...session,
  error: null
});

// Session configuration updates
export const updateConfig = (session: ChatSession, configUpdates: Partial<ChatSession['config']>): ChatSession => ({
  ...session,
  config: {
    ...session.config,
    ...configUpdates
  }
});

export const switchPersona = (session: ChatSession, persona: string): ChatSession =>
  updateConfig(session, { persona });

export const switchModel = (session: ChatSession, model: string): ChatSession =>
  updateConfig(session, { model });

export const toggleStreaming = (session: ChatSession): ChatSession =>
  updateConfig(session, { streamingEnabled: !session.config.streamingEnabled });

export const setStreamingEnabled = (session: ChatSession, enabled: boolean): ChatSession =>
  updateConfig(session, { streamingEnabled: enabled });

// Session reset operations
export const clearMessages = (session: ChatSession): ChatSession => ({
  ...session,
  threadId: null,
  sessionId: null,
  messages: [],
  error: null
});

export const resetSession = (session: ChatSession): ChatSession => ({
  ...session,
  threadId: null,
  sessionId: null,
  messages: [],
  isLoading: false,
  error: null
});

// Session identification
export const setThreadId = (session: ChatSession, threadId: string): ChatSession => ({
  ...session,
  threadId
});

export const setSessionId = (session: ChatSession, sessionId: string): ChatSession => ({
  ...session,
  sessionId
});

export const generateThreadId = (): string => 
  `thread-${Date.now()}`;

export const generateRunId = (): string => 
  `run-${Date.now()}`;

// Session validation and queries
export const hasMessages = (session: ChatSession): boolean => 
  session.messages.length > 0;

export const hasError = (session: ChatSession): boolean => 
  session.error !== null;

export const isSessionActive = (session: ChatSession): boolean => 
  session.threadId !== null;

export const getSessionMessageCount = (session: ChatSession): number =>
  session.messages.length;

export const getLastSessionMessage = (session: ChatSession): ChatMessage | null =>
  session.messages.length > 0 ? session.messages[session.messages.length - 1] : null;

export const canSendMessage = (session: ChatSession, input: string): boolean =>
  !session.isLoading && input.trim().length > 0;

// Model management helpers
export const getAvailableModels = (models: ModelInfo[]): ModelInfo[] =>
  models.filter(model => model.available);

export const getReadyModels = (models: ModelInfo[]): ModelInfo[] =>
  models.filter(model => model.ready !== false);

export const findModel = (models: ModelInfo[], modelId: string): ModelInfo | null =>
  models.find(model => model.id === modelId) || null;

export const getDefaultModel = (models: ModelInfo[]): ModelInfo | null => {
  const available = getAvailableModels(models);
  return available.length > 0 ? available[0] : null;
};

// Session state queries for UI
export const getSessionDisplayInfo = (session: ChatSession) => ({
  messageCount: getSessionMessageCount(session),
  currentPersona: session.config.persona,
  currentModel: session.config.model,
  threadId: session.threadId ? session.threadId.substring(0, 12) + '...' : 'New',
  sessionId: session.sessionId ? session.sessionId.substring(0, 8) + '...' : 'Pending',
  hasError: hasError(session),
  isLoading: session.isLoading,
  streamingEnabled: session.config.streamingEnabled
});