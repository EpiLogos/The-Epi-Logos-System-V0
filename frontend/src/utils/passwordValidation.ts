/**
 * Password validation utilities for real-time feedback
 */

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecialChar: boolean;
  specialChars: string;
  rules: string[];
  description: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    digit: boolean;
    specialChar: boolean;
  };
  failedRules: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

// Default requirements that match backend validation
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialChar: true,
  specialChars: "!@#$%^&*(),.?\":{}|<>",
  rules: [
    "At least 8 characters long",
    "At least one uppercase letter (A-Z)",
    "At least one lowercase letter (a-z)",
    "At least one digit (0-9)",
    "At least one special character (!@#$%^&*(),.?\":{}|<>)"
  ],
  description: "Password must be at least 8 characters with uppercase, lowercase, digit, and special character"
};

/**
 * Validate password against requirements
 */
export function validatePassword(
  password: string, 
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const checks = {
    length: password.length >= requirements.minLength,
    uppercase: requirements.requireUppercase ? /[A-Z]/.test(password) : true,
    lowercase: requirements.requireLowercase ? /[a-z]/.test(password) : true,
    digit: requirements.requireDigit ? /\d/.test(password) : true,
    specialChar: requirements.requireSpecialChar 
      ? new RegExp(`[${requirements.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)
      : true
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.values(checks).length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  const failedRules: string[] = [];
  if (!checks.length) failedRules.push(requirements.rules[0]);
  if (!checks.uppercase) failedRules.push(requirements.rules[1]);
  if (!checks.lowercase) failedRules.push(requirements.rules[2]);
  if (!checks.digit) failedRules.push(requirements.rules[3]);
  if (!checks.specialChar) failedRules.push(requirements.rules[4]);

  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  if (score >= 100) strength = 'strong';
  else if (score >= 80) strength = 'good';
  else if (score >= 60) strength = 'fair';

  return {
    isValid: passedChecks === totalChecks,
    score,
    checks,
    failedRules,
    strength
  };
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(strength: string): string {
  switch (strength) {
    case 'strong': return 'text-green-400';
    case 'good': return 'text-blue-400';
    case 'fair': return 'text-yellow-400';
    case 'weak': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

/**
 * Get password strength background color
 */
export function getPasswordStrengthBgColor(strength: string): string {
  switch (strength) {
    case 'strong': return 'bg-green-500';
    case 'good': return 'bg-blue-500';
    case 'fair': return 'bg-yellow-500';
    case 'weak': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

/**
 * Fetch password requirements from backend
 */
export async function fetchPasswordRequirements(): Promise<PasswordRequirements> {
  try {
    const response = await fetch('http://localhost:8000/api/users/password-requirements');
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.warn('Failed to fetch password requirements from backend, using defaults:', error);
  }
  
  return DEFAULT_PASSWORD_REQUIREMENTS;
}
