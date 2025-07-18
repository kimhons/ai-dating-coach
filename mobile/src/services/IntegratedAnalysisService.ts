/**
 * Integrated Analysis Service for Mobile App
 * 
 * Connects mobile app to the comprehensive relationship expert backend
 * with advanced LLM optimization and seamless integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TierService } from './TierService';
import { SyncService } from './SyncService';

export interface AnalysisRequest {
  type: 'profile_analysis' | 'conversation_coaching' | 'photo_analysis' | 'screenshot_analysis' | 'compatibility_check';
  data: any;
  options?: {
    depth_level?: 'basic' | 'standard' | 'comprehensive' | 'expert';
    include_recommendations?: boolean;
    cultural_context?: string;
    platform?: string;
    priority?: 'low' | 'normal' | 'high';
  };
}

export interface AnalysisResponse {
  success: boolean;
  data?: any;
  error?: string;
  analysis_id?: string;
  confidence: number;
  processing_time: number;
  tier_usage: any;
  recommendations?: any[];
  insights?: any;
  metadata?: {
    model_used: string;
    analysis_version: string;
    timestamp: string;
    request_id: string;
  };
}

export class IntegratedAnalysisService {
  private static instance: IntegratedAnalysisService;
  private tierService: TierService;
  private syncService: SyncService;
  private baseUrl: string;
  private requestQueue: Map<string, Promise<AnalysisResponse>>;
  private cache: Map<string, { response: AnalysisResponse; timestamp: number }>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.tierService = TierService.getInstance();
    this.syncService = SyncService.getInstance();
    this.baseUrl = process.env.REACT_APP_API_URL || 'https://your-api-url.com';
    this.requestQueue = new Map();
    this.cache = new Map();
  }

  static getInstance(): IntegratedAnalysisService {
    if (!IntegratedAnalysisService.instance) {
      IntegratedAnalysisService.instance = new IntegratedAnalysisService();
    }
    return IntegratedAnalysisService.instance;
  }

  /**
   * Comprehensive Profile Analysis with Dr. Elena Rodriguez expertise
   */
  async analyzeProfile(
    targetProfile: any,
    options: {
      depth_level?: 'basic' | 'standard' | 'comprehensive' | 'expert';
      platform?: string;
      cultural_context?: string;
    } = {}
  ): Promise<AnalysisResponse> {
    const request: AnalysisRequest = {
      type: 'profile_analysis',
      data: { targetProfile },
      options: {
        depth_level: options.depth_level || 'comprehensive',
        include_recommendations: true,
        cultural_context: options.cultural_context || await this.getUserCulturalContext(),
        platform: options.platform || 'mobile',
        priority: 'normal'
      }
    };

    return this.processAnalysisRequest(request);
  }

  /**
   * Comprehensive Conversation Coaching across all relationship domains
   */
  async coachConversation(
    conversationHistory: any[],
    userProfile: any,
    targetProfile: any,
    options: {
      depth_level?: 'basic' | 'standard' | 'comprehensive' | 'expert';
      platform?: string;
    } = {}
  ): Promise<AnalysisResponse> {
    const request: AnalysisRequest = {
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
        platform: options.platform || 'mobile',
        priority: 'high'
      }
    };

    return this.processAnalysisRequest(request);
  }

  /**
   * Advanced Photo Analysis with technical and psychological insights
   */
  async analyzePhoto(
    photoData: any,
    options: {
      depth_level?: 'basic' | 'standard' | 'comprehensive' | 'expert';
      analysis_type?: 'technical' | 'psychological' | 'comprehensive';
    } = {}
  ): Promise<AnalysisResponse> {
    const request: AnalysisRequest = {
      type: 'photo_analysis',
      data: { photoData },
      options: {
        depth_level: options.depth_level || 'standard',
        include_recommendations: true,
        cultural_context: await this.getUserCulturalContext(),
        platform: 'mobile',
        priority: 'normal'
      }
    };

    return this.processAnalysisRequest(request);
  }

  /**
   * One-tap Screenshot Analysis for floating button
   */
  async analyzeScreenshot(
    screenshotData: any,
    context: {
      app_name?: string;
      screen_type?: string;
      user_intent?: string;
    } = {}
  ): Promise<AnalysisResponse> {
    const request: AnalysisRequest = {
      type: 'screenshot_analysis',
      data: {
        screenshotData,
        context
      },
      options: {
        depth_level: 'standard',
        include_recommendations: true,
        cultural_context: await this.getUserCulturalContext(),
        platform: 'mobile',
        priority: 'high'
      }
    };

    return this.processAnalysisRequest(request);
  }

  /**
   * Multi-dimensional Compatibility Assessment
   */
  async checkCompatibility(
    userProfile: any,
    targetProfile: any,
    options: {
      depth_level?: 'basic' | 'standard' | 'comprehensive' | 'expert';
      focus_areas?: string[];
    } = {}
  ): Promise<AnalysisResponse> {
    const request: AnalysisRequest = {
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
        platform: 'mobile',
        priority: 'normal'
      }
    };

    return this.processAnalysisRequest(request);
  }

  /**
   * Process analysis request with comprehensive integration
   */
  private async processAnalysisRequest(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      // 1. Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Check if request is already in progress
      if (this.requestQueue.has(cacheKey)) {
        return await this.requestQueue.get(cacheKey)!;
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

        // 5. Sync result across platforms
        if (response.success && response.analysis_id) {
          await this.syncService.syncAnalysisResult(
            await this.getUserId(),
            response.analysis_id,
            response
          );
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
  private async executeAnalysisRequest(request: AnalysisRequest): Promise<AnalysisResponse> {
    const userId = await this.getUserId();
    const sessionToken = await this.getSessionToken();

    // Check tier limits before making request
    const tierCheck = await this.tierService.checkUsageLimit(
      request.type,
      request.options?.depth_level || 'standard'
    );

    if (!tierCheck.allowed) {
      return {
        success: false,
        error: 'Tier limit exceeded',
        confidence: 0,
        processing_time: 0,
        tier_usage: tierCheck,
        upgrade_required: true,
        current_tier: tierCheck.current_tier
      } as any;
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
      await this.tierService.updateUsage(request.type, request.options?.depth_level || 'standard');
    }

    return result;
  }

  /**
   * Cache management
   */
  private generateCacheKey(request: AnalysisRequest): string {
    const keyData = {
      type: request.type,
      data: request.data,
      options: request.options
    };
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  private getCachedResponse(cacheKey: string): AnalysisResponse | null {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.response;
    }
    if (cached) {
      this.cache.delete(cacheKey);
    }
    return null;
  }

  private cacheResponse(cacheKey: string, response: AnalysisResponse): void {
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });

    // Cleanup old cache entries
    if (this.cache.size > 100) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Helper methods
   */
  private async getUserId(): Promise<string> {
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return userId;
  }

  private async getSessionToken(): Promise<string> {
    const token = await AsyncStorage.getItem('session_token');
    if (!token) {
      throw new Error('Session token not found');
    }
    return token;
  }

  private async getUserCulturalContext(): Promise<string> {
    const context = await AsyncStorage.getItem('cultural_context');
    return context || 'western_urban';
  }

  /**
   * Performance monitoring
   */
  getPerformanceMetrics(): any {
    return {
      cache_size: this.cache.size,
      queue_size: this.requestQueue.size,
      cache_hit_rate: this.calculateCacheHitRate()
    };
  }

  private calculateCacheHitRate(): number {
    // Implementation would track cache hits vs misses
    return 0.85; // Placeholder
  }

  /**
   * Clear cache and reset service
   */
  clearCache(): void {
    this.cache.clear();
    this.requestQueue.clear();
  }
}

export default IntegratedAnalysisService;

