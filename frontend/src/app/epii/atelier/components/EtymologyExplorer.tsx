/**
 * Etymology Explorer Component
 *
 * Main interface for Atelier - implements AC 8-12:
 * - AC 8: Active exploration interface for words/hunches/questions
 * - AC 9: Real-time etymology visualization with branching trees
 * - AC 10: QL community building with geometric patterns
 * - AC 11: Bimba resonance overlay
 * - AC 12: Insight capture with save/propose/suggest options
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/ui-system/utils/cn';
import type { UseChatIntegrationReturn } from '@/hooks/useChatIntegration';
import { useEtymologySession } from '@/hooks/useEtymologySession';
import { useCommunitiesForSession } from '@/hooks/useCommunitiesForSession';
import { InsightNotificationBanner } from './InsightNotificationBanner';
import { SessionStatsModal } from './SessionStatsModal';
import { NoSessionState } from './NoSessionState';
import { QLCommunityPanel } from './QLCommunityPanel';
import { ResonancePanel } from './ResonancePanel';
import { EtymologyTreePanel } from './EtymologyTreePanel';

interface EtymologyExplorerProps {
  chat: UseChatIntegrationReturn;
  activeThreadId: string | null;
  activeSessionId: string | null;  // CRITICAL: Use session_id for polling
  onCreateSession: () => void;
  onSelectSession: () => void;
  isSidebarCollapsed: boolean;
}

export function EtymologyExplorer({
  chat,
  activeThreadId,
  activeSessionId,
  onCreateSession,
  onSelectSession,
  isSidebarCollapsed
}: EtymologyExplorerProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'tree' | 'community' | 'resonance'>('chat');
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Poll session data with smart inactivity timeout
  const sessionData = useEtymologySession({
    sessionId: activeSessionId || undefined,  // Uses session_id NOT thread_id
    enabled: !!activeSessionId,
    pollingInterval: 5000,
    inactivityTimeout: 30000,  // Stop polling after 30s inactivity
    onlyPollWhenActive: activeTab === 'chat'  // Only poll when in chat tab
  });

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 EtymologyExplorer state:', {
      activeSessionId,
      activeThreadId,
      sessionExists: !!sessionData.session,
      sessionData: sessionData.session
    });
  }, [activeSessionId, activeThreadId, sessionData.session]);

  // Fetch communities for session (also uses session_id)
  const communitiesData = useCommunitiesForSession({
    sessionId: activeSessionId || undefined,  // FIX: Use session_id not thread_id
    enabled: !!activeSessionId && activeTab === 'community'
  });

  const handleTabSwitch = (tab: 'chat' | 'tree' | 'community' | 'resonance') => {
    setActiveTab(tab);
  };

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5] p-5 relative">
      {/* Header with tab navigation - hidden when no session selected */}
      {activeThreadId && (
        <div className="border-b border-[#e0e0e0] bg-white px-6 py-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[#333] mb-2">
              Etymology Explorer
            </h2>
            <p className="text-xs text-[#666]">
              Co-creative exploration with AI partnership
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeThreadId && (
              <div className="text-xs text-[#888] font-mono">
                Thread: {activeThreadId.substring(0, 8)}...
              </div>
            )}
            {/* Stats Button */}
            <button
              onClick={() => setShowStatsModal(true)}
              disabled={!sessionData.session}
              title="View session statistics"
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-all',
                'flex items-center gap-2',
                sessionData.session
                  ? 'bg-purple-100 border border-purple-400 text-purple-700 hover:bg-purple-200'
                  : 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed',
                sessionData.hasUpdates && 'animate-pulse'
              )}
            >
              <span>📊</span>
              <span>Stats</span>
            </button>
          </div>
        </div>

        {/* Feature tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              "px-3 py-1.5 text-xs rounded transition-colors",
              activeTab === 'chat'
                ? "bg-purple-100 border border-purple-400 text-purple-700"
                : "border border-[#e0e0e0] text-[#666] hover:border-purple-400"
            )}
          >
            Chat & Explore
          </button>
          <button
            onClick={() => setActiveTab('tree')}
            className={cn(
              "px-3 py-1.5 text-xs rounded transition-colors",
              activeTab === 'tree'
                ? "bg-purple-100 border border-purple-400 text-purple-700"
                : "border border-[#e0e0e0] text-[#666] hover:border-purple-400"
            )}
          >
            Etymology Tree
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={cn(
              "px-3 py-1.5 text-xs rounded transition-colors",
              activeTab === 'community'
                ? "bg-purple-100 border border-purple-400 text-purple-700"
                : "border border-[#e0e0e0] text-[#666] hover:border-purple-400"
            )}
          >
            QL Communities
          </button>
          <button
            onClick={() => setActiveTab('resonance')}
            className={cn(
              "px-3 py-1.5 text-xs rounded transition-colors",
              activeTab === 'resonance'
                ? "bg-purple-100 border border-purple-400 text-purple-700"
                : "border border-[#e0e0e0] text-[#666] hover:border-purple-400"
            )}
          >
            Bimba Resonance
          </button>
        </div>
        </div>
      )}

      {/* Insight notification banner - only when session exists */}
      {activeThreadId && (
        <InsightNotificationBanner
          session={sessionData.session}
          onViewClick={handleTabSwitch}
        />
      )}

      {/* Stats Modal - only when session exists */}
      {activeSessionId && (
        <SessionStatsModal
          session={sessionData.session}
          hasUpdates={sessionData.hasUpdates}
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          onTabSwitch={handleTabSwitch}
        />
      )}

      {/* Content area - switches based on active tab */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && !activeThreadId && (
          <NoSessionState
            onCreateSession={onCreateSession}
            onSelectSession={onSelectSession}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        )}
        {activeTab === 'chat' && activeThreadId && <ChatExplorePanel chat={chat} />}
        {activeTab === 'tree' && (
          <EtymologyTreePanel
            session={sessionData.session}
            loading={sessionData.loading}
          />
        )}
        {activeTab === 'community' && (
          <QLCommunityPanel
            session={sessionData.session}
            communities={communitiesData.communities}
            loading={communitiesData.loading}
          />
        )}
        {activeTab === 'resonance' && (
          <ResonancePanel
            session={sessionData.session}
            communities={communitiesData.communities}
            loading={communitiesData.loading}
          />
        )}
      </div>
    </div>
  );
}

