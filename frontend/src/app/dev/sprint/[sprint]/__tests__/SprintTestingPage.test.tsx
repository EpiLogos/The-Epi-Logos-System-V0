import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useRouter } from 'next/navigation';
import SprintTestingPage from '../page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn()
}));

// Mock coordinate resolution service
vi.mock('@/lib/coordinateService', () => ({
  resolveCoordinate: vi.fn(),
  testCoordinateResolution: vi.fn()
}));

// Mock authentication service
vi.mock('@/lib/authService', () => ({
  testUserRegistration: vi.fn(),
  testOAuthFlow: vi.fn(),
  validateJWTTokens: vi.fn()
}));

describe('SprintTestingPage', () => {
  const mockRouter = {
    push: vi.fn(),
    back: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter);
  });

  describe('Sprint 1 Testing Context', () => {
    beforeEach(() => {
      vi.mocked(require('next/navigation').useParams).mockReturnValue({ sprint: '1' });
    });

    it('should render Sprint 1 testing interface', () => {
      render(<SprintTestingPage />);
      expect(screen.getByText('Sprint 1: Core Communication Protocol')).toBeInTheDocument();
    });

    it('should display coordinate resolution tester', () => {
      render(<SprintTestingPage />);
      expect(screen.getByTestId('coordinate-resolution-tester')).toBeInTheDocument();
    });

    it('should have input field for coordinate testing', () => {
      render(<SprintTestingPage />);
      expect(screen.getByPlaceholderText('Enter Bimba coordinate (e.g., #0, #1-2-3)')).toBeInTheDocument();
    });

    it('should show AG-UI protocol validator', () => {
      render(<SprintTestingPage />);
      expect(screen.getByTestId('agui-protocol-validator')).toBeInTheDocument();
    });

    it('should execute coordinate resolution test when button clicked', async () => {
      const mockResolve = vi.fn().mockResolvedValue({
        coordinate: '#1',
        name: 'Test Node',
        subsystem: 1,
        responseTime: 45
      });
      vi.mocked(require('@/lib/coordinateService').resolveCoordinate).mockImplementation(mockResolve);

      render(<SprintTestingPage />);
      
      const input = screen.getByPlaceholderText('Enter Bimba coordinate (e.g., #0, #1-2-3)');
      const testButton = screen.getByText('Test Coordinate');

      fireEvent.change(input, { target: { value: '#1' } });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(mockResolve).toHaveBeenCalledWith('#1');
      });
    });

    it('should display test results with response time', async () => {
      vi.mocked(require('@/lib/coordinateService').resolveCoordinate).mockResolvedValue({
        coordinate: '#1',
        name: 'Test Node',
        subsystem: 1,
        responseTime: 45
      });

      render(<SprintTestingPage />);
      
      const input = screen.getByPlaceholderText('Enter Bimba coordinate (e.g., #0, #1-2-3)');
      fireEvent.change(input, { target: { value: '#1' } });
      fireEvent.click(screen.getByText('Test Coordinate'));

      await waitFor(() => {
        expect(screen.getByTestId('test-results')).toBeInTheDocument();
        expect(screen.getByText('45ms')).toBeInTheDocument();
      });
    });
  });

  describe('Sprint 2 Testing Context', () => {
    beforeEach(() => {
      vi.mocked(require('next/navigation').useParams).mockReturnValue({ sprint: '2' });
    });

    it('should render Sprint 2 testing interface', () => {
      render(<SprintTestingPage />);
      expect(screen.getByText('Sprint 2: Orchestration Foundation')).toBeInTheDocument();
    });

    it('should display user account flow tester', () => {
      render(<SprintTestingPage />);
      expect(screen.getByTestId('user-account-flow-tester')).toBeInTheDocument();
    });

    it('should have user registration test form', () => {
      render(<SprintTestingPage />);
      expect(screen.getByTestId('user-registration-form')).toBeInTheDocument();
    });

    it('should show integration testing suite', () => {
      render(<SprintTestingPage />);
      expect(screen.getByTestId('integration-testing-suite')).toBeInTheDocument();
    });

    it('should test user registration flow', async () => {
      const mockRegistration = vi.fn().mockResolvedValue({
        success: true,
        userId: 'test-user-123',
        token: 'jwt-token-456'
      });
      vi.mocked(require('@/lib/authService').testUserRegistration).mockImplementation(mockRegistration);

      render(<SprintTestingPage />);
      
      const emailInput = screen.getByPlaceholderText('Test email');
      const passwordInput = screen.getByPlaceholderText('Test password');
      const registerButton = screen.getByText('Test Registration');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(mockRegistration).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    it('should validate integration between coordinate and auth systems', async () => {
      render(<SprintTestingPage />);
      
      const integrationTestButton = screen.getByText('Test Coordinate + Auth Integration');
      fireEvent.click(integrationTestButton);

      await waitFor(() => {
        expect(screen.getByTestId('integration-test-results')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and Common Features', () => {
    it('should have navigation back to main dashboard', () => {
      render(<SprintTestingPage />);
      expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument();
    });

    it('should display test history', () => {
      render(<SprintTestingPage />);
      expect(screen.getByTestId('test-history')).toBeInTheDocument();
    });

    it('should show performance metrics for tests', () => {
      render(<SprintTestingPage />);
      expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
    });

    it('should handle navigation back to dashboard', () => {
      render(<SprintTestingPage />);
      
      fireEvent.click(screen.getByText('← Back to Dashboard'));
      expect(mockRouter.push).toHaveBeenCalledWith('/dev/dashboard');
    });
  });
});