/**
 * System Error Dialog Component (Story 01.04c)
 * Modal dialog for critical system errors with support options
 */

import React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle, Copy, RotateCcw, HelpCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { SystemErrorDialogProps } from '@/types/errors';

export const SystemErrorDialog: React.FC<SystemErrorDialogProps> = ({
  error,
  isOpen,
  onClose,
  onRetry,
  onSupport
}) => {
  const copyErrorId = () => {
    navigator.clipboard.writeText(error.supportId);
    // TODO: Show brief "Copied!" feedback
  };

  const handleSupport = () => {
    const supportData = {
      errorId: error.id,
      supportId: error.supportId,
      timestamp: error.timestamp.toISOString(),
      errorCode: error.errorCode,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Pre-fill support form or email
    const subject = encodeURIComponent(`System Error: ${error.supportId}`);
    const body = encodeURIComponent(`
Error Details:
- Support ID: ${error.supportId}
- Error ID: ${error.id}
- Time: ${error.timestamp.toLocaleString()}
- Page: ${window.location.href}

Please describe what you were doing when this error occurred:


Technical Details (for support team):
${JSON.stringify(supportData, null, 2)}
    `);

    // Option 1: mailto link
    window.open(`mailto:support@epi-logos.com?subject=${subject}&body=${body}`);
    
    // Option 2: Could open support form modal instead
    onSupport?.();
  };

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={onClose}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        <AlertDialog.Content className={cn(
          'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
          'w-full max-w-md max-h-[85vh] overflow-auto',
          'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
          'rounded-lg shadow-lg p-6',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]'
        )}>
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <AlertDialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Unexpected Error
              </AlertDialog.Title>
              
              <AlertDialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {error.message}
              </AlertDialog.Description>

              {/* Error ID for support */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      Support ID
                    </p>
                    <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                      {error.supportId}
                    </p>
                  </div>
                  <button
                    onClick={copyErrorId}
                    className={cn(
                      'p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                      'hover:bg-gray-100 dark:hover:bg-gray-700 rounded',
                      'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
                      'transition-colors'
                    )}
                    title="Copy Support ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            {onRetry && (
              <AlertDialog.Action asChild>
                <button
                  onClick={onRetry}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-2',
                    'bg-blue-600 hover:bg-blue-700 text-white',
                    'rounded-md text-sm font-medium',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    'transition-colors'
                  )}
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
              </AlertDialog.Action>
            )}

            <button
              onClick={() => window.location.reload()}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2',
                'bg-gray-600 hover:bg-gray-700 text-white',
                'rounded-md text-sm font-medium',
                'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
                'transition-colors'
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>

            <button
              onClick={handleSupport}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2',
                'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300',
                'hover:bg-gray-50 dark:hover:bg-gray-800',
                'rounded-md text-sm font-medium',
                'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
                'transition-colors'
              )}
            >
              <HelpCircle className="w-4 h-4" />
              Contact Support
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Our team has been automatically notified of this error.
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

SystemErrorDialog.displayName = 'SystemErrorDialog';