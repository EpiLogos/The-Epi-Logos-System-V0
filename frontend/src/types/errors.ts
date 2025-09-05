/**
 * Error Types and Interfaces for Epi-Logos Error Component System
 * Supports Form Validation, API Errors, and System Error Dialog components
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorType = 'validation' | 'network' | 'api' | 'system' | 'permission' | 'offline';

export type ErrorContext = 'form' | 'api' | 'navigation' | 'system' | 'authentication';

export interface BaseError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  context?: ErrorContext;
  timestamp: Date;
}

export interface FormValidationError extends BaseError {
  type: 'validation';
  fieldName: string;
  value?: string;
}

export interface APIError extends BaseError {
  type: 'api' | 'network';
  statusCode?: number;
  endpoint?: string;
  canRetry: boolean;
  retryAfter?: number;
}

export interface SystemError extends BaseError {
  type: 'system';
  errorCode?: string;
  stack?: string;
  supportId: string;
}

export type AnyError = FormValidationError | APIError | SystemError;

export interface ErrorAction {
  type: 'retry' | 'dismiss' | 'redirect' | 'reload' | 'support';
  label: string;
  handler: () => void | Promise<void>;
  isPrimary?: boolean;
}

export interface ErrorDisplayConfig {
  showErrorId?: boolean;
  allowDismiss?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  actions?: ErrorAction[];
}

// Form Error Component Props
export interface FormErrorProps {
  error?: FormValidationError | null;
  fieldName: string;
  className?: string;
}

// Toast Error Component Props
export interface ErrorToastProps {
  error: APIError;
  onDismiss?: () => void;
  onRetry?: () => void;
  config?: ErrorDisplayConfig;
}

// System Error Dialog Props
export interface SystemErrorDialogProps {
  error: SystemError;
  isOpen: boolean;
  onClose?: () => void;
  onRetry?: () => void;
  onSupport?: () => void;
}

// Error Classification Utilities
export interface ErrorClassification {
  severity: ErrorSeverity;
  userMessage: string;
  canRecover: boolean;
  suggestedActions: ErrorAction[];
}

// Error State Management
export interface ErrorState {
  formErrors: Map<string, FormValidationError>;
  toastErrors: APIError[];
  systemError: SystemError | null;
  isLoading: boolean;
}

export interface ErrorActions {
  addFormError: (fieldName: string, error: FormValidationError) => void;
  clearFormError: (fieldName: string) => void;
  clearAllFormErrors: () => void;
  showToastError: (error: APIError) => void;
  dismissToastError: (errorId: string) => void;
  showSystemError: (error: SystemError) => void;
  clearSystemError: () => void;
}