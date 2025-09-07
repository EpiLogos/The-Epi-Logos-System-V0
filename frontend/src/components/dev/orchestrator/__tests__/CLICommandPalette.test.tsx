import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CLICommandPalette from '../CLICommandPalette';

describe('CLICommandPalette', () => {
  const mockExecuteCommand = jest.fn();

  const defaultProps = {
    onExecuteCommand: mockExecuteCommand,
    currentModel: 'gemini:gemini-2.5-flash',
    currentPersona: 'system',
    streamingEnabled: true
  };

  beforeEach(() => {
    mockExecuteCommand.mockClear();
  });

  test('renders command palette button correctly', () => {
    render(<CLICommandPalette {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('CLI Commands');
  });

  test('opens and closes command palette', () => {
    render(<CLICommandPalette {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    
    // Initially closed
    expect(screen.queryByPlaceholderText('Search commands...')).not.toBeInTheDocument();
    
    // Open palette
    fireEvent.click(button);
    expect(screen.getByPlaceholderText('Search commands...')).toBeInTheDocument();
    
    // Close by clicking button again
    fireEvent.click(button);
    expect(screen.queryByPlaceholderText('Search commands...')).not.toBeInTheDocument();
  });

  test('closes palette when clicking backdrop', () => {
    render(<CLICommandPalette {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    fireEvent.click(button);
    
    // Palette should be open
    expect(screen.getByPlaceholderText('Search commands...')).toBeInTheDocument();
    
    // Click backdrop
    const backdrop = document.querySelector('.fixed.inset-0');
    fireEvent.click(backdrop!);
    
    // Palette should be closed
    expect(screen.queryByPlaceholderText('Search commands...')).not.toBeInTheDocument();
  });

  test('displays all CLI commands when opened', () => {
    render(<CLICommandPalette {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    fireEvent.click(button);
    
    // Check that key commands are displayed
    expect(screen.getByText('/help')).toBeInTheDocument();
    expect(screen.getByText('/models')).toBeInTheDocument();
    expect(screen.getByText('/personas')).toBeInTheDocument();
    expect(screen.getByText('/persona')).toBeInTheDocument();
    expect(screen.getByText('/use')).toBeInTheDocument();
    expect(screen.getByText('/status')).toBeInTheDocument();
    expect(screen.getByText('/clear')).toBeInTheDocument();
    expect(screen.getByText('/sys')).toBeInTheDocument();
    expect(screen.getByText('/stream')).toBeInTheDocument();
    expect(screen.getByText('/save')).toBeInTheDocument();
    expect(screen.getByText('/load')).toBeInTheDocument();
  });

  test('executes command when clicked', () => {
    render(<CLICommandPalette {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    fireEvent.click(button);
    
    // Click on help command
    const helpCommand = screen.getByText('/help');
    fireEvent.click(helpCommand);
    
    expect(mockExecuteCommand).toHaveBeenCalledWith('help');
    
    // Palette should close after command execution
    expect(screen.queryByPlaceholderText('Search commands...')).not.toBeInTheDocument();
  });

  test('filters commands by search term', () => {
    render(<CLICommandPalette {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    fireEvent.click(button);
    
    const searchInput = screen.getByPlaceholderText('Search commands...');
    
    // Search for 'model'
    fireEvent.change(searchInput, { target: { value: 'model' } });
    
    // Should show model-related commands
    expect(screen.getByText('/models')).toBeInTheDocument();
    expect(screen.getByText('/use')).toBeInTheDocument(); // 'Switch to a different model'
    
    // Should not show unrelated commands
    expect(screen.queryByText('/help')).not.toBeInTheDocument();
    expect(screen.queryByText('/clear')).not.toBeInTheDocument();
  });

  test('filters commands by category', () => {
    render(<CLICommandPalette {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    fireEvent.click(button);
    
    // Click on 'Model Management' category
    const modelCategory = screen.getByText('Model Management');
    fireEvent.click(modelCategory);
    
    // Should show only model commands
    expect(screen.getByText('/models')).toBeInTheDocument();
    expect(screen.getByText('/use')).toBeInTheDocument();
    
    // Should not show other categories
    expect(screen.queryByText('/help')).not.toBeInTheDocument();
    expect(screen.queryByText('/personas')).not.toBeInTheDocument();
  });

  test('shows "no commands found" when search has no results', () => {
    render(<CLICommandPalette {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    fireEvent.click(button);
    
    const searchInput = screen.getByPlaceholderText('Search commands...');
    
    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText(/No commands found matching "nonexistent"/)).toBeInTheDocument();
  });

  test('displays current context correctly', () => {
    render(<CLICommandPalette {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    fireEvent.click(button);
    
    // Check current context display
    expect(screen.getByText('gemini:gemini-2.5-flash')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
    expect(screen.getByText('ON')).toBeInTheDocument(); // Streaming enabled
  });

  test('shows streaming status correctly', () => {
    // Test with streaming disabled
    const propsWithStreamingOff = {
      ...defaultProps,
      streamingEnabled: false
    };
    
    const { rerender } = render(<CLICommandPalette {...propsWithStreamingOff} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    fireEvent.click(button);
    
    expect(screen.getByText('OFF')).toBeInTheDocument();
    
    // Rerender with streaming enabled
    rerender(<CLICommandPalette {...defaultProps} />);
    fireEvent.click(button);
    
    expect(screen.getByText('ON')).toBeInTheDocument();
  });

  test('groups commands by category', () => {
    render(<CLICommandPalette {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    fireEvent.click(button);
    
    // Check category headers
    expect(screen.getByText('SESSION CONTROL')).toBeInTheDocument();
    expect(screen.getByText('MODEL MANAGEMENT')).toBeInTheDocument();
    expect(screen.getByText('PERSONA CONTROL')).toBeInTheDocument();
    expect(screen.getByText('SYSTEM CONFIGURATION')).toBeInTheDocument();
    expect(screen.getByText('DEBUG & TRANSCRIPTS')).toBeInTheDocument();
  });

  test('shows command descriptions', () => {
    render(<CLICommandPalette {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    fireEvent.click(button);
    
    // Check that descriptions are shown
    expect(screen.getByText('Show all available commands')).toBeInTheDocument();
    expect(screen.getByText('List available models')).toBeInTheDocument();
    expect(screen.getByText('Switch to a different model')).toBeInTheDocument();
    expect(screen.getByText('List available personas')).toBeInTheDocument();
  });

  test('handles missing props gracefully', () => {
    const minimalProps = {
      onExecuteCommand: mockExecuteCommand
    };
    
    render(<CLICommandPalette {...minimalProps} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    fireEvent.click(button);
    
    // Should still render without crashing
    expect(screen.getByPlaceholderText('Search commands...')).toBeInTheDocument();
    expect(screen.getByText('unknown')).toBeInTheDocument(); // Default for missing currentModel
  });

  test('clears search when command is executed', () => {
    render(<CLICommandPalette {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    fireEvent.click(button);
    
    const searchInput = screen.getByPlaceholderText('Search commands...');
    
    // Add search term
    fireEvent.change(searchInput, { target: { value: 'help' } });
    expect((searchInput as HTMLInputElement).value).toBe('help');
    
    // Execute a command
    const helpCommand = screen.getByText('/help');
    fireEvent.click(helpCommand);
    
    // Open palette again and check search is cleared
    fireEvent.click(button);
    const newSearchInput = screen.getByPlaceholderText('Search commands...');
    expect((newSearchInput as HTMLInputElement).value).toBe('');
  });

  test('auto-focuses search input when opened', () => {
    render(<CLICommandPalette {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /CLI Commands/ });
    fireEvent.click(button);
    
    const searchInput = screen.getByPlaceholderText('Search commands...');
    expect(searchInput).toHaveFocus();
  });
});