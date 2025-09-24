'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnifiedAuth } from '@/auth/unified-auth-context';
import { cn } from '../../utils/cn';
import { AuthModalContent } from '../auth/AuthModalContent';
import { AccountModalContent } from '../account/AccountModalContent';
import { type EpiLogosBusinessState, type AccountBusinessState, type AuthBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';
import { DashboardModalContent } from '../dashboard/DashboardModalContent';
import { useModalContentTransition } from '../../hooks/useContentTransition';
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

  // Use the new content transition hook for smooth state changes
  const [contentTransitionState] = useModalContentTransition(
    businessState,
    modalExpansionComplete,
    {
      transitionDuration: 300,
      initialVisible: false,
      skipInitialTransition: businessState === 'png-displayed'
    }
  );

  // Ref to the dashboard modal container for cursor scoping
  const dashboardContainerRef = useRef<HTMLDivElement | null>(null);

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
            'content-transition-container modal-content-panel relative',
            contentTransitionState.contentVisible ? 'content-visible' : 'content-hidden'
          )}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Subtle Splash Cursor Effect - Full modal coverage */}
          <div className="absolute inset-0 pointer-events-none z-0" style={{ opacity: 0.3, filter: 'grayscale(100%)' }}>
            <SplashCursor
              SIM_RESOLUTION={64}
              DYE_RESOLUTION={720}
              DENSITY_DISSIPATION={8.0}
              VELOCITY_DISSIPATION={3.0}
              PRESSURE={0.25}
              PRESSURE_ITERATIONS={15}
              CURL={2}
              SPLAT_RADIUS={0.25}
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
            <DashboardModalContent onStateChange={onStateChange} />
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
            'content-transition-container modal-content-panel',
            contentTransitionState.contentVisible ? 'content-visible' : 'content-hidden'
          )}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <ChatModalContent onStateChange={onStateChange} />
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
            'content-transition-container modal-content-panel',
            contentTransitionState.contentVisible ? 'content-visible' : 'content-hidden'
          )}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <AuthModalContent
            businessState={businessState as AuthBusinessState}
            onStateChange={onStateChange}
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
            'content-transition-container modal-content-panel',
            contentTransitionState.contentVisible ? 'content-visible' : 'content-hidden'
          )}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <AccountModalContent
            businessState={businessState as AccountBusinessState}
            onStateChange={onStateChange}
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
