/**
 * ProtectedRoute Component Tests
 * Comprehensive tests for route protection functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  ProtectedRoute, 
  RequireAuth, 
  RequireEmailVerification,
  RequirePatron,
  ConditionalAuth,
  AuthGuard,
  RoleBasedAccess
} from '../ProtectedRoute';
import { UnifiedAuthProvider } from '../../unified-auth-context';
import type { User, AuthTokens } from '@/domains/auth';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}));

// Mock infrastructure adapters
jest.mock('@/infrastructure/auth', () => ({
  createSessionStorageAdapter: jest.fn(() => ({
    storeUser: jest.fn(),
    retrieveUser: jest.fn(),
    clearUser: jest.fn(),
    storeTokens: jest.fn(),
    retrieveTokens: jest.fn(),
    clearTokens: jest.fn(),
    storeSession: jest.fn(),
    retrieveSession: jest.fn(),
    clearSession: jest.fn(),
    isAvailable: jest.fn(() => true)
  })),
  createAPIClient: jest.fn(() => ({
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshTokens: jest.fn(),
    getCurrentUser: jest.fn(),
    updateUser: jest.fn(),
    changePassword: jest.fn(),
    initiateOAuth: jest.fn(),
    completeOAuth: jest.fn(),
    linkAccount: jest.fn(),
    unlinkAccount: jest.fn(),
    setAuthToken: jest.fn(),
    clearAuthToken: jest.fn()
  }))
}));

// Test data fixtures
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  name: 'Test User',
  tier: 'free',
  hasPassword: true,
  isEmailVerified: true,
  oauthProviders: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  preferences: {
    notifications: true,
    theme: 'dark',
    language: 'en'
  }
};

const mockTokens: AuthTokens = {
  accessToken: 'access-token-123',
  refreshToken: 'refresh-token-123',
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  tokenType: 'Bearer'
};

// Test wrapper
function TestWrapper({ 
  children, 
  mockSession = null 
}: { 
  children: React.ReactNode;
  mockSession?: any;
}) {
  const { createSessionStorageAdapter } = require('@/infrastructure/auth');
  const mockStorageAdapter = createSessionStorageAdapter();
  mockStorageAdapter.retrieveSession.mockResolvedValue(mockSession);

  return (
    <UnifiedAuthProvider config={{ apiBaseURL: 'http://localhost:8000' }}>
      {children}
    </UnifiedAuthProvider>
  );
}

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { redirect } = require('next/navigation');
    redirect.mockClear();
  });

  describe('Authentication Protection', () => {
    it('should show loading state initially', () => {
      render(
        <TestWrapper>
          <ProtectedRoute requireAuth>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should redirect unauthenticated users', async () => {
      const { redirect } = require('next/navigation');

      render(
        <TestWrapper mockSession={null}>
          <ProtectedRoute requireAuth>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      // Wait for auth initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(redirect).toHaveBeenCalledWith('/auth/signin');
    });

    it('should render content for authenticated users', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      render(
        <TestWrapper mockSession={mockSession}>
          <ProtectedRoute requireAuth>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      // Wait for auth initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should allow unauthenticated access when requireAuth is false', async () => {
      render(
        <TestWrapper mockSession={null}>
          <ProtectedRoute requireAuth={false}>
            <div>Public Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.getByText('Public Content')).toBeInTheDocument();
    });
  });

  describe('Email Verification Protection', () => {
    it('should block users with unverified email', async () => {
      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      const mockSession = {
        user: unverifiedUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      render(
        <TestWrapper mockSession={mockSession}>
          <ProtectedRoute requireAuth requireEmailVerification>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.getByText('Email verification required')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should allow users with verified email', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      render(
        <TestWrapper mockSession={mockSession}>
          <ProtectedRoute requireAuth requireEmailVerification>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Tier Protection', () => {
    it('should block free users from patron content', async () => {
      const mockSession = {
        user: mockUser, // free tier
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      render(
        <TestWrapper mockSession={mockSession}>
          <ProtectedRoute requireAuth requiredTier="patron">
            <div>Patron Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.getByText('Patron tier required')).toBeInTheDocument();
      expect(screen.queryByText('Patron Content')).not.toBeInTheDocument();
    });

    it('should allow patron users to access patron content', async () => {
      const patronUser = { ...mockUser, tier: 'patron' as const };
      const mockSession = {
        user: patronUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      render(
        <TestWrapper mockSession={mockSession}>
          <ProtectedRoute requireAuth requiredTier="patron">
            <div>Patron Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.getByText('Patron Content')).toBeInTheDocument();
    });
  });

  describe('Custom Validation', () => {
    it('should use custom validator', async () => {
      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      };

      const customValidator = (user: any) => user.email === 'admin@example.com';

      render(
        <TestWrapper mockSession={mockSession}>
          <ProtectedRoute 
            requireAuth 
            customValidator={customValidator}
            customValidatorMessage="Admin access required"
          >
            <div>Admin Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.getByText('Admin access required')).toBeInTheDocument();
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('Custom Components', () => {
    it('should use custom loading component', () => {
      const CustomLoading = () => <div>Custom Loading...</div>;

      render(
        <TestWrapper>
          <ProtectedRoute requireAuth loadingComponent={<CustomLoading />}>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    });

    it('should use custom unauthorized component', async () => {
      const CustomUnauthorized = () => <div>Custom Unauthorized</div>;

      render(
        <TestWrapper mockSession={null}>
          <ProtectedRoute 
            requireAuth 
            unauthorizedComponent={<CustomUnauthorized />}
          >
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.getByText('Custom Unauthorized')).toBeInTheDocument();
    });
  });
});

describe('RequireAuth Component', () => {
  it('should require authentication', async () => {
    const { redirect } = require('next/navigation');

    render(
      <TestWrapper mockSession={null}>
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      </TestWrapper>
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(redirect).toHaveBeenCalledWith('/auth/signin');
  });
});

describe('RequireEmailVerification Component', () => {
  it('should require email verification', async () => {
    const unverifiedUser = { ...mockUser, isEmailVerified: false };
    const mockSession = {
      user: unverifiedUser,
      isAuthenticated: true,
      tokens: mockTokens,
      linkedAccount: null
    };

    render(
      <TestWrapper mockSession={mockSession}>
        <RequireEmailVerification>
          <div>Protected Content</div>
        </RequireEmailVerification>
      </TestWrapper>
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.getByText('Email verification required')).toBeInTheDocument();
  });
});

describe('RequirePatron Component', () => {
  it('should require patron tier', async () => {
    const mockSession = {
      user: mockUser, // free tier
      isAuthenticated: true,
      tokens: mockTokens,
      linkedAccount: null
    };

    render(
      <TestWrapper mockSession={mockSession}>
        <RequirePatron>
          <div>Patron Content</div>
        </RequirePatron>
      </TestWrapper>
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.getByText('Patron tier required')).toBeInTheDocument();
  });
});

describe('ConditionalAuth Component', () => {
  it('should render authenticated content for authenticated users', async () => {
    const mockSession = {
      user: mockUser,
      isAuthenticated: true,
      tokens: mockTokens,
      linkedAccount: null
    };

    render(
      <TestWrapper mockSession={mockSession}>
        <ConditionalAuth
          authenticated={<div>Authenticated Content</div>}
          unauthenticated={<div>Unauthenticated Content</div>}
        />
      </TestWrapper>
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.getByText('Authenticated Content')).toBeInTheDocument();
    expect(screen.queryByText('Unauthenticated Content')).not.toBeInTheDocument();
  });

  it('should render unauthenticated content for unauthenticated users', async () => {
    render(
      <TestWrapper mockSession={null}>
        <ConditionalAuth
          authenticated={<div>Authenticated Content</div>}
          unauthenticated={<div>Unauthenticated Content</div>}
        />
      </TestWrapper>
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.getByText('Unauthenticated Content')).toBeInTheDocument();
    expect(screen.queryByText('Authenticated Content')).not.toBeInTheDocument();
  });
});

describe('AuthGuard Component', () => {
  it('should render children when requirements are met', async () => {
    const mockSession = {
      user: mockUser,
      isAuthenticated: true,
      tokens: mockTokens,
      linkedAccount: null
    };

    render(
      <TestWrapper mockSession={mockSession}>
        <AuthGuard requireAuth>
          <button>Delete Account</button>
        </AuthGuard>
      </TestWrapper>
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.getByText('Delete Account')).toBeInTheDocument();
  });

  it('should render fallback when requirements are not met', async () => {
    render(
      <TestWrapper mockSession={null}>
        <AuthGuard requireAuth fallback={<div>Access Denied</div>}>
          <button>Delete Account</button>
        </AuthGuard>
      </TestWrapper>
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
  });

  it('should render nothing when no fallback provided', async () => {
    render(
      <TestWrapper mockSession={null}>
        <AuthGuard requireAuth>
          <button>Delete Account</button>
        </AuthGuard>
      </TestWrapper>
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
  });
});

describe('RoleBasedAccess Component', () => {
  it('should render content based on user tier', async () => {
    const patronUser = { ...mockUser, tier: 'patron' as const };
    const mockSession = {
      user: patronUser,
      isAuthenticated: true,
      tokens: mockTokens,
      linkedAccount: null
    };

    render(
      <TestWrapper mockSession={mockSession}>
        <RoleBasedAccess
          roles={{
            patron: <div>Patron Features</div>,
            free: <div>Free Features</div>
          }}
          fallback={<div>Access Denied</div>}
        />
      </TestWrapper>
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.getByText('Patron Features')).toBeInTheDocument();
    expect(screen.queryByText('Free Features')).not.toBeInTheDocument();
  });

  it('should render fallback for unmatched roles', async () => {
    render(
      <TestWrapper mockSession={null}>
        <RoleBasedAccess
          roles={{
            patron: <div>Patron Features</div>
          }}
          fallback={<div>Access Denied</div>}
        />
      </TestWrapper>
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });
});
