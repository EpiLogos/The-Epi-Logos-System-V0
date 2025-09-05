/**
 * API Error Toast System (Story 01.04b)
 * Displays dismissible toast notifications for API errors with retry functionality
 */

import React from 'react';
import * as Toast from '@radix-ui/react-toast';
import { X, RotateCcw, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ErrorToastProps } from '@/types/errors';

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onDismiss,
  onRetry,
  config = {}
}) => {
  const {
    autoHide = true,
    autoHideDelay = 5000,
    allowDismiss = true
  } = config;

  return (
    <Toast.Root
      className={cn(
        'bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800',
        'rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]',
        'data-[state=open]:animate-slideIn data-[state=closed]:animate-slideOut',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
        'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform',
        'data-[swipe=end]:animate-swipeOut'
      )}
      duration={autoHide ? autoHideDelay : undefined}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <Toast.Title className="text-sm font-medium text-gray-900 dark:text-gray-100">
            API Error
          </Toast.Title>
          
          <Toast.Description className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {error.message}
          </Toast.Description>
          
          {error.canRetry && onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5',
                  'text-xs font-medium text-red-600 dark:text-red-400',
                  'border border-red-200 dark:border-red-700 rounded',
                  'hover:bg-red-50 dark:hover:bg-red-900/50',
                  'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
                  'transition-colors'
                )}
              >
                <RotateCcw className="h-3 w-3" />
                Retry
              </button>
            </div>
          )}
        </div>

        {allowDismiss && (
          <Toast.Close
            onClick={onDismiss}
            className={cn(
              'p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-gray-500',
              'transition-colors'
            )}
          >
            <X className="h-4 w-4 text-gray-500" />
          </Toast.Close>
        )}
      </div>
    </Toast.Root>
  );
};

ErrorToast.displayName = 'ErrorToast';