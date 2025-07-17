/**
 * Custom Jest Matchers for AI Dating Coach
 * Provides domain-specific testing utilities
 */

// Extend Jest matchers
expect.extend({
  /**
   * Check if a tier usage response is valid
   */
  toBeValidTierUsageResponse(received) {
    const pass = received &&
      typeof received.success === 'boolean' &&
      typeof received.remainingUsage === 'number' &&
      (received.error === undefined || typeof received.error === 'string') &&
      (received.limitExceeded === undefined || typeof received.limitExceeded === 'boolean');

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid tier usage response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid tier usage response with success, remainingUsage, and optional error/limitExceeded fields`,
        pass: false,
      };
    }
  },

  /**
   * Check if a sync result is valid
   */
  toBeValidSyncResult(received) {
    const pass = received &&
      typeof received.success === 'boolean' &&
      (received.changes === undefined || typeof received.changes === 'object') &&
      (received.conflicts === undefined || Array.isArray(received.conflicts)) &&
      (received.error === undefined || typeof received.error === 'string');

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid sync result`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid sync result with success boolean and optional changes, conflicts, error fields`,
        pass: false,
      };
    }
  },

  /**
   * Check if an analysis result contains required fields
   */
  toBeValidAnalysisResult(received) {
    const pass = received &&
      typeof received.score === 'number' &&
      received.score >= 0 &&
      received.score <= 100 &&
      Array.isArray(received.suggestions) &&
      received.suggestions.length > 0 &&
      typeof received.platform === 'string' &&
      typeof received.timestamp === 'number';

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid analysis result`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid analysis result with score (0-100), suggestions array, platform string, and timestamp`,
        pass: false,
      };
    }
  },

  /**
   * Check if a conflict data object is valid
   */
  toBeValidConflictData(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.dataType === 'string' &&
      typeof received.dataId === 'string' &&
      Array.isArray(received.versions) &&
      received.versions.length >= 2 &&
      ['low', 'medium', 'high'].includes(received.severity) &&
      typeof received.suggestedStrategy === 'string' &&
      typeof received.createdAt === 'number';

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be valid conflict data`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be valid conflict data with id, dataType, dataId, versions array (2+), severity, suggestedStrategy, and createdAt`,
        pass: false,
      };
    }
  },

  /**
   * Check if a component is properly accessible
   */
  toBeAccessible(received) {
    const element = received;
    
    if (!element) {
      return {
        message: () => 'expected element to exist',
        pass: false,
      };
    }

    const hasAriaLabel = element.getAttribute('aria-label') || 
                        element.getAttribute('aria-labelledby') ||
                        element.getAttribute('aria-describedby');
    
    const hasRole = element.getAttribute('role') || 
                   ['button', 'link', 'input', 'textarea', 'select'].includes(element.tagName.toLowerCase());
    
    const isKeyboardAccessible = element.tabIndex >= 0 || 
                                element.tagName.toLowerCase() === 'button' ||
                                element.tagName.toLowerCase() === 'a' ||
                                element.tagName.toLowerCase() === 'input';

    const pass = hasAriaLabel && hasRole && isKeyboardAccessible;

    if (pass) {
      return {
        message: () => `expected element not to be accessible`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be accessible (have aria-label/labelledby/describedby, role, and be keyboard accessible)`,
        pass: false,
      };
    }
  },

  /**
   * Check if a React component renders without errors
   */
  toRenderWithoutErrors(received, props = {}) {
    try {
      const React = require('react');
      const { render } = require('@testing-library/react');
      
      const element = React.createElement(received, props);
      const { container } = render(element);
      
      const pass = container.firstChild !== null;
      
      if (pass) {
        return {
          message: () => `expected component not to render without errors`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected component to render without errors`,
          pass: false,
        };
      }
    } catch (error) {
      return {
        message: () => `expected component to render without errors, but got: ${error.message}`,
        pass: false,
      };
    }
  },

  /**
   * Check if an API response follows the standard format
   */
  toBeValidApiResponse(received) {
    const pass = received &&
      typeof received.success === 'boolean' &&
      (received.data === undefined || typeof received.data === 'object') &&
      (received.error === undefined || typeof received.error === 'string') &&
      (received.code === undefined || typeof received.code === 'string') &&
      typeof received.timestamp === 'number';

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid API response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid API response with success boolean, optional data object, error string, code string, and timestamp number`,
        pass: false,
      };
    }
  },

  /**
   * Check if a tier configuration is valid
   */
  toBeValidTierConfig(received) {
    const validTiers = ['free', 'premium', 'pro'];
    const requiredFeatures = ['profileAnalysis', 'conversationCoaching', 'realTimeSuggestions'];
    
    const pass = received &&
      validTiers.includes(received.tier) &&
      typeof received.limits === 'object' &&
      requiredFeatures.every(feature => 
        received.limits[feature] &&
        typeof received.limits[feature].limit === 'number' &&
        typeof received.limits[feature].used === 'number'
      );

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid tier config`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid tier config with valid tier and limits for required features`,
        pass: false,
      };
    }
  },

  /**
   * Check if a sync data object is valid
   */
  toBeValidSyncData(received) {
    const validOperations = ['create', 'update', 'delete'];
    
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.dataType === 'string' &&
      typeof received.data === 'object' &&
      typeof received.timestamp === 'number' &&
      typeof received.version === 'number' &&
      validOperations.includes(received.operation);

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be valid sync data`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be valid sync data with id, dataType, data object, timestamp, version, and valid operation`,
        pass: false,
      };
    }
  },

  /**
   * Check if a performance metric is within acceptable range
   */
  toBeWithinPerformanceRange(received, expectedRange) {
    const { min = 0, max = Infinity, metric = 'value' } = expectedRange;
    const value = typeof received === 'object' ? received[metric] : received;
    
    const pass = typeof value === 'number' && value >= min && value <= max;

    if (pass) {
      return {
        message: () => `expected ${value} not to be within performance range ${min}-${max}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${value} to be within performance range ${min}-${max}`,
        pass: false,
      };
    }
  },

  /**
   * Check if an error follows the standard error format
   */
  toBeValidErrorResponse(received) {
    const pass = received &&
      received.success === false &&
      typeof received.error === 'string' &&
      received.error.length > 0 &&
      (received.code === undefined || typeof received.code === 'string') &&
      (received.details === undefined || typeof received.details === 'object');

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid error response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid error response with success: false, error string, and optional code/details`,
        pass: false,
      };
    }
  }
});

// Helper functions for test setup
global.testHelpers = {
  /**
   * Create a mock tier service response
   */
  createMockTierResponse: (tier = 'free', overrides = {}) => ({
    success: true,
    data: {
      tier,
      limits: {
        profileAnalysis: { limit: tier === 'free' ? 5 : 50, used: 0 },
        conversationCoaching: { limit: tier === 'free' ? 3 : 30, used: 0 },
        realTimeSuggestions: { limit: tier === 'free' ? 10 : -1, used: 0 },
        advancedAnalytics: { limit: tier === 'free' ? 0 : -1, used: 0 }
      },
      ...overrides
    },
    timestamp: Date.now()
  }),

  /**
   * Create a mock sync result
   */
  createMockSyncResult: (overrides = {}) => ({
    success: true,
    changes: {},
    conflicts: [],
    hasMore: false,
    lastSyncTimestamp: Date.now(),
    totalChanges: 0,
    ...overrides
  }),

  /**
   * Create a mock analysis result
   */
  createMockAnalysisResult: (overrides = {}) => ({
    score: 75,
    suggestions: [
      { type: 'photo', text: 'Add more variety to your photos', priority: 'high' },
      { type: 'bio', text: 'Include more specific interests', priority: 'medium' }
    ],
    platform: 'tinder',
    timestamp: Date.now(),
    ...overrides
  }),

  /**
   * Create a mock conflict data
   */
  createMockConflictData: (overrides = {}) => ({
    id: 'conflict-123',
    dataType: 'user_profile',
    dataId: 'user-456',
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
    createdAt: Date.now(),
    ...overrides
  }),

  /**
   * Create a mock user for testing
   */
  createMockUser: (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    tier: 'free',
    createdAt: Date.now() - 86400000, // 1 day ago
    ...overrides
  }),

  /**
   * Wait for async operations to complete
   */
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Mock fetch with custom responses
   */
  mockFetch: (responses = {}) => {
    const originalFetch = global.fetch;
    
    global.fetch = jest.fn((url, options) => {
      const method = options?.method || 'GET';
      const key = `${method} ${url}`;
      
      if (responses[key]) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(responses[key])
        });
      }
      
      // Default successful response
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });
    });

    return () => {
      global.fetch = originalFetch;
    };
  },

  /**
   * Create a mock React Native AsyncStorage
   */
  mockAsyncStorage: () => {
    const storage = new Map();
    
    return {
      getItem: jest.fn(key => Promise.resolve(storage.get(key) || null)),
      setItem: jest.fn((key, value) => {
        storage.set(key, value);
        return Promise.resolve();
      }),
      removeItem: jest.fn(key => {
        storage.delete(key);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        storage.clear();
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve([...storage.keys()])),
      multiGet: jest.fn(keys => 
        Promise.resolve(keys.map(key => [key, storage.get(key) || null]))
      ),
      multiSet: jest.fn(keyValuePairs => {
        keyValuePairs.forEach(([key, value]) => storage.set(key, value));
        return Promise.resolve();
      }),
      multiRemove: jest.fn(keys => {
        keys.forEach(key => storage.delete(key));
        return Promise.resolve();
      })
    };
  },

  /**
   * Create a mock Supabase client
   */
  mockSupabase: () => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        gt: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'user-123', email: 'test@example.com' } }, 
        error: null 
      })),
      signIn: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null }))
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        download: jest.fn(() => Promise.resolve({ data: new Blob(), error: null })),
        remove: jest.fn(() => Promise.resolve({ data: {}, error: null }))
      }))
    }
  })
};

// Console helpers for test debugging
global.testConsole = {
  log: (...args) => {
    if (process.env.TEST_DEBUG) {
      console.log('[TEST]', ...args);
    }
  },
  error: (...args) => {
    if (process.env.TEST_DEBUG) {
      console.error('[TEST ERROR]', ...args);
    }
  },
  warn: (...args) => {
    if (process.env.TEST_DEBUG) {
      console.warn('[TEST WARN]', ...args);
    }
  }
};

