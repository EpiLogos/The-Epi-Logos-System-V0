/**
 * usePratibimba Hook Tests
 * Testing React hook with Dexie integration (mocked)
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePratibimba } from '../usePratibimba';
import { pratibimbaDB } from '@/domains/pratibimba/pratibimba-db';
import { createPratibimbaSeed } from '@/domains/pratibimba/pratibimba.types';

// Mock Dexie database
jest.mock('@/domains/pratibimba/pratibimba-db', () => ({
  pratibimbaDB: {
    pratibimba: {
      get: jest.fn(),
      add: jest.fn(),
      update: jest.fn()
    },
    syncQueue: {
      add: jest.fn()
    }
  }
}));

// Mock useLiveQuery from dexie-react-hooks
jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: () => Promise<any>) => {
    const [data, setData] = React.useState(undefined);
    React.useEffect(() => {
      fn().then(setData);
    }, [fn]);
    return data;
  }
}));

import React from 'react';

describe('usePratibimba Hook', () => {
  const testUserId = 'test-user-123';
  const mockPratibimba = createPratibimbaSeed(testUserId);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize Pratibimba for new user', async () => {
    (pratibimbaDB.pratibimba.get as jest.Mock).mockResolvedValue(null);
    (pratibimbaDB.pratibimba.add as jest.Mock).mockResolvedValue(1);

    const { result } = renderHook(() => usePratibimba(testUserId));

    await act(async () => {
      await result.current.initializePratibimba();
    });

    expect(pratibimbaDB.pratibimba.add).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: testUserId,
        archetypalPhase: 'Initial Awakening'
      })
    );
  });

  it('should not reinitialize existing Pratibimba', async () => {
    (pratibimbaDB.pratibimba.get as jest.Mock).mockResolvedValue(mockPratibimba);

    const { result } = renderHook(() => usePratibimba(testUserId));

    await act(async () => {
      await result.current.initializePratibimba();
    });

    expect(pratibimbaDB.pratibimba.add).not.toHaveBeenCalled();
  });

  it('should update Pratibimba and queue for sync', async () => {
    (pratibimbaDB.pratibimba.get as jest.Mock).mockResolvedValue(mockPratibimba);
    (pratibimbaDB.pratibimba.update as jest.Mock).mockResolvedValue(1);
    (pratibimbaDB.syncQueue.add as jest.Mock).mockResolvedValue(1);

    const { result } = renderHook(() => usePratibimba(testUserId));

    await act(async () => {
      await result.current.updatePratibimba({
        archetypalPhase: 'Active Engagement'
      });
    });

    expect(pratibimbaDB.pratibimba.update).toHaveBeenCalledWith(
      testUserId,
      expect.objectContaining({
        archetypalPhase: 'Active Engagement',
        version: mockPratibimba.version + 1
      })
    );

    expect(pratibimbaDB.syncQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'update',
        synced: false
      })
    );
  });

  it('should record journal interaction', async () => {
    (pratibimbaDB.pratibimba.get as jest.Mock).mockResolvedValue(mockPratibimba);
    (pratibimbaDB.pratibimba.update as jest.Mock).mockResolvedValue(1);

    const { result } = renderHook(() => usePratibimba(testUserId));

    // Wait for pratibimba to load
    await waitFor(() => {
      expect(result.current.pratibimba).toBeDefined();
    });

    await act(async () => {
      await result.current.recordInteraction('journal', {
        content: 'Exploring #1 Paramasiva'
      });
    });

    expect(pratibimbaDB.pratibimba.update).toHaveBeenCalled();
  });

  it('should export Pratibimba data', async () => {
    (pratibimbaDB.pratibimba.get as jest.Mock).mockResolvedValue(mockPratibimba);

    const { result } = renderHook(() => usePratibimba(testUserId));

    await waitFor(() => {
      expect(result.current.pratibimba).toBeDefined();
    });

    let blob: Blob | undefined;
    await act(async () => {
      blob = await result.current.exportData('json');
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob!.type).toBe('application/json');
  });
});
