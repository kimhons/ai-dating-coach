/**
 * Conversation Analysis Service
 * Handles conversation analysis requests to Supabase Edge Functions
 * Integrates with existing conversation-analysis backend implementation
 */

import { 
  supabase, 
  FUNCTIONS, 
  TABLES,
  APIResponse, 
  ConversationAnalysisRequest, 
  ConversationAnalysisResult,
  MessageSuggestion,
  APIError,
  ErrorType,
  SubscriptionTier,
  getRemainingUsage
} from '../config/supabase';

export interface ConversationInput {
  type: 'text' | 'screenshot';
  content: string | File | Blob;
  platform: string;
  context?: {
    previousMessages?: string[];
    userProfile?: any;
    matchProfile?: any;
  };
}

export interface ConversationHistory {
  id: string;
  user_id: string;
  platform: string;
  conversation_preview: string;
  analysis_result: ConversationAnalysisResult;
  created_at: string;
}

export class ConversationAnalysisService {
  private static instance: ConversationAnalysisService;
  private cache: Map<string, { result: ConversationAnalysisResult; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  public static getInstance(): ConversationAnalysisService {
    if (!ConversationAnalysisService.instance) {
      ConversationAnalysisService.instance = new ConversationAnalysisService();
    }
    return ConversationAnalysisService.instance;
  }

  /**
   * Analyze a conversation using the Supabase Edge Function
   */
  async analyzeConversation(
    input: ConversationInput,
    options: {
      useCache?: boolean;
      generateSuggestions?: boolean;
      analysisDepth?: 'quick' | 'detailed';
    } = {}
  ): Promise<APIResponse<ConversationAnalysisResult>> {
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new APIError(ErrorType.AUTHENTICATION_ERROR, 'User not authenticated');
      }

      // Check usage limits
      const usageCheck = await this.checkUsageLimit(user.id);
      if (!usageCheck.success) {
        return usageCheck;
      }

      // Generate cache key
      const cacheKey = await this.generateCacheKey(input);
      
      // Check cache if enabled
      if (options.useCache !== false) {
        const cachedResult = this.getCachedResult(cacheKey);
        if (cachedResult) {
          return {
            data: cachedResult,
            error: null,
            success: true,
            metadata: {
              timestamp: new Date().toISOString(),
              requestId: `cached-${Date.now()}`,
              usage: usageCheck.data?.usage
            }
          };
        }
      }

      // Process input based on type
      let requestPayload: ConversationAnalysisRequest;
      
      if (input.type === 'text') {
        requestPayload = {
          conversation_text: input.content as string,
          user_id: user.id,
          platform: input.platform,
          analysis_type: 'text'
        };
      } else {
        // Handle screenshot upload
        const uploadResult = await this.uploadScreenshot(input.content as File | Blob, user.id);
        if (!uploadResult.success || !uploadResult.data) {
          return uploadResult as APIResponse<ConversationAnalysisResult>;
        }

        requestPayload = {
          screenshot_url: uploadResult.data,
          user_id: user.id,
          platform: input.platform,
          analysis_type: 'screenshot'
        };
      }

      // Add context if provided
      if (input.context) {
        requestPayload = {
          ...requestPayload,
          context: input.context
        };
      }

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke(FUNCTIONS.CONVERSATION_ANALYSIS, {
        body: {
          ...requestPayload,
          options: {
            generate_suggestions: options.generateSuggestions !== false,
            analysis_depth: options.analysisDepth || 'detailed'
          }
        }
      });

      if (error) {
        throw new APIError(
          ErrorType.SERVER_ERROR,
          `Conversation analysis failed: ${error.message}`,
          error.status,
          error
        );
      }

      // Validate response structure
      if (!data || typeof data.engagement_score !== 'number') {
        throw new APIError(
          ErrorType.SERVER_ERROR,
          'Invalid response format from conversation analysis service'
        );
      }

      // Transform response to match our interface
      const analysisResult: ConversationAnalysisResult = {
        id: data.id || `analysis-${Date.now()}`,
        user_id: user.id,
        engagement_score: data.engagement_score,
        sentiment_score: data.sentiment_score,
        response_quality_score: data.response_quality_score,
        context_summary: data.context_summary || '',
        coaching_feedback: data.coaching_feedback || '',
        next_message_suggestions: this.formatMessageSuggestions(data.next_message_suggestions || []),
        red_flags: data.red_flags || [],
        positive_signals: data.positive_signals || [],
        analysis_date: new Date().toISOString(),
        platform: input.platform
      };

      // Cache the result
      this.cacheResult(cacheKey, analysisResult);

      // Save to database
      await this.saveAnalysisResult(analysisResult, input);

      // Update usage tracking
      await this.updateUsageTracking(user.id, 'conversation_analysis');

      return {
        data: analysisResult,
        error: null,
        success: true,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: data.request_id || `req-${Date.now()}`,
          usage: await this.getCurrentUsage(user.id)
        }
      };

    } catch (error) {
      console.error('Conversation analysis error:', error);
      
      if (error instanceof APIError) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: null,
        error: 'An unexpected error occurred during conversation analysis',
        success: false
      };
    }
  }

  /**
   * Generate additional message suggestions
   */
  async generateMoreSuggestions(
    conversationId: string,
    options: {
      tone?: 'enthusiastic' | 'casual' | 'flirty' | 'thoughtful';
      count?: number;
    } = {}
  ): Promise<APIResponse<MessageSuggestion[]>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new APIError(ErrorType.AUTHENTICATION_ERROR, 'User not authenticated');
      }

      // Get original conversation analysis
      const { data: analysis, error: fetchError } = await supabase
        .from(TABLES.CONVERSATION_ANALYSES)
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !analysis) {
        throw new APIError(
          ErrorType.VALIDATION_ERROR,
          'Conversation analysis not found'
        );
      }

      // Call Edge Function for more suggestions
      const { data, error } = await supabase.functions.invoke('generate-message-suggestions', {
        body: {
          conversation_id: conversationId,
          context_summary: analysis.context_summary,
          platform: analysis.platform,
          tone: options.tone,
          count: options.count || 3
        }
      });

      if (error) {
        throw new APIError(
          ErrorType.SERVER_ERROR,
          `Failed to generate suggestions: ${error.message}`
        );
      }

      const suggestions = this.formatMessageSuggestions(data.suggestions || []);

      return {
        data: suggestions,
        error: null,
        success: true,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: `suggestions-${Date.now()}`
        }
      };

    } catch (error) {
      console.error('Generate suggestions error:', error);
      
      if (error instanceof APIError) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: null,
        error: 'Failed to generate additional suggestions',
        success: false
      };
    }
  }

  /**
   * Get conversation analysis history
   */
  async getConversationHistory(
    userId?: string,
    options: {
      limit?: number;
      offset?: number;
      platform?: string;
    } = {}
  ): Promise<APIResponse<ConversationHistory[]>> {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new APIError(ErrorType.AUTHENTICATION_ERROR, 'User not authenticated');
        }
        targetUserId = user.id;
      }

      let query = supabase
        .from(TABLES.CONVERSATION_ANALYSES)
        .select('*')
        .eq('user_id', targetUserId)
        .order('analysis_date', { ascending: false });

      if (options.platform) {
        query = query.eq('platform', options.platform);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new APIError(
          ErrorType.SERVER_ERROR,
          `Failed to fetch conversation history: ${error.message}`
        );
      }

      // Transform to history format
      const history: ConversationHistory[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        platform: item.platform,
        conversation_preview: this.generateConversationPreview(item),
        analysis_result: item,
        created_at: item.analysis_date
      }));

      return {
        data: history,
        error: null,
        success: true,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: `history-${Date.now()}`
        }
      };

    } catch (error) {
      console.error('Get conversation history error:', error);
      
      if (error instanceof APIError) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: null,
        error: 'Failed to fetch conversation history',
        success: false
      };
    }
  }

  /**
   * Delete a conversation analysis
   */
  async deleteConversationAnalysis(analysisId: string): Promise<APIResponse<boolean>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new APIError(ErrorType.AUTHENTICATION_ERROR, 'User not authenticated');
      }

      const { error } = await supabase
        .from(TABLES.CONVERSATION_ANALYSES)
        .delete()
        .eq('id', analysisId)
        .eq('user_id', user.id);

      if (error) {
        throw new APIError(
          ErrorType.SERVER_ERROR,
          `Failed to delete conversation analysis: ${error.message}`
        );
      }

      return {
        data: true,
        error: null,
        success: true,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: `delete-${Date.now()}`
        }
      };

    } catch (error) {
      console.error('Delete conversation analysis error:', error);
      
      if (error instanceof APIError) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: null,
        error: 'Failed to delete conversation analysis',
        success: false
      };
    }
  }

  // Private helper methods

  private async checkUsageLimit(userId: string): Promise<APIResponse<{ usage: any }>> {
    try {
      // Get user subscription tier
      const { data: profile } = await supabase
        .from(TABLES.USERS)
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      const tier = profile?.subscription_tier || SubscriptionTier.SPARK;
      const usage = await this.getCurrentUsage(userId);
      const remaining = getRemainingUsage(usage.conversation_analyses || 0, tier, 'conversation_analyses');

      if (remaining === 0) {
        return {
          data: null,
          error: 'Monthly conversation analysis limit reached. Please upgrade your subscription.',
          success: false
        };
      }

      return {
        data: { usage },
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: 'Failed to check usage limits',
        success: false
      };
    }
  }

  private async getCurrentUsage(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USAGE_TRACKING)
        .select('*')
        .eq('user_id', userId)
        .gte('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || {
        photo_analyses: 0,
        conversation_analyses: 0,
        voice_analyses: 0
      };
    } catch (error) {
      console.error('Get usage error:', error);
      return {
        photo_analyses: 0,
        conversation_analyses: 0,
        voice_analyses: 0
      };
    }
  }

  private async uploadScreenshot(screenshotFile: File | Blob, userId: string): Promise<APIResponse<string>> {
    try {
      const fileExt = screenshotFile instanceof File ? screenshotFile.name.split('.').pop() : 'png';
      const fileName = `${userId}/screenshots/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('conversation-screenshots')
        .upload(fileName, screenshotFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new APIError(
          ErrorType.SERVER_ERROR,
          `Screenshot upload failed: ${error.message}`
        );
      }

      const { data: { publicUrl } } = supabase.storage
        .from('conversation-screenshots')
        .getPublicUrl(data.path);

      return {
        data: publicUrl,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof APIError ? error.message : 'Screenshot upload failed',
        success: false
      };
    }
  }

  private async generateCacheKey(input: ConversationInput): Promise<string> {
    const content = typeof input.content === 'string' 
      ? input.content 
      : `${input.content.size}-${Date.now()}`;
    
    return btoa(`${input.type}-${input.platform}-${content}`).slice(0, 16);
  }

  private getCachedResult(cacheKey: string): ConversationAnalysisResult | null {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result;
    }
    
    if (cached) {
      this.cache.delete(cacheKey);
    }
    
    return null;
  }

  private cacheResult(cacheKey: string, result: ConversationAnalysisResult): void {
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (this.cache.size > 50) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  private formatMessageSuggestions(suggestions: any[]): MessageSuggestion[] {
    return suggestions.map(suggestion => ({
      text: suggestion.text || suggestion.message || '',
      tone: suggestion.tone || 'casual',
      engagement_prediction: suggestion.engagement_prediction || suggestion.score || 0,
      reasoning: suggestion.reasoning || suggestion.explanation || ''
    }));
  }

  private generateConversationPreview(analysis: any): string {
    if (analysis.context_summary) {
      return analysis.context_summary.slice(0, 100) + '...';
    }
    
    return `${analysis.platform} conversation - ${analysis.engagement_score}/10 engagement`;
  }

  private async saveAnalysisResult(result: ConversationAnalysisResult, input: ConversationInput): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.CONVERSATION_ANALYSES)
        .insert({
          ...result,
          conversation_preview: this.generateConversationPreview(result),
          input_type: input.type
        });

      if (error) {
        console.error('Failed to save conversation analysis result:', error);
      }
    } catch (error) {
      console.error('Save conversation analysis result error:', error);
    }
  }

  private async updateUsageTracking(userId: string, analysisType: string): Promise<void> {
    try {
      const currentMonth = new Date();
      const periodStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const periodEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { error } = await supabase.rpc('increment_usage', {
        p_user_id: userId,
        p_analysis_type: analysisType,
        p_period_start: periodStart.toISOString(),
        p_period_end: periodEnd.toISOString()
      });

      if (error) {
        console.error('Failed to update usage tracking:', error);
      }
    } catch (error) {
      console.error('Update usage tracking error:', error);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const conversationAnalysisService = ConversationAnalysisService.getInstance();
export default conversationAnalysisService;

