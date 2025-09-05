"use client";

import { usePathname } from 'next/navigation';
import EpiiNavigation from '../system/EpiiNavigation';
import { NavigationErrorBoundary } from '../ErrorBoundary';

export default function ConditionalNavigation() {
  const pathname = usePathname();

  // Don't show navigation on the home page, scene page, or system page
  // Scene page and system page manage their own navbar state
  // ANIMATION LOADED: System page navbar only appears after "Enter Experience" button click
  // Account page and all other pages use EpiiNavigation with global collapsible toggle
  if (pathname === '/' || pathname === '/scene' || pathname === '/system') {
    return null;
  }
  
  // Show navigation on all other pages with proper spacing
  return (
    <NavigationErrorBoundary>
      <EpiiNavigation className="fixed top-0 left-0 right-0 z-[300]" />
    </NavigationErrorBoundary>
  );
}
