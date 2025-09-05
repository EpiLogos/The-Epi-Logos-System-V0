/**
 * Events Domain Logic
 * Pure functions for event coordination logic
 * 
 * EXTRACTED FROM: AGUIProvider.tsx:118-141, event handling logic
 * 
 * This domain contains zero React dependencies and pure business logic only.
 */

import type { PersonaState, AGUIState, PersonaStatus } from './persona.domain';

export interface AGUIEventData {
  event: string;
  persona_type?: string;
  status?: PersonaStatus;
  coordinate?: string;
  from?: string | null;
  timestamp?: string;
  [key: string]: any;
}

export interface EventProcessingResult {
  shouldUpdateState: boolean;
  stateUpdates?: Partial<AGUIState>;
  sideEffects?: Array<() => void>;
}

export type AGUIEventType = 
  | 'PERSONA_ACTIVATED'
  | 'COORDINATE_NAVIGATION'
  | 'SESSION_ACTIVATED'
  | 'SESSION_DEACTIVATED'
  | 'persona_status'
  | 'coordinate_resolution'
  | 'agent_message';

/**
 * Process incoming stream events
 * EXTRACTED FROM: AGUIProvider.tsx:118-141
 */
export const processStreamEvent = (
  eventData: AGUIEventData,
  currentState: AGUIState
): EventProcessingResult => {
  const result: EventProcessingResult = {
    shouldUpdateState: false
  };

  // Handle persona status updates from backend
  if (eventData.event === 'persona_status' && eventData.persona_type && eventData.status) {
    result.shouldUpdateState = true;
    result.stateUpdates = {
      personas: {
        ...currentState.personas,
        [eventData.persona_type]: {
          ...currentState.personas[eventData.persona_type],
          status: eventData.status,
          lastActivity: new Date().toISOString()
        }
      }
    };
  }

  // Handle coordinate resolution events
  if (eventData.event === 'coordinate_resolution' && eventData.coordinate) {
    result.shouldUpdateState = true;
    result.stateUpdates = {
      currentCoordinate: eventData.coordinate
    };
  }

  return result;
};

/**
 * Create event data for persona activation
 * EXTRACTED FROM: AGUIProvider.tsx:146
 */
export const createPersonaActivatedEvent = (persona: string): { 
  type: AGUIEventType; 
  data: Record<string, any> 
} => {
  return {
    type: 'PERSONA_ACTIVATED',
    data: { persona }
  };
};

/**
 * Create event data for coordinate navigation
 * EXTRACTED FROM: AGUIProvider.tsx:155
 */
export const createCoordinateNavigationEvent = (
  coordinate: string,
  from: string | null
): { type: AGUIEventType; data: Record<string, any> } => {
  return {
    type: 'COORDINATE_NAVIGATION',
    data: { coordinate, from }
  };
};

/**
 * Create event data for session activation
 * EXTRACTED FROM: AGUIProvider.tsx:160
 */
export const createSessionActivatedEvent = (): { 
  type: AGUIEventType; 
  data: Record<string, any> 
} => {
  return {
    type: 'SESSION_ACTIVATED',
    data: {}
  };
};

/**
 * Create event data for session deactivation
 * EXTRACTED FROM: AGUIProvider.tsx:165
 */
export const createSessionDeactivatedEvent = (): { 
  type: AGUIEventType; 
  data: Record<string, any> 
} => {
  return {
    type: 'SESSION_DEACTIVATED',
    data: {}
  };
};

/**
 * Validate event data structure
 */
export const isValidEventData = (data: any): data is AGUIEventData => {
  return !!(
    data &&
    typeof data === 'object' &&
    data.event &&
    typeof data.event === 'string'
  );
};

/**
 * Extract persona ID from event data
 */
export const extractPersonaId = (eventData: AGUIEventData): string | null => {
  return eventData.persona_type || null;
};

/**
 * Extract coordinate from event data
 */
export const extractCoordinate = (eventData: AGUIEventData): string | null => {
  return eventData.coordinate || null;
};

/**
 * Create event timestamp
 */
export const createEventTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Filter events by type
 */
export const filterEventsByType = <T extends { type: string }>(
  events: T[],
  type: string
): T[] => {
  return events.filter(event => event.type === type);
};

/**
 * Group events by persona
 */
export const groupEventsByPersona = <T extends { data: { persona?: string } }>(
  events: T[]
): Record<string, T[]> => {
  return events.reduce((groups, event) => {
    const persona = event.data.persona || 'unknown';
    if (!groups[persona]) {
      groups[persona] = [];
    }
    groups[persona].push(event);
    return groups;
  }, {} as Record<string, T[]>);
};

/**
 * Get event priority for processing order
 */
export const getEventPriority = (eventType: string): number => {
  const priorities: Record<string, number> = {
    'SESSION_ACTIVATED': 10,
    'SESSION_DEACTIVATED': 10,
    'persona_status': 8,
    'coordinate_resolution': 7,
    'PERSONA_ACTIVATED': 6,
    'COORDINATE_NAVIGATION': 5,
    'agent_message': 3
  };

  return priorities[eventType] || 1;
};

/**
 * Sort events by priority
 */
export const sortEventsByPriority = <T extends { type: string }>(
  events: T[]
): T[] => {
  return [...events].sort((a, b) => 
    getEventPriority(b.type) - getEventPriority(a.type)
  );
};