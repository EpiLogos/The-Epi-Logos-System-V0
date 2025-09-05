'use client';

import { motion } from 'framer-motion';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface NavbarToggleProps {
  isVisible: boolean;
  onToggle: () => void;
  position: {
    top: number;
    right: number;
  };
}

/**
 * Clean navbar toggle component
 * White arrow icon with no background or borders
 */
export function NavbarToggle({ isVisible, onToggle, position }: NavbarToggleProps) {
  return (
    <motion.button
      onClick={onToggle}
      className="fixed z-[400] w-10 h-10 flex items-center justify-center text-white transition-all"
      style={{ top: position.top, right: position.right }}
      // Default state smaller and low opacity; hover to full
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 0.75 }}
      whileHover={{ scale: 1.0, opacity: 1 }}
      whileTap={{ scale: 0.9 }}
      title={isVisible ? 'Hide Navigation (Esc)' : 'Show Navigation (Esc)'}
      transition={{ duration: 0.25 }}
    >
      {/* Use single icon and rotate to indicate state for smoothness */}
      <motion.span
        animate={{ rotate: isVisible ? 0 : 180, opacity: 0.4 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="inline-flex"
      >
        <ChevronUpIcon className="h-6 w-6" />
      </motion.span>
    </motion.button>
  );
}
