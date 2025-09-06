/**
 * Test Setup for Auth Domain
 * Configuration and utilities for domain testing
 */

// Mock browser APIs that domain functions might use
global.crypto = {
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  subtle: {
    digest: async (algorithm: string, data: BufferSource) => {
      // Mock SHA-256 digest for testing
      const mockHash = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        mockHash[i] = Math.floor(Math.random() * 256);
      }
      return mockHash.buffer;
    }
  }
} as any;

// Mock btoa/atob for JWT token testing
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

// Mock window object for storage tests
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Test utilities
export const createMockUser = (overrides: any = {}) => ({
  id: 'test-user-123',
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
    theme: 'auto',
    language: 'en'
  },
  ...overrides
});

export const createMockTokens = (overrides: any = {}) => ({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  tokenType: 'Bearer',
  ...overrides
});

export const createMockAuthState = (overrides: any = {}) => ({
  isAuthenticated: false,
  isLoading: false,
  error: null,
  user: null,
  tokens: null,
  linkedAccount: null,
  ...overrides
});

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage mocks
  (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
  (window.sessionStorage.getItem as jest.Mock).mockReturnValue(null);
});
