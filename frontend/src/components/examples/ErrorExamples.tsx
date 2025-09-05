/**
 * Error Components Examples
 * Demonstrates all three error component types in action
 */

import React, { useState } from 'react';
import { 
  useErrorToast, 
  SystemErrorDialog, 
  ErrorBoundary, 
  useErrorBoundary 
} from '@/components/errors';
import { FormWithErrors } from './FormWithErrors';
import { createAPIError, createSystemError } from '@/utils/errors';

const ErrorGeneratorComponent: React.FC = () => {
  const errorToast = useErrorToast();
  const { error: boundaryError, captureError, resetError } = useErrorBoundary();
  const [showSystemDialog, setShowSystemDialog] = useState(false);
  const [systemError, setSystemError] = useState<import('@/types/errors').SystemError | null>(null);

  const triggerAPIError = () => {
    const apiError = createAPIError(
      'Failed to save your changes',
      500,
      '/api/user/profile',
      true
    );

    errorToast.showErrorToast(
      apiError,
      () => {
        console.log('Retrying API call...');
        errorToast.dismissToast(apiError.id);
      }
    );
  };

  const triggerNetworkError = () => {
    const networkError = createAPIError(
      'Network connection lost',
      0,
      undefined,
      true
    );
    networkError.type = 'network';
    
    errorToast.showErrorToast(
      networkError,
      () => {
        console.log('Checking network connection...');
        errorToast.dismissToast(networkError.id);
      },
      { autoHideDelay: 10000 } // Longer delay for network errors
    );
  };

  const triggerSystemError = () => {
    const sysError = createSystemError(
      'Database connection failed unexpectedly',
      'DB_CONNECTION_ERROR'
    );
    
    setSystemError(sysError);
    setShowSystemDialog(true);
  };

  const triggerJSError = () => {
    // This will be caught by ErrorBoundary
    const error = new Error('Simulated JavaScript error in component');
    captureError(error);
  };

  const triggerCriticalError = () => {
    // Simulate critical error that crashes component
    throw new Error('Critical component error - this should be caught by ErrorBoundary');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Error Component Examples
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={triggerAPIError}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Trigger API Error Toast
          </button>

          <button
            onClick={triggerNetworkError}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
          >
            Trigger Network Error
          </button>

          <button
            onClick={triggerSystemError}
            className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-md transition-colors"
          >
            Show System Error Dialog
          </button>

          <button
            onClick={triggerJSError}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
          >
            Trigger JS Error (Hook)
          </button>

          <button
            onClick={triggerCriticalError}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-md transition-colors"
          >
            Trigger Critical Error
          </button>

          <button
            onClick={() => errorToast.clearAllToasts()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
          >
            Clear All Toasts
          </button>
        </div>

        {/* Show error boundary error if present */}
        {boundaryError && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-medium">
              Error caught by useErrorBoundary hook:
            </p>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">
              {boundaryError.message}
            </p>
            <button
              onClick={resetError}
              className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
            >
              Reset Error
            </button>
          </div>
        )}
      </div>

      {/* Form with validation errors example */}
      <FormWithErrors />

      {/* System Error Dialog */}
      {systemError && (
        <SystemErrorDialog
          error={systemError}
          isOpen={showSystemDialog}
          onClose={() => setShowSystemDialog(false)}
          onRetry={() => {
            console.log('Retrying system operation...');
            setShowSystemDialog(false);
            setSystemError(null);
          }}
          onSupport={() => {
            console.log('Opening support with error:', systemError.supportId);
          }}
        />
      )}
    </div>
  );
};

// Component that might crash (for ErrorBoundary demo) - currently unused but kept for potential future use
// const CrashableComponent: React.FC<{ shouldCrash: boolean }> = ({ shouldCrash }) => {
//   if (shouldCrash) {
//     throw new Error('This component intentionally crashed!');
//   }
//   
//   return <div>This component is working fine.</div>;
// };

export const ErrorExamples: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error) => {
        console.log('ErrorBoundary caught error:', error);
      }}
    >
      <ErrorGeneratorComponent />
    </ErrorBoundary>
  );
};