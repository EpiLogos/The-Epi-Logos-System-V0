/**
 * Example Form Component with Error Handling
 * Demonstrates usage of FormError component and useFormError hook
 */

import React, { useState } from 'react';
import { FormError, useFormError } from '@/components/errors';
import { cn } from '@/utils/cn';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export const FormWithErrors: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const { getError, setError, clearError, clearAllErrors, hasErrors } = useFormError();

  const validateField = (fieldName: keyof FormData, value: string) => {
    switch (fieldName) {
      case 'email':
        if (!value) {
          setError('email', 'Email is required');
        } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) {
          setError('email', 'Please enter a valid email address');
        } else {
          clearError('email');
        }
        break;

      case 'password':
        if (!value) {
          setError('password', 'Password is required');
        } else if (value.length < 8) {
          setError('password', 'Password must be at least 8 characters');
        } else {
          clearError('password');
        }
        break;

      case 'confirmPassword':
        if (!value) {
          setError('confirmPassword', 'Please confirm your password');
        } else if (value !== formData.password) {
          setError('confirmPassword', 'Passwords do not match');
        } else {
          clearError('confirmPassword');
        }
        break;
    }
  };

  const handleInputChange = (fieldName: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    validateField(fieldName, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    Object.entries(formData).forEach(([fieldName, value]) => {
      validateField(fieldName as keyof FormData, value);
    });

    // Check if form is valid
    if (!hasErrors) {
      console.log('Form submitted:', formData);
      alert('Form submitted successfully!');
      
      // Clear form
      setFormData({ email: '', password: '', confirmPassword: '' });
      clearAllErrors();
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Create Account
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label 
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onBlur={() => validateField('email', formData.email)}
            aria-invalid={!!getError('email')}
            aria-describedby={getError('email') ? 'error-email' : undefined}
            className={cn(
              'w-full px-3 py-2 border rounded-md',
              'bg-white dark:bg-gray-700',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-500 dark:placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              getError('email') 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600'
            )}
            placeholder="Enter your email"
          />
          <FormError error={getError('email')} fieldName="email" />
        </div>

        {/* Password Field */}
        <div>
          <label 
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            onBlur={() => validateField('password', formData.password)}
            aria-invalid={!!getError('password')}
            aria-describedby={getError('password') ? 'error-password' : undefined}
            className={cn(
              'w-full px-3 py-2 border rounded-md',
              'bg-white dark:bg-gray-700',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-500 dark:placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              getError('password') 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600'
            )}
            placeholder="Enter your password"
          />
          <FormError error={getError('password')} fieldName="password" />
        </div>

        {/* Confirm Password Field */}
        <div>
          <label 
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            onBlur={() => validateField('confirmPassword', formData.confirmPassword)}
            aria-invalid={!!getError('confirmPassword')}
            aria-describedby={getError('confirmPassword') ? 'error-confirmPassword' : undefined}
            className={cn(
              'w-full px-3 py-2 border rounded-md',
              'bg-white dark:bg-gray-700',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-500 dark:placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              getError('confirmPassword') 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600'
            )}
            placeholder="Confirm your password"
          />
          <FormError error={getError('confirmPassword')} fieldName="confirmPassword" />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={hasErrors}
          className={cn(
            'w-full px-4 py-2 rounded-md font-medium',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'transition-colors',
            hasErrors
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          )}
        >
          Create Account
        </button>
      </form>
    </div>
  );
};