/**
 * Account Page Tests
 * RED Phase - These tests will fail until account page is implemented
 * Tests the main account management page integration
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import AccountPage from '../page';

// Mock OAuth Context
vi.mock('@/contexts/OAuthContext', () => ({
  useOAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      profilePicture: null,
      tier: 'patron',
      preferences: {
        theme: 'dark',
        notifications: true,
        language: 'en',
      },
      subscription: {
        id: 'sub-123',
        tier: 'patron',
        status: 'active',
        currentPeriodEnd: new Date('2025-02-01'),
      },
    },
    error: null,
  }),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock HexagonNavigation component
vi.mock('@/components/HexagonNavigation', () => ({
  default: ({ preset, className, children }: any) => (
    <div data-testid="hexagon-nav" data-preset={preset} className={className}>
      {children}
    </div>
  ),
}));

// Mock account components
vi.mock('@/components/account/UserProfile', () => ({
  default: ({ user, onSave, onCancel }: any) => (
    <div data-testid="user-profile">
      <h2>User Profile</h2>
      <div>Name: {user?.firstName} {user?.lastName}</div>
      <button onClick={() => onSave?.({ firstName: 'Updated' })}>Save Profile</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('@/components/account/SubscriptionManager', () => ({
  default: ({ subscription, onUpgrade, onManage, onCancel }: any) => (
    <div data-testid="subscription-manager">
      <h2>Subscription Management</h2>
      <div>Tier: {subscription?.tier}</div>
      <button onClick={onUpgrade}>Upgrade</button>
      <button onClick={onManage}>Manage Billing</button>
      <button onClick={onCancel}>Cancel Subscription</button>
    </div>
  ),
}));

vi.mock('@/components/account/BillingHistory', () => ({
  default: ({ userId }: any) => (
    <div data-testid="billing-history">
      <h2>Billing History</h2>
      <div>User ID: {userId}</div>
    </div>
  ),
}));

vi.mock('@/components/account/AccountSettings', () => ({
  default: ({ user, onSave, onDeleteAccount, onExportData }: any) => (
    <div data-testid="account-settings">
      <h2>Account Settings</h2>
      <div>Theme: {user?.preferences.theme}</div>
      <button onClick={() => onSave?.({ preferences: { theme: 'light' } })}>Save Settings</button>
      <button onClick={onDeleteAccount}>Delete Account</button>
      <button onClick={onExportData}>Export Data</button>
    </div>
  ),
}));

vi.mock('@/components/account/SessionManager', () => ({
  default: ({ sessions, onTerminateSession, onRefresh }: any) => (
    <div data-testid="session-manager">
      <h2>Session Management</h2>
      <div>Sessions: {sessions?.length || 0}</div>
      <button onClick={() => onTerminateSession?.('session-123')}>Terminate Session</button>
      <button onClick={onRefresh}>Refresh Sessions</button>
    </div>
  ),
}));

// Mock API calls
global.fetch = vi.fn();

describe('Account Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe('Page Structure and Layout', () => {
    it('should render account page with all main sections', async () => {
      render(<AccountPage />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Account Management')).toBeInTheDocument();
      
      // Should render all component sections
      expect(screen.getByTestId('user-profile')).toBeInTheDocument();
      expect(screen.getByTestId('subscription-manager')).toBeInTheDocument();
      expect(screen.getByTestId('billing-history')).toBeInTheDocument();
      expect(screen.getByTestId('account-settings')).toBeInTheDocument();
      expect(screen.getByTestId('session-manager')).toBeInTheDocument();
    });

    it('should use HexagonNavigation for consistent UI patterns', () => {
      render(<AccountPage />);
      
      const hexagonNav = screen.getByTestId('hexagon-nav');
      expect(hexagonNav).toBeInTheDocument();
      expect(hexagonNav).toHaveAttribute('data-preset', 'nav');
    });

    it('should have proper heading hierarchy', () => {
      render(<AccountPage />);
      
      const mainHeading = screen.getByRole('heading', { level: 1, name: /account management/i });
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      
      expect(mainHeading).toBeInTheDocument();
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it('should render with responsive layout', () => {
      render(<AccountPage />);
      
      const mainContainer = screen.getByRole('main');
      expect(mainContainer).toHaveClass('account-page-container');
    });
  });

  describe('Navigation and Tabs', () => {
    it('should render navigation tabs for different sections', () => {
      render(<AccountPage />);
      
      const tabs = screen.getByRole('tablist');
      expect(tabs).toBeInTheDocument();
      
      const profileTab = screen.getByRole('tab', { name: /profile/i });
      const subscriptionTab = screen.getByRole('tab', { name: /subscription/i });
      const billingTab = screen.getByRole('tab', { name: /billing/i });
      const settingsTab = screen.getByRole('tab', { name: /settings/i });
      const sessionsTab = screen.getByRole('tab', { name: /sessions/i });
      
      expect(profileTab).toBeInTheDocument();
      expect(subscriptionTab).toBeInTheDocument();
      expect(billingTab).toBeInTheDocument();
      expect(settingsTab).toBeInTheDocument();
      expect(sessionsTab).toBeInTheDocument();
    });

    it('should handle tab navigation', async () => {
      const user = userEvent.setup();
      render(<AccountPage />);
      
      const subscriptionTab = screen.getByRole('tab', { name: /subscription/i });
      await user.click(subscriptionTab);
      
      expect(subscriptionTab).toHaveAttribute('aria-selected', 'true');
      
      const subscriptionPanel = screen.getByRole('tabpanel');
      expect(subscriptionPanel).toBeInTheDocument();
    });

    it('should support keyboard navigation between tabs', async () => {
      const user = userEvent.setup();
      render(<AccountPage />);
      
      const firstTab = screen.getByRole('tab', { name: /profile/i });
      firstTab.focus();
      
      // Arrow right to next tab
      await user.keyboard('{ArrowRight}');
      
      const secondTab = screen.getByRole('tab', { name: /subscription/i });
      expect(secondTab).toHaveFocus();
    });

    it('should update URL when tab changes', async () => {
      const mockPush = vi.fn();
      vi.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        replace: vi.fn(),
        back: vi.fn(),
      });

      const user = userEvent.setup();
      render(<AccountPage />);
      
      const subscriptionTab = screen.getByRole('tab', { name: /subscription/i });
      await user.click(subscriptionTab);
      
      expect(mockPush).toHaveBeenCalledWith('/account?tab=subscription', { scroll: false });
    });
  });

  describe('Component Integration', () => {
    it('should handle user profile updates', async () => {
      const user = userEvent.setup();
      render(<AccountPage />);
      
      const saveButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/users/profile', expect.any(Object));
      });
    });

    it('should handle subscription management actions', async () => {
      const user = userEvent.setup();
      render(<AccountPage />);
      
      const manageButton = screen.getByRole('button', { name: /manage billing/i });
      await user.click(manageButton);
      
      // Should redirect to Stripe customer portal
      expect(fetch).toHaveBeenCalledWith('/api/billing/customer-portal', expect.any(Object));
    });

    it('should handle account settings updates', async () => {
      const user = userEvent.setup();
      render(<AccountPage />);
      
      const saveSettingsButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveSettingsButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/users/preferences', expect.any(Object));
      });
    });

    it('should handle session management actions', async () => {
      const user = userEvent.setup();
      render(<AccountPage />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh sessions/i });
      await user.click(refreshButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/sessions', expect.any(Object));
      });
    });
  });

  describe('Data Loading and Error Handling', () => {
    it('should show loading states during data fetching', async () => {
      const slowFetch = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      global.fetch = slowFetch;

      render(<AccountPage />);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('API Error'));

      render(<AccountPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load account data/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('should handle network errors with retry functionality', async () => {
      (fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const user = userEvent.setup();
      render(<AccountPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
      });
    });

    it('should handle partial data loading failures', async () => {
      // Mock one API call failing
      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/auth/sessions')) {
          return Promise.reject(new Error('Sessions unavailable'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      render(<AccountPage />);
      
      // Should still render other sections
      expect(screen.getByTestId('user-profile')).toBeInTheDocument();
      expect(screen.getByTestId('subscription-manager')).toBeInTheDocument();
      
      // Sessions section should show error
      await waitFor(() => {
        expect(screen.getByText(/sessions unavailable/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render mobile layout on small screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<AccountPage />);
      
      expect(screen.getByTestId('mobile-account-layout')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
    });

    it('should collapse sections in mobile accordion style', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const user = userEvent.setup();
      render(<AccountPage />);
      
      const profileHeader = screen.getByRole('button', { name: /profile/i });
      await user.click(profileHeader);
      
      const profileContent = screen.getByTestId('user-profile');
      expect(profileContent).toHaveAttribute('aria-expanded', 'true');
    });

    it('should maintain functionality on tablet screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<AccountPage />);
      
      expect(screen.getByTestId('tablet-account-layout')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<AccountPage />);
      
      const mainRegion = screen.getByRole('main');
      const tablist = screen.getByRole('tablist');
      
      expect(mainRegion).toHaveAttribute('aria-label', /account management/i);
      expect(tablist).toHaveAttribute('aria-label', /account sections/i);
    });

    it('should support skip links for keyboard users', () => {
      render(<AccountPage />);
      
      const skipToContent = screen.getByRole('link', { name: /skip to content/i });
      const skipToSettings = screen.getByRole('link', { name: /skip to settings/i });
      
      expect(skipToContent).toBeInTheDocument();
      expect(skipToSettings).toBeInTheDocument();
    });

    it('should announce tab changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<AccountPage />);
      
      const subscriptionTab = screen.getByRole('tab', { name: /subscription/i });
      await user.click(subscriptionTab);
      
      const announcer = screen.getByRole('status');
      expect(announcer).toHaveTextContent(/subscription section selected/i);
    });

    it('should maintain focus management during tab navigation', async () => {
      const user = userEvent.setup();
      render(<AccountPage />);
      
      const profileTab = screen.getByRole('tab', { name: /profile/i });
      profileTab.focus();
      
      await user.keyboard('{ArrowRight}');
      
      const subscriptionTab = screen.getByRole('tab', { name: /subscription/i });
      expect(subscriptionTab).toHaveFocus();
    });
  });

  describe('URL State Management', () => {
    it('should load correct tab from URL parameter', () => {
      vi.mocked(require('next/navigation').useSearchParams).mockReturnValue({
        get: (key: string) => key === 'tab' ? 'billing' : null,
      });

      render(<AccountPage />);
      
      const billingTab = screen.getByRole('tab', { name: /billing/i });
      expect(billingTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should default to profile tab when no URL parameter', () => {
      vi.mocked(require('next/navigation').useSearchParams).mockReturnValue({
        get: () => null,
      });

      render(<AccountPage />);
      
      const profileTab = screen.getByRole('tab', { name: /profile/i });
      expect(profileTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should handle invalid tab parameter gracefully', () => {
      vi.mocked(require('next/navigation').useSearchParams).mockReturnValue({
        get: (key: string) => key === 'tab' ? 'invalid-tab' : null,
      });

      render(<AccountPage />);
      
      const profileTab = screen.getByRole('tab', { name: /profile/i });
      expect(profileTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Performance Optimization', () => {
    it('should lazy load tab content', async () => {
      render(<AccountPage />);
      
      // Only active tab content should be rendered initially
      expect(screen.getByTestId('user-profile')).toBeInTheDocument();
      
      const subscriptionTab = screen.getByRole('tab', { name: /subscription/i });
      const user = userEvent.setup();
      await user.click(subscriptionTab);
      
      expect(screen.getByTestId('subscription-manager')).toBeInTheDocument();
    });

    it('should cache tab content after initial load', async () => {
      const user = userEvent.setup();
      render(<AccountPage />);
      
      const subscriptionTab = screen.getByRole('tab', { name: /subscription/i });
      await user.click(subscriptionTab);
      
      const profileTab = screen.getByRole('tab', { name: /profile/i });
      await user.click(profileTab);
      
      await user.click(subscriptionTab);
      
      // Content should still be available (cached)
      expect(screen.getByTestId('subscription-manager')).toBeInTheDocument();
    });

    it('should debounce API calls during rapid interactions', async () => {
      const user = userEvent.setup();
      render(<AccountPage />);
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      
      // Click multiple times rapidly
      await user.click(saveButton);
      await user.click(saveButton);
      await user.click(saveButton);
      
      // Should only make one API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});