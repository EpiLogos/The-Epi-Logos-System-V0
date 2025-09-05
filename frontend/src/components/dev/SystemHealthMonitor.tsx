'use client';

import React, { useState, useEffect } from 'react';
import { checkSystemHealth, SystemHealthData } from '@/lib/serviceHealth';

interface SystemHealthMonitorProps {
  refreshInterval?: number;
}

const HealthIndicator = ({ 
  status, 
  label, 
  responseTime, 
  additionalInfo 
}: { 
  status: 'healthy' | 'warning' | 'error' | 'timeout' | 'unhealthy'; 
  label: string; 
  responseTime?: number;
  additionalInfo?: string;
}) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          border: 'border-green-500/50',
          dot: 'bg-green-400'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/20',
          text: 'text-yellow-400',
          border: 'border-yellow-500/50',
          dot: 'bg-yellow-400'
        };
      case 'error':
      case 'unhealthy':
      case 'timeout':
        return {
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          border: 'border-red-500/50',
          dot: 'bg-red-400'
        };
      default:
        return {
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          border: 'border-gray-500/50',
          dot: 'bg-gray-400'
        };
    }
  };

  const styles = getStatusStyles(status);

  return (
    <div className={`p-3 rounded-lg border ${styles.bg} ${styles.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${styles.dot}`} />
          <span className="font-medium text-blue-12">{label}</span>
        </div>
        <span className={`text-xs uppercase tracking-wide ${styles.text}`}>
          {status}
        </span>
      </div>
      
      <div className="text-sm text-gray-400 space-y-1">
        {responseTime !== undefined && (
          <div className="flex justify-between">
            <span>Response Time:</span>
            <span className="text-blue-11 font-mono">{responseTime}ms</span>
          </div>
        )}
        {additionalInfo && (
          <div className="text-xs opacity-75">
            {additionalInfo}
          </div>
        )}
      </div>
    </div>
  );
};

const DatabaseHealth = ({ 
  database 
}: { 
  database: SystemHealthData['database'] 
}) => (
  <div className="space-y-3">
    <h5 className="font-medium text-blue-11 mb-3">Database Health</h5>
    
    <div data-testid="database-neo4j">
      <HealthIndicator
        status={database.neo4j.status}
        label="Neo4j Graph DB"
        additionalInfo={
          database.neo4j.connectionPool 
            ? `Pool: ${database.neo4j.connectionPool}, Active: ${database.neo4j.activeQueries}, Avg: ${database.neo4j.avgQueryTime}ms`
            : 'Connection details unavailable'
        }
      />
    </div>

    <div data-testid="database-mongodb">
      <HealthIndicator
        status={database.mongodb.status}
        label="MongoDB Atlas"
        additionalInfo={
          database.mongodb.connectionPool 
            ? `Pool: ${database.mongodb.connectionPool}, Connections: ${database.mongodb.activeConnections}, Size: ${database.mongodb.dbSize}`
            : 'Connection details unavailable'
        }
      />
    </div>

    <div data-testid="database-redis">
      <HealthIndicator
        status={database.redis.status}
        label="Redis Cache"
        additionalInfo={
          database.redis.memoryUsage 
            ? `Memory: ${database.redis.memoryUsage}, Keys: ${database.redis.keyCount}, Hit Rate: ${database.redis.hitRate}%`
            : 'Connection details unavailable'
        }
      />
    </div>
  </div>
);

