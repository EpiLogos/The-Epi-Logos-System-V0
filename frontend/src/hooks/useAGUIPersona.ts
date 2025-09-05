/**
 * Hook for AG-UI Protocol integration with persona-specific routing
 */
import { useState, useCallback } from 'react';
import { SubsystemId } from '@/lib/constants/subsystems';
import { aguiService, AGUIResponse } from '@/lib/services/aguiService';

export interface UseAGUIPersonaProps {
  persona: SubsystemId;
  coordinate: number;
}

export interface PersonaMessage {
  id: string;
  content: string;
  sender: 'user' | 'persona';
  timestamp: Date;
  events?: any[];
}

export function useAGUIPersona({ persona, coordinate }: UseAGUIPersonaProps) {
  const [messages, setMessages] = useState<PersonaMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // Test connection to AG-UI service
  const testConnection = useCallback(async () => {
    try {
      await aguiService.testConnection();
      setConnected(true);
      setError(null);
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  }, []);

  // Send message to persona via AG-UI Protocol
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: PersonaMessage = {
      id: crypto.randomUUID(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Send to AG-UI Protocol backend
      const response: AGUIResponse = await aguiService.sendMessage(content, persona, coordinate);
      
      // Extract response content from AG-UI events
      const responseContent = extractResponseFromEvents(response.events, persona);
      
      // Add persona response
      const personaMessage: PersonaMessage = {
        id: crypto.randomUUID(),
        content: responseContent,
        sender: 'persona',
        timestamp: new Date(),
        events: response.events
      };
      setMessages(prev => [...prev, personaMessage]);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Add error message
      const errorMsg: PersonaMessage = {
        id: crypto.randomUUID(),
        content: `Error: ${errorMessage}`,
        sender: 'persona',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [persona, coordinate]);

  // Test persona specifically
  const testPersona = useCallback(async () => {
    const testMessage = `Test message for ${persona} persona (coordinate #${coordinate})`;
    await sendMessage(testMessage);
  }, [persona, coordinate, sendMessage]);

  // Clear message history
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    connected,
    sendMessage,
    testPersona,
    testConnection,
    clearMessages
  };
}

/**
 * Extract meaningful response content from AG-UI events
 */
function extractResponseFromEvents(events: any[], persona: SubsystemId): string {
  if (!events || events.length === 0) {
    return `No response from ${persona} persona`;
  }

  // Look for text message content events
  const contentEvents = events.filter(event => 
    event.type === 'TEXT_MESSAGE_CONTENT' || 
    event.type === 'text_message_content'
  );

  if (contentEvents.length > 0) {
    return contentEvents
      .map(event => event.data?.content || '')
      .join('')
      .trim();
  }

  // Fallback: look for any event with content
  const eventWithContent = events.find(event => 
    event.data && (event.data.content || event.data.message)
  );

  if (eventWithContent) {
    return eventWithContent.data.content || eventWithContent.data.message;
  }

  // Final fallback: generic response
  return `Received ${events.length} events from ${persona} persona`;
}