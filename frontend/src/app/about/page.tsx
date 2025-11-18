'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/ui-system/utils/cn';
import { useSidebar } from '@/contexts/SidebarContext';
import { LightModeProvider, useLightMode } from '@/contexts/LightModeContext';
import { SidebarContent } from './components/SidebarContent';
import { EssayReader } from './components/EssayReader';
import { EssayScrollingSections } from './components/EssayScrollingSections';
import { PromptPackageViewer } from './components/PromptPackageViewer';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { motion } from 'framer-motion';
import Image from 'next/image';

/**
 * About / Landing Page
 *
 * Structure:
 * - Sidebar (expanded by default): Contains hero + all content sections
 * - Collapsed state: Shows essay/document view on right side
 *
 * Pattern: Two-page side-by-side where sidebar IS the main content page
 */
function AboutPageContent() {
  const { isCollapsed, toggle, collapse } = useSidebar();
  const { isLightMode } = useLightMode();
  const [currentEssay, setCurrentEssay] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [essaySectionIndex, setEssaySectionIndex] = useState(0);
  const [sidebarSectionIndex, setSidebarSectionIndex] = useState(0);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [isLogoLoading, setIsLogoLoading] = useState(true);
  const totalEssaySections = 6; // intro + 4 essays + 1 prompt package
  const totalSidebarSections = 6; // hero + 5 content sections

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleToggle();
      }

      // Left/Right arrows for sidebar toggle
      if (!currentEssay) {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          if (!isCollapsed) {
            // Close sidebar (collapse it) to reveal essays
            handleToggle();
          }
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          if (isCollapsed) {
            // Open sidebar (expand it)
            handleToggle();
          }
        }
      }

      // Arrow keys for section navigation
      if (!currentEssay) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          if (isCollapsed) {
            // Navigate essay sections
            const nextIndex = Math.min(essaySectionIndex + 1, totalEssaySections - 1);
            const navEvent = new CustomEvent('essaySectionNavigate', { detail: { index: nextIndex } });
            window.dispatchEvent(navEvent);
          } else {
            // Navigate sidebar sections
            const nextIndex = Math.min(sidebarSectionIndex + 1, totalSidebarSections - 1);
            const navEvent = new CustomEvent('sidebarSectionNavigate', { detail: { index: nextIndex } });
            window.dispatchEvent(navEvent);
          }
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          if (isCollapsed) {
            // Navigate essay sections
            const prevIndex = Math.max(essaySectionIndex - 1, 0);
            const navEvent = new CustomEvent('essaySectionNavigate', { detail: { index: prevIndex } });
            window.dispatchEvent(navEvent);
          } else {
            // Navigate sidebar sections
            const prevIndex = Math.max(sidebarSectionIndex - 1, 0);
            const navEvent = new CustomEvent('sidebarSectionNavigate', { detail: { index: prevIndex } });
            window.dispatchEvent(navEvent);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed, currentEssay, essaySectionIndex, sidebarSectionIndex, totalEssaySections, totalSidebarSections]);

  const handleToggle = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      toggle();
      setTimeout(() => setIsTransitioning(false), 400);
    }, 300);
  };

  const handleEssayClick = (essayId: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentEssay(essayId);
      collapse(); // Collapse sidebar to reveal essay
      setTimeout(() => setIsTransitioning(false), 400);
    }, 300);
  };

  const handleSectionClick = () => {
    // Placeholder for section-specific actions within the sidebar content
  };

  useEffect(() => {
    if (!isCollapsed) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentEssay(null);
        setTimeout(() => setIsTransitioning(false), 400);
      }, 300);
    }
  }, [isCollapsed]);

  const handleCloseEssay = () => {
    setCurrentEssay(null);
    // Trigger navigation back to the saved section index after a small delay
    setTimeout(() => {
      const event = new CustomEvent('essaySectionNavigate', { detail: { index: essaySectionIndex } });
      window.dispatchEvent(event);
    }, 100);
  };

  // Logo overlay timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLogoLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Mark as loaded after logo overlay completes (1200ms) to prevent transition mask conflicts
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasInitiallyLoaded(true);
    }, 1300);
    return () => clearTimeout(timer);
  }, []);

  // Show tooltip after initial load state (1200ms) for 4 seconds
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowTooltip(true);
      const hideTimer = setTimeout(() => {
        setShowTooltip(false);
      }, 4000);
      return () => clearTimeout(hideTimer);
    }, 1200);
    return () => clearTimeout(showTimer);
  }, []);

  return (
    <div className={cn(
      "relative w-full min-h-screen overflow-hidden transition-colors duration-500",
      isLightMode ? "bg-white" : "bg-black"
    )}>
      {/* Logo Overlay - Independent of sidebar/essay navigation */}
      <motion.div
        className={cn(
          "fixed inset-0 z-[9999] flex items-center justify-center transition-colors duration-500",
          isLightMode ? "bg-white" : "bg-black"
        )}
        initial={{ opacity: 1 }}
        animate={{ opacity: isLogoLoading ? 1 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{ pointerEvents: isLogoLoading ? 'auto' : 'none' }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isLogoLoading ? 1 : 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Image
            src="/ui-system/epi-logos-logo-vibes.png"
            alt="Epi-Logos"
            width={450}
            height={450}
            priority
          />
        </motion.div>
      </motion.div>

      {/* Transition Mask - Only show after initial load to avoid conflict with logo overlay */}
      {hasInitiallyLoaded && (
        <div
          className={cn(
            'fixed inset-0 z-50 pointer-events-none transition-opacity duration-300',
            isLightMode ? 'bg-white' : 'bg-black',
            isTransitioning ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {/* Sidebar (Main Content) - Expanded by default */}
      <div
        className={cn(
          'fixed top-0 left-0 h-screen z-30 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]',
          isLightMode ? 'bg-white' : 'bg-black',
          isCollapsed ? 'w-0' : 'w-full'
        )}
      >
        <div
          className={cn(
            'h-full',
            hasInitiallyLoaded && 'transition-opacity duration-300',
            isTransitioning ? 'opacity-0' : isCollapsed ? 'opacity-0' : 'opacity-100'
          )}
        >
          <SidebarContent
            onEssayClick={handleEssayClick}
            onSectionClick={handleSectionClick}
            onSectionChange={setSidebarSectionIndex}
          />
        </div>
      </div>

      {/* Right Side (Essay/Document View) - Revealed when sidebar collapses */}
      <div
        className={cn(
          'fixed top-0 right-0 h-screen transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden',
          isLightMode ? 'bg-white' : 'bg-black',
          isCollapsed ? 'w-full' : 'w-0'
        )}
      >
        {/* Persistent aurora background for essays area (all scrolled states + essay view) */}
        <div
          className={cn(
            'absolute inset-0 z-0 pointer-events-none select-none',
            hasInitiallyLoaded && 'transition-opacity duration-300',
            isTransitioning ? 'opacity-0' : !isCollapsed ? 'opacity-0' : 'opacity-100'
          )}
        >
          <AuroraBackground
            fullScreen={true}
            centered={false}
            showRadialGradient={false}
            className="w-full h-full bg-transparent"
            isLightMode={isLightMode}
          >
            <div />
          </AuroraBackground>
        </div>
        <div
          className={cn(
            'relative z-40 h-full w-full',
            hasInitiallyLoaded && 'transition-opacity duration-300',
            isTransitioning ? 'opacity-0' : !isCollapsed ? 'opacity-0' : 'opacity-100'
          )}
        >
          {currentEssay === 'prompt-packages' ? (
            <PromptPackageViewer
              onClose={handleCloseEssay}
              onExampleSelect={(exampleId) => setCurrentEssay(exampleId)}
            />
          ) : currentEssay ? (
            <EssayReader essayId={currentEssay} onClose={handleCloseEssay} />
          ) : (
            <EssayScrollingSections
              onEssaySelect={handleEssayClick}
              onSectionChange={setEssaySectionIndex}
            />
          )}
        </div>
      </div>

      {/* Essay Section Pagination Dots - Outside overflow container */}
      {isCollapsed && !currentEssay && (
        <div className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 flex space-x-2 z-50">
          {Array.from({ length: totalEssaySections }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                // Trigger scroll in the essay sections component
                const event = new CustomEvent('essaySectionNavigate', { detail: { index } });
                window.dispatchEvent(event);
              }}
              className={cn(
                'h-1 w-2 rounded-full transition-colors duration-300',
                index === essaySectionIndex
                  ? isLightMode ? 'bg-gray-800/80' : 'bg-white/80'
                  : isLightMode ? 'bg-gray-800/20 hover:bg-gray-800/40' : 'bg-white/20 hover:bg-white/40'
              )}
              aria-label={`Go to essay section ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Logo Toggle Button (hidden when viewing essays, prompt packages, or example conversations) */}
      {!currentEssay && (
        <div className="fixed bottom-0.5 right-0.5 md:bottom-1 md:right-1 z-50 group">
          <button
            onClick={handleToggle}
            className="transition-opacity duration-300 hover:opacity-80"
            aria-label="Toggle sidebar"
          >
            <img
              src="/ui-system/epi-logos-logo-vibes.png"
              alt="Epi-Logos"
              className="w-11 h-11 md:w-[58px] md:h-[58px]"
            />
          </button>

          {/* Legend - Always shows on hover, auto-shows briefly on startup - Fixed to top-right corner */}
          <div className={cn(
            "hidden md:block fixed top-9 right-4 transition-opacity duration-300 pointer-events-none",
            showTooltip ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <div className="px-6 py-4 text-xs min-w-[240px]">
              <div className="space-y-2">
                <div className="pb-2 mb-2">
                  <p className={cn(
                    "text-xs uppercase tracking-wider font-medium",
                    isLightMode ? "text-gray-500" : "text-gray-500"
                  )}>Navigation</p>
                </div>
                <div className="space-y-1.5">
                  <p className={isLightMode ? "text-gray-900" : "text-white"}>
                    <span className={cn("font-mono", isLightMode ? "text-gray-600" : "text-gray-400")}>← →</span>
                    <span className="mx-2"></span>
                    Toggle Essays
                  </p>
                  <p className={isLightMode ? "text-gray-900" : "text-white"}>
                    <span className={cn("font-mono", isLightMode ? "text-gray-600" : "text-gray-400")}>↑ ↓</span>
                    <span className="mx-2"></span>
                    Scroll Sections
                  </p>
                  <p className={isLightMode ? "text-gray-900" : "text-white"}>
                    <span className={cn("font-mono", isLightMode ? "text-gray-600" : "text-gray-400")}>L</span>
                    <span className="mx-2"></span>
                    Light Mode
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AboutPage() {
  return (
    <LightModeProvider>
      <AboutPageContent />
    </LightModeProvider>
  );
}
