'use client';

import React, { createContext, useContext, useState } from 'react';

type PanelMode = 'normal' | 'hexagon-panel' | 'transitioning-to-normal';

interface SidebarContextType {
  isCollapsed: boolean;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  panelMode: PanelMode;
  openHexagonPanel: () => void;
  closeHexagonPanel: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>('normal');

  const toggle = () => setIsCollapsed(prev => !prev);
  const collapse = () => setIsCollapsed(true);
  const expand = () => setIsCollapsed(false);

  const openHexagonPanel = () => setPanelMode('hexagon-panel');
  const closeHexagonPanel = () => {
    // Trigger fade-out animation before switching to normal
    setPanelMode('transitioning-to-normal');
    setTimeout(() => {
      setPanelMode('normal');
    }, 300); // Match fade-out animation duration
  };

  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      toggle,
      collapse,
      expand,
      panelMode,
      openHexagonPanel,
      closeHexagonPanel
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
