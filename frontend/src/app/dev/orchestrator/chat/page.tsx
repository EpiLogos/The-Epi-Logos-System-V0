'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useChatIntegration } from '@/hooks/useChatIntegration';
import { useSession } from '@/hooks/useSession';
import { getSessionDisplayInfo } from '@/domains/chat';

/**
 * Developer Chat Interface for Orchestrator Testing
 * 
 * Refactored to use domain-driven architecture:
 * - Pure presentation layer (this component)
 * - Business logic in domain layer
 * - React orchestration via hooks
 * - Zero duplication with simple-chat
 */

export default function OrchestratorChatPage() {
  // UI state
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  
  // Chat integration hook - handles all business logic
  const chat = useChatIntegration({
    persona: 'system',
    model: 'gemini:gemini-2.5-flash',
    streamingEnabled: true,
    enableCLI: true
  });
  
  // Session management
  const sessionManager = useSession();
  
  // UI refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get session display info
  const sessionDisplay = getSessionDisplayInfo(chat.session);
  
  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.session.messages]);

  // Handle message send
  const handleSendMessage = async () => {
    if (!chat.canSend(input)) return;
    
    await chat.sendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // CLI commands for reference
  const cliCommands = [
    { cmd: '/help', desc: 'Show all available commands' },
    { cmd: '/models', desc: 'List available models' },
    { cmd: '/use <model>', desc: 'Switch to a different model' },
    { cmd: '/personas', desc: 'List available personas' },
    { cmd: '/persona <name>', desc: 'Switch to a different persona' },
    { cmd: '/status', desc: 'Show session status and diagnostics' },
    { cmd: '/sys [prompt]', desc: 'View or set system prompt override' },
    { cmd: '/stream [on|off]', desc: 'Toggle streaming mode' },
    { cmd: '/timeout <sec>', desc: 'Set streaming timeout' },
    { cmd: '/clear', desc: 'Clear conversation history' },
    { cmd: '/config', desc: 'Show current configuration' },
  ];

  return (
    <div className="min-h-screen bg-black text-blue-12">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-12">
                Orchestrator Chat Interface
              </h1>
              <p className="text-gray-400">
                Web portal for CLI testing capabilities • Model: {chat.currentModel} • Persona: {chat.currentPersona}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/dev/orchestrator/status"
                className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded text-sm border border-blue-600/30"
              >
                Status Dashboard
              </Link>
              <Link 
                href="/dev/dashboard" 
                className="px-3 py-1 bg-gray-600/20 hover:bg-gray-600/30 rounded text-sm border border-gray-600/30"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg flex flex-col h-[600px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chat.session.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600/20 border border-blue-600/30'
                          : message.role === 'system'
                          ? 'bg-yellow-600/20 border border-yellow-600/30'
                          : 'bg-gray-800/50 border border-gray-700'
                      }`}
                    >
                      <div className="text-sm text-gray-400 mb-1">
                        {message.role} • {message.metadata?.persona || 'system'} • {message.metadata?.model || chat.currentModel}
                        {message.metadata?.timing?.total_ms && (
                          <span className="ml-2">
                            • {message.metadata.timing.total_ms}ms
                            {message.metadata.timing.first_token_ms && (
                              <> • first: {message.metadata.timing.first_token_ms}ms</>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap text-blue-12">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                {chat.isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                        <span className="text-gray-400">
                          {chat.streamingEnabled ? 'Streaming...' : 'Processing...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-800 p-4">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message or CLI command (e.g., /help, /models, /status)..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-blue-12 placeholder-gray-500 resize-none"
                    rows={2}
                    disabled={chat.isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chat.canSend(input)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Quick Controls */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-12 mb-3">Quick Controls</h3>
              
              <div className="space-y-3">
                {/* Model Selection */}
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Model</label>
                  <select
                    value={chat.currentModel}
                    onChange={(e) => chat.setCurrentModel(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-blue-12"
                  >
                    {chat.availableModels.map((model) => (
                      <option key={model.id} value={model.id} disabled={!model.available}>
                        {model.name} {model.available ? '' : '(not ready)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Persona Selection */}
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Persona</label>
                  <select
                    value={chat.currentPersona}
                    onChange={(e) => chat.setCurrentPersona(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-blue-12"
                  >
                    <option value="system">System</option>
                    <option value="nara">Nara</option>
                    <option value="epii">Epii</option>
                    <option value="anuttara">Anuttara</option>
                    <option value="paramasiva">Paramasiva</option>
                    <option value="parashakti">Parashakti</option>
                    <option value="mahamaya">Mahamaya</option>
                  </select>
                </div>

                {/* Streaming Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="streaming"
                    checked={chat.streamingEnabled}
                    onChange={(e) => chat.setStreamingEnabled(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="streaming" className="text-sm text-gray-400">
                    Enable Streaming
                  </label>
                </div>
              </div>
            </div>

            {/* CLI Commands */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-blue-12">CLI Commands</h3>
                <button
                  onClick={() => setShowCommands(!showCommands)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {showCommands ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showCommands && (
                <div className="space-y-2 text-xs">
                  {cliCommands.map((cmd) => (
                    <div key={cmd.cmd} className="border-l-2 border-gray-700 pl-2">
                      <div className="font-mono text-blue-400">{cmd.cmd}</div>
                      <div className="text-gray-500">{cmd.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session Info */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-12 mb-3">Session Status</h3>
              <div className="space-y-1 text-xs">
                <div><span className="text-gray-400">Messages:</span> {sessionDisplay.messageCount}</div>
                <div><span className="text-gray-400">Thread:</span> {sessionDisplay.threadId}</div>
                <div><span className="text-gray-400">Session:</span> {sessionDisplay.sessionId}</div>
                <div><span className="text-gray-400">Streaming:</span> {sessionDisplay.streamingEnabled ? 'On' : 'Off'}</div>
                <div><span className="text-gray-400">Loading:</span> {sessionDisplay.isLoading ? 'Yes' : 'No'}</div>
                {sessionDisplay.hasError && (
                  <div><span className="text-red-400">Error:</span> {chat.error}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}