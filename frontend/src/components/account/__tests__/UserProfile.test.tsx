/**
 * UserProfile Component Tests
 * RED Phase - These tests will fail until component is implemented
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import UserProfile from '../UserProfile';

// Mock the OAuth context
vi.mock('@/contexts/OAuthContext', () => ({
  useOAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    error: null,
  }),
}));

// Mock user data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  profilePicture: null,
  tier: 'free' as const,
  preferences: {
    theme: 'dark' as const,
    notifications: true,
    language: 'en',
  },
};

const mockProps = {
  user: mockUser,
  isEditing: false,
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

describe('UserProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display Mode', () => {
    it('should render user information correctly', () => {
      render(<UserProfile {...mockProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument();
    });

    it('should show edit button when not in editing mode', () => {
      render(<UserProfile {...mockProps} />);
      
      const editButton = screen.getByRole('button', { name: /edit profile/i });
      expect(editButton).toBeInTheDocument();
    });

    it('should display profile picture when available', () => {
      const userWithPicture = {
        ...mockUser,
        profilePicture: 'https://example.com/avatar.jpg',
      };
      
      render(<UserProfile {...mockProps} user={userWithPicture} />);
      
      const avatar = screen.getByRole('img', { name: /profile picture/i });
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should show default avatar when no profile picture', () => {
      render(<UserProfile {...mockProps} />);
      
      const defaultAvatar = screen.getByTestId('default-avatar');
      expect(defaultAvatar).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    const editingProps = { ...mockProps, isEditing: true };

    it('should render editable form fields', () => {
      render(<UserProfile {...editingProps} />);
      
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('should show save and cancel buttons in edit mode', () => {
      render(<UserProfile {...editingProps} />);
      
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call onSave with updated data when save button is clicked', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...editingProps} />);
      
      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockProps.onSave).toHaveBeenCalledWith({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'test@example.com',
        });
      });
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...editingProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    const editingProps = { ...mockProps, isEditing: true };

    it('should show validation error for empty first name', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...editingProps} />);
      
      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(mockProps.onSave).not.toHaveBeenCalled();
    });

    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...editingProps} />);
      
      const emailInput = screen.getByDisplayValue('test@example.com');
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      expect(mockProps.onSave).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<UserProfile {...mockProps} />);
      
      expect(screen.getByRole('region', { name: /user profile/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<UserProfile {...mockProps} />);
      
      const editButton = screen.getByRole('button', { name: /edit profile/i });
      
      // Tab to the edit button
      await user.tab();
      expect(editButton).toHaveFocus();
      
      // Press Enter to activate edit mode
      await user.keyboard('{Enter}');
      expect(mockProps.onSave).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during save operation', async () => {
      const slowOnSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      const props = { ...mockProps, isEditing: true, onSave: slowOnSave };
      
      const user = userEvent.setup();
      render(<UserProfile {...props} />);
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });
  });
});