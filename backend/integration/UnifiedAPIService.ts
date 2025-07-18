/**
 * Unified API Service for AI Dating Coach
 * 
 * This service provides seamless integration between frontend applications
 * and the enhanced AI analysis engine with comprehensive relationship expertise.
 */

import { IntelligentAnalysisEngine, AnalysisRequest, AnalysisResult } from '../ai/IntelligentAnalysisEngine';
import { TierService } from '../services/TierService';
import { SyncService } from '../services/SyncService';
import { SecurityManager } from '../security/SecurityManager';
import { PrivacyManager } from '../privacy/PrivacyManager';
import { createClient } from '@supabase/supabase-js';

export interface APIRequest {
  user_id: string;
  session_token: string;
  request_type: 'profile_analysis' | 'conversation_coaching' | 'compatibility_check' | 'opening_message' | 'photo_analysis' | 'screenshot_analysis';
  data: any;
  options?: {
    depth_level?: 'basic' | 'standard' | 'comprehensive' | 'expert';
    include_recommendations?: boolean;
    cultural_context?: string;
    platform?: string;
    priority?: 'low' | 'normal' | 'high';
  };
}

export interface APIResponse {
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

export class UnifiedAPIService {
  private analysisEngine: IntelligentAnalysisEngine;
  private tierService: TierService;
  private syncService: SyncService;
  private securityManager: SecurityManager;
  private privacyManager: PrivacyManager;
  private supabase: any;
  private requestQueue: Map<string, any>;
  private rateLimiter: Map<string, any>;

  constructor() {
    this.analysisEngine = new IntelligentAnalysisEngine();
    this.tierService = new TierService();
    this.syncService = new SyncService();
    this.securityManager = new SecurityManager();
    this.privacyManager = new PrivacyManager();
    this.requestQueue = new Map();
    this.rateLimiter = new Map();
    
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  /**
   * Main API endpoint for all analysis requests
   */
  async processAnalysisRequest(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // 1. Security validation
      const securityCheck = await this.securityManager.validateRequest(request);
      if (!securityCheck.valid) {
        return this.createErrorResponse('Security validation failed', startTime, requestId);
      }

      // 2. Privacy compliance check
      const privacyCheck = await this.privacyManager.validateDataProcessing(request);
      if (!privacyCheck.allowed) {
        return this.createErrorResponse('Privacy compliance check failed', startTime, requestId);
      }

      // 3. Rate limiting
      const rateLimitCheck = this.checkRateLimit(request.user_id);
      if (!rateLimitCheck.allowed) {
        return this.createErrorResponse('Rate limit exceeded', startTime, requestId);
      }

      // 4. Tier validation and usage tracking
      const tierCheck = await this.tierService.validateAndTrackUsage(
        request.user_id, 
        request.request_type,
        request.options?.depth_level || 'standard'
      );
      
      if (!tierCheck.allowed) {
        return this.createErrorResponse('Tier limit exceeded', startTime, requestId, {
          upgrade_required: true,
          current_tier: tierCheck.current_tier,
          usage_details: tierCheck.usage
        });
      }

      // 5. Prepare analysis request
      const analysisRequest = await this.prepareAnalysisRequest(request);

      // 6. Execute intelligent analysis
      const analysisResult = await this.analysisEngine.analyzeWithIntelligence(analysisRequest);

      // 7. Post-process and enhance results
      const enhancedResult = await this.enhanceAnalysisResult(analysisResult, request);

      // 8. Store analysis for future reference
      const analysisId = await this.storeAnalysis(request.user_id, enhancedResult, requestId);

      // 9. Sync across platforms
      await this.syncService.syncAnalysisResult(request.user_id, analysisId, enhancedResult);

      // 10. Update tier usage
      await this.tierService.updateUsageMetrics(request.user_id, request.request_type, enhancedResult);

      // 11. Create successful response
      return this.createSuccessResponse(enhancedResult, analysisId, tierCheck.usage, startTime, requestId);

    } catch (error) {
      console.error('Analysis request failed:', error);
      
      // Log error for monitoring
      await this.logError(requestId, request, error);
      
      return this.createErrorResponse(
        error.message || 'Analysis failed',
        startTime,
        requestId
      );
    }
  }

