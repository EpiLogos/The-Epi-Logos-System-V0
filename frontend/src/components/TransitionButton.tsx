"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useTransition } from '../contexts/TransitionContext';

interface TransitionButtonProps {
  className?: string;
}

export function TransitionButton({ className = "" }: TransitionButtonProps) {
  const { state, startTransition } = useTransition();

  const handleClick = () => {
    console.log('Button clicked, current state:', state);
    if (state.phase === 'idle') {
      console.log('Starting transition...');
      startTransition();
    }
  };

  if (state.isTransitioning || state.phase === 'complete') {
    return null;
  }

  return (
    <motion.button
      onClick={handleClick}
      className={`
        fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50
        px-8 py-4 rounded-full
        bg-gradient-to-r from-blue-600 to-purple-600
        text-white font-bold text-xl
        shadow-2xl hover:shadow-xl
        transition-all duration-300
        hover:scale-105 active:scale-95
        backdrop-blur-sm
        border-2 border-white/30
        ${className}
      `}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{
        boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)",
        y: -2,
      }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="flex items-center space-x-2">
        <span>Enter Experience</span>
        <motion.span
          animate={{ x: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: [0.4, 0, 0.6, 1] }}
        >
          →
        </motion.span>
      </span>
    </motion.button>
  );
}
