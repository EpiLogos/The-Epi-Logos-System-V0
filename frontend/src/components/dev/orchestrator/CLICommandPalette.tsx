'use client';

import React, { useState } from 'react';

/**
 * CLI Command Palette Component
 * 
 * Provides quick access to all CLI commands through a web interface
 */

interface CLICommand {
  command: string;
  description: string;
  usage: string;
  category: 'session' | 'model' | 'persona' | 'system' | 'debug';
}

interface CLICommandPaletteProps {
  onExecuteCommand: (command: string) => void;
  currentModel?: string;
  currentPersona?: string;
  streamingEnabled?: boolean;
}

const CLI_COMMANDS: CLICommand[] = [
  // Session commands
  { command: 'help', description: 'Show all available commands', usage: '/help', category: 'session' },
  { command: 'status', description: 'Show session status and diagnostics', usage: '/status', category: 'session' },
  { command: 'clear', description: 'Clear conversation history', usage: '/clear', category: 'session' },
  { command: 'config', description: 'Show current configuration', usage: '/config', category: 'session' },
  { command: 'exit', description: 'End the session', usage: '/exit', category: 'session' },
  
  // Model commands
  { command: 'models', description: 'List available models', usage: '/models', category: 'model' },
  { command: 'use', description: 'Switch to a different model', usage: '/use <provider:model>', category: 'model' },
  
  // Persona commands
  { command: 'personas', description: 'List available personas', usage: '/personas', category: 'persona' },
  { command: 'persona', description: 'Switch to a different persona', usage: '/persona <name>', category: 'persona' },
  { command: 'persona_models', description: 'Show persona-model assignments', usage: '/persona_models', category: 'persona' },
  { command: 'persona_model', description: 'Assign model to persona', usage: '/persona_model <persona> <model>', category: 'persona' },
  
  // System commands
  { command: 'sys', description: 'View or set system prompt override', usage: '/sys [prompt]', category: 'system' },
  { command: 'stream', description: 'Toggle streaming mode', usage: '/stream [on|off]', category: 'system' },
  { command: 'timeout', description: 'Set streaming timeout', usage: '/timeout <seconds>', category: 'system' },
  
  // Debug commands
  { command: 'save', description: 'Save transcript to file', usage: '/save [path]', category: 'debug' },
  { command: 'load', description: 'Load transcript from file', usage: '/load <path>', category: 'debug' },
];

const CATEGORY_COLORS = {
  session: 'border-blue-600/30 bg-blue-600/10',
  model: 'border-green-600/30 bg-green-600/10',
  persona: 'border-purple-600/30 bg-purple-600/10',
  system: 'border-yellow-600/30 bg-yellow-600/10',
  debug: 'border-red-600/30 bg-red-600/10',
};

const CATEGORY_NAMES = {
  session: 'Session Control',
  model: 'Model Management',
  persona: 'Persona Control',
  system: 'System Configuration',
  debug: 'Debug & Transcripts',
};

export default function CLICommandPalette({ 
  onExecuteCommand, 
  currentModel, 
  currentPersona, 
  streamingEnabled 
}: CLICommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCommands = CLI_COMMANDS.filter(cmd => {
    const matchesSearch = cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cmd.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || cmd.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedCommands = filteredCommands.reduce((groups, command) => {
    if (!groups[command.category]) {
      groups[command.category] = [];
    }
    groups[command.category].push(command);
    return groups;
  }, {} as Record<string, CLICommand[]>);

  const handleCommandClick = (command: CLICommand) => {
    onExecuteCommand(command.command);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getCommandStatus = (command: CLICommand): string => {
    switch (command.command) {
      case 'stream':
        return streamingEnabled ? 'ON' : 'OFF';
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-sm text-blue-12 text-left"
      >
        <div className="flex items-center justify-between">
          <span>CLI Commands</span>
          <span className="text-xs text-gray-400">
            {isOpen ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Command Palette */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
            {/* Search and Filter */}
            <div className="p-3 border-b border-gray-700">
              <input
                type="text"
                placeholder="Search commands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-blue-12 placeholder-gray-500 mb-2"
                autoFocus
              />
              
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedCategory === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedCategory === key 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Commands List */}
            <div className="max-h-80 overflow-y-auto">
              {Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category} className="p-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES]}
                  </h3>
                  
                  <div className="space-y-1">
                    {commands.map((command) => (
                      <button
                        key={command.command}
                        onClick={() => handleCommandClick(command)}
                        className={`w-full text-left p-2 rounded border ${CATEGORY_COLORS[command.category]} hover:border-opacity-50 transition-all`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-mono text-sm text-blue-12">
                              {command.usage}
                            </div>
                            <div className="text-xs text-gray-400">
                              {command.description}
                            </div>
                          </div>
                          
                          {getCommandStatus(command) && (
                            <span className="text-xs px-2 py-1 bg-gray-700 rounded">
                              {getCommandStatus(command)}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {filteredCommands.length === 0 && (
                <div className="p-6 text-center text-gray-400">
                  No commands found matching &quot;{searchTerm}&quot;
                </div>
              )}
            </div>

            {/* Current Context */}
            <div className="p-3 border-t border-gray-700 bg-gray-800/50">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-gray-400">Model:</span>
                  <span className="text-blue-400 font-mono">{currentModel || 'unknown'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400">Persona:</span>
                  <span className="text-purple-400">{currentPersona || 'unknown'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400">Streaming:</span>
                  <span className={streamingEnabled ? 'text-green-400' : 'text-red-400'}>
                    {streamingEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}