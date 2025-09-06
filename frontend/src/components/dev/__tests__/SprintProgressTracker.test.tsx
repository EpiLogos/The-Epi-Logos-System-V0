import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } // Jest globals available;
import SprintProgressTracker from '../SprintProgressTracker';

describe('SprintProgressTracker', () => {
  const mockSprintData = {
    sprintNumber: 2,
    stories: [
      {
        id: '02.10.1',
        title: 'User Account Backend Foundation',
        status: 'in_progress' as const,
        completion: 75,
        lastUpdated: new Date('2025-09-03T15:00:00Z')
      },
      {
        id: '02.10.3',
        title: 'Frontend Account Management',
        status: 'todo' as const,
        completion: 0,
        lastUpdated: new Date('2025-09-03T14:00:00Z')
      }
    ],
    integrationHealth: {
      'oauth-context': 'healthy' as const,
      'coordinate-resolution': 'healthy' as const,
      'user-backend': 'warning' as const
    }
  };

  it('should render sprint number and title', () => {
    render(<SprintProgressTracker {...mockSprintData} />);
    expect(screen.getByText('Sprint 2: Orchestration Foundation')).toBeInTheDocument();
  });

  it('should display story progress with completion percentages', () => {
    render(<SprintProgressTracker {...mockSprintData} />);
    expect(screen.getByText('User Account Backend Foundation')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Frontend Account Management')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should show story status indicators', () => {
    render(<SprintProgressTracker {...mockSprintData} />);
    expect(screen.getByTestId('story-status-in_progress')).toBeInTheDocument();
    expect(screen.getByTestId('story-status-todo')).toBeInTheDocument();
  });

  it('should display integration health status', () => {
    render(<SprintProgressTracker {...mockSprintData} />);
    expect(screen.getByTestId('integration-oauth-context')).toBeInTheDocument();
    expect(screen.getByTestId('integration-coordinate-resolution')).toBeInTheDocument();
    expect(screen.getByTestId('integration-user-backend')).toBeInTheDocument();
  });

  it('should show visual progress bars for stories', () => {
    render(<SprintProgressTracker {...mockSprintData} />);
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(mockSprintData.stories.length);
  });

  it('should calculate overall sprint completion percentage', () => {
    render(<SprintProgressTracker {...mockSprintData} />);
    // (75 + 0) / 2 = 37.5%
    expect(screen.getByText('38% Complete')).toBeInTheDocument();
  });

  it('should display last updated timestamps', () => {
    render(<SprintProgressTracker {...mockSprintData} />);
    expect(screen.getByText(/last updated/i)).toBeInTheDocument();
  });
});