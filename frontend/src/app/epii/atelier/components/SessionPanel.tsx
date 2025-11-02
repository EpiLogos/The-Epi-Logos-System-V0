/**
 * Session Panel Component
 *
 * Etymology SESSION selection and management (NOT threads)
 * Shows Etymology Sessions with titles, word counts, and activity
 */

'use client';

import React from 'react';
import { cn } from '@/ui-system/utils/cn';
import type { EtymologySession } from '@/types/etymology.types';

interface SessionPanelProps {
  sessions: EtymologySession[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<boolean>;
  onArchiveSession?: (sessionId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function SessionPanel({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onArchiveSession,
  loading,
  error
}: SessionPanelProps) {
  return (
    <div className="flex flex-col flex-1 font-mono text-gray-300 w-full">
      {/* Header */}
      <div className="grid grid-cols-3 items-center mb-6 mt-4">
        <div />
        <div className="text-sm text-center font-medium" style={{ color: '#4A1942' }}>Sessions</div>
        <div className="justify-self-end">
          <button
            className="text-xs px-3 py-1.5 border border-purple-500/50 hover:border-purple-400 text-purple-300 hover:text-purple-200 transition-colors rounded"
            onClick={() => void onNewSession()}
          >
            + New
          </button>
        </div>
      </div>

      {/* Loading/Error states */}
      {loading && <div className="text-gray-500 text-xs">Loading…</div>}
      {error && <div className="text-red-400 text-xs">{error}</div>}

      {/* Session list - contained scrollable section */}
      {!loading && sessions.length === 0 ? (
        <div className="text-gray-500 text-xs">No sessions yet. Create one to begin.</div>
      ) : (
        <div className="overflow-y-auto no-scrollbar space-y-2" style={{ maxHeight: '30vh' }}>
          {sessions.map(session => (
            <div
              key={session.session_id}
              className={cn(
                'p-3 border text-xs cursor-pointer transition-colors rounded',
                activeSessionId === session.session_id
                  ? 'border-purple-500/50 bg-purple-600/10'
                  : 'border-gray-700/50 hover:border-purple-500/50 bg-gray-900/30'
              )}
              onClick={() => onSessionSelect(session.session_id)}
            >
              <div className="flex items-center justify-between">
                <div className="truncate mr-2 font-medium" style={{ color: '#4A1942' }}>{session.title}</div>
                <div className="flex items-center gap-2">
                  {/* Archive button */}
                  {onArchiveSession && (
                    <button
                      className="text-gray-500 hover:text-purple-400 transition-colors text-sm"
                      aria-label="Archive session"
                      title="Archive session (can be restored later)"
                      onClick={(e) => {
                        e.stopPropagation();
                        const ok = confirm('Archive this session? You can restore it later.');
                        if (!ok) return;
                        void onArchiveSession(session.session_id);
                      }}
                    >
                      📦
                    </button>
                  )}
                  {/* Delete button */}
                  <button
                    className="text-gray-500 hover:text-red-400 transition-colors text-base leading-none"
                    aria-label="Delete session permanently"
                    title="Delete permanently (cannot be undone)"
                    onClick={(e) => {
                      e.stopPropagation();
                      const ok = confirm('⚠️ PERMANENTLY delete this session and all threads?\n\nThis cannot be undone!');
                      if (!ok) return;
                      void onDeleteSession(session.session_id);
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
              {/* Show word count */}
              {session.words_explored.length > 0 && (
                <div className="text-gray-500 truncate mt-1.5">
                  {session.words_explored.length} word{session.words_explored.length !== 1 ? 's' : ''} explored
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Session Info panel - full width below sessions, extends to fill remaining space */}
      <div className="flex-1 mt-6 border border-gray-700/50 rounded p-3 min-h-[300px]">
        <div className="text-xs text-gray-500 italic">
          Session details will appear here
        </div>
      </div>
    </div>
  );
}
