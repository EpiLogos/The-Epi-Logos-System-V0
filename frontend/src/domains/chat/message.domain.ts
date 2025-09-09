/**
 * Chat Message Domain Logic
 * Pure functions for message handling, validation, and transformations
 * 
 * EXTRACTED FROM: chat/page.tsx:17-31, simple-chat.tsx:12-19
 * Zero React dependencies - pure TypeScript functions only
 */

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: {
    persona?: string;
    model?: string;
    trace_id?: string;
    timing?: {
      first_token_ms?: number;
      total_ms?: number;
    };
    diagnostics?: {
      sse_events: number;
      sse_bytes: number;
    };
  };
}

export interface StreamingChunk {
  type: 'RUN_STARTED' | 'TEXT_MESSAGE_START' | 'TEXT_MESSAGE_CONTENT' | 'TEXT_MESSAGE_END' | 'RUN_FINISHED' | 'RUN_ERROR';
  messageId?: string;
  delta?: string;
  content?: string;
  threadId?: string;
  message?: string;
  error?: string;
}

// Pure message creation functions
export const createMessage = (
  content: string,
  role: ChatMessage['role'],
  metadata?: ChatMessage['metadata']
): ChatMessage => ({
  id: Date.now().toString(),
  content,
  role,
  timestamp: new Date(),
  metadata
});

export const createUserMessage = (content: string, persona: string, model: string): ChatMessage =>
  createMessage(content, 'user', { persona, model });

export const createAssistantMessage = (persona: string, model: string): ChatMessage =>
  createMessage('', 'assistant', { persona, model });

export const createSystemMessage = (content: string): ChatMessage =>
  createMessage(content, 'system');

// Pure message transformation functions
export const updateMessageContent = (
  message: ChatMessage,
  newContent: string
): ChatMessage => ({
  ...message,
  content: newContent
});

export const appendToMessage = (
  message: ChatMessage,
  delta: string
): ChatMessage => ({
  ...message,
  content: message.content + delta
});

export const updateMessageDiagnostics = (
  message: ChatMessage,
  diagnostics: ChatMessage['metadata']['diagnostics']
): ChatMessage => ({
  ...message,
  metadata: {
    ...message.metadata,
    diagnostics
  }
});

export const updateMessageTiming = (
  message: ChatMessage,
  timing: ChatMessage['metadata']['timing']
): ChatMessage => ({
  ...message,
  metadata: {
    ...message.metadata,
    timing
  }
});

// Message validation functions
export const isErrorMessage = (message: ChatMessage): boolean =>
  message.content.startsWith('Error') || 
  message.content.startsWith('Network Error') ||
  message.content.includes('failed:');

export const isEmptyMessage = (message: ChatMessage): boolean =>
  !message.content.trim();

export const isUserMessage = (message: ChatMessage): boolean =>
  message.role === 'user';

export const isAssistantMessage = (message: ChatMessage): boolean =>
  message.role === 'assistant';

export const isSystemMessage = (message: ChatMessage): boolean =>
  message.role === 'system';

// Message formatting functions
export const formatMessageForAPI = (message: ChatMessage) => ({
  id: message.id,
  role: message.role,
  content: message.content
});

export const formatMessagesForAPI = (messages: ChatMessage[]) =>
  messages.map(formatMessageForAPI);

// Streaming chunk parsing
export const parseStreamingChunk = (line: string): StreamingChunk | null => {
  if (!line.startsWith('data: ')) return null;
  
  try {
    const data = JSON.parse(line.slice(6));
    return {
      type: data.type,
      messageId: data.messageId,
      delta: data.delta,
      content: data.content,
      threadId: data.threadId,
      message: data.message,
      error: data.error
    };
  } catch {
    return null;
  }
};

// Message list operations
export const getLastMessage = (messages: ChatMessage[]): ChatMessage | null =>
  messages.length > 0 ? messages[messages.length - 1] : null;

export const getLastUserMessage = (messages: ChatMessage[]): ChatMessage | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i];
    }
  }
  return null;
};

export const getMessagesByRole = (messages: ChatMessage[], role: ChatMessage['role']): ChatMessage[] =>
  messages.filter(msg => msg.role === role);

export const getMessageCount = (messages: ChatMessage[]): number =>
  messages.length;

export const getMessageCountByRole = (messages: ChatMessage[], role: ChatMessage['role']): number =>
  messages.filter(msg => msg.role === role).length;