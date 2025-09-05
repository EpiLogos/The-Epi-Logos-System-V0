/**
 * Secure Account Linking Tests - RED Phase
 * Tests for secure account linking flow with re-authentication (AC: #5, #13)
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { AccountLinkingService } from '../account-linking-service';
import { setupOAuthTests, createMockGoogleProfile } from './test-setup';

describe('AccountLinkingService', () => {
  let linkingService: AccountLinkingService;
  let mocks: ReturnType<typeof setupOAuthTests>;

  beforeEach(() => {
    mocks = setupOAuthTests();
    linkingService = new AccountLinkingService();
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  test('should require re-authentication for account linking', async () => {
    const existingUserId = 'user123';
    const googleProfile = {
      googleId: 'google456',
      email: 'user@example.com',
      name: 'Test User'
    };

    // Attempt linking without re-authentication
    await expect(linkingService.linkGoogleAccount(existingUserId, googleProfile, false))
      .rejects.toThrow('Re-authentication required for account linking');
  });

  test('should successfully link accounts after re-authentication', async () => {
    const existingUserId = 'user123';
    const googleProfile = {
      googleId: 'google456',
      email: 'user@example.com',
      name: 'Test User'
    };

    // Mock successful re-authentication using vi.spyOn
    vi.spyOn(linkingService, 'verifyReAuthentication').mockResolvedValue(true);
    vi.spyOn(linkingService, 'validateAccountOwnership').mockResolvedValue(true);
    vi.spyOn(linkingService, 'saveAccountLink').mockResolvedValue(undefined);

    const result = await linkingService.linkGoogleAccount(existingUserId, googleProfile, true);
    
    expect(result.success).toBe(true);
    expect(result.linkedAccount).toBeDefined();
    expect(result.linkedAccount.googleId).toBe(googleProfile.googleId);
  });

  test('should prevent automatic linking of existing email accounts', async () => {
    const googleProfile = {
      googleId: 'google456',
      email: 'existing@example.com',
      name: 'Test User'
    };

    // Mock existing account with same email
    vi.spyOn(linkingService, 'findExistingAccountByEmail').mockResolvedValue({
      id: 'existing123',
      email: 'existing@example.com'
    });

    const result = await linkingService.handleOAuthSignIn(googleProfile);
    
    expect(result.requiresLinking).toBe(true);
    expect(result.message).toContain('account with this email already exists');
    expect(result.redirectTo).toBe('/auth/link-account');
  });

  test('should create new account for OAuth users with unique emails', async () => {
    const googleProfile = {
      googleId: 'google456',
      email: 'new@example.com',
      name: 'New User'
    };

    // Mock no existing account
    vi.spyOn(linkingService, 'findExistingAccountByEmail').mockResolvedValue(null);
    vi.spyOn(linkingService, 'createNewUser').mockResolvedValue(undefined);

    const result = await linkingService.handleOAuthSignIn(googleProfile);
    
    expect(result.success).toBe(true);
    expect(result.newUser).toBeDefined();
    expect(result.newUser.email).toBe(googleProfile.email);
  });

  test('should validate ownership of both accounts during linking', async () => {
    const existingUserId = 'user123';
    const googleProfile = {
      googleId: 'google456',
      email: 'user@example.com',
      name: 'Test User'
    };

    // Mock failed ownership validation
    vi.spyOn(linkingService, 'verifyReAuthentication').mockResolvedValue(true);
    vi.spyOn(linkingService, 'validateAccountOwnership').mockResolvedValue(false);

    await expect(linkingService.linkGoogleAccount(existingUserId, googleProfile, true))
      .rejects.toThrow('Account ownership validation failed');
  });
});