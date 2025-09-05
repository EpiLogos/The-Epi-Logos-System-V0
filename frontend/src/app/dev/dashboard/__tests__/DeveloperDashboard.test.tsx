import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DeveloperDashboard from '../page';

// Mock the system health service
vi.mock('@/lib/serviceHealth', () => ({
  checkSystemHealth: vi.fn(),
  getSprintStatus: vi.fn(),
  getStoryProgress: vi.fn()
}));

// Mock HexagonNavigation component
vi.mock('@/components/HexagonNavigation', () => ({
  default: ({ onClick, children }: { onClick?: () => void; children?: React.ReactNode }) => (
    <div data-testid="hexagon-nav" onClick={onClick}>
      {children || 'HexagonNavigation'}
    </div>
  )
}));

describe('DeveloperDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('should render the main dashboard title', () => {
      render(<DeveloperDashboard />);
      expect(screen.getByText('Developer Control Center')).toBeInTheDocument();
    });

    it('should render the sprint overview section', () => {
      render(<DeveloperDashboard />);
      expect(screen.getByTestId('sprint-overview')).toBeInTheDocument();
    });

    it('should render the system health monitor', () => {
      render(<DeveloperDashboard />);
      expect(screen.getByTestId('system-health-monitor')).toBeInTheDocument();
    });

    it('should render navigation to sprint-specific pages', () => {
      render(<DeveloperDashboard />);
      expect(screen.getByText('Sprint 1 Testing')).toBeInTheDocument();
      expect(screen.getByText('Sprint 2 Testing')).toBeInTheDocument();
    });
  });

  describe('Sprint Progress Tracking', () => {
    it('should display Sprint 1 completion status', async () => {
      render(<DeveloperDashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('sprint-1-status')).toBeInTheDocument();
      });
    });

    it('should display Sprint 2 current progress', async () => {
      render(<DeveloperDashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('sprint-2-status')).toBeInTheDocument();
      });
    });

    it('should show story progress indicators', async () => {
      render(<DeveloperDashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('story-progress-indicators')).toBeInTheDocument();
      });
    });
  });

  describe('System Health Monitoring', () => {
    it('should display backend service status', async () => {
      render(<DeveloperDashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('backend-service-status')).toBeInTheDocument();
      });
    });

    it('should show database connection health', async () => {
      render(<DeveloperDashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('database-health')).toBeInTheDocument();
      });
    });

    it('should display integration status indicators', async () => {
      render(<DeveloperDashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('integration-status')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should have links to sprint testing pages', () => {
      render(<DeveloperDashboard />);
      expect(screen.getByRole('link', { name: /sprint 1 testing/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sprint 2 testing/i })).toBeInTheDocument();
    });

    it('should include return to main app navigation', () => {
      render(<DeveloperDashboard />);
      expect(screen.getByRole('link', { name: /back to main app/i })).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh system health data periodically', async () => {
      const mockCheckSystemHealth = vi.fn().mockResolvedValue({
        backend: 'healthy',
        database: 'healthy',
        integrations: 'healthy'
      });

      vi.mocked(require('@/lib/serviceHealth').checkSystemHealth).mockImplementation(mockCheckSystemHealth);

      render(<DeveloperDashboard />);
      
      await waitFor(() => {
        expect(mockCheckSystemHealth).toHaveBeenCalled();
      });
    });

    it('should update sprint progress in real-time', async () => {
      const mockGetSprintStatus = vi.fn().mockResolvedValue({
        sprint1: 'complete',
        sprint2: 'in_progress'
      });

      vi.mocked(require('@/lib/serviceHealth').getSprintStatus).mockImplementation(mockGetSprintStatus);

      render(<DeveloperDashboard />);
      
      await waitFor(() => {
        expect(mockGetSprintStatus).toHaveBeenCalled();
      });
    });
  });
});