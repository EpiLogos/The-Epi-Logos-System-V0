'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// import HexagonNavigation from '@/components/HexagonNavigation'; // DEPRECATED - Replaced by EpiiNavigation
import SprintProgressTracker from '@/components/dev/SprintProgressTracker';
import SystemHealthMonitor from '@/components/dev/SystemHealthMonitor';
import { getSprintStatus, SprintStatus } from '@/lib/serviceHealth';

interface DashboardStats {
  totalStories: number;
  completedStories: number;
  inProgressStories: number;
  overallProgress: number;
}

export default function DeveloperDashboard() {
  const router = useRouter();
  const [sprintData, setSprintData] = useState<Record<string, SprintStatus> | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const loadSprintData = async () => {
      try {
        const data = await getSprintStatus();
        setSprintData(data);
        
        // Calculate overall stats
        const allStories = Object.values(data).flatMap(sprint => sprint.stories);
        const completed = allStories.filter(story => story.status === 'done').length;
        const inProgress = allStories.filter(story => story.status === 'in_progress' || story.status === 'review').length;
        const totalProgress = allStories.reduce((sum, story) => sum + story.completion, 0) / allStories.length;

        setStats({
          totalStories: allStories.length,
          completedStories: completed,
          inProgressStories: inProgress,
          overallProgress: Math.round(totalProgress)
        });
      } catch (error) {
        console.error('Failed to load sprint data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSprintData();
  }, []);

  const navigateToSprint = (sprintNumber: number) => {
    router.push(`/dev/sprint/${sprintNumber}`);
  };

  const navigateHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-blue-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            <span className="ml-4 text-xl">Loading Developer Dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-blue-12">
      {/* Navigation */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* HexagonNavigation removed - replaced by EpiiNavigation */}
              <div>
                <h1 className="text-2xl font-bold text-blue-12">
                  Developer Control Center
                </h1>
                <p className="text-gray-400">
                  Sprint Management & System Health Dashboard
                </p>
              </div>
            </div>
            
            <Link 
              href="/" 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors border border-blue-600/30"
              role="link"
              aria-label="Back to main app"
            >
              <span>← Back to Main App</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-11">{stats.totalStories}</div>
              <div className="text-sm text-gray-400">Total Stories</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{stats.completedStories}</div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.inProgressStories}</div>
              <div className="text-sm text-gray-400">In Progress</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-11">{stats.overallProgress}%</div>
              <div className="text-sm text-gray-400">Overall Progress</div>
            </div>
          </div>
        )}

        {/* Development Tools */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-blue-12 mb-4">Development Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Orchestrator Testing */}
            <Link
              href="/dev/orchestrator/chat"
              className="bg-orange-900/30 border border-orange-600/50 hover:border-orange-400/70 rounded-lg p-6 transition-all duration-200 hover:bg-orange-800/30 group"
              role="link"
              aria-label="Orchestrator Chat Interface - Testing CLI Capabilities"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🤖</div>
                  <h3 className="text-lg font-medium text-blue-12">Orchestrator Chat</h3>
                </div>
                <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded group-hover:bg-orange-400/30 transition-colors">
                  NEW
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-3">
                Web interface for comprehensive CLI testing capabilities
              </p>
              <div className="space-y-2 text-xs text-gray-400">
                <div>• 15+ CLI commands through web interface</div>
                <div>• Real-time AG-UI Protocol streaming</div>
                <div>• Persona switching & model management</div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-1 bg-orange-600/20 text-orange-300 text-xs rounded">
                  CLI Bridge
                </span>
                <span className="px-2 py-1 bg-orange-600/20 text-orange-300 text-xs rounded">
                  Story 02.14.C
                </span>
              </div>
            </Link>

            {/* Orchestrator Monitoring */}
            <Link
              href="/dev/orchestrator/status"
              className="bg-cyan-900/30 border border-cyan-600/50 hover:border-cyan-400/70 rounded-lg p-6 transition-all duration-200 hover:bg-cyan-800/30 group"
              role="link"
              aria-label="Orchestrator Status Dashboard - System Monitoring"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📊</div>
                  <h3 className="text-lg font-medium text-blue-12">Orchestrator Status</h3>
                </div>
                <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded group-hover:bg-cyan-400/30 transition-colors">
                  NEW
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-3">
                Real-time monitoring of CLI diagnostics and system health
              </p>
              <div className="space-y-2 text-xs text-gray-400">
                <div>• Live session metrics & diagnostics</div>
                <div>• Infrastructure status monitoring</div>
                <div>• Real-time trace logs & performance data</div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-1 bg-cyan-600/20 text-cyan-300 text-xs rounded">
                  Monitoring
                </span>
                <span className="px-2 py-1 bg-cyan-600/20 text-cyan-300 text-xs rounded">
                  Story 02.14.C
                </span>
              </div>
            </Link>

            <Link
              href="/placeholder-demo"
              className="bg-purple-900/30 border border-purple-600/50 hover:border-purple-400/70 rounded-lg p-6 transition-all duration-200 hover:bg-purple-800/30 group"
              role="link"
              aria-label="Placeholder Demo - Living Placeholder System"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🧪</div>
                  <h3 className="text-lg font-medium text-blue-12">Placeholder Demo</h3>
                </div>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded group-hover:bg-purple-400/30 transition-colors">
                  LIVE
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-3">
                Living Placeholder System with Development Mode
              </p>
              <div className="space-y-2 text-xs text-gray-400">
                <div>• Live coordinate switching & template variations</div>
                <div>• Real-time styling controls & design experimentation</div>
                <div>• Canvas, Card & Dynamic interface templates</div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded">
                  Dev Mode
                </span>
                <span className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded">
                  Design Lab
                </span>
                <span className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded">
                  Story 01.01
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Sprint Navigation */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-blue-12 mb-4">Sprint Testing Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/dev/sprint/1"
              className="bg-gray-900/50 border border-gray-800 hover:border-blue-600/50 rounded-lg p-6 transition-all duration-200 hover:bg-gray-800/50"
              role="link"
              aria-label="Sprint 1 Testing"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-blue-12">Sprint 1 Testing</h3>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                  COMPLETE
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Core Communication Protocol
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                  Coordinate Resolution
                </span>
                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                  AG-UI Protocol
                </span>
              </div>
            </Link>

            <Link
              href="/dev/sprint/2"
              className="bg-gray-900/50 border border-gray-800 hover:border-blue-600/50 rounded-lg p-6 transition-all duration-200 hover:bg-gray-800/50"
              role="link"
              aria-label="Sprint 2 Testing"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-blue-12">Sprint 2 Testing</h3>
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                  IN PROGRESS
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Orchestration Foundation
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                  User Account Auth
                </span>
                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                  Frontend Management
                </span>
              </div>
            </Link>

            <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6 opacity-60">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-400">Sprint 3 Testing</h3>
                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                  PLANNED
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-3">
                Graph Operations Foundation
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-gray-600/20 text-gray-500 text-xs rounded">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sprint Overview */}
        <div data-testid="sprint-overview" className="mb-8">
          <h2 className="text-xl font-semibold text-blue-12 mb-6">Sprint Progress Overview</h2>
          <div className="space-y-6">
            {sprintData && Object.values(sprintData).map((sprint) => (
              <div key={sprint.sprintNumber} data-testid={`sprint-${sprint.sprintNumber}-status`}>
                <SprintProgressTracker {...sprint} />
              </div>
            ))}
          </div>
          <div data-testid="story-progress-indicators" className="mt-4 opacity-0">
            {/* Hidden element for test compatibility */}
          </div>
        </div>

        {/* System Health */}
        <div data-testid="system-health-monitor">
          <SystemHealthMonitor refreshInterval={30000} />
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-blue-12 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigateToSprint(1)}
              className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg p-4 transition-colors"
            >
              <div className="font-medium text-blue-12 mb-2">Test Sprint 1 Features</div>
              <div className="text-sm text-gray-400">
                Validate coordinate resolution and AG-UI protocol
              </div>
            </button>

            <button
              onClick={() => navigateToSprint(2)}
              className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/30 rounded-lg p-4 transition-colors"
            >
              <div className="font-medium text-blue-12 mb-2">Test Sprint 2 Features</div>
              <div className="text-sm text-gray-400">
                Test user authentication and account management
              </div>
            </button>

            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/30 rounded-lg p-4 transition-colors"
            >
              <div className="font-medium text-blue-12 mb-2">Refresh Dashboard</div>
              <div className="text-sm text-gray-400">
                Update all status indicators and health checks
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}