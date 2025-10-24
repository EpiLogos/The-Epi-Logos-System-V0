/**
 * Epii Atelier Page (#5-5)
 *
 * Etymological Archaeology - Creative Modality
 * Story 08.08: Epii Etymological Atelier Interface
 *
 * Features:
 * - Dual-panel layout: Exploration dashboard (left) + Chat interface (right)
 * - 3-box non-linear grid for exploration tracking
 * - Session management with chat thread integration
 * - Real-time AI partnership for etymological discovery
 */

'use client';

import React from 'react';
import { cn } from '@/ui-system/utils/cn';
import { Sidebar } from '@/ui-system/components/ui/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/auth/hooks/useAuth';
import { useChatIntegration } from '@/hooks/useChatIntegration';
import { useEtymologyThreads } from '@/hooks/useEtymologyThreads';
import { useSessionThreads } from '@/hooks/useSessionThreads';

import { AtelierHeader } from './components/AtelierHeader';
import { SessionPanel } from './components/SessionPanel';
import { SessionThreadsPanel } from './components/SessionThreadsPanel';
import { EtymologyExplorer } from './components/EtymologyExplorer';
import { useEtymologySessionsList } from '@/hooks/useEtymologySessionsList';

/**
 * Page coordinate metadata: #5-5 (Epii Atelier - Creative modality)
 */
export default function EpiiAtelier() {
  const { isCollapsed, toggle } = useSidebar();
  const { user } = useAuth();
  const userId = (user as any)?.id || (user as any)?.sub || 'web-user';
  const [expandedSessionId, setExpandedSessionId] = React.useState<string | null>(null);
  const isCreatingRef = React.useRef(false); // Use ref for better debouncing

  // Use etymology sessions list for sidebar (NOT threads)
  const sessions = useEtymologySessionsList({ userId });

  // Use threads for chat binding (threads are linked to sessions)
  const threads = useEtymologyThreads({ userId });

  // Fetch thread metadata for expanded session (NEW: uses Etymology-aware endpoint)
  const sessionThreads = useSessionThreads({
    sessionId: expandedSessionId,
    enabled: !!expandedSessionId
  });

  // Chat integration
  const chat = useChatIntegration({
    persona: 'epii',
    model: 'gemini-2.0-flash-exp',
    streamingEnabled: true,
    enableCLI: false,
    userId
  });

  // Handler for creating new session
  const handleCreateSession = async () => {
    // Critical debounce check using ref (survives re-renders)
    if (isCreatingRef.current) {
      console.warn('⚠️ Session creation already in progress, ignoring duplicate call');
      return;
    }

    isCreatingRef.current = true;
    console.log('🔄 Starting session creation...');

    try {
      const threadId = await threads.createThread(); // Creates session + thread
      if (threadId) {
        console.log('✅ Session/thread created:', threadId);
        const sessionId = threads.currentSessionId;

        threads.selectThread(threadId); // Activate the new thread

        // CRITICAL: Reload sessions immediately and select the new one
        await sessions.loadSessions();
        if (sessionId) {
          sessions.selectSession(sessionId);
          console.log('✅ Selected new session:', sessionId);
        }

        // Send onboarding message through backend to persist to database
        await chat.sendMessage('__INIT_ETYMOLOGY_SESSION__');
      } else {
        console.error('❌ Session creation returned null thread ID');
      }
    } catch (error) {
      console.error('❌ Error in handleCreateSession:', error);
    } finally {
      // Reset debounce flag after short delay
      setTimeout(() => {
        isCreatingRef.current = false;
        console.log('✓ Session creation debounce reset');
      }, 1000);
    }
  };

  // Handler for expanding session to show threads
  const handleExpandSession = async (sessionId: string) => {
    sessions.selectSession(sessionId);

    // Get the session's threads
    const session = sessions.sessions.find(s => s.session_id === sessionId);
    if (session && session.thread_ids.length > 0) {
      // Auto-load most recent thread (last in array)
      const mostRecentThreadId = session.thread_ids[session.thread_ids.length - 1];

      console.log('📖 Auto-loading most recent thread:', mostRecentThreadId);
      await chat.loadThread(mostRecentThreadId);
      threads.selectThread(mostRecentThreadId);
    }

    // Always show threads panel (don't auto-collapse)
    setExpandedSessionId(sessionId);
  };

  // Handler for going back to sessions list
  const handleBackToSessions = () => {
    setExpandedSessionId(null);
  };

  // Handler for selecting thread from expanded session
  const handleSelectThread = async (threadId: string) => {
    // Load thread messages
    await chat.loadThread(threadId);

    // Set thread as active for UI
    threads.selectThread(threadId);

    // Collapse sidebar to show chat
    if (!isCollapsed) {
      toggle();
    }
  };

  // Handler for creating new thread in existing session
  const handleNewThreadInSession = async () => {
    if (!expandedSessionId || isCreatingRef.current) return;
    isCreatingRef.current = true;

    try {
      const threadId = await threads.createThread();
      if (threadId) {
        await handleSelectThread(threadId);
      }
    } finally {
      setTimeout(() => {
        isCreatingRef.current = false;
      }, 1000);
    }
  };

  // Handler for opening sidebar to session history
  const handleOpenSessionHistory = () => {
    if (isCollapsed) {
      toggle(); // Open sidebar to show session history
    }
  };

  // Wrapper for delete that also clears expanded state
  const handleDeleteSession = async (sessionId: string): Promise<boolean> => {
    // If deleting the expanded session, collapse back to sessions list
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
    }

    // Delegate to hook's delete function
    return await sessions.deleteSession(sessionId);
  };

  return (
    <div className="fixed inset-0 flex bg-white">
      {/* Sidebar with exploration dashboard */}
      <Sidebar
        variant="epi-logos"
        isModalExpanded={false}
        className="flex-shrink-0"
      >
        <div className="relative h-full flex flex-col px-4">
          {/* Header */}
          <AtelierHeader />

          {/* Conditional rendering: Sessions list OR Threads list */}
          {!expandedSessionId ? (
            // Session panel - shows Etymology Sessions
            <SessionPanel
              sessions={sessions.sessions}
              activeSessionId={sessions.activeSessionId}
              onSessionSelect={handleExpandSession}
              onNewSession={handleCreateSession}
              onDeleteSession={handleDeleteSession}
              loading={sessions.loading}
              error={sessions.error}
            />
          ) : (
            // Threads panel - shows threads for expanded session with proper metadata
            <SessionThreadsPanel
              sessionTitle={
                sessions.sessions.find(s => s.session_id === expandedSessionId)?.title || 'Session'
              }
              threads={sessionThreads.threads}
              activeThreadId={threads.activeThreadId}
              onThreadSelect={handleSelectThread}
              onBackToSessions={handleBackToSessions}
              onNewThread={handleNewThreadInSession}
            />
          )}
        </div>
      </Sidebar>

      {/* Main content area with etymology explorer */}
      <div className="flex-1 overflow-hidden">
        <EtymologyExplorer
          chat={chat}
          activeThreadId={threads.activeThreadId}
          activeSessionId={threads.currentSessionId}
          onCreateSession={handleCreateSession}
          onSelectSession={handleOpenSessionHistory}
          isSidebarCollapsed={isCollapsed}
        />
      </div>
    </div>
  );
}
