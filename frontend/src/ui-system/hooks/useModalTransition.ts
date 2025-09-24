import { useState, useCallback, useEffect } from 'react';

export type AnimationPhase = 'idle' | 'height-expanding' | 'width-expanding' | 'icon-moving' | 'complete';

export interface ModalTransitionState {
  isModalExpanded: boolean;
  animationPhase: AnimationPhase;
  imageRepositioned: boolean;
  showOriginalContent: boolean;
  showModalContent: boolean;
  logoVisible: boolean;
  originalTextVisible: boolean;
  modalTextVisible: boolean;
  isClosing: boolean;
}

export interface ModalTransitionActions {
  openModal: () => void;
  closeModal: () => void;
  resetState: () => void;
}

export const useModalTransition = (): [ModalTransitionState, ModalTransitionActions] => {
  // Core modal state
  const [isModalExpanded, setIsModalExpanded] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [imageRepositioned, setImageRepositioned] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Content visibility states
  const [showOriginalContent, setShowOriginalContent] = useState(true);
  const [showModalContent, setShowModalContent] = useState(false);
  
  // Text visibility states
  const [logoVisible, setLogoVisible] = useState(true);
  const [originalTextVisible, setOriginalTextVisible] = useState(true);
  const [modalTextVisible, setModalTextVisible] = useState(false);

  // Initial panel height animation - reveals coordinate text after 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      setImageRepositioned(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const openModal = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Reset closing state
    setIsClosing(false);
    
    // PHASE 1: Text fade-out (300ms instead of immediate)
    setTimeout(() => {
      setLogoVisible(false);
      setOriginalTextVisible(false);
    }, 300);
    
    setTimeout(() => {
      setShowOriginalContent(false);
      setIsModalExpanded(true);
      setAnimationPhase('height-expanding');
      
      // PHASE 3: Content fade-in - ALIGNED WITH WIDTH TRANSITION COMPLETION
      // Width transition: 1000ms delay + 1000ms duration = completes at 2000ms
      // Total timing: 750ms (initial) + 1250ms = 2000ms (matches width completion)
      setTimeout(() => {
        setAnimationPhase('complete');
        setLogoVisible(true);
        setModalTextVisible(true);
        setShowModalContent(true);
      }, 1250); // 750ms + 1250ms = 2000ms (width transition completion)
    }, 750); // Text fade-out duration (450ms CSS transition + 300ms buffer for DOM removal)
  }, []);

  const closeModal = useCallback(() => {
    // CLOSING MODAL - Text fade out first, then panel transition
    setModalTextVisible(false);
    setLogoVisible(false);
    setAnimationPhase('icon-moving');

    setTimeout(() => {
      setIsModalExpanded(false); // Trigger CSS transition after 300ms delay
      
      setTimeout(() => {
        setAnimationPhase('idle');
        setShowModalContent(false);
        setImageRepositioned(false);
        setLogoVisible(true);
        setOriginalTextVisible(true);
        setShowOriginalContent(true);
      }, 1800); // Wait for closing transition to complete
    }, 600); // 600ms delay before return animation
  }, []);

  const resetState = useCallback(() => {
    setIsModalExpanded(false);
    setAnimationPhase('idle');
    setImageRepositioned(false);
    setIsClosing(false);
    setShowOriginalContent(true);
    setShowModalContent(false);
    setLogoVisible(true);
    setOriginalTextVisible(true);
    setModalTextVisible(false);
  }, []);

  const state: ModalTransitionState = {
    isModalExpanded,
    animationPhase,
    imageRepositioned,
    showOriginalContent,
    showModalContent,
    logoVisible,
    originalTextVisible,
    modalTextVisible,
    isClosing,
  };

  const actions: ModalTransitionActions = {
    openModal,
    closeModal,
    resetState,
  };

  return [state, actions];
};
