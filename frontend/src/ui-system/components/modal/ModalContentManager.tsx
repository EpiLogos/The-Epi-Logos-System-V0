'use client';

import React, { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnifiedAuth } from '@/auth/unified-auth-context';
import { cn } from '../../utils/cn';
import { AuthModalContent } from '../auth/AuthModalContent';
import { AccountModalContent } from '../account/AccountModalContent';
import { type EpiLogosBusinessState, type AccountBusinessState, type AuthBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';
import { DashboardModalContent } from '../dashboard/DashboardModalContent';
import { ChatModalContent } from '../chat/ChatModalContent';
import { SplashCursor } from '@/components/splash-cursor';

interface ModalContentManagerProps {
  businessState: EpiLogosBusinessState;
  onStateChange: (state: EpiLogosBusinessState) => void;
  onPNGClick: () => void;
  imageFullyVisible: boolean;
  imageMovedToCorner: boolean;
  imageExpanded: boolean;
  showContent: boolean;
  modalExpansionComplete?: boolean; // New prop to coordinate with modal expansion
}

export const ModalContentManager: React.FC<ModalContentManagerProps> = ({
  businessState,
  onStateChange,
  onPNGClick,
  imageFullyVisible,
  imageMovedToCorner,
  imageExpanded,
  showContent,
  modalExpansionComplete = true // Default to true for backward compatibility
}) => {
  const { isAuthenticated } = useUnifiedAuth();
  // Framer owns fade/blur transitions here; CSS utilities handle layout/typography only

  // Ref to the dashboard modal container for cursor scoping
  const dashboardContainerRef = useRef<HTMLDivElement | null>(null);

  // Prevent duplicate businessState updates (e.g., mount effects or StrictMode)
  const safeOnStateChange = useCallback((next: EpiLogosBusinessState) => {
    if (next === businessState) return;
    onStateChange(next);
  }, [businessState, onStateChange]);

  // PNG Image State
  if (businessState === 'png-displayed') {
    return (
      <PNGImageContent 
        onClick={onPNGClick}
        imageFullyVisible={imageFullyVisible}
        imageMovedToCorner={imageMovedToCorner}
        imageExpanded={imageExpanded}
      />
    );
  }

  // Dashboard State (authenticated users)
  if (businessState === 'dashboard') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="dashboard"
          ref={dashboardContainerRef}
          className={cn(
            'modal-content-panel relative w-full h-full flex items-center justify-center'
          )}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
        >
          {/* Subtle Splash Cursor Effect - Full modal coverage */}
          <div className="absolute inset-0 pointer-events-none z-0" style={{ opacity: 0.3, filter: 'grayscale(100%)' }}>
            <SplashCursor
              SIM_RESOLUTION={64}
              DYE_RESOLUTION={512}
              DENSITY_DISSIPATION={12.0}
              VELOCITY_DISSIPATION={5.0}
              PRESSURE={0.25}
              PRESSURE_ITERATIONS={12}
              CURL={2}
              SPLAT_RADIUS={0.18}
              SPLAT_FORCE={3000}
              SHADING={false}
              COLOR_UPDATE_SPEED={5}
              BACK_COLOR={{ r: 0, g: 0, b: 0 }}
              TRANSPARENT={true}
              eventTargetRef={dashboardContainerRef}
            />
          </div>

          {/* Dashboard content with proper z-index */}
          <div className="relative z-10">
            <DashboardModalContent onStateChange={safeOnStateChange} />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Chat State
  if (businessState === 'chat') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="chat"
          className={cn(
            'content-transition-container no-opacity-filter-transition modal-content-panel mb-[5px]'
          )}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <ChatModalContent onStateChange={safeOnStateChange} />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Auth States (unauthenticated users)
  if (businessState.startsWith('auth-')) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={businessState} // Key changes trigger transitions between auth states
          className={cn(
            'content-transition-container no-opacity-filter-transition modal-content-panel mt-[80px] mb-[5px]'
          )}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <AuthModalContent
            businessState={businessState as AuthBusinessState}
            onStateChange={safeOnStateChange}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Account States (authenticated users)
  if (businessState.startsWith('account-')) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={businessState} // Key changes trigger transitions between account states
          className={cn(
            'content-transition-container no-opacity-filter-transition modal-content-panel mb-[5px]'
          )}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <AccountModalContent
            businessState={businessState as AccountBusinessState}
            onStateChange={safeOnStateChange}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};

interface PNGImageContentProps {
  onClick: () => void;
  imageFullyVisible: boolean;
  imageMovedToCorner: boolean;
  imageExpanded: boolean;
}

const PNGImageContent: React.FC<PNGImageContentProps> = ({
  onClick,
  imageFullyVisible,
  imageMovedToCorner,
  imageExpanded
}) => {
  if (!imageFullyVisible) return null;

  return (
    <img 
      src="/ui-system/modal-image.png" 
      alt="Modal Design"
      onClick={onClick}
      className={cn(
        "epi-png-base",
        "png-gentle-waves",
        // Apply hover utilities when image is fully visible (loaded state)
        imageFullyVisible && "epi-png-loaded epi-png-hover",
        // Conditional transitions - Fast pop, then slow shrink
        imageExpanded && !imageMovedToCorner 
          ? "epi-png-pop-transition" 
          : "epi-png-smooth-transition",
        // Three-step animation: expand slightly, then shrink to center
        imageExpanded && !imageMovedToCorner && "epi-png-expand-state",
        imageMovedToCorner && "epi-png-corner-state"
      )}
    />
  );
};

// (no ExitingOverlay; Framer handles exit/enter)
