import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import SystemHealthMonitor from '../SystemHealthMonitor';

// Mock the service health module
jest.mock('@/lib/serviceHealth', () => ({
  checkSystemHealth: jest.fn(),
  getServiceMetrics: jest.fn()
}));

describe('SystemHealthMonitor', () => {
  const mockHealthData = {
    backend: {
      status: 'healthy' as const,
      responseTime: 45,
      lastCheck: new Date('2025-09-03T15:30:00Z')
    },
    database: {
      neo4j: {
        status: 'healthy' as const,
        connectionPool: 8,
        activeQueries: 2
      },
      mongodb: {
        status: 'warning' as const,
        connectionPool: 5,
        activeConnections: 12
      },
      redis: {
        status: 'healthy' as const,
        memoryUsage: '45%',
        keyCount: 1234
      }
    },
    integrations: {
      'coordinate-resolution': {
        status: 'healthy' as const,
        avgResponseTime: 12,
        successRate: 99.8
      },
      'oauth-integration': {
        status: 'healthy' as const,
        avgResponseTime: 78,
        successRate: 100
      },
      'user-authentication': {
        status: 'warning' as const,
        avgResponseTime: 156,
        successRate: 97.2
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display system health overview', () => {
    render(<SystemHealthMonitor />);
    expect(screen.getByText('System Health Monitor')).toBeInTheDocument();
  });

  it('should show backend service status', async () => {
    jest.mocked(require('@/lib/serviceHealth').checkSystemHealth).mockResolvedValue(mockHealthData);
    
    render(<SystemHealthMonitor />);
    
    await waitFor(() => {
      expect(screen.getByTestId('backend-status')).toBeInTheDocument();
    });
  });

  it('should display database health indicators', async () => {
    jest.mocked(require('@/lib/serviceHealth').checkSystemHealth).mockResolvedValue(mockHealthData);
    
    render(<SystemHealthMonitor />);
    
    await waitFor(() => {
      expect(screen.getByTestId('database-neo4j')).toBeInTheDocument();
      expect(screen.getByTestId('database-mongodb')).toBeInTheDocument();
      expect(screen.getByTestId('database-redis')).toBeInTheDocument();
    });
  });

  it('should show integration service metrics', async () => {
    jest.mocked(require('@/lib/serviceHealth').checkSystemHealth).mockResolvedValue(mockHealthData);
    
    render(<SystemHealthMonitor />);
    
    await waitFor(() => {
      expect(screen.getByTestId('integration-coordinate-resolution')).toBeInTheDocument();
      expect(screen.getByTestId('integration-oauth-integration')).toBeInTheDocument();
      expect(screen.getByTestId('integration-user-authentication')).toBeInTheDocument();
    });
  });

  it('should display response time metrics', async () => {
    jest.mocked(require('@/lib/serviceHealth').checkSystemHealth).mockResolvedValue(mockHealthData);
    
    render(<SystemHealthMonitor />);
    
    await waitFor(() => {
      expect(screen.getByText('45ms')).toBeInTheDocument(); // backend response time
      expect(screen.getByText('12ms')).toBeInTheDocument(); // coordinate resolution
    });
  });

  it('should show warning status for degraded services', async () => {
    jest.mocked(require('@/lib/serviceHealth').checkSystemHealth).mockResolvedValue(mockHealthData);
    
    render(<SystemHealthMonitor />);
    
    await waitFor(() => {
      expect(screen.getByTestId('status-warning')).toBeInTheDocument();
    });
  });

  it('should refresh health data automatically', async () => {
    const mockCheck = jest.fn().mockResolvedValue(mockHealthData);
    jest.mocked(require('@/lib/serviceHealth').checkSystemHealth).mockImplementation(mockCheck);
    
    render(<SystemHealthMonitor refreshInterval={100} />);
    
    await waitFor(() => {
      expect(mockCheck).toHaveBeenCalledTimes(1);
    });

    // Wait for refresh interval
    await new Promise(resolve => setTimeout(resolve, 150));
    
    await waitFor(() => {
      expect(mockCheck).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle health check errors gracefully', async () => {
    jest.mocked(require('@/lib/serviceHealth').checkSystemHealth).mockRejectedValue(new Error('Network error'));
    
    render(<SystemHealthMonitor />);
    
    await waitFor(() => {
      expect(screen.getByTestId('health-check-error')).toBeInTheDocument();
    });
  });
});