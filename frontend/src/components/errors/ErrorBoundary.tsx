/**
 * React Error Boundary for System Errors
 * Catches JavaScript errors and displays SystemErrorDialog
 */

import React, { Component, ReactNode } from 'react';
import { SystemErrorDialog } from './SystemErrorDialog';
import { createSystemError, logError } from '@/utils/errors';
import type { SystemError } from '@/types/errors';

interface ErrorBoundaryState {
  hasError: boolean;
  error: SystemError | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: SystemError; onRetry: () => void }>;
  onError?: (error: SystemError) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Create system error from JavaScript error
    const systemError = createSystemError(
      'An unexpected error occurred in the application',
      'REACT_ERROR_BOUNDARY',
      error.stack
    );

    return {
      hasError: true,
      error: systemError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.state.error) {
      // Log the error for debugging
      logError(this.state.error, {
        reactError: error.message,
        componentStack: errorInfo.componentStack,
        errorBoundary: 'SystemErrorBoundary'
      });

      // Call custom error handler if provided
      this.props.onError?.(this.state.error);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} onRetry={this.handleRetry} />;
      }

      // Default to SystemErrorDialog
      return (
        <SystemErrorDialog
          error={this.state.error}
          isOpen={true}
          onRetry={this.handleRetry}
          onSupport={() => {
            // Additional support actions can be handled here
            console.log('User requested support for:', this.state.error?.supportId);
          }}
        />
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<SystemError | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error | SystemError) => {
    let systemError: SystemError;
    
    if ('type' in error && error.type === 'system') {
      systemError = error;
    } else {
      systemError = createSystemError(
        error.message || 'An unexpected error occurred',
        'HOOK_ERROR_BOUNDARY',
        error.stack
      );
    }

    setError(systemError);
    logError(systemError, { source: 'useErrorBoundary' });
  }, []);

  return { error, resetError, captureError };
}