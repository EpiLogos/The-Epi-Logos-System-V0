'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Orchestrator Monitoring Dashboard
 * 
 * This dashboard provides web access to the CLI's comprehensive diagnostics
 * and monitoring capabilities, including:
 * - DiagnosticsRecorder output and metrics
 * - Real-time session status monitoring
 * - AG-UI Protocol health indicators
 * - Advanced debugging information display
 */

interface SystemHealth {
  orchestrator_status: 'healthy' | 'degraded' | 'down';
  redis_connection: 'connected' | 'disconnected';
  mongodb_connection: 'connected' | 'disconnected';
  graphql_endpoint: 'available' | 'unavailable';
  models_available: number;
  personas_loaded: number;
  active_sessions: number;
  ag_ui_protocol: 'enabled' | 'disabled';
}

interface SessionMetrics {
  session_id: string;
  user_id: string;
  active_persona: string;
  current_model: string;
  messages_count: number;
  last_activity: string;
  streaming_enabled: boolean;
  diagnostics: {
    avg_first_token_ms: number;
    avg_total_ms: number;
    total_sse_events: number;
    total_sse_bytes: number;
    error_count: number;
  };
}

interface DiagnosticsData {
  trace_logs: Array<{
    trace_id: string;
    timestamp: string;
    session_id: string;
    model: string;
    persona: string;
    first_token_ms?: number;
    total_ms?: number;
    sse_events: number;
    sse_bytes: number;
    error_msg?: string;
  }>;
  system_metrics: {
    uptime: string;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    avg_response_time: number;
  };
}

