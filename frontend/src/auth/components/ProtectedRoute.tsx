/**
 * ProtectedRoute Component
 * Route protection component using domain-driven auth system
 * 
 * This component provides comprehensive route protection with
 * authentication, authorization, and conditional rendering.
 */

import React, { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { redirect } from 'next/navigation';

/**
 * Protected route props
 */
export interface ProtectedRouteProps {
  children: ReactNode;
  
  // Authentication requirements
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  
  // Authorization requirements
  requiredTier?: 'free' | 'patron';
  requiredActions?: string[];
  
  // Redirect options
  redirectTo?: string;
  redirectOnUnauthorized?: string;
  
  // Loading and error states
  loadingComponent?: ReactNode;
  unauthorizedComponent?: ReactNode;
  
  // Custom validation
  customValidator?: (user: any) => boolean;
  customValidatorMessage?: string;
}

/**
 * Protected Route Component
 * 
 * Provides comprehensive route protection with authentication and authorization.
 * 
 * @example
 * ```tsx
 * // Basic authentication protection
 * <ProtectedRoute requireAuth>
 *   <DashboardPage />
 * </ProtectedRoute>
 * 
 * // Patron-only route
 * <ProtectedRoute requireAuth requiredTier="patron">
 *   <PremiumFeatures />
 * </ProtectedRoute>
 * 
 * // Custom validation
 * <ProtectedRoute 
 *   requireAuth 
 *   customValidator={(user) => user.isAdmin}
 *   customValidatorMessage="Admin access required"
 * >
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  requireEmailVerification = false,
  requiredTier,
  requiredActions = [],
  redirectTo = '/auth/signin',
  redirectOnUnauthorized = '/unauthorized',
  loadingComponent,
  unauthorizedComponent,
  customValidator,
  customValidatorMessage
}: ProtectedRouteProps) {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    canAccess, 
    canPerform,
    isEmailVerified 
  } = useAuth();

  // Show loading state
  if (isLoading) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    redirect(redirectTo);
    return null;
  }

  // Check email verification requirement
  if (requireEmailVerification && !isEmailVerified()) {
    return unauthorizedComponent || (
      <DefaultUnauthorizedComponent 
        message="Email verification required"
        action="Please verify your email address to access this page."
      />
    );
  }

  // Check tier requirement
  if (requiredTier && !canAccess(requiredTier, requireEmailVerification)) {
    return unauthorizedComponent || (
      <DefaultUnauthorizedComponent 
        message={`${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} tier required`}
        action={requiredTier === 'patron' ? 'Upgrade to Patron to access this feature.' : 'Access denied.'}
      />
    );
  }

  // Check action requirements
  for (const action of requiredActions) {
    if (!canPerform(action)) {
      return unauthorizedComponent || (
        <DefaultUnauthorizedComponent 
          message="Insufficient permissions"
          action={`You don't have permission to perform: ${action}`}
        />
      );
    }
  }

  // Check custom validation
  if (customValidator && user && !customValidator(user)) {
    return unauthorizedComponent || (
      <DefaultUnauthorizedComponent 
        message={customValidatorMessage || "Access denied"}
        action="You don't meet the requirements to access this page."
      />
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Default loading component
 */
function DefaultLoadingComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  );
}

/**
 * Default unauthorized component
 */
function DefaultUnauthorizedComponent({ 
  message, 
  action 
}: { 
  message: string; 
  action: string; 
}) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{message}</h1>
        <p className="text-gray-600 mb-4">{action}</p>
        <button 
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

/**
 * Require Authentication Component
 * 
 * Simple wrapper that requires authentication.
 * 
 * @example
 * ```tsx
 * <RequireAuth>
 *   <UserDashboard />
 * </RequireAuth>
 * ```
 */
