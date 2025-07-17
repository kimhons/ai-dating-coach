import SyncManager, { SyncConfig, SyncData, ConflictData } from '../../shared/sync/SyncManager';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

// Mock window object
Object.defineProperty(window, 'localStorage', {
  value: mockStorage
});

Object.defineProperty(window, 'navigator', {
  value: { onLine: true }
});

describe('SyncManager', () => {
  let syncManager: SyncManager;
  let mockConfig: SyncConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      apiUrl: 'https://api.test.com',
      userId: 'test-user-123',
      deviceId: 'test-device-456',
      platform: 'web',
      authToken: 'test-token-789',
      syncInterval: 1000,
      retryAttempts: 2,
      batchSize: 10
    };

    // Mock successful responses by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          changes: {},
          conflicts: [],
          hasMore: false,
          lastSyncTimestamp: Date.now(),
          totalChanges: 0
        }
      })
    } as Response);

    syncManager = new SyncManager(mockConfig);
  });

  afterEach(() => {
    syncManager.destroy();
  });

  describe('Initialization', () => {
    test('should initialize with correct config', () => {
      const status = syncManager.getSyncStatus();
      expect(status.isOnline).toBe(true);
      expect(status.isSyncing).toBe(false);
      expect(status.pendingChanges).toBe(0);
      expect(status.retryQueueSize).toBe(0);
    });

    test('should load last sync timestamp from storage', async () => {
      mockStorage.getItem.mockResolvedValue('1234567890');
      
      const newSyncManager = new SyncManager(mockConfig);
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockStorage.getItem).toHaveBeenCalledWith('lastSyncTimestamp');
      
      newSyncManager.destroy();
    });

    test('should handle storage errors gracefully', async () => {
      mockStorage.getItem.mockRejectedValue(new Error('Storage error'));
      
      const newSyncManager = new SyncManager(mockConfig);
      
      // Should not throw
      await new Promise(resolve => setTimeout(resolve, 100));
      
      newSyncManager.destroy();
    });
  });

  describe('Event System', () => {
    test('should add and remove event listeners', () => {
      const listener = jest.fn();
      
      syncManager.addEventListener('sync_start', listener);
      syncManager.removeEventListener('sync_start', listener);
      
      // Trigger sync to test if listener was removed
      syncManager.triggerSync();
      
      expect(listener).not.toHaveBeenCalled();
    });

    test('should emit events during sync', async () => {
      const startListener = jest.fn();
      const completeListener = jest.fn();
      
      syncManager.addEventListener('sync_start', startListener);
      syncManager.addEventListener('sync_complete', completeListener);
      
      await syncManager.triggerSync();
      
      expect(startListener).toHaveBeenCalledWith('sync_start');
      expect(completeListener).toHaveBeenCalledWith('sync_complete', expect.any(Object));
    });

    test('should emit error events on sync failure', async () => {
      const errorListener = jest.fn();
      syncManager.addEventListener('sync_error', errorListener);
      
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      await syncManager.triggerSync();
      
      expect(errorListener).toHaveBeenCalledWith('sync_error', expect.objectContaining({
        success: false,
        error: expect.any(String)
      }));
    });

    test('should handle listener errors gracefully', async () => {
      const faultyListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      syncManager.addEventListener('sync_start', faultyListener);
      
      // Should not throw
      await expect(syncManager.triggerSync()).resolves.toBeDefined();
    });
  });

  describe('Data Queuing', () => {
    test('should queue changes for sync', () => {
      const testData = { name: 'John', age: 30 };
      
      syncManager.queueChange('user_profile', 'user-123', testData, 'update');
      
      const status = syncManager.getSyncStatus();
      expect(status.pendingChanges).toBe(1);
    });

    test('should overwrite existing changes for same data', () => {
      const testData1 = { name: 'John', age: 30 };
      const testData2 = { name: 'John', age: 31 };
      
      syncManager.queueChange('user_profile', 'user-123', testData1, 'update');
      syncManager.queueChange('user_profile', 'user-123', testData2, 'update');
      
      const status = syncManager.getSyncStatus();
      expect(status.pendingChanges).toBe(1);
    });

    test('should handle different operation types', () => {
      syncManager.queueChange('user_profile', 'user-123', {}, 'create');
      syncManager.queueChange('user_profile', 'user-124', {}, 'update');
      syncManager.queueChange('user_profile', 'user-125', {}, 'delete');
      
      const status = syncManager.getSyncStatus();
      expect(status.pendingChanges).toBe(3);
    });
  });

  describe('Pull Sync', () => {
    test('should pull changes from server', async () => {
      const mockChanges = {
        user_profile: {
          changes: [
            {
              data_id: 'user-123',
              data: { name: 'Jane', age: 25 },
              timestamp: Date.now()
            }
          ]
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            changes: mockChanges,
            conflicts: [],
            hasMore: false,
            totalChanges: 1
          }
        })
      } as Response);

      const result = await syncManager.triggerSync();

      expect(result.success).toBe(true);
      expect(result.changes).toEqual(mockChanges);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/sync',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-789'
          })
        })
      );
    });

    test('should handle pull sync errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      const result = await syncManager.triggerSync();

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP 500');
    });

    test('should emit data_updated events for incoming changes', async () => {
      const dataUpdatedListener = jest.fn();
      syncManager.addEventListener('data_updated', dataUpdatedListener);

      const mockChanges = {
        user_profile: {
          changes: [
            {
              data_id: 'user-123',
              data: { name: 'Jane', age: 25 },
              timestamp: Date.now()
            }
          ]
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          result: { changes: mockChanges, conflicts: [] }
        })
      } as Response);

      await syncManager.triggerSync();

      expect(dataUpdatedListener).toHaveBeenCalledWith('data_updated', {
        dataType: 'user_profile',
        dataId: 'user-123',
        data: { name: 'Jane', age: 25 },
        source: 'remote'
      });
    });
  });

  describe('Push Sync', () => {
    test('should push pending changes to server', async () => {
      // Queue some changes
      syncManager.queueChange('user_profile', 'user-123', { name: 'John' }, 'update');
      syncManager.queueChange('user_settings', 'settings-456', { theme: 'dark' }, 'update');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            successful: 2,
            failed: 0,
            conflicts: 0,
            errors: []
          }
        })
      } as Response);

      const result = await syncManager.triggerSync();

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/sync',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('push')
        })
      );

      // Changes should be cleared after successful sync
      const status = syncManager.getSyncStatus();
      expect(status.pendingChanges).toBe(0);
    });

    test('should handle push sync errors', async () => {
      syncManager.queueChange('user_profile', 'user-123', { name: 'John' }, 'update');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Validation failed'
        })
      } as Response);

      const result = await syncManager.triggerSync();

      expect(result.success).toBe(false);
      
      // Changes should remain in queue for retry
      const status = syncManager.getSyncStatus();
      expect(status.retryQueueSize).toBeGreaterThan(0);
    });

    test('should batch large numbers of changes', async () => {
      // Queue more changes than batch size
      for (let i = 0; i < 25; i++) {
        syncManager.queueChange('user_profile', `user-${i}`, { name: `User ${i}` }, 'update');
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          result: { successful: 10, failed: 0, conflicts: 0, errors: [] }
        })
      } as Response);

      await syncManager.triggerSync();

      // Should make multiple requests due to batching
      expect(mockFetch).toHaveBeenCalledTimes(6); // 2 for pull, 3 for push batches, 1 more for remaining
    });
  });

  describe('Conflict Resolution', () => {
    test('should detect and emit conflicts', async () => {
      const conflictListener = jest.fn();
      syncManager.addEventListener('conflict_detected', conflictListener);

      const mockConflicts: ConflictData[] = [
        {
          id: 'conflict-123',
          dataType: 'user_profile',
          dataId: 'user-123',
          versions: [
            {
              version: 2,
              data: { name: 'John', age: 30 },
              timestamp: Date.now(),
              platform: 'mobile',
              deviceId: 'device-1'
            },
            {
              version: 1,
              data: { name: 'John', age: 29 },
              timestamp: Date.now() - 1000,
              platform: 'web',
              deviceId: 'device-2'
            }
          ],
          severity: 'low',
          suggestedStrategy: 'latest_wins',
          createdAt: Date.now()
        }
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            changes: {},
            conflicts: mockConflicts,
            hasMore: false
          }
        })
      } as Response);

      await syncManager.triggerSync();

      expect(conflictListener).toHaveBeenCalledWith('conflict_detected', mockConflicts);
    });

    test('should resolve conflicts', async () => {
      const resolvedData = { name: 'John', age: 30 };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          result: { resolved: 1, failed: 0, errors: [] }
        })
      } as Response);

      const result = await syncManager.resolveConflict('conflict-123', 'override', resolvedData);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/sync',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('conflict_resolution')
        })
      );
    });

    test('should handle conflict resolution errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await syncManager.resolveConflict('conflict-123', 'override', {});

      expect(result).toBe(false);
    });
  });

  describe('Network Handling', () => {
    test('should handle offline state', () => {
      // Simulate going offline
      Object.defineProperty(window, 'navigator', {
        value: { onLine: false }
      });

      // Trigger offline event
      window.dispatchEvent(new Event('offline'));

      const status = syncManager.getSyncStatus();
      expect(status.isOnline).toBe(false);

      // Should not sync when offline
      syncManager.queueChange('user_profile', 'user-123', {}, 'update');
      const syncPromise = syncManager.triggerSync();

      expect(syncPromise).resolves.toEqual({
        success: false,
        error: 'Sync already in progress or offline'
      });
    });

    test('should resume sync when coming back online', () => {
      // Start offline
      Object.defineProperty(window, 'navigator', {
        value: { onLine: false }
      });
      window.dispatchEvent(new Event('offline'));

      // Queue changes while offline
      syncManager.queueChange('user_profile', 'user-123', {}, 'update');

      // Come back online
      Object.defineProperty(window, 'navigator', {
        value: { onLine: true }
      });
      window.dispatchEvent(new Event('online'));

      // Should trigger sync automatically
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Storage Operations', () => {
    test('should store and retrieve local data', async () => {
      const testData = { name: 'John', age: 30 };
      
      mockStorage.setItem.mockResolvedValue(undefined);
      mockStorage.getItem.mockResolvedValue(JSON.stringify({
        data: testData,
        timestamp: Date.now(),
        synced: true
      }));

      // Store data
      await syncManager['storeLocalData']('user_profile', 'user-123', testData);
      
      // Retrieve data
      const retrieved = await syncManager.getLocalData('user_profile', 'user-123');

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'sync_user_profile_user-123',
        expect.stringContaining('"name":"John"')
      );
      expect(retrieved).toEqual(testData);
    });

    test('should handle storage errors gracefully', async () => {
      mockStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await syncManager.getLocalData('user_profile', 'user-123');

      expect(result).toBeNull();
    });

    test('should handle corrupted storage data', async () => {
      mockStorage.getItem.mockResolvedValue('invalid json');

      const result = await syncManager.getLocalData('user_profile', 'user-123');

      expect(result).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    test('should debounce sync calls', (done) => {
      const syncSpy = jest.spyOn(syncManager, 'triggerSync');
      
      // Call multiple times rapidly
      syncManager['debouncedSync']();
      syncManager['debouncedSync']();
      syncManager['debouncedSync']();

      // Should only call once after debounce delay
      setTimeout(() => {
        expect(syncSpy).toHaveBeenCalledTimes(1);
        done();
      }, 1100);
    });

    test('should chunk arrays correctly', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const chunks = syncManager['chunkArray'](array, 3);

      expect(chunks).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10]
      ]);
    });
  });

  describe('Full Sync', () => {
    test('should perform full sync', async () => {
      mockStorage.setItem.mockResolvedValue(undefined);

      const result = await syncManager.forceFullSync();

      expect(result.success).toBe(true);
      expect(mockStorage.setItem).toHaveBeenCalledWith('lastSyncTimestamp', '0');
    });
  });

  describe('Cleanup', () => {
    test('should clear all local data', async () => {
      syncManager.queueChange('user_profile', 'user-123', {}, 'update');
      
      await syncManager.clearLocalData();

      const status = syncManager.getSyncStatus();
      expect(status.pendingChanges).toBe(0);
      expect(status.retryQueueSize).toBe(0);
      expect(status.lastSyncTimestamp).toBe(0);
    });

    test('should cleanup resources on destroy', () => {
      const stopSyncSpy = jest.spyOn(syncManager, 'stopPeriodicSync');
      
      syncManager.destroy();

      expect(stopSyncSpy).toHaveBeenCalled();
      
      const status = syncManager.getSyncStatus();
      expect(status.pendingChanges).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed server responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'response' })
      } as Response);

      const result = await syncManager.triggerSync();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle network timeouts', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const result = await syncManager.triggerSync();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
    });

    test('should prevent concurrent syncs', async () => {
      // Start first sync
      const firstSync = syncManager.triggerSync();
      
      // Try to start second sync immediately
      const secondSync = syncManager.triggerSync();

      const [firstResult, secondResult] = await Promise.all([firstSync, secondSync]);

      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('already in progress');
    });
  });

  describe('Performance', () => {
    test('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      // Queue 1000 changes
      for (let i = 0; i < 1000; i++) {
        syncManager.queueChange('user_profile', `user-${i}`, { name: `User ${i}` }, 'update');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
      
      const status = syncManager.getSyncStatus();
      expect(status.pendingChanges).toBe(1000);
    });

    test('should handle rapid successive changes efficiently', () => {
      const startTime = Date.now();
      
      // Rapidly update the same data
      for (let i = 0; i < 100; i++) {
        syncManager.queueChange('user_profile', 'user-123', { counter: i }, 'update');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly and only keep latest change
      expect(duration).toBeLessThan(100);
      
      const status = syncManager.getSyncStatus();
      expect(status.pendingChanges).toBe(1); // Only latest change should be kept
    });
  });
});

