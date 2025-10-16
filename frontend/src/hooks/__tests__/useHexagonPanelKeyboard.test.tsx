import { renderHook } from '@testing-library/react';
import { useHexagonPanelKeyboard } from '../useHexagonPanelKeyboard';
import { useSidebar } from '@/contexts/SidebarContext';

// Mock the SidebarContext
jest.mock('@/contexts/SidebarContext', () => ({
  useSidebar: jest.fn(),
}));

describe('useHexagonPanelKeyboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls openHexagonPanel on Ctrl+Space', () => {
    const mockOpenHexagonPanel = jest.fn();
    const mockCloseHexagonPanel = jest.fn();

    (useSidebar as jest.Mock).mockReturnValue({
      panelMode: 'normal',
      openHexagonPanel: mockOpenHexagonPanel,
      closeHexagonPanel: mockCloseHexagonPanel,
    });

    renderHook(() => useHexagonPanelKeyboard());

    // Simulate Ctrl+Space
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockOpenHexagonPanel).toHaveBeenCalledTimes(1);
  });

  it('calls openHexagonPanel on Cmd+Space (Mac)', () => {
    const mockOpenHexagonPanel = jest.fn();
    const mockCloseHexagonPanel = jest.fn();

    (useSidebar as jest.Mock).mockReturnValue({
      panelMode: 'normal',
      openHexagonPanel: mockOpenHexagonPanel,
      closeHexagonPanel: mockCloseHexagonPanel,
    });

    renderHook(() => useHexagonPanelKeyboard());

    // Simulate Cmd+Space
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockOpenHexagonPanel).toHaveBeenCalledTimes(1);
  });

  it('calls closeHexagonPanel on ESC when in hexagon-panel mode', () => {
    const mockOpenHexagonPanel = jest.fn();
    const mockCloseHexagonPanel = jest.fn();

    (useSidebar as jest.Mock).mockReturnValue({
      panelMode: 'hexagon-panel',
      openHexagonPanel: mockOpenHexagonPanel,
      closeHexagonPanel: mockCloseHexagonPanel,
    });

    renderHook(() => useHexagonPanelKeyboard());

    // Simulate ESC
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(mockCloseHexagonPanel).toHaveBeenCalledTimes(1);
  });

  it('does NOT call closeHexagonPanel on ESC when in normal mode', () => {
    const mockOpenHexagonPanel = jest.fn();
    const mockCloseHexagonPanel = jest.fn();

    (useSidebar as jest.Mock).mockReturnValue({
      panelMode: 'normal',
      openHexagonPanel: mockOpenHexagonPanel,
      closeHexagonPanel: mockCloseHexagonPanel,
    });

    renderHook(() => useHexagonPanelKeyboard());

    // Simulate ESC
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    window.dispatchEvent(event);

    // Should NOT close hexagon panel when in normal mode (ESC is for sidebar toggle)
    expect(mockCloseHexagonPanel).not.toHaveBeenCalled();
  });

  it('prevents default on Ctrl/Cmd+Space to avoid browser behavior', () => {
    const mockOpenHexagonPanel = jest.fn();

    (useSidebar as jest.Mock).mockReturnValue({
      panelMode: 'normal',
      openHexagonPanel: mockOpenHexagonPanel,
      closeHexagonPanel: jest.fn(),
    });

    renderHook(() => useHexagonPanelKeyboard());

    const event = new KeyboardEvent('keydown', {
      key: ' ',
      ctrlKey: true,
      bubbles: true,
    });

    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const mockOpenHexagonPanel = jest.fn();

    (useSidebar as jest.Mock).mockReturnValue({
      panelMode: 'normal',
      openHexagonPanel: mockOpenHexagonPanel,
      closeHexagonPanel: jest.fn(),
    });

    const { unmount } = renderHook(() => useHexagonPanelKeyboard());

    unmount();

    // Try to trigger event after unmount
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    // Should not call handler after unmount
    expect(mockOpenHexagonPanel).not.toHaveBeenCalled();
  });
});
