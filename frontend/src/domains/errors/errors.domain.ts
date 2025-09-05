/**
 * Errors Domain Logic
 * Pure functions for error classification and handling
 * 
 * EXTRACTED FROM: utils/errors.ts - already compliant domain logic
 * 
 * This domain contains zero React dependencies and pure business logic only.
 * NOTE: The existing errors.ts was already properly structured as domain logic.
 */

export interface BaseError {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
}

export interface FormValidationError extends BaseError {
  type: 'validation';
  fieldName: string;
}

export interface APIError extends BaseError {
  type: 'api';
  statusCode?: number;
  endpoint?: string;
  canRetry: boolean;
}

export interface SystemError extends BaseError {
  type: 'system';
  errorCode?: string;
  stack?: string;
  supportId: string;
}

export interface NetworkError extends BaseError {
  type: 'network';
}

export interface PermissionError extends BaseError {
  type: 'permission';
}

export interface OfflineError extends BaseError {
  type: 'offline';
}

export type AnyError = FormValidationError | APIError | SystemError | NetworkError | PermissionError | OfflineError;

export interface SuggestedAction {
  type: 'retry' | 'dismiss' | 'support' | 'reload';
  label: string;
  handler: () => void;
  isPrimary?: boolean;
}

export interface ErrorClassification {
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage: string;
  canRecover: boolean;
  suggestedActions: SuggestedAction[];
}

/**
 * Generate unique error ID
 * EXTRACTED FROM: utils/errors.ts:11-14
 */
export const generateErrorId = (): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `EEL-${timestamp}-${random}`;
};

/**
 * Generate support ID for system errors
 * EXTRACTED FROM: utils/errors.ts:20-23
 */
export const generateSupportId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `SUP-${timestamp}-${random}`;
};

/**
 * Get user-friendly API error message
 * EXTRACTED FROM: utils/errors.ts:160-181
 */
export const getAPIErrorMessage = (error: BaseError): string => {
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
};

/**
 * Classify error and determine appropriate user response
 * EXTRACTED FROM: utils/errors.ts:29-155
 */
export const classifyError = (error: BaseError): ErrorClassification => {
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
            handler: () => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            },
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
            handler: () => {
              if (typeof window !== 'undefined') {
                window.history.back();
              }
            },
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
};

/**
 * Create form validation error
 * EXTRACTED FROM: utils/errors.ts:186-198
 */
export const createFormError = (
  fieldName: string,
  message: string
): FormValidationError => {
  return {
    id: generateErrorId(),
    type: 'validation',
    severity: 'low',
    fieldName,
    message,
    timestamp: new Date()
  };
};

/**
 * Create API error
 * EXTRACTED FROM: utils/errors.ts:203-219
 */
export const createAPIError = (
  message: string,
  statusCode?: number,
  endpoint?: string,
  canRetry: boolean = true
): APIError => {
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
};

/**
 * Create system error
 * EXTRACTED FROM: utils/errors.ts:224-239
 */
export const createSystemError = (
  message: string,
  errorCode?: string,
  stack?: string
): SystemError => {
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
};

/**
 * Remove sensitive data from context before logging
 * EXTRACTED FROM: utils/errors.ts:267-282
 */
export const sanitizeContext = (context: Record<string, any>): Record<string, any> => {
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
};

/**
 * Privacy-preserving error logging (domain logic only)
 * EXTRACTED FROM: utils/errors.ts:244-262
 */
export const prepareErrorLog = (
  error: BaseError, 
  context?: Record<string, any>
): {
  errorId: string;
  type: string;
  severity: string;
  timestamp: Date;
  message: string;
  context?: Record<string, any>;
} => {
  return {
    errorId: error.id,
    type: error.type,
    severity: error.severity,
    timestamp: error.timestamp,
    message: error.message,
    context: context ? sanitizeContext(context) : undefined
  };
};

/**
 * Check if error is recoverable
 */
export const isRecoverableError = (error: BaseError): boolean => {
  const classification = classifyError(error);
  return classification.canRecover;
};

/**
 * Check if error is critical
 */
export const isCriticalError = (error: BaseError): boolean => {
  return error.severity === 'critical';
};

/**
 * Get error type priority for sorting
 */
export const getErrorTypePriority = (errorType: string): number => {
  const priorities = {
    'system': 5,
    'api': 4,
    'network': 3,
    'permission': 2,
    'validation': 1,
    'offline': 1
  };
  
  return priorities[errorType as keyof typeof priorities] || 0;
};