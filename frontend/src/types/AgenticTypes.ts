/**
 * Agentic layer and AI system type definitions
 */

// Tool and capability types
export interface AgenticTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  required: string[];
  category: 'search' | 'analysis' | 'synthesis' | 'communication' | 'data';
}

export interface ToolExecution {
  toolName: string;
  parameters: Record<string, any>;
  result?: any;
  error?: string;
  executionTime: number;
  timestamp: string;
}

// Context and memory types
export interface AgenticContext {
  sessionId: string;
  userId?: string;
  currentPersona: PersonaId;
  conversationHistory: ConversationTurn[];
  workingMemory: Record<string, any>;
  longTermMemory?: string[]; // References to stored memories
  goals: string[];
  constraints: string[];
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  persona?: PersonaId;
  timestamp: string;
  metadata?: {
    toolsUsed?: string[];
    confidence?: number;
    processingTime?: number;
  };
}

// Decision and reasoning types
export interface ReasoningStep {
  step: number;
  type: 'observation' | 'thought' | 'action' | 'reflection';
  content: string;
  confidence?: number;
}

export interface Decision {
  id: string;
  context: string;
  options: DecisionOption[];
  selectedOption: string;
  reasoning: ReasoningStep[];
  confidence: number;
  timestamp: string;
}

export interface DecisionOption {
  id: string;
  description: string;
  pros: string[];
  cons: string[];
  score: number;
  feasibility: number;
}