  /**
   * Prepare analysis request with context enrichment
   */
  private async prepareAnalysisRequest(request: APIRequest): Promise<AnalysisRequest> {
    // Get user profile and preferences
    const userProfile = await this.getUserProfile(request.user_id);
    const userPreferences = await this.getUserPreferences(request.user_id);

    // Enrich context with user data
    const context = {
      userProfile: userProfile,
      userPreferences: userPreferences,
      platform: request.options?.platform || 'unknown',
      culturalContext: request.options?.cultural_context || userProfile?.cultural_background,
      ageRange: userProfile?.age_range,
      relationship_goals: userProfile?.relationship_goals,
      ...request.data
    };

    // Determine optimal analysis options
    const options = {
      depth_level: request.options?.depth_level || 'standard',
      model_preference: this.selectOptimalModel(request.request_type, request.options?.depth_level),
      response_format: 'json',
      confidence_threshold: this.getConfidenceThreshold(request.options?.depth_level),
      multi_model_validation: request.options?.depth_level === 'expert'
    };

    return {
      type: this.mapRequestType(request.request_type),
      context: context,
      options: options
    };
  }

  /**
   * Enhance analysis result with additional insights and recommendations
   */
  private async enhanceAnalysisResult(result: AnalysisResult, request: APIRequest): Promise<any> {
    const enhanced = {
      ...result,
      enhanced_insights: await this.generateEnhancedInsights(result, request),
      actionable_recommendations: await this.generateActionableRecommendations(result, request),
      compatibility_scores: await this.calculateCompatibilityScores(result, request),
      improvement_suggestions: await this.generateImprovementSuggestions(result, request),
      next_steps: await this.generateNextSteps(result, request),
      cultural_adaptations: await this.generateCulturalAdaptations(result, request)
    };

    // Add platform-specific optimizations
    if (request.options?.platform) {
      enhanced.platform_optimizations = await this.generatePlatformOptimizations(result, request.options.platform);
    }

    return enhanced;
  }

