'use client';

import React from 'react';
import { ScrollingSections } from './ScrollingSections';
import { useLightMode } from '@/contexts/LightModeContext';
import { cn } from '@/lib/utils';

interface SidebarContentProps {
  onEssayClick: (essay: string) => void;
  onSectionClick: (section: string) => void;
  onSectionChange?: (index: number) => void;
}

export function SidebarContent({ onEssayClick, onSectionClick, onSectionChange }: SidebarContentProps) {
  const { isLightMode } = useLightMode();

  return (
    <div className={cn(
      "w-full h-full transition-colors duration-500",
      isLightMode ? "bg-white text-gray-800" : "bg-black text-white"
    )}>
      <ScrollingSections
        onEssayClick={onEssayClick}
        onSectionClick={onSectionClick}
        onSectionChange={onSectionChange}
      />
    </div>
  );
}
