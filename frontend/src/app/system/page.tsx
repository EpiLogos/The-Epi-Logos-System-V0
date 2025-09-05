"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { WorkingThreeScene } from '@/components/system/WorkingThreeScene';
import { Squares } from '@/components/Squares';
import { motion, AnimatePresence } from 'framer-motion';
import EpiiNavigation from '@/components/system/EpiiNavigation';
import { NavigationErrorBoundary } from '@/components/ErrorBoundary';

// Loading component for Three.js scene using correct Squares animation
function SceneLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-slate-600 flex items-center justify-center">
      <div className="text-white text-center space-y-6">
        <Squares size={120} className="mx-auto" />
        <div className="space-y-2">
          <p className="text-lg">Loading System Experience...</p>
          <p className="text-sm text-gray-400">Preparing visualization</p>
        </div>
      </div>
    </div>
  );
}

// Theme selector modal component (unchanged)
function ThemeSelector({ isOpen, onClose, currentTheme, onThemeChange }: {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}) {
  const themes = [
    {
      id: 'light',
      name: 'Light Theme',
      description: 'Soft grey gradient',
      preview: 'border-gray-300',
      colors: ['bg-zinc-200', 'bg-zinc-300', 'bg-zinc-400']
    },
    {
      id: 'dark',
      name: 'Dark Theme',
      description: 'Standard dark appearance',
      preview: 'bg-gray-900 border-gray-700',
      colors: ['bg-gray-900', 'bg-gray-800', 'bg-gray-700']
    },
    {
      id: 'dark-theme',
      name: 'Custom Dark',
      description: 'Midnight eggplant → teal',
      preview: 'border-purple-700',
      colors: ['bg-[#2b103a]', 'bg-[#3a1a4f]', 'bg-[#3fb9a8]'],
      style: { background: 'linear-gradient(135deg, #2b103a 0%, #3fb9a8 100%)' }
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 flex items-center justify-center z-[101] p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            <div className="bg-blue-2/95 backdrop-blur-md border border-blue-6 rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-blue-12">Theme Selector</h3>
                <button
                  onClick={onClose}
                  className="text-blue-11 hover:text-blue-12 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {themes.map((theme) => (
                  <motion.button
                    key={theme.id}
                    onClick={() => onThemeChange(theme.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      currentTheme === theme.id
                        ? 'border-blue-9 bg-blue-9/10'
                        : 'border-blue-6 hover:border-blue-7'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-12 h-12 rounded-lg border-2 ${theme.preview} flex items-center justify-center`}
                        style={theme.style}
                      >
                        <div className="flex space-x-1">
                          {theme.colors.map((color, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${color}`} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-blue-12 font-medium">{theme.name}</h4>
                        <p className="text-blue-11 text-sm">{theme.description}</p>
                      </div>
                      {currentTheme === theme.id && (
                        <div className="ml-auto">
                          <div className="w-2 h-2 bg-blue-9 rounded-full" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-blue-6">
                <p className="text-xs text-blue-11 text-center">
                  Theme changes apply immediately to the system interface
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function SystemPage() {
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  // ANIMATION LOADED: Navbar only appears after "Enter Experience" button click
  const [showNavbar, setShowNavbar] = useState(false);

  useEffect(() => {
    const body = document.body;
    body.classList.remove('light', 'dark', 'dark-theme');
    if (currentTheme !== 'light') body.classList.add(currentTheme);
    return () => body.classList.remove('light', 'dark', 'dark-theme');
  }, [currentTheme]);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    setIsThemeSelectorOpen(false);
  };

  // ANIMATION LOADED: Handle navbar animation when entering experience
  const handleEnterExperience = () => {
    setTimeout(() => {
      setShowNavbar(true);
    }, 1000); // 1-second delay for smoother transition
  };

  return (
    <motion.div
      className={`min-h-screen ${
        currentTheme === 'light'
          ? 'bg-gradient-to-b from-zinc-200 to-zinc-400'
          : currentTheme === 'dark-theme'
          ? 'bg-gradient-to-b from-[#2b103a] to-[#3fb9a8]'
          : 'bg-gradient-to-b from-black to-slate-600'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.6, 1] }}
    >
      {/* ANIMATION LOADED: Navbar animates in after Enter Experience button click */}
      <AnimatePresence>
        {showNavbar && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-[300]"
          >
            <NavigationErrorBoundary>
              <EpiiNavigation />
            </NavigationErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative h-screen">
        <Suspense fallback={<SceneLoader />}>
          <WorkingThreeScene
            theme={currentTheme as 'light' | 'dark' | 'dark-theme'}
            onEnterExperience={handleEnterExperience}
          />
        </Suspense>
      </div>

      <motion.div
        className="fixed top-20 left-8 z-[200]"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 2, duration: 0.6 }}
      >
        <motion.button
          onClick={() => setIsThemeSelectorOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-2/80 hover:bg-blue-3/80 border border-blue-6 rounded-lg text-blue-11 text-sm transition-colors backdrop-blur-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
          </svg>
          <span>Themes</span>
        </motion.button>
      </motion.div>

      <ThemeSelector
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
    </motion.div>
  );
}

