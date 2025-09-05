/**
 * Events Orchestration Hook
 * Orchestrates AGUI events domain logic with React state and streaming infrastructure
 * 
 * INTEGRATES: domains/agui/events.domain.ts with React state and WebSocket streams
 * 
 * This hook is the ONLY layer that imports both domain logic and React.
 * Components consume this hook and are "dumb" presentation layers.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  processStreamEvent,
  createPersonaActivatedEvent,
  createCoordinateNavigationEvent,
  createSessionActivatedEvent,
  createSessionDeactivatedEvent,
  isValidEventData,
  extractPersonaId,
  extractCoordinate,
  filterEventsByType,
  groupEventsByPersona,
  sortEventsByPriority,
  type AGUIEventData,
  type EventProcessingResult,
  type AGUIEventType
} from '@/domains/agui/events.domain';
import type { AGUIState } from '@/domains/agui/persona.domain';

export interface EventReporter {
  reportEvent: (type: AGUIEventType, data: Record<string, any>) => void;
}

export interface UseEventsReturn {
  eventHistory: AGUIEventData[];
  reportEvent: (type: AGUIEventType, data: Record<string, any>) => void;
  processIncomingEvent: (eventData: any, currentState: AGUIState) => EventProcessingResult;
  getEventsByType: (type: string) => AGUIEventData[];
  getEventsByPersona: () => Record<string, AGUIEventData[]>;
  getSortedEvents: () => AGUIEventData[];
  clearEventHistory: () => void;
}

export const useEvents = (): UseEventsReturn => {
  const [eventHistory, setEventHistory] = useState<AGUIEventData[]>([]);
  const eventIdCounter = useRef(0);

  const reportEvent = useCallback((type: AGUIEventType, data: Record<string, any>) => {
    let eventData: { type: AGUIEventType; data: Record<string, any> };

    // Use domain logic to create properly formatted event data
    switch (type) {
      case 'PERSONA_ACTIVATED':
        eventData = createPersonaActivatedEvent(data.persona);
        break;
      case 'COORDINATE_NAVIGATION':
        eventData = createCoordinateNavigationEvent(data.coordinate, data.from || null);
        break;
      case 'SESSION_ACTIVATED':
        eventData = createSessionActivatedEvent();
        break;
      case 'SESSION_DEACTIVATED':
        eventData = createSessionDeactivatedEvent();
        break;
      default:
        eventData = { type, data };
    }

    // Create complete event with metadata
    const completeEvent: AGUIEventData = {
      event: eventData.type,
      timestamp: new Date().toISOString(),
      ...eventData.data
    };

    // Add to event history
    setEventHistory(prev => {
      const newHistory = [completeEvent, ...prev];
      // Keep only last 100 events to prevent memory leaks
      return newHistory.slice(0, 100);
    });

    // In a real implementation, this would also send to backend/streaming service
    console.debug('AGUI Event reported:', completeEvent);
  }, []);

  const processIncomingEvent = useCallback((
    eventData: any, 
    currentState: AGUIState
  ): EventProcessingResult => {
    // Validate event data using domain logic
    if (!isValidEventData(eventData)) {
      console.warn('Invalid event data received:', eventData);
      return { shouldUpdateState: false };
    }

    // Add to event history
    const completeEvent: AGUIEventData = {
      ...eventData,
      timestamp: eventData.timestamp || new Date().toISOString()
    };

    setEventHistory(prev => [completeEvent, ...prev.slice(0, 99)]);

    // Process using domain logic
    const result = processStreamEvent(eventData, currentState);
    
    if (result.shouldUpdateState) {
      console.debug('Event processed with state updates:', result);
    }

    return result;
  }, []);

  const getEventsByType = useCallback((type: string): AGUIEventData[] => {
    const typedEvents = eventHistory.map(event => ({ type: event.event, ...event }));
    return filterEventsByType(typedEvents, type);
  }, [eventHistory]);

  const getEventsByPersona = useCallback((): Record<string, AGUIEventData[]> => {
    const eventsWithPersona = eventHistory.map(event => ({
      data: { persona: extractPersonaId(event) || 'unknown' },
      ...event
    }));
    return groupEventsByPersona(eventsWithPersona);
  }, [eventHistory]);

  const getSortedEvents = useCallback((): AGUIEventData[] => {
    const typedEvents = eventHistory.map(event => ({ type: event.event, ...event }));
    return sortEventsByPriority(typedEvents);
  }, [eventHistory]);

  const clearEventHistory = useCallback(() => {
    setEventHistory([]);
  }, []);

  const value: UseEventsReturn = {
    eventHistory,
    reportEvent,
    processIncomingEvent,
    getEventsByType,
    getEventsByPersona,
    getSortedEvents,
    clearEventHistory
  };

  return value;
};