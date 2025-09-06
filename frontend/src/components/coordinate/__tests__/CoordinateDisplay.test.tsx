/**
 * CoordinateDisplay Component Tests
 * Following TDD principles from coding standards
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoordinateDisplay } from '../CoordinateDisplay';
import { CoordinateResolution } from '@/lib/coordinateService';

// Mock coordinate data for testing
const mockCoordinate: CoordinateResolution = {
  coordinate: '#2-3',
  name: 'Harmonic Resonance Interface',
  subsystem: 2,
  responseTime: 125
};

describe('CoordinateDisplay', () => {
  test('renders coordinate information correctly', () => {
    render(<CoordinateDisplay coordinate={mockCoordinate} />);
    
    expect(screen.getByTestId('coordinate-text')).toHaveTextContent('#2-3');
    expect(screen.getByTestId('coordinate-name')).toHaveTextContent('Harmonic Resonance Interface');
  });

  test('shows loading state when coordinate is not provided', () => {
    render(<CoordinateDisplay />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays hover details when showDetails is true', async () => {
    const user = userEvent.setup();
    
    render(<CoordinateDisplay coordinate={mockCoordinate} showDetails={true} />);
    
    const trigger = screen.getByTestId('coordinate-trigger');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('coordinate-details')).toBeInTheDocument();
    });

    expect(screen.getByText('Harmonic Resonance Interface')).toBeInTheDocument();
    expect(screen.getByText('#2-3')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('125ms')).toBeInTheDocument();
  });

  test('does not show hover details when showDetails is false', () => {
    render(<CoordinateDisplay coordinate={mockCoordinate} showDetails={false} />);
    
    // Should not have a trigger button
    expect(screen.queryByTestId('coordinate-trigger')).not.toBeInTheDocument();
    
    // Should still show coordinate info
    expect(screen.getByTestId('coordinate-text')).toBeInTheDocument();
    expect(screen.getByTestId('coordinate-name')).toBeInTheDocument();
  });

  test('applies correct CSS classes for different positions', () => {
    const { rerender } = render(
      <CoordinateDisplay coordinate={mockCoordinate} position="navbar" />
    );
    
    expect(document.querySelector('.coordinate-display--navbar')).toBeInTheDocument();

    rerender(<CoordinateDisplay coordinate={mockCoordinate} position="inline" />);
    
    expect(document.querySelector('.coordinate-display--inline')).toBeInTheDocument();
  });

  test('handles custom className prop', () => {
    render(
      <CoordinateDisplay 
        coordinate={mockCoordinate} 
        className="custom-class" 
      />
    );
    
    expect(document.querySelector('.custom-class')).toBeInTheDocument();
  });
});