/**
 * Session Storage Adapter Tests
 * Comprehensive tests for session storage functionality
 */

import {
  BrowserSessionStorageAdapter,
  MemoryStorageAdapter,
  StorageError,
  createSessionStorageAdapter
} from '../session-storage.adapter';

import type { User, AuthTokens, AuthSession } from '@/domains/auth';

// Mock browser storage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock window.sessionStorage and localStorage
Object.defineProperty(window, 'sessionStorage', {
  value: mockStorage,
  writable: true
});

Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
  writable: true
});

describe('Session Storage Adapter', () => {
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
    expiresAt: '2024-12-31T23:59:59.000Z',
    tokenType: 'Bearer'
  };

  const mockSession: AuthSession = {
    user: mockUser,
    isAuthenticated: true,
    tokens: mockTokens,
    linkedAccount: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getItem.mockReturnValue(null);
  });

  describe('BrowserSessionStorageAdapter', () => {
    let adapter: BrowserSessionStorageAdapter;

    beforeEach(() => {
      adapter = new BrowserSessionStorageAdapter({
        useEncryption: false, // Disable encryption for testing
        storageType: 'sessionStorage'
      });
    });

    describe('User Operations', () => {
      it('should store and retrieve user data', async () => {
        mockStorage.setItem.mockImplementation(() => {});
        mockStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

        await adapter.storeUser(mockUser);
        const retrievedUser = await adapter.retrieveUser();

        expect(mockStorage.setItem).toHaveBeenCalledWith(
          'epi_logos_auth_user',
          JSON.stringify(mockUser)
        );
        expect(retrievedUser).toEqual(mockUser);
      });

      it('should return null when no user data exists', async () => {
        mockStorage.getItem.mockReturnValue(null);

        const retrievedUser = await adapter.retrieveUser();
        expect(retrievedUser).toBeNull();
      });

      it('should clear user data', async () => {
        await adapter.clearUser();
        expect(mockStorage.removeItem).toHaveBeenCalledWith('epi_logos_auth_user');
      });

      it('should handle corrupted user data', async () => {
        mockStorage.getItem.mockReturnValue('invalid-json');
        mockStorage.removeItem.mockImplementation(() => {});

        const retrievedUser = await adapter.retrieveUser();
        
        expect(retrievedUser).toBeNull();
        expect(mockStorage.removeItem).toHaveBeenCalledWith('epi_logos_auth_user');
      });

      it('should validate user data before storing', async () => {
        const invalidUser = { id: 'test' } as any;

        await expect(adapter.storeUser(invalidUser)).rejects.toThrow(StorageError);
        expect(mockStorage.setItem).not.toHaveBeenCalled();
      });
    });

    describe('Token Operations', () => {
      it('should store and retrieve tokens', async () => {
        mockStorage.setItem.mockImplementation(() => {});
        mockStorage.getItem.mockReturnValue(JSON.stringify(mockTokens));

        await adapter.storeTokens(mockTokens);
        const retrievedTokens = await adapter.retrieveTokens();

        expect(mockStorage.setItem).toHaveBeenCalledWith(
          'epi_logos_auth_tokens',
          JSON.stringify(mockTokens)
        );
        expect(retrievedTokens).toEqual(mockTokens);
      });

      it('should validate tokens before storing', async () => {
        const invalidTokens = { accessToken: 'test' } as any;

        await expect(adapter.storeTokens(invalidTokens)).rejects.toThrow(StorageError);
        expect(mockStorage.setItem).not.toHaveBeenCalled();
      });

      it('should clear tokens', async () => {
        await adapter.clearTokens();
        expect(mockStorage.removeItem).toHaveBeenCalledWith('epi_logos_auth_tokens');
      });
    });

    describe('Session Operations', () => {
      it('should store complete session', async () => {
        mockStorage.setItem.mockImplementation(() => {});

        await adapter.storeSession(mockSession);

        expect(mockStorage.setItem).toHaveBeenCalledWith(
          'epi_logos_auth_user',
          JSON.stringify(mockUser)
        );
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          'epi_logos_auth_tokens',
          JSON.stringify(mockTokens)
        );
      });

      it('should retrieve complete session', async () => {
        mockStorage.getItem.mockImplementation((key: string) => {
          if (key === 'epi_logos_auth_user') return JSON.stringify(mockUser);
          if (key === 'epi_logos_auth_tokens') return JSON.stringify(mockTokens);
          return null;
        });

        const retrievedSession = await adapter.retrieveSession();

        expect(retrievedSession).toEqual({
          user: mockUser,
          isAuthenticated: true,
          tokens: mockTokens,
          linkedAccount: null
        });
      });

      it('should return empty session when no user data', async () => {
        mockStorage.getItem.mockReturnValue(null);

        const retrievedSession = await adapter.retrieveSession();

        expect(retrievedSession).toEqual({
          user: null,
          isAuthenticated: false,
          tokens: null,
          linkedAccount: null
        });
      });

      it('should clear complete session', async () => {
        await adapter.clearSession();

        expect(mockStorage.removeItem).toHaveBeenCalledWith('epi_logos_auth_user');
        expect(mockStorage.removeItem).toHaveBeenCalledWith('epi_logos_auth_tokens');
        expect(mockStorage.removeItem).toHaveBeenCalledWith('epi_logos_auth_linked_account');
      });
    });

    describe('Error Handling', () => {
      it('should handle storage quota exceeded', async () => {
        const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
        quotaError.code = 22;
        mockStorage.setItem.mockImplementation(() => {
          throw quotaError;
        });

        await expect(adapter.storeUser(mockUser)).rejects.toThrow(StorageError);
        await expect(adapter.storeUser(mockUser)).rejects.toThrow('Storage quota exceeded');
      });

      it('should handle storage unavailable', async () => {
        // Mock storage as unavailable
        const unavailableAdapter = new BrowserSessionStorageAdapter();
        jest.spyOn(unavailableAdapter, 'isAvailable').mockReturnValue(false);

        await expect(unavailableAdapter.storeUser(mockUser)).rejects.toThrow(StorageError);
        await expect(unavailableAdapter.storeUser(mockUser)).rejects.toThrow('Storage not available');
      });

      it('should handle generic storage errors', async () => {
        mockStorage.setItem.mockImplementation(() => {
          throw new Error('Generic storage error');
        });

        await expect(adapter.storeUser(mockUser)).rejects.toThrow(StorageError);
        await expect(adapter.storeUser(mockUser)).rejects.toThrow('Failed to store data');
      });
    });

    describe('Storage Availability', () => {
      it('should detect available storage', () => {
        mockStorage.setItem.mockImplementation(() => {});
        mockStorage.removeItem.mockImplementation(() => {});

        expect(adapter.isAvailable()).toBe(true);
      });

      it('should detect unavailable storage', () => {
        mockStorage.setItem.mockImplementation(() => {
          throw new Error('Storage not available');
        });

        expect(adapter.isAvailable()).toBe(false);
      });
    });

    describe('Storage Info', () => {
      it('should return storage information', () => {
        const info = adapter.getStorageInfo();

        expect(info).toEqual({
          available: expect.any(Boolean),
          type: 'sessionStorage',
          encrypted: false,
          quota: undefined,
          used: undefined
        });
      });
    });
  });

  describe('MemoryStorageAdapter', () => {
    let adapter: MemoryStorageAdapter;

    beforeEach(() => {
      adapter = new MemoryStorageAdapter();
    });

    it('should store and retrieve user data in memory', async () => {
      await adapter.storeUser(mockUser);
      const retrievedUser = await adapter.retrieveUser();

      expect(retrievedUser).toEqual(mockUser);
    });

    it('should store and retrieve complete session', async () => {
      await adapter.storeSession(mockSession);
      const retrievedSession = await adapter.retrieveSession();

      expect(retrievedSession).toEqual({
        user: mockUser,
        isAuthenticated: true,
        tokens: mockTokens,
        linkedAccount: null
      });
    });

    it('should clear all data', async () => {
      await adapter.storeSession(mockSession);
      await adapter.clearSession();

      const retrievedUser = await adapter.retrieveUser();
      const retrievedTokens = await adapter.retrieveTokens();

      expect(retrievedUser).toBeNull();
      expect(retrievedTokens).toBeNull();
    });

    it('should always be available', () => {
      expect(adapter.isAvailable()).toBe(true);
    });

    it('should return memory storage info', () => {
      const info = adapter.getStorageInfo();

      expect(info).toEqual({
        available: true,
        type: 'memory',
        encrypted: false
      });
    });
  });

  describe('Factory Functions', () => {
    it('should create session storage adapter with default config', () => {
      const adapter = createSessionStorageAdapter();
      expect(adapter).toBeInstanceOf(BrowserSessionStorageAdapter);
    });

    it('should create session storage adapter with custom config', () => {
      const adapter = createSessionStorageAdapter({
        storageType: 'localStorage',
        keyPrefix: 'custom_'
      });
      expect(adapter).toBeInstanceOf(BrowserSessionStorageAdapter);
    });
  });
});
