/**
 * Pratibimba Sync Service
 * Handles cloud synchronization with encryption for active sessions
 * Local IndexedDB is source of truth, Redis Cloud is temporary cache
 */

'use client';

import { pratibimbaDB } from '@/domains/pratibimba/pratibimba-db';
import type { PersonalPratibimba } from '@/domains/pratibimba/pratibimba.types';

export class PratibimbaSync {
  private syncIntervalId: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds

  /**
   * Start sync session: upload to Redis Cloud
   * Does NOT update IndexedDB to avoid triggering reactive queries
   */
  async syncToCloud(userId: string, authToken: string): Promise<void> {
    try {
      const local = await pratibimbaDB.pratibimba.get(userId);
      if (!local || local.syncState.localOnly) {
        console.log('Pratibimba sync skipped: localOnly or not found');
        return;
      }

      // Encrypt before upload (simplified for now - using base64)
      const encrypted = await this.encrypt(local);

      const response = await fetch('/api/pratibimba/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ userId, data: encrypted })
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      // DO NOT update IndexedDB here - it triggers useLiveQuery and causes infinite loops
      // The component managing sync should update state separately if needed
      console.log('Pratibimba synced to cloud successfully');
    } catch (error) {
      console.error('Failed to sync Pratibimba to cloud:', error);
      throw error;
    }
  }

  /**
   * Process pending changes from sync queue
   * Runs in background during active session
   */
  async processSyncQueue(userId: string, authToken: string): Promise<void> {
    try {
      // Use filter instead of where().equals() for boolean values
      const pending = await pratibimbaDB.syncQueue
        .filter(item => item.synced === false)
        .toArray();

      if (pending.length === 0) {
        return;
      }

      console.log(`Processing ${pending.length} pending sync items`);

      for (const item of pending) {
        try {
          // Encrypt data before sending
          const encrypted = await this.encrypt(item.data);

          const response = await fetch('/api/pratibimba/update', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({ userId, data: encrypted })
          });

          if (response.ok) {
            // Mark as synced
            await pratibimbaDB.syncQueue.update(item.id!, { synced: true });
          } else {
            console.warn('Sync item failed, will retry:', item.id);
          }
        } catch (error) {
          console.error('Failed to sync item', item.id, error);
          // Keep in queue for retry
        }
      }

      // Clean up synced items older than 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await pratibimbaDB.syncQueue
        .where('timestamp')
        .below(oneDayAgo)
        .and((item) => item.synced === true)
        .delete();
    } catch (error) {
      console.error('Failed to process sync queue:', error);
    }
  }

  /**
   * Start background sync (runs every 30 seconds)
   */
  startBackgroundSync(userId: string, authToken: string): void {
    if (this.syncIntervalId) {
      console.warn('Background sync already running');
      return;
    }

    console.log('Starting Pratibimba background sync');

    // Initial sync
    this.processSyncQueue(userId, authToken);

    // Schedule periodic sync
    this.syncIntervalId = setInterval(() => {
      this.processSyncQueue(userId, authToken);
    }, this.SYNC_INTERVAL);
  }

  /**
   * Stop background sync (on session end)
   */
  stopBackgroundSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log('Background sync stopped');
    }
  }

  /**
   * Manually purge cloud data (user-initiated)
   */
  async purgeCloudData(userId: string, authToken: string): Promise<void> {
    try {
      const response = await fetch(`/api/pratibimba/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Purge failed: ${response.statusText}`);
      }

      // Update local sync state
      const local = await pratibimbaDB.pratibimba.get(userId);
      if (local) {
        await pratibimbaDB.pratibimba.update(userId, {
          syncState: {
            ...local.syncState,
            cloudActive: false
          }
        });
      }

      console.log('Cloud Pratibimba purged successfully');
    } catch (error) {
      console.error('Failed to purge cloud Pratibimba:', error);
      throw error;
    }
  }

  /**
   * Simple encryption using base64 (placeholder for Web Crypto API)
   * TODO: Implement proper Web Crypto API encryption in production
   */
  private async encrypt(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    return btoa(jsonString); // Simple base64 encoding for now
  }

  /**
   * Simple decryption (placeholder)
   */
  private async decrypt(encrypted: string): Promise<any> {
    const jsonString = atob(encrypted);
    return JSON.parse(jsonString);
  }
}

// Singleton instance
export const pratibimbaSync = new PratibimbaSync();
