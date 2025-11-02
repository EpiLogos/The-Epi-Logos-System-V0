/**
 * Session Threads Panel Component
 *
 * Shows threads/conversations for a selected Etymology Session
 * Nested view: Sessions → Threads → Chat
 */

'use client';

import React from 'react';
import { cn } from '@/ui-system/utils/cn';

export interface ThreadSummary {
  thread_id: string;
  title?: string;
  created_at: string | null;
  message_count?: number;
  latest_communities?: string[];  // NEW: Latest community names
}

/**
 * Format thread title with EA prefix, date/time, and optional summary
 * Format: [EA] Oct 29, 2:34 PM • summary
 */
function formatThreadTitle(thread: ThreadSummary): string {
  const createdAt = thread.created_at ? new Date(thread.created_at) : new Date();

  // Format date and time
  const dateStr = createdAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  const timeStr = createdAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Build title with EA prefix
  const baseTitle = `[EA] ${dateStr}, ${timeStr}`;

  // Add summary if available (and it's not the default raw title)
  if (thread.title && !thread.title.startsWith('Thread ') && thread.title !== 'Untitled' && thread.title !== 'Empty thread') {
    return `${baseTitle} • ${thread.title}`;
  }

  return baseTitle;
}

interface SessionThreadsPanelProps {
  sessionTitle: string;
  threads: ThreadSummary[];
  activeThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onBackToSessions: () => void;
  onNewThread: () => Promise<void>;
}

export function SessionThreadsPanel({
  sessionTitle,
  threads,
  activeThreadId,
  onThreadSelect,
  onBackToSessions,
  onNewThread
}: SessionThreadsPanelProps) {
  return (
    <div className="flex flex-col flex-1 font-mono text-gray-300 w-full">
      {/* Back button + Header */}
      <div className="mb-6 mt-4">
        <button
          onClick={onBackToSessions}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors mb-3 flex items-center gap-1"
        >
          ← Back to Sessions
        </button>
        <div className="text-sm mb-1 truncate font-medium" style={{ color: '#4A1942' }}>{sessionTitle}</div>
        <div className="text-xs font-medium" style={{ color: '#4A1942' }}>Threads</div>
      </div>

      {/* New Thread Button */}
      <div className="mb-4">
        <button
          className="w-full text-xs px-3 py-1.5 border border-purple-500/50 hover:border-purple-400 text-purple-300 hover:text-purple-200 transition-colors rounded"
          onClick={() => void onNewThread()}
        >
          + New Thread
        </button>
      </div>

      {/* Thread list - scrollable */}
      {threads.length === 0 ? (
        <div className="text-gray-500 text-xs">No threads yet. Create one to begin.</div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
          {threads.map(thread => (
            <div
              key={thread.thread_id}
              className={cn(
                'p-3 border text-xs cursor-pointer transition-colors rounded',
                activeThreadId === thread.thread_id
                  ? 'border-purple-500/50 bg-purple-600/10'
                  : 'border-gray-700/50 hover:border-purple-500/50 bg-gray-900/30'
              )}
              onClick={() => onThreadSelect(thread.thread_id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium truncate flex-1" style={{ color: '#4A1942' }} title={formatThreadTitle(thread)}>
                  {formatThreadTitle(thread)}
                </div>
                {/* Latest communities on the right */}
                {thread.latest_communities && thread.latest_communities.length > 0 && (
                  <div className="text-[10px] text-purple-400 font-mono shrink-0">
                    {thread.latest_communities.slice(0, 2).join(', ')}
                    {thread.latest_communities.length > 2 && ` +${thread.latest_communities.length - 2}`}
                  </div>
                )}
              </div>
              {thread.message_count !== undefined && (
                <div className="text-gray-500 mt-1.5">
                  {thread.message_count} message{thread.message_count !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
