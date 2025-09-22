'use client';

import React from 'react';
import { useUnifiedAuth } from '@/auth/unified-auth-context';
import { cn } from '../../utils/cn';
import { AuthModalContent } from '../auth/AuthModalContent';
import { AccountModalContent } from '../account/AccountModalContent';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';

interface ModalContentManagerProps {
  businessState: EpiLogosBusinessState;
  onStateChange: (state: EpiLogosBusinessState) => void;
  onPNGClick: () => void;
  imageFullyVisible: boolean;
  imageMovedToCorner: boolean;
  imageExpanded: boolean;
  showContent: boolean;
}

export const ModalContentManager: React.FC<ModalContentManagerProps> = ({
  businessState,
  onStateChange,
  onPNGClick,
  imageFullyVisible,
  imageMovedToCorner,
  imageExpanded,
  showContent
}) => {
  const { isAuthenticated } = useUnifiedAuth();

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

  // Auth States (unauthenticated users)
  if (businessState.startsWith('auth-')) {
    return (
      <div className={cn(
        'content-transition-container',
        showContent ? 'content-visible' : 'content-hidden'
      )}>
        <AuthModalContent 
          businessState={businessState as 'auth-signin' | 'auth-signup' | 'auth-oauth' | 'auth-success'} 
          onStateChange={onStateChange} 
        />
      </div>
    );
  }

  // Account States (authenticated users)  
  if (businessState.startsWith('account-')) {
    return (
      <div className={cn(
        'content-transition-container',
        showContent ? 'content-visible' : 'content-hidden'
      )}>
        <AccountModalContent 
          businessState={businessState as 'account-profile' | 'account-security' | 'account-billing'} 
          onStateChange={onStateChange} 
        />
      </div>
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