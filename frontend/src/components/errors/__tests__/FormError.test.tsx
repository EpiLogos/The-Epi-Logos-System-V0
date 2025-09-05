/**
 * Unit Tests for FormError Component
 * Tests accessibility, rendering, and error display functionality
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormError } from '../FormError';
import { createFormError } from '@/utils/errors';

describe('FormError Component', () => {
  const mockError = createFormError('email', 'Please enter a valid email address');

  it('renders nothing when no error is provided', () => {
    const { container } = render(<FormError error={null} fieldName="email" />);
    expect(container.firstChild).toBeNull();
  });

  it('displays error message when error is provided', () => {
    render(<FormError error={mockError} fieldName="email" />);
    
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<FormError error={mockError} fieldName="email" />);
    
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toHaveAttribute('aria-live', 'polite');
    expect(errorElement).toHaveAttribute('id', 'error-email');
  });

  it('includes error icon with accessible label', () => {
    render(<FormError error={mockError} fieldName="email" />);
    
    // Check for the accessible icon (AlertTriangle)
    const iconElement = screen.getByLabelText('Error');
    expect(iconElement).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-error-class';
    render(
      <FormError 
        error={mockError} 
        fieldName="email" 
        className={customClass} 
      />
    );
    
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toHaveClass(customClass);
  });

  it('has proper CSS classes for styling', () => {
    render(<FormError error={mockError} fieldName="email" />);
    
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toHaveClass('text-red-600', 'dark:text-red-400');
  });

  it('generates unique ID based on field name', () => {
    render(<FormError error={mockError} fieldName="password" />);
    
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toHaveAttribute('id', 'error-password');
  });

  it('displays different error messages correctly', () => {
    const passwordError = createFormError('password', 'Password must be at least 8 characters');
    
    const { rerender } = render(<FormError error={mockError} fieldName="email" />);
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    
    rerender(<FormError error={passwordError} fieldName="password" />);
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
  });
});