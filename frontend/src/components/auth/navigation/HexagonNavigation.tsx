/**
 * Hexagon Navigation Component
 * Central navigation hub for the six Epi-Logos subsystems with authentication integration
 */

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../auth/auth-context';
// import { useOAuth } from '../../../contexts/OAuthContext';
import { GoogleSignInButton } from '../oauth/GoogleSignInButton';

interface SubsystemInfo {
  id: number;
  coordinate: string;
  name: string;
  path: string;
  description: string;
}

const SUBSYSTEMS: SubsystemInfo[] = [
  {
    id: 0,
    coordinate: '#0',
    name: 'Anuttara',
    path: '/subsystems/anuttara',
    description: 'Absolute Ground & Proto-Logical Processing'
  },
  {
    id: 1,
    coordinate: '#1', 
    name: 'Paramasiva',
    path: '/subsystems/paramasiva',
    description: 'Foundational Architect of Quaternal Logic'
  },
  {
    id: 2,
    coordinate: '#2',
    name: 'Parashakti', 
    path: '/subsystems/parashakti',
    description: 'Cosmic Imagination & Vibrational Matrix'
  },
  {
    id: 3,
    coordinate: '#3',
    name: 'Mahamaya',
    path: '/subsystems/mahamaya',
    description: 'Universal Transcription Engine'
  },
  {
    id: 4,
    coordinate: '#4',
    name: 'Nara',
    path: '/subsystems/nara', 
    description: 'Dialogical-Identity Processing'
  },
  {
    id: 5,
    coordinate: '#5',
    name: 'Epii',
    path: '/subsystems/epii',
    description: 'Synthesis & Orchestration Processing'
  }
];