  /**
   * Store analysis result in database
   */
  private async storeAnalysis(userId: string, result: any, requestId: string): Promise<string> {
    const analysisRecord = {
      id: requestId,
      user_id: userId,
      analysis_type: result.analysis_type,
      result_data: result,
      confidence: result.confidence,
      model_used: result.model_used,
      processing_time: result.processing_time,
      created_at: new Date().toISOString(),
      metadata: {
        version: '2.0',
        engine: 'intelligent-analysis-engine'
      }
    };

    const { data, error } = await this.supabase
      .from('analysis_results')
      .insert(analysisRecord)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store analysis: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Generate enhanced insights based on analysis result
   */
  private async generateEnhancedInsights(result: AnalysisResult, request: APIRequest): Promise<any> {
    return {
      personality_insights: this.extractPersonalityInsights(result),
      attraction_insights: this.extractAttractionInsights(result),
      compatibility_insights: this.extractCompatibilityInsights(result),
      communication_insights: this.extractCommunicationInsights(result),
      lifestyle_insights: this.extractLifestyleInsights(result),
      cultural_insights: this.extractCulturalInsights(result)
    };
  }

  /**
   * Generate actionable recommendations
   */
  private async generateActionableRecommendations(result: AnalysisResult, request: APIRequest): Promise<any[]> {
    const recommendations = [];

    // Profile optimization recommendations
    if (request.request_type === 'profile_analysis') {
      recommendations.push(...this.generateProfileRecommendations(result));
    }

    // Conversation recommendations
    if (request.request_type === 'conversation_coaching') {
      recommendations.push(...this.generateConversationRecommendations(result));
    }

    // Photo recommendations
    if (request.request_type === 'photo_analysis') {
      recommendations.push(...this.generatePhotoRecommendations(result));
    }

    // General relationship recommendations
    recommendations.push(...this.generateGeneralRecommendations(result));

    return recommendations;
  }

  /**
   * Rate limiting implementation
   */
  private checkRateLimit(userId: string): { allowed: boolean; remaining?: number } {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 30; // 30 requests per minute

    if (!this.rateLimiter.has(userId)) {
      this.rateLimiter.set(userId, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    const userLimit = this.rateLimiter.get(userId);
    
    if (now > userLimit.resetTime) {
      // Reset window
      this.rateLimiter.set(userId, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    if (userLimit.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    userLimit.count++;
    return { allowed: true, remaining: maxRequests - userLimit.count };
  }

  /**
   * Helper methods for data retrieval and processing
   */
  private async getUserProfile(userId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Failed to get user profile:', error);
      return {};
    }

    return data;
  }

  private async getUserPreferences(userId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Failed to get user preferences:', error);
      return {};
    }

    return data;
  }

  private selectOptimalModel(requestType: string, depthLevel?: string): string {
    const modelSelection = {
      'profile_analysis': {
        'expert': 'gpt4',
        'comprehensive': 'gpt4',
        'standard': 'gpt4',
        'basic': 'auto'
      },
      'conversation_coaching': {
        'expert': 'gpt4',
        'comprehensive': 'gpt4',
        'standard': 'gpt4',
        'basic': 'auto'
      },
      'photo_analysis': {
        'expert': 'gpt4',
        'comprehensive': 'gpt4',
        'standard': 'auto',
        'basic': 'auto'
      }
    };

    const depth = depthLevel || 'standard';
    return modelSelection[requestType]?.[depth] || 'auto';
  }

  private getConfidenceThreshold(depthLevel?: string): number {
    const thresholds = {
      'expert': 90,
      'comprehensive': 85,
      'standard': 80,
      'basic': 75
    };

    return thresholds[depthLevel || 'standard'];
  }

  private mapRequestType(requestType: string): string {
    const mapping = {
      'profile_analysis': 'profile',
      'conversation_coaching': 'conversation',
      'compatibility_check': 'compatibility',
      'opening_message': 'opening_message',
      'photo_analysis': 'photo',
      'screenshot_analysis': 'photo'
    };

    return mapping[requestType] || requestType;
  }

  /**
   * Response creation helpers
   */
  private createSuccessResponse(
    result: any, 
    analysisId: string, 
    tierUsage: any, 
    startTime: number, 
    requestId: string
  ): APIResponse {
    return {
      success: true,
      data: result.analysis,
      analysis_id: analysisId,
      confidence: result.confidence,
      processing_time: Date.now() - startTime,
      tier_usage: tierUsage,
      recommendations: result.recommendations,
      insights: result.psychological_insights,
      metadata: {
        model_used: result.model_used,
        analysis_version: '2.0',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    };
  }

  private createErrorResponse(
    error: string, 
    startTime: number, 
    requestId: string, 
    additionalData?: any
  ): APIResponse {
    return {
      success: false,
      error: error,
      confidence: 0,
      processing_time: Date.now() - startTime,
      tier_usage: null,
      metadata: {
        model_used: 'none',
        analysis_version: '2.0',
        timestamp: new Date().toISOString(),
        request_id: requestId
      },
      ...additionalData
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logError(requestId: string, request: APIRequest, error: any): Promise<void> {
    try {
      await this.supabase
        .from('error_logs')
        .insert({
          request_id: requestId,
          user_id: request.user_id,
          error_message: error.message,
          error_stack: error.stack,
          request_data: request,
          timestamp: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  // Placeholder methods for insight extraction (to be implemented)
  private extractPersonalityInsights(result: AnalysisResult): any { return {}; }
  private extractAttractionInsights(result: AnalysisResult): any { return {}; }
  private extractCompatibilityInsights(result: AnalysisResult): any { return {}; }
  private extractCommunicationInsights(result: AnalysisResult): any { return {}; }
  private extractLifestyleInsights(result: AnalysisResult): any { return {}; }
  private extractCulturalInsights(result: AnalysisResult): any { return {}; }
  
  private generateProfileRecommendations(result: AnalysisResult): any[] { return []; }
  private generateConversationRecommendations(result: AnalysisResult): any[] { return []; }
  private generatePhotoRecommendations(result: AnalysisResult): any[] { return []; }
  private generateGeneralRecommendations(result: AnalysisResult): any[] { return []; }
  
  private async calculateCompatibilityScores(result: AnalysisResult, request: APIRequest): Promise<any> { return {}; }
  private async generateImprovementSuggestions(result: AnalysisResult, request: APIRequest): Promise<any> { return []; }
  private async generateNextSteps(result: AnalysisResult, request: APIRequest): Promise<any> { return []; }
  private async generateCulturalAdaptations(result: AnalysisResult, request: APIRequest): Promise<any> { return {}; }
  private async generatePlatformOptimizations(result: AnalysisResult, platform: string): Promise<any> { return {}; }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; services: any }> {
    const services = {
      analysis_engine: 'healthy',
      database: 'healthy',
      tier_service: 'healthy',
      sync_service: 'healthy',
      security_manager: 'healthy',
      privacy_manager: 'healthy'
    };

    try {
      // Check database connection
      const { data, error } = await this.supabase
        .from('health_check')
        .select('count')
        .limit(1);
      
      if (error) {
        services.database = 'unhealthy';
      }

      // Check analysis engine
      const engineMetrics = this.analysisEngine.getPerformanceMetrics();
      if (engineMetrics.size === 0) {
        services.analysis_engine = 'warning';
      }

    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'unhealthy', services };
    }

    const overallStatus = Object.values(services).every(status => status === 'healthy') 
      ? 'healthy' 
      : 'degraded';

    return { status: overallStatus, services };
  }
}

export default UnifiedAPIService;

