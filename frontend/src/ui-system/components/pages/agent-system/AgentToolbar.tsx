'use client';

import React from 'react';
import { cn } from '../../../lib/utils';

export type ViewMode = 'prompts' | 'tools' | 'orchestrator';
export type ModalMode = 'protocols' | 'workflows' | 'capabilities' | null;

interface AgentToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onModalOpen: (mode: ModalMode) => void;
  selectedAgent: number | null;
  isPanelExpanded: boolean;
  onBackToSelector: () => void;
}

export const AgentToolbar: React.FC<AgentToolbarProps> = ({
  viewMode,
  onViewModeChange,
  onModalOpen,
  selectedAgent,
  isPanelExpanded,
  onBackToSelector
}) => {
  const ToolbarButton: React.FC<{
    active: boolean;
    onClick: () => void;
    label: string;
    disabled?: boolean;
  }> = ({ active, onClick, label, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 text-[11px] font-mono tracking-[1px] uppercase transition-all",
        "border border-purple-900/40 rounded",
        active
          ? "bg-purple-600 text-white"
          : "bg-black/30 text-purple-300 hover:bg-purple-900/20",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-black/20 border-b border-purple-900/40">
      {/* Back to Selector Button */}
      {isPanelExpanded && (
        <>
          <button
            onClick={onBackToSelector}
            className="px-4 py-2 text-[11px] font-mono tracking-[1px] uppercase transition-all border border-purple-900/40 rounded bg-purple-600 text-white hover:bg-purple-700"
          >
            ← Select Agent
          </button>
          <div className="h-8 w-px bg-purple-900/40" />
        </>
      )}

      {/* View Mode Buttons */}
      <div className="flex gap-2">
        <ToolbarButton
          active={viewMode === 'prompts'}
          onClick={() => onViewModeChange('prompts')}
          label="Prompts"
          disabled={selectedAgent === null && viewMode !== 'orchestrator'}
        />
        <ToolbarButton
          active={viewMode === 'tools'}
          onClick={() => onViewModeChange('tools')}
          label="Tools"
          disabled={selectedAgent === null && viewMode !== 'orchestrator'}
        />
        <ToolbarButton
          active={viewMode === 'orchestrator'}
          onClick={() => onViewModeChange('orchestrator')}
          label="Orchestrator"
        />
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-purple-900/40" />

      {/* Modal Buttons */}
      <div className="flex gap-2">
        <ToolbarButton
          active={false}
          onClick={() => onModalOpen('protocols')}
          label="Protocols"
          disabled={selectedAgent === null && viewMode !== 'orchestrator'}
        />
        <ToolbarButton
          active={false}
          onClick={() => onModalOpen('workflows')}
          label="Workflows"
          disabled={selectedAgent === null && viewMode !== 'orchestrator'}
        />
        <ToolbarButton
          active={false}
          onClick={() => onModalOpen('capabilities')}
          label="Capabilities"
          disabled={selectedAgent === null && viewMode !== 'orchestrator'}
        />
      </div>

      {/* Agent indicator */}
      {selectedAgent !== null && (
        <div className="ml-auto text-[10px] font-mono text-purple-400/70 tracking-[1px]">
          AGENT: #5-4.{selectedAgent}
        </div>
      )}
      {selectedAgent === null && viewMode === 'orchestrator' && (
        <div className="ml-auto text-[10px] font-mono text-purple-400/70 tracking-[1px]">
          ORCHESTRATOR: #5-4
        </div>
      )}
    </div>
  );
};
