/**
 * Session Storage Adapter
 * Type-safe browser storage abstraction with encryption and validation
 * 
 * This adapter provides a clean interface for storing authentication data
 * with proper error handling, validation, and optional encryption.
 */

import type {
  User,
  AuthTokens,
  AuthSession,
  LinkedAccount
} from '@/domains/auth';

import {
  isValidUser,
  isValidAuthTokens
} from '@/domains/auth';

/**
 * Storage adapter interface
 */
export interface SessionStorageAdapter {
  // User data operations
  storeUser(user: User): Promise<void>;
  retrieveUser(): Promise<User | null>;
  clearUser(): Promise<void>;

  // Token operations
  storeTokens(tokens: AuthTokens): Promise<void>;
  retrieveTokens(): Promise<AuthTokens | null>;
  clearTokens(): Promise<void>;

  // Linked account operations
  storeLinkedAccount(account: LinkedAccount): Promise<void>;
  retrieveLinkedAccount(): Promise<LinkedAccount | null>;
  clearLinkedAccount(): Promise<void>;

  // Complete session operations
  storeSession(session: AuthSession): Promise<void>;
  retrieveSession(): Promise<AuthSession | null>;
  clearSession(): Promise<void>;

  // Utility operations
  isAvailable(): boolean;
  getStorageInfo(): StorageInfo;
}

/**
 * Storage information interface
 */
export interface StorageInfo {
  available: boolean;
  type: 'localStorage' | 'sessionStorage' | 'memory';
  encrypted: boolean;
  quota?: number;
  used?: number;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  useEncryption: boolean;
  storageType: 'localStorage' | 'sessionStorage';
  keyPrefix: string;
  compressionEnabled: boolean;
}

/**
 * Storage error types
 */
export class StorageError extends Error {
  constructor(message: string, public readonly code: string, public readonly cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  USER: 'auth_user',
  TOKENS: 'auth_tokens',
  LINKED_ACCOUNT: 'auth_linked_account',
  SESSION: 'auth_session'
} as const;

/**
 * Browser Session Storage Adapter Implementation
 */
export class BrowserSessionStorageAdapter implements SessionStorageAdapter {
  private config: StorageConfig;
  private storage: Storage;
  private encryptionKey?: CryptoKey;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      useEncryption: false, // Disabled by default for simplicity
      storageType: 'sessionStorage',
      keyPrefix: 'epi_logos_',
      compressionEnabled: false,
      ...config
    };

