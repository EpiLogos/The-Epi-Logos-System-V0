/**
 * Automatic Account Linking Tests
 * Tests for automatic account linking flow for OAuth sign-in (AC: #5, #13)
 */

import { describe, test, expect, vi, beforeEach } // Jest globals available;
import { AccountLinkingService } from '../account-linking-service';
import { setupOAuthTests, createMockGoogleProfile } from './test-setup';

describe('AccountLinkingService', () => {
  let linkingService: AccountLinkingService;
  let mocks: ReturnType<typeof setupOAuthTests>;

  beforeEach(() => {
    mocks = setupOAuthTests();
    linkingService = new AccountLinkingService();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  test('should automatically sign in existing user with same email', async () => {
    const existingUser = { id: 'user123', email: 'user@example.com', name: 'Existing User' };
    const googleProfile = {
      googleId: 'google456',
      email: 'user@example.com',
      name: 'Test User'
    };

    // Mock existing account found
    jest.spyOn(linkingService, 'findExistingAccountByEmail').mockResolvedValue(existingUser);
    jest.spyOn(linkingService, 'saveAccountLink').mockResolvedValue(undefined);

    const result = await linkingService.handleOAuthSignIn(googleProfile);
    
    expect(result.success).toBe(true);
    expect(result.newUser?.email).toBe('user@example.com');
    expect(result.linkedAccount?.googleId).toBe('google456');
    expect(linkingService.saveAccountLink).toHaveBeenCalled();
  });

  test('should create new user when no existing account found', async () => {
    const googleProfile = {
      googleId: 'google456',
      email: 'newuser@example.com',
      name: 'New User'
    };

    // Mock no existing account found
    jest.spyOn(linkingService, 'findExistingAccountByEmail').mockResolvedValue(null);

    const result = await linkingService.handleOAuthSignIn(googleProfile);
    
    expect(result.success).toBe(true);
    expect(result.newUser?.email).toBe('newuser@example.com');
    expect(result.newUser?.googleId).toBe('google456');
    expect(result.linkedAccount).toBeUndefined();
  });

  test('should prevent automatic linking of existing email accounts', async () => {
    const googleProfile = {
      googleId: 'google456',
      email: 'existing@example.com',
      name: 'Test User'
    };

    // Mock existing account with same email
    jest.spyOn(linkingService, 'findExistingAccountByEmail').mockResolvedValue({
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
    jest.spyOn(linkingService, 'findExistingAccountByEmail').mockResolvedValue(null);
    jest.spyOn(linkingService, 'createNewUser').mockResolvedValue(undefined);

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
    jest.spyOn(linkingService, 'verifyReAuthentication').mockResolvedValue(true);
    jest.spyOn(linkingService, 'validateAccountOwnership').mockResolvedValue(false);

    await expect(linkingService.linkGoogleAccount(existingUserId, googleProfile, true))
      .rejects.toThrow('Account ownership validation failed');
  });
});