/**
 * useCommunitiesForSession Hook Tests
 * Testing community fetching with MEF resonance analysis
 *
 * Story 08.13 - MEF Resonance Analysis
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCommunitiesForSession } from '../useCommunitiesForSession';
import type { EtymologyCommunity, BimbaResonance } from '@/types/etymology.types';

// Mock fetch globally
global.fetch = jest.fn();

describe('useCommunitiesForSession Hook', () => {
  const testSessionId = 'test-session-123';
  const testUserId = 'test-user-456';

  const mockCommunity: EtymologyCommunity = {
    id: 'comm-1',
    group_id: testUserId,
    name: 'Test Community',
    description: 'Test description',
    quaternal_type: 'three_part' as any,
    words: ['word1', 'word2', 'word3'],
    pie_root: '*test-root',
    semantic_pattern: 'test pattern',
    session_id: testSessionId,
    user_id: testUserId,
    bimba_coordinate: '#2-1-0',
    domain: 'EA',
    formed_at: new Date().toISOString(),
    last_activity: new Date().toISOString()
  };

  const mockResonance: BimbaResonance = {
    id: 'res-1',
    coordinate: '#2-1-0',
    coordinate_name: 'Test Coordinate',
    resonance_type: 'semantic',
    resonance_strength: 0.85,
    description: 'Test resonance',
    detected_via_lens: 'archetypal',
    detected_via_tool: 'semantic_coordinate_discovery',
    reasoning_summary: 'Test reasoning',
    deepseek_reasoning: 'Test deepseek reasoning',
    detected_at: new Date().toISOString(),
    mef_archetypal: { analysis: 'Test archetypal analysis' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should fetch communities successfully', async () => {
    // Mock communities endpoint
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          communities: [mockCommunity]
        })
      })
      // Mock resonances endpoint
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          resonances: [mockResonance]
        })
      });

    const { result } = renderHook(() =>
      useCommunitiesForSession({
        sessionId: testSessionId,
        userId: testUserId,
        enabled: true
      })
    );

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.communities).toHaveLength(1);
    expect(result.current.communities[0].bimba_resonances).toHaveLength(1);
    expect(result.current.communities[0].bimba_resonances![0]).toEqual(mockResonance);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch communities error gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error'
    });

    const { result } = renderHook(() =>
      useCommunitiesForSession({
        sessionId: testSessionId,
        userId: testUserId,
        enabled: true
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.communities).toHaveLength(0);
    expect(result.current.error).toContain('Failed to fetch communities');
  });

  it('should handle resonances fetch error gracefully', async () => {
    // Mock communities endpoint success
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          communities: [mockCommunity]
        })
      })
      // Mock resonances endpoint failure
      .mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

    const { result } = renderHook(() =>
      useCommunitiesForSession({
        sessionId: testSessionId,
        userId: testUserId,
        enabled: true
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should still return community even if resonances fail
    expect(result.current.communities).toHaveLength(1);
    expect(result.current.communities[0].bimba_resonances).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should fetch community resonances independently', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        resonances: [mockResonance]
      })
    });

    const { result } = renderHook(() =>
      useCommunitiesForSession({
        sessionId: testSessionId,
        userId: testUserId,
        enabled: false // Disabled to prevent auto-fetch
      })
    );

    let resonances: BimbaResonance[] = [];
    await act(async () => {
      resonances = await result.current.fetchCommunityResonances('comm-1');
    });

    expect(resonances).toHaveLength(1);
    expect(resonances[0]).toEqual(mockResonance);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/graphiti/etymology/communities/comm-1/resonances?group_id=user-123&user_id=user-123'
    );
  });

  it('should not fetch when sessionId is null', async () => {
    const { result } = renderHook(() =>
      useCommunitiesForSession({
        sessionId: null,
        userId: testUserId,
        enabled: true
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.communities).toHaveLength(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should not fetch when enabled is false', async () => {
    const { result } = renderHook(() =>
      useCommunitiesForSession({
        sessionId: testSessionId,
        userId: testUserId,
        enabled: false
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.communities).toHaveLength(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should refetch communities when refetch is called', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          communities: [mockCommunity]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          resonances: [mockResonance]
        })
      })
      // Second refetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          communities: [mockCommunity, { ...mockCommunity, id: 'comm-2' }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          resonances: []
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          resonances: []
        })
      });

    const { result } = renderHook(() =>
      useCommunitiesForSession({
        sessionId: testSessionId,
        userId: testUserId,
        enabled: true
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.communities).toHaveLength(1);

    // Refetch
    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.communities).toHaveLength(2);
  });
});
