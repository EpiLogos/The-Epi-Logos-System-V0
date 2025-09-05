/**
 * Error Utilities and Classification System
 * Provides error generation, classification, and message utilities
 */

import type { BaseError, ErrorClassification } from '@/types/errors';

/**
 * Generate unique error ID
 */
export function generateErrorId(): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `EEL-${timestamp}-${random}`;
}

/**
 * Generate support ID for system errors
 */
export function generateSupportId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `SUP-${timestamp}-${random}`;
}

/**
 * Classify error and determine appropriate user response
 */
export function classifyError(error: BaseError): ErrorClassification {
  switch (error.type) {
    case 'validation':
      return {
        severity: 'low',
        userMessage: error.message,
        canRecover: true,
        suggestedActions: [
          {
            type: 'dismiss',
            label: 'Fix Input',
            handler: () => {},
            isPrimary: true
          }
        ]
      };

    case 'network':
      return {
        severity: error.severity === 'critical' ? 'high' : 'medium',
        userMessage: 'Connection issue. Please check your internet and try again.',
        canRecover: true,
        suggestedActions: [
          {
            type: 'retry',
            label: 'Retry',
            handler: () => {},
            isPrimary: true
          },
          {
            type: 'dismiss',
            label: 'Dismiss',
            handler: () => {}
          }
        ]
      };

    case 'api':
      return {
        severity: error.severity,
        userMessage: getAPIErrorMessage(error),
        canRecover: error.severity !== 'critical',
        suggestedActions: error.severity === 'critical' 
          ? [
              {
                type: 'support',
                label: 'Contact Support',
                handler: () => {},
                isPrimary: true
              }
            ]
          : [
              {
                type: 'retry',
                label: 'Try Again',
                handler: () => {},
                isPrimary: true
              }
            ]
      };

    case 'system':
      return {
        severity: 'high',
        userMessage: 'An unexpected error occurred. Our team has been notified.',
        canRecover: false,
        suggestedActions: [
          {
            type: 'reload',
            label: 'Reload Page',
            handler: () => window.location.reload(),
            isPrimary: true
          },
          {
            type: 'support',
            label: 'Contact Support',
            handler: () => {}
          }
        ]
      };

    case 'permission':
      return {
        severity: 'medium',
        userMessage: "You don't have permission to perform this action.",
        canRecover: true,
        suggestedActions: [
          {
            type: 'dismiss',
            label: 'Go Back',
            handler: () => window.history.back(),
            isPrimary: true
          }
        ]
      };

    case 'offline':
      return {
        severity: 'medium',
        userMessage: "You're offline. Some features may not work until you reconnect.",
        canRecover: true,
        suggestedActions: [
          {
            type: 'retry',
            label: 'Check Connection',
            handler: () => {},
            isPrimary: true
          }
        ]
      };

    default:
      return {
        severity: 'medium',
        userMessage: 'Something went wrong. Please try again.',
        canRecover: true,
        suggestedActions: [
          {
            type: 'retry',
            label: 'Try Again',
            handler: () => {},
            isPrimary: true
          }
        ]
      };
  }
}

/**
 * Get user-friendly API error message
 */
function getAPIErrorMessage(error: BaseError): string {
  // Default messages based on common HTTP status codes
  const statusMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'You need to log in to continue.',
    403: "You don't have permission to perform this action.",
    404: 'The requested resource could not be found.',
    409: 'This action conflicts with current data. Please refresh and try again.',
    422: 'The provided data is invalid. Please check and try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'A server error occurred. Our team has been notified.',
    502: 'Service temporarily unavailable. Please try again later.',
    503: 'Service is under maintenance. Please try again later.',
    504: 'Request timed out. Please try again.'
  };

  if ('statusCode' in error && error.statusCode && typeof error.statusCode === 'number' && error.statusCode in statusMessages) {
    return statusMessages[error.statusCode];
  }

  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Create form validation error
 */
export function createFormError(
  fieldName: string,
  message: string
): import('@/types/errors').FormValidationError {
  return {
    id: generateErrorId(),
    type: 'validation',
    severity: 'low',
    fieldName,
    message,
    timestamp: new Date()
  };
}

/**
 * Create API error
 */
export function createAPIError(
  message: string,
  statusCode?: number,
  endpoint?: string,
  canRetry: boolean = true
): import('@/types/errors').APIError {
  return {
    id: generateErrorId(),
    type: 'api',
    severity: statusCode && statusCode >= 500 ? 'high' : 'medium',
    message,
    statusCode,
    endpoint,
    canRetry,
    timestamp: new Date()
  };
}

/**
 * Create system error
 */
export function createSystemError(
  message: string,
  errorCode?: string,
  stack?: string
): import('@/types/errors').SystemError {
  return {
    id: generateErrorId(),
    type: 'system',
    severity: 'high',
    message,
    errorCode,
    stack,
    supportId: generateSupportId(),
    timestamp: new Date()
  };
}

/**
 * Privacy-preserving error logging
 */
export function logError(error: BaseError, context?: Record<string, any>): void {
  // In production, this would send to logging service
  // Only log technical details, never user data
  const logData = {
    errorId: error.id,
    type: error.type,
    severity: error.severity,
    timestamp: error.timestamp,
    message: error.message,
    context: context ? sanitizeContext(context) : undefined
  };

  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', logData);
  }

  // TODO: Send to logging service in production
  // sendToLoggingService(logData);
}

/**
 * Remove sensitive data from context before logging
 */
function sanitizeContext(context: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['password', 'token', 'authorization', 'cookie', 'session'];
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(context)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeContext(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}