const IntegrationHealth = ({ 
  integrations 
}: { 
  integrations: SystemHealthData['integrations'] 
}) => (
  <div className="space-y-3">
    <h5 className="font-medium text-blue-11 mb-3">Integration Services</h5>
    
    <div data-testid="integration-coordinate-resolution">
      <HealthIndicator
        status={integrations['coordinate-resolution'].status}
        label="Coordinate Resolution"
        responseTime={integrations['coordinate-resolution'].avgResponseTime}
        additionalInfo={`Success Rate: ${integrations['coordinate-resolution'].successRate}%`}
      />
    </div>

    <div data-testid="integration-oauth-integration">
      <HealthIndicator
        status={integrations['oauth-integration'].status}
        label="OAuth Integration"
        responseTime={integrations['oauth-integration'].avgResponseTime}
        additionalInfo={`Success Rate: ${integrations['oauth-integration'].successRate}%`}
      />
    </div>

    <div data-testid="integration-user-authentication">
      <HealthIndicator
        status={integrations['user-authentication'].status}
        label="User Authentication"
        responseTime={integrations['user-authentication'].avgResponseTime}
        additionalInfo={`Success Rate: ${integrations['user-authentication'].successRate}%`}
      />
    </div>
  </div>
);

export default function SystemHealthMonitor({ 
  refreshInterval = 30000 
}: SystemHealthMonitorProps) {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const checkHealth = async () => {
    try {
      setError(null);
      const data = await checkSystemHealth();
      setHealthData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkHealth();

    // Set up interval
    let intervalId: NodeJS.Timeout;
    if (refreshInterval > 0) {
      intervalId = setInterval(checkHealth, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [refreshInterval]);

  const formatUpdateTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getOverallStatus = (data: SystemHealthData) => {
    const statuses = [
      data.backend.status,
      data.database.neo4j.status,
      data.database.mongodb.status,
      data.database.redis.status,
      data.integrations['coordinate-resolution'].status,
      data.integrations['oauth-integration'].status,
      data.integrations['user-authentication'].status
    ];

    const hasError = statuses.some(s => s === 'error' || s === 'unhealthy');
    const hasWarning = statuses.some(s => s === 'warning' || s === 'timeout');

    if (hasError) return 'error';
    if (hasWarning) return 'warning';
    return 'healthy';
  };

  if (loading && !healthData) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-blue-12 mb-6">
          System Health Monitor
        </h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-2 text-gray-400">Checking system health...</span>
        </div>
      </div>
    );
  }

  if (error && !healthData) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-blue-12 mb-6">
          System Health Monitor
        </h3>
        <div 
          className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400"
          data-testid="health-check-error"
        >
          <div className="font-medium mb-2">Health Check Failed</div>
          <div className="text-sm opacity-90">{error}</div>
          <button 
            onClick={checkHealth}
            className="mt-3 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-blue-12">
          System Health Monitor
        </h3>
        <div className="text-right">
          {healthData && (
            <div className="flex items-center gap-2 mb-1">
              <div 
                className={`w-3 h-3 rounded-full ${
                  getOverallStatus(healthData) === 'healthy' 
                    ? 'bg-green-400' 
                    : getOverallStatus(healthData) === 'warning'
                    ? 'bg-yellow-400'
                    : 'bg-red-400'
                }`} 
              />
              <span className="text-sm text-blue-11 capitalize">
                {getOverallStatus(healthData)}
              </span>
            </div>
          )}
          {lastUpdate && (
            <div className="text-xs text-gray-400">
              Last updated: {formatUpdateTime(lastUpdate)}
            </div>
          )}
        </div>
      </div>

      {healthData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Backend Service */}
          <div>
            <h5 className="font-medium text-blue-11 mb-3">Backend Services</h5>
            <div data-testid="backend-status">
              <HealthIndicator
                status={healthData.backend.status}
                label="FastAPI Backend"
                responseTime={healthData.backend.response_time_ms}
                additionalInfo={healthData.backend.message}
              />
            </div>
            {healthData.backend.status !== 'healthy' && (
              <div 
                className="text-xs text-red-400 mt-2 p-2 bg-red-500/10 rounded"
                data-testid="status-warning"
              >
                {healthData.backend.error || 'Service degraded'}
              </div>
            )}
          </div>

          {/* Database Health */}
          <div>
            <DatabaseHealth database={healthData.database} />
          </div>

          {/* Integration Health */}
          <div>
            <IntegrationHealth integrations={healthData.integrations} />
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center mt-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
}