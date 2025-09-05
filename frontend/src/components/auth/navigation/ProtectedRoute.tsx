/**
 * Protected Route Component
 * Provides authentication-based access control for Epi-Logos subsystem routes
 */

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  subsystemId?: number;
  fallbackPath?: string;
  showLoadingSpinner?: boolean;
}

interface SubsystemInfo {
  id: number;
  name: string;
  coordinate: string;
  path: string;
}

const SUBSYSTEM_MAP: Record<number, SubsystemInfo> = {
  0: { id: 0, name: 'Anuttara', coordinate: '#0', path: '/subsystems/anuttara' },
  1: { id: 1, name: 'Paramasiva', coordinate: '#1', path: '/subsystems/paramasiva' },
  2: { id: 2, name: 'Parashakti', coordinate: '#2', path: '/subsystems/parashakti' },
  3: { id: 3, name: 'Mahamaya', coordinate: '#3', path: '/subsystems/mahamaya' },
  4: { id: 4, name: 'Nara', coordinate: '#4', path: '/subsystems/nara' },
  5: { id: 5, name: 'Epii', coordinate: '#5', path: '/subsystems/epii' }
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  subsystemId,
  fallbackPath = '/',
  showLoadingSpinner = true
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [accessCheckComplete, setAccessCheckComplete] = useState(false);

  // Determine which subsystem this route is for based on path or explicit ID
  const getSubsystemFromPath = (path: string): SubsystemInfo | null => {
    for (const subsystem of Object.values(SUBSYSTEM_MAP)) {
      if (path.startsWith(subsystem.path)) {
        return subsystem;
      }
    }
    return null;
  };

  const currentSubsystem = subsystemId !== undefined 
    ? SUBSYSTEM_MAP[subsystemId]
    : getSubsystemFromPath(pathname);

  // Check access permissions
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Wait for auth loading to complete
        if (isLoading) {
          return;
        }

        // Basic authentication check
        if (!isAuthenticated) {
          setAccessGranted(false);
          setAccessCheckComplete(true);
          return;
        }

        // User-level access checks
        if (!user) {
          setAccessGranted(false);
          setAccessCheckComplete(true);
          return;
        }

        // Permission-based access checks
        if (requiredPermissions.length > 0) {
          // This would check against user permissions
          // For now, assume authenticated users have basic permissions
          const hasAllPermissions = requiredPermissions.every(permission => {
            // Implement actual permission checking logic here
            return true; // Placeholder - grant all permissions for now
          });

          if (!hasAllPermissions) {
            setAccessGranted(false);
            setAccessCheckComplete(true);
            return;
          }
        }

        // Subsystem-specific access checks
        if (currentSubsystem) {
          // Check if user has access to specific subsystem
          const hasSubsystemAccess = await checkSubsystemAccess(currentSubsystem.id, user);
          setAccessGranted(hasSubsystemAccess);
        } else {
          // No specific subsystem - grant access
          setAccessGranted(true);
        }

        setAccessCheckComplete(true);

      } catch (error) {
        console.error('Access check failed:', error);
        setAccessGranted(false);
        setAccessCheckComplete(true);
      }
    };

    checkAccess();
  }, [isAuthenticated, user, isLoading, requiredPermissions, currentSubsystem?.id, pathname]);

  // Redirect on access denied
  useEffect(() => {
    if (accessCheckComplete && accessGranted === false) {
      const redirectPath = isAuthenticated ? fallbackPath : `/?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectPath);
    }
  }, [accessCheckComplete, accessGranted, isAuthenticated, router, fallbackPath, pathname]);

  // Helper function to check subsystem-specific access
  const checkSubsystemAccess = async (subsystemId: number, user: any): Promise<boolean> => {
    try {
      // This would make an API call to check subsystem access
      // For now, grant access to all authenticated users
      
      // Simulate API delay for testing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Basic access control - all authenticated users can access all subsystems
      return true;
      
      // Future implementation might check:
      // - User subscription level
      // - Subsystem-specific permissions
      // - Rate limiting
      // - Feature flags
      
    } catch (error) {
      console.error(`Subsystem ${subsystemId} access check failed:`, error);
      return false;
    }
  };

  // Show loading state
  if (isLoading || !accessCheckComplete) {
    if (!showLoadingSpinner) {
      return null;
    }

    return (
      <div 
        className="protected-route-loading flex flex-col items-center justify-center min-h-screen"
        data-testid="protected-route-loading"
        role="status"
        aria-label="Loading protected content"
      >
        <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mb-4" />
        <div className="text-gray-600">
          {currentSubsystem ? `Loading ${currentSubsystem.name}...` : 'Loading...'}
        </div>
      </div>
    );
  }

  // Show access denied state (shouldn't normally be seen due to redirect)
  if (accessGranted === false) {
    return (
      <div 
        className="protected-route-denied flex flex-col items-center justify-center min-h-screen bg-red-50"
        data-testid="access-denied"
        role="alert"
        aria-label="Access denied"
      >
        <div className="text-red-600 text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h1>
        <p className="text-red-600 mb-4 text-center max-w-md">
          {!isAuthenticated 
            ? 'Please sign in to access this subsystem.'
            : currentSubsystem
              ? `You don't have permission to access ${currentSubsystem.name} (${currentSubsystem.coordinate}).`
              : 'You don\'t have permission to access this resource.'
          }
        </p>
        
        <button
          onClick={() => router.push(fallbackPath)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          type="button"
        >
          {!isAuthenticated ? 'Sign In' : 'Return Home'}
        </button>
      </div>
    );
  }

  // Access granted - render children with context
  return (
    <div 
      className="protected-route-content"
      data-testid="protected-content"
      data-subsystem-id={currentSubsystem?.id}
      data-subsystem-name={currentSubsystem?.name?.toLowerCase()}
    >
      {/* Accessibility announcement for subsystem */}
      {currentSubsystem && (
        <div 
          className="sr-only" 
          role="status" 
          aria-live="polite"
          aria-label={`Entered ${currentSubsystem.name} subsystem`}
        >
          Now viewing {currentSubsystem.name} ({currentSubsystem.coordinate}) subsystem
        </div>
      )}
      
      {children}
    </div>
  );
};

// Higher-order component for easy wrapping
export const withProtectedRoute = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) => {
  return (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Subsystem-specific route guards
export const AnuttaraProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute subsystemId={0}>{children}</ProtectedRoute>
);

export const ParamasivaProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute subsystemId={1}>{children}</ProtectedRoute>
);

export const ParashaktiProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute subsystemId={2}>{children}</ProtectedRoute>
);

export const MahamayaProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute subsystemId={3}>{children}</ProtectedRoute>
);

export const NaraProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute subsystemId={4}>{children}</ProtectedRoute>
);

export const EpiiProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute subsystemId={5}>{children}</ProtectedRoute>
);