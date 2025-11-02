/**
 * Account Management Page - Coordinate #4.4.4 (Nara Subsystem)
 * Main user account page with integrated authentication and coordinate alignment
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/auth';
import { motion } from 'framer-motion';
import { WorkingThreeScene } from '@/components/system/WorkingThreeScene';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { TransitionBackground, usePageTransition } from '@/contexts/PageTransitionContext';
import { TransitionParticles, TransitionCard } from '@/components/system/TransitionParticles';
import UserAvatar from '@/components/ui/UserAvatar';
import PasswordSetupComponent from '@/components/auth/PasswordSetupComponent';
import SubscriptionManager from '@/components/account/SubscriptionManager';
import BillingHistory from '@/components/account/BillingHistory';
import MfaSetupComponent from '@/components/security/MfaSetupComponent';
import PasswordResetComponent from '@/components/security/PasswordResetComponent';

import {
  UserIcon,
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  CameraIcon,
  CheckIcon,
  EnvelopeIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

// Coordinate context for AG-UI integration
const COORDINATE_CONTEXT = {
  coordinate: '#4.4.4.4',
  subsystem: 4,
  name: 'Personal Account Management',
  context: 'nara-user-account'
};

const sidebarItems = [
  { id: 'profile', label: 'Profile Overview', icon: UserIcon },
  { id: 'security', label: 'Security & Privacy', icon: ShieldCheckIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'billing', label: 'Billing & Plans', icon: CreditCardIcon },
  { id: 'sessions', label: 'Active Sessions', icon: DevicePhoneMobileIcon },
  { id: 'preferences', label: 'Preferences', icon: CogIcon },
];

export default function AccountPage() {
  const { user, isAuthenticated, isLoading, hasPassword, hasMFA } = useAuth();
  const router = useRouter();
  const { completeTransition, transitionState } = usePageTransition();

  const [activeSection, setActiveSection] = useState('profile');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check URL params for initial tab selection (for OAuth password setup flow)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && sidebarItems.find(item => item.id === tab)) {
      setActiveSection(tab);
    }
  }, []);

  // Complete transition when page loads
  useEffect(() => {
    if (transitionState.isTransitioning && transitionState.toPage === '/account') {
      const timer = setTimeout(() => {
        completeTransition();
      }, 1000); // Complete after transition animation

      return () => clearTimeout(timer);
    }
  }, [transitionState, completeTransition]);

  // Broadcast coordinate context to global navbar
  useEffect(() => {
    // Store on window for immediate access
    (window as any).__CURRENT_COORDINATE_DATA__ = COORDINATE_CONTEXT;
    
    // Dispatch event for listeners
    const event = new CustomEvent('coordinate-updated', { detail: COORDINATE_CONTEXT });
    window.dispatchEvent(event);
  }, []);

  // Redirect if not authenticated with graceful loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setIsRedirecting(true);
      // Add a small delay for better UX
      setTimeout(() => {
        router.push('/auth/signin');
      }, 1500);
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state while checking auth or redirecting
  if (isLoading || (!isAuthenticated && isRedirecting)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-slate-600 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
          <div className="text-green-300 font-sans">
            {isLoading ? 'Loading account...' : 'Redirecting to sign in...'}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection isEditing={isEditing} setIsEditing={setIsEditing} user={user} />;
      case 'security':
        return <SecuritySection user={user} hasPassword={hasPassword()} hasMFA={hasMFA()} />;
      case 'notifications':
        return <NotificationsSection />;
      case 'billing':
        return <BillingSection />;
      case 'sessions':
        return <SessionsSection />;
      case 'preferences':
        return <PreferencesSection />;
      default:
        return <ProfileSection isEditing={isEditing} setIsEditing={setIsEditing} user={user} />;
    }
  };

  // Nara subsystem glow configuration
  const naraGlowConfig = {
    baseHue: 140,
    saturation: 60,
    lightness: 55,
    particleCount: 260,
    mode: 'glow' as const,
    radiusScale: 1.0,
    monochrome: false
  };

  const overlayTint = 'rgba(116, 201, 104, 0.35)';

  return (
    <motion.div
        className="min-h-screen relative"
        data-coordinate={COORDINATE_CONTEXT.coordinate}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
      {/* Transition-aware background */}
      <TransitionBackground currentPage="account" />

      {/* Transition-aware particles */}
      <TransitionParticles currentPage="account" />

      {/* Background Three.js Scene with Nara Glow */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-black to-slate-600" />}>
          <WorkingThreeScene
            theme="dark"
            initiallyTransitioned
            hideThree
            hideUiOverlays
            overlayTint={overlayTint}
            onEnterExperience={undefined}
            glow={naraGlowConfig}
          />
        </Suspense>
      </div>

      {/* Content overlay */}
      <div className="relative z-10">
        <div className="flex">
          {/* Collapsible Sidebar - Nara Palette */}
          <TransitionCard
            isVisible={!transitionState.isTransitioning || transitionState.toPage === '/account'}
            delay={0.4}
            className={`bg-black/30 backdrop-blur-sm border-r border-green-500/30 transition-all duration-300 shadow-xl ${sidebarCollapsed ? 'w-16' : 'w-72'}`}
          >
          <div className="p-4">
            {/* Back Navigation */}
            <div className="flex items-center justify-center mb-6">
              <button
                onClick={() => router.push('/')}
                className="h-12 w-12 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 hover:border-green-400/50 transition-all flex items-center justify-center group"
              >
                <ArrowLeftIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              {!sidebarCollapsed && (
                <h2 className="text-xl font-heading text-green-400 tracking-wide">
                  Account
                </h2>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-green-400 hover:text-green-300 hover:bg-green-600/20 p-2 border border-transparent hover:border-green-500/30 transition-all"
              >
                {sidebarCollapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-sans transition-all border ${
                      activeSection === item.id
                        ? 'bg-green-600/30 text-green-300 border-green-400/50 shadow-lg'
                        : 'text-green-400/80 bg-black/20 border-green-500/20 hover:bg-green-600/20 hover:text-green-300 hover:border-green-400/30'
                    } ${sidebarCollapsed && 'justify-center px-2'}`}
                  >
                    <div className="flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    {!sidebarCollapsed && <span className="text-left flex-1">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        </TransitionCard>

          {/* Main Content Area */}
          <TransitionCard
            isVisible={!transitionState.isTransitioning || transitionState.toPage === '/account'}
            delay={0.6}
            className="flex-1 p-8 min-h-screen"
          >
            <div className="max-w-5xl mx-auto">
              {renderContent()}
            </div>
          </TransitionCard>
        </div>
      </div>


    </motion.div>
  );
}

// Profile Section with consistent app styling
function ProfileSection({ isEditing, setIsEditing, user }: { isEditing: boolean; setIsEditing: (editing: boolean) => void; user: any }) {
  return (
    <div className="space-y-8">
      {/* Profile Header Card */}
      <div className="relative bg-black/30 backdrop-blur-sm border border-green-500/30 shadow-2xl p-8">
        <GlowingEffect
          variant="nara"
          proximity={100}
          spread={30}
          borderWidth={1}
          movementDuration={1.5}
        />
        <div className="flex items-start gap-8">
          <div className="relative">
            <UserAvatar
              user={{
                firstName: user?.firstName,
                lastName: user?.lastName,
                name: user?.name,
                picture: user?.profilePicture,
                email: user?.email
              }}
              size="xl"
              className="h-32 w-32 border-2 border-green-400/50 shadow-xl"
              showBorder={false}
            />
            {isEditing && (
              <button className="absolute -bottom-2 -right-2 h-10 w-10 bg-green-600/30 hover:bg-green-600/50 text-green-300 border border-green-400/50 hover:border-green-300 flex items-center justify-center transition-all group">
                <CameraIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                {isEditing ? (
                  <input
                    id="profile-full-name"
                    name="fullName"
                    type="text"
                    defaultValue={`${user?.firstName || ''} ${user?.lastName || ''}`}
                    className="text-3xl font-heading mb-3 max-w-xs border border-green-500/30 px-3 py-2 bg-black/20 text-green-300 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 backdrop-blur-sm"
                    aria-label="Full name"
                  />
                ) : (
                  <h1 className="text-3xl font-heading text-green-300 tracking-wide">
                    {user?.firstName || 'User'} {user?.lastName || 'Account'}
                  </h1>
                )}
                <div className="flex items-center gap-3 text-green-400/80 mt-2">
                  <EnvelopeIcon className="h-5 w-5" />
                  <span className="font-sans">{user?.email || 'user@example.com'}</span>
                  <span className="ml-2 bg-green-600/30 text-green-300 px-3 py-1 border border-green-400/50 font-sans text-xs">
                    Verified
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`gap-2 font-sans border px-4 py-2 transition-all ${
                  isEditing
                    ? 'bg-green-600/30 text-green-300 border-green-400/50 hover:bg-green-600/40'
                    : 'bg-black/20 text-green-400 border-green-500/30 hover:bg-green-600/20 hover:text-green-300 hover:border-green-400/50'
                } flex items-center`}
              >
                {isEditing ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <PencilIcon className="h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="border border-green-500/30 p-4 bg-black/20 backdrop-blur-sm">
                <span className="text-green-400 font-sans block mb-1">Member since:</span>
                <p className="font-heading text-lg text-green-300">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'January 2024'}</p>
              </div>
              <div className="border border-green-500/30 p-4 bg-black/20 backdrop-blur-sm">
                <span className="text-green-400 font-sans block mb-1">Last active:</span>
                <p className="font-heading text-lg text-green-300">Recently</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="relative bg-black/30 backdrop-blur-sm border border-green-500/30 shadow-2xl">
        <GlowingEffect
          variant="nara"
          proximity={100}
          spread={30}
          borderWidth={1}
          movementDuration={1.5}
        />
        <div className="border-b border-green-500/30 p-6">
          <h3 className="flex items-center gap-3 text-xl font-heading text-green-300 tracking-wide">
            <UserIcon className="h-6 w-6" />
            Personal Information
          </h3>
          <p className="font-sans text-green-400/80 mt-1">Manage your personal details and contact information</p>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="first-name" className="font-sans text-green-400 text-sm">First Name</label>
              <input
                id="first-name"
                name="firstName"
                type="text"
                defaultValue={user?.firstName || 'John'}
                disabled={!isEditing}
                className="w-full border border-green-500/30 px-3 py-2 bg-black/20 font-sans text-green-300 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 disabled:bg-black/10 disabled:text-green-400/60 backdrop-blur-sm transition-all"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="last-name" className="font-sans text-green-400 text-sm">Last Name</label>
              <input
                id="last-name"
                name="lastName"
                type="text"
                defaultValue={user?.lastName || 'Doe'}
                disabled={!isEditing}
                className="w-full border border-green-500/30 px-3 py-2 bg-black/20 font-sans text-green-300 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 disabled:bg-black/10 disabled:text-green-400/60 backdrop-blur-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="bio" className="font-sans text-green-400 text-sm">Bio</label>
            <textarea
              id="bio"
              name="bio"
              placeholder="Tell us about yourself..."
              defaultValue="Exploring consciousness-aligned computing and personal growth."
              disabled={!isEditing}
              className="w-full min-h-[120px] border border-green-500/30 px-3 py-2 bg-black/20 font-sans text-green-300 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 disabled:bg-black/10 disabled:text-green-400/60 backdrop-blur-sm resize-none transition-all placeholder:text-green-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="location" className="font-sans text-green-400 text-sm">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                defaultValue="Global"
                disabled={!isEditing}
                className="w-full border border-green-500/30 px-3 py-2 bg-black/20 font-sans text-green-300 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 disabled:bg-black/10 disabled:text-green-400/60 backdrop-blur-sm transition-all"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="website" className="font-sans text-green-400 text-sm">Website</label>
              <input
                id="website"
                name="website"
                type="url"
                defaultValue="https://example.com"
                disabled={!isEditing}
                className="w-full border border-green-500/30 px-3 py-2 bg-black/20 font-sans text-green-300 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 disabled:bg-black/10 disabled:text-green-400/60 backdrop-blur-sm transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Privileges Card - Only show for admin users */}
      {user?.isAdmin && (
        <div className="relative bg-black/30 backdrop-blur-sm border border-amber-500/30 shadow-2xl">
          <GlowingEffect
            variant="nara"
            proximity={100}
            spread={30}
            borderWidth={1}
            movementDuration={1.5}
          />
          <div className="border-b border-amber-500/30 p-6">
            <h3 className="flex items-center gap-3 text-xl font-heading text-amber-300 tracking-wide">
              <ShieldCheckIcon className="h-6 w-6" />
              Admin Privileges
            </h3>
            <p className="font-sans text-amber-400/80 mt-1">System administration settings</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 border border-amber-500/30 bg-black/20 backdrop-blur-sm">
              <div>
                <h4 className="font-heading text-amber-300 text-lg">Administrator Status</h4>
                <p className="font-sans text-amber-400/80 text-sm mt-1">
                  You have administrative privileges in the system
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-sans text-sm">Admin</span>
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Security section with password setup for OAuth users
function SecuritySection({ user, hasPassword: hasPasswordProp, hasMFA: hasMFAProp }: { user: any; hasPassword: boolean; hasMFA: boolean }) {
  const [userState, setUserState] = useState(user);
  const [activeSecurityTab, setActiveSecurityTab] = useState<'overview' | 'mfa' | 'password'>('overview');
  const [mfaEnabled, setMfaEnabled] = useState(hasMFAProp);
  const hasPassword = hasPasswordProp; // Use the prop from unified auth system
  const isOAuthUser = userState?.oauthProviders?.length > 0 || userState?.googleId;

  // Sync MFA state when user data changes
  useEffect(() => {
    setMfaEnabled(hasMFAProp);
    setUserState(user);
  }, [user, hasMFAProp]);

  // Debug logging
  console.log('SecuritySection Debug:', {
    user: userState,
    hasPassword,
    isOAuthUser,
    shouldShowPasswordSetup: isOAuthUser && !hasPassword,
    oauthProviders: userState?.oauthProviders,
    mfaEnabled,
    userMfaEnabled: user?.mfaEnabled,
    userHasMFA: user?.hasMFA
  });
  
  const handlePasswordSetupSuccess = () => {
    // Update user state to reflect password setup completion
    setUserState(prev => ({ ...prev, hasPassword: true }));
  };

  const handleMfaSetupSuccess = () => {
    // Update MFA status
    setMfaEnabled(true);
    // Also update the user state to reflect the change
    setUserState(prev => ({ ...prev, mfaEnabled: true, hasMFA: true }));
    setActiveSecurityTab('overview');
  };

  const handlePasswordResetSuccess = () => {
    // Could show a success message or update UI
    console.log('Password reset/change successful');
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-green-500/30 pb-4">
        <h1 className="text-3xl font-heading text-green-300 tracking-wide mb-2">Security & Privacy</h1>
        <p className="text-green-400/80 font-sans">Manage your account security and privacy settings</p>
      </div>

      {/* Security Tab Navigation */}
      <div className="flex bg-black/20 border border-green-500/30 p-1">
        <button
          onClick={() => setActiveSecurityTab('overview')}
          className={`flex-1 px-4 py-2 text-sm font-sans transition-all ${
            activeSecurityTab === 'overview'
              ? 'bg-green-600/30 text-green-300 border border-green-400/50'
              : 'text-green-400 hover:text-green-300 hover:bg-green-600/20'
          }`}
        >
          Security Overview
        </button>
        <button
          onClick={() => setActiveSecurityTab('mfa')}
          className={`flex-1 px-4 py-2 text-sm font-sans transition-all ${
            activeSecurityTab === 'mfa'
              ? 'bg-green-600/30 text-green-300 border border-green-400/50'
              : 'text-green-400 hover:text-green-300 hover:bg-green-600/20'
          }`}
        >
          Two-Factor Auth
        </button>
        <button
          onClick={() => setActiveSecurityTab('password')}
          className={`flex-1 px-4 py-2 text-sm font-sans transition-all ${
            activeSecurityTab === 'password'
              ? 'bg-green-600/30 text-green-300 border border-green-400/50'
              : 'text-green-400 hover:text-green-300 hover:bg-green-600/20'
          }`}
        >
          Password Management
        </button>
      </div>

      {/* Overview Tab */}
      {activeSecurityTab === 'overview' && (
        <>
          {/* Password Setup Card for OAuth users without passwords */}
          {isOAuthUser && !hasPassword && (
            <div className="relative bg-black/30 backdrop-blur-sm border border-green-500/30 shadow-2xl">
              <GlowingEffect
                variant="nara"
                proximity={100}
                spread={30}
                borderWidth={1}
                movementDuration={1.5}
              />
              <div className="border-b border-green-500/30 p-6">
                <h3 className="flex items-center gap-3 text-xl font-heading text-green-300 tracking-wide">
                  <ShieldCheckIcon className="h-6 w-6" />
                  Set Up Password Authentication
                </h3>
                <p className="font-sans text-green-400/80 mt-1">
                  Add password authentication to your Google account for enhanced security options
                </p>
              </div>
              <div className="p-8">
                <PasswordSetupComponent onSuccess={handlePasswordSetupSuccess} />
              </div>
            </div>
          )}

          {/* Security Overview */}
          <div className="relative bg-black/30 backdrop-blur-sm border border-green-500/30 shadow-2xl">
            <GlowingEffect
              variant="nara"
              proximity={100}
              spread={30}
              borderWidth={1}
              movementDuration={1.5}
            />
            <div className="border-b border-green-500/30 p-6">
              <h3 className="flex items-center gap-3 text-xl font-heading text-green-300 tracking-wide">
                <ShieldCheckIcon className="h-6 w-6" />
                Security Settings
              </h3>
              <p className="font-sans text-green-400/80 mt-1">Current security configuration and options</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-4 bg-black/20 border border-green-500/30">
                <div>
                  <h4 className="font-sans text-green-300 font-medium">Password Authentication</h4>
                  <p className="font-sans text-green-400/70 text-sm">
                    {hasPassword ? 'Password is set up and active' : 'No password configured'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-sans ${
                    hasPassword 
                      ? 'bg-green-600/30 text-green-300 border border-green-400/50'
                      : 'bg-yellow-600/30 text-yellow-300 border border-yellow-400/50'
                  }`}>
                    {hasPassword ? 'Active' : 'Not Set'}
                  </div>
                  {hasPassword && (
                    <button
                      onClick={() => setActiveSecurityTab('password')}
                      className="px-3 py-1 text-xs font-sans bg-black/20 hover:bg-green-600/20 text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-400/50 transition-all"
                    >
                      Manage
                    </button>
                  )}
                </div>
              </div>

              {isOAuthUser && (
                <div className="flex items-center justify-between p-4 bg-black/20 border border-green-500/30">
                  <div>
                    <h4 className="font-sans text-green-300 font-medium">Google OAuth</h4>
                    <p className="font-sans text-green-400/70 text-sm">
                      Connected to Google account for sign-in
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-sans bg-green-600/30 text-green-300 border border-green-400/50">
                    Connected
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-black/20 border border-green-500/30">
                <div>
                  <h4 className="font-sans text-green-300 font-medium">Two-Factor Authentication</h4>
                  <p className="font-sans text-green-400/70 text-sm">
                    Enhanced security with authenticator app
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-sans ${
                    mfaEnabled
                      ? 'bg-green-600/30 text-green-300 border border-green-400/50'
                      : 'bg-yellow-600/30 text-yellow-300 border border-yellow-400/50'
                  }`}>
                    {mfaEnabled ? 'Active' : 'Not Set'}
                  </div>
                  <button
                    onClick={() => setActiveSecurityTab('mfa')}
                    className="px-3 py-1 text-xs font-sans bg-black/20 hover:bg-green-600/20 text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-400/50 transition-all"
                  >
                    {mfaEnabled ? 'Manage' : 'Set Up'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MFA Tab */}
      {activeSecurityTab === 'mfa' && (
        <div className="relative bg-black/30 backdrop-blur-sm border border-green-500/30 shadow-2xl">
          <GlowingEffect
            variant="nara"
            proximity={100}
            spread={30}
            borderWidth={1}
            movementDuration={1.5}
          />
          <div className="border-b border-green-500/30 p-6">
            <h3 className="flex items-center gap-3 text-xl font-heading text-green-300 tracking-wide">
              <ShieldCheckIcon className="h-6 w-6" />
              Two-Factor Authentication
            </h3>
            <p className="font-sans text-green-400/80 mt-1">
              {mfaEnabled ? 'Manage your two-factor authentication settings' : 'Set up two-factor authentication for enhanced security'}
            </p>
          </div>
          <div className="p-8">
            {mfaEnabled ? (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-green-600/30 border border-green-400/50 rounded-full flex items-center justify-center">
                    <CheckIcon className="h-8 w-8 text-green-300" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-heading text-green-300 mb-2">
                    Two-Factor Authentication is Active
                  </h3>
                  <p className="text-green-400/80 font-sans mb-6">
                    Your account is protected with two-factor authentication.
                  </p>
                  <button
                    onClick={() => setMfaEnabled(false)}
                    className="px-6 py-2 bg-red-600/30 hover:bg-red-600/40 text-red-300 border border-red-400/50 hover:border-red-300 font-sans transition-all"
                  >
                    Disable MFA
                  </button>
                </div>
              </div>
            ) : (
              <MfaSetupComponent onSuccess={handleMfaSetupSuccess} />
            )}
          </div>
        </div>
      )}

      {/* Password Management Tab */}
      {activeSecurityTab === 'password' && (
        <div className="relative bg-black/30 backdrop-blur-sm border border-green-500/30 shadow-2xl">
          <GlowingEffect
            variant="nara"
            proximity={100}
            spread={30}
            borderWidth={1}
            movementDuration={1.5}
          />
          <div className="border-b border-green-500/30 p-6">
            <h3 className="flex items-center gap-3 text-xl font-heading text-green-300 tracking-wide">
              <KeyIcon className="h-6 w-6" />
              Password Management
            </h3>
            <p className="font-sans text-green-400/80 mt-1">
              Change your password or reset it via email
            </p>
          </div>
          <div className="p-8">
            {hasPassword ? (
              <PasswordResetComponent mode="change" onSuccess={handlePasswordResetSuccess} />
            ) : (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-yellow-600/20 border border-yellow-500/30 rounded-full flex items-center justify-center">
                    <KeyIcon className="h-8 w-8 text-yellow-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-heading text-yellow-300 mb-2">
                    No Password Set
                  </h3>
                  <p className="text-yellow-400/80 font-sans mb-6">
                    You need to set up a password before you can manage it. Use the Password Setup feature in the Security Overview tab.
                  </p>
                  <button
                    onClick={() => setActiveSecurityTab('overview')}
                    className="px-6 py-2 bg-green-600/30 hover:bg-green-600/40 text-green-300 border border-green-400/50 hover:border-green-300 font-sans transition-all"
                  >
                    Go to Password Setup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsSection() {
  return (
    <div className="space-y-8">
      <div className="border-b border-green-500/30 pb-4">
        <h1 className="text-3xl font-heading text-green-300 tracking-wide mb-2">Notifications</h1>
        <p className="text-green-400/80 font-sans">Choose what notifications you want to receive</p>
      </div>
      <div className="relative bg-black/30 backdrop-blur-sm  border border-green-500/30 shadow-2xl p-8">
        <GlowingEffect
          variant="nara"
          proximity={100}
          spread={30}
          borderWidth={1}
          movementDuration={1.5}
        />
        <p className="text-green-400 font-sans">Notification preferences are integrated with backend APIs.</p>
      </div>
    </div>
  );
}

function BillingSection() {
  const { getAuthHeader, isSessionValid } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Import billing service
  useEffect(() => {
    async function loadBillingService() {
      try {
        const { billingService } = await import('@/services/billing-service');
        
        // Inject auth context from useAuth hook
        billingService.setAuthContext({ getAuthHeader, isSessionValid });
        
        // Load subscription status
        const subData = await billingService.getSubscription();
        if (subData) {
          setSubscription({
            id: subData.id,
            userId: 'current-user', // Will be populated from auth context
            tier: subData.tier,
            status: subData.status,
            currentPeriodStart: new Date(),
            currentPeriodEnd: subData.current_period_end ? new Date(subData.current_period_end) : new Date(),
            cancelAtPeriodEnd: subData.cancel_at_period_end,
            stripeSubscriptionId: subData.id
          });
        }

        // Load billing history
        const historyData = await billingService.getBillingHistory();
        setBillingHistory(historyData.events || []);
        
      } catch (err) {
        console.error('Failed to load billing data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadBillingService();
  }, [getAuthHeader, isSessionValid]);

  const handleUpgrade = async () => {
    try {
      const { billingService } = await import('@/services/billing-service');
      billingService.setAuthContext({ getAuthHeader, isSessionValid });
      await billingService.redirectToCheckout();
    } catch (err) {
      console.error('Failed to start upgrade process:', err);
      setError('Failed to start upgrade process. Please try again.');
    }
  };

  const handleManage = async () => {
    try {
      const { billingService } = await import('@/services/billing-service');
      billingService.setAuthContext({ getAuthHeader, isSessionValid });
      await billingService.openCustomerPortal();
    } catch (err) {
      console.error('Failed to open customer portal:', err);
      setError('Failed to open billing management. Please try again.');
    }
  };

  const handleCancel = async () => {
    try {
      const { billingService } = await import('@/services/billing-service');
      billingService.setAuthContext({ getAuthHeader, isSessionValid });
      await billingService.cancelSubscription(false); // Cancel at period end
      
      // Refresh subscription status
      const subData = await billingService.getSubscription();
      if (subData) {
        setSubscription(prev => ({
          ...prev,
          cancelAtPeriodEnd: subData.cancel_at_period_end
        }));
      }
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      setError('Failed to cancel subscription. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="border-b border-green-500/30 pb-4">
          <h1 className="text-3xl font-heading text-green-300 tracking-wide mb-2">Billing & Plans</h1>
          <p className="text-green-400/80 font-sans">Manage your subscription and billing information</p>
        </div>
        <div className="relative bg-black/30 backdrop-blur-sm  border border-green-500/30 shadow-2xl p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            <span className="ml-3 text-green-400 font-sans">Loading billing information...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-green-500/30 pb-4">
        <h1 className="text-3xl font-heading text-green-300 tracking-wide mb-2">Billing & Plans</h1>
        <p className="text-green-400/80 font-sans">Manage your subscription and billing information</p>
      </div>

      {error && (
        <div className="relative bg-red-900/20 backdrop-blur-sm  border border-red-500/30 shadow-2xl p-6">
          <div className="text-red-400 font-sans">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Subscription Management */}
      <div className="relative bg-black/30 backdrop-blur-sm  border border-green-500/30 shadow-2xl">
        <GlowingEffect
          variant="nara"
          proximity={100}
          spread={30}
          borderWidth={1}
          movementDuration={1.5}
        />
        <div className="p-8">
          <SubscriptionManager
            subscription={subscription}
            onUpgrade={handleUpgrade}
            onManage={handleManage}
            onCancel={handleCancel}
          />
        </div>
      </div>

      {/* Billing History */}
      {billingHistory.length > 0 && (
        <div className="relative bg-black/30 backdrop-blur-sm  border border-green-500/30 shadow-2xl">
          <GlowingEffect
            variant="nara"
            proximity={100}
            spread={30}
            borderWidth={1}
            movementDuration={1.5}
          />
          <div className="border-b border-green-500/30 p-6">
            <h3 className="flex items-center gap-3 text-xl font-heading text-green-300 tracking-wide">
              <CreditCardIcon className="h-6 w-6" />
              Billing History
            </h3>
            <p className="font-sans text-green-400/80 mt-1">View your past invoices and payments</p>
          </div>
          <div className="p-8">
            <BillingHistory events={billingHistory} />
          </div>
        </div>
      )}

      {/* Stripe Integration Note */}
      <div className="relative bg-black/30 backdrop-blur-sm  border border-green-500/30 shadow-2xl p-6">
        <GlowingEffect
          variant="nara"
          proximity={100}
          spread={30}
          borderWidth={1}
          movementDuration={1.5}
        />
        <div className="text-sm text-green-400 font-sans">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheckIcon className="h-5 w-5" />
            <span className="font-medium">Secure Payment Processing</span>
          </div>
          <p className="text-green-400/80">
            All payments are processed securely through Stripe. We never store your payment information.
          </p>
        </div>
      </div>
    </div>
  );
}

function SessionsSection() {
  return (
    <div className="space-y-8">
      <div className="border-b border-green-500/30 pb-4">
        <h1 className="text-3xl font-heading text-green-300 tracking-wide mb-2">Active Sessions</h1>
        <p className="text-green-400/80 font-sans">Manage devices that are signed into your account</p>
      </div>
      <div className="relative bg-black/30 backdrop-blur-sm  border border-green-500/30 shadow-2xl p-8">
        <GlowingEffect
          variant="nara"
          proximity={100}
          spread={30}
          borderWidth={1}
          movementDuration={1.5}
        />
        <p className="text-green-400 font-sans">Session management connected to backend session APIs.</p>
      </div>
    </div>
  );
}

function PreferencesSection() {
  return (
    <div className="space-y-8">
      <div className="border-b border-green-500/30 pb-4">
        <h1 className="text-3xl font-heading text-green-300 tracking-wide mb-2">Preferences</h1>
        <p className="text-green-400/80 font-sans">Customize your Epi-Logos experience</p>
      </div>
      <div className="relative bg-black/30 backdrop-blur-sm  border border-green-500/30 shadow-2xl p-8">
        <GlowingEffect
          variant="nara"
          proximity={100}
          spread={30}
          borderWidth={1}
          movementDuration={1.5}
        />
        <p className="text-green-400 font-sans">User preferences sync with backend preference APIs.</p>
      </div>
    </div>
  );
}