export default function OrchestratorStatusPage() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [sessions, setSessions] = useState<SessionMetrics[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadSystemHealth = async () => {
    try {
      // Get system health from CLI doctor command
      const doctorResponse = await fetch('/api/dev/orchestrator/cli-bridge?command=doctor');
      const doctorResult = await doctorResponse.json();
      
      // Get capabilities data
      const capResponse = await fetch('/api/dev/orchestrator/cli-bridge?command=capabilities');
      const capResult = await capResponse.json();
      
      if (doctorResult.success && capResult.success) {
        const health: SystemHealth = {
          orchestrator_status: doctorResult.data.streaming_supported ? 'healthy' : 'degraded',
          redis_connection: 'connected', // Inferred from CLI working
          mongodb_connection: 'connected', // Inferred from CLI working
          graphql_endpoint: 'available', // Inferred from CLI working
          models_available: doctorResult.data.models_count || capResult.data.models?.length || 0,
          personas_loaded: doctorResult.data.personas_available?.length || 0,
          active_sessions: 1, // At least one CLI session is active if we get data
          ag_ui_protocol: doctorResult.data.streaming_supported ? 'enabled' : 'disabled'
        };
        setSystemHealth(health);
      }
    } catch (error) {
      console.error('Failed to load system health:', error);
      setSystemHealth({
        orchestrator_status: 'down',
        redis_connection: 'disconnected',
        mongodb_connection: 'disconnected',
        graphql_endpoint: 'unavailable',
        models_available: 0,
        personas_loaded: 0,
        active_sessions: 0,
        ag_ui_protocol: 'disabled'
      });
    }
  };

  const loadSessionMetrics = async () => {
    try {
      const response = await fetch('/api/dev/orchestrator/cli-bridge?command=status');
      const result = await response.json();
      
      if (result.success) {
        // Create session metrics from real CLI status data
        const sessionMetric: SessionMetrics = {
          session_id: result.data.session_id || 'web-cli-session',
          user_id: 'web-cli-user',
          active_persona: result.data.active_persona || 'system',
          current_model: result.data.model_name || 'unknown',
          messages_count: 0, // CLI doesn't track this in status
          last_activity: new Date().toISOString(),
          streaming_enabled: true, // Assume enabled for web interface
          diagnostics: {
            avg_first_token_ms: result.data.first_token_ms || 0,
            avg_total_ms: result.data.total_ms || 0,
            total_sse_events: result.data.sse_events || 0,
            total_sse_bytes: result.data.sse_bytes || 0,
            error_count: 0 // CLI doesn't report error count in status
          }
        };
        setSessions([sessionMetric]);
      }
    } catch (error) {
      console.error('Failed to load session metrics:', error);
      setSessions([]);
    }
  };

  const loadDiagnostics = async () => {
    try {
      // Get diagnostic data from CLI status
      const statusResponse = await fetch('/api/dev/orchestrator/cli-bridge?command=status');
      const statusResult = await statusResponse.json();
      
      if (statusResult.success) {
        // Create diagnostics from available CLI data
        const diagnostics: DiagnosticsData = {
          trace_logs: [
            {
              trace_id: `web-trace-${Date.now()}`,
              timestamp: new Date().toISOString(),
              session_id: statusResult.data.session_id || 'web-cli-session',
              model: statusResult.data.model_name || 'unknown',
              persona: statusResult.data.active_persona || 'system',
              first_token_ms: statusResult.data.first_token_ms,
              total_ms: statusResult.data.total_ms,
              sse_events: statusResult.data.sse_events || 0,
              sse_bytes: statusResult.data.sse_bytes || 0
            }
          ],
          system_metrics: {
            uptime: 'N/A', // CLI doesn't track uptime
            total_requests: 0, // Would need persistent storage to track
            successful_requests: 0,
            failed_requests: 0,
            avg_response_time: statusResult.data.total_ms || 0
          }
        };
        setDiagnostics(diagnostics);
      } else {
        // Fallback empty diagnostics if CLI not available
        setDiagnostics({
          trace_logs: [],
          system_metrics: {
            uptime: 'N/A',
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            avg_response_time: 0
          }
        });
      }
    } catch (error) {
      console.error('Failed to load diagnostics:', error);
      setDiagnostics({
        trace_logs: [],
        system_metrics: {
          uptime: 'N/A',
          total_requests: 0,
          successful_requests: 0,
          failed_requests: 0,
          avg_response_time: 0
        }
      });
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSystemHealth(),
        loadSessionMetrics(),
        loadDiagnostics()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(loadAllData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'available':
      case 'enabled':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'down':
      case 'disconnected':
      case 'unavailable':
      case 'disabled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return 'N/A';
    return `${ms}ms`;
  };

  return (
    <div className="min-h-screen bg-black text-blue-12">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-12">
                Orchestrator Status Dashboard
              </h1>
              <p className="text-gray-400">
                Real-time monitoring of CLI capabilities and system health
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Auto-refresh controls */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="auto-refresh" className="text-sm text-gray-400">
                  Auto-refresh
                </label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-blue-12"
                  disabled={!autoRefresh}
                >
                  <option value={1000}>1s</option>
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                  <option value={30000}>30s</option>
                </select>
              </div>

              <button
                onClick={loadAllData}
                disabled={loading}
                className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded text-sm border border-blue-600/30 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              
              <Link 
                href="/dev/orchestrator/chat"
                className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 rounded text-sm border border-green-600/30"
              >
                Chat Interface
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
        {loading && !systemHealth ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            <span className="ml-4 text-xl">Loading Status Dashboard...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* System Health Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-12 mb-2">Orchestrator</h3>
                <div className={`text-lg font-bold ${getStatusColor(systemHealth?.orchestrator_status || 'down')}`}>
                  {systemHealth?.orchestrator_status || 'Unknown'}
                </div>
              </div>
              
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-12 mb-2">Models</h3>
                <div className="text-lg font-bold text-blue-11">
                  {systemHealth?.models_available || 0} available
                </div>
              </div>
              
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-12 mb-2">Personas</h3>
                <div className="text-lg font-bold text-blue-11">
                  {systemHealth?.personas_loaded || 0} loaded
                </div>
              </div>
              
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-12 mb-2">Active Sessions</h3>
                <div className="text-lg font-bold text-blue-11">
                  {systemHealth?.active_sessions || 0}
                </div>
              </div>
            </div>

            {/* Infrastructure Status */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-12 mb-4">Infrastructure Status</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">Redis</div>
                  <div className={`font-semibold ${getStatusColor(systemHealth?.redis_connection || 'disconnected')}`}>
                    {systemHealth?.redis_connection || 'Unknown'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">MongoDB</div>
                  <div className={`font-semibold ${getStatusColor(systemHealth?.mongodb_connection || 'disconnected')}`}>
                    {systemHealth?.mongodb_connection || 'Unknown'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">GraphQL</div>
                  <div className={`font-semibold ${getStatusColor(systemHealth?.graphql_endpoint || 'unavailable')}`}>
                    {systemHealth?.graphql_endpoint || 'Unknown'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">AG-UI Protocol</div>
                  <div className={`font-semibold ${getStatusColor(systemHealth?.ag_ui_protocol || 'disabled')}`}>
                    {systemHealth?.ag_ui_protocol || 'Unknown'}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-12 mb-4">Active Sessions</h2>
              
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No active sessions
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2">Session ID</th>
                        <th className="text-left py-2">Persona</th>
                        <th className="text-left py-2">Model</th>
                        <th className="text-left py-2">Messages</th>
                        <th className="text-left py-2">Avg Response</th>
                        <th className="text-left py-2">First Token</th>
                        <th className="text-left py-2">Streaming</th>
                        <th className="text-left py-2">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr key={session.session_id} className="border-b border-gray-800">
                          <td className="py-2 font-mono text-xs">{session.session_id}</td>
                          <td className="py-2">{session.active_persona}</td>
                          <td className="py-2 text-xs">{session.current_model}</td>
                          <td className="py-2">{session.messages_count}</td>
                          <td className="py-2">{formatDuration(session.diagnostics.avg_total_ms)}</td>
                          <td className="py-2">{formatDuration(session.diagnostics.avg_first_token_ms)}</td>
                          <td className="py-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              session.streaming_enabled 
                                ? 'bg-green-600/20 text-green-400' 
                                : 'bg-gray-600/20 text-gray-400'
                            }`}>
                              {session.streaming_enabled ? 'ON' : 'OFF'}
                            </span>
                          </td>
                          <td className="py-2 text-xs">{formatTimestamp(session.last_activity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* System Metrics */}
            {diagnostics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Overview */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-blue-12 mb-4">System Metrics</h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime:</span>
                      <span className="text-blue-11">{diagnostics.system_metrics.uptime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Requests:</span>
                      <span className="text-blue-11">{diagnostics.system_metrics.total_requests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Success Rate:</span>
                      <span className="text-green-400">
                        {((diagnostics.system_metrics.successful_requests / diagnostics.system_metrics.total_requests) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Failed Requests:</span>
                      <span className="text-red-400">{diagnostics.system_metrics.failed_requests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Response Time:</span>
                      <span className="text-blue-11">{diagnostics.system_metrics.avg_response_time}ms</span>
                    </div>
                  </div>
                </div>

                {/* Recent Traces */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-blue-12 mb-4">Recent Traces</h2>
                  
                  <div className="space-y-3">
                    {diagnostics.trace_logs.map((trace) => (
                      <div key={trace.trace_id} className="border border-gray-700 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs text-gray-400">{trace.trace_id}</span>
                          <span className="text-xs text-gray-500">{formatTimestamp(trace.timestamp)}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-gray-400">Model:</span> {trace.model}</div>
                          <div><span className="text-gray-400">Persona:</span> {trace.persona}</div>
                          <div><span className="text-gray-400">First Token:</span> {formatDuration(trace.first_token_ms)}</div>
                          <div><span className="text-gray-400">Total Time:</span> {formatDuration(trace.total_ms)}</div>
                          <div><span className="text-gray-400">SSE Events:</span> {trace.sse_events}</div>
                          <div><span className="text-gray-400">SSE Bytes:</span> {trace.sse_bytes}</div>
                        </div>
                        
                        {trace.error_msg && (
                          <div className="mt-2 text-xs text-red-400">
                            Error: {trace.error_msg}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}