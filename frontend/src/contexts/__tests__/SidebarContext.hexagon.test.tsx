import { renderHook, act } from '@testing-library/react';
import { SidebarProvider, useSidebar } from '../SidebarContext';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <SidebarProvider>{children}</SidebarProvider>
);

describe('SidebarContext - Hexagon Panel Extension', () => {
  it('provides panelMode state (default: normal)', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });

    expect(result.current.panelMode).toBe('normal');
  });

  it('provides openHexagonPanel function', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });

    expect(result.current.openHexagonPanel).toBeDefined();
    expect(typeof result.current.openHexagonPanel).toBe('function');
  });

  it('provides closeHexagonPanel function', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });

    expect(result.current.closeHexagonPanel).toBeDefined();
    expect(typeof result.current.closeHexagonPanel).toBe('function');
  });

  it('switches panelMode to hexagon-panel when openHexagonPanel called', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });

    act(() => {
      result.current.openHexagonPanel();
    });

    expect(result.current.panelMode).toBe('hexagon-panel');
  });

  it('switches panelMode back to normal when closeHexagonPanel called', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });

    // Open panel first
    act(() => {
      result.current.openHexagonPanel();
    });

    expect(result.current.panelMode).toBe('hexagon-panel');

    // Close panel
    act(() => {
      result.current.closeHexagonPanel();
    });

    expect(result.current.panelMode).toBe('normal');
  });

  it('maintains existing sidebar collapse functionality', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });

    expect(result.current.isCollapsed).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isCollapsed).toBe(true);
  });

  it('can have hexagon panel open while sidebar is collapsed', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });

    // Collapse sidebar
    act(() => {
      result.current.collapse();
    });

    // Open hexagon panel
    act(() => {
      result.current.openHexagonPanel();
    });

    expect(result.current.isCollapsed).toBe(true);
    expect(result.current.panelMode).toBe('hexagon-panel');
  });
});