export const HexagonNavigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, signOut, isLoading: authLoading } = useAuth();
  // const { initiateOAuthFlow, isLoading: oauthLoading } = useOAuth();
  const oauthLoading = false; // Temporary mock
  
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubsystemClick = (subsystem: SubsystemInfo) => {
    if (!isAuthenticated) {
      return; // Disabled click - no navigation
    }

    router.push(subsystem.path);
  };

  const handleSignOut = () => {
    setShowSignOutDialog(true);
  };

  const confirmSignOut = async () => {
    await signOut();
    setShowSignOutDialog(false);
  };

  const cancelSignOut = () => {
    setShowSignOutDialog(false);
  };

  const toggleNavigation = () => {
    setIsNavigationExpanded(!isNavigationExpanded);
  };

  const renderSubsystemItem = (subsystem: SubsystemInfo) => {
    const isActive = pathname === subsystem.path;
    const isDisabled = !isAuthenticated;

    return (
      <div
        key={subsystem.id}
        className={`subsystem-item relative ${isActive ? 'subsystem-active' : ''} ${
          isDisabled ? 'subsystem-disabled' : 'subsystem-enabled'
        }`}
        onMouseEnter={() => {
          // Add hover class for styling
          if (!isDisabled) {
            // This would trigger preloading in a real implementation
          }
        }}
        onMouseLeave={() => {
          // Remove hover class
        }}
      >
        <a
          href={subsystem.path}
          onClick={(e) => {
            e.preventDefault();
            handleSubsystemClick(subsystem);
          }}
          className={`block p-4 rounded-lg border transition-all duration-200 ${
            isDisabled 
              ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
              : 'border-blue-200 bg-white text-blue-800 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
          } ${isActive ? 'border-blue-600 bg-blue-100' : ''}`}
          aria-disabled={isDisabled ? 'true' : undefined}
          aria-description={subsystem.description}
          tabIndex={isDisabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
              e.preventDefault();
              handleSubsystemClick(subsystem);
            }
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="coordinate-badge text-sm font-mono bg-gray-200 px-2 py-1 rounded">
              {subsystem.coordinate}
            </div>
            <div>
              <div className="font-semibold">{subsystem.name}</div>
              <div className="text-xs opacity-75">{subsystem.description}</div>
            </div>
          </div>
          
          {isDisabled && (
            <div 
              className="absolute top-2 right-2 w-4 h-4 text-gray-400"
              data-testid="subsystem-locked"
              aria-label="Locked - sign in required"
            >
              🔒
            </div>
          )}
        </a>
      </div>
    );
  };

  const renderAuthenticationSection = () => {
    if (authLoading) {
      return (
        <div className="authentication-section p-4 text-center">
          <div className="loading-spinner w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <div className="mt-2 text-sm text-gray-600">Loading...</div>
        </div>
      );
    }

    if (isAuthenticated && user) {
      return (
        <div className="authentication-section p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            {user.picture && (
              <img
                src={user.picture}
                alt={`${user.name} avatar`}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div className="flex-1">
              <div className="font-semibold text-green-800">{user.name}</div>
              <div className="text-sm text-green-600">{user.email}</div>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="mt-3 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            type="button"
          >
            Sign Out
          </button>
        </div>
      );
    }

    return (
      <div className="authentication-section p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-center mb-4">
          <h3 className="font-semibold text-blue-800">Sign in to access the Epi-Logos System</h3>
          <p className="text-sm text-blue-600 mt-1">
            Authentication required for subsystem access
          </p>
        </div>

        <div className="space-y-3">
          <GoogleSignInButton 
            returnUrl={pathname}
            className="w-full"
          />
          <button
            type="button"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign in with Email
          </button>
        </div>

        {oauthLoading && (
          <div className="mt-3 text-center">
            <div 
              className="inline-block w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"
              data-testid="oauth-loading-spinner"
            />
            <span className="ml-2 text-sm text-blue-600">Signing in...</span>
          </div>
        )}
      </div>
    );
  };

  const renderSignOutDialog = () => {
    if (!showSignOutDialog) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div 
          role="dialog"
          aria-labelledby="signout-dialog-title"
          aria-describedby="signout-dialog-description"
          className="bg-white rounded-lg p-6 max-w-sm mx-4"
        >
          <h3 id="signout-dialog-title" className="font-semibold text-lg mb-2">
            Confirm Sign Out
          </h3>
          <p id="signout-dialog-description" className="text-gray-600 mb-4">
            Are you sure you want to sign out of the Epi-Logos System?
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={confirmSignOut}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              type="button"
            >
              Confirm
            </button>
            <button
              onClick={cancelSignOut}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isMobile && window.innerWidth <= 320) {
    // Collapsed mobile navigation
    return (
      <nav 
        className="hexagon-navigation navigation-mobile"
        aria-label="Epi-Logos System Navigation"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Epi-Logos</h2>
            <button
              onClick={toggleNavigation}
              className="px-3 py-2 bg-blue-600 text-white rounded"
              aria-label="Toggle navigation"
              type="button"
            >
              ☰
            </button>
          </div>

          {isNavigationExpanded && (
            <div data-testid="expanded-navigation" className="space-y-4">
              {renderAuthenticationSection()}
              
              <div className="subsystems-grid space-y-2">
                {SUBSYSTEMS.map(renderSubsystemItem)}
              </div>
            </div>
          )}
        </div>

        {renderSignOutDialog()}
      </nav>
    );
  }

  return (
    <nav 
      className={`hexagon-navigation ${isMobile ? 'navigation-mobile' : ''}`}
      aria-label="Epi-Logos System Navigation"
    >
      <div data-testid="hexagon-container" className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Epi-Logos System</h1>
          <p className="text-blue-600">Consciousness-Aligned Computing Platform</p>
          
          {/* Authentication Status Announcer */}
          <div 
            aria-label="Authentication status"
            className="sr-only"
            aria-live="polite"
          >
            {isAuthenticated 
              ? `Signed in as ${user?.name || 'User'}`
              : 'Not signed in'
            }
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Authentication Section */}
          <div className="md:col-span-2">
            {renderAuthenticationSection()}
          </div>
        </div>

        {/* Subsystems Grid */}
        <div className="subsystems-grid grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUBSYSTEMS.map(renderSubsystemItem)}
        </div>
      </div>

      {renderSignOutDialog()}
    </nav>
  );
};