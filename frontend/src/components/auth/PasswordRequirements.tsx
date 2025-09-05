'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PasswordValidationResult, PasswordRequirements } from '@/utils/passwordValidation';

interface PasswordRequirementsProps {
  validation: PasswordValidationResult;
  requirements: PasswordRequirements;
  password: string;
  className?: string;
}

export default function PasswordRequirementsComponent({
  validation,
  requirements,
  password,
  className = ''
}: PasswordRequirementsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldHide, setShouldHide] = useState(false);

  // Handle visibility logic
  useEffect(() => {
    if (!password) {
      setIsVisible(false);
      setShouldHide(false);
      return;
    }

    if (validation.isValid && !shouldHide) {
      // Password is valid, start hide animation after a brief delay
      const timer = setTimeout(() => {
        setShouldHide(true);
        // Hide completely after animation
        setTimeout(() => setIsVisible(false), 500);
      }, 1000); // Show success state for 1 second

      return () => clearTimeout(timer);
    } else if (!validation.isValid && shouldHide) {
      // Password became invalid again, show requirements
      setShouldHide(false);
      setIsVisible(true);
    } else if (!validation.isValid) {
      // Show requirements for invalid password
      setIsVisible(true);
      setShouldHide(false);
    }
  }, [password, validation.isValid, shouldHide]);

  // Don't render if not visible
  if (!password || !isVisible) {
    return null;
  }

  const getCheckIcon = (passed: boolean) => {
    return passed ? (
      <CheckIcon className="h-4 w-4 text-green-400" />
    ) : (
      <XMarkIcon className="h-4 w-4 text-red-400" />
    );
  };

  const getTextColor = (passed: boolean) => {
    return passed ? 'text-green-400' : 'text-red-400';
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="password-requirements"
        initial={{ opacity: 0, height: 0, y: -10 }}
        animate={{
          opacity: shouldHide ? 0 : 1,
          height: shouldHide ? 0 : 'auto',
          y: shouldHide ? -20 : 0
        }}
        exit={{ opacity: 0, height: 0, y: -20 }}
        transition={{
          duration: 0.5,
          ease: "easeInOut",
          height: { duration: 0.4 }
        }}
        className={`mt-3 overflow-hidden ${className}`}
      >
        <div className="p-3 bg-black/20 rounded-lg border border-orange-300/20">
      {/* Password Strength Indicator */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-orange-200">Password Strength</span>
          <span className={`text-sm font-medium ${getTextColor(validation.isValid)}`}>
            {validation.strength.charAt(0).toUpperCase() + validation.strength.slice(1)}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              validation.strength === 'strong' ? 'bg-green-500' :
              validation.strength === 'good' ? 'bg-blue-500' :
              validation.strength === 'fair' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${validation.score}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-orange-200 mb-2">Requirements:</h4>
        
        <motion.div
          className={`flex items-center space-x-2 ${getTextColor(validation.checks.length)}`}
          animate={{ scale: validation.checks.length ? 1.02 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ scale: validation.checks.length ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {getCheckIcon(validation.checks.length)}
          </motion.div>
          <span className="text-sm">At least {requirements.minLength} characters</span>
        </motion.div>

        <motion.div
          className={`flex items-center space-x-2 ${getTextColor(validation.checks.uppercase)}`}
          animate={{ scale: validation.checks.uppercase ? 1.02 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ scale: validation.checks.uppercase ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {getCheckIcon(validation.checks.uppercase)}
          </motion.div>
          <span className="text-sm">One uppercase letter (A-Z)</span>
        </motion.div>

        <motion.div
          className={`flex items-center space-x-2 ${getTextColor(validation.checks.lowercase)}`}
          animate={{ scale: validation.checks.lowercase ? 1.02 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ scale: validation.checks.lowercase ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {getCheckIcon(validation.checks.lowercase)}
          </motion.div>
          <span className="text-sm">One lowercase letter (a-z)</span>
        </motion.div>

        <motion.div
          className={`flex items-center space-x-2 ${getTextColor(validation.checks.digit)}`}
          animate={{ scale: validation.checks.digit ? 1.02 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ scale: validation.checks.digit ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {getCheckIcon(validation.checks.digit)}
          </motion.div>
          <span className="text-sm">One number (0-9)</span>
        </motion.div>

        <motion.div
          className={`flex items-center space-x-2 ${getTextColor(validation.checks.specialChar)}`}
          animate={{ scale: validation.checks.specialChar ? 1.02 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ scale: validation.checks.specialChar ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {getCheckIcon(validation.checks.specialChar)}
          </motion.div>
          <span className="text-sm">One special character (!@#$%^&*)</span>
        </motion.div>
      </div>

        {/* Overall Status */}
        {validation.isValid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-3 pt-2 border-t border-green-400/20"
          >
            <div className="flex items-center space-x-2 text-green-400">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <CheckIcon className="h-4 w-4" />
              </motion.div>
              <span className="text-sm font-medium">Password meets all requirements!</span>
            </div>
          </motion.div>
        )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
