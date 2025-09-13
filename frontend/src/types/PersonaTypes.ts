/**
 * Persona and agentic system type definitions
 */

// Core persona types
export type PersonaId = 'nara' | 'epii' | 'anuttara' | 'paramasiva' | 'parashakti' | 'mahamaya';

export interface Persona {
  id: PersonaId;
  name: string;
  subsystem: number;
  description: string;
  capabilities: string[];
  specializations: string[];
  active: boolean;
  version: string;
}

// Persona interaction types
export interface PersonaMessage {
  id: string;
  fromPersona: PersonaId;
  toPersona?: PersonaId; // undefined for broadcast
  content: string;
  messageType: 'request' | 'response' | 'notification' | 'broadcast';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PersonaResponse {
  id: string;
  requestId: string;
  fromPersona: PersonaId;
  content: string;
  status: 'success' | 'error' | 'partial';
  confidence?: number; // 0-1
  processingTime: number;
  timestamp: string;
}

// Workflow and orchestration types
export interface WorkflowStep {
  id: string;
  persona: PersonaId;
  action: string;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  error?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}
