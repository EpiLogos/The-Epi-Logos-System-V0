import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrchestratorChatPage from '../page';

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

describe('OrchestratorChatPage', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch.mockClear();
    
    // Default successful responses for initialization
    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            models: [
              { name: 'gemini:gemini-2.5-flash', provider: 'gemini', ready: true },
              { name: 'openai:gpt-4o', provider: 'openai', ready: true }
            ],
            current_model: 'gemini:gemini-2.5-flash',
            default_model: 'gemini:gemini-2.5-flash'
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            personas: ['nara', 'epii', 'system'],
            current_persona: 'system'
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            session_id: 'test-session-123',
            model_name: 'gemini:gemini-2.5-flash',
            active_persona: 'system',
            system_hash: 'abc123',
            streaming_enabled: true,
            stream_timeout: 10
          }
        })
      } as Response);
  });

  test('renders orchestrator chat interface correctly', async () => {
    render(<OrchestratorChatPage />);
    
    // Check main elements are present
    expect(screen.getByText('Orchestrator Chat Interface')).toBeInTheDocument();
    expect(screen.getByText(/Web portal for CLI testing capabilities/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type your message or CLI command/)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('gemini:gemini-2.5-flash')).toBeInTheDocument();
    });
  });

  test('loads initial data on mount', async () => {
    render(<OrchestratorChatPage />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/dev/orchestrator/cli-bridge?command=models');
      expect(mockFetch).toHaveBeenCalledWith('/api/dev/orchestrator/cli-bridge?command=personas');
      expect(mockFetch).toHaveBeenCalledWith('/api/dev/orchestrator/cli-bridge?command=status');
    });
  });

  test('handles CLI command execution', async () => {
    // Mock command execution response
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          models: [
            { name: 'gemini:gemini-2.5-flash', provider: 'gemini', ready: true }
          ]
        }
      })
    } as Response);

    render(<OrchestratorChatPage />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type your message or CLI command/)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Type your message or CLI command/);
    const sendButton = screen.getByText('Send');

    // Type a CLI command
    fireEvent.change(input, { target: { value: '/models' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/dev/orchestrator/cli-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'models' })
      });
    });
  });

  test('handles streaming message sending', async () => {
    // Mock streaming response
    const mockBody = {
      getReader: jest.fn(() => ({
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"content":"Hello","persona":"system","model":"gemini:gemini-2.5-flash","timestamp":"2023-01-01T00:00:00.000Z"}\n\n')
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          })
      }))
    };

    mockFetch.mockResolvedValueOnce({
      body: mockBody
    } as any);

    render(<OrchestratorChatPage />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type your message or CLI command/)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Type your message or CLI command/);
    const sendButton = screen.getByText('Send');

    // Type a regular message (not a command)
    fireEvent.change(input, { target: { value: 'Hello orchestrator' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/dev/orchestrator/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello orchestrator',
          persona: 'system',
          model: 'gemini:gemini-2.5-flash'
        })
      });
    });

    // Check that message appears in chat
    await waitFor(() => {
      expect(screen.getByText('Hello orchestrator')).toBeInTheDocument();
    });
  });

  test('displays model and persona selection controls', async () => {
    render(<OrchestratorChatPage />);

    await waitFor(() => {
      // Check model selector
      const modelSelect = screen.getByLabelText('Model');
      expect(modelSelect).toBeInTheDocument();
      
      // Check persona selector
      const personaSelect = screen.getByLabelText('Persona');
      expect(personaSelect).toBeInTheDocument();
      
      // Check streaming toggle
      const streamingToggle = screen.getByLabelText('Enable Streaming');
      expect(streamingToggle).toBeInTheDocument();
      expect(streamingToggle).toBeChecked();
    });
  });

  test('shows CLI commands reference', async () => {
    render(<OrchestratorChatPage />);

    await waitFor(() => {
      // Find and click the CLI Commands section
      const cliCommandsButton = screen.getByText('Show');
      fireEvent.click(cliCommandsButton);
      
      // Check that some CLI commands are displayed
      expect(screen.getByText('/help')).toBeInTheDocument();
      expect(screen.getByText('/models')).toBeInTheDocument();
      expect(screen.getByText('/personas')).toBeInTheDocument();
      expect(screen.getByText('/status')).toBeInTheDocument();
    });
  });

  test('handles keyboard shortcuts', async () => {
    render(<OrchestratorChatPage />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type your message or CLI command/)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Type your message or CLI command/);
    
    // Type a message
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    // Press Enter (should send message)
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    // Check that input was cleared (indicating message was sent)
    expect(input.value).toBe('');
  });

  test('disables input and send button when loading', async () => {
    render(<OrchestratorChatPage />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type your message or CLI command/)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Type your message or CLI command/);
    const sendButton = screen.getByText('Send');

    // Initially should not be disabled
    expect(input).not.toBeDisabled();
    expect(sendButton).not.toBeDisabled();

    // Type a message and send it
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    // Mock pending streaming response
    const pendingPromise = new Promise(() => {}); // Never resolves
    mockFetch.mockReturnValueOnce(pendingPromise as any);
    
    fireEvent.click(sendButton);
    
    // Should show loading state immediately
    await waitFor(() => {
      expect(screen.getByText(/Processing.../)).toBeInTheDocument();
    });
  });

  test('displays session status information', async () => {
    render(<OrchestratorChatPage />);

    await waitFor(() => {
      // Check that session info is displayed
      expect(screen.getByText('Session Status')).toBeInTheDocument();
      expect(screen.getByText('test-session-123')).toBeInTheDocument();
      expect(screen.getByText('abc123')).toBeInTheDocument();
      expect(screen.getByText('10s')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    mockFetch
      .mockRejectedValueOnce(new Error('API Error'))
      .mockRejectedValueOnce(new Error('API Error'))
      .mockRejectedValueOnce(new Error('API Error'));

    // Spy on console.error to suppress error logs in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<OrchestratorChatPage />);

    // Component should still render despite API errors
    expect(screen.getByText('Orchestrator Chat Interface')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});