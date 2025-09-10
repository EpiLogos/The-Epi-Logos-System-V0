'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useChatIntegration } from '@/hooks/useChatIntegration';
import { getSessionDisplayInfo } from '@/domains/chat';

/**
 * Simplified Chat Interface - Direct Pydantic AI
 * 
 * Refactored to use domain-driven architecture:
 * - Pure presentation layer (this component)
 * - Business logic in domain layer
 * - React orchestration via hooks
 * - Zero duplication with full chat interface
 */

export default function SimpleChatPage() {
  // UI state
  const [input, setInput] = useState('');
  
  // Chat integration hook - handles all business logic
  const chat = useChatIntegration({
    persona: 'system',
    model: '', // Will be set by useModels hook
    streamingEnabled: true,
    enableCLI: false // Simple interface doesn't need CLI commands
  });
  
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

  return (
    <div className="min-h-screen bg-black text-blue-12">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-12">
                Simple Pydantic AI Chat
              </h1>
              <p className="text-gray-400">
                Model: {chat.currentModel} • Persona: {chat.currentPersona} • Pydantic AI Direct
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/dev/orchestrator/chat"
                className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded text-sm border border-blue-600/30"
              >
                Full Chat Interface
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

      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gray-900/30 border border-gray-800 rounded-lg p-4 mb-4">
            {chat.session.messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>Start a conversation with the Pydantic AI agent</p>
                <p className="text-sm mt-2">Try: "Hello", "What is 2+2?", or "Tell me about AI"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chat.session.messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : chat.error && message.content.includes('Error')
                          ? 'bg-red-900/50 border border-red-800 text-red-300'
                          : 'bg-gray-800 border border-gray-700 text-gray-100'
                    }`}>
                      <div className="text-sm font-medium mb-1">
                        {message.role === 'user' ? 'You' : `AI (${message.metadata?.persona || chat.currentPersona})`}
                        <span className="text-xs opacity-70 ml-2">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                rows={2}
                className="flex-1 bg-gray-800 border border-gray-700 rounded p-3 text-blue-12 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={chat.isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!chat.canSend(input)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium"
              >
                {chat.isLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-12 mb-3">Controls</h3>
            
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
                      {model.name} ({model.provider}) {!model.available ? '(unavailable)' : ''}
                    </option>
                  ))}
                  {chat.availableModels.length === 0 && (
                    <option value="">Loading models...</option>
                  )}
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
                  <option value="system">System (General)</option>
                  <option value="nara">Nara (Personal Growth)</option>
                  <option value="epii">Epii (Knowledge Synthesis)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={chat.clearChat}
                  className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded text-sm text-blue-300"
                >
                  New Chat Session
                </button>
                <button
                  onClick={chat.clearChat}
                  className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded text-sm text-red-300"
                >
                  Clear Messages
                </button>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-12 mb-3">Status</h3>
            <div className="text-sm space-y-1 text-gray-400">
              <div>• Pydantic AI: ✅</div>
              <div>• Model: {chat.currentModel}</div>
              <div>• Available Models: {chat.availableModels.filter(m => m.available).length}</div>
              <div>• Messages: {sessionDisplay.messageCount}</div>
              <div>• Thread: {sessionDisplay.threadId}</div>
              <div>• Session: {sessionDisplay.sessionId}</div>
              {sessionDisplay.hasError && (
                <div>• Error: {chat.error}</div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-12 mb-3">Tips</h3>
            <div className="text-xs space-y-2 text-gray-400">
              <div>• <strong>Nara</strong>: Personal reflection, growth, emotional intelligence</div>
              <div>• <strong>Epii</strong>: Knowledge synthesis, pattern recognition, analysis</div>
              <div>• <strong>System</strong>: General assistance, balanced responses</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}