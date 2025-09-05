'use client';

import React, { useState, useEffect } from 'react';
import { subsystems, SubsystemId } from '@/lib/constants/subsystems';
import { aguiService, AGUIEvent, AGUIResponse } from '@/lib/services/aguiService';

interface PersonaTestResult {
  persona: SubsystemId;
  coordinate: number;
  success: boolean;
  response?: AGUIResponse;
  error?: string;
  timestamp: Date;
  responseTime?: number;
}

export default function AGUIPersonaTestPanel() {
  const [testMessage, setTestMessage] = useState('Hello from the frontend!');
  const [testResults, setTestResults] = useState<PersonaTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [selectedPersona, setSelectedPersona] = useState<SubsystemId>('nara');

  // Test AG-UI connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      await aguiService.testConnection();
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('error');
      console.error('AG-UI connection failed:', error);
    }
  };

  const testSinglePersona = async (persona: SubsystemId, coordinate: number) => {
    const startTime = performance.now();
    
    try {
      const response = await aguiService.testPersona(persona, coordinate);
      const responseTime = performance.now() - startTime;
      
      const result: PersonaTestResult = {
        persona,
        coordinate,
        success: true,
        response,
        timestamp: new Date(),
        responseTime
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      return result;
    } catch (error) {
      const result: PersonaTestResult = {
        persona,
        coordinate,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
      return result;
    }
  };

  const testSelectedPersona = async () => {
    if (!testMessage.trim()) return;
    
    setLoading(true);
    const subsystem = subsystems.find(s => s.id === selectedPersona);
    if (subsystem) {
      await testSinglePersona(selectedPersona, subsystem.index);
    }
    setLoading(false);
  };

  const testAllPersonas = async () => {
    setLoading(true);
    
    for (const subsystem of subsystems) {
      await testSinglePersona(subsystem.id, subsystem.index);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString();
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-blue-12">
          AG-UI Persona Integration Testing
        </h3>
        
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-400' :
            connectionStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'
          }`} />
          <span className="text-sm text-gray-400">
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'error' ? 'Connection Failed' : 'Checking...'}
          </span>
        </div>
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-11 mb-2">
              Test Message
            </label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter message to send to persona..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-blue-12 placeholder-gray-500 focus:border-blue-600 focus:outline-none"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-11 mb-2">
              Select Persona
            </label>
            <select
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value as SubsystemId)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-blue-12 focus:border-blue-600 focus:outline-none"
            >
              {subsystems.map((subsystem) => (
                <option key={subsystem.id} value={subsystem.id}>
                  #{subsystem.index} {subsystem.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Persona Grid Display */}
        <div>
          <h4 className="text-sm font-medium text-blue-11 mb-3">Persona Coordinate Mapping:</h4>
          <div className="grid grid-cols-2 gap-2">
            {subsystems.map((subsystem) => (
              <div 
                key={subsystem.id}
                className="bg-gray-800/30 rounded-lg p-2 text-center"
                style={{ borderLeft: `3px solid ${subsystem.palette.primary}` }}
              >
                <div className="text-xs font-medium" style={{ color: subsystem.palette.primary }}>
                  #{subsystem.index} {subsystem.name}
                </div>
                <div className="text-xs text-gray-400">
                  {subsystem.id}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={testSelectedPersona}
          disabled={loading || !testMessage.trim()}
          className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 disabled:bg-gray-600/20 disabled:text-gray-500 border border-blue-600/30 disabled:border-gray-600/30 rounded-lg transition-colors"
        >
          {loading ? 'Testing...' : 'Test Selected Persona'}
        </button>
        
        <button
          onClick={testAllPersonas}
          disabled={loading || !testMessage.trim()}
          className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 disabled:bg-gray-600/20 disabled:text-gray-500 border border-green-600/30 disabled:border-gray-600/30 rounded-lg transition-colors"
        >
          Test All Personas
        </button>
        
        <button
          onClick={clearResults}
          disabled={testResults.length === 0}
          className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-600/20 disabled:text-gray-500 border border-red-600/30 disabled:border-gray-600/30 rounded-lg transition-colors"
        >
          Clear Results
        </button>
      </div>

      {/* Test Results */}
      <div>
        <h4 className="font-medium text-blue-11 mb-3">Test Results</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No test results yet. Send a message to a persona to see results.
            </div>
          ) : (
            testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border text-sm ${
                  result.success 
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                      #{result.coordinate} {result.persona}
                    </span>
                    {result.responseTime && (
                      <span className="text-xs text-gray-400">
                        ({result.responseTime.toFixed(0)}ms)
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-gray-400">
                    {formatTimestamp(result.timestamp)}
                  </span>
                </div>
                
                {result.success && result.response ? (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">
                      Events: {result.response.events.length}
                    </div>
                    {result.response.events.slice(0, 2).map((event, eventIndex) => (
                      <div key={eventIndex} className="text-xs text-gray-300 font-mono bg-gray-900/50 p-2 rounded mt-1">
                        <div className="text-blue-300">{event.type}</div>
                        {event.data && typeof event.data === 'object' && (
                          <div className="text-gray-400 truncate">
                            {JSON.stringify(event.data).slice(0, 100)}...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-red-400 text-xs">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}