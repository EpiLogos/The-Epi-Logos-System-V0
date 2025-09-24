'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useChatIntegration } from '@/hooks/useChatIntegration';
import { useUnifiedAuth } from '@/auth/unified-auth-context';
import { type EpiLogosBusinessState } from '@/hooks/ui-system/useEpiLogosBusinessStates';

interface ChatModalContentProps {
  onStateChange: (state: EpiLogosBusinessState) => void;
}

export const ChatModalContent: React.FC<ChatModalContentProps> = ({ onStateChange }) => {
  const [input, setInput] = useState('');
  const { user } = useUnifiedAuth();
  const userId = (user as any)?.id || (user as any)?.sub || 'web-user';

  // Reuse existing chat integration (defaults stream on, CLI off for modal)
  const chat = useChatIntegration({
    persona: 'system',
    model: '',
    streamingEnabled: true,
    enableCLI: false,
    // Propagate real user id for correct persistence and listing
    userId
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.session.messages]);

  // Listen for thread selection events from the sidebar panel
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ threadId: string }>;
      if (ce.detail?.threadId) {
        void chat.loadThread(ce.detail.threadId);
      }
    };
    window.addEventListener('chat-select-thread', handler as EventListener);
    return () => window.removeEventListener('chat-select-thread', handler as EventListener);
  }, [chat]);

  const canSend = chat.canSend(input);
  const onSend = async () => {
    if (!canSend) return;
    await chat.sendMessage(input);
    setInput('');
  };

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="h-full flex flex-col py-6 px-4 text-white">
      {/* Back to Dashboard */}
      <div className="mb-3">
        <button
          onClick={() => onStateChange('dashboard')}
          className="flex items-center text-white/70 hover:text-white transition-colors font-mono text-sm"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-mono text-base">Chat</h2>
            <p className="text-white/70 font-sans text-xs">
              Model: {chat.currentModel || '—'} • Persona: {chat.currentPersona}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={chat.currentModel}
              onChange={(e) => chat.setCurrentModel(e.target.value)}
              className="bg-black/40 border border-white/30 text-white text-xs px-2 py-1"
            >
              {chat.availableModels.length === 0 && (
                <option value="">Loading models…</option>
              )}
              {chat.availableModels.map((m) => (
                <option key={m.id} value={m.id} disabled={!m.available}>
                  {m.name} {m.available ? '' : '(unavailable)'}
                </option>
              ))}
            </select>
            <select
              value={chat.currentPersona}
              onChange={(e) => chat.setCurrentPersona(e.target.value)}
              className="bg-black/40 border border-white/30 text-white text-xs px-2 py-1"
            >
              <option value="system">System</option>
              <option value="nara">Nara</option>
              <option value="epii">Epii</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 bg-black/30 border border-white/20 p-3 overflow-y-auto">
        {chat.session.messages.length === 0 ? (
          <div className="text-white/60 text-sm">Start a conversation…</div>
        ) : (
          <div className="space-y-3">
            {chat.session.messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2 border text-xs ${m.role === 'user' ? 'bg-blue-600/20 border-blue-400/40 text-blue-100' : 'bg-black/40 border-white/25 text-white'}`}>
                  <div className="text-white/60 mb-1">
                    {m.role === 'user' ? 'You' : `AI (${m.metadata?.persona || chat.currentPersona})`} • {m.metadata?.model || chat.currentModel || '—'}
                    {m.metadata?.timing?.total_ms && (
                      <span className="ml-2">
                        • {m.metadata.timing.total_ms}ms
                        {m.metadata.timing.first_token_ms && (
                          <> • first: {m.metadata.timing.first_token_ms}ms</>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-white">{m.content}</div>
                </div>
              </div>
            ))}
            {chat.isLoading && (
              <div className="flex justify-start">
                <div className="bg-black/40 border border-white/25 rounded p-2">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/70" />
                    <span className="text-white text-xs">{chat.streamingEnabled ? 'Streaming…' : 'Processing…'}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onEnter}
            rows={2}
            placeholder="Type your message…"
            className="flex-1 bg-black/40 border border-white/30 text-white placeholder-white/50 text-sm px-3 py-2 resize-none"
            disabled={chat.isLoading}
          />
          <button
            onClick={onSend}
            disabled={!canSend}
            className="px-4 py-2 bg-blue-600 text-white text-sm disabled:bg-white/30"
          >
            {chat.isLoading ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModalContent;
