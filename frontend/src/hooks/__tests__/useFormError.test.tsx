/**
 * Unit Tests for useFormError Hook
 * Tests form error state management functionality
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormError } from '../useFormError';

describe('useFormError Hook', () => {
  it('initializes with empty error state', () => {
    const { result } = renderHook(() => useFormError());

    expect(result.current.errors.size).toBe(0);
    expect(result.current.hasErrors).toBe(false);
    expect(result.current.getError('email')).toBeNull();
  });

  it('sets error for a field', () => {
    const { result } = renderHook(() => useFormError());

    act(() => {
      result.current.setError('email', 'Invalid email address');
    });

    expect(result.current.hasErrors).toBe(true);
    expect(result.current.errors.size).toBe(1);
    
    const emailError = result.current.getError('email');
    expect(emailError).not.toBeNull();
    expect(emailError?.message).toBe('Invalid email address');
    expect(emailError?.fieldName).toBe('email');
  });

  it('clears error for a specific field', () => {
    const { result } = renderHook(() => useFormError());

    // Set errors for multiple fields
    act(() => {
      result.current.setError('email', 'Invalid email');
      result.current.setError('password', 'Password too short');
    });

    expect(result.current.errors.size).toBe(2);

    // Clear one field
    act(() => {
      result.current.clearError('email');
    });

    expect(result.current.errors.size).toBe(1);
    expect(result.current.getError('email')).toBeNull();
    expect(result.current.getError('password')).not.toBeNull();
  });

  it('clears all errors', () => {
    const { result } = renderHook(() => useFormError());

    // Set multiple errors
    act(() => {
      result.current.setError('email', 'Invalid email');
      result.current.setError('password', 'Password too short');
      result.current.setError('name', 'Name required');
    });

    expect(result.current.errors.size).toBe(3);
    expect(result.current.hasErrors).toBe(true);

    // Clear all errors
    act(() => {
      result.current.clearAllErrors();
    });

    expect(result.current.errors.size).toBe(0);
    expect(result.current.hasErrors).toBe(false);
    expect(result.current.getError('email')).toBeNull();
    expect(result.current.getError('password')).toBeNull();
    expect(result.current.getError('name')).toBeNull();
  });

  it('updates error for existing field', () => {
    const { result } = renderHook(() => useFormError());

    // Set initial error
    act(() => {
      result.current.setError('email', 'Email required');
    });

    let emailError = result.current.getError('email');
    expect(emailError?.message).toBe('Email required');

    // Update error message
    act(() => {
      result.current.setError('email', 'Invalid email format');
    });

    emailError = result.current.getError('email');
    expect(emailError?.message).toBe('Invalid email format');
    expect(result.current.errors.size).toBe(1); // Still only one error
  });

  it('handles multiple fields independently', () => {
    const { result } = renderHook(() => useFormError());

    act(() => {
      result.current.setError('email', 'Invalid email');
      result.current.setError('password', 'Password too short');
      result.current.setError('confirmPassword', 'Passwords do not match');
    });

    expect(result.current.errors.size).toBe(3);

    const emailError = result.current.getError('email');
    const passwordError = result.current.getError('password');
    const confirmError = result.current.getError('confirmPassword');

    expect(emailError?.message).toBe('Invalid email');
    expect(passwordError?.message).toBe('Password too short');
    expect(confirmError?.message).toBe('Passwords do not match');

    // Clear one field, others should remain
    act(() => {
      result.current.clearError('password');
    });

    expect(result.current.errors.size).toBe(2);
    expect(result.current.getError('email')).not.toBeNull();
    expect(result.current.getError('password')).toBeNull();
    expect(result.current.getError('confirmPassword')).not.toBeNull();
  });

  it('returns null for non-existent field', () => {
    const { result } = renderHook(() => useFormError());

    expect(result.current.getError('nonexistent')).toBeNull();

    // Set error for one field
    act(() => {
      result.current.setError('email', 'Invalid email');
    });

    expect(result.current.getError('nonexistent')).toBeNull();
    expect(result.current.getError('email')).not.toBeNull();
  });

  it('generates unique error IDs', () => {
    const { result } = renderHook(() => useFormError());

    act(() => {
      result.current.setError('email', 'Invalid email');
      result.current.setError('password', 'Password too short');
    });

    const emailError = result.current.getError('email');
    const passwordError = result.current.getError('password');

    expect(emailError?.id).toBeDefined();
    expect(passwordError?.id).toBeDefined();
    expect(emailError?.id).not.toBe(passwordError?.id);
  });

  it('creates errors with correct properties', () => {
    const { result } = renderHook(() => useFormError());

    act(() => {
      result.current.setError('email', 'Invalid email address');
    });

    const error = result.current.getError('email');
    
    expect(error).toMatchObject({
      type: 'validation',
      severity: 'low',
      fieldName: 'email',
      message: 'Invalid email address'
    });
    
    expect(error?.id).toMatch(/^EEL-\d{4}-\d{2}-\d{2}-[A-Z0-9]{6}$/);
    expect(error?.timestamp).toBeInstanceOf(Date);
  });
});