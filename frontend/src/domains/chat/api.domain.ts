/**
 * Chat API Domain Logic
 * Pure functions for API request/response handling
 * 
 * EXTRACTED FROM: chat/page.tsx:131-289, simple-chat.tsx:116-287
 * Zero React dependencies - pure TypeScript functions only
 */

import { ChatMessage, formatMessagesForAPI } from './message.domain';
import { ChatSession } from './session.domain';

export interface AGUIRequest {
  thread_id: string;
  run_id: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
  }>;
  context: any[];
  state: {
    persona: string;
    model: string;
  };
  tools: any[];
  forwarded_props: Record<string, any>;
}

export interface SimpleChatRequest {
  message: string;
  persona: string;
  model: string;
}

export interface CLICommand {
  command: string;
  args: string[];
}

export interface APIEndpoints {
  agui: string;
  simple: string;
  stream: string;
  models: string;
  sessions: string; // agentic sessions mapping
  cliBridge: string;
  backendConversations: string; // backend conversations base
}

// Default API endpoints
export const DEFAULT_ENDPOINTS: APIEndpoints = {
  agui: 'http://localhost:8001/api/v1/ag-ui/run',
  simple: '/api/dev/orchestrator/simple',
  // Stream via AG-UI + persistence wrapper to preserve native behavior
  stream: 'http://localhost:8001/api/v1/ag-ui/run-persist',
  models: '/api/dev/orchestrator/models',
  sessions: 'http://localhost:8001/api/v1/sessions',
  cliBridge: '/api/dev/orchestrator/cli-bridge',
  backendConversations: 'http://localhost:8000/api/conversations'
};

// Pure API request builders
export const buildAGUIRequest = (
  session: ChatSession,
  newMessage: ChatMessage
): AGUIRequest => ({
  thread_id: session.threadId || `thread-${crypto.randomUUID()}`,
  run_id: `run-${crypto.randomUUID()}`,
  messages: [
    ...formatMessagesForAPI(session.messages),
    formatMessagesForAPI([newMessage])[0]
  ],
  context: [],
  state: {
    persona: session.config.persona,
    model: session.config.model
  },
  tools: [],
  forwarded_props: {}
});

export const buildSimpleChatRequest = (
  message: string,
  persona: string,
  model: string
): SimpleChatRequest => ({
  message,
  persona,
  model
});

// Runner stream builder is unused; AG-UI requests built via buildAGUIRequest

// CLI command parsing
export const parseCLICommand = (input: string): CLICommand | null => {
  if (!input.startsWith('/')) return null;
  
  const parts = input.slice(1).split(' ');
  return {
    command: parts[0],
    args: parts.slice(1)
  };
};

export const isCLICommand = (input: string): boolean =>
  input.startsWith('/');

// Request configuration builders
export const createRequestConfig = (body: any, signal?: AbortSignal): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
  signal
});

export const createGetRequestConfig = (signal?: AbortSignal): RequestInit => ({
  method: 'GET',
  signal
});

// URL builders
export const buildModelsURL = (baseEndpoint: string): string =>
  `${baseEndpoint}/models`;

export const buildCapabilitiesURL = (baseEndpoint: string): string =>
  `${baseEndpoint}/capabilities`;

export const buildSessionInfoURL = (baseEndpoint: string, threadId: string): string =>
  `${baseEndpoint}/${threadId}`;

export const buildCLIBridgeURL = (baseEndpoint: string, command?: string): string => {
  const url = baseEndpoint;
  return command ? `${url}?command=${encodeURIComponent(command)}` : url;
};

// Threads endpoints (Agentic)
export const buildThreadsListURL = (backendBase: string, userId: string, limit = 50, page = 1): string =>
  `${backendBase}/threads?user_id=${encodeURIComponent(userId)}&limit=${limit}&page=${page}`;

export const buildThreadMessagesURL = (backendBase: string, threadId: string, limit = 200): string =>
  `${backendBase}/threads/${encodeURIComponent(threadId)}/messages?limit=${limit}`;

export const buildCreateThreadURL = (baseEndpoint: string): string =>
  `${baseEndpoint}/threads`;

export const buildDeleteThreadURL = (baseEndpoint: string, threadId: string): string =>
  `${baseEndpoint}/threads/${encodeURIComponent(threadId)}`;

// Response type guards and parsers
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  models?: any[];
  message?: string;
  detail?: string;
}

export const parseAPIResponse = async (response: Response): Promise<APIResponse> => {
  try {
    const data = await response.json();
    return {
      success: response.ok,
      ...data
    };
  } catch (error) {
    const text = await response.text().catch(() => 'Unknown error');
    return {
      success: false,
      error: text || `HTTP ${response.status}`
    };
  }
};

export const isSuccessResponse = (response: APIResponse): boolean =>
  response.success === true;

export const getErrorMessage = (response: APIResponse): string =>
  response.error || response.detail || response.message || 'Unknown error';

// Session info response handling
export interface SessionInfo {
  session_id: string;
  thread_id: string;
  status?: string;
}

export const parseSessionInfo = async (response: Response): Promise<SessionInfo | null> => {
  if (response.status === 404) {
    return null; // No session exists yet
  }
  
  if (!response.ok) {
    throw new Error(`Failed to fetch session info: ${response.status}`);
  }
  
  const data = await response.json();
  return {
    session_id: data.session_id,
    thread_id: data.thread_id,
    status: data.status
  };
};

// Streaming response handling
export interface StreamReader {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  decoder: TextDecoder;
}

export const createStreamReader = (response: Response): StreamReader | null => {
  if (!response.body) return null;
  
  return {
    reader: response.body.getReader(),
    decoder: new TextDecoder()
  };
};

export const readStreamChunk = async (streamReader: StreamReader): Promise<string | null> => {
  const { done, value } = await streamReader.reader.read();
  if (done) return null;
  
  return streamReader.decoder.decode(value);
};

export const closeStreamReader = (streamReader: StreamReader): void => {
  streamReader.reader.releaseLock();
};

// Error handling helpers
export const createNetworkError = (error: Error): string =>
  `Network Error: ${error.message}`;

export const createAPIError = (response: APIResponse): string =>
  `API Error: ${getErrorMessage(response)}`;

export const createTimeoutError = (): string =>
  'Request timeout';

// Request validation
export const validateChatRequest = (message: string): boolean =>
  message.trim().length > 0;

export const validateModelSelection = (modelId: string, availableModels: string[]): boolean =>
  availableModels.includes(modelId);

export const validatePersonaSelection = (persona: string, availablePersonas: string[]): boolean =>
  availablePersonas.includes(persona);

// Request timeout handling
export const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
};

export const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

// Retry logic helpers
export const shouldRetryRequest = (error: any): boolean => {
  if (error.name === 'AbortError') return false;
  if (error.message?.includes('network')) return true;
  return false;
};

export const calculateRetryDelay = (attempt: number): number =>
  Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
