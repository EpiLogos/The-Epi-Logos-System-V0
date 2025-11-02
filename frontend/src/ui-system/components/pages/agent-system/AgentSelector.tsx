'use client';

import React, { useState } from 'react';
import { Card, FocusCard } from '../../ui/FocusCards';

interface AgentSelectorProps {
  onSelectAgent: (subsystem: number) => void;
  selectedAgent: number | null;
}

const AGENT_CARDS: FocusCard[] = [
  {
    title: "ANUTTARA",
    description: "Proto-logical processing agent, foundational ground operations",
    coordinate: "#5-4.0",
    borderColor: "border-purple-900/40"
  },
  {
    title: "PARAMASIVA",
    description: "Quaternal Logic engine agent, architectural pattern processing",
    coordinate: "#5-4.1",
    borderColor: "border-purple-900/40"
  },
  {
    title: "PARASHAKTI",
    description: "Vibrational processing agent, cosmic imagination operations",
    coordinate: "#5-4.2",
    borderColor: "border-purple-900/40"
  },
  {
    title: "MAHAMAYA",
    description: "Symbolic transcription agent, universal language processing",
    coordinate: "#5-4.3",
    borderColor: "border-purple-900/40"
  },
  {
    title: "NARA",
    description: "Personal interface agent, dialogical processing specialist",
    coordinate: "#5-4.4",
    borderColor: "border-purple-900/40"
  },
  {
    title: "EPII",
    description: "Synthesis agent, orchestration and integration specialist",
    coordinate: "#5-4.5",
    borderColor: "border-purple-900/40"
  }
];

export const AgentSelector: React.FC<AgentSelectorProps> = ({ onSelectAgent, selectedAgent }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const handleCardClick = (index: number) => {
    onSelectAgent(index);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-[#333] text-[14px] font-mono tracking-[2px] uppercase py-4 text-center">
        {selectedAgent !== null ? `Selected: ${AGENT_CARDS[selectedAgent].title}` : 'Select Subsystem Agent'}
      </h3>

      {/* 3x2 grid with no gap */}
      <div className="grid grid-cols-3 gap-0 w-full flex-1">
        {AGENT_CARDS.map((card, index) => (
          <div
            key={card.coordinate}
            onClick={() => handleCardClick(index)}
            className="cursor-pointer h-full"
          >
            <Card
              card={card}
              index={index}
              hovered={hovered}
              setHovered={setHovered}
              size="compact"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
