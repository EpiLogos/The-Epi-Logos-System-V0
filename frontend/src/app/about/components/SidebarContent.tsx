'use client';

import React from 'react';
import { ScrollingSections } from './ScrollingSections';

interface SidebarContentProps {
  onEssayClick: (essay: string) => void;
  onSectionClick: (section: string) => void;
  onSectionChange?: (index: number) => void;
}

export function SidebarContent({ onEssayClick, onSectionClick, onSectionChange }: SidebarContentProps) {
  return (
    <div className="w-full h-full bg-black text-white">
      <ScrollingSections
        onEssayClick={onEssayClick}
        onSectionClick={onSectionClick}
        onSectionChange={onSectionChange}
      />
    </div>
  );
}
