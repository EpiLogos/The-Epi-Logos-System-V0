/**
 * CLI Commands Hook
 * Handles CLI command execution for chat interface
 * 
 * EXTRACTED FROM: chat/page.tsx:131-289
 * Provides CLI command functionality using domain layer
 */

import { useCallback, useState } from 'react';
import {
  createSystemMessage,
  type ChatMessage
} from '@/domains/chat/message.domain';
import {
  parseCLICommand,
  isCLICommand,
  createRequestConfig,
  parseAPIResponse,
  DEFAULT_ENDPOINTS,
  type APIEndpoints
} from '@/domains/chat/api.domain';
import { type ModelInfo } from '@/domains/chat/session.domain';

export interface UseCLICommandsConfig {
  endpoints?: Partial<APIEndpoints>;
  onModelChange?: (modelId: string) => void;
  onPersonaChange?: (persona: string) => void;
  onStreamingChange?: (enabled: boolean) => void;
  onClearMessages?: () => void;
}

export interface UseCLICommandsReturn {
  executeCommand: (commandLine: string) => Promise<ChatMessage | null>;
  isExecuting: boolean;
  error: string | null;
}

export function useCLICommands(config: UseCLICommandsConfig = {}): UseCLICommandsReturn {
  const endpoints = { ...DEFAULT_ENDPOINTS, ...config.endpoints };
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeCommand = useCallback(async (commandLine: string): Promise<ChatMessage | null> => {
    if (!isCLICommand('/' + commandLine)) return null;

    setIsExecuting(true);
    setError(null);

    try {
      const command = parseCLICommand('/' + commandLine);
      if (!command) return null;

      // Handle local commands first
      if (command.command === 'clear') {
        config.onClearMessages?.();
        return createSystemMessage('Conversation cleared');
      }

      if (command.command === 'help') {
        const helpText = `Available CLI Commands:
/help - Show this help
/models - List available models
/use <model> - Switch to a different model
/personas - List available personas  
/persona <name> - Switch to a different persona
/status - Show session status and diagnostics
/sys [prompt] - View or set system prompt override
/stream [on|off] - Toggle streaming mode
/timeout <sec> - Set streaming timeout
/clear - Clear conversation history
/config - Show current configuration
/doctor - Run system diagnostics
/persona_models - Show persona model assignments
/persona_model <persona> <model> - Set persona model`;
        
        return createSystemMessage(helpText);
      }

      // Execute remote command via CLI bridge
      const response = await fetch(endpoints.cliBridge, createRequestConfig({
        command: command.command,
        args: command.args
      }));

      const result = await parseAPIResponse(response);

      if (result.success) {
        let content = '';

        // Format response based on command type
        switch (command.command) {
          case 'models':
            if (result.data.models) {
              content = `Available Models:\n${result.data.models.map((m: ModelInfo) => 
                `${m.name} (${m.provider}) - ${m.available ? 'Ready' : 'Not Ready'}`
              ).join('\n')}\n\nDefault: ${result.data.default_model}\nCurrent: ${result.data.current_model}`;
            }
            break;

          case 'personas':
            if (result.data.personas) {
              content = `Available Personas:\n${result.data.personas.join('\n')}\n\nCurrent: ${result.data.current_persona}`;
            }
            break;

          case 'status':
            content = `Session Status:\n${Object.entries(result.data).map(([key, value]) => 
              `${key}: ${value}`
            ).join('\n')}`;
            break;

          case 'doctor':
            content = `Orchestrator Diagnostics:\n${Object.entries(result.data).map(([key, value]) => 
              `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
            ).join('\n')}`;
            break;

          case 'persona_models':
            if (result.data.assignments && result.data.validation) {
              content = `Persona Model Assignments:\n${Object.entries(result.data.assignments).map(([persona, model]) => 
                `${persona}: ${model} ${result.data.validation[persona] ? '✅' : '❌'}`
              ).join('\n')}`;
            }
            break;

          case 'use':
            if (command.args.length > 0) {
              content = `Switched to model: ${command.args[0]}`;
              config.onModelChange?.(command.args[0]);
            } else {
              content = 'Usage: /use <model>';
            }
            break;

          case 'persona':
            if (command.args.length > 0) {
              content = `Switched to persona: ${command.args[0]}`;
              config.onPersonaChange?.(command.args[0]);
            } else {
              content = 'Usage: /persona <name>';
            }
            break;

          case 'stream':
            if (command.args.length > 0) {
              const enabled = command.args[0].toLowerCase() === 'on';
              config.onStreamingChange?.(enabled);
              content = `Streaming turned ${enabled ? 'on' : 'off'}`;
            } else {
              content = 'Usage: /stream [on|off]';
            }
            break;

          default:
            content = result.data.output || `Command executed: ${command.command}`;
            break;
        }

        return createSystemMessage(content);
      } else {
        const errorMessage = `Command failed: ${result.error}`;
        setError(errorMessage);
        return createSystemMessage(errorMessage);
      }

    } catch (commandError: any) {
      const errorMessage = `Command error: ${commandError.message || 'Unknown error'}`;
      setError(errorMessage);
      return createSystemMessage(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  }, [endpoints.cliBridge, config]);

  return {
    executeCommand,
    isExecuting,
    error
  };
}