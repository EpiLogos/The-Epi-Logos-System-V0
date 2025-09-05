/**
 * Form Error State Management Hook
 * Manages form validation errors with automatic cleanup
 */

import { useState, useCallback } from 'react';
import type { FormValidationError } from '@/types/errors';
import { createFormError, logError } from '@/utils/errors';

export interface UseFormErrorReturn {
  errors: Map<string, FormValidationError>;
  getError: (fieldName: string) => FormValidationError | null;
  setError: (fieldName: string, message: string) => void;
  clearError: (fieldName: string) => void;
  clearAllErrors: () => void;
  hasErrors: boolean;
}

export function useFormError(): UseFormErrorReturn {
  const [errors, setErrors] = useState<Map<string, FormValidationError>>(new Map());

  const getError = useCallback((fieldName: string): FormValidationError | null => {
    return errors.get(fieldName) || null;
  }, [errors]);

  const setError = useCallback((fieldName: string, message: string) => {
    const error = createFormError(fieldName, message);
    
    setErrors(prev => {
      const next = new Map(prev);
      next.set(fieldName, error);
      return next;
    });

    // Log error for debugging (privacy-preserving)
    logError(error, { fieldName });
  }, []);

  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const next = new Map(prev);
      next.delete(fieldName);
      return next;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors(new Map());
  }, []);

  const hasErrors = errors.size > 0;

  return {
    errors,
    getError,
    setError,
    clearError,
    clearAllErrors,
    hasErrors
  };
}