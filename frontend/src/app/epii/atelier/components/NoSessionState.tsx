/**
 * No Session State Component
 *
 * Displays when no etymology session is selected.
 * Provides options to create new session or select from history.
 * Matches Archive page styling patterns.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/ui-system/utils/cn';

interface NoSessionStateProps {
  onCreateSession: () => void;
  onSelectSession: () => void;
  isSidebarCollapsed: boolean;
  className?: string;
}

export function NoSessionState({
  onCreateSession,
  onSelectSession,
  isSidebarCollapsed,
  className
}: NoSessionStateProps) {
  return (
    <div className={cn(
      "relative h-full bg-[#f5f5f5]",
      className
    )}>
      {/* Epii Icon - positioned higher for better balance */}
      <div
        className={cn(
          "absolute transition-opacity duration-500",
          isSidebarCollapsed ? "opacity-100 delay-[300ms]" : "opacity-0"
        )}
        style={{
          top: '80px',
          left: 'calc(50% - 5px)',
          transform: 'translateX(-50%)'
        }}
      >
        <img
          src="/ui-system/epii-icon.png"
          alt="Epii"
          width={220}
          height={220}
          className="opacity-80"
        />
      </div>

      {/* Instructions - positioned higher for better balance */}
      <div
        className={cn(
          "absolute text-center max-w-md transition-opacity duration-500",
          isSidebarCollapsed ? "opacity-100 delay-[300ms]" : "opacity-0"
        )}
        style={{
          top: '360px',
          left: 'calc(50% - 5px)',
          transform: 'translateX(-50%)'
        }}
      >
        <div className="space-y-3">
          {/* Title */}
          <h3 className="text-lg font-normal tracking-[1px] text-[#333] mb-6">
            NO SESSION SELECTED
          </h3>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 mb-8">
            <button
              onClick={onCreateSession}
              className={cn(
                "px-6 py-4 rounded-lg border-2 transition-all",
                "bg-white border-purple-400 text-purple-700",
                "hover:bg-purple-50 hover:border-purple-500",
                "flex items-center justify-center gap-3 group"
              )}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-sm font-medium">Begin New Session</span>
            </button>

            <button
              onClick={onSelectSession}
              className={cn(
                "px-6 py-4 rounded-lg border-2 transition-all",
                "bg-white border-gray-300 text-gray-700",
                "hover:bg-gray-50 hover:border-gray-400",
                "flex items-center justify-center gap-3"
              )}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <span className="text-sm font-medium">Select from History</span>
            </button>
          </div>

          {/* Helper text */}
          <div className="text-xs text-[#888] leading-relaxed space-y-2">
            <p><strong className="text-gray-600">Begin New Session</strong> to start exploring words with guided onboarding</p>
            <p><strong className="text-gray-600">Select from History</strong> to continue a previous etymological exploration</p>
          </div>
        </div>
      </div>
    </div>
  );
}
