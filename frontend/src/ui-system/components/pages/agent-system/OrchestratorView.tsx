'use client';

import React from 'react';
import { AgentPromptView } from './AgentPromptView';

interface OrchestratorViewProps {
  // Props placeholder - orchestrator uses #5-4 coordinate
}

export const OrchestratorView: React.FC<OrchestratorViewProps> = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b border-purple-900/20">
        <h2 className="text-[24px] font-mono tracking-[3px] uppercase text-[#f5f5f5] mb-2">
          Orchestrator System
        </h2>
        <p className="text-[12px] text-purple-400/70">
          Coordinate-agnostic operational grounding for all agents
        </p>
      </div>

      {/* Reuse AgentPromptView for #5-4 parent node */}
      <AgentPromptView coordinate="#5-4" />

      {/* Additional orchestrator info */}
      <div className="text-[#f5f5f5] bg-purple-900/10 border border-purple-900/30 rounded p-4">
        <h3 className="text-[13px] font-mono tracking-[1.5px] uppercase text-purple-300 mb-3">
          Orchestrator Context
        </h3>
        <div className="text-[12px] text-[#f5f5f5] leading-relaxed space-y-2 opacity-90">
          <p>
            The orchestrator (#5-4) provides universal operational guidance shared across all agent manifestations (#5-4.0 through #5-4.5).
          </p>
          <p>
            This includes three-namespace architecture (Bimba, Gnostic, Episodic), self-referential coordinate awareness, and CAG paradigm protocols.
          </p>
          <p className="text-purple-400/70 text-[11px] pt-2">
            Subsystem-specific agents inherit this foundation and add their own specialized identity prompts.
          </p>
        </div>
      </div>
    </div>
  );
};
