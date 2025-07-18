/**
 * Universal Sync Manager for AI Dating Coach
 * Handles cross-platform data synchronization
 */

interface SyncConfig {
  apiUrl: string;
  userId: string;
  deviceId: string;
  platform: 'mobile' | 'web' | 'extension';
  authToken: string;
  syncInterval?: number;
  retryAttempts?: number;
  batchSize?: number;
}

interface SyncData {
  id: string;
  dataType: string;
  data: any;
  timestamp: number;
  version: number;
  baseVersion?: number;
  operation: 'create' | 'update' | 'delete';
}

interface ConflictData {
  id: string;
  dataType: string;
  dataId: string;
  versions: Array<{
    version: number;
    data: any;
    timestamp: number;
    platform: string;
    deviceId: string;
  }>;
  severity: 'low' | 'medium' | 'high';
  suggestedStrategy: string;
  createdAt: number;
}

interface SyncResult {
  success: boolean;
  changes?: any;
  conflicts?: ConflictData[];
  hasMore?: boolean;
  lastSyncTimestamp?: number;
  totalChanges?: number;
  error?: string;
}

type SyncEventType = 'sync_start' | 'sync_complete' | 'sync_error' | 'conflict_detected' | 'data_updated';

interface SyncEventListener {
  (event: SyncEventType, data?: any): void;
}

class SyncManager {
  private config: SyncConfig;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private lastSyncTimestamp: number = 0;
  private pendingChanges: Map<string, SyncData> = new Map();
  private eventListeners: Map<SyncEventType, SyncEventListener[]> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private retryQueue: SyncData[] = [];
  private storage: Storage | any;

  constructor(config: SyncConfig) {
    this.config = {
      syncInterval: 30000, // 30 seconds default
      retryAttempts: 3,
      batchSize: 50,
      ...config
    };

    // Initialize storage based on platform
    this.initializeStorage();
    
    // Load last sync timestamp
    this.loadLastSyncTimestamp();
    
    // Setup network monitoring
    this.setupNetworkMonitoring();
    
    // Start periodic sync
    this.startPeriodicSync();
  }

  /**
   * Initialize storage based on platform
   */
  private initializeStorage() {
    if (typeof window !== 'undefined') {
      // Browser environment
      this.storage = window.localStorage;
    } else if (typeof global !== 'undefined' && global.require) {
      // React Native environment
      try {
        const AsyncStorage = global.require('@react-native-async-storage/async-storage');
        this.storage = {
          getItem: async (key: string) => await AsyncStorage.getItem(key),
          setItem: async (key: string, value: string) => await AsyncStorage.setItem(key, value),
          removeItem: async (key: string) => await AsyncStorage.removeItem(key)
        };
      } catch (error) {
        console.warn('AsyncStorage not available, using memory storage');
        this.storage = new Map();
      }
    } else {
      // Fallback to memory storage
      this.storage = new Map();
    }
  }

  /**
   * Load last sync timestamp from storage
   */
  private async loadLastSyncTimestamp() {
    try {
      const stored = await this.getStorageItem('lastSyncTimestamp');
      if (stored) {
        this.lastSyncTimestamp = parseInt(stored, 10);
      }
    } catch (error) {
      console.warn('Failed to load last sync timestamp:', error);
    }
  }

