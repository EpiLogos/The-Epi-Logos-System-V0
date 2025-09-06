/**
 * Hexagon Navigation Component Tests - RED Phase
 * Tests for global navigation with authentication state (AC: #14, #15, #16)
 */

import { describe, test, expect, vi } // Jest globals available;
import { render, screen, fireEvent } from '@testing-library/react';
import { HexagonNavigation } from '../hexagon-navigation';

describe('HexagonNavigation', () => {
  test('should render hexagon navigation with six subsystems', () => {
    render(<HexagonNavigation isAuthenticated={false} user={null} />);
    
    expect(screen.getByTestId('hexagon-navigation')).toBeInTheDocument();
    expect(screen.getByText('Anuttara')).toBeInTheDocument();
    expect(screen.getByText('Paramasiva')).toBeInTheDocument();
    expect(screen.getByText('Parashakti')).toBeInTheDocument();
    expect(screen.getByText('Mahamaya')).toBeInTheDocument();
    expect(screen.getByText('Nara')).toBeInTheDocument();
    expect(screen.getByText('Epii')).toBeInTheDocument();
  });

  test('should display sign-in button when user is not authenticated', () => {
    render(<HexagonNavigation isAuthenticated={false} user={null} />);
    
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
  });

  test('should display user profile and sign-out when authenticated', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
      picture: 'https://example.com/avatar.jpg'
    };

    render(<HexagonNavigation isAuthenticated={true} user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  test('should show protected route warnings for unauthenticated users', () => {
    render(<HexagonNavigation isAuthenticated={false} user={null} />);
    
    const naraLink = screen.getByText('Nara');
    fireEvent.click(naraLink);
    
    expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
  });

  test('should allow navigation to subsystems when authenticated', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
      picture: 'https://example.com/avatar.jpg'
    };

    const mockNavigate = jest.fn();
    jest.mock('next/navigation', () => ({
      useRouter: () => ({ push: mockNavigate })
    }));

    render(<HexagonNavigation isAuthenticated={true} user={mockUser} />);
    
    const naraLink = screen.getByText('Nara');
    fireEvent.click(naraLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/nara');
  });

  test('should integrate with scene page enter experience flow', () => {
    const mockOnEnterExperience = jest.fn();
    
    render(
      <HexagonNavigation 
        isAuthenticated={false} 
        user={null}
        onEnterExperience={mockOnEnterExperience}
      />
    );
    
    expect(screen.getByTestId('enter-experience-integration')).toBeInTheDocument();
  });
});