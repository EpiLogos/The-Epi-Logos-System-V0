/**
 * Test Setup for OAuth Components
 * Provides mocking utilities and test helpers
 */

import { vi } from 'vitest';

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Mock fetch API with proper response structure
const fetchMock = vi.fn();

// Mock service class factories
export const createMockOAuthCallbackHandler = () => {
  return {
    handleCallback: vi.fn(),
    exchangeCodeForTokens: vi.fn(),
    validateState: vi.fn(),
    getStoredOAuthState: vi.fn(),
    validateIdTokenNonce: vi.fn(),
    extractUserProfile: vi.fn()
  };
};

export const createMockAccountLinkingService = () => {
  return {
    verifyReAuthentication: vi.fn(),
    validateAccountOwnership: vi.fn(),
    findExistingAccountByEmail: vi.fn(),
    linkGoogleAccount: vi.fn(),
    handleOAuthSignIn: vi.fn(),
    saveAccountLink: vi.fn(),
    createNewUser: vi.fn()
  };
};

// Setup global mocks
export const setupOAuthTests = () => {
  // Mock global sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true
  });

  // Mock fetch with proper OAuth responses
  fetchMock.mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({
      ...createMockTokenResponse(),
      id_token: createMockIdToken()
    }),
    status: 200,
    statusText: 'OK'
  });
  global.fetch = fetchMock;

  // Mock crypto.getRandomValues
  Object.defineProperty(global.crypto, 'getRandomValues', {
    value: vi.fn((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
    writable: true
  });

  return {
    sessionStorage: sessionStorageMock,
    fetch: fetchMock,
    clearMocks: () => {
      vi.clearAllMocks();
      sessionStorageMock.clear();
    }
  };
};

// Test data helpers
export const createMockOAuthState = (overrides = {}) => ({
  state: 'test_state_123',
  nonce: 'test_nonce_456',
  codeVerifier: 'test_code_verifier_789',
  codeChallenge: 'test_code_challenge_abc',
  redirectUri: 'http://localhost:3000/auth/callback',
  expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  ...overrides
});

export const createMockTokenResponse = (overrides = {}) => ({
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  id_token: createMockIdToken(),
  token_type: 'Bearer',
  expires_in: 3600,
  ...overrides
});

export const createMockIdToken = (overrides = {}) => {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    sub: 'google_123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    email_verified: true,
    nonce: 'test_nonce_789', // Must match the nonce in mock state
    ...overrides
  })).toString('base64');
  const signature = 'mock_signature';
  
  return `${header}.${payload}.${signature}`;
};

export const createMockGoogleProfile = (overrides = {}) => ({
  googleId: 'google_123',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg',
  emailVerified: true,
  ...overrides
});