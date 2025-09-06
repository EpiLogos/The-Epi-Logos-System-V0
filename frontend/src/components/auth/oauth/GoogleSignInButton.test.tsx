/**
 * Tests for Google Sign-In Button component
 * Following TDD methodology - RED phase: Write failing tests first
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// Jest globals available
import { GoogleSignInButton } from './GoogleSignInButton';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock OAuth context
const mockInitiateOAuth = jest.fn();
const mockClearError = jest.fn();
const mockOAuthState = {
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

jest.mock('../../../contexts/OAuthContext', () => ({
  useOAuth: () => ({
    initiateOAuthFlow: mockInitiateOAuth,
    clearError: mockClearError,
    ...mockOAuthState,
  }),
}));

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders Google sign-in button with correct text', () => {
      // This will fail initially - component doesn't exist yet
      render(<GoogleSignInButton />);
      
      const button = screen.getByRole('button', { name: /sign in with google/i });
      expect(button).toBeInTheDocument();
    });

    test('displays Google logo/icon', () => {
      render(<GoogleSignInButton />);
      
      // Should have Google logo or icon
      const googleIcon = screen.getByTestId('google-icon');
      expect(googleIcon).toBeInTheDocument();
    });

    test('follows Google branding guidelines', () => {
      render(<GoogleSignInButton />);
      
      const button = screen.getByRole('button', { name: /sign in with google/i });
      
      // Check Google brand colors and styling
      expect(button).toHaveClass('google-signin-button');
      // Would check for proper Google blue color, font, etc.
    });
  });

  describe('OAuth Flow Initiation', () => {
    test('initiates OAuth flow on button click', async () => {
      render(<GoogleSignInButton />);
      
      const button = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockInitiateOAuth).toHaveBeenCalledTimes(1);
      });
    });

    test('passes correct provider parameter', async () => {
      render(<GoogleSignInButton />);
      
      const button = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockInitiateOAuth).toHaveBeenCalledWith({
          provider: 'google',
          returnUrl: window.location.pathname,
        });
      });
    });

    test('handles custom return URL prop', async () => {
      const customReturnUrl = '/dashboard';
      render(<GoogleSignInButton returnUrl={customReturnUrl} />);
      
      const button = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockInitiateOAuth).toHaveBeenCalledWith({
          provider: 'google',
          returnUrl: customReturnUrl,
        });
      });
    });

    test('generates and includes PKCE parameters', async () => {
      render(<GoogleSignInButton />);
      
      const button = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        const callArgs = mockInitiateOAuth.mock.calls[0][0];
        expect(callArgs).toHaveProperty('codeVerifier');
        expect(callArgs).toHaveProperty('codeChallenge');
        expect(callArgs.codeChallenge).toBeTruthy();
        expect(callArgs.codeVerifier).toBeTruthy();
      });
    });

    test('generates and includes nonce parameter', async () => {
      render(<GoogleSignInButton />);
      
      const button = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        const callArgs = mockInitiateOAuth.mock.calls[0][0];
        expect(callArgs).toHaveProperty('nonce');
        expect(callArgs.nonce).toBeTruthy();
        expect(callArgs.nonce).toHaveLength(32); // Base64url encoded 24 bytes
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state during OAuth flow', () => {
      // Mock loading state
      jest.mocked(mockOAuthState).isLoading = true;
      
      render(<GoogleSignInButton />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    test('shows loading spinner during OAuth', () => {
      jest.mocked(mockOAuthState).isLoading = true;
      
      render(<GoogleSignInButton />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    test('disables button during loading', () => {
      jest.mocked(mockOAuthState).isLoading = true;
      
      render(<GoogleSignInButton />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    test('displays OAuth error messages', () => {
      const errorMessage = 'OAuth authorization failed';
      jest.mocked(mockOAuthState).error = errorMessage;
      
      render(<GoogleSignInButton />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    test('shows retry button on error', () => {
      jest.mocked(mockOAuthState).error = 'OAuth failed';
      
      render(<GoogleSignInButton />);
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });

    test('clears error on retry attempt', async () => {
      const mockClearError = jest.fn();
      jest.mocked(mockOAuthState).error = 'OAuth failed';
      
      // Mock clearError function
      jest.mock('../../../contexts/OAuthContext', () => ({
        useOAuth: () => ({
          initiateOAuthFlow: mockInitiateOAuth,
          clearError: mockClearError,
          ...mockOAuthState,
        }),
      }));
      
      render(<GoogleSignInButton />);
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalledTimes(1);
        expect(mockInitiateOAuth).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<GoogleSignInButton />);
      
      const button = screen.getByRole('button', { name: /sign in with google/i });
      
      expect(button).toHaveAttribute('aria-label', 'Sign in with Google');
      expect(button).toHaveAttribute('type', 'button');
    });

    test('supports keyboard navigation', () => {
      render(<GoogleSignInButton />);
      
      const button = screen.getByRole('button', { name: /sign in with google/i });
      
      // Test tab navigation
      button.focus();
      expect(button).toHaveFocus();
      
      // Test Enter key activation
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(mockInitiateOAuth).toHaveBeenCalledTimes(1);
      
      // Test Space key activation
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      expect(mockInitiateOAuth).toHaveBeenCalledTimes(2);
    });

    test('has sufficient color contrast', () => {
      render(<GoogleSignInButton />);
      
      const button = screen.getByRole('button', { name: /sign in with google/i });
      
      // This would typically use a tool like axe-core for automated testing
      expect(button).toHaveClass('google-signin-button');
      // Would verify contrast ratio meets WCAG AA standards
    });
  });

  describe('Security Features', () => {
    test('generates unique PKCE parameters on each click', async () => {
      render(<GoogleSignInButton />);
      
      const button = screen.getByRole('button', { name: /sign in with google/i });
      
      // Click button twice
      fireEvent.click(button);
      await waitFor(() => expect(mockInitiateOAuth).toHaveBeenCalledTimes(1));
      
      const firstCallArgs = mockInitiateOAuth.mock.calls[0][0];
      
      fireEvent.click(button);
      await waitFor(() => expect(mockInitiateOAuth).toHaveBeenCalledTimes(2));
      
      const secondCallArgs = mockInitiateOAuth.mock.calls[1][0];
      
      // PKCE parameters should be different each time
      expect(firstCallArgs.codeVerifier).not.toBe(secondCallArgs.codeVerifier);
      expect(firstCallArgs.codeChallenge).not.toBe(secondCallArgs.codeChallenge);
      expect(firstCallArgs.nonce).not.toBe(secondCallArgs.nonce);
    });

    test('validates PKCE code challenge format', async () => {
      render(<GoogleSignInButton />);
      
      const button = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        const callArgs = mockInitiateOAuth.mock.calls[0][0];
        const codeChallenge = callArgs.codeChallenge;
        
        // Should be base64url encoded (no padding)
        expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(codeChallenge).not.toContain('=');
        expect(codeChallenge.length).toBe(43); // SHA256 hash base64url encoded
      });
    });

    test('validates nonce format for OIDC compliance', async () => {
      render(<GoogleSignInButton />);
      
      const button = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        const callArgs = mockInitiateOAuth.mock.calls[0][0];
        const nonce = callArgs.nonce;
        
        // Should be base64url encoded
        expect(nonce).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(nonce).not.toContain('=');
        expect(nonce.length).toBe(32); // 24 bytes base64url encoded
      });
    });
  });

  describe('Integration with Authentication State', () => {
    test('hides button when user is authenticated', () => {
      jest.mocked(mockOAuthState).isAuthenticated = true;
      
      render(<GoogleSignInButton />);
      
      expect(screen.queryByRole('button', { name: /sign in with google/i })).not.toBeInTheDocument();
    });

    test('shows signed-in state when authenticated', () => {
      jest.mocked(mockOAuthState).isAuthenticated = true;
      
      render(<GoogleSignInButton />);
      
      expect(screen.getByText(/signed in/i)).toBeInTheDocument();
    });
  });

  describe('Account Linking Mode', () => {
    test('shows account linking text when in linking mode', () => {
      render(<GoogleSignInButton linkAccount={true} />);
      
      const button = screen.getByRole('button', { name: /link google account/i });
      expect(button).toBeInTheDocument();
    });

    test('passes linking parameter to OAuth flow', async () => {
      render(<GoogleSignInButton linkAccount={true} />);
      
      const button = screen.getByRole('button', { name: /link google account/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockInitiateOAuth).toHaveBeenCalledWith(
          expect.objectContaining({
            linkAccount: true,
          })
        );
      });
    });

    test('shows linking-specific security warnings', () => {
      render(<GoogleSignInButton linkAccount={true} />);
      
      expect(screen.getByText(/this will link your google account/i)).toBeInTheDocument();
    });
  });
});