  /**
   * Save last sync timestamp to storage
   */
  private async saveLastSyncTimestamp(timestamp: number) {
    try {
      this.lastSyncTimestamp = timestamp;
      await this.setStorageItem('lastSyncTimestamp', timestamp.toString());
    } catch (error) {
      console.warn('Failed to save last sync timestamp:', error);
    }
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring() {
    if (typeof window !== 'undefined') {
      // Browser environment
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.triggerSync();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
      
      this.isOnline = navigator.onLine;
    } else {
      // Assume online for non-browser environments
      this.isOnline = true;
    }
  }

  /**
   * Start periodic synchronization
   */
  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.triggerSync();
      }
    }, this.config.syncInterval);
  }

  /**
   * Stop periodic synchronization
   */
  public stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(event: SyncEventType, listener: SyncEventListener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: SyncEventType, listener: SyncEventListener) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: SyncEventType, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event, data);
        } catch (error) {
          console.error('Error in sync event listener:', error);
        }
      });
    }
  }

  /**
   * Queue data for synchronization
   */
  public queueChange(dataType: string, dataId: string, data: any, operation: 'create' | 'update' | 'delete' = 'update') {
    const changeId = `${dataType}_${dataId}`;
    const syncData: SyncData = {
      id: changeId,
      dataType,
      data,
      timestamp: Date.now(),
      version: 1,
      operation
    };

    this.pendingChanges.set(changeId, syncData);
    
    // Trigger sync if online
    if (this.isOnline) {
      this.debouncedSync();
    }
  }

  /**
   * Debounced sync to avoid too frequent sync calls
   */
  private debouncedSync = this.debounce(() => {
    this.triggerSync();
  }, 1000);

  /**
   * Trigger immediate synchronization
   */
  public async triggerSync(): Promise<SyncResult> {
    if (this.isSyncing || !this.isOnline) {
      return { success: false, error: 'Sync already in progress or offline' };
    }

    this.isSyncing = true;
    this.emitEvent('sync_start');

    try {
      // First, pull changes from server
      const pullResult = await this.pullChanges();
      
      if (!pullResult.success) {
        throw new Error(pullResult.error || 'Pull sync failed');
      }

      // Then, push local changes
      const pushResult = await this.pushChanges();
      
      if (!pushResult.success) {
        throw new Error(pushResult.error || 'Push sync failed');
      }

      // Update last sync timestamp
      await this.saveLastSyncTimestamp(Date.now());

      const result: SyncResult = {
        success: true,
        changes: pullResult.changes,
        conflicts: pullResult.conflicts,
        hasMore: pullResult.hasMore,
        lastSyncTimestamp: this.lastSyncTimestamp,
        totalChanges: pullResult.totalChanges
      };

      this.emitEvent('sync_complete', result);
      return result;

    } catch (error) {
      const errorResult: SyncResult = {
        success: false,
        error: error.message
      };

      this.emitEvent('sync_error', errorResult);
      return errorResult;

    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pull changes from server
   */
  private async pullChanges(): Promise<SyncResult> {
    try {
      const response = await this.makeRequest('/sync', {
        method: 'POST',
        body: JSON.stringify({
          userId: this.config.userId,
          platform: this.config.platform,
          deviceId: this.config.deviceId,
          lastSyncTimestamp: this.lastSyncTimestamp,
          operation: 'pull'
        })
      });

      if (!response.success) {
        throw new Error(response.error || 'Pull sync failed');
      }

      // Process received changes
      if (response.result.changes) {
        await this.processIncomingChanges(response.result.changes);
      }

      // Handle conflicts
      if (response.result.conflicts && response.result.conflicts.length > 0) {
        this.emitEvent('conflict_detected', response.result.conflicts);
      }

      return response.result;

    } catch (error) {
      console.error('Pull sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Push local changes to server
   */
  private async pushChanges(): Promise<SyncResult> {
    if (this.pendingChanges.size === 0 && this.retryQueue.length === 0) {
      return { success: true };
    }

    try {
      // Combine pending changes and retry queue
      const allChanges = [
        ...Array.from(this.pendingChanges.values()),
        ...this.retryQueue
      ];

      // Split into batches
      const batches = this.chunkArray(allChanges, this.config.batchSize!);
      let totalSuccessful = 0;
      let totalFailed = 0;
      const errors: any[] = [];

      for (const batch of batches) {
        try {
          const response = await this.makeRequest('/sync', {
            method: 'POST',
            body: JSON.stringify({
              userId: this.config.userId,
              platform: this.config.platform,
              deviceId: this.config.deviceId,
              operation: 'push',
              data: { changes: batch }
            })
          });

          if (response.success) {
            totalSuccessful += response.result.successful || 0;
            totalFailed += response.result.failed || 0;
            
            if (response.result.errors) {
              errors.push(...response.result.errors);
            }

            // Remove successfully synced changes
            batch.forEach(change => {
              this.pendingChanges.delete(change.id);
            });

          } else {
            // Add failed batch to retry queue
            this.retryQueue.push(...batch);
            totalFailed += batch.length;
          }

        } catch (error) {
          // Add failed batch to retry queue
          this.retryQueue.push(...batch);
          totalFailed += batch.length;
          errors.push({ batch: batch.length, error: error.message });
        }
      }

      // Clear retry queue of successfully processed items
      this.retryQueue = this.retryQueue.filter(item => 
        !allChanges.some(change => change.id === item.id)
      );

      return {
        success: totalFailed === 0,
        totalChanges: totalSuccessful + totalFailed,
        error: errors.length > 0 ? `${totalFailed} changes failed` : undefined
      };

    } catch (error) {
      console.error('Push sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process incoming changes from server
   */
  private async processIncomingChanges(changes: any) {
    for (const [dataType, typeChanges] of Object.entries(changes)) {
      if (Array.isArray((typeChanges as any).changes)) {
        for (const change of (typeChanges as any).changes) {
          await this.applyIncomingChange(dataType, change);
        }
      }
    }
  }

  /**
   * Apply incoming change to local data
   */
  private async applyIncomingChange(dataType: string, change: any) {
    try {
      // Store the change locally
      await this.storeLocalData(dataType, change.data_id, change.data);
      
      // Emit data updated event
      this.emitEvent('data_updated', {
        dataType,
        dataId: change.data_id,
        data: change.data,
        source: 'remote'
      });

    } catch (error) {
      console.error('Failed to apply incoming change:', error);
    }
  }

  /**
   * Resolve conflict
   */
  public async resolveConflict(conflictId: string, resolution: 'merge' | 'override' | 'manual', resolvedData?: any): Promise<boolean> {
    try {
      const response = await this.makeRequest('/sync', {
        method: 'POST',
        body: JSON.stringify({
          userId: this.config.userId,
          platform: this.config.platform,
          deviceId: this.config.deviceId,
          operation: 'conflict_resolution',
          data: {
            resolutions: [{
              conflictId,
              resolution,
              resolvedData,
              timestamp: Date.now()
            }]
          }
        })
      });

      return response.success;

    } catch (error) {
      console.error('Conflict resolution error:', error);
      return false;
    }
  }

  /**
   * Get sync status
   */
  public getSyncStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTimestamp: this.lastSyncTimestamp,
      pendingChanges: this.pendingChanges.size,
      retryQueueSize: this.retryQueue.length
    };
  }

  /**
   * Force full sync
   */
  public async forceFullSync(): Promise<SyncResult> {
    this.lastSyncTimestamp = 0;
    await this.saveLastSyncTimestamp(0);
    return this.triggerSync();
  }

  /**
   * Clear all local data
   */
  public async clearLocalData() {
    this.pendingChanges.clear();
    this.retryQueue = [];
    this.lastSyncTimestamp = 0;
    await this.saveLastSyncTimestamp(0);
  }

  /**
   * Make HTTP request to sync API
   */
  private async makeRequest(endpoint: string, options: RequestInit): Promise<any> {
    const url = `${this.config.apiUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.authToken}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Storage abstraction methods
   */
  private async getStorageItem(key: string): Promise<string | null> {
    if (this.storage instanceof Map) {
      return this.storage.get(key) || null;
    } else if (this.storage.getItem) {
      return await this.storage.getItem(key);
    }
    return null;
  }

  private async setStorageItem(key: string, value: string): Promise<void> {
    if (this.storage instanceof Map) {
      this.storage.set(key, value);
    } else if (this.storage.setItem) {
      await this.storage.setItem(key, value);
    }
  }

  private async removeStorageItem(key: string): Promise<void> {
    if (this.storage instanceof Map) {
      this.storage.delete(key);
    } else if (this.storage.removeItem) {
      await this.storage.removeItem(key);
    }
  }

  /**
   * Store data locally
   */
  private async storeLocalData(dataType: string, dataId: string, data: any): Promise<void> {
    const key = `sync_${dataType}_${dataId}`;
    await this.setStorageItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
      synced: true
    }));
  }

  /**
   * Get local data
   */
  public async getLocalData(dataType: string, dataId: string): Promise<any> {
    const key = `sync_${dataType}_${dataId}`;
    const stored = await this.getStorageItem(key);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.data;
      } catch (error) {
        console.error('Failed to parse stored data:', error);
      }
    }
    
    return null;
  }

  /**
   * Utility methods
   */
  private debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Cleanup resources
   */
  public destroy() {
    this.stopPeriodicSync();
    this.eventListeners.clear();
    this.pendingChanges.clear();
    this.retryQueue = [];
  }
}

export default SyncManager;
export type { SyncConfig, SyncData, ConflictData, SyncResult, SyncEventType, SyncEventListener };

