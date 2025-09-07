import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrchestratorStatusPage from '../page';

// Mock fetch globally
global.fetch = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe('OrchestratorStatusPage', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  const mockCapabilitiesResponse = {
    success: true,
    data: {
      models_count: 2,
      personas_available: ['nara', 'epii', 'system'],
      streaming_supported: true,
      ag_ui_protocol: true
    }
  };

  const mockStatusResponse = {
    success: true,
    data: {
      session_id: 'cli-session-test',
      active_persona: 'system',
      model_name: 'gemini:gemini-2.5-flash',
      streaming_enabled: true
    }
  };

  beforeEach(() => {
    mockFetch.mockClear();
    
    // Default successful responses for initialization
    mockFetch
      .mockResolvedValueOnce({
        json: async () => mockCapabilitiesResponse
      } as Response)
      .mockResolvedValueOnce({
        json: async () => mockStatusResponse
      } as Response);
  });

  test('renders status dashboard correctly', async () => {
    await act(async () => {
      render(<OrchestratorStatusPage />);
    });
    
    // Check main elements are present
    expect(screen.getByText('Orchestrator Status Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Real-time monitoring of CLI capabilities/)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });
  });

  test('loads system health data on mount', async () => {
    render(<OrchestratorStatusPage />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/dev/orchestrator/cli-bridge?command=capabilities');
      expect(mockFetch).toHaveBeenCalledWith('/api/dev/orchestrator/cli-bridge?command=status');
    });
  });

  test('displays system health overview correctly', async () => {
    render(<OrchestratorStatusPage />);

    await waitFor(() => {
      // Check orchestrator status
      expect(screen.getByText('Orchestrator')).toBeInTheDocument();
      expect(screen.getByText('healthy')).toBeInTheDocument();
      
      // Check models count
      expect(screen.getByText('Models')).toBeInTheDocument();
      expect(screen.getByText('2 available')).toBeInTheDocument();
      
      // Check personas count
      expect(screen.getByText('Personas')).toBeInTheDocument();
      expect(screen.getByText('3 loaded')).toBeInTheDocument();
      
      // Check active sessions
      expect(screen.getByText('Active Sessions')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  test('displays infrastructure status', async () => {
    render(<OrchestratorStatusPage />);

    await waitFor(() => {
      // Check infrastructure components
      expect(screen.getByText('Infrastructure Status')).toBeInTheDocument();
      expect(screen.getByText('Redis')).toBeInTheDocument();
      expect(screen.getByText('MongoDB')).toBeInTheDocument();
      expect(screen.getByText('GraphQL')).toBeInTheDocument();
      expect(screen.getByText('AG-UI Protocol')).toBeInTheDocument();
      
      // All should show as connected/enabled initially
      const connectedElements = screen.getAllByText('connected');
      const availableElements = screen.getAllByText('available');
      const enabledElements = screen.getAllByText('enabled');
      
      expect(connectedElements.length + availableElements.length + enabledElements.length).toBeGreaterThan(0);
    });
  });

  test('shows active sessions table', async () => {
    render(<OrchestratorStatusPage />);

    await waitFor(() => {
      // Check sessions table headers
      expect(screen.getByText('Session ID')).toBeInTheDocument();
      expect(screen.getByText('Persona')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Streaming')).toBeInTheDocument();
      
      // Check session data
      expect(screen.getByText('cli-session-test')).toBeInTheDocument();
      expect(screen.getByText('system')).toBeInTheDocument();
      expect(screen.getByText('gemini:gemini-2.5-flash')).toBeInTheDocument();
      expect(screen.getByText('ON')).toBeInTheDocument();
    });
  });

  test('displays system metrics', async () => {
    render(<OrchestratorStatusPage />);

    await waitFor(() => {
      expect(screen.getByText('System Metrics')).toBeInTheDocument();
      expect(screen.getByText('Uptime:')).toBeInTheDocument();
      expect(screen.getByText('Total Requests:')).toBeInTheDocument();
      expect(screen.getByText('Success Rate:')).toBeInTheDocument();
      expect(screen.getByText('Failed Requests:')).toBeInTheDocument();
      expect(screen.getByText('Avg Response Time:')).toBeInTheDocument();
    });
  });

  test('shows recent traces', async () => {
    render(<OrchestratorStatusPage />);

    await waitFor(() => {
      expect(screen.getByText('Recent Traces')).toBeInTheDocument();
      
      // Should show at least one trace with mock data
      const traceElements = screen.getAllByText(/trace-/);
      expect(traceElements.length).toBeGreaterThan(0);
    });
  });

  test('handles auto-refresh toggle', async () => {
    render(<OrchestratorStatusPage />);

    await waitFor(() => {
      const autoRefreshCheckbox = screen.getByLabelText('Auto-refresh');
      expect(autoRefreshCheckbox).toBeChecked();
      
      // Toggle auto-refresh off
      fireEvent.click(autoRefreshCheckbox);
      expect(autoRefreshCheckbox).not.toBeChecked();
      
      // Refresh interval dropdown should be disabled
      const intervalSelect = screen.getByDisplayValue('5s');
      expect(intervalSelect).toBeDisabled();
    });
  });

  test('handles manual refresh', async () => {
    render(<OrchestratorStatusPage />);

    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
      
      // Clear previous fetch calls
      mockFetch.mockClear();
      
      // Mock new responses
      mockFetch
        .mockResolvedValueOnce({
          json: async () => mockCapabilitiesResponse
        } as Response)
        .mockResolvedValueOnce({
          json: async () => mockStatusResponse
        } as Response);
      
      // Click refresh
      fireEvent.click(refreshButton);
    });

    // Should make API calls again
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/dev/orchestrator/cli-bridge?command=capabilities');
      expect(mockFetch).toHaveBeenCalledWith('/api/dev/orchestrator/cli-bridge?command=status');
    });
  });

  test('changes refresh interval', async () => {
    render(<OrchestratorStatusPage />);

    await waitFor(() => {
      const intervalSelect = screen.getByDisplayValue('5s');
      expect(intervalSelect).toBeInTheDocument();
      
      // Change interval to 1s
      fireEvent.change(intervalSelect, { target: { value: '1000' } });
      expect(screen.getByDisplayValue('1s')).toBeInTheDocument();
    });
  });

  test('displays loading state correctly', () => {
    // Mock loading state by not resolving initial promises
    mockFetch.mockReturnValue(new Promise(() => {}) as any);
    
    render(<OrchestratorStatusPage />);
    
    // Should show loading spinner
    expect(screen.getByText('Loading Status Dashboard...')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    // Mock API errors
    mockFetch
      .mockRejectedValueOnce(new Error('Capabilities API Error'))
      .mockRejectedValueOnce(new Error('Status API Error'));

    // Spy on console.error to suppress error logs in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<OrchestratorStatusPage />);

    await waitFor(() => {
      // Should show degraded status when APIs fail
      expect(screen.getByText('down')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  test('displays status colors correctly', async () => {
    render(<OrchestratorStatusPage />);

    await waitFor(() => {
      // Healthy status should have green color class
      const healthyElement = screen.getByText('healthy');
      expect(healthyElement).toHaveClass('text-green-400');
      
      // Connected status should have green color class
      const connectedElements = screen.getAllByText('connected');
      connectedElements.forEach(element => {
        expect(element).toHaveClass('text-green-400');
      });
      
      // Enabled status should have green color class
      const enabledElements = screen.getAllByText('enabled');
      enabledElements.forEach(element => {
        expect(element).toHaveClass('text-green-400');
      });
    });
  });

  test('navigates to chat interface', async () => {
    render(<OrchestratorStatusPage />);

    await waitFor(() => {
      const chatLink = screen.getByText('Chat Interface');
      expect(chatLink).toBeInTheDocument();
      expect(chatLink.closest('a')).toHaveAttribute('href', '/dev/orchestrator/chat');
    });
  });

  test('navigates back to dashboard', async () => {
    render(<OrchestratorStatusPage />);

    await waitFor(() => {
      const backLink = screen.getByText('← Back to Dashboard');
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/dev/dashboard');
    });
  });
});