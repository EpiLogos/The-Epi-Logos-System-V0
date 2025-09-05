/**
 * Error Toast Provider and Context
 * Manages toast queue and provides toast functionality throughout the app
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import * as Toast from '@radix-ui/react-toast';
import { ErrorToast } from './ErrorToast';
import { cn } from '@/utils/cn';
import type { APIError, ErrorDisplayConfig } from '@/types/errors';

interface ToastItem extends APIError {
  config?: ErrorDisplayConfig;
  onRetry?: () => void | Promise<void>;
}

interface ErrorToastContextValue {
  showErrorToast: (error: APIError, onRetry?: () => void | Promise<void>, config?: ErrorDisplayConfig) => void;
  dismissToast: (errorId: string) => void;
  clearAllToasts: () => void;
}

const ErrorToastContext = createContext<ErrorToastContextValue | undefined>(undefined);

export function useErrorToast() {
  const context = useContext(ErrorToastContext);
  if (context === undefined) {
    throw new Error('useErrorToast must be used within an ErrorToastProvider');
  }
  return context;
}

interface ErrorToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ErrorToastProvider: React.FC<ErrorToastProviderProps> = ({ 
  children,
  maxToasts = 5
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showErrorToast = useCallback((
    error: APIError, 
    onRetry?: () => void | Promise<void>,
    config?: ErrorDisplayConfig
  ) => {
    const newToast: ToastItem = {
      ...error,
      config,
      onRetry
    };

    setToasts(prev => {
      const filtered = prev.filter(toast => toast.id !== error.id);
      const updated = [newToast, ...filtered];
      
      // Limit number of toasts
      return updated.slice(0, maxToasts);
    });
  }, [maxToasts]);

  const dismissToast = useCallback((errorId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== errorId));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ErrorToastContextValue = {
    showErrorToast,
    dismissToast,
    clearAllToasts
  };

  return (
    <ErrorToastContext.Provider value={contextValue}>
      <Toast.Provider swipeDirection="right">
        {children}
        
        {toasts.map((toast) => (
          <ErrorToast
            key={toast.id}
            error={toast}
            onDismiss={() => dismissToast(toast.id)}
            onRetry={toast.onRetry}
            config={toast.config}
          />
        ))}

        <Toast.Viewport
          className={cn(
            'fixed top-4 right-4 z-50',
            'flex flex-col gap-2',
            'w-[400px] max-w-[calc(100vw-2rem)]'
          )}
        />
      </Toast.Provider>
    </ErrorToastContext.Provider>
  );
};

ErrorToastProvider.displayName = 'ErrorToastProvider';