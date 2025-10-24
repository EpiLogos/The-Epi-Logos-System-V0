/**
 * Insight Notification Banner Component
 *
 * Toast-style notifications for background process completions.
 * Appears when communities created, resonances found, or MEF analyses complete.
 * Click actions switch to relevant tabs.
 *
 * Story 08.07 Enhancement - Frontend Observability
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/ui-system/utils/cn';
import type { EtymologySession } from '@/types/etymology.types';

export interface SessionUpdateNotification {
  type: 'community' | 'resonance' | 'word' | 'pie_root';
  count: number;
  message: string;
}

interface InsightNotificationBannerProps {
  session: EtymologySession | null;
  onViewClick: (tab: 'chat' | 'tree' | 'community' | 'resonance') => void;
}

export function InsightNotificationBanner({ session, onViewClick }: InsightNotificationBannerProps) {
  const [notification, setNotification] = useState<SessionUpdateNotification | null>(null);
  const prevSessionRef = useRef<EtymologySession | null>(null);

  // Detect updates and show notifications
  useEffect(() => {
    if (!session || !prevSessionRef.current) {
      prevSessionRef.current = session;
      return;
    }

    const prev = prevSessionRef.current;
    const notifications: SessionUpdateNotification[] = [];

    // Check for new communities
    const newCommunities = session.communities_created.length - prev.communities_created.length;
    if (newCommunities > 0) {
      notifications.push({
        type: 'community',
        count: newCommunities,
        message: `${newCommunities} new ${newCommunities === 1 ? 'community' : 'communities'} created!`
      });
    }

    // Check for new resonances
    const newResonances = session.resonances_found.length - prev.resonances_found.length;
    if (newResonances > 0) {
      notifications.push({
        type: 'resonance',
        count: newResonances,
        message: `${newResonances} new Bimba ${newResonances === 1 ? 'resonance' : 'resonances'} found!`
      });
    }

    // Check for new PIE roots
    const newRoots = session.pie_roots_discovered.length - prev.pie_roots_discovered.length;
    if (newRoots > 0) {
      notifications.push({
        type: 'pie_root',
        count: newRoots,
        message: `${newRoots} new PIE ${newRoots === 1 ? 'root' : 'roots'} discovered!`
      });
    }

    // Show first notification (prioritize communities > resonances > roots)
    if (notifications.length > 0) {
      setNotification(notifications[0]);
    }

    prevSessionRef.current = session;
  }, [session]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (notification) {
      const timeout = setTimeout(() => {
        setNotification(null);
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [notification]);

  if (!notification) return null;

  const handleViewClick = () => {
    const tabMap: Record<SessionUpdateNotification['type'], 'chat' | 'tree' | 'community' | 'resonance'> = {
      community: 'community',
      resonance: 'resonance',
      word: 'tree',
      pie_root: 'tree'
    };
    onViewClick(tabMap[notification.type]);
    setNotification(null);
  };

  const handleDismiss = () => {
    setNotification(null);
  };

  const iconMap = {
    community: '⬡',
    resonance: '✨',
    word: '🔤',
    pie_root: '🌳'
  };

  return (
    <div
      className={cn(
        'absolute top-4 left-1/2 -translate-x-1/2 z-50',
        'bg-purple-600/95 backdrop-blur-sm border border-purple-400/50 rounded-lg shadow-xl',
        'px-5 py-3 flex items-center gap-4',
        'animate-in fade-in slide-in-from-top-2 duration-300'
      )}
    >
      {/* Icon */}
      <div className="text-2xl">{iconMap[notification.type]}</div>

      {/* Message */}
      <div className="flex-1">
        <div className="text-sm font-medium text-white">
          {notification.message}
        </div>
        <div className="text-xs text-purple-100 mt-0.5">
          Background analysis complete
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleViewClick}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded',
            'bg-white/20 hover:bg-white/30 text-white',
            'transition-colors border border-white/20'
          )}
        >
          View
        </button>
        <button
          onClick={handleDismiss}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded',
            'hover:bg-white/10 text-white/60 hover:text-white transition-colors'
          )}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
