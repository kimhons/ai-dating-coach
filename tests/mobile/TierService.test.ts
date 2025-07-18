import TierService, { TierType, TierLimits, UsageData } from '../../mobile/src/services/TierService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    insert: jest.fn(),
    update: jest.fn(() => ({
      eq: jest.fn()
    })),
    upsert: jest.fn()
  })),
  auth: {
    getUser: jest.fn()
  }
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase
}));

describe('TierService', () => {
  let tierService: TierService;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    tierService = new TierService(mockUserId);
    
    // Mock successful API responses by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          tier: 'free',
          limits: {
            profileAnalysis: { limit: 5, used: 0 },
            conversationCoaching: { limit: 3, used: 0 },
            realTimeSuggestions: { limit: 10, used: 0 },
            advancedAnalytics: { limit: 0, used: 0 }
          }
        }
      })
    } as Response);
  });

  describe('Initialization', () => {
    test('should initialize with correct user ID', () => {
      expect(tierService['userId']).toBe(mockUserId);
    });

    test('should load cached tier data on initialization', async () => {
      const cachedData = {
        tier: 'premium',
        limits: {
          profileAnalysis: { limit: 50, used: 10 },
          conversationCoaching: { limit: 30, used: 5 }
        },
        lastUpdated: Date.now()
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const newTierService = new TierService(mockUserId);
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async initialization

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(`tier_data_${mockUserId}`);
    });

    test('should handle corrupted cache data gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

      const newTierService = new TierService(mockUserId);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not throw and should fall back to API
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Tier Information', () => {
    test('should get current tier', async () => {
      const tier = await tierService.getCurrentTier();
      expect(tier).toBe('free');
    });

    test('should get tier limits', async () => {
      const limits = await tierService.getTierLimits();
      
      expect(limits).toEqual({
        profileAnalysis: { limit: 5, used: 0 },
        conversationCoaching: { limit: 3, used: 0 },
        realTimeSuggestions: { limit: 10, used: 0 },
        advancedAnalytics: { limit: 0, used: 0 }
      });
    });

    test('should check if feature is available', async () => {
      const isAvailable = await tierService.isFeatureAvailable('profileAnalysis');
      expect(isAvailable).toBe(true);
    });

    test('should check if feature is unavailable for free tier', async () => {
      const isAvailable = await tierService.isFeatureAvailable('advancedAnalytics');
      expect(isAvailable).toBe(false);
    });

    test('should get remaining usage for feature', async () => {
      const remaining = await tierService.getRemainingUsage('profileAnalysis');
      expect(remaining).toBe(5);
    });

    test('should handle unlimited features', async () => {
      // Mock premium tier response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            tier: 'premium',
            limits: {
              profileAnalysis: { limit: -1, used: 100 }, // -1 indicates unlimited
              conversationCoaching: { limit: -1, used: 50 }
            }
          }
        })
      } as Response);

      const remaining = await tierService.getRemainingUsage('profileAnalysis');
      expect(remaining).toBe(-1); // Unlimited
    });
  });

  describe('Usage Tracking', () => {
    test('should track feature usage', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            tier: 'free',
            limits: {
              profileAnalysis: { limit: 5, used: 1 },
              conversationCoaching: { limit: 3, used: 0 }
            }
          }
        })
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      const result = await tierService.trackUsage('profileAnalysis', {
        platform: 'tinder',
        analysisType: 'photo',
        timestamp: Date.now()
      });

      expect(result.success).toBe(true);
      expect(result.remainingUsage).toBe(4); // 5 - 1
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/tier-management'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('trackUsage')
        })
      );
    });

    test('should prevent usage when limit exceeded', async () => {
      // Mock response showing limit exceeded
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Usage limit exceeded',
          code: 'LIMIT_EXCEEDED',
          data: {
            tier: 'free',
            limits: {
              profileAnalysis: { limit: 5, used: 5 }
            }
          }
        })
      } as Response);

      const result = await tierService.trackUsage('profileAnalysis', {
        platform: 'tinder',
        analysisType: 'photo',
        timestamp: Date.now()
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usage limit exceeded');
      expect(result.limitExceeded).toBe(true);
    });

    test('should handle network errors during usage tracking', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await tierService.trackUsage('profileAnalysis', {
        platform: 'tinder',
        analysisType: 'photo',
        timestamp: Date.now()
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    test('should batch usage tracking for performance', async () => {
      // Track multiple usages rapidly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(tierService.trackUsage('realTimeSuggestions', {
          platform: 'tinder',
          suggestionType: 'message',
          timestamp: Date.now() + i
        }));
      }

      await Promise.all(promises);

      // Should batch requests to reduce API calls
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tier Upgrades', () => {
    test('should check upgrade eligibility', async () => {
      const eligibility = await tierService.checkUpgradeEligibility('premium');
      
      expect(eligibility.eligible).toBe(true);
      expect(eligibility.currentTier).toBe('free');
      expect(eligibility.targetTier).toBe('premium');
    });

    test('should get upgrade benefits', async () => {
      const benefits = await tierService.getUpgradeBenefits('premium');
      
      expect(benefits).toEqual(expect.arrayContaining([
        expect.objectContaining({
          feature: expect.any(String),
          currentLimit: expect.any(Number),
          newLimit: expect.any(Number)
        })
      ]));
    });

    test('should initiate tier upgrade', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            upgradeUrl: 'https://billing.example.com/upgrade',
            sessionId: 'session-123'
          }
        })
      } as Response);

      const result = await tierService.initiateTierUpgrade('premium');

      expect(result.success).toBe(true);
      expect(result.upgradeUrl).toBe('https://billing.example.com/upgrade');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/tier-management'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('initiateTierUpgrade')
        })
      );
    });

    test('should handle upgrade failures', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Payment method required',
          code: 'PAYMENT_REQUIRED'
        })
      } as Response);

      const result = await tierService.initiateTierUpgrade('premium');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment method required');
    });
  });

  describe('Caching', () => {
    test('should cache tier data locally', async () => {
      await tierService.getCurrentTier();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `tier_data_${mockUserId}`,
        expect.stringContaining('"tier":"free"')
      );
    });

    test('should use cached data when available and fresh', async () => {
      const cachedData = {
        tier: 'premium',
        limits: {
          profileAnalysis: { limit: 50, used: 10 }
        },
        lastUpdated: Date.now() - 30000 // 30 seconds ago
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const tier = await tierService.getCurrentTier();

      expect(tier).toBe('premium');
      expect(mockFetch).not.toHaveBeenCalled(); // Should use cache
    });

    test('should refresh expired cache data', async () => {
      const expiredCachedData = {
        tier: 'premium',
        limits: {},
        lastUpdated: Date.now() - 600000 // 10 minutes ago (expired)
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(expiredCachedData));

      const tier = await tierService.getCurrentTier();

      expect(tier).toBe('free'); // From fresh API call
      expect(mockFetch).toHaveBeenCalled(); // Should refresh from API
    });

    test('should clear cache on tier change', async () => {
      await tierService.initiateTierUpgrade('premium');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`tier_data_${mockUserId}`);
    });
  });

  describe('Analytics Integration', () => {
    test('should track tier-related analytics', async () => {
      const analyticsSpy = jest.spyOn(tierService as any, 'trackAnalytics');

      await tierService.trackUsage('profileAnalysis', {
        platform: 'tinder',
        analysisType: 'photo',
        timestamp: Date.now()
      });

      expect(analyticsSpy).toHaveBeenCalledWith('feature_usage', {
        feature: 'profileAnalysis',
        tier: 'free',
        platform: 'tinder',
        success: true
      });
    });

    test('should track upgrade events', async () => {
      const analyticsSpy = jest.spyOn(tierService as any, 'trackAnalytics');

      await tierService.initiateTierUpgrade('premium');

      expect(analyticsSpy).toHaveBeenCalledWith('upgrade_initiated', {
        fromTier: 'free',
        toTier: 'premium',
        timestamp: expect.any(Number)
      });
    });

    test('should track limit exceeded events', async () => {
      const analyticsSpy = jest.spyOn(tierService as any, 'trackAnalytics');

      // Mock limit exceeded response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Usage limit exceeded',
          code: 'LIMIT_EXCEEDED'
        })
      } as Response);

      await tierService.trackUsage('profileAnalysis', {
        platform: 'tinder',
        analysisType: 'photo',
        timestamp: Date.now()
      });

      expect(analyticsSpy).toHaveBeenCalledWith('limit_exceeded', {
        feature: 'profileAnalysis',
        tier: 'free',
        platform: 'tinder'
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      const tier = await tierService.getCurrentTier();

      // Should fall back to cached data or default
      expect(tier).toBeDefined();
    });

    test('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'response' })
      } as Response);

      const tier = await tierService.getCurrentTier();

      // Should handle gracefully
      expect(tier).toBeDefined();
    });

    test('should handle storage errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(tierService.getCurrentTier()).resolves.toBeDefined();
    });

    test('should retry failed requests', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { tier: 'free', limits: {} }
          })
        } as Response);

      const tier = await tierService.getCurrentTier();

      expect(tier).toBe('free');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance', () => {
    test('should handle concurrent requests efficiently', async () => {
      const promises = [];
      
      // Make multiple concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(tierService.getCurrentTier());
      }

      const results = await Promise.all(promises);

      // All should return the same result
      expect(results.every(tier => tier === 'free')).toBe(true);
      
      // Should only make one API call due to request deduplication
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should debounce rapid usage tracking', async () => {
      const promises = [];
      
      // Track usage rapidly
      for (let i = 0; i < 5; i++) {
        promises.push(tierService.trackUsage('realTimeSuggestions', {
          platform: 'tinder',
          suggestionType: 'message',
          timestamp: Date.now() + i
        }));
      }

      await Promise.all(promises);

      // Should batch the requests
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Real-time Updates', () => {
    test('should handle real-time tier updates', async () => {
      const updateListener = jest.fn();
      tierService.addEventListener('tierUpdated', updateListener);

      // Simulate real-time update
      await tierService['handleRealtimeUpdate']({
        type: 'tier_updated',
        data: {
          tier: 'premium',
          limits: {
            profileAnalysis: { limit: 50, used: 10 }
          }
        }
      });

      expect(updateListener).toHaveBeenCalledWith({
        tier: 'premium',
        limits: expect.any(Object)
      });
    });

    test('should handle usage limit updates', async () => {
      const limitListener = jest.fn();
      tierService.addEventListener('usageLimitUpdated', limitListener);

      // Simulate usage update
      await tierService['handleRealtimeUpdate']({
        type: 'usage_updated',
        data: {
          feature: 'profileAnalysis',
          used: 3,
          limit: 5
        }
      });

      expect(limitListener).toHaveBeenCalledWith({
        feature: 'profileAnalysis',
        used: 3,
        limit: 5,
        remaining: 2
      });
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resources on destroy', () => {
      const removeListenerSpy = jest.spyOn(tierService, 'removeAllEventListeners');
      
      tierService.destroy();

      expect(removeListenerSpy).toHaveBeenCalled();
    });

    test('should cancel pending requests on destroy', async () => {
      const pendingRequest = tierService.getCurrentTier();
      
      tierService.destroy();

      // Pending request should be cancelled
      await expect(pendingRequest).rejects.toThrow('Request cancelled');
    });
  });
});

