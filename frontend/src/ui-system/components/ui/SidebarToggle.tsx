'use client';

import { ChevronLeftIcon } from '@heroicons/react/24/outline';

interface SidebarToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

/**
 * Simple sidebar toggle following ConditionalNavigation pattern
 * Just the arrow rotated to left-right orientation
 */
export function SidebarToggle({ isCollapsed, onToggle }: SidebarToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="w-6 h-6 flex items-center justify-center text-gray-600 transition-all duration-200 hover:text-gray-800"
      title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
    >
      <span
        className={`inline-flex transition-transform duration-200 ease-in-out ${
          isCollapsed ? 'rotate-180' : ''
        }`}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </span>
    </button>
  );
}
