/**
 * Chat Integration Hook
 * Combines all chat functionality into a single comprehensive hook
 * 
 * This hook orchestrates useChat, useModels, and useCLICommands
 * to provide complete chat interface functionality
 */

import { useCallback, useEffect } from 'react';
import { useChat, type UseChatConfig } from './useChat';
import { useModels, type UseModelsConfig } from './useModels';
import { useCLICommands, type UseCLICommandsConfig } from './useCLICommands';
import { isCLICommand } from '@/domains/chat/api.domain';
import { addMessage } from '@/domains/chat/session.domain';

export interface UseChatIntegrationConfig extends UseChatConfig {
  modelsConfig?: UseModelsConfig;
  enableCLI?: boolean;
}

export interface UseChatIntegrationReturn {
  // Chat functionality
  session: ReturnType<typeof useChat>['session'];
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  
  // Model functionality
  models: ReturnType<typeof useModels>['models'];
  availableModels: ReturnType<typeof useModels>['availableModels'];
  modelsLoading: boolean;
  reloadModels: () => Promise<void>;
  
  // Current selections
  currentModel: string;
  currentPersona: string;
  streamingEnabled: boolean;
  
  // Setters
  setCurrentModel: (modelId: string) => void;
  setCurrentPersona: (persona: string) => void;
  setStreamingEnabled: (enabled: boolean) => void;
  
  // State
  isLoading: boolean;
  error: string | null;
  canSend: (input: string) => boolean;
}

export function useChatIntegration(config: UseChatIntegrationConfig): UseChatIntegrationReturn {
  const {
    persona,
    model,
    streamingEnabled,
    endpoints,
    modelsConfig,
    enableCLI = true
  } = config;

  // Initialize models first
  const {
    models,
    availableModels,
    loading: modelsLoading,
    currentModel,
    setCurrentModel,
    reloadModels
  } = useModels(modelsConfig);

  // Initialize chat with model from useModels
  const chatConfig: UseChatConfig = {
    persona,
    model: currentModel || model,
    streamingEnabled,
    endpoints
  };

  const {
    session,
    sendMessage: baseSendMessage,
    clearChat,
    updateConfig,
    isLoading,
    error,
    canSend
  } = useChat(chatConfig);

  // Initialize CLI commands
  const cliConfig: UseCLICommandsConfig = {
    endpoints,
    onModelChange: (modelId: string) => {
      setCurrentModel(modelId);
      updateConfig({ model: modelId });
    },
    onPersonaChange: (newPersona: string) => {
      updateConfig({ persona: newPersona });
    },
    onStreamingChange: (enabled: boolean) => {
      updateConfig({ streamingEnabled: enabled });
    },
    onClearMessages: clearChat
  };

  const { executeCommand } = useCLICommands(enableCLI ? cliConfig : {});

  // Enhanced send message that handles CLI commands
  const sendMessage = useCallback(async (content: string) => {
    if (enableCLI && isCLICommand(content)) {
      const commandResult = await executeCommand(content.slice(1)); // Remove leading slash
      if (commandResult) {
        // Add CLI result as system message
        const updatedSession = addMessage(session, commandResult);
        // Note: The actual session update will be handled by the CLI hook callbacks
      }
    } else {
      await baseSendMessage(content);
    }
  }, [enableCLI, executeCommand, baseSendMessage, session]);

  // Sync model changes
  useEffect(() => {
    if (currentModel && currentModel !== session.config.model) {
      updateConfig({ model: currentModel });
    }
  }, [currentModel, session.config.model, updateConfig]);

  // Convenience setters
  const setCurrentPersona = useCallback((newPersona: string) => {
    updateConfig({ persona: newPersona });
  }, [updateConfig]);

  const setStreamingEnabledHandler = useCallback((enabled: boolean) => {
    updateConfig({ streamingEnabled: enabled });
  }, [updateConfig]);

  return {
    // Chat functionality
    session,
    sendMessage,
    clearChat,
    
    // Model functionality
    models,
    availableModels,
    modelsLoading,
    reloadModels,
    
    // Current state
    currentModel,
    currentPersona: session.config.persona,
    streamingEnabled: session.config.streamingEnabled,
    
    // Setters
    setCurrentModel,
    setCurrentPersona,
    setStreamingEnabled: setStreamingEnabledHandler,
    
    // Status
    isLoading,
    error,
    canSend
  };
}