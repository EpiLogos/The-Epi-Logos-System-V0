import React from 'react';
import { TextAnimate } from './TextAnimate';
import { ExpansionSquare } from './ExpansionSquare';
import { cn } from '../../lib/utils';

interface ProjectDetailsItem {
  label: string;
  value: string;
}

interface ProjectDetailsProps {
  title: string;
  items: ProjectDetailsItem[];
  currentPage?: number;
  isPageTransitioning?: boolean;
  isBlurring?: boolean;
  textFadeStarted?: boolean;
  onPageChange?: (direction: 'prev' | 'next') => void;
  className?: string;
  isModalExpanded?: boolean;
  isBottomPanelExpanded?: boolean;
  onExpandBottomPanel?: () => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  title,
  items,
  currentPage = 0,
  isBlurring = false,
  textFadeStarted = false,
  onPageChange,
  className,
  isModalExpanded = false,
  isBottomPanelExpanded = false,
  onExpandBottomPanel
}) => {
  return (
    <div 
      className={cn(
        "bg-[#f5f5f5] px-10 py-[20px] border-t border-[#e0e0e0] relative overflow-hidden transition-[filter,opacity,height,min-height,max-height] duration-[800ms] ease-out",
        isModalExpanded 
          ? "flex-shrink-1 h-0 min-h-0 max-h-0"  // SHRINK TO NOTHING when modal expanded
          : isBottomPanelExpanded
            ? "flex-shrink-0 min-h-[80vh] max-h-[80vh]"  // EXPANDED upward when bottom panel expanded
            : "flex-shrink-0 min-h-[40vh] max-h-[40vh]",  // Normal size when not expanded
        className
      )}
      style={{
        filter: isModalExpanded ? 'blur(2px)' : 'blur(0px)',
        opacity: isModalExpanded ? 0 : 1,
        pointerEvents: isModalExpanded ? 'none' : 'auto',
        // Upward expansion animation
        transition: isBottomPanelExpanded 
          ? 'height 800ms cubic-bezier(0.4, 0, 0.2, 1), min-height 800ms cubic-bezier(0.4, 0, 0.2, 1), max-height 800ms cubic-bezier(0.4, 0, 0.2, 1)'
          : 'height 800ms cubic-bezier(0.4, 0, 0.2, 1), min-height 800ms cubic-bezier(0.4, 0, 0.2, 1), max-height 800ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Project Nav - EXACT original absolute positioning */}
      {onPageChange && (
        <div className="absolute top-[30px] right-[85px] scale-[1.8]">
          <div className="flex gap-[15px] text-[16px] text-[#333]">
            <span 
              onClick={() => onPageChange('prev')}
              className="cursor-pointer p-[5px] transition-colors duration-200 hover:text-[#666]"
            >
              ←
            </span>
            <span 
              onClick={() => onPageChange('next')}
              className="cursor-pointer p-[5px] transition-colors duration-200 hover:text-[#666]"
            >
              →
            </span>
          </div>
        </div>
      )}

      {/* Expansion Square - Positioned BELOW arrows, not to the right */}
      {onExpandBottomPanel && (
        <ExpansionSquare
          isExpanded={isBottomPanelExpanded}
          onToggle={onExpandBottomPanel}
          className="expansion-square-position"
        />
      )}
      
      {/* Project Info - CSS approach with page-two-content class */}
      <div className={`flex-1 ml-0 ${currentPage === 1 ? 'page-two-content' : ''}`}>
        <TextAnimate 
          visible={!textFadeStarted && !isBlurring}
          delay={800}
          className="text-[16px] font-normal text-[#333] leading-[1.3] mb-[8px] tracking-[1px]"
        >
          {title}
        </TextAnimate>
        
        {/* Project Metadata - Tailwind component classes with scroll support */}
        <div className={cn(
          "project-details-container",
          currentPage === 1 && !isBottomPanelExpanded && "max-h-[calc(42vh-80px)] overflow-y-auto scrollbar-thin-custom",
          currentPage === 1 && isBottomPanelExpanded && "max-h-[calc(82vh-80px)] overflow-y-auto scrollbar-thin-custom"
        )}>
          {items.map((item, index) => (
            <div key={index} className="project-details-item">
              <TextAnimate 
                visible={!textFadeStarted && !isBlurring}
                delay={1000 + (index * 50)}
                duration="slower"
                className={cn(
                  "project-details-label text-responsive-expand",
                  isBottomPanelExpanded && "text-expanded-label"
                )}
              >
                {item.label}
              </TextAnimate>
              <TextAnimate 
                visible={!textFadeStarted && !isBlurring}
                delay={1025 + (index * 50)}
                duration="slower"
                className={cn(
                  "project-details-value text-responsive-expand",
                  isBottomPanelExpanded && "text-expanded-value"
                )}
              >
                {item.value}
              </TextAnimate>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};