/**
 * Form Validation Error Component (Story 01.04a)
 * Displays inline error messages below form fields with accessibility support
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { AccessibleIcon } from '@radix-ui/react-accessible-icon';
import { cn } from '@/utils/cn';
import type { FormErrorProps } from '@/types/errors';

export const FormError: React.FC<FormErrorProps> = ({
  error,
  fieldName,
  className
}) => {
  if (!error) {
    return null;
  }

  const errorId = `error-${fieldName}`;
  
  return (
    <div
      id={errorId}
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-1',
        className
      )}
    >
      <AccessibleIcon label="Error">
        <AlertTriangle className="h-4 w-4 shrink-0" />
      </AccessibleIcon>
      <span>{error.message}</span>
    </div>
  );
};

FormError.displayName = 'FormError';

export default FormError;