    // Select storage type (handle SSR)
    if (typeof window !== 'undefined') {
      this.storage = this.config.storageType === 'localStorage'
        ? localStorage
        : sessionStorage;
    } else {
      // SSR fallback - create a mock storage that does nothing
      this.storage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null
      };
    }

    // Initialize encryption if enabled
    if (this.config.useEncryption) {
      this.initializeEncryption();
    }
  }

  /**
   * Initialize encryption key
   */
  private async initializeEncryption(): Promise<void> {
    try {
      // Generate or retrieve encryption key
      // In a real implementation, you might derive this from user credentials
      // or store it securely in a different location
      this.encryptionKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.warn('Failed to initialize encryption, falling back to plain storage:', error);
      this.config.useEncryption = false;
    }
  }

  /**
   * Encrypt data if encryption is enabled
   */
  private async encrypt(data: string): Promise<string> {
    if (!this.config.useEncryption || !this.encryptionKey) {
      return data;
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt data
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      // Return as base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      throw new StorageError('Encryption failed', 'ENCRYPTION_ERROR', error as Error);
    }
  }

  /**
   * Decrypt data if encryption is enabled
   */
  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.config.useEncryption || !this.encryptionKey) {
      return encryptedData;
    }

    try {
      // Decode from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedBuffer = combined.slice(12);

      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encryptedBuffer
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      throw new StorageError('Decryption failed', 'DECRYPTION_ERROR', error as Error);
    }
  }

  /**
   * Get storage key with prefix
   */
  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Store data with validation and encryption
   */
  private async storeData<T>(key: string, data: T, validator?: (data: any) => boolean): Promise<void> {
    if (!this.isAvailable()) {
      throw new StorageError('Storage not available', 'STORAGE_UNAVAILABLE');
    }

    try {
      // Validate data if validator provided
      if (validator && !validator(data)) {
        throw new StorageError('Data validation failed', 'VALIDATION_ERROR');
      }

      // Serialize data
      const serialized = JSON.stringify(data);

      // Encrypt if enabled
      const encrypted = await this.encrypt(serialized);

      // Store in browser storage
      this.storage.setItem(this.getKey(key), encrypted);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }

      // Handle quota exceeded error
      if (error instanceof DOMException && error.code === 22) {
        throw new StorageError('Storage quota exceeded', 'QUOTA_EXCEEDED', error);
      }

      throw new StorageError('Failed to store data', 'STORAGE_ERROR', error as Error);
    }
  }

  /**
   * Retrieve data with decryption and validation
   */
  private async retrieveData<T>(key: string, validator?: (data: any) => data is T): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      // Get encrypted data from storage
      const encrypted = this.storage.getItem(this.getKey(key));
      if (!encrypted) {
        return null;
      }

      // Decrypt data
      const decrypted = await this.decrypt(encrypted);

      // Parse JSON
      const parsed = JSON.parse(decrypted);

      // Validate data if validator provided
      if (validator && !validator(parsed)) {
        console.warn(`Invalid data retrieved for key ${key}, clearing storage`);
        await this.clearData(key);
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn(`Failed to retrieve data for key ${key}:`, error);
      // Clear corrupted data
      await this.clearData(key);
      return null;
    }
  }

  /**
   * Clear data from storage
   */
  private async clearData(key: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      this.storage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn(`Failed to clear data for key ${key}:`, error);
    }
  }

  // Public interface implementation

  async storeUser(user: User): Promise<void> {
    await this.storeData(STORAGE_KEYS.USER, user, isValidUser);
  }

  async retrieveUser(): Promise<User | null> {
    return this.retrieveData(STORAGE_KEYS.USER, isValidUser);
  }

  async clearUser(): Promise<void> {
    await this.clearData(STORAGE_KEYS.USER);
  }

  async storeTokens(tokens: AuthTokens): Promise<void> {
    await this.storeData(STORAGE_KEYS.TOKENS, tokens, isValidAuthTokens);
  }

  async retrieveTokens(): Promise<AuthTokens | null> {
    return this.retrieveData(STORAGE_KEYS.TOKENS, isValidAuthTokens);
  }

  async clearTokens(): Promise<void> {
    await this.clearData(STORAGE_KEYS.TOKENS);
  }

  async storeLinkedAccount(account: LinkedAccount): Promise<void> {
    await this.storeData(STORAGE_KEYS.LINKED_ACCOUNT, account);
  }

  async retrieveLinkedAccount(): Promise<LinkedAccount | null> {
    return this.retrieveData(STORAGE_KEYS.LINKED_ACCOUNT);
  }

  async clearLinkedAccount(): Promise<void> {
    await this.clearData(STORAGE_KEYS.LINKED_ACCOUNT);
  }

  async storeSession(session: AuthSession): Promise<void> {
    // Store session components separately for better granular access
    if (session.user) {
      await this.storeUser(session.user);
    }
    if (session.tokens) {
      await this.storeTokens(session.tokens);
    }
    if (session.linkedAccount) {
      await this.storeLinkedAccount(session.linkedAccount);
    }
  }

  async retrieveSession(): Promise<AuthSession | null> {
    try {
      const user = await this.retrieveUser();
      const tokens = await this.retrieveTokens();
      const linkedAccount = await this.retrieveLinkedAccount();

      // If no user data, return empty session
      if (!user) {
        return {
          user: null,
          isAuthenticated: false,
          tokens: null,
          linkedAccount: null
        };
      }

      return {
        user,
        isAuthenticated: true,
        tokens,
        linkedAccount
      };
    } catch (error) {
      console.warn('Failed to retrieve session:', error);
      return null;
    }
  }

  async clearSession(): Promise<void> {
    await Promise.all([
      this.clearUser(),
      this.clearTokens(),
      this.clearLinkedAccount()
    ]);
  }

  isAvailable(): boolean {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const testKey = '__storage_test__';
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getStorageInfo(): StorageInfo {
    const available = this.isAvailable();
    
    let quota: number | undefined;
    let used: number | undefined;

    if (available && 'estimate' in navigator.storage) {
      // Modern browsers support storage estimation
      navigator.storage.estimate().then(estimate => {
        quota = estimate.quota;
        used = estimate.usage;
      }).catch(() => {
        // Ignore errors
      });
    }

    return {
      available,
      type: this.config.storageType,
      encrypted: this.config.useEncryption,
      quota,
      used
    };
  }
}

/**
 * Create default session storage adapter
 */
export const createSessionStorageAdapter = (config?: Partial<StorageConfig>): SessionStorageAdapter => {
  return new BrowserSessionStorageAdapter(config);
};

/**
 * Create memory-based storage adapter for testing
 */
export class MemoryStorageAdapter implements SessionStorageAdapter {
  private data = new Map<string, any>();

  async storeUser(user: User): Promise<void> {
    this.data.set('user', user);
  }

  async retrieveUser(): Promise<User | null> {
    return this.data.get('user') || null;
  }

  async clearUser(): Promise<void> {
    this.data.delete('user');
  }

  async storeTokens(tokens: AuthTokens): Promise<void> {
    this.data.set('tokens', tokens);
  }

  async retrieveTokens(): Promise<AuthTokens | null> {
    return this.data.get('tokens') || null;
  }

  async clearTokens(): Promise<void> {
    this.data.delete('tokens');
  }

  async storeLinkedAccount(account: LinkedAccount): Promise<void> {
    this.data.set('linkedAccount', account);
  }

  async retrieveLinkedAccount(): Promise<LinkedAccount | null> {
    return this.data.get('linkedAccount') || null;
  }

  async clearLinkedAccount(): Promise<void> {
    this.data.delete('linkedAccount');
  }

  async storeSession(session: AuthSession): Promise<void> {
    if (session.user) await this.storeUser(session.user);
    if (session.tokens) await this.storeTokens(session.tokens);
    if (session.linkedAccount) await this.storeLinkedAccount(session.linkedAccount);
  }

  async retrieveSession(): Promise<AuthSession | null> {
    const user = await this.retrieveUser();
    const tokens = await this.retrieveTokens();
    const linkedAccount = await this.retrieveLinkedAccount();

    return {
      user,
      isAuthenticated: !!user,
      tokens,
      linkedAccount
    };
  }

  async clearSession(): Promise<void> {
    this.data.clear();
  }

  isAvailable(): boolean {
    return true;
  }

  getStorageInfo(): StorageInfo {
    return {
      available: true,
      type: 'memory',
      encrypted: false
    };
  }
}
