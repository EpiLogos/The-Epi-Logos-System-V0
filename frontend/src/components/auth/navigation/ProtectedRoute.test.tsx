/**
 * Tests for Protected Route component for six subsystems access control
 * Following TDD methodology - RED phase: Write failing tests first
 */

import { render, screen, waitFor } from '@testing-library/react';
// Jest globals available
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from './ProtectedRoute';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/subsystems/nara'),
}));

// Mock authentication context
const mockAuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
};

jest.mock('@/auth', () => ({
  useAuth: () => mockAuthState,
}));

// OAuth functionality is now part of unified auth context - no separate mock needed

// Test component that would be protected
const TestSubsystemComponent = ({ subsystem }: { subsystem: string }) => (
  <div data-testid={`${subsystem}-content`}>
    <h1>{subsystem} Subsystem</h1>
    <p>This is protected content for {subsystem}</p>
  </div>
);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  describe('Subsystem Access Control - Unauthenticated', () => {
    const subsystems = [
      { id: 'anuttara', coordinate: '#0', name: 'Anuttara' },
      { id: 'paramasiva', coordinate: '#1', name: 'Paramasiva' },
      { id: 'parashakti', coordinate: '#2', name: 'Parashakti' },
      { id: 'mahamaya', coordinate: '#3', name: 'Mahamaya' },
      { id: 'nara', coordinate: '#4', name: 'Nara' },
      { id: 'epii', coordinate: '#5', name: 'Epii' },
    ];

    beforeEach(() => {
      jest.mocked(mockAuthState).isAuthenticated = false;
      jest.mocked(mockAuthState).user = null;
    });

    subsystems.forEach(subsystem => {
      test(`protects ${subsystem.name} subsystem for unauthenticated users`, async () => {
        // This will fail initially - component doesn't exist yet
        render(
          <ProtectedRoute subsystem={subsystem.id}>
            <TestSubsystemComponent subsystem={subsystem.name} />
          </ProtectedRoute>
        );

        // Should not render protected content
        expect(screen.queryByTestId(`${subsystem.name.toLowerCase()}-content`)).not.toBeInTheDocument();
        
        // Should show authentication prompt
        expect(screen.getByText(/sign in to access/i)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(subsystem.name, 'i'))).toBeInTheDocument();
      });

      test(`shows ${subsystem.name} coordinate information in auth prompt`, () => {
        render(
          <ProtectedRoute subsystem={subsystem.id}>
            <TestSubsystemComponent subsystem={subsystem.name} />
          </ProtectedRoute>
        );

        expect(screen.getByText(subsystem.coordinate)).toBeInTheDocument();
      });
    });

    test('displays Google OAuth sign-in button for unauthenticated access', () => {
      render(
        <ProtectedRoute subsystem="nara">
          <TestSubsystemComponent subsystem="Nara" />
        </ProtectedRoute>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      expect(googleButton).toBeInTheDocument();
    });

    test('displays email sign-in option for unauthenticated access', () => {
      render(
        <ProtectedRoute subsystem="nara">
          <TestSubsystemComponent subsystem="Nara" />
        </ProtectedRoute>
      );

      const emailButton = screen.getByRole('button', { name: /sign in with email/i });
      expect(emailButton).toBeInTheDocument();
    });

    test('shows subsystem description and access requirements', () => {
      render(
        <ProtectedRoute subsystem="nara">
          <TestSubsystemComponent subsystem="Nara" />
        </ProtectedRoute>
      );

      expect(screen.getByText(/dialogical-identity processing/i)).toBeInTheDocument();
      expect(screen.getByText(/authentication required to access/i)).toBeInTheDocument();
    });
  });

  describe('Subsystem Access Control - Authenticated', () => {
    const subsystems = ['anuttara', 'paramasiva', 'parashakti', 'mahamaya', 'nara', 'epii'];

    beforeEach(() => {
      jest.mocked(mockAuthState).isAuthenticated = true;
      jest.mocked(mockAuthState).user = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
      };
    });

    subsystems.forEach(subsystem => {
      test(`allows ${subsystem} subsystem for authenticated users`, async () => {
        render(
          <ProtectedRoute subsystem={subsystem}>
            <TestSubsystemComponent subsystem={subsystem} />
          </ProtectedRoute>
        );

        await waitFor(() => {
          expect(screen.getByTestId(`${subsystem}-content`)).toBeInTheDocument();
        });

        expect(screen.queryByText(/sign in to access/i)).not.toBeInTheDocument();
      });
    });

    test('renders protected content immediately for authenticated users', () => {
      render(
        <ProtectedRoute subsystem="nara">
          <TestSubsystemComponent subsystem="nara" />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('nara-content')).toBeInTheDocument();
      expect(screen.getByText('Nara Subsystem')).toBeInTheDocument();
    });

    test('does not show authentication prompts for authenticated users', () => {
      render(
        <ProtectedRoute subsystem="epii">
          <TestSubsystemComponent subsystem="epii" />
        </ProtectedRoute>
      );

      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/authentication required/i)).not.toBeInTheDocument();
    });
  });

  describe('Authentication Flow Integration', () => {
    beforeEach(() => {
      jest.mocked(mockAuthState).isAuthenticated = false;
    });

    test('preserves intended destination after OAuth sign-in', async () => {
      render(
        <ProtectedRoute subsystem="mahamaya">
          <TestSubsystemComponent subsystem="mahamaya" />
        </ProtectedRoute>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      googleButton.click();

      await waitFor(() => {
        expect(mockInitiateOAuth).toHaveBeenCalledWith(
          expect.objectContaining({
            returnUrl: '/subsystems/mahamaya',
          })
        );
      });
    });

    test('includes subsystem context in OAuth flow', async () => {
      render(
        <ProtectedRoute subsystem="parashakti">
          <TestSubsystemComponent subsystem="parashakti" />
        </ProtectedRoute>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      googleButton.click();

      await waitFor(() => {
        expect(mockInitiateOAuth).toHaveBeenCalledWith(
          expect.objectContaining({
            context: {
              subsystem: 'parashakti',
              coordinate: '#2',
              access_intent: 'subsystem_access',
            },
          })
        );
      });
    });

    test('redirects to sign-in page for email authentication', async () => {
      render(
        <ProtectedRoute subsystem="anuttara">
          <TestSubsystemComponent subsystem="anuttara" />
        </ProtectedRoute>
      );

      const emailButton = screen.getByRole('button', { name: /sign in with email/i });
      emailButton.click();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/signin?returnUrl=/subsystems/anuttara');
      });
    });

    test('handles authentication failures gracefully', () => {
      const mockOAuthContext = jest.mocked(jest.requireMock('../../../contexts/OAuthContext').useOAuth());
      mockOAuthContext.error = 'OAuth authorization failed';

      render(
        <ProtectedRoute subsystem="nara">
          <TestSubsystemComponent subsystem="nara" />
        </ProtectedRoute>
      );

      expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
      expect(screen.getByText(/oauth authorization failed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    test('provides retry functionality after authentication failure', async () => {
      const mockOAuthContext = jest.mocked(jest.requireMock('../../../contexts/OAuthContext').useOAuth());
      mockOAuthContext.error = 'OAuth failed';
      
      render(
        <ProtectedRoute subsystem="nara">
          <TestSubsystemComponent subsystem="nara" />
        </ProtectedRoute>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      retryButton.click();

      await waitFor(() => {
        expect(mockInitiateOAuth).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state while authentication is being checked', () => {
      jest.mocked(mockAuthState).isLoading = true;

      render(
        <ProtectedRoute subsystem="epii">
          <TestSubsystemComponent subsystem="epii" />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('auth-loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/checking authentication/i)).toBeInTheDocument();
      expect(screen.queryByTestId('epii-content')).not.toBeInTheDocument();
    });

    test('shows OAuth loading state during sign-in flow', () => {
      const mockOAuthContext = jest.mocked(jest.requireMock('../../../contexts/OAuthContext').useOAuth());
      mockOAuthContext.isLoading = true;

      render(
        <ProtectedRoute subsystem="mahamaya">
          <TestSubsystemComponent subsystem="mahamaya" />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('oauth-loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    test('disables authentication buttons during loading', () => {
      const mockOAuthContext = jest.mocked(jest.requireMock('../../../contexts/OAuthContext').useOAuth());
      mockOAuthContext.isLoading = true;

      render(
        <ProtectedRoute subsystem="nara">
          <TestSubsystemComponent subsystem="nara" />
        </ProtectedRoute>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      const emailButton = screen.getByRole('button', { name: /sign in with email/i });

      expect(googleButton).toBeDisabled();
      expect(emailButton).toBeDisabled();
    });
  });

  describe('Subsystem-Specific Features', () => {
    test('displays coordinate-specific descriptions for each subsystem', () => {
      const subsystemDescriptions = {
        anuttara: /absolute ground.*proto-logical processing/i,
        paramasiva: /foundational architect.*quaternal logic/i,
        parashakti: /cosmic imagination.*vibrational matrix/i,
        mahamaya: /universal transcription.*symbolic processing/i,
        nara: /dialogical-identity processing/i,
        epii: /synthesis.*orchestration processing/i,
      };

      Object.entries(subsystemDescriptions).forEach(([subsystem, description]) => {
        render(
          <ProtectedRoute subsystem={subsystem}>
            <TestSubsystemComponent subsystem={subsystem} />
          </ProtectedRoute>
        );

        expect(screen.getByText(description)).toBeInTheDocument();
      });
    });

    test('shows preview content for each subsystem when unauthenticated', () => {
      render(
        <ProtectedRoute subsystem="parashakti">
          <TestSubsystemComponent subsystem="parashakti" />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('subsystem-preview')).toBeInTheDocument();
      expect(screen.getByText(/72-bit vibrational architecture/i)).toBeInTheDocument();
    });

    test('includes coordinate numbers in subsystem display', () => {
      const coordinates = {
        anuttara: '#0',
        paramasiva: '#1', 
        parashakti: '#2',
        mahamaya: '#3',
        nara: '#4',
        epii: '#5',
      };

      Object.entries(coordinates).forEach(([subsystem, coordinate]) => {
        render(
          <ProtectedRoute subsystem={subsystem}>
            <TestSubsystemComponent subsystem={subsystem} />
          </ProtectedRoute>
        );

        expect(screen.getByText(coordinate)).toBeInTheDocument();
      });
    });
  });

  describe('Security Features', () => {
    test('validates subsystem parameter against whitelist', () => {
      // Mock console.error to catch security warnings
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ProtectedRoute subsystem="invalid-subsystem">
          <TestSubsystemComponent subsystem="invalid" />
        </ProtectedRoute>
      );

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid subsystem')
      );
      expect(screen.getByText(/invalid subsystem/i)).toBeInTheDocument();

      mockConsoleError.mockRestore();
    });

    test('prevents XSS in subsystem parameter', () => {
      const maliciousSubsystem = '<script>alert("xss")</script>';
      
      render(
        <ProtectedRoute subsystem={maliciousSubsystem}>
          <TestSubsystemComponent subsystem="test" />
        </ProtectedRoute>
      );

      // Should not execute script or render as HTML
      expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument();
      expect(document.querySelector('script')).not.toBeInTheDocument();
    });

    test('logs access attempts for security monitoring', () => {
      const mockLog = jest.fn();
      const originalLog = console.log;
      console.log = mockLog;

      render(
        <ProtectedRoute subsystem="nara">
          <TestSubsystemComponent subsystem="nara" />
        </ProtectedRoute>
      );

      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('Subsystem access attempt'),
        expect.objectContaining({
          subsystem: 'nara',
          authenticated: false,
          timestamp: expect.any(String),
        })
      );

      console.log = originalLog;
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels for authentication states', () => {
      render(
        <ProtectedRoute subsystem="epii">
          <TestSubsystemComponent subsystem="epii" />
        </ProtectedRoute>
      );

      const authStatus = screen.getByLabelText(/authentication status/i);
      expect(authStatus).toHaveTextContent('Authentication required');
    });

    test('supports keyboard navigation for authentication options', () => {
      render(
        <ProtectedRoute subsystem="anuttara">
          <TestSubsystemComponent subsystem="anuttara" />
        </ProtectedRoute>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      const emailButton = screen.getByRole('button', { name: /sign in with email/i });

      // Should be focusable
      googleButton.focus();
      expect(googleButton).toHaveFocus();

      emailButton.focus();
      expect(emailButton).toHaveFocus();
    });

    test('announces subsystem access status to screen readers', () => {
      render(
        <ProtectedRoute subsystem="mahamaya">
          <TestSubsystemComponent subsystem="mahamaya" />
        </ProtectedRoute>
      );

      expect(screen.getByRole('status')).toHaveTextContent(
        'Mahamaya subsystem requires authentication to access'
      );
    });

    test('provides clear headings for authentication sections', () => {
      render(
        <ProtectedRoute subsystem="parashakti">
          <TestSubsystemComponent subsystem="parashakti" />
        </ProtectedRoute>
      );

      expect(screen.getByRole('heading', { level: 2, name: /authentication required/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /sign in options/i })).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    test('does not render protected content until authenticated', () => {
      const ExpensiveComponent = () => {
        // Mock expensive computation
        console.log('Expensive component rendered');
        return <div>Expensive Content</div>;
      };

      render(
        <ProtectedRoute subsystem="nara">
          <ExpensiveComponent />
        </ProtectedRoute>
      );

      // Should not have rendered expensive component
      expect(screen.queryByText('Expensive Content')).not.toBeInTheDocument();
    });

    test('memoizes authentication checks to prevent unnecessary re-renders', () => {
      const renderSpy = jest.fn();
      const TestComponent = () => {
        renderSpy();
        return <div>Test Content</div>;
      };

      const { rerender } = render(
        <ProtectedRoute subsystem="epii">
          <TestComponent />
        </ProtectedRoute>
      );

      const initialRenderCount = renderSpy.mock.calls.length;

      // Re-render with same props - should not trigger additional renders
      rerender(
        <ProtectedRoute subsystem="epii">
          <TestComponent />
        </ProtectedRoute>
      );

      // Should not have additional renders due to memoization
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
    });
  });
});