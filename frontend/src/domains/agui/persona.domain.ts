/**
 * Persona Domain Logic
 * Pure functions for persona status rules and state transitions
 * 
 * EXTRACTED FROM: AGUIProvider.tsx:11-80, persona state management logic
 * 
 * This domain contains zero React dependencies and pure business logic only.
 */

export interface PersonaState {
  id: string;
  name: string;
  coordinate: string;
  status: 'active' | 'thinking' | 'responding' | 'idle';
  lastActivity?: string;
}

export interface AGUIState {
  personas: Record<string, PersonaState>;
  activePersona: string | null;
  currentCoordinate: string | null;
  sessionActive: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

export type PersonaStatus = PersonaState['status'];
export type ConnectionStatus = AGUIState['connectionStatus'];

/**
 * AGUI action types for reducer
 * EXTRACTED FROM: AGUIProvider.tsx:27-32
 */
export type AGUIAction =
  | { type: 'SET_ACTIVE_PERSONA'; payload: string }
  | { type: 'UPDATE_PERSONA_STATUS'; payload: { id: string; status: PersonaState['status'] } }
  | { type: 'SET_COORDINATE'; payload: string }
  | { type: 'SET_CONNECTION_STATUS'; payload: AGUIState['connectionStatus'] }
  | { type: 'SET_SESSION_ACTIVE'; payload: boolean };

/**
 * Initial persona definitions
 * EXTRACTED FROM: AGUIProvider.tsx:35-42
 */
export const INITIAL_PERSONAS: Record<string, PersonaState> = {
  'anuttara': { id: 'anuttara', name: 'Anuttara', coordinate: '#0', status: 'idle' },
  'paramasiva': { id: 'paramasiva', name: 'Paramasiva', coordinate: '#1', status: 'idle' },
  'parashakti': { id: 'parashakti', name: 'Parashakti', coordinate: '#2', status: 'idle' },
  'mahamaya': { id: 'mahamaya', name: 'Mahamaya', coordinate: '#3', status: 'idle' },
  'nara': { id: 'nara', name: 'Nara', coordinate: '#4', status: 'idle' },
  'epii': { id: 'epii', name: 'Epii', coordinate: '#5', status: 'idle' }
};

/**
 * Create initial AGUI state
 * EXTRACTED FROM: AGUIProvider.tsx:34-47
 */
export const createInitialAGUIState = (): AGUIState => {
  return {
    personas: { ...INITIAL_PERSONAS },
    activePersona: null,
    currentCoordinate: null,
    sessionActive: false,
    connectionStatus: 'disconnected'
  };
};

/**
 * Update persona status with timestamp
 * EXTRACTED FROM: AGUIProvider.tsx:54-66
 */
export const updatePersonaStatus = (
  personas: Record<string, PersonaState>,
  id: string,
  status: PersonaStatus
): Record<string, PersonaState> => {
  if (!personas[id]) {
    return personas;
  }

  return {
    ...personas,
    [id]: {
      ...personas[id],
      status,
      lastActivity: new Date().toISOString()
    }
  };
};

/**
 * Set active persona
 * EXTRACTED FROM: AGUIProvider.tsx:51-52
 */
export const setActivePersona = (
  state: AGUIState,
  persona: string
): AGUIState => {
  return { ...state, activePersona: persona };
};

/**
 * AGUI reducer function
 * EXTRACTED FROM: AGUIProvider.tsx:49-80
 */
export function aguiReducer(state: AGUIState, action: AGUIAction): AGUIState {
  switch (action.type) {
    case 'SET_ACTIVE_PERSONA':
      return { ...state, activePersona: action.payload };
    
    case 'UPDATE_PERSONA_STATUS':
      const { id, status } = action.payload;
      return {
        ...state,
        personas: updatePersonaStatus(state.personas, id, status)
      };
    
    case 'SET_COORDINATE':
      return { ...state, currentCoordinate: action.payload };
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    
    case 'SET_SESSION_ACTIVE':
      return { ...state, sessionActive: action.payload };
    
    default:
      return state;
  }
}

/**
 * Set current coordinate
 * EXTRACTED FROM: AGUIProvider.tsx:68-69
 */
export const setCurrentCoordinate = (
  state: AGUIState,
  coordinate: string
): AGUIState => {
  return { ...state, currentCoordinate: coordinate };
};

/**
 * Set connection status
 * EXTRACTED FROM: AGUIProvider.tsx:71-72
 */
export const setConnectionStatus = (
  state: AGUIState,
  status: ConnectionStatus
): AGUIState => {
  return { ...state, connectionStatus: status };
};

/**
 * Set session active status
 * EXTRACTED FROM: AGUIProvider.tsx:74-75
 */
export const setSessionActive = (
  state: AGUIState,
  active: boolean
): AGUIState => {
  return { ...state, sessionActive: active };
};

/**
 * Get persona by ID
 */
export const getPersonaById = (
  personas: Record<string, PersonaState>,
  id: string
): PersonaState | null => {
  return personas[id] || null;
};

/**
 * Get persona by coordinate
 */
export const getPersonaByCoordinate = (
  personas: Record<string, PersonaState>,
  coordinate: string
): PersonaState | null => {
  return Object.values(personas).find(p => p.coordinate === coordinate) || null;
};

/**
 * Get all active personas
 */
export const getActivePersonas = (
  personas: Record<string, PersonaState>
): PersonaState[] => {
  return Object.values(personas).filter(p => p.status === 'active');
};

/**
 * Get personas by status
 */
export const getPersonasByStatus = (
  personas: Record<string, PersonaState>,
  status: PersonaStatus
): PersonaState[] => {
  return Object.values(personas).filter(p => p.status === status);
};

/**
 * Check if any persona is active
 */
export const hasActivePersonas = (personas: Record<string, PersonaState>): boolean => {
  return Object.values(personas).some(p => p.status === 'active');
};

/**
 * Check if persona exists
 */
export const personaExists = (
  personas: Record<string, PersonaState>,
  id: string
): boolean => {
  return id in personas;
};

/**
 * Validate persona status transition
 */
export const isValidStatusTransition = (
  from: PersonaStatus,
  to: PersonaStatus
): boolean => {
  // Define valid status transitions
  const validTransitions: Record<PersonaStatus, PersonaStatus[]> = {
    'idle': ['active', 'thinking'],
    'active': ['thinking', 'responding', 'idle'],
    'thinking': ['responding', 'active', 'idle'],
    'responding': ['active', 'idle']
  };

  return validTransitions[from]?.includes(to) || false;
};

/**
 * Get persona status priority (for UI display order)
 */
export const getPersonaStatusPriority = (status: PersonaStatus): number => {
  const priorities = {
    'active': 4,
    'responding': 3,
    'thinking': 2,
    'idle': 1
  };
  
  return priorities[status] || 0;
};

/**
 * Sort personas by status priority
 */
export const sortPersonasByPriority = (personas: PersonaState[]): PersonaState[] => {
  return [...personas].sort((a, b) => 
    getPersonaStatusPriority(b.status) - getPersonaStatusPriority(a.status)
  );
};