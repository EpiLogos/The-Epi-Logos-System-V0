/**
 * SessionManager Component Tests
 * RED Phase - These tests will fail until component is implemented
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SessionManager from '../SessionManager';

// Mock session data
const mockActiveSessions = [
  {
    id: 'session-123',
    deviceInfo: {
      browser: 'Chrome',
      os: 'macOS',
      device: 'MacBook Pro',
      location: 'San Francisco, CA',
    },
    ipAddress: '192.168.1.100',
    lastActivity: new Date('2025-01-10T10:30:00Z'),
    createdAt: new Date('2025-01-10T09:00:00Z'),
    isCurrent: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  },
  {
    id: 'session-456',
    deviceInfo: {
      browser: 'Safari',
      os: 'iOS',
      device: 'iPhone 15 Pro',
      location: 'San Francisco, CA',
    },
    ipAddress: '192.168.1.101',
    lastActivity: new Date('2025-01-09T15:20:00Z'),
    createdAt: new Date('2025-01-09T14:00:00Z'),
    isCurrent: false,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  },
  {
    id: 'session-789',
    deviceInfo: {
      browser: 'Firefox',
      os: 'Windows',
      device: 'Desktop PC',
      location: 'New York, NY',
    },
    ipAddress: '203.0.113.45',
    lastActivity: new Date('2025-01-08T12:10:00Z'),
    createdAt: new Date('2025-01-08T11:00:00Z'),
    isCurrent: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  },
];

const mockProps = {
  sessions: mockActiveSessions,
  onTerminateSession: vi.fn(),
  onTerminateAllSessions: vi.fn(),
  onRefresh: vi.fn(),
  currentSessionId: 'session-123',
};

describe('SessionManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Display', () => {
    it('should render active sessions list', () => {
      render(<SessionManager {...mockProps} />);
      
      expect(screen.getByText('Active Sessions')).toBeInTheDocument();
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(screen.getByText('Desktop PC')).toBeInTheDocument();
    });

    it('should mark current session clearly', () => {
      render(<SessionManager {...mockProps} />);
      
      expect(screen.getByText(/current session/i)).toBeInTheDocument();
      
      // Current session should have different styling
      const currentSessionCard = screen.getByText('MacBook Pro').closest('[data-testid="session-card"]');
      expect(currentSessionCard).toHaveAttribute('data-current', 'true');
    });

    it('should display device and browser information correctly', () => {
      render(<SessionManager {...mockProps} />);
      
      expect(screen.getByText('Chrome on macOS')).toBeInTheDocument();
      expect(screen.getByText('Safari on iOS')).toBeInTheDocument();
      expect(screen.getByText('Firefox on Windows')).toBeInTheDocument();
    });

    it('should show last activity timestamps', () => {
      render(<SessionManager {...mockProps} />);
      
      expect(screen.getByText(/Jan 10, 2025 at 10:30 AM/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 9, 2025 at 3:20 PM/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 8, 2025 at 12:10 PM/)).toBeInTheDocument();
    });

    it('should display location information', () => {
      render(<SessionManager {...mockProps} />);
      
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
      expect(screen.getByText('New York, NY')).toBeInTheDocument();
    });
  });

  describe('Session Termination', () => {
    it('should show terminate button for non-current sessions', () => {
      render(<SessionManager {...mockProps} />);
      
      const terminateButtons = screen.getAllByRole('button', { name: /terminate session/i });
      expect(terminateButtons).toHaveLength(2); // Only for non-current sessions
    });

    it('should not show terminate button for current session', () => {
      render(<SessionManager {...mockProps} />);
      
      const currentSessionCard = screen.getByText(/current session/i).closest('[data-testid="session-card"]');
      const terminateButton = within(currentSessionCard).queryByRole('button', { name: /terminate session/i });
      expect(terminateButton).not.toBeInTheDocument();
    });

    it('should handle individual session termination', async () => {
      const user = userEvent.setup();
      render(<SessionManager {...mockProps} />);
      
      const terminateButtons = screen.getAllByRole('button', { name: /terminate session/i });
      await user.click(terminateButtons[0]);
      
      expect(mockProps.onTerminateSession).toHaveBeenCalledWith('session-456');
    });

    it('should show confirmation dialog for session termination', async () => {
      const user = userEvent.setup();
      render(<SessionManager {...mockProps} />);
      
      const terminateButtons = screen.getAllByRole('button', { name: /terminate session/i });
      await user.click(terminateButtons[0]);
      
      expect(screen.getByText(/terminate this session/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm terminate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show terminate all sessions button', () => {
      render(<SessionManager {...mockProps} />);
      
      const terminateAllButton = screen.getByRole('button', { name: /terminate all other sessions/i });
      expect(terminateAllButton).toBeInTheDocument();
    });

    it('should handle terminate all sessions', async () => {
      const user = userEvent.setup();
      render(<SessionManager {...mockProps} />);
      
      const terminateAllButton = screen.getByRole('button', { name: /terminate all other sessions/i });
      await user.click(terminateAllButton);
      
      // Should show confirmation dialog
      expect(screen.getByText(/terminate all other sessions/i)).toBeInTheDocument();
      
      const confirmButton = screen.getByRole('button', { name: /confirm terminate all/i });
      await user.click(confirmButton);
      
      expect(mockProps.onTerminateAllSessions).toHaveBeenCalled();
    });
  });

  describe('Security Indicators', () => {
    it('should show security warnings for suspicious sessions', () => {
      const suspiciousSession = {
        ...mockActiveSessions[2],
        securityFlags: {
          suspicious: true,
          reason: 'Unusual location',
        },
      };
      
      const propsWithSuspicious = {
        ...mockProps,
        sessions: [mockActiveSessions[0], mockActiveSessions[1], suspiciousSession],
      };
      
      render(<SessionManager {...propsWithSuspicious} />);
      
      expect(screen.getByText(/security warning/i)).toBeInTheDocument();
      expect(screen.getByText(/unusual location/i)).toBeInTheDocument();
    });

    it('should highlight new login locations', () => {
      const newLocationSession = {
        ...mockActiveSessions[2],
        securityFlags: {
          newLocation: true,
        },
      };
      
      const propsWithNewLocation = {
        ...mockProps,
        sessions: [mockActiveSessions[0], mockActiveSessions[1], newLocationSession],
      };
      
      render(<SessionManager {...propsWithNewLocation} />);
      
      expect(screen.getByText(/new location/i)).toBeInTheDocument();
    });

    it('should show IP address information', () => {
      render(<SessionManager {...mockProps} />);
      
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.101')).toBeInTheDocument();
      expect(screen.getByText('203.0.113.45')).toBeInTheDocument();
    });
  });

  describe('Refresh and Real-time Updates', () => {
    it('should show refresh button', () => {
      render(<SessionManager {...mockProps} />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh sessions/i });
      expect(refreshButton).toBeInTheDocument();
    });

    it('should handle manual refresh', async () => {
      const user = userEvent.setup();
      render(<SessionManager {...mockProps} />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh sessions/i });
      await user.click(refreshButton);
      
      expect(mockProps.onRefresh).toHaveBeenCalled();
    });

    it('should show last updated timestamp', () => {
      render(<SessionManager {...mockProps} />);
      
      expect(screen.getByText(/last updated/i)).toBeInTheDocument();
    });

    it('should auto-refresh sessions periodically', async () => {
      render(<SessionManager {...mockProps} />);
      
      // Fast-forward time to trigger auto-refresh (5 minutes)
      await waitFor(() => {
        expect(mockProps.onRefresh).toHaveBeenCalled();
      }, { timeout: 6000 });
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      const emptyProps = { ...mockProps, sessions: [] };
    });

    it('should show empty state when no sessions', () => {
      const emptyProps = { ...mockProps, sessions: [] };
      render(<SessionManager {...emptyProps} />);
      
      expect(screen.getByText(/no active sessions/i)).toBeInTheDocument();
      expect(screen.getByText(/sign in to create a session/i)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during session termination', async () => {
      const slowTerminate = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      const props = { ...mockProps, onTerminateSession: slowTerminate };
      
      const user = userEvent.setup();
      render(<SessionManager {...props} />);
      
      const terminateButtons = screen.getAllByRole('button', { name: /terminate session/i });
      await user.click(terminateButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: /confirm terminate/i });
      await user.click(confirmButton);
      
      expect(screen.getByText(/terminating session/i)).toBeInTheDocument();
    });

    it('should show loading state during refresh', async () => {
      const slowRefresh = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      const props = { ...mockProps, onRefresh: slowRefresh };
      
      const user = userEvent.setup();
      render(<SessionManager {...props} />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh sessions/i });
      await user.click(refreshButton);
      
      expect(screen.getByText(/refreshing sessions/i)).toBeInTheDocument();
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when session termination fails', async () => {
      const failingTerminate = vi.fn().mockRejectedValue(new Error('Termination failed'));
      const props = { ...mockProps, onTerminateSession: failingTerminate };
      
      const user = userEvent.setup();
      render(<SessionManager {...props} />);
      
      const terminateButtons = screen.getAllByRole('button', { name: /terminate session/i });
      await user.click(terminateButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: /confirm terminate/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to terminate session/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should retry termination when retry button is clicked', async () => {
      const failingTerminate = vi.fn()
        .mockRejectedValueOnce(new Error('Termination failed'))
        .mockResolvedValueOnce(undefined);
      const props = { ...mockProps, onTerminateSession: failingTerminate };
      
      const user = userEvent.setup();
      render(<SessionManager {...props} />);
      
      const terminateButtons = screen.getAllByRole('button', { name: /terminate session/i });
      await user.click(terminateButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: /confirm terminate/i });
      await user.click(confirmButton);
      
      await waitFor(async () => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        await user.click(retryButton);
        
        expect(failingTerminate).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Consciousness-Aligned Features', () => {
    it('should display Sacred Boundary messaging for session security', () => {
      render(<SessionManager {...mockProps} />);
      
      expect(screen.getByText(/sacred boundary/i)).toBeInTheDocument();
      expect(screen.getByText(/protecting your digital presence/i)).toBeInTheDocument();
    });

    it('should show mindful session management guidance', () => {
      render(<SessionManager {...mockProps} />);
      
      expect(screen.getByText(/mindful digital presence/i)).toBeInTheDocument();
      expect(screen.getByText(/consciousness-aligned security/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<SessionManager {...mockProps} />);
      
      expect(screen.getByRole('region', { name: /session manager/i })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: /active sessions/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SessionManager {...mockProps} />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh sessions/i });
      
      // Tab to refresh button
      await user.tab();
      expect(refreshButton).toHaveFocus();
      
      // Tab to first terminate button
      await user.tab();
      const terminateButtons = screen.getAllByRole('button', { name: /terminate session/i });
      expect(terminateButtons[0]).toHaveFocus();
    });

    it('should announce session changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<SessionManager {...mockProps} />);
      
      const terminateButtons = screen.getAllByRole('button', { name: /terminate session/i });
      await user.click(terminateButtons[0]);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
      render(<SessionManager {...mockProps} />);
      
      expect(screen.getByTestId('mobile-session-layout')).toBeInTheDocument();
    });

    it('should stack session cards vertically on mobile', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
      render(<SessionManager {...mockProps} />);
      
      const sessionCards = screen.getAllByTestId('session-card');
      sessionCards.forEach(card => {
        expect(card).toHaveClass('mobile-stack');
      });
    });
  });

  describe('Data Formatting', () => {
    it('should format timestamps in user-friendly format', () => {
      render(<SessionManager {...mockProps} />);
      
      expect(screen.getByText(/Jan 10, 2025 at 10:30 AM/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 9, 2025 at 3:20 PM/)).toBeInTheDocument();
    });

    it('should show relative time for recent activity', () => {
      const recentSession = {
        ...mockActiveSessions[0],
        lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      };
      
      const propsWithRecent = {
        ...mockProps,
        sessions: [recentSession, ...mockActiveSessions.slice(1)],
      };
      
      render(<SessionManager {...propsWithRecent} />);
      
      expect(screen.getByText(/5 minutes ago/i)).toBeInTheDocument();
    });

    it('should mask IP addresses partially for privacy', () => {
      render(<SessionManager {...mockProps} />);
      
      expect(screen.getByText(/192.168.1.xxx/)).toBeInTheDocument();
      expect(screen.getByText(/203.0.113.xxx/)).toBeInTheDocument();
    });
  });
});