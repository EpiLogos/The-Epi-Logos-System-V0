'use client';

import React from 'react';
import { useThreads } from '@/hooks/useThreads';
import { useUnifiedAuth } from '@/auth/unified-auth-context';
import { cn } from '../../utils/cn';
import { useSidebar } from '@/contexts/SidebarContext';

interface ThreadHistoryPanelProps {
  className?: string;
}

export const ThreadHistoryPanel: React.FC<ThreadHistoryPanelProps> = ({ className }) => {
  const { user } = useUnifiedAuth();
  const userId = (user as any)?.id || (user as any)?.sub || 'web-user';
  const { threads, loading, error, activeThreadId, selectThread, createThread, deleteThread } = useThreads({ userId });
  const { isCollapsed } = useSidebar();

  // Instantly hide the threads section when sidebar is collapsed
  if (isCollapsed) {
    return null;
  }

  return (
    <div className={cn('threads-root flex flex-col flex-1 font-mono text-[#333] w-full', className)}>
      <div className={cn('threads-inner h-full')}>
        <div className="grid grid-cols-3 items-center mb-6">
          <div />
          <div className="text-sm text-center">Threads</div>
          <div className="justify-self-end">
            <button
              className="text-xs px-2 py-1 border border-[#0f5f5f] hover:border-[#0f5f5f]"
              onClick={() => void createThread()}
            >
              + New
            </button>
          </div>
        </div>

        {loading && <div className="text-[#666] text-xs">Loading…</div>}
        {error && <div className="text-red-600 text-xs">{error}</div>}
        {!loading && !threads.length && (
          <div className="text-[#666] text-xs">No threads yet. Create one to begin.</div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
          {threads.map(t => (
            <div
              key={t.thread_id}
              className={cn(
                'p-2 border text-xs cursor-pointer',
                'border-[#0f5f5f]',
                t.thread_id === activeThreadId ? 'border-[#0f5f5f]' : 'border-[#0f5f5f]',
                'hover:border-[#0f5f5f]'
              )}
              onClick={() => selectThread(t.thread_id)}
            >
              <div className="flex items-center justify-between">
                <div className="truncate mr-2">{t.title || 'Untitled'}</div>
                <button
                  className="text-[#666] hover:text-[#333]"
                  aria-label="Delete thread"
                  onClick={(e) => {
                    e.stopPropagation();
                    const ok = confirm('Delete this thread?');
                    if (!ok) return;
                    void deleteThread(t.thread_id);
                  }}
                >
                  ×
                </button>
              </div>
              {t.last_message && (
                <div className="text-[#666] truncate mt-1">{t.last_message}</div>
              )}
              {(t.last_activity || t.created_at) && (
                <div className="text-[#666] mt-1 text-[11px]">
                  {new Date(t.last_activity || t.created_at as string).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThreadHistoryPanel;
