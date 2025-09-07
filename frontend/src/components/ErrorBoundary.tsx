"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary Component for Service Validation
 * 
 * Handles errors in service initialization and provides
 * user-friendly fallback UI for configuration issues.
 * 
 * Implements error handling requirements for Story 00.02.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = () => {
    // Reset error state and reload
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ServiceErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Service-specific Error Fallback Component
 */
interface ServiceErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  onReload: () => void;
}

const ServiceErrorFallback: React.FC<ServiceErrorFallbackProps> = ({
  error,
  errorInfo,
  onReload
}) => {
  const isServiceError = error?.message?.includes('service') || 
                        error?.message?.includes('health') ||
                        error?.message?.includes('connection');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg border border-red-500/20 p-6 shadow-xl">
        {/* Error Icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full">
          <svg 
            className="w-8 h-8 text-red-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        {/* Error Title */}
        <h1 className="text-xl font-bold text-white text-center mb-2">
          {isServiceError ? 'Service Configuration Error' : 'Application Error'}
        </h1>

        {/* Error Description */}
        <p className="text-gray-300 text-center mb-6 text-sm leading-relaxed">
          {isServiceError 
            ? 'There was an issue connecting to the Epi-Logos services. Please check your configuration and try again.'
            : 'An unexpected error occurred. Please reload the application to continue.'
          }
        </p>

        {/* Error Details (in development) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 bg-gray-800 rounded p-3">
            <summary className="text-yellow-400 text-sm cursor-pointer mb-2">
              Error Details (Development)
            </summary>
            <pre className="text-xs text-red-400 overflow-auto max-h-32">
              {error.message}
              {errorInfo?.componentStack && (
                <>
                  {'\n\nComponent Stack:'}
                  {errorInfo.componentStack}
                </>
              )}
            </pre>
          </details>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onReload}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Reload Application
          </button>
          
          {isServiceError && (
            <button
              onClick={() => window.open('/docs', '_blank')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium py-2 px-4 rounded-md transition-colors"
            >
              View Documentation
            </button>
          )}
        </div>

        {/* Service Status Links */}
        {isServiceError && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center mb-2">
              Check service status:
            </p>
            <div className="flex justify-center space-x-4 text-xs">
              <a
                href="http://localhost:8000/api/health/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Backend
              </a>
              <a 
                href="http://localhost:8001/health" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Agentic
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Higher-order component for wrapping components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Service Health Error Boundary
 * 
 * Specialized error boundary for service health monitoring
 */
export const ServiceHealthErrorBoundary: React.FC<{ children: ReactNode }> = ({ 
  children 
}) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log service-specific error information
        console.error('Service Health Error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        });
      }}
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">
              Service Health Check Failed
            </h2>
            <p className="text-gray-300 mb-4">
              Unable to monitor service health. Check your configuration.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * THREE.js Error Boundary
 *
 * Specialized error boundary for THREE.js components and WebGL errors
 */
export const ThreeErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log THREE.js specific error information
        console.error('THREE.js Error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          webglSupport: !!window.WebGLRenderingContext
        });
      }}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-gray-900 border border-gray-700 rounded-lg">
          <div className="text-white text-lg font-semibold mb-2">
            3D Scene Error
          </div>
          <div className="text-gray-300 text-sm mb-4 text-center max-w-md">
            There was an issue loading the 3D scene. This might be due to WebGL compatibility or resource loading issues.
          </div>
          <div className="text-gray-400 text-xs mb-4">
            Try refreshing the page or check your browser's WebGL support.
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Reload Scene
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Navigation Error Boundary
 *
 * Specialized error boundary for navigation components
 */
export const NavigationErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Navigation Error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        });
      }}
      fallback={
        <div className="w-full bg-red-900/20 border-b border-red-500/30 p-4">
          <div className="text-red-400 text-sm">
            Navigation error - please refresh the page
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;