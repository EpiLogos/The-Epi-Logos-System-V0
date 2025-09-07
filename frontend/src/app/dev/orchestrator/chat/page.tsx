'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/**
 * Developer Chat Interface for Orchestrator Testing
 * 
 * This component provides web access to the comprehensive CLI functionality
 * built in agentic/cli/chat_cli.py, including:
 * - All 15+ CLI commands (/help, /models, /use, /personas, /persona, etc.)
 * - Real-time AG-UI Protocol streaming
 * - Session management and diagnostics
 * - Advanced debugging and monitoring
 */

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  persona: string;
  model: string;
  timestamp: Date;
  diagnostics?: {
    trace_id: string;
    first_token_ms?: number;
    total_ms?: number;
    sse_events: number;
    sse_bytes: number;
  };
}

interface SessionStatus {
  session_id: string;
  model_name: string;
  active_persona: string;
  system_hash: string;
  streaming_enabled: boolean;
  stream_timeout: number;
}

interface ModelInfo {
  name: string;
  provider: string;
  ready: boolean;
}

export default function OrchestratorChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState('gemini:gemini-2.5-flash');
  const [currentPersona, setCurrentPersona] = useState('system');
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [personas, setPersonas] = useState<string[]>([]);
  const [showCommands, setShowCommands] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load initial data
    loadModels();
    loadPersonas();
    loadSessionStatus();
  }, []);

  const loadModels = async () => {
    try {
      const response = await fetch('/api/dev/orchestrator/cli-bridge?command=models');
      const result = await response.json();
      if (result.success) {
        setModels(result.data.models || []);
        setCurrentModel(result.data.current_model || result.data.default_model);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const loadPersonas = async () => {
    try {
      const response = await fetch('/api/dev/orchestrator/cli-bridge?command=personas');
      const result = await response.json();
      if (result.success) {
        setPersonas(result.data.personas || []);
        setCurrentPersona(result.data.current_persona || 'system');
      }
    } catch (error) {
      console.error('Failed to load personas:', error);
    }
  };

  const loadSessionStatus = async () => {
    try {
      const response = await fetch('/api/dev/orchestrator/cli-bridge?command=status');
      const result = await response.json();
      if (result.success) {
        setSessionStatus(result.data);
        setStreamingEnabled(result.data.streaming_enabled ?? true);
      }
    } catch (error) {
      console.error('Failed to load session status:', error);
    }
  };

  const executeCommand = async (commandLine: string) => {
    try {
      // Parse command and arguments
      const parts = commandLine.split(' ');
      const command = parts[0];
      const args = parts.slice(1);
      
      const response = await fetch('/api/dev/orchestrator/cli-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, args })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Format the command result based on command type
        let content = '';
        
        switch (command) {
          case 'models':
            if (result.data.models) {
              content = `Available Models:\n${result.data.models.map((m: ModelInfo) => 
                `${m.name} (${m.provider}) - ${m.ready ? 'Ready' : 'Not Ready'}`
              ).join('\n')}\n\nDefault: ${result.data.default_model}\nCurrent: ${result.data.current_model}`;
              setModels(result.data.models);
              setCurrentModel(result.data.current_model || result.data.default_model);
            }
            break;
            
          case 'personas':
            if (result.data.personas) {
              content = `Available Personas:\n${result.data.personas.join('\n')}\n\nCurrent: ${result.data.current_persona}`;
              setPersonas(result.data.personas);
              setCurrentPersona(result.data.current_persona);
            }
            break;
            
          case 'status':
            content = `Session Status:\n${Object.entries(result.data).map(([key, value]) => 
              `${key}: ${value}`
            ).join('\n')}`;
            setSessionStatus(result.data);
            break;
            
          case 'doctor':
            content = `Orchestrator Diagnostics:\n${Object.entries(result.data).map(([key, value]) => 
              `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
            ).join('\n')}`;
            break;
            
          case 'persona_models':
            if (result.data.assignments && result.data.validation) {
              content = `Persona Model Assignments:\n${Object.entries(result.data.assignments).map(([persona, model]) => 
                `${persona}: ${model} ${result.data.validation[persona] ? '✅' : '❌'}`
              ).join('\n')}`;
            }
            break;
            
          case 'use':
            if (args.length > 0) {
              content = `Switched to model: ${args[0]}`;
              setCurrentModel(args[0]);
              await loadSessionStatus(); // Refresh session status
            } else {
              content = 'Usage: /use <model>';
            }
            break;
            
          case 'persona':
            if (args.length > 0) {
              content = `Switched to persona: ${args[0]}`;
              setCurrentPersona(args[0]);
              await loadSessionStatus(); // Refresh session status
            } else {
              content = 'Usage: /persona <name>';
            }
            break;
            
          case 'stream':
            if (args.length > 0) {
              const enabled = args[0].toLowerCase() === 'on';
              setStreamingEnabled(enabled);
              content = `Streaming turned ${enabled ? 'on' : 'off'}`;
            } else {
              content = `Streaming is currently ${streamingEnabled ? 'on' : 'off'}`;
            }
            break;
            
          case 'clear':
            setMessages([]);
            content = 'Conversation cleared';
            break;
            
          case 'help':
            content = `Available CLI Commands:
/help - Show this help
/models - List available models
/use <model> - Switch to a different model
/personas - List available personas  
/persona <name> - Switch to a different persona
/status - Show session status and diagnostics
/sys [prompt] - View or set system prompt override
/stream [on|off] - Toggle streaming mode
/timeout <sec> - Set streaming timeout
/clear - Clear conversation history
/config - Show current configuration
/doctor - Run system diagnostics
/persona_models - Show persona model assignments
/persona_model <persona> <model> - Set persona model`;
            break;
            
          default:
            content = result.data.output || `Command executed: ${command}`;
            break;
        }
        
        // Add system message with formatted result
        const systemMessage: Message = {
          id: Date.now().toString(),
          content,
          role: 'system',
          persona: 'system',
          model: currentModel,
          timestamp: new Date(),
          diagnostics: result.diagnostics
        };
        
        setMessages(prev => [...prev, systemMessage]);
        
      } else {
        // Add error message
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: `Command failed: ${result.error}`,
          role: 'system',
          persona: 'system',
          model: currentModel,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Command execution error:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `Command error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        role: 'system',
        persona: 'system',
        model: currentModel,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
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
    setInput('');
    setIsLoading(true);

    // Check if this is a CLI command
    if (input.startsWith('/')) {
      const commandLine = input.slice(1); // Remove the leading slash
      await executeCommand(commandLine);
      setIsLoading(false);
      return;
    }

    try {
      if (streamingEnabled) {
        // Use streaming endpoint
        const response = await fetch('/api/dev/orchestrator/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: input,
            persona: currentPersona,
            model: currentModel
          })
        });

        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          
          let assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: '',
            role: 'assistant',
            persona: currentPersona,
            model: currentModel,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, assistantMessage]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.final) {
                    // Update final diagnostics
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { ...msg, diagnostics: data.diagnostics }
                        : msg
                    ));
                  } else {
                    // Append content
                    assistantMessage.content += data.content;
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { ...msg, content: assistantMessage.content, diagnostics: data.diagnostics }
                        : msg
                    ));
                  }
                } catch (e) {
                  console.error('Failed to parse streaming data:', e);
                }
              }
            }
          }
        }
      } else {
        // Non-streaming response (mock for now)
        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Mock response from ${currentPersona} using ${currentModel}: "${userMessage.content}"`,
            role: 'assistant',
            persona: currentPersona,
            model: currentModel,
            timestamp: new Date(),
            diagnostics: {
              trace_id: `trace-${Date.now()}`,
              total_ms: 500,
              sse_events: 0,
              sse_bytes: 0
            }
          };
          setMessages(prev => [...prev, assistantMessage]);
        }, 500);
      }
    } catch (error) {
      console.error('Send message error:', error);
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
                Web portal for CLI testing capabilities • Model: {currentModel} • Persona: {currentPersona}
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
                {messages.map((message) => (
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
                        {message.role} • {message.persona} • {message.model}
                        {message.diagnostics && (
                          <span className="ml-2">
                            • {message.diagnostics.total_ms}ms
                            {message.diagnostics.first_token_ms && (
                              <> • first: {message.diagnostics.first_token_ms}ms</>
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
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                        <span className="text-gray-400">
                          {streamingEnabled ? 'Streaming...' : 'Processing...'}
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
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
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
                    value={currentModel}
                    onChange={(e) => setCurrentModel(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-blue-12"
                  >
                    {models.map((model) => (
                      <option key={model.name} value={model.name} disabled={!model.ready}>
                        {model.name} {model.ready ? '' : '(not ready)'}
                      </option>
                    ))}
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
                    {personas.map((persona) => (
                      <option key={persona} value={persona}>
                        {persona}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Streaming Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="streaming"
                    checked={streamingEnabled}
                    onChange={(e) => setStreamingEnabled(e.target.checked)}
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
            {sessionStatus && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-12 mb-3">Session Status</h3>
                <div className="space-y-1 text-xs">
                  <div><span className="text-gray-400">ID:</span> {sessionStatus.session_id}</div>
                  <div><span className="text-gray-400">Hash:</span> {sessionStatus.system_hash}</div>
                  <div><span className="text-gray-400">Timeout:</span> {sessionStatus.stream_timeout}s</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}