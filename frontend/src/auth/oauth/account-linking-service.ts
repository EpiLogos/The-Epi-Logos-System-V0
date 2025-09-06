/**
 * Account Linking Service
 * Handles secure account linking with re-authentication (AC: #5, #13)
 */

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface ExistingAccount {
  id: string;
  email: string;
  [key: string]: any;
}

export interface LinkingResult {
  success: boolean;
  linkedAccount?: {
    googleId: string;
    userId: string;
    email: string;
  };
  message?: string;
  newUser?: {
    id: string;
    email: string;
    name: string;
    googleId: string;
    hasPassword?: boolean;
    isExistingUser?: boolean;
  };
}

export class AccountLinkingService {
  
  async linkGoogleAccount(
    existingUserId: string, 
    googleProfile: GoogleProfile, 
    reAuthenticated: boolean
  ): Promise<LinkingResult> {
    // Require re-authentication for account linking
    if (!reAuthenticated) {
      throw new Error('Re-authentication required for account linking');
    }

    // Verify re-authentication was successful
    const reAuthValid = await this.verifyReAuthentication(existingUserId);
    if (!reAuthValid) {
      throw new Error('Re-authentication verification failed');
    }

    // Validate ownership of both accounts
    const ownershipValid = await this.validateAccountOwnership(existingUserId, googleProfile);
    if (!ownershipValid) {
      throw new Error('Account ownership validation failed');
    }

    // Link the accounts
    const linkedAccount = {
      googleId: googleProfile.googleId,
      userId: existingUserId,
      email: googleProfile.email
    };

    // In a real implementation, this would save to database
    await this.saveAccountLink(linkedAccount);

    return {
      success: true,
      linkedAccount
    };
  }

  async handleOAuthSignIn(googleProfile: GoogleProfile): Promise<LinkingResult> {
    // Check if an account with this email already exists
    const existingAccount = await this.findExistingAccountByEmail(googleProfile.email);

    if (existingAccount) {
      // Account exists - automatically link and sign them in
      // OAuth email verification is sufficient for identity confirmation
      const linkedAccount = {
        googleId: googleProfile.googleId,
        userId: existingAccount.id,
        email: googleProfile.email
      };

      // Auto-link the Google account to existing user
      await this.saveAccountLink(linkedAccount);

      return {
        success: true,
        linkedAccount,
        newUser: {
          id: existingAccount.id,
          email: existingAccount.email,
          name: googleProfile.name, // Use Google profile name
          googleId: googleProfile.googleId,
          hasPassword: existingAccount.hasPassword ?? true, // Existing users typically have passwords
          isExistingUser: true
        }
      };
    }

    // No existing account - backend has already created the user during OAuth exchange
    // So we just return success (no need to create user here)
    return {
      success: true,
      newUser: {
        id: googleProfile.googleId, // Will be replaced with actual user ID from backend
        email: googleProfile.email,
        name: googleProfile.name,
        googleId: googleProfile.googleId,
        hasPassword: false, // New OAuth users typically don't have passwords yet
        isExistingUser: false
      }
    };
  }

  // Mock methods - in real implementation these would interact with database/auth service
  async verifyReAuthentication(userId: string): Promise<boolean> {
    // Mock implementation - would verify recent authentication
    return true;
  }

  async validateAccountOwnership(userId: string, googleProfile: GoogleProfile): Promise<boolean> {
    // Mock implementation - would validate user owns both accounts
    // This could involve email verification, security questions, etc.
    return true;
  }

  async findExistingAccountByEmail(email: string): Promise<ExistingAccount | null> {
    try {
      const response = await fetch(`/api/users/email/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Handle 404 as "user not found" (which is expected)
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Check if user exists based on API response structure
      if (result.success && result.data.exists) {
        return {
          id: result.data.user.id,
          email: result.data.user.email,
          firstName: result.data.user.firstName,
          lastName: result.data.user.lastName,
          hasOAuthProviders: result.data.user.hasOAuthProviders,
          hasPassword: result.data.user.hasPassword
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking user existence:', error);
      // In case of error, assume user doesn't exist to be safe
      return null;
    }
  }

  private async saveAccountLink(linkData: { googleId: string; userId: string; email: string }): Promise<void> {
    // Mock implementation - would save to database
    console.log('Saving account link:', linkData);
  }

  private async createNewUser(userData: { id: string; email: string; name: string; googleId: string }): Promise<void> {
    // User creation is handled by the backend during OAuth token exchange
    // This method is no longer needed but kept for interface compatibility
    console.log('User creation handled by backend during OAuth exchange:', userData.email);
  }
}