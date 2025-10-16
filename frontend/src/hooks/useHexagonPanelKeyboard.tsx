import { useEffect } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';

export function useHexagonPanelKeyboard() {
  const { panelMode, openHexagonPanel, closeHexagonPanel } = useSidebar();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Space or Cmd+Space: Open hexagon panel
      if (event.key === ' ' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (panelMode === 'normal') {
          openHexagonPanel();
        }
      }

      // ESC: Close hexagon panel (only when in hexagon-panel mode)
      if (event.key === 'Escape' && panelMode === 'hexagon-panel') {
        event.preventDefault();
        closeHexagonPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [panelMode, openHexagonPanel, closeHexagonPanel]);
}
