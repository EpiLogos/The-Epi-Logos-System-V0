'use client';

import React, { useState } from 'react';
import { cn } from '@/ui-system/utils/cn';
import { useSidebar } from '@/contexts/SidebarContext';
import { SidebarContent } from './components/SidebarContent';
import { EssayView } from './components/EssayView';

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
  const { isCollapsed, toggle, collapse, expand } = useSidebar();
  const [currentEssay, setCurrentEssay] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<string | null>(null);

  const handleEssayClick = (essayId: string) => {
    setCurrentEssay(essayId);
    collapse(); // Collapse sidebar to reveal essay
  };

  const handleSectionClick = (sectionId: string) => {
    setCurrentSection(sectionId);
    // Handle section-specific actions (e.g., show contact form, FAQ)
  };

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden">
      {/* Sidebar (Main Content) - Expanded by default */}
      <div
        className={cn(
          'fixed top-0 left-0 h-screen bg-black z-30 transition-all duration-500 ease-in-out overflow-y-auto',
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
          'fixed top-0 right-0 h-screen bg-black transition-all duration-500 ease-in-out overflow-y-auto',
          isCollapsed ? 'w-full opacity-100' : 'w-0 opacity-0'
        )}
      >
        <EssayView essayId={currentEssay} />
      </div>

      {/* Toggle Button (always visible) */}
      <button
        onClick={toggle}
        className={cn(
          'fixed z-50 transition-all duration-300',
          isCollapsed ? 'top-8 left-8' : 'top-8 right-8'
        )}
      >
        <div className="w-10 h-10 border border-gray-700 bg-black flex items-center justify-center hover:border-white transition-colors">
          <span className="text-white text-[10px]">
            {isCollapsed ? '☰' : '✕'}
          </span>
        </div>
      </button>
    </div>
  );
}
