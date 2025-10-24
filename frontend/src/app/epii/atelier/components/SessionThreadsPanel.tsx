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
        <div className="text-sm text-gray-200 mb-1 truncate">{sessionTitle}</div>
        <div className="text-xs text-gray-500">Threads</div>
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
              <div className="text-gray-200 truncate" title={thread.title || `Thread ${thread.thread_id.slice(0, 8)}...`}>
                {thread.title || `Thread ${thread.thread_id.slice(0, 8)}...`}
              </div>
              {thread.message_count !== undefined && (
                <div className="text-gray-500 mt-1.5">
                  {thread.message_count} message{thread.message_count !== 1 ? 's' : ''}
                </div>
              )}
              {thread.created_at && (
                <div className="text-gray-600 mt-1.5 text-[11px]">
                  {new Date(thread.created_at).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
