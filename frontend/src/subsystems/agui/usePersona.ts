/**
 * Persona Orchestration Hook
 * Orchestrates persona domain logic with React state management
 * 
 * INTEGRATES: domains/agui/persona.domain.ts with React state and effects
 * 
 * This hook is the ONLY layer that imports both domain logic and React.
 * Components consume this hook and are "dumb" presentation layers.
 */

import { useState, useCallback, useReducer } from 'react';
import {
  createInitialAGUIState,
  updatePersonaStatus,
  setActivePersona,
  setCurrentCoordinate,
  setConnectionStatus,
  setSessionActive,
  getPersonaById,
  getPersonaByCoordinate,
  getActivePersonas,
  getPersonasByStatus,
  hasActivePersonas,
  personaExists,
  isValidStatusTransition,
  getPersonaStatusPriority,
  sortPersonasByPriority,
  type PersonaState,
  type AGUIState,
  type PersonaStatus,
  type ConnectionStatus
} from '@/domains/agui/persona.domain';

// Reducer for managing AGUI state using domain logic
type AGUIAction =
  | { type: 'SET_ACTIVE_PERSONA'; payload: string }
  | { type: 'UPDATE_PERSONA_STATUS'; payload: { id: string; status: PersonaStatus } }
  | { type: 'SET_COORDINATE'; payload: string }
  | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'SET_SESSION_ACTIVE'; payload: boolean };

const aguiReducer = (state: AGUIState, action: AGUIAction): AGUIState => {
  switch (action.type) {
    case 'SET_ACTIVE_PERSONA':
      return setActivePersona(state, action.payload);
    
    case 'UPDATE_PERSONA_STATUS':
      return {
        ...state,
        personas: updatePersonaStatus(state.personas, action.payload.id, action.payload.status)
      };
    
    case 'SET_COORDINATE':
      return setCurrentCoordinate(state, action.payload);
    
    case 'SET_CONNECTION_STATUS':
      return setConnectionStatus(state, action.payload);
    
    case 'SET_SESSION_ACTIVE':
      return setSessionActive(state, action.payload);
    
    default:
      return state;
  }
};

export interface UsePersonaReturn {
  state: AGUIState;
  setActivePersona: (persona: string) => boolean;
  updatePersonaStatus: (id: string, status: PersonaStatus) => boolean;
  navigateToCoordinate: (coordinate: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  activateSession: () => void;
  deactivateSession: () => void;
  getPersonaById: (id: string) => PersonaState | null;
  getPersonaByCoordinate: (coordinate: string) => PersonaState | null;
  getActivePersonas: () => PersonaState[];
  getPersonasByStatus: (status: PersonaStatus) => PersonaState[];
  hasActivePersonas: () => boolean;
  getSortedPersonas: () => PersonaState[];
}

export const usePersona = (): UsePersonaReturn => {
  const [state, dispatch] = useReducer(aguiReducer, createInitialAGUIState());

  const handleSetActivePersona = useCallback((persona: string): boolean => {
    // Validate persona exists using domain logic
    if (!personaExists(state.personas, persona)) {
      console.warn(`Persona '${persona}' does not exist`);
      return false;
    }

    dispatch({ type: 'SET_ACTIVE_PERSONA', payload: persona });
    return true;
  }, [state.personas]);

  const handleUpdatePersonaStatus = useCallback((id: string, status: PersonaStatus): boolean => {
    // Validate persona exists
    const persona = getPersonaById(state.personas, id);
    if (!persona) {
      console.warn(`Persona '${id}' does not exist`);
      return false;
    }

    // Validate status transition using domain logic
    if (!isValidStatusTransition(persona.status, status)) {
      console.warn(`Invalid status transition for persona '${id}': ${persona.status} -> ${status}`);
      return false;
    }

    dispatch({ type: 'UPDATE_PERSONA_STATUS', payload: { id, status } });
    return true;
  }, [state.personas]);

  const handleNavigateToCoordinate = useCallback((coordinate: string) => {
    dispatch({ type: 'SET_COORDINATE', payload: coordinate });
  }, []);

  const handleSetConnectionStatus = useCallback((status: ConnectionStatus) => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: status });
  }, []);

  const handleActivateSession = useCallback(() => {
    dispatch({ type: 'SET_SESSION_ACTIVE', payload: true });
  }, []);

  const handleDeactivateSession = useCallback(() => {
    dispatch({ type: 'SET_SESSION_ACTIVE', payload: false });
  }, []);

  const getPersonaByIdWrapper = useCallback((id: string): PersonaState | null => {
    return getPersonaById(state.personas, id);
  }, [state.personas]);

  const getPersonaByCoordinateWrapper = useCallback((coordinate: string): PersonaState | null => {
    return getPersonaByCoordinate(state.personas, coordinate);
  }, [state.personas]);

  const getActivePersonasWrapper = useCallback((): PersonaState[] => {
    return getActivePersonas(state.personas);
  }, [state.personas]);

  const getPersonasByStatusWrapper = useCallback((status: PersonaStatus): PersonaState[] => {
    return getPersonasByStatus(state.personas, status);
  }, [state.personas]);

  const hasActivePersonasWrapper = useCallback((): boolean => {
    return hasActivePersonas(state.personas);
  }, [state.personas]);

  const getSortedPersonas = useCallback((): PersonaState[] => {
    const allPersonas = Object.values(state.personas);
    return sortPersonasByPriority(allPersonas);
  }, [state.personas]);

  const value: UsePersonaReturn = {
    state,
    setActivePersona: handleSetActivePersona,
    updatePersonaStatus: handleUpdatePersonaStatus,
    navigateToCoordinate: handleNavigateToCoordinate,
    setConnectionStatus: handleSetConnectionStatus,
    activateSession: handleActivateSession,
    deactivateSession: handleDeactivateSession,
    getPersonaById: getPersonaByIdWrapper,
    getPersonaByCoordinate: getPersonaByCoordinateWrapper,
    getActivePersonas: getActivePersonasWrapper,
    getPersonasByStatus: getPersonasByStatusWrapper,
    hasActivePersonas: hasActivePersonasWrapper,
    getSortedPersonas
  };

  return value;
};