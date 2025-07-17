/**
 * Integrated Analysis Service for Browser Extension
 * 
 * Connects browser extension to the comprehensive relationship expert backend
 * with advanced LLM optimization and seamless integration
 */

class IntegratedAnalysisService {
  constructor() {
    this.baseUrl = 'https://your-api-url.com'; // Will be configured
    this.requestQueue = new Map();
    this.cache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Comprehensive Profile Analysis with Dr. Elena Rodriguez expertise
   */
  async analyzeProfile(targetProfile, options = {}) {
    const request = {
      type: 'profile_analysis',
      data: { targetProfile },
      options: {
        depth_level: options.depth_level || 'comprehensive',
        include_recommendations: true,
        cultural_context: options.cultural_context || await this.getUserCulturalContext(),
        platform: options.platform || this.detectPlatform(),
        priority: 'normal'
      }
    };

    return this.processAnalysisRequest(request);
  }

  /**
   * Comprehensive Conversation Coaching across all relationship domains
   */
  async coachConversation(conversationHistory, userProfile, targetProfile, options = {}) {
    const request = {
      type: 'conversation_coaching',
      data: {
        conversationHistory,
        userProfile,
        targetProfile
      },
      options: {
        depth_level: options.depth_level || 'comprehensive',
        include_recommendations: true,
        cultural_context: await this.getUserCulturalContext(),
        platform: this.detectPlatform(),
        priority: 'high'
      }
    };

    return this.processAnalysisRequest(request);
  }

  /**
   * Advanced Photo Analysis with technical and psychological insights
   */
  async analyzePhoto(photoData, options = {}) {
    const request = {
      type: 'photo_analysis',
      data: { photoData },
      options: {
        depth_level: options.depth_level || 'standard',
        include_recommendations: true,
        cultural_context: await this.getUserCulturalContext(),
        platform: this.detectPlatform(),
        priority: 'normal'
      }
    };

    return this.processAnalysisRequest(request);
  }

  /**
   * Real-time Page Analysis for dating app integration
   */
  async analyzePage(pageData, options = {}) {
    const request = {
      type: 'page_analysis',
      data: {
        pageData,
        url: window.location.href,
        platform: this.detectPlatform(),
        timestamp: new Date().toISOString()
      },
      options: {
        depth_level: options.depth_level || 'standard',
        include_recommendations: true,
        cultural_context: await this.getUserCulturalContext(),
        platform: this.detectPlatform(),
        priority: 'high'
      }
    };

    return this.processAnalysisRequest(request);
  }

  /**
   * Multi-dimensional Compatibility Assessment
   */
  async checkCompatibility(userProfile, targetProfile, options = {}) {
    const request = {
      type: 'compatibility_check',
      data: {
        userProfile,
        targetProfile,
        focus_areas: options.focus_areas || ['all']
      },
      options: {
        depth_level: options.depth_level || 'comprehensive',
        include_recommendations: true,
        cultural_context: await this.getUserCulturalContext(),
        platform: this.detectPlatform(),
        priority: 'normal'
      }
    };

    return this.processAnalysisRequest(request);
  }

  /**
   * Process analysis request with comprehensive integration
   */
  async processAnalysisRequest(request) {
    try {
      // 1. Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Check if request is already in progress
      if (this.requestQueue.has(cacheKey)) {
        return await this.requestQueue.get(cacheKey);
      }

      // 3. Create new request promise
      const requestPromise = this.executeAnalysisRequest(request);
      this.requestQueue.set(cacheKey, requestPromise);

      try {
        const response = await requestPromise;
        
        // 4. Cache successful response
        if (response.success) {
          this.cacheResponse(cacheKey, response);
        }

        // 5. Sync with other platforms
        if (response.success && response.analysis_id) {
          this.syncAnalysisResult(response.analysis_id, response);
        }

        return response;
      } finally {
        // 6. Remove from queue
        this.requestQueue.delete(cacheKey);
      }
    } catch (error) {
      console.error('Analysis request failed:', error);
      return {
        success: false,
        error: error.message || 'Analysis failed',
        confidence: 0,
        processing_time: 0,
        tier_usage: null
      };
    }
  }

  /**
   * Execute analysis request to backend
   */
  async executeAnalysisRequest(request) {
    const userId = await this.getUserId();
    const sessionToken = await this.getSessionToken();

    // Check tier limits before making request
    const tierCheck = await this.checkTierLimits(request.type, request.options?.depth_level);
    if (!tierCheck.allowed) {
      return {
        success: false,
        error: 'Tier limit exceeded',
        confidence: 0,
        processing_time: 0,
        tier_usage: tierCheck,
        upgrade_required: true,
        current_tier: tierCheck.current_tier
      };
    }

    const apiRequest = {
      user_id: userId,
      session_token: sessionToken,
      request_type: request.type,
      data: request.data,
      options: request.options
    };

    const response = await fetch(`${this.baseUrl}/api/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify(apiRequest)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Update tier usage after successful request
    if (result.success) {
      await this.updateTierUsage(request.type, request.options?.depth_level);
    }

    return result;
  }

  /**
   * Platform detection for dating apps
   */
  detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('tinder.com')) return 'tinder';
    if (hostname.includes('bumble.com')) return 'bumble';
    if (hostname.includes('hinge.co')) return 'hinge';
    if (hostname.includes('match.com')) return 'match';
    if (hostname.includes('okcupid.com')) return 'okcupid';
    if (hostname.includes('pof.com')) return 'pof';
    if (hostname.includes('eharmony.com')) return 'eharmony';
    if (hostname.includes('zoosk.com')) return 'zoosk';
    if (hostname.includes('badoo.com')) return 'badoo';
    if (hostname.includes('coffee')) return 'coffee_meets_bagel';
    
    return 'unknown';
  }

  /**
   * Cache management
   */
  generateCacheKey(request) {
    const keyData = {
      type: request.type,
      data: request.data,
      options: request.options
    };
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  getCachedResponse(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.response;
    }
    if (cached) {
      this.cache.delete(cacheKey);
    }
    return null;
  }

  cacheResponse(cacheKey, response) {
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });

    // Cleanup old cache entries
    if (this.cache.size > 50) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Helper methods using Chrome extension APIs
   */
  async getUserId() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['user_id'], (result) => {
        if (!result.user_id) {
          throw new Error('User not authenticated');
        }
        resolve(result.user_id);
      });
    });
  }

  async getSessionToken() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['session_token'], (result) => {
        if (!result.session_token) {
          throw new Error('Session token not found');
        }
        resolve(result.session_token);
      });
    });
  }

  async getUserCulturalContext() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['cultural_context'], (result) => {
        resolve(result.cultural_context || 'western_urban');
      });
    });
  }

  /**
   * Tier management
   */
  async checkTierLimits(requestType, depthLevel) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['tier_data'], (result) => {
        const tierData = result.tier_data || { tier: 'free', usage: {} };
        
        // Simple tier checking logic
        const limits = {
          free: { profile_analysis: 5, conversation_coaching: 10, photo_analysis: 3 },
          premium: { profile_analysis: 100, conversation_coaching: 200, photo_analysis: 50 },
          expert: { profile_analysis: -1, conversation_coaching: -1, photo_analysis: -1 }
        };

        const currentUsage = tierData.usage[requestType] || 0;
        const limit = limits[tierData.tier]?.[requestType] || 0;

        resolve({
          allowed: limit === -1 || currentUsage < limit,
          current_tier: tierData.tier,
          usage: currentUsage,
          limit: limit
        });
      });
    });
  }

  async updateTierUsage(requestType, depthLevel) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['tier_data'], (result) => {
        const tierData = result.tier_data || { tier: 'free', usage: {} };
        tierData.usage[requestType] = (tierData.usage[requestType] || 0) + 1;
        
        chrome.storage.sync.set({ tier_data: tierData }, () => {
          resolve();
        });
      });
    });
  }

  /**
   * Cross-platform sync
   */
  async syncAnalysisResult(analysisId, result) {
    try {
      // Send to background script for syncing
      chrome.runtime.sendMessage({
        type: 'SYNC_ANALYSIS',
        data: {
          analysis_id: analysisId,
          result: result,
          platform: this.detectPlatform(),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  /**
   * Performance monitoring
   */
  getPerformanceMetrics() {
    return {
      cache_size: this.cache.size,
      queue_size: this.requestQueue.size,
      platform: this.detectPlatform(),
      cache_hit_rate: 0.85 // Placeholder
    };
  }

  /**
   * Clear cache and reset service
   */
  clearCache() {
    this.cache.clear();
    this.requestQueue.clear();
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Health check failed');
      }

      return await response.json();
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          api: 'unreachable',
          analysis_engine: 'unknown',
          database: 'unknown'
        }
      };
    }
  }
}

// Export for use in content scripts and background
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IntegratedAnalysisService;
} else if (typeof window !== 'undefined') {
  window.IntegratedAnalysisService = IntegratedAnalysisService;
}

