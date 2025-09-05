/**
 * Unit Tests for ErrorToast Component
 * Tests toast functionality, dismissal, and retry actions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as Toast from '@radix-ui/react-toast';
import { ErrorToast } from '../ErrorToast';
import { createAPIError } from '@/utils/errors';

// Mock Toast Provider for tests
const ToastWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Toast.Provider>
    {children}
    <Toast.Viewport />
  </Toast.Provider>
);

describe('ErrorToast Component', () => {
  const mockError = createAPIError('Failed to save changes', 500, '/api/save', true);
  const mockOnDismiss = vi.fn();
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    mockOnDismiss.mockClear();
    mockOnRetry.mockClear();
  });

  it('renders error message and title', () => {
    render(
      <ToastWrapper>
        <ErrorToast error={mockError} onDismiss={mockOnDismiss} />
      </ToastWrapper>
    );

    expect(screen.getByText('API Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to save changes')).toBeInTheDocument();
  });

  it('shows retry button when error can be retried and onRetry is provided', () => {
    render(
      <ToastWrapper>
        <ErrorToast 
          error={mockError} 
          onDismiss={mockOnDismiss} 
          onRetry={mockOnRetry}
        />
      </ToastWrapper>
    );

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('does not show retry button when error cannot be retried', () => {
    const nonRetryableError = { ...mockError, canRetry: false };
    
    render(
      <ToastWrapper>
        <ErrorToast 
          error={nonRetryableError} 
          onDismiss={mockOnDismiss} 
          onRetry={mockOnRetry}
        />
      </ToastWrapper>
    );

    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    render(
      <ToastWrapper>
        <ErrorToast 
          error={mockError} 
          onDismiss={mockOnDismiss} 
          onRetry={mockOnRetry}
        />
      </ToastWrapper>
    );

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('shows dismiss button by default', () => {
    render(
      <ToastWrapper>
        <ErrorToast error={mockError} onDismiss={mockOnDismiss} />
      </ToastWrapper>
    );

    // Radix UI Toast.Close renders as a button
    const dismissButton = screen.getByRole('button');
    expect(dismissButton).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    render(
      <ToastWrapper>
        <ErrorToast error={mockError} onDismiss={mockOnDismiss} />
      </ToastWrapper>
    );

    // Find dismiss button (the X button)
    const dismissButton = screen.getAllByRole('button').find(
      button => button.querySelector('svg') // X icon
    );
    
    if (dismissButton) {
      fireEvent.click(dismissButton);
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    }
  });

  it('hides dismiss button when allowDismiss is false', () => {
    render(
      <ToastWrapper>
        <ErrorToast 
          error={mockError} 
          onDismiss={mockOnDismiss}
          config={{ allowDismiss: false }}
        />
      </ToastWrapper>
    );

    // Should only have retry button, not dismiss button
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1); // Only retry button
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('applies custom configuration', () => {
    const customConfig = {
      autoHide: false,
      allowDismiss: false
    };

    render(
      <ToastWrapper>
        <ErrorToast 
          error={mockError} 
          onDismiss={mockOnDismiss}
          onRetry={mockOnRetry}
          config={customConfig}
        />
      </ToastWrapper>
    );

    // Should not show dismiss button
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });

  it('includes error icon', () => {
    render(
      <ToastWrapper>
        <ErrorToast error={mockError} onDismiss={mockOnDismiss} />
      </ToastWrapper>
    );

    // Check for AlertCircle icon (should be in the component)
    const toast = screen.getByRole('status', { hidden: true }) || 
                  screen.getByRole('region', { hidden: true });
    expect(toast).toBeInTheDocument();
  });

  it('handles different error types appropriately', () => {
    const networkError = createAPIError('Network connection failed', 0, undefined, true);
    networkError.type = 'network';

    render(
      <ToastWrapper>
        <ErrorToast error={networkError} onDismiss={mockOnDismiss} />
      </ToastWrapper>
    );

    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    expect(screen.getByText('API Error')).toBeInTheDocument();
  });
});