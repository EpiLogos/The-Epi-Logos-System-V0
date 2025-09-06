/**
 * Coordinate Display Component
 * Simple text display showing current coordinate with hover details
 * 
 * Following Decoupled Domain Pattern:
 * - Pure presentation component
 * - Consumes coordinate data via props  
 * - Uses Radix UI primitives for accessibility
 * - Integrates with BimbaCoordinate domain data
 */

'use client';

import React from 'react';
import * as HoverCard from '@radix-ui/react-hover-card';
import { CoordinateResolution } from '@/lib/coordinateService';

export interface CoordinateDisplayProps {
  coordinate?: CoordinateResolution | string | { coordinate: string; name?: string; context?: string; subsystem?: number };
  displayMode?: 'badge' | 'navbar' | 'inline';
  className?: string;
  showDetails?: boolean;
}

export const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({
  coordinate,
  displayMode = 'navbar',
  className = '',
  showDetails = true
}) => {
  if (!coordinate) {
    return (
      <span className={`coordinate-simple ${className}`} data-testid="coordinate-loading">
        Loading...
      </span>
    );
  }

  // Normalize coordinate data to consistent format
  const normalizedCoordinate = React.useMemo(() => {
    if (typeof coordinate === 'string') {
      return { coordinate, name: coordinate, subsystem: null, responseTime: null };
    } else if (coordinate && typeof coordinate === 'object') {
      // Check if it's a CoordinateResolution object (has responseTime)
      if ('responseTime' in coordinate) {
        return coordinate as CoordinateResolution;
      }
      // Otherwise it's a simple coordinate context object
      return {
        coordinate: coordinate.coordinate,
        name: coordinate.name || coordinate.coordinate,
        subsystem: coordinate.subsystem || null,
        responseTime: null
      };
    }
    return { coordinate: 'unknown', name: 'unknown', subsystem: null, responseTime: null };
  }, [coordinate]);

  const displayContent = (
    <span 
      className={`coordinate-simple ${className} ${showDetails ? 'coordinate-hoverable' : ''}`}
      data-testid="coordinate-display"
    >
      {normalizedCoordinate.coordinate}
    </span>
  );

  if (!showDetails) {
    return displayContent;
  }

  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        {displayContent}
      </HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content 
          className="coordinate-hover-details"
          data-testid="coordinate-hover-details"
          sideOffset={8}
        >
          <div className="coordinate-details-content">
            <div className="coordinate-header">
              <div className="coordinate-badge">{normalizedCoordinate.coordinate}</div>
              <h3 className="coordinate-title">{normalizedCoordinate.name}</h3>
            </div>
            
            <div className="coordinate-metadata">
              {normalizedCoordinate.subsystem && (
                <div className="info-item">
                  <strong>Subsystem:</strong> #{normalizedCoordinate.subsystem}
                </div>
              )}
              {normalizedCoordinate.responseTime && (
                <div className="info-item">
                  <strong>Resolution Time:</strong> {normalizedCoordinate.responseTime}ms
                </div>
              )}
            </div>
          </div>
          
          <HoverCard.Arrow className="coordinate-arrow" />
        </HoverCard.Content>
      </HoverCard.Portal>

      <style jsx>{`
        .coordinate-simple {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
          font-weight: 600;
          font-family: var(--font-mono, 'SF Mono', Consolas, monospace);
          transition: color 0.2s ease;
        }

        .coordinate-hoverable {
          cursor: pointer;
        }

        .coordinate-hoverable:hover {
          color: rgba(255, 255, 255, 1);
        }

        .coordinate-hover-details {
          background: rgba(20, 20, 30, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 1rem;
          max-width: 300px;
          z-index: 50;
          backdrop-filter: blur(20px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }

        .coordinate-details-content {
          color: white;
        }

        .coordinate-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .coordinate-badge {
          background: rgba(99, 102, 241, 0.8);
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          font-family: var(--font-mono, 'SF Mono', Consolas, monospace);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .coordinate-title {
          font-size: 1rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          margin: 0;
        }

        .coordinate-description {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .coordinate-metadata {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .info-item {
          margin-bottom: 0.25rem;
        }

        .info-item strong {
          color: rgba(255, 255, 255, 0.9);
        }

        .coordinate-arrow {
          fill: rgba(20, 20, 30, 0.95);
        }
      `}</style>
    </HoverCard.Root>
  );
};

export default CoordinateDisplay;