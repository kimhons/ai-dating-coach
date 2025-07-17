import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../config/supabase';
import { TierService } from './TierService';

interface SyncData {
  id: string;
  type: 'analysis' | 'usage' | 'preference' | 'tier';
  data: any;
  timestamp: number;
  platform: 'mobile' | 'web' | 'browser';
  synced: boolean;
  version: number;
}

interface SyncConflict {
  localData: SyncData;
  remoteData: SyncData;
  resolution: 'local' | 'remote' | 'merge';
}

interface SyncStats {
  lastSync: number;
  pendingItems: number;
  conflictsResolved: number;
  syncErrors: number;
  dataTransferred: number;
}

export class SyncService {
  private static instance: SyncService;
  private syncQueue: SyncData[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(stats: SyncStats) => void> = new Set();
  private conflictResolvers: Map<string, (conflict: SyncConflict) => Promise<SyncData>> = new Map();

  private constructor() {
    this.initializeNetworkListener();
    this.loadPendingSyncData();
    this.startPeriodicSync();
    this.setupConflictResolvers();
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Initialize network connectivity monitoring
   */
  private initializeNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (!wasOnline && this.isOnline) {
        // Came back online, trigger sync
        this.performSync();
      }
    });
  }

  /**
   * Load pending sync data from local storage
   */
  private async loadPendingSyncData(): Promise<void> {
    try {
      const pendingData = await AsyncStorage.getItem('sync_queue');
      if (pendingData) {
        this.syncQueue = JSON.parse(pendingData);
        console.log(`Loaded ${this.syncQueue.length} pending sync items`);
      }
    } catch (error) {
      console.error('Error loading pending sync data:', error);
    }
  }

  /**
   * Save pending sync data to local storage
   */
  private async savePendingSyncData(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving pending sync data:', error);
    }
  }

  /**
   * Start periodic sync every 30 seconds
   */
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.performSync();
      }
    }, 30000);
  }

  /**
   * Setup conflict resolution strategies
   */
  private setupConflictResolvers(): void {
    // Analysis data: prefer most recent
    this.conflictResolvers.set('analysis', async (conflict) => {
      return conflict.localData.timestamp > conflict.remoteData.timestamp 
        ? conflict.localData 
        : conflict.remoteData;
    });

    // Usage data: merge counts
    this.conflictResolvers.set('usage', async (conflict) => {
      const mergedData = {
        ...conflict.localData,
        data: {
          ...conflict.localData.data,
          ...conflict.remoteData.data,
          // Sum usage counts
          screenshot_analyses: (conflict.localData.data.screenshot_analyses || 0) + 
                              (conflict.remoteData.data.screenshot_analyses || 0),
          keyboard_suggestions: (conflict.localData.data.keyboard_suggestions || 0) + 
                               (conflict.remoteData.data.keyboard_suggestions || 0),
          photo_analyses: (conflict.localData.data.photo_analyses || 0) + 
                         (conflict.remoteData.data.photo_analyses || 0),
          conversation_analyses: (conflict.localData.data.conversation_analyses || 0) + 
                                (conflict.remoteData.data.conversation_analyses || 0),
        },
        timestamp: Math.max(conflict.localData.timestamp, conflict.remoteData.timestamp),
        version: Math.max(conflict.localData.version, conflict.remoteData.version) + 1
      };
      return mergedData;
    });

    // Preferences: prefer most recent
    this.conflictResolvers.set('preference', async (conflict) => {
      return conflict.localData.timestamp > conflict.remoteData.timestamp 
        ? conflict.localData 
        : conflict.remoteData;
    });

    // Tier data: prefer remote (authoritative)
    this.conflictResolvers.set('tier', async (conflict) => {
      return conflict.remoteData;
    });
  }

  /**
   * Add data to sync queue
   */
  public async queueSync(type: SyncData['type'], data: any, id?: string): Promise<void> {
    const syncItem: SyncData = {
      id: id || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      platform: 'mobile',
      synced: false,
      version: 1
    };

    this.syncQueue.push(syncItem);
    await this.savePendingSyncData();

    // Trigger immediate sync if online
    if (this.isOnline && !this.isSyncing) {
      this.performSync();
    }
  }

  /**
   * Perform synchronization with remote server
   */
  public async performSync(): Promise<SyncStats> {
    if (this.isSyncing || !this.isOnline) {
      return this.getSyncStats();
    }

    this.isSyncing = true;
    const startTime = Date.now();
    let syncErrors = 0;
    let conflictsResolved = 0;
    let dataTransferred = 0;

    try {
      console.log(`Starting sync with ${this.syncQueue.length} pending items`);

      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session for sync');
      }

      // Upload pending local changes
      const uploadResults = await this.uploadLocalChanges(session.user.id);
      syncErrors += uploadResults.errors;
      dataTransferred += uploadResults.dataTransferred;

      // Download remote changes
      const downloadResults = await this.downloadRemoteChanges(session.user.id);
      syncErrors += downloadResults.errors;
      conflictsResolved += downloadResults.conflictsResolved;
      dataTransferred += downloadResults.dataTransferred;

      // Update sync stats
      const syncStats: SyncStats = {
        lastSync: Date.now(),
        pendingItems: this.syncQueue.filter(item => !item.synced).length,
        conflictsResolved,
        syncErrors,
        dataTransferred
      };

      await this.saveSyncStats(syncStats);
      this.notifyListeners(syncStats);

      console.log(`Sync completed in ${Date.now() - startTime}ms:`, syncStats);
      return syncStats;

    } catch (error) {
      console.error('Sync error:', error);
      syncErrors++;
      
      const errorStats: SyncStats = {
        lastSync: Date.now(),
        pendingItems: this.syncQueue.length,
        conflictsResolved,
        syncErrors,
        dataTransferred
      };

      this.notifyListeners(errorStats);
      return errorStats;

    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Upload local changes to remote server
   */
  private async uploadLocalChanges(userId: string): Promise<{ errors: number; dataTransferred: number }> {
    let errors = 0;
    let dataTransferred = 0;
    const unsyncedItems = this.syncQueue.filter(item => !item.synced);

    for (const item of unsyncedItems) {
      try {
        const { error } = await supabase
          .from('sync_data')
          .upsert({
            id: item.id,
            user_id: userId,
            type: item.type,
            data: item.data,
            timestamp: new Date(item.timestamp).toISOString(),
            platform: item.platform,
            version: item.version
          });

        if (error) {
          console.error(`Upload error for ${item.id}:`, error);
          errors++;
        } else {
          item.synced = true;
          dataTransferred += JSON.stringify(item.data).length;
        }
      } catch (error) {
        console.error(`Upload exception for ${item.id}:`, error);
        errors++;
      }
    }

    // Remove synced items from queue
    this.syncQueue = this.syncQueue.filter(item => !item.synced);
    await this.savePendingSyncData();

    return { errors, dataTransferred };
  }

  /**
   * Download remote changes from server
   */
  private async downloadRemoteChanges(userId: string): Promise<{ 
    errors: number; 
    conflictsResolved: number; 
    dataTransferred: number 
  }> {
    let errors = 0;
    let conflictsResolved = 0;
    let dataTransferred = 0;

    try {
      // Get last sync timestamp
      const lastSync = await this.getLastSyncTimestamp();
      
      // Fetch remote changes since last sync
      const { data: remoteChanges, error } = await supabase
        .from('sync_data')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', new Date(lastSync).toISOString())
        .neq('platform', 'mobile'); // Exclude our own changes

      if (error) {
        console.error('Download error:', error);
        errors++;
        return { errors, conflictsResolved, dataTransferred };
      }

      // Process each remote change
      for (const remoteItem of remoteChanges || []) {
        try {
          const localItem = await this.getLocalData(remoteItem.id, remoteItem.type);
          
          if (localItem) {
            // Conflict detected, resolve it
            const conflict: SyncConflict = {
              localData: localItem,
              remoteData: {
                id: remoteItem.id,
                type: remoteItem.type,
                data: remoteItem.data,
                timestamp: new Date(remoteItem.timestamp).getTime(),
                platform: remoteItem.platform,
                synced: true,
                version: remoteItem.version
              },
              resolution: 'merge'
            };

            const resolvedData = await this.resolveConflict(conflict);
            await this.saveLocalData(resolvedData);
            conflictsResolved++;
          } else {
            // No conflict, save remote data locally
            await this.saveLocalData({
              id: remoteItem.id,
              type: remoteItem.type,
              data: remoteItem.data,
              timestamp: new Date(remoteItem.timestamp).getTime(),
              platform: remoteItem.platform,
              synced: true,
              version: remoteItem.version
            });
          }

          dataTransferred += JSON.stringify(remoteItem.data).length;
        } catch (error) {
          console.error(`Processing error for ${remoteItem.id}:`, error);
          errors++;
        }
      }

    } catch (error) {
      console.error('Download exception:', error);
      errors++;
    }

    return { errors, conflictsResolved, dataTransferred };
  }

  /**
   * Resolve sync conflict using appropriate strategy
   */
  private async resolveConflict(conflict: SyncConflict): Promise<SyncData> {
    const resolver = this.conflictResolvers.get(conflict.localData.type);
    if (resolver) {
      return await resolver(conflict);
    }

    // Default: prefer most recent
    return conflict.localData.timestamp > conflict.remoteData.timestamp 
      ? conflict.localData 
      : conflict.remoteData;
  }

  /**
   * Get local data by ID and type
   */
  private async getLocalData(id: string, type: string): Promise<SyncData | null> {
    try {
      const key = `local_${type}_${id}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting local data:', error);
      return null;
    }
  }

  /**
   * Save data locally
   */
  private async saveLocalData(data: SyncData): Promise<void> {
    try {
      const key = `local_${data.type}_${data.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving local data:', error);
    }
  }

  /**
   * Get last sync timestamp
   */
  private async getLastSyncTimestamp(): Promise<number> {
    try {
      const timestamp = await AsyncStorage.getItem('last_sync_timestamp');
      return timestamp ? parseInt(timestamp) : Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return Date.now() - 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Save sync statistics
   */
  private async saveSyncStats(stats: SyncStats): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_stats', JSON.stringify(stats));
      await AsyncStorage.setItem('last_sync_timestamp', stats.lastSync.toString());
    } catch (error) {
      console.error('Error saving sync stats:', error);
    }
  }

  /**
   * Get current sync statistics
   */
  public async getSyncStats(): Promise<SyncStats> {
    try {
      const stats = await AsyncStorage.getItem('sync_stats');
      if (stats) {
        return JSON.parse(stats);
      }
    } catch (error) {
      console.error('Error getting sync stats:', error);
    }

    return {
      lastSync: 0,
      pendingItems: this.syncQueue.length,
      conflictsResolved: 0,
      syncErrors: 0,
      dataTransferred: 0
    };
  }

  /**
   * Add sync status listener
   */
  public addSyncListener(listener: (stats: SyncStats) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove sync status listener
   */
  public removeSyncListener(listener: (stats: SyncStats) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of sync status change
   */
  private notifyListeners(stats: SyncStats): void {
    this.listeners.forEach(listener => {
      try {
        listener(stats);
      } catch (error) {
        console.error('Error notifying sync listener:', error);
      }
    });
  }

  /**
   * Force immediate sync
   */
  public async forceSync(): Promise<SyncStats> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    if (!this.isOnline) {
      throw new Error('No internet connection');
    }

    return await this.performSync();
  }

  /**
   * Clear all sync data (for logout/reset)
   */
  public async clearSyncData(): Promise<void> {
    try {
      this.syncQueue = [];
      await AsyncStorage.multiRemove([
        'sync_queue',
        'sync_stats',
        'last_sync_timestamp'
      ]);

      // Clear all local sync data
      const keys = await AsyncStorage.getAllKeys();
      const syncKeys = keys.filter(key => key.startsWith('local_'));
      if (syncKeys.length > 0) {
        await AsyncStorage.multiRemove(syncKeys);
      }

      console.log('Sync data cleared');
    } catch (error) {
      console.error('Error clearing sync data:', error);
    }
  }

  /**
   * Get sync status
   */
  public getSyncStatus(): {
    isOnline: boolean;
    isSyncing: boolean;
    pendingItems: number;
  } {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingItems: this.syncQueue.length
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance();

