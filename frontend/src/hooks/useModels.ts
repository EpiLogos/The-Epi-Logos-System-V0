/**
 * Models Management Hook
 * Handles model loading and selection state
 * 
 * EXTRACTED FROM: chat/page.tsx:77-103, simple-chat.tsx:54-99
 * Provides model management functionality using domain layer
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAvailableModels,
  getDefaultModel,
  findModel,
  type ModelInfo
} from '@/domains/chat/session.domain';
import {
  createGetRequestConfig,
  parseAPIResponse,
  DEFAULT_ENDPOINTS,
  type APIEndpoints
} from '@/domains/chat/api.domain';

export interface UseModelsConfig {
  endpoints?: Partial<APIEndpoints>;
  fallbackModels?: ModelInfo[];
}

export interface UseModelsReturn {
  models: ModelInfo[];
  availableModels: ModelInfo[];
  loading: boolean;
  error: string | null;
  currentModel: string;
  setCurrentModel: (modelId: string) => void;
  reloadModels: () => Promise<void>;
  isModelAvailable: (modelId: string) => boolean;
}

const DEFAULT_FALLBACK_MODELS: ModelInfo[] = [
  { 
    id: 'test', 
    name: 'Test Model', 
    provider: 'Local', 
    available: true 
  },
  { 
    id: 'gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash', 
    provider: 'Google', 
    available: false 
  },
  { 
    id: 'gemini-2.5-pro', 
    name: 'Gemini 2.5 Pro', 
    provider: 'Google', 
    available: false 
  }
];

export function useModels(config: UseModelsConfig = {}): UseModelsReturn {
  const endpoints = { ...DEFAULT_ENDPOINTS, ...config.endpoints };
  const fallbackModels = config.fallbackModels || DEFAULT_FALLBACK_MODELS;

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string>('');

  const loadModels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try agentic layer first (proper trilaminar architecture)
      const agenticResponse = await fetch(
        'http://localhost:8001/api/v1/orchestrator/models',
        createGetRequestConfig()
      );

      if (agenticResponse.ok) {
        const result = await parseAPIResponse(agenticResponse);
        
        if (result.success && result.models && result.models.length > 0) {
          const loadedModels = result.models.map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            provider: m.provider || 'Unknown',
            available: m.available ?? true
          }));
          
          setModels(loadedModels);
          
          // Set default model
          const defaultModel = result.default_model;
          const defaultModelObj = findModel(loadedModels, defaultModel);
          const firstAvailable = getDefaultModel(loadedModels);
          
          if (defaultModelObj && defaultModelObj.available) {
            setCurrentModel(defaultModel);
          } else if (firstAvailable) {
            setCurrentModel(firstAvailable.id);
          }
          
          console.log(`Loaded ${loadedModels.length} models from agentic layer`);
          return;
        }
      }

      // Fallback to backend endpoint
      const backendResponse = await fetch(
        endpoints.models,
        createGetRequestConfig()
      );

      if (backendResponse.ok) {
        const result = await parseAPIResponse(backendResponse);
        
        if (result.success && result.models) {
          const availableModels = result.models
            .filter((m: any) => m.available)
            .map((m: any) => ({
              id: m.id,
              name: m.name || m.id,
              provider: m.provider || 'Unknown',
              available: true
            }));
          
          setModels(availableModels);
          
          if (availableModels.length > 0) {
            setCurrentModel(availableModels[0].id);
          }
          
          console.log(`Loaded ${availableModels.length} models from backend`);
          return;
        }
      }

      // Use fallback models
      console.warn('Failed to load models from APIs, using fallback');
      setModels(fallbackModels);
      
      const defaultFallback = getDefaultModel(fallbackModels);
      if (defaultFallback) {
        setCurrentModel(defaultFallback.id);
      }

    } catch (loadError: any) {
      console.error('Failed to load models:', loadError);
      setError(loadError.message || 'Failed to load models');
      
      // Use fallback models on error
      setModels(fallbackModels);
      const defaultFallback = getDefaultModel(fallbackModels);
      if (defaultFallback) {
        setCurrentModel(defaultFallback.id);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoints.models, fallbackModels]);

  const setModelWithValidation = useCallback((modelId: string) => {
    const model = findModel(models, modelId);
    if (model && model.available) {
      setCurrentModel(modelId);
    } else {
      console.warn(`Model ${modelId} is not available`);
    }
  }, [models]);

  const isModelAvailable = useCallback((modelId: string) => {
    const model = findModel(models, modelId);
    return model?.available ?? false;
  }, [models]);

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    models,
    availableModels: getAvailableModels(models),
    loading,
    error,
    currentModel,
    setCurrentModel: setModelWithValidation,
    reloadModels: loadModels,
    isModelAvailable
  };
}