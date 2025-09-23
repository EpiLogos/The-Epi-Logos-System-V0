// Business state type definition for EpiLogos modal system
export type EpiLogosBusinessState = 
  | 'png-displayed'                    // PNG image shown (default)
  | 'dashboard'                        // NEW: Dashboard with 6 circles (default for authenticated)
  | 'auth-signin' | 'auth-signup'      // Authentication states
  | 'auth-oauth' | 'auth-success'      // OAuth flow states
  | 'account-profile' | 'account-security' | 'account-billing' // Current account states
  | 'account-notifications' | 'account-sessions' | 'account-preferences'; // NEW: Additional account states

// Account state type subset for AccountModalContent
export type AccountBusinessState = 
  | 'account-profile' 
  | 'account-security' 
  | 'account-billing'
  | 'account-notifications' 
  | 'account-sessions' 
  | 'account-preferences';

// Authentication state type subset for AuthModalContent  
export type AuthBusinessState = 
  | 'auth-signin' 
  | 'auth-signup' 
  | 'auth-oauth' 
  | 'auth-success';
