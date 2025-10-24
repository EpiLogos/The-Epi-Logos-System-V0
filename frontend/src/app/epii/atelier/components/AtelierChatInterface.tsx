/**
 * Atelier Chat Interface Component
 *
 * Full-fledged chat UI for etymological exploration
 * - Etymology Explorer header with con-scire subtitle
 * - Real-time message streaming
 * - Purple accent theme (differentiates from Archive blue)
 * - Model/persona selection
 *
 * Reuses ChatModalContent patterns with Atelier-specific styling
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/ui-system/utils/cn';
import type { UseChatIntegrationReturn } from '@/hooks/useChatIntegration';

interface AtelierChatInterfaceProps {
  chat: UseChatIntegrationReturn;
  session?: {
    title: string;
  };
}

export function AtelierChatInterface({ chat, session }: AtelierChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.session.messages]);

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
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header - Atelier context */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">
              Etymology Explorer
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Co-creative exploration with AI partnership
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={chat.currentModel}
              onChange={(e) => chat.setCurrentModel(e.target.value)}
              className={cn(
                "bg-black/40 border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded",
                "hover:border-purple-500 focus:border-purple-400 focus:outline-none transition-colors"
              )}
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
              className={cn(
                "bg-black/40 border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded",
                "hover:border-purple-500 focus:border-purple-400 focus:outline-none transition-colors"
              )}
            >
              <option value="system">System</option>
              <option value="nara">Nara</option>
              <option value="epii">Epii</option>
            </select>
          </div>
        </div>
        {session && (
          <div className="text-xs text-gray-600 font-mono">
            Session: {session.title}
          </div>
        )}
      </div>

      {/* Chat messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {chat.session.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-gray-500 text-sm mb-4">
                Begin your etymological exploration
              </div>
              <div className="text-xs text-gray-600 space-y-2">
                <p>Try exploring: "What's the etymology of 'sign'?"</p>
                <p>Or: "Build a QL community around 'sense'"</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chat.session.messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] p-3 rounded border",
                    m.role === 'user'
                      ? "bg-purple-600/20 border-purple-400/40 text-purple-100"
                      : "bg-black/40 border-gray-700 text-gray-100"
                  )}
                >
                  <div className="text-gray-500 text-[10px] mb-1.5">
                    {m.role === 'user' ? 'You' : `AI (${m.metadata?.persona || chat.currentPersona})`}
                    {m.metadata?.model && ` • ${m.metadata.model}`}
                    {m.metadata?.timing?.total_ms && (
                      <span className="ml-2">
                        • {m.metadata.timing.total_ms}ms
                        {m.metadata.timing.first_token_ms && (
                          <> • first: {m.metadata.timing.first_token_ms}ms</>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                </div>
              </div>
            ))}
            {chat.isLoading && (
              <div className="flex justify-start">
                <div className="bg-black/40 border border-gray-700 rounded p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400" />
                    <span className="text-gray-400 text-xs">
                      {chat.streamingEnabled ? 'Streaming…' : 'Processing…'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-6 py-4 border-t border-gray-800">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
            className={cn(
              "flex-1 bg-black/40 border border-gray-700 text-gray-100 placeholder-gray-600",
              "text-sm px-3 py-2 resize-none rounded",
              "focus:border-purple-500 focus:outline-none transition-colors"
            )}
            disabled={chat.isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!chat.canSend(input)}
            className={cn(
              "px-6 py-2 rounded text-sm font-medium transition-colors",
              chat.canSend(input)
                ? "bg-purple-600 text-white hover:bg-purple-500"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            )}
          >
            {chat.isLoading ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
