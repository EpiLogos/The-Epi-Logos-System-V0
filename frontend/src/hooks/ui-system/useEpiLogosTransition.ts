'use client';

import { useState, useCallback } from 'react';

export type EpiLogosAnimationPhase = 'initial' | 'text-fading' | 'width-expanding' | 'height-expanding' | 'complete';

export interface EpiLogosTransitionState {
  isExpanded: boolean;
  animationPhase: EpiLogosAnimationPhase;
  showEnterButton: boolean;
  showExpandedContent: boolean;
  modalVisible: boolean;
  imageVisible: boolean;
  imageFullyVisible: boolean;
  logoVisible: boolean;
  imageMovedToCorner: boolean;
  imageExpanded: boolean;
  // Auth modal states
  showAuthModal: boolean;
  authModalType: 'auth-signin' | 'auth-signup' | 'auth-oauth' | 'auth-success' | null;
}

export interface EpiLogosTransitionActions {
  enterModal: () => void;
  resetState: () => void;
  transitionToDashboard: () => void; // Dashboard transition action
  // Auth modal actions
  showSigninModal: () => void;
  showSignupModal: () => void;
  showAuthSuccessModal: () => void;
  hideAuthModal: () => void;
}

export const useEpiLogosTransition = (): [EpiLogosTransitionState, EpiLogosTransitionActions] => {
  
  // Core modal state
  const [isExpanded, setIsExpanded] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<EpiLogosAnimationPhase>('initial');
  
  // Content visibility states
  const [showEnterButton, setShowEnterButton] = useState(true);
  const [showExpandedContent, setShowExpandedContent] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageVisible, setImageVisible] = useState(false);
  const [imageFullyVisible, setImageFullyVisible] = useState(false);
  
  // Text visibility states
  const [logoVisible, setLogoVisible] = useState(true);
  
  // PNG position state
  const [imageMovedToCorner, setImageMovedToCorner] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState<'auth-signin' | 'auth-signup' | 'auth-oauth' | 'auth-success' | null>(null);


  const enterModal = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setAnimationPhase('text-fading');
    
    // PHASE 1: Coordinated fade-out - text and SVG together (400ms)
    setTimeout(() => {
      setShowEnterButton(false);
      setLogoVisible(false);
    }, 400); // Slightly longer to match SVG fade
    
    // PHASE 2: Width expansion starts (1200ms delay from start - more breathing room)
    setTimeout(() => {
      setIsExpanded(true);
      setModalVisible(true);
      setImageVisible(true);
      setAnimationPhase('width-expanding');
    }, 1200); // Slower start
    
    // PHASE 3: Height expansion starts (2100ms delay - after width completes)
    setTimeout(() => {
      setAnimationPhase('height-expanding');
      
      // PHASE 3.5: PNG fade-in during height expansion (600ms into height animation)
      setTimeout(() => {
        setImageFullyVisible(true);
      }, 600);
      
    }, 2100); // Width: 1200ms + 800ms + 100ms buffer = 2100ms
    
    // PHASE 4: Content fade-in after all animations complete (4200ms from start)
    setTimeout(() => {
      setAnimationPhase('complete');
      setLogoVisible(true);
      setShowExpandedContent(true);
    }, 4200); // Width(1200+800) + Height(1000) + PNG(600) + buffer(600) = 4200ms
  }, []);

  const resetState = useCallback(() => {
    // COMMENTED OUT: Don't reset isExpanded during EpiLogos → Subsystems transition
    // setIsExpanded(false);
    setAnimationPhase('initial');
    setShowEnterButton(true);
    setShowExpandedContent(false);
    setModalVisible(false);
    setImageVisible(false);
    setImageFullyVisible(false);
    setLogoVisible(true);
    setImageMovedToCorner(false);
    setImageExpanded(false);
  }, []);


  const transitionToDashboard = useCallback(() => {
    console.log('Transitioning to dashboard...');
    // Step 1: Expand PNG slightly (10% increase)
    setImageExpanded(true);
    
    // Step 2: After brief delay, shrink to center
    setTimeout(() => {
      setImageMovedToCorner(true);
      
      // Step 3: After PNG animation completes, show auth modal
      setTimeout(() => {
        setShowAuthModal(true);
        setAuthModalType('auth-signin'); // Default to signin
      }, 1800); // Wait for PNG shrink animation to complete
    }, 200); // Brief 200ms expansion phase
  }, []);

  const showSigninModal = useCallback(() => {
    setShowAuthModal(true);
    setAuthModalType('auth-signin');
  }, []);

  const showSignupModal = useCallback(() => {
    setShowAuthModal(true);
    setAuthModalType('auth-signup');
  }, []);

  const showAuthSuccessModal = useCallback(() => {
    setShowAuthModal(true);
    setAuthModalType('auth-success');
  }, []);

  const hideAuthModal = useCallback(() => {
    setShowAuthModal(false);
    setAuthModalType(null);
  }, []);

  const state: EpiLogosTransitionState = {
    isExpanded,
    animationPhase,
    showEnterButton,
    showExpandedContent,
    modalVisible,
    imageVisible,
    imageFullyVisible,
    logoVisible,
    imageMovedToCorner,
    imageExpanded,
    showAuthModal,
    authModalType,
  };

  const actions: EpiLogosTransitionActions = {
    enterModal,
    resetState,
    transitionToDashboard, // Dashboard transition action
    showSigninModal,
    showSignupModal,
    showAuthSuccessModal,
    hideAuthModal,
  };

  return [state, actions];
};