'use client';

import React from 'react';
import { SprintStatus, StoryProgress } from '@/lib/serviceHealth';

interface SprintProgressTrackerProps extends SprintStatus {}

const StatusBadge = ({ status }: { status: StoryProgress['status'] }) => {
  const getStatusStyles = (status: StoryProgress['status']) => {
    switch (status) {
      case 'done':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'review':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'todo':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full border ${getStatusStyles(status)}`}
      data-testid={`story-status-${status}`}
    >
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

const IntegrationHealthIndicator = ({ 
  name, 
  status 
}: { 
  name: string; 
  status: 'healthy' | 'warning' | 'error' 
}) => {
  const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div 
      className={`flex items-center gap-2 ${getStatusColor(status)}`}
      data-testid={`integration-${name}`}
    >
      <div className={`w-2 h-2 rounded-full bg-current`} />
      <span className="text-sm capitalize">
        {name.replace('-', ' ')}
      </span>
    </div>
  );
};

export default function SprintProgressTracker({
  sprintNumber,
  stories,
  integrationHealth,
  overallCompletion
}: SprintProgressTrackerProps) {
  const getSprintTitle = (sprintNumber: number) => {
    switch (sprintNumber) {
      case 1:
        return 'Sprint 1: Core Communication Protocol';
      case 2:
        return 'Sprint 2: Orchestration Foundation';
      case 3:
        return 'Sprint 3: Graph Operations Foundation';
      default:
        return `Sprint ${sprintNumber}`;
    }
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    } else {
      return `${minutes}m ago`;
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-blue-12">
          {getSprintTitle(sprintNumber)}
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-11">
            {Math.round(overallCompletion)}% Complete
          </div>
          <div className="text-sm text-gray-400">
            Overall Progress
          </div>
        </div>
      </div>

      {/* Stories Progress */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-blue-11 mb-4">Story Progress</h4>
        <div className="space-y-4">
          {stories.map((story) => (
            <div key={story.id} className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-blue-10">
                      {story.id}
                    </span>
                    <StatusBadge status={story.status} />
                  </div>
                  <h5 className="font-medium text-blue-12 mb-1">
                    {story.title}
                  </h5>
                  <p className="text-sm text-gray-400">
                    Last updated {formatLastUpdated(story.lastUpdated)}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-xl font-bold text-blue-11">
                    {story.completion}%
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${story.completion}%` }}
                  role="progressbar"
                  aria-valuenow={story.completion}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Health */}
      <div>
        <h4 className="text-lg font-medium text-blue-11 mb-4">Integration Health</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(integrationHealth).map(([name, status]) => (
            <IntegrationHealthIndicator
              key={name}
              name={name}
              status={status}
            />
          ))}
        </div>
      </div>
    </div>
  );
}