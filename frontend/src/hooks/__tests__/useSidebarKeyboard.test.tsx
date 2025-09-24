import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useSidebarKeyboard } from '../useSidebarKeyboard';
import { SidebarProvider } from '@/contexts/SidebarContext';

// Mock the SidebarContext
const mockToggle = jest.fn();
jest.mock('@/contexts/SidebarContext', () => ({
  ...jest.requireActual('@/contexts/SidebarContext'),
  useSidebar: () => ({
    isCollapsed: false,
    toggle: mockToggle,
    collapse: jest.fn(),
    expand: jest.fn(),
  }),
}));

describe('useSidebarKeyboard', () => {
  beforeEach(() => {
    mockToggle.mockClear();
  });

  it('should toggle sidebar when ESC key is pressed', () => {
    renderHook(() => useSidebarKeyboard(), {
      wrapper: SidebarProvider,
    });

    // Simulate ESC key press
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('should not toggle sidebar for other keys', () => {
    renderHook(() => useSidebarKeyboard(), {
      wrapper: SidebarProvider,
    });

    // Simulate other key presses
    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'Space' });
    fireEvent.keyDown(window, { key: 'Tab' });

    expect(mockToggle).not.toHaveBeenCalled();
  });

  it('should prevent default behavior on ESC key', () => {
    renderHook(() => useSidebarKeyboard(), {
      wrapper: SidebarProvider,
    });

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    
    fireEvent(window, event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
