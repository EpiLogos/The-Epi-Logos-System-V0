/**
 * Pratibimba IndexedDB Schema
 * Dexie wrapper for local-first Personal Pratibimba storage
 */

import Dexie, { Table } from 'dexie';
import type { PersonalPratibimba, SyncQueueItem } from './pratibimba.types';

export class PratibimbaDatabase extends Dexie {
  pratibimba!: Table<PersonalPratibimba, string>; // userId as primary key
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('EpiLogosPratibimba');

    this.version(1).stores({
      pratibimba: 'userId, lastModified, archetypalPhase',
      syncQueue: '++id, timestamp, synced, action'
    });
  }
}

// Singleton instance
export const pratibimbaDB = new PratibimbaDatabase();
