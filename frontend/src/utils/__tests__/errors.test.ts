/**
 * Unit Tests for Error Utilities
 * Tests error creation, classification, and utility functions
 */

import { describe, it, expect, vi } from '@jest/globals';
import {
  generateErrorId,
  generateSupportId,
  classifyError,
  createFormError,
  createAPIError,
  createSystemError,
  logError
} from '../errors';

describe('Error Utilities', () => {
  describe('generateErrorId', () => {
    it('generates ID in correct format', () => {
      const id = generateErrorId();
      expect(id).toMatch(/^EEL-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('generates unique IDs', () => {
      const id1 = generateErrorId();
      const id2 = generateErrorId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateSupportId', () => {
    it('generates support ID in correct format', () => {
      const id = generateSupportId();
      expect(id).toMatch(/^SUP-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('generates unique support IDs', () => {
      const id1 = generateSupportId();
      const id2 = generateSupportId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('createFormError', () => {
    it('creates form error with correct properties', () => {
      const error = createFormError('email', 'Invalid email address');

      expect(error).toMatchObject({
        type: 'validation',
        severity: 'low',
        fieldName: 'email',
        message: 'Invalid email address'
      });
      expect(error.id).toBeDefined();
      expect(error.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('createAPIError', () => {
    it('creates API error with correct properties', () => {
      const error = createAPIError('Server error', 500, '/api/data', true);

      expect(error).toMatchObject({
        type: 'api',
        severity: 'high',
        message: 'Server error',
        statusCode: 500,
        endpoint: '/api/data',
        canRetry: true
      });
      expect(error.id).toBeDefined();
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('sets correct severity based on status code', () => {
      const error400 = createAPIError('Bad request', 400);
      const error500 = createAPIError('Server error', 500);

      expect(error400.severity).toBe('medium');
      expect(error500.severity).toBe('high');
    });

    it('defaults canRetry to true', () => {
      const error = createAPIError('API error');
      expect(error.canRetry).toBe(true);
    });
  });

  describe('createSystemError', () => {
    it('creates system error with correct properties', () => {
      const error = createSystemError('System crash', 'SYS_001', 'stack trace');

      expect(error).toMatchObject({
        type: 'system',
        severity: 'high',
        message: 'System crash',
        errorCode: 'SYS_001',
        stack: 'stack trace'
      });
      expect(error.id).toBeDefined();
      expect(error.supportId).toBeDefined();
      expect(error.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('classifyError', () => {
    it('classifies validation errors correctly', () => {
      const error = createFormError('email', 'Invalid email');
      const classification = classifyError(error);

      expect(classification).toMatchObject({
        severity: 'low',
        userMessage: 'Invalid email',
        canRecover: true
      });
      expect(classification.suggestedActions).toHaveLength(1);
      expect(classification.suggestedActions[0].type).toBe('dismiss');
    });

    it('classifies API errors correctly', () => {
      const error = createAPIError('Server error', 500);
      const classification = classifyError(error);

      expect(classification).toMatchObject({
        severity: 'high',
        canRecover: true
      });
      expect(classification.suggestedActions[0].type).toBe('retry');
    });

    it('classifies network errors correctly', () => {
      const error = createAPIError('Network error', 0);
      error.type = 'network';
      const classification = classifyError(error);

      expect(classification).toMatchObject({
        severity: 'medium',
        userMessage: 'Connection issue. Please check your internet and try again.',
        canRecover: true
      });
      expect(classification.suggestedActions[0].type).toBe('retry');
    });

    it('classifies system errors correctly', () => {
      const error = createSystemError('Database error');
      const classification = classifyError(error);

      expect(classification).toMatchObject({
        severity: 'high',
        userMessage: 'An unexpected error occurred. Our team has been notified.',
        canRecover: false
      });
      expect(classification.suggestedActions[0].type).toBe('reload');
    });

    it('handles permission errors', () => {
      const error = createAPIError('Forbidden', 403);
      error.type = 'permission';
      const classification = classifyError(error);

      expect(classification).toMatchObject({
        severity: 'medium',
        userMessage: "You don't have permission to perform this action.",
        canRecover: true
      });
      expect(classification.suggestedActions[0].type).toBe('dismiss');
    });

    it('handles offline errors', () => {
      const error = createAPIError('Offline');
      error.type = 'offline';
      const classification = classifyError(error);

      expect(classification).toMatchObject({
        severity: 'medium',
        userMessage: "You're offline. Some features may not work until you reconnect.",
        canRecover: true
      });
      expect(classification.suggestedActions[0].type).toBe('retry');
    });

    it('provides default classification for unknown error types', () => {
      const error = createAPIError('Unknown error');
      error.type = 'unknown' as 'api';
      const classification = classifyError(error);

      expect(classification).toMatchObject({
        severity: 'medium',
        userMessage: 'Something went wrong. Please try again.',
        canRecover: true
      });
      expect(classification.suggestedActions[0].type).toBe('retry');
    });
  });

  describe('logError', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('logs error in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = createFormError('email', 'Invalid email');
      logError(error);

      expect(consoleSpy).toHaveBeenCalledWith('Error logged:', expect.any(Object));
      
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });

    it('sanitizes sensitive context data', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = createFormError('email', 'Invalid email');
      const context = {
        password: 'secret123',
        token: 'jwt-token',
        safeData: 'this is fine'
      };

      logError(error, context);

      const loggedData = consoleSpy.mock.calls[0]?.[1];
      expect(loggedData?.context?.password).toBe('[REDACTED]');
      expect(loggedData?.context?.token).toBe('[REDACTED]');
      expect(loggedData?.context?.safeData).toBe('this is fine');

      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });

    it('handles nested context sanitization', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = createFormError('email', 'Invalid email');
      const context = {
        user: {
          name: 'John',
          password: 'secret'
        },
        auth: {
          authorization: 'Bearer token'
        }
      };

      logError(error, context);

      const loggedData = consoleSpy.mock.calls[0]?.[1];
      expect(loggedData?.context?.user?.name).toBe('John');
      expect(loggedData?.context?.user?.password).toBe('[REDACTED]');
      expect(loggedData?.context?.auth?.authorization).toBe('[REDACTED]');

      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });

    it('does not log sensitive information directly from error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = createSystemError('System error');
      logError(error);

      const loggedData = consoleSpy.mock.calls[0]?.[1];
      
      // Check that logged data only contains safe fields
      expect(loggedData).toHaveProperty('errorId');
      expect(loggedData).toHaveProperty('type');
      expect(loggedData).toHaveProperty('severity');
      expect(loggedData).toHaveProperty('message');
      expect(loggedData).toHaveProperty('timestamp');
      
      // Should not contain sensitive system details
      expect(loggedData).not.toHaveProperty('stack');
      expect(loggedData).not.toHaveProperty('supportId');

      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });
});