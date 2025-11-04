'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/ui-system/utils/cn';
import { useSidebar } from '@/contexts/SidebarContext';
import { SidebarContent } from './components/SidebarContent';
import { EssayReader } from './components/EssayReader';
import { EssayScrollingSections } from './components/EssayScrollingSections';
import { AuroraBackground } from '@/components/ui/aurora-background';

/**
 * About / Landing Page
 *
 * Structure:
 * - Sidebar (expanded by default): Contains hero + all content sections
 * - Collapsed state: Shows essay/document view on right side
 *
 * Pattern: Two-page side-by-side where sidebar IS the main content page
 */
export default function AboutPage() {
  const { isCollapsed, toggle, collapse } = useSidebar();
  const [currentEssay, setCurrentEssay] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // ESC key listener for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const handleEssayClick = (essayId: string) => {
    setCurrentEssay(essayId);
    collapse(); // Collapse sidebar to reveal essay
  };

  const handleSectionClick = () => {
    // Placeholder for section-specific actions within the sidebar content
  };

  useEffect(() => {
    if (!isCollapsed) {
      setCurrentEssay(null);
    }
  }, [isCollapsed]);

  const handleCloseEssay = () => {
    setCurrentEssay(null);
  };

  // Show tooltip on page load for 4 seconds
  useEffect(() => {
    setShowTooltip(true);
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden">
      {/* Sidebar (Main Content) - Expanded by default */}
      <div
        className={cn(
          'fixed top-0 left-0 h-screen bg-black z-30 transition-all duration-500 ease-in-out',
          isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
        )}
      >
        <SidebarContent
          onEssayClick={handleEssayClick}
          onSectionClick={handleSectionClick}
        />
      </div>

      {/* Right Side (Essay/Document View) - Revealed when sidebar collapses */}
      <div
        className={cn(
          'fixed top-0 right-0 h-screen bg-black transition-all duration-500 ease-in-out overflow-hidden',
          isCollapsed ? 'w-full opacity-100' : 'w-0 opacity-0'
        )}
      >
        {/* Persistent aurora background for essays area (all scrolled states + essay view) */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <AuroraBackground
            fullScreen={true}
            centered={false}
            showRadialGradient={false}
            className="w-full h-full bg-transparent"
          >
            <div />
          </AuroraBackground>
        </div>
        <div className="relative z-10 h-full w-full">
          {currentEssay ? (
            <EssayReader essayId={currentEssay} onClose={handleCloseEssay} />
          ) : (
            <EssayScrollingSections onEssaySelect={handleEssayClick} />
          )}
        </div>
      </div>

      {/* Logo Toggle Button (always visible in top-right) */}
      <div className="fixed top-6 right-6 z-50 group">
        <button
          onClick={toggle}
          className="transition-opacity duration-300 hover:opacity-80"
          aria-label="Toggle sidebar"
        >
          <img
            src="/ui-system/epi-logos-logo-vibes.png"
            alt="Epi-Logos"
            className="w-[58px] h-[58px]"
          />
        </button>

        {/* Tooltip */}
        <div className={cn(
          "absolute top-full right-0 mt-3 transition-opacity duration-300 pointer-events-none",
          showTooltip || "opacity-0 group-hover:opacity-100"
        )}>
          <div className="bg-gray-900/95 border border-gray-700 rounded-sm px-4 py-3 text-xs text-gray-300 whitespace-nowrap backdrop-blur-sm">
            <div className="space-y-1.5">
              <p className="text-gray-300"><span className="text-gray-500">ESC</span> → Essays</p>
              <p className="text-gray-300"><span className="text-gray-500">Click title</span> → The Gloss</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