export function RequireAuth({ 
  children, 
  redirectTo = '/auth/signin',
  loadingComponent 
}: {
  children: ReactNode;
  redirectTo?: string;
  loadingComponent?: ReactNode;
}) {
  return (
    <ProtectedRoute 
      requireAuth 
      redirectTo={redirectTo}
      loadingComponent={loadingComponent}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Require Email Verification Component
 * 
 * Requires both authentication and email verification.
 * 
 * @example
 * ```tsx
 * <RequireEmailVerification>
 *   <SensitiveFeature />
 * </RequireEmailVerification>
 * ```
 */
export function RequireEmailVerification({ 
  children,
  redirectTo = '/auth/signin'
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  return (
    <ProtectedRoute 
      requireAuth 
      requireEmailVerification
      redirectTo={redirectTo}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Require Patron Component
 * 
 * Requires patron tier access.
 * 
 * @example
 * ```tsx
 * <RequirePatron>
 *   <PremiumFeatures />
 * </RequirePatron>
 * ```
 */
export function RequirePatron({ 
  children,
  redirectTo = '/auth/signin'
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  return (
    <ProtectedRoute 
      requireAuth 
      requiredTier="patron"
      redirectTo={redirectTo}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Conditional Auth Component
 * 
 * Renders different content based on authentication state.
 * 
 * @example
 * ```tsx
 * <ConditionalAuth
 *   authenticated={<UserDashboard />}
 *   unauthenticated={<LandingPage />}
 *   loading={<LoadingSpinner />}
 * />
 * ```
 */
export function ConditionalAuth({
  authenticated,
  unauthenticated,
  loading
}: {
  authenticated: ReactNode;
  unauthenticated: ReactNode;
  loading?: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return loading || <DefaultLoadingComponent />;
  }

  return isAuthenticated ? <>{authenticated}</> : <>{unauthenticated}</>;
}

/**
 * Auth Guard Component
 * 
 * Renders children only if authentication requirements are met.
 * 
 * @example
 * ```tsx
 * <AuthGuard requireAuth>
 *   <button>Delete Account</button>
 * </AuthGuard>
 * 
 * <AuthGuard requiredTier="patron">
 *   <PremiumButton />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  requireAuth = false,
  requiredTier,
  requiredActions = [],
  fallback = null,
  customValidator
}: {
  children: ReactNode;
  requireAuth?: boolean;
  requiredTier?: 'free' | 'patron';
  requiredActions?: string[];
  fallback?: ReactNode;
  customValidator?: (user: any) => boolean;
}) {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    canAccess, 
    canPerform 
  } = useAuth();

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check tier requirement
  if (requiredTier && !canAccess(requiredTier)) {
    return <>{fallback}</>;
  }

  // Check action requirements
  for (const action of requiredActions) {
    if (!canPerform(action)) {
      return <>{fallback}</>;
    }
  }

  // Check custom validation
  if (customValidator && user && !customValidator(user)) {
    return <>{fallback}</>;
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Role-based Access Component
 * 
 * Renders content based on user roles/permissions.
 * 
 * @example
 * ```tsx
 * <RoleBasedAccess
 *   roles={{
 *     admin: <AdminPanel />,
 *     patron: <PatronFeatures />,
 *     free: <FreeFeatures />
 *   }}
 *   fallback={<AccessDenied />}
 * />
 * ```
 */
export function RoleBasedAccess({
  roles,
  fallback = null
}: {
  roles: {
    admin?: ReactNode;
    patron?: ReactNode;
    free?: ReactNode;
  };
  fallback?: ReactNode;
}) {
  const { user, canPerform } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  // Check for admin role (custom logic)
  if (roles.admin && canPerform('admin_access')) {
    return <>{roles.admin}</>;
  }

  // Check for patron tier
  if (roles.patron && user.tier === 'patron') {
    return <>{roles.patron}</>;
  }

  // Check for free tier
  if (roles.free && user.tier === 'free') {
    return <>{roles.free}</>;
  }

  return <>{fallback}</>;
}
