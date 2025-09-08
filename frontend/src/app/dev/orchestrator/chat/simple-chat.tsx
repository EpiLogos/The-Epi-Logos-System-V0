'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/**
 * Simplified Chat Interface - Direct Pydantic AI
 * 
 * Uses the ultra-simple Pydantic AI endpoint without CLI complexity.
 */

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  persona: string;
  model: string;
  timestamp: Date;
}

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  available: boolean;
}

export default function SimpleChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPersona, setCurrentPersona] = useState('system');
  const [currentModel, setCurrentModel] = useState('');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load available models
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const response = await fetch('/api/dev/orchestrator/models');
      const result = await response.json();
      if (result.success) {
        const models = result.models.map((m: any) => ({
          id: m.id,
          name: m.name,
          provider: m.provider,
          available: m.available
        }));
        setAvailableModels(models);
        
        // Set first available model as default
        const firstAvailable = models.find((m: ModelInfo) => m.available);
        if (firstAvailable) {
          setCurrentModel(firstAvailable.id);
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      // Set fallback to environment configured model
      const fallbackModel = { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', available: true };
      setAvailableModels([fallbackModel]);
      setCurrentModel(fallbackModel.id);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      persona: currentPersona,
      model: currentModel,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setIsLoading(true);

    try {
      // Use simple Pydantic AI endpoint
      const response = await fetch('/api/dev/orchestrator/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          persona: currentPersona,
          model: currentModel
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: result.response,
          role: 'assistant',
          persona: result.persona || currentPersona,
          model: result.model || currentModel,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Handle error
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Error: ${result.error || 'Unknown error'}`,
          role: 'assistant',
          persona: currentPersona,
          model: currentModel,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Network Error: ${error instanceof Error ? error.message : 'Failed to connect'}`,
        role: 'assistant',
        persona: currentPersona,
        model: currentModel,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
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
                Model: {currentModel} • Persona: {currentPersona} • Pydantic AI Direct
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
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>Start a conversation with the Pydantic AI agent</p>
                <p className="text-sm mt-2">Try: "Hello", "What is 2+2?", or "Tell me about AI"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : message.content.startsWith('Error') || message.content.startsWith('Network Error')
                          ? 'bg-red-900/50 border border-red-800 text-red-300'
                          : 'bg-gray-800 border border-gray-700 text-gray-100'
                    }`}>
                      <div className="text-sm font-medium mb-1">
                        {message.role === 'user' ? 'You' : `AI (${message.persona})`}
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
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium"
              >
                {isLoading ? '...' : 'Send'}
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
                  value={currentModel}
                  onChange={(e) => setCurrentModel(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-blue-12"
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id} disabled={!model.available}>
                      {model.name} ({model.provider}) {!model.available ? '(unavailable)' : ''}
                    </option>
                  ))}
                  {availableModels.length === 0 && (
                    <option value="gemini-2.5-flash">Loading models...</option>
                  )}
                </select>
              </div>

              {/* Persona Selection */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Persona</label>
                <select
                  value={currentPersona}
                  onChange={(e) => setCurrentPersona(e.target.value)}
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
                  onClick={clearChat}
                  className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded text-sm text-red-300"
                >
                  Clear Chat
                </button>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-12 mb-3">Status</h3>
            <div className="text-sm space-y-1 text-gray-400">
              <div>• Pydantic AI: ✅</div>
              <div>• Model: {currentModel}</div>
              <div>• Available Models: {availableModels.filter(m => m.available).length}</div>
              <div>• Messages: {messages.length}</div>
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