import { supabase } from '../config/supabase';
import { AnalyticsService } from './AnalyticsService';
import TierService from './TierService';
import {
  AnalysisRequest,
  AnalysisResult,
  ScreenshotAnalysisRequest,
  ConversationAnalysisRequest,
  PhotoAnalysisRequest,
  VoiceAnalysisRequest,
  AnalysisType,
  AnalysisDepth
} from '../types';

export class AnalysisService {
  private static instance: AnalysisService;
  private analysisCache: Map<string, AnalysisResult> = new Map();
  private pendingRequests: Map<string, Promise<AnalysisResult>> = new Map();

  // Singleton pattern
  public static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
  }

  // Screenshot analysis
  public async analyzeScreenshot(request: ScreenshotAnalysisRequest): Promise<AnalysisResult> {
    try {
      const startTime = Date.now();
      
      // Generate request ID for deduplication
      const requestId = this.generateRequestId('screenshot', request);
      
      // Check for pending request
      if (this.pendingRequests.has(requestId)) {
        return await this.pendingRequests.get(requestId)!;
      }

      // Check cache
      const cached = this.analysisCache.get(requestId);
      if (cached && this.isCacheValid(cached)) {
        AnalyticsService.track('analysis_cache_hit', {
          type: 'screenshot',
          tier: request.tier
        });
        return cached;
      }

      // Create analysis promise
      const analysisPromise = this.performScreenshotAnalysis(request);
      this.pendingRequests.set(requestId, analysisPromise);

      try {
        const result = await analysisPromise;
        
        // Cache result
        this.analysisCache.set(requestId, result);
        
        // Track analytics
        AnalyticsService.track('screenshot_analysis_completed', {
          tier: request.tier,
          analysisDepth: request.analysisDepth,
          processingTime: Date.now() - startTime,
          confidence: result.confidence,
          screenshotCount: request.screenshots.length
        });

        return result;

      } finally {
        this.pendingRequests.delete(requestId);
      }

    } catch (error) {
      console.error('Screenshot analysis error:', error);
      
      AnalyticsService.track('analysis_error', {
        type: 'screenshot',
        error: error.message,
        tier: request.tier
      });

      throw new Error(`Screenshot analysis failed: ${error.message}`);
    }
  }

  // Perform screenshot analysis
  private async performScreenshotAnalysis(request: ScreenshotAnalysisRequest): Promise<AnalysisResult> {
    const { data, error } = await supabase.functions.invoke('unified-analysis-v2', {
      body: {
        type: 'screenshot',
        data: {
          screenshots: request.screenshots,
          tier: request.tier,
          analysisDepth: request.analysisDepth,
          platform: request.platform,
          metadata: request.metadata
        }
      }
    });

    if (error) {
      throw new Error(`Analysis API error: ${error.message}`);
    }

    return this.formatAnalysisResult(data, 'screenshot');
  }

  // Conversation analysis
  public async analyzeConversation(request: ConversationAnalysisRequest): Promise<AnalysisResult> {
    try {
      const startTime = Date.now();
      const requestId = this.generateRequestId('conversation', request);

      // Check for pending request
      if (this.pendingRequests.has(requestId)) {
        return await this.pendingRequests.get(requestId)!;
      }

      // Check cache
      const cached = this.analysisCache.get(requestId);
      if (cached && this.isCacheValid(cached)) {
        AnalyticsService.track('analysis_cache_hit', {
          type: 'conversation',
          tier: request.tier
        });
        return cached;
      }

      // Create analysis promise
      const analysisPromise = this.performConversationAnalysis(request);
      this.pendingRequests.set(requestId, analysisPromise);

      try {
        const result = await analysisPromise;
        
        // Cache result
        this.analysisCache.set(requestId, result);
        
        // Track analytics
        AnalyticsService.track('conversation_analysis_completed', {
          tier: request.tier,
          analysisDepth: request.analysisDepth,
          processingTime: Date.now() - startTime,
          confidence: result.confidence,
          messageCount: request.messages.length
        });

        return result;

      } finally {
        this.pendingRequests.delete(requestId);
      }

    } catch (error) {
      console.error('Conversation analysis error:', error);
      
      AnalyticsService.track('analysis_error', {
        type: 'conversation',
        error: error.message,
        tier: request.tier
      });

      throw new Error(`Conversation analysis failed: ${error.message}`);
    }
  }

  // Perform conversation analysis
  private async performConversationAnalysis(request: ConversationAnalysisRequest): Promise<AnalysisResult> {
    const { data, error } = await supabase.functions.invoke('unified-analysis-v2', {
      body: {
        type: 'conversation',
        data: {
          messages: request.messages,
          tier: request.tier,
          analysisDepth: request.analysisDepth,
          platform: request.platform,
          metadata: request.metadata
        }
      }
    });

    if (error) {
      throw new Error(`Analysis API error: ${error.message}`);
    }

    return this.formatAnalysisResult(data, 'conversation');
  }

  // Photo analysis
  public async analyzePhoto(request: PhotoAnalysisRequest): Promise<AnalysisResult> {
    try {
      const startTime = Date.now();
      const requestId = this.generateRequestId('photo', request);

      // Check for pending request
      if (this.pendingRequests.has(requestId)) {
        return await this.pendingRequests.get(requestId)!;
      }

      // Check cache
      const cached = this.analysisCache.get(requestId);
      if (cached && this.isCacheValid(cached)) {
        AnalyticsService.track('analysis_cache_hit', {
          type: 'photo',
          tier: request.tier
        });
        return cached;
      }

      // Create analysis promise
      const analysisPromise = this.performPhotoAnalysis(request);
      this.pendingRequests.set(requestId, analysisPromise);

      try {
        const result = await analysisPromise;
        
        // Cache result
        this.analysisCache.set(requestId, result);
        
        // Track analytics
        AnalyticsService.track('photo_analysis_completed', {
          tier: request.tier,
          analysisDepth: request.analysisDepth,
          processingTime: Date.now() - startTime,
          confidence: result.confidence,
          photoCount: request.photos.length
        });

        return result;

      } finally {
        this.pendingRequests.delete(requestId);
      }

    } catch (error) {
      console.error('Photo analysis error:', error);
      
      AnalyticsService.track('analysis_error', {
        type: 'photo',
        error: error.message,
        tier: request.tier
      });

      throw new Error(`Photo analysis failed: ${error.message}`);
    }
  }

  // Perform photo analysis
  private async performPhotoAnalysis(request: PhotoAnalysisRequest): Promise<AnalysisResult> {
    const { data, error } = await supabase.functions.invoke('unified-analysis-v2', {
      body: {
        type: 'photo',
        data: {
          photos: request.photos,
          tier: request.tier,
          analysisDepth: request.analysisDepth,
          platform: request.platform,
          metadata: request.metadata
        }
      }
    });

    if (error) {
      throw new Error(`Analysis API error: ${error.message}`);
    }

    return this.formatAnalysisResult(data, 'photo');
  }

  // Voice analysis
  public async analyzeVoice(request: VoiceAnalysisRequest): Promise<AnalysisResult> {
    try {
      const startTime = Date.now();
      const requestId = this.generateRequestId('voice', request);

      // Check for pending request
      if (this.pendingRequests.has(requestId)) {
        return await this.pendingRequests.get(requestId)!;
      }

      // Check cache
      const cached = this.analysisCache.get(requestId);
      if (cached && this.isCacheValid(cached)) {
        AnalyticsService.track('analysis_cache_hit', {
          type: 'voice',
          tier: request.tier
        });
        return cached;
      }

      // Create analysis promise
      const analysisPromise = this.performVoiceAnalysis(request);
      this.pendingRequests.set(requestId, analysisPromise);

      try {
        const result = await analysisPromise;
        
        // Cache result
        this.analysisCache.set(requestId, result);
        
        // Track analytics
        AnalyticsService.track('voice_analysis_completed', {
          tier: request.tier,
          analysisDepth: request.analysisDepth,
          processingTime: Date.now() - startTime,
          confidence: result.confidence,
          duration: request.metadata?.duration
        });

        return result;

      } finally {
        this.pendingRequests.delete(requestId);
      }

    } catch (error) {
      console.error('Voice analysis error:', error);
      
      AnalyticsService.track('analysis_error', {
        type: 'voice',
        error: error.message,
        tier: request.tier
      });

      throw new Error(`Voice analysis failed: ${error.message}`);
    }
  }

  // Perform voice analysis
  private async performVoiceAnalysis(request: VoiceAnalysisRequest): Promise<AnalysisResult> {
    const { data, error } = await supabase.functions.invoke('unified-analysis-v2', {
      body: {
        type: 'voice',
        data: {
          audioFile: request.audioFile,
          tier: request.tier,
          analysisDepth: request.analysisDepth,
          platform: request.platform,
          metadata: request.metadata
        }
      }
    });

    if (error) {
      throw new Error(`Analysis API error: ${error.message}`);
    }

    return this.formatAnalysisResult(data, 'voice');
  }

  // Generate request ID for caching and deduplication
  private generateRequestId(type: AnalysisType, request: any): string {
    const key = {
      type,
      tier: request.tier,
      analysisDepth: request.analysisDepth,
      // Create hash of content for deduplication
      contentHash: this.hashContent(request)
    };
    
    return btoa(JSON.stringify(key)).replace(/[^a-zA-Z0-9]/g, '');
  }

  // Hash content for deduplication
  private hashContent(request: any): string {
    let content = '';
    
    if (request.screenshots) {
      content += request.screenshots.join('|');
    }
    if (request.messages) {
      content += request.messages.map((m: any) => `${m.text}:${m.sender}`).join('|');
    }
    if (request.photos) {
      content += request.photos.join('|');
    }
    if (request.audioFile) {
      content += request.audioFile;
    }
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  // Check if cache is valid
  private isCacheValid(result: AnalysisResult): boolean {
    const cacheAge = Date.now() - result.timestamp.getTime();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    return cacheAge < maxAge;
  }

  // Format analysis result
  private formatAnalysisResult(data: any, type: AnalysisType): AnalysisResult {
    return {
      id: data.id || `${type}_${Date.now()}`,
      type,
      confidence: data.confidence || 0.8,
      processingTime: data.processingTime || 0,
      timestamp: new Date(),
      
      // Core analysis data
      analysis: {
        summary: data.analysis?.summary || '',
        score: data.analysis?.score || 0,
        insights: data.analysis?.insights || [],
        recommendations: data.analysis?.recommendations || [],
        redFlags: data.analysis?.redFlags || [],
        strengths: data.analysis?.strengths || []
      },

      // Suggestions
      suggestions: {
        openers: data.suggestions?.openers || [],
        responses: data.suggestions?.responses || [],
        improvements: data.suggestions?.improvements || [],
        strategies: data.suggestions?.strategies || []
      },

      // Compatibility (for profile analysis)
      compatibility: data.compatibility ? {
        score: data.compatibility.score || 0,
        factors: data.compatibility.factors || [],
        reasoning: data.compatibility.reasoning || '',
        potential: data.compatibility.potential || 'medium'
      } : undefined,

      // Metrics
      metrics: {
        attractiveness: data.metrics?.attractiveness,
        engagement: data.metrics?.engagement,
        authenticity: data.metrics?.authenticity,
        confidence: data.metrics?.confidence,
        humor: data.metrics?.humor,
        intelligence: data.metrics?.intelligence
      },

      // Metadata
      metadata: {
        tier: data.metadata?.tier || 'free',
        analysisDepth: data.metadata?.analysisDepth || 'basic',
        platform: data.metadata?.platform || 'mobile',
        version: data.metadata?.version || '1.0',
        ...data.metadata
      }
    };
  }

  // Get analysis history
  public async getAnalysisHistory(
    userId: string, 
    type?: AnalysisType, 
    limit: number = 20
  ): Promise<AnalysisResult[]> {
    try {
      let query = supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (type) {
        query = query.eq('analysis_type', type);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.map(record => ({
        id: record.id,
        type: record.analysis_type,
        confidence: record.confidence,
        processingTime: record.processing_time,
        timestamp: new Date(record.created_at),
        analysis: record.analysis_data.analysis,
        suggestions: record.analysis_data.suggestions,
        compatibility: record.analysis_data.compatibility,
        metrics: record.analysis_data.metrics,
        metadata: record.metadata
      }));

    } catch (error) {
      console.error('Error fetching analysis history:', error);
      return [];
    }
  }

  // Save analysis result
  public async saveAnalysisResult(
    userId: string, 
    result: AnalysisResult
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('analysis_history')
        .insert({
          user_id: userId,
          analysis_type: result.type,
          confidence: result.confidence,
          processing_time: result.processingTime,
          analysis_data: {
            analysis: result.analysis,
            suggestions: result.suggestions,
            compatibility: result.compatibility,
            metrics: result.metrics
          },
          metadata: result.metadata,
          created_at: result.timestamp.toISOString()
        });

      if (error) {
        throw error;
      }

      AnalyticsService.track('analysis_saved', {
        type: result.type,
        confidence: result.confidence,
        tier: result.metadata.tier
      });

    } catch (error) {
      console.error('Error saving analysis result:', error);
    }
  }

  // Clear cache
  public clearCache(): void {
    this.analysisCache.clear();
    this.pendingRequests.clear();
  }

  // Get cache stats
  public getCacheStats(): { size: number; hitRate: number } {
    // This would be implemented with proper hit rate tracking
    return {
      size: this.analysisCache.size,
      hitRate: 0.75 // Placeholder
    };
  }
}

export default AnalysisService.getInstance();

