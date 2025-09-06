'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/auth';
import { 
  ShieldCheckIcon, 
  KeyIcon, 
  CheckIcon,
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface MfaSetupComponentProps {
  onSuccess?: () => void;
}

interface MfaSetupData {
  secret: string;
  qr_code_url: string;
  backup_codes: string[];
}

export default function MfaSetupComponent({ onSuccess }: MfaSetupComponentProps) {
  const { getAuthHeader, refreshProfile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [step, setStep] = useState<'setup' | 'qr-code' | 'verify' | 'complete'>('setup');

  const handleSetupMfa = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authHeader = await getAuthHeader();
      const response = await fetch('/api/security/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          user_email: user?.email || 'unknown@example.com'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Setup failed: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setSetupData(result.data);
        setStep('qr-code');
      } else {
        throw new Error(result.message || 'MFA setup failed');
      }
    } catch (err) {
      console.error('MFA setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to set up MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const authHeader = await getAuthHeader();
      const response = await fetch('/api/security/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          totp_code: verificationCode,
          secret: setupData.secret
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Verification failed');
      }

      const result = await response.json();
      if (result.success) {
        // Refresh user data to reflect MFA setup
        try {
          await refreshProfile();
        } catch (refreshError) {
          console.warn('Failed to refresh user profile after MFA setup:', refreshError);
        }

        setStep('complete');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(result.message || 'Invalid verification code');
      }
    } catch (err) {
      console.error('MFA verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backup_codes) return;
    
    const content = setupData.backup_codes.join('\\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (step === 'complete') {
    return (
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-green-600/30 border border-green-400/50 rounded-full flex items-center justify-center">
            <CheckIcon className="h-8 w-8 text-green-300" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-heading text-green-300 mb-2">
            MFA Setup Complete!
          </h3>
          <p className="text-green-400/80 font-sans">
            Your account is now protected with two-factor authentication.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'qr-code' && setupData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-heading text-green-300 mb-2">
            Step 1: Scan QR Code
          </h3>
          <p className="text-green-400/80 font-sans">
            Use your phone's authenticator app to scan this QR code
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-black/20 border border-green-500/30 p-4 space-y-3">
          <h4 className="font-heading text-green-300 text-sm">📱 Need an authenticator app?</h4>
          <div className="text-green-400/80 font-sans text-sm space-y-1">
            <p>• <strong>Google Authenticator</strong> (recommended)</p>
            <p>• <strong>Authy</strong></p>
            <p>• <strong>Microsoft Authenticator</strong></p>
          </div>
          <div className="text-green-400/80 font-sans text-sm mt-3">
            <p>1. Open your authenticator app</p>
            <p>2. Tap "Add account" or "+"</p>
            <p>3. Choose "Scan QR code"</p>
            <p>4. Point your camera at the code below</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg">
            <QRCodeSVG value={setupData.qr_code_url} size={200} />
          </div>
        </div>

        {/* Manual setup option */}
        <div className="text-center space-y-2">
          <p className="text-green-400/80 font-sans text-sm">
            Can't scan? Enter this code manually in your app:
          </p>
          <div className="flex items-center justify-center gap-2">
            <code className="px-3 py-1 bg-black/20 border border-green-500/30 text-green-300 font-mono text-sm">
              {setupData.secret}
            </code>
            <button
              onClick={() => copyToClipboard(setupData.secret)}
              className="p-1 text-green-400 hover:text-green-300 hover:bg-green-600/20 transition-all"
              title="Copy secret"
            >
              <ClipboardIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setStep('verify')}
          className="w-full py-3 px-4 bg-green-600/30 hover:bg-green-600/40 text-green-300 border border-green-400/50 hover:border-green-300 font-sans transition-all"
        >
          I've Added the Account to My App
        </button>
      </div>
    );
  }

  if (step === 'verify' && setupData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-heading text-green-300 mb-2">
            Step 2: Verify Your Setup
          </h3>
          <p className="text-green-400/80 font-sans">
            Enter the 6-digit code from your authenticator app to complete setup.
          </p>
          <p className="text-green-400/60 font-sans text-sm mt-2">
            The code changes every 30 seconds, so use the current one displayed in your app.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="verification-code" className="block text-green-400 font-sans text-sm mb-2">
              Verification Code
            </label>
            <input
              id="verification-code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full border border-green-500/30 px-4 py-3 bg-black/20 text-green-300 font-mono text-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 backdrop-blur-sm"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 font-sans text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleVerifyCode}
            disabled={isVerifying || verificationCode.length !== 6}
            className="w-full py-3 px-4 bg-green-600/30 hover:bg-green-600/40 text-green-300 border border-green-400/50 hover:border-green-300 font-sans transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying...' : 'Verify & Complete Setup'}
          </button>
        </div>

        {/* Backup codes section */}
        <div className="border-t border-green-500/30 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-heading text-green-300">Backup Codes</h4>
            <button
              onClick={() => setShowBackupCodes(!showBackupCodes)}
              className="text-green-400 hover:text-green-300 font-sans text-sm flex items-center gap-2"
            >
              {showBackupCodes ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              {showBackupCodes ? 'Hide' : 'Show'} Codes
            </button>
          </div>
          
          {showBackupCodes && (
            <div className="space-y-4">
              <p className="text-green-400/80 font-sans text-sm">
                Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
              </p>
              <div className="grid grid-cols-2 gap-2 p-4 bg-black/20 border border-green-500/30 font-mono text-sm">
                {setupData.backup_codes.map((code, index) => (
                  <div key={index} className="text-green-300">
                    {code}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(setupData.backup_codes.join('\\n'))}
                  className="flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-green-600/20 text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-400/50 font-sans text-sm transition-all"
                >
                  <ClipboardIcon className="h-4 w-4" />
                  Copy Codes
                </button>
                <button
                  onClick={downloadBackupCodes}
                  className="flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-green-600/20 text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-400/50 font-sans text-sm transition-all"
                >
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-600/20 border border-green-500/30 rounded-full flex items-center justify-center">
              <ShieldCheckIcon className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h3 className="text-xl font-heading text-green-300 mb-2">
            Set Up Two-Factor Authentication
          </h3>
          <p className="text-green-400/80 font-sans">
            Add an extra layer of security to your account with TOTP-based two-factor authentication.
          </p>
        </div>

        <div className="space-y-4 p-4 bg-black/20 border border-green-500/30">
          <h4 className="font-heading text-green-300 flex items-center gap-2">
            <KeyIcon className="h-5 w-5" />
            What you'll need:
          </h4>
          <ul className="space-y-2 text-green-400/80 font-sans text-sm">
            <li className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-green-400" />
              A smartphone or tablet
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-green-400" />
              An authenticator app (Google Authenticator, Authy, etc.)
            </li>
          </ul>
        </div>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 font-sans text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSetupMfa}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-green-600/30 hover:bg-green-600/40 text-green-300 border border-green-400/50 hover:border-green-300 font-sans transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Setting up...' : 'Set Up Two-Factor Authentication'}
        </button>
      </div>
    );
  }

  return null;
}