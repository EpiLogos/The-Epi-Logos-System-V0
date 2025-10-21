/**
 * usePratibimba Hook
 * React hook for Personal Pratibimba management with Dexie integration
 * Provides local-first data access with cloud sync coordination
 */

'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect } from 'react';
import { pratibimbaDB } from '@/domains/pratibimba/pratibimba-db';
import {
  updatePratibimbaGrowth,
  addKnowledgeConnection,
  exportPratibimba
} from '@/domains/pratibimba/pratibimba.domain';
import type { PersonalPratibimba } from '@/domains/pratibimba/pratibimba.types';
import { createPratibimbaSeed } from '@/domains/pratibimba/pratibimba.types';

export interface UsePratibimbaReturn {
  pratibimba: PersonalPratibimba | undefined;
  loading: boolean;
  updatePratibimba: (updates: Partial<PersonalPratibimba>) => Promise<void>;
  recordInteraction: (
    type: 'journal' | 'oracle' | 'chat',
    data: any
  ) => Promise<void>;
  recordConnection: (from: string, to: string, strength?: number) => Promise<void>;
  exportData: (format?: 'json' | 'encrypted') => Promise<Blob>;
  initializePratibimba: () => Promise<void>;
}

export function usePratibimba(userId: string): UsePratibimbaReturn {
  // Live-updating query from IndexedDB (reactive)
  const pratibimba = useLiveQuery(
    () => pratibimbaDB.pratibimba.get(userId),
    [userId]
  );

  const loading = pratibimba === undefined;

  /**
   * Initialize Pratibimba seed for new users
   */
  const initializePratibimba = useCallback(async () => {
    if (!userId) {
      console.error('Cannot initialize Pratibimba: no userId provided');
      return;
    }

    const existing = await pratibimbaDB.pratibimba.get(userId);
    if (existing) {
      console.log('Pratibimba already exists for user', userId);
      return;
    }

    const seed = createPratibimbaSeed(userId);
    await pratibimbaDB.pratibimba.add(seed);
    console.log('Pratibimba seed created for user', userId);
  }, [userId]);

  /**
   * Update Pratibimba with partial data
   * Queues changes for cloud sync
   */
  const updatePratibimba = useCallback(
    async (updates: Partial<PersonalPratibimba>) => {
      if (!userId) {
        throw new Error('Cannot update Pratibimba: no userId');
      }

      const updated = {
        ...updates,
        lastModified: new Date(),
        version: (pratibimba?.version || 0) + 1
      };

      await pratibimbaDB.pratibimba.update(userId, updated);

      // Queue for cloud sync
      await pratibimbaDB.syncQueue.add({
        action: 'update',
        data: updated,
        timestamp: new Date(),
        synced: false
      });
    },
    [userId, pratibimba?.version]
  );

  /**
   * Record user interaction and update growth patterns
   */
  const recordInteraction = useCallback(
    async (type: 'journal' | 'oracle' | 'chat', data: any) => {
      if (!pratibimba) {
        console.warn('Cannot record interaction: Pratibimba not loaded');
        return;
      }

      const growth = updatePratibimbaGrowth(pratibimba, type, data);
      await updatePratibimba(growth);
    },
    [pratibimba, updatePratibimba]
  );

  /**
   * Record knowledge connection between Bimba coordinates
   */
  const recordConnection = useCallback(
    async (from: string, to: string, strength: number = 1) => {
      if (!pratibimba) {
        console.warn('Cannot record connection: Pratibimba not loaded');
        return;
      }

      const connectionUpdate = addKnowledgeConnection(pratibimba, from, to, strength);
      await updatePratibimba(connectionUpdate);
    },
    [pratibimba, updatePratibimba]
  );

  /**
   * Export Pratibimba data for backup
   */
  const exportData = useCallback(
    async (format: 'json' | 'encrypted' = 'json') => {
      if (!pratibimba) {
        throw new Error('No Pratibimba data to export');
      }

      return exportPratibimba(pratibimba, format);
    },
    [pratibimba]
  );

  return {
    pratibimba,
    loading,
    updatePratibimba,
    recordInteraction,
    recordConnection,
    exportData,
    initializePratibimba
  };
}