/**
 * AC 8: Chat & Explore Panel
 * Active exploration interface for words, hunches, questions
 */
function ChatExplorePanel({ chat }: { chat: UseChatIntegrationReturn }) {
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!chat.canSend(input)) return;
    await chat.sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {chat.session.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-[#666] text-sm mb-4">
                Begin your etymological exploration
              </div>
              <div className="text-xs text-[#888] space-y-2">
                <p>Try: "What's the etymology of 'sign'?"</p>
                <p>Or: "Build a QL community around 'sense'"</p>
                <p>Or: "Show me PIE roots related to 'seeing'"</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {chat.session.messages
              .filter(m => m.content !== '__INIT_ETYMOLOGY_SESSION__') // Hide init trigger message
              .map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] p-4 rounded-lg border",
                    m.role === 'user'
                      ? "bg-purple-50 border-purple-300 text-purple-900"
                      : "bg-white border-[#e0e0e0] text-[#333]"
                  )}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
                </div>
              </div>
            ))}
            {chat.isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
                    <span className="text-[#666] text-xs">Exploring etymology...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-6 py-4 border-t border-[#e0e0e0] bg-white">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Enter a word, hunch, or question to explore... (Enter to send)"
            className={cn(
              "flex-1 bg-white border border-[#e0e0e0] text-[#333] placeholder-[#888]",
              "text-sm px-4 py-3 resize-none rounded-lg leading-relaxed",
              "focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400 transition-colors"
            )}
            disabled={chat.isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!chat.canSend(input)}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-colors",
              chat.canSend(input)
                ? "bg-purple-600 text-white hover:bg-purple-500"
                : "bg-gray-200 text-[#aaa] cursor-not-allowed"
            )}
          >
            {chat.isLoading ? '…' : 'Explore'}
          </button>
        </div>
      </div>
    </div>
  );
}

