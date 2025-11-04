'use client';

import React from 'react';
import { ScrollingSections } from './ScrollingSections';

interface SidebarContentProps {
  onEssayClick: (essay: string) => void;
  onSectionClick: (section: string) => void;
}

export function SidebarContent({ onEssayClick, onSectionClick }: SidebarContentProps) {
  return (
    <div className="w-full h-full bg-black text-white">
      {/* Scrolling Content Sections (includes hero as first section) */}
      <ScrollingSections
        onEssayClick={onEssayClick}
        onSectionClick={onSectionClick}
      />
    </div>
  );
}
