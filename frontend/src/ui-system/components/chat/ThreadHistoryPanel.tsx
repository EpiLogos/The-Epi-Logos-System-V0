'use client';

import React from 'react';
import { useThreads } from '@/hooks/useThreads';
import { useUnifiedAuth } from '@/auth/unified-auth-context';
import { cn } from '../../utils/cn';

interface ThreadHistoryPanelProps {
  className?: string;
}

export const ThreadHistoryPanel: React.FC<ThreadHistoryPanelProps> = ({ className }) => {
  const { user } = useUnifiedAuth();
  const userId = (user as any)?.id || (user as any)?.sub || 'web-user';
  const { threads, loading, error, activeThreadId, selectThread, createThread, deleteThread } = useThreads({ userId });

  return (
    <div className={cn('bg-black/30 border border-white/20 p-3 text-white', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-sm">Threads</div>
        <button
          className="text-xs px-2 py-1 border border-white/40 hover:border-white"
          onClick={() => void createThread()}
        >
          + New
        </button>
      </div>

      {loading && <div className="text-white/70 text-xs">Loading…</div>}
      {error && <div className="text-red-400 text-xs">{error}</div>}
      {!loading && !threads.length && (
        <div className="text-white/60 text-xs">No threads yet. Create one to begin.</div>
      )}

      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
        {threads.map(t => (
          <div
            key={t.thread_id}
            className={cn(
              'p-2 border text-xs cursor-pointer',
              t.thread_id === activeThreadId ? 'bg-white/5 border-white/40' : 'bg-black/40 border-white/20'
            )}
            onClick={() => selectThread(t.thread_id)}
          >
            <div className="flex items-center justify-between">
              <div className="font-mono truncate mr-2">{t.title || 'Untitled'}</div>
              <button
                className="text-white/60 hover:text-white"
                aria-label="Delete thread"
                onClick={(e) => { e.stopPropagation(); void deleteThread(t.thread_id); }}
              >
                ×
              </button>
            </div>
            {t.last_message && (
              <div className="text-white/60 truncate mt-1">{t.last_message}</div>
            )}
            {(t.last_activity || t.created_at) && (
              <div className="text-white/50 mt-1">
                {new Date(t.last_activity || t.created_at as string).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThreadHistoryPanel;

