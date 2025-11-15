"use client";

import React, { useEffect, useState } from 'react';
import EpiLogo from '@/components/EpiLogo';

interface DesktopOnlyWrapperProps {
  children: React.ReactNode;
}

/**
 * Desktop-Only Wrapper Component
 *
 * Detects mobile devices and displays a persistent message directing users
 * to access the site on desktop. Shows the Epi:Logos logo with a styled
 * redirect message on mobile devices.
 */
export default function DesktopOnlyWrapper({ children }: DesktopOnlyWrapperProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));

      // Also check screen width as a secondary measure
      const isMobileWidth = window.innerWidth < 1024; // Less than lg breakpoint

      return isMobileUA || isMobileWidth;
    };

    setIsMobile(checkMobile());

    // Re-check on window resize
    const handleResize = () => {
      setIsMobile(checkMobile());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keep showing consistent screen (no flash)
  if (isMobile === null) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-50" />
        <div className="relative z-10 flex flex-col items-center justify-center max-w-md space-y-8 text-center">
          <div className="flex justify-center">
            <EpiLogo size={120} interactive={false} />
          </div>
          <div className="space-y-4">
            <p className="text-gray-300 text-base leading-relaxed">
              The Epi:Logos System is optimized for desktop viewing. Please access this site from a desktop or laptop computer for the full experience.
            </p>
          </div>
          <div className="flex justify-center space-x-2 pt-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show mobile redirect screen (same as loading state for consistency)
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-50" />
        <div className="relative z-10 flex flex-col items-center justify-center max-w-md space-y-8 text-center">
          <div className="flex justify-center">
            <EpiLogo size={120} interactive={false} />
          </div>
          <div className="space-y-4">
            <p className="text-gray-300 text-base leading-relaxed">
              The Epi:Logos System is optimized for desktop viewing. Please access this site from a desktop or laptop computer for the full experience.
            </p>
          </div>
          <div className="flex justify-center space-x-2 pt-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show desktop content
  return <>{children}</>;
}
