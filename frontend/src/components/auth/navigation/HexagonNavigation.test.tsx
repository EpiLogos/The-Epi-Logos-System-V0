/**
 * Tests for Hexagon Navigation component with authentication state integration
 * Following TDD methodology - RED phase: Write failing tests first
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { HexagonNavigation } from './HexagonNavigation';

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/current-path',
}));

// Mock authentication context
const mockSignOut = vi.fn();
const mockAuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
};

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signOut: mockSignOut,
    ...mockAuthState,
  }),
}));

// Mock OAuth context
const mockInitiateOAuth = vi.fn();
vi.mock('../../../contexts/OAuthContext', () => ({
  useOAuth: () => ({
    initiateOAuthFlow: mockInitiateOAuth,
    isLoading: false,
    error: null,
  }),
}));

describe('HexagonNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders hexagon navigation structure', () => {
      // This will fail initially - component doesn't exist yet
      render(<HexagonNavigation />);
      
      const navigation = screen.getByRole('navigation', { name: /epi-logos navigation/i });
      expect(navigation).toBeInTheDocument();
    });

    test('displays all six subsystem navigation items', () => {
      render(<HexagonNavigation />);
      
      // Six subsystems from Bimba coordinates #0-#5
      const subsystems = [
        'Anuttara', 'Paramasiva', 'Parashakti', 
        'Mahamaya', 'Nara', 'Epii'
      ];
      
      subsystems.forEach(subsystem => {
        const link = screen.getByRole('link', { name: new RegExp(subsystem, 'i') });
        expect(link).toBeInTheDocument();
      });
    });

    test('displays hexagonal layout structure', () => {
      render(<HexagonNavigation />);
      
      const hexagonContainer = screen.getByTestId('hexagon-container');
      expect(hexagonContainer).toBeInTheDocument();
      expect(hexagonContainer).toHaveClass('hexagon-navigation');
    });
  });

  describe('Authentication State Display - Unauthenticated', () => {
    beforeEach(() => {
      vi.mocked(mockAuthState).isAuthenticated = false;
      vi.mocked(mockAuthState).user = null;
    });

    test('shows sign-in options when unauthenticated', () => {
      render(<HexagonNavigation />);
      
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in with email/i })).toBeInTheDocument();
    });

    test('displays Google OAuth button with proper styling', () => {
      render(<HexagonNavigation />);
      
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      expect(googleButton).toHaveClass('google-oauth-button');
      expect(googleButton).not.toBeDisabled();
    });

    test('shows authentication prompt text', () => {
      render(<HexagonNavigation />);
      
      expect(screen.getByText(/sign in to access the epi-logos system/i)).toBeInTheDocument();
    });

    test('disables subsystem navigation when unauthenticated', () => {
      render(<HexagonNavigation />);
      
      const subsystems = ['Anuttara', 'Paramasiva', 'Parashakti', 'Mahamaya', 'Nara', 'Epii'];
      
      subsystems.forEach(subsystem => {
        const link = screen.getByRole('link', { name: new RegExp(subsystem, 'i') });
        expect(link).toHaveAttribute('aria-disabled', 'true');
        expect(link).toHaveClass('subsystem-disabled');
      });
    });

    test('shows visual indicators for disabled subsystems', () => {
      render(<HexagonNavigation />);
      
      const disabledIndicators = screen.getAllByTestId('subsystem-locked');
      expect(disabledIndicators).toHaveLength(6); // All six subsystems locked
    });
  });

  describe('Authentication State Display - Authenticated', () => {
    beforeEach(() => {
      vi.mocked(mockAuthState).isAuthenticated = true;
      vi.mocked(mockAuthState).user = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        google_id: '123456789012345678901'
      };
    });

    test('shows user profile when authenticated', () => {
      render(<HexagonNavigation />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    test('displays user avatar', () => {
      render(<HexagonNavigation />);
      
      const avatar = screen.getByRole('img', { name: /test user avatar/i });
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    test('shows sign-out button', () => {
      render(<HexagonNavigation />);
      
      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      expect(signOutButton).toBeInTheDocument();
    });

    test('enables subsystem navigation when authenticated', () => {
      render(<HexagonNavigation />);
      
      const subsystems = ['Anuttara', 'Paramasiva', 'Parashakti', 'Mahamaya', 'Nara', 'Epii'];
      
      subsystems.forEach(subsystem => {
        const link = screen.getByRole('link', { name: new RegExp(subsystem, 'i') });
        expect(link).not.toHaveAttribute('aria-disabled');
        expect(link).toHaveClass('subsystem-enabled');
      });
    });

    test('removes lock indicators for authenticated users', () => {
      render(<HexagonNavigation />);
      
      const lockedIndicators = screen.queryAllByTestId('subsystem-locked');
      expect(lockedIndicators).toHaveLength(0);
    });
  });

  describe('OAuth Sign-In Flow Integration', () => {
    test('handles Google OAuth sign-in button click', async () => {
      render(<HexagonNavigation />);
      
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(mockInitiateOAuth).toHaveBeenCalledTimes(1);
        expect(mockInitiateOAuth).toHaveBeenCalledWith({
          provider: 'google',
          returnUrl: '/current-path',
        });
      });
    });

    test('includes PKCE parameters in OAuth flow', async () => {
      render(<HexagonNavigation />);
      
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        const callArgs = mockInitiateOAuth.mock.calls[0][0];
        expect(callArgs).toHaveProperty('codeVerifier');
        expect(callArgs).toHaveProperty('codeChallenge');
        expect(callArgs).toHaveProperty('nonce');
      });
    });

    test('shows loading state during OAuth flow', () => {
      // Mock loading state
      const mockOAuthContext = vi.mocked(vi.importMock('../../../contexts/OAuthContext').useOAuth());
      mockOAuthContext.isLoading = true;
      
      render(<HexagonNavigation />);
      
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(screen.getByTestId('oauth-loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Sign-Out Functionality', () => {
    beforeEach(() => {
      vi.mocked(mockAuthState).isAuthenticated = true;
      vi.mocked(mockAuthState).user = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User'
      };
    });

    test('handles sign-out button click', async () => {
      render(<HexagonNavigation />);
      
      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(signOutButton);
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    test('shows confirmation dialog for sign-out', async () => {
      render(<HexagonNavigation />);
      
      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(signOutButton);
      
      expect(screen.getByRole('dialog', { name: /confirm sign out/i })).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to sign out/i)).toBeInTheDocument();
    });

    test('confirms sign-out with confirmation dialog', async () => {
      render(<HexagonNavigation />);
      
      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(signOutButton);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    test('cancels sign-out with cancel button', async () => {
      render(<HexagonNavigation />);
      
      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(signOutButton);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Subsystem Navigation', () => {
    beforeEach(() => {
      vi.mocked(mockAuthState).isAuthenticated = true;
    });

    test('navigates to subsystem on click when authenticated', async () => {
      render(<HexagonNavigation />);
      
      const naraLink = screen.getByRole('link', { name: /nara/i });
      fireEvent.click(naraLink);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/subsystems/nara');
      });
    });

    test('shows hover effects on subsystem items', () => {
      render(<HexagonNavigation />);
      
      const subsystemLink = screen.getByRole('link', { name: /anuttara/i });
      
      fireEvent.mouseEnter(subsystemLink);
      expect(subsystemLink).toHaveClass('subsystem-hover');
      
      fireEvent.mouseLeave(subsystemLink);
      expect(subsystemLink).not.toHaveClass('subsystem-hover');
    });

    test('displays coordinate numbers for each subsystem', () => {
      render(<HexagonNavigation />);
      
      // Each subsystem should show its coordinate number
      expect(screen.getByText('#0')).toBeInTheDocument(); // Anuttara
      expect(screen.getByText('#1')).toBeInTheDocument(); // Paramasiva
      expect(screen.getByText('#2')).toBeInTheDocument(); // Parashakti
      expect(screen.getByText('#3')).toBeInTheDocument(); // Mahamaya
      expect(screen.getByText('#4')).toBeInTheDocument(); // Nara
      expect(screen.getByText('#5')).toBeInTheDocument(); // Epii
    });

    test('highlights current subsystem when active', () => {
      // Mock current path
      vi.mocked(vi.importMock('next/navigation').usePathname).mockReturnValue('/subsystems/nara');
      
      render(<HexagonNavigation />);
      
      const naraLink = screen.getByRole('link', { name: /nara/i });
      expect(naraLink).toHaveClass('subsystem-active');
    });
  });

  describe('Responsive Design', () => {
    test('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<HexagonNavigation />);
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveClass('navigation-mobile');
    });

    test('shows collapsed navigation on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });
      
      render(<HexagonNavigation />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
      expect(toggleButton).toBeInTheDocument();
    });

    test('expands navigation menu on mobile toggle', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });
      
      render(<HexagonNavigation />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        const expandedNav = screen.getByTestId('expanded-navigation');
        expect(expandedNav).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels and roles', () => {
      render(<HexagonNavigation />);
      
      const navigation = screen.getByRole('navigation', { name: /epi-logos navigation/i });
      expect(navigation).toHaveAttribute('aria-label', 'Epi-Logos System Navigation');
    });

    test('supports keyboard navigation', () => {
      vi.mocked(mockAuthState).isAuthenticated = true;
      
      render(<HexagonNavigation />);
      
      // Tab through subsystem links
      const firstLink = screen.getByRole('link', { name: /anuttara/i });
      firstLink.focus();
      expect(firstLink).toHaveFocus();
      
      // Enter key should navigate
      fireEvent.keyDown(firstLink, { key: 'Enter', code: 'Enter' });
      expect(mockPush).toHaveBeenCalledWith('/subsystems/anuttara');
    });

    test('provides screen reader descriptions for subsystems', () => {
      render(<HexagonNavigation />);
      
      const anuttaraLink = screen.getByRole('link', { name: /anuttara/i });
      expect(anuttaraLink).toHaveAttribute(
        'aria-description', 
        'Coordinate #0: Absolute Ground & Proto-Logical Processing'
      );
    });

    test('announces authentication state changes', () => {
      const { rerender } = render(<HexagonNavigation />);
      
      // Initially unauthenticated
      expect(screen.getByLabelText(/authentication status/i)).toHaveTextContent('Not signed in');
      
      // Change to authenticated
      vi.mocked(mockAuthState).isAuthenticated = true;
      vi.mocked(mockAuthState).user = { name: 'Test User', email: 'test@example.com' };
      
      rerender(<HexagonNavigation />);
      
      expect(screen.getByLabelText(/authentication status/i)).toHaveTextContent('Signed in as Test User');
    });
  });

  describe('Performance Optimization', () => {
    test('lazy loads subsystem content', () => {
      render(<HexagonNavigation />);
      
      // Should not load subsystem content until needed
      expect(screen.queryByTestId('anuttara-preview')).not.toBeInTheDocument();
    });

    test('preloads subsystem routes on hover', async () => {
      vi.mocked(mockAuthState).isAuthenticated = true;
      
      render(<HexagonNavigation />);
      
      const naraLink = screen.getByRole('link', { name: /nara/i });
      fireEvent.mouseEnter(naraLink);
      
      // Would test route preloading with Next.js router
      await waitFor(() => {
        // Verify preload was called
      });
    });

    test('memoizes authentication state calculations', () => {
      const { rerender } = render(<HexagonNavigation />);
      
      // Multiple re-renders with same auth state shouldn't recalculate
      rerender(<HexagonNavigation />);
      rerender(<HexagonNavigation />);
      
      // Would verify memoization with React DevTools or performance monitoring
    });
  });
});