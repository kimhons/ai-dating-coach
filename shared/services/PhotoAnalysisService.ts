/**
 * Photo Analysis Service
 * Handles photo analysis requests to Supabase Edge Functions
 * Integrates with existing photo-analysis backend implementation
 */

import { 
  supabase, 
  FUNCTIONS, 
  TABLES,
  APIResponse, 
  PhotoAnalysisRequest, 
  PhotoAnalysisResult,
  APIError,
  ErrorType,
  SubscriptionTier,
  getRemainingUsage
} from '../config/supabase';

export class PhotoAnalysisService {
  private static instance: PhotoAnalysisService;
  private cache: Map<string, { result: PhotoAnalysisResult; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  public static getInstance(): PhotoAnalysisService {
    if (!PhotoAnalysisService.instance) {
      PhotoAnalysisService.instance = new PhotoAnalysisService();
    }
    return PhotoAnalysisService.instance;
  }

  /**
   * Analyze a photo using the Supabase Edge Function
   */
  async analyzePhoto(
    imageFile: File | Blob | string,
    options: {
      platform?: string;
      analysisType?: 'profile' | 'general';
      useCache?: boolean;
    } = {}
  ): Promise<APIResponse<PhotoAnalysisResult>> {
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

      // Generate cache key for image
      const imageHash = await this.generateImageHash(imageFile);
      
      // Check cache if enabled
      if (options.useCache !== false) {
        const cachedResult = this.getCachedResult(imageHash);
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

      // Upload image if it's a File/Blob
      let imageUrl: string;
      if (typeof imageFile === 'string') {
        imageUrl = imageFile;
      } else {
        const uploadResult = await this.uploadImage(imageFile, user.id);
        if (!uploadResult.success || !uploadResult.data) {
          return uploadResult as APIResponse<PhotoAnalysisResult>;
        }
        imageUrl = uploadResult.data;
      }

      // Prepare request payload
      const requestPayload: PhotoAnalysisRequest = {
        image_url: imageUrl,
        user_id: user.id,
        platform: options.platform,
        analysis_type: options.analysisType || 'general'
      };

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke(FUNCTIONS.PHOTO_ANALYSIS, {
        body: requestPayload
      });

      if (error) {
        throw new APIError(
          ErrorType.SERVER_ERROR,
          `Photo analysis failed: ${error.message}`,
          error.status,
          error
        );
      }

      // Validate response structure
      if (!data || typeof data.overall_score !== 'number') {
        throw new APIError(
          ErrorType.SERVER_ERROR,
          'Invalid response format from photo analysis service'
        );
      }

      // Transform response to match our interface
      const analysisResult: PhotoAnalysisResult = {
        id: data.id || `analysis-${Date.now()}`,
        user_id: user.id,
        image_url: imageUrl,
        overall_score: data.overall_score,
        appeal_score: data.appeal_score,
        composition_score: data.composition_score,
        emotion_score: data.emotion_score,
        feedback: data.feedback || '',
        suggestions: data.suggestions || [],
        technical_issues: data.technical_issues || [],
        analysis_date: new Date().toISOString(),
        platform: options.platform
      };

      // Cache the result
      this.cacheResult(imageHash, analysisResult);

      // Save to database
      await this.saveAnalysisResult(analysisResult);

      // Update usage tracking
      await this.updateUsageTracking(user.id, 'photo_analysis');

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
      console.error('Photo analysis error:', error);
      
      if (error instanceof APIError) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: null,
        error: 'An unexpected error occurred during photo analysis',
        success: false
      };
    }
  }

  /**
   * Get analysis history for a user
   */
  async getAnalysisHistory(
    userId?: string,
    options: {
      limit?: number;
      offset?: number;
      platform?: string;
    } = {}
  ): Promise<APIResponse<PhotoAnalysisResult[]>> {
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
        .from(TABLES.PHOTO_ANALYSES)
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
          `Failed to fetch analysis history: ${error.message}`
        );
      }

      return {
        data: data || [],
        error: null,
        success: true,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: `history-${Date.now()}`
        }
      };

    } catch (error) {
      console.error('Get analysis history error:', error);
      
      if (error instanceof APIError) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: null,
        error: 'Failed to fetch analysis history',
        success: false
      };
    }
  }

  /**
   * Delete an analysis result
   */
  async deleteAnalysis(analysisId: string): Promise<APIResponse<boolean>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new APIError(ErrorType.AUTHENTICATION_ERROR, 'User not authenticated');
      }

      const { error } = await supabase
        .from(TABLES.PHOTO_ANALYSES)
        .delete()
        .eq('id', analysisId)
        .eq('user_id', user.id);

      if (error) {
        throw new APIError(
          ErrorType.SERVER_ERROR,
          `Failed to delete analysis: ${error.message}`
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
      console.error('Delete analysis error:', error);
      
      if (error instanceof APIError) {
        return {
          data: null,
          error: error.message,
          success: false
        };
      }

      return {
        data: null,
        error: 'Failed to delete analysis',
        success: false
      };
    }
  }

  /**
   * Get current usage statistics
   */
  async getCurrentUsage(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USAGE_TRACKING)
        .select('*')
        .eq('user_id', userId)
        .gte('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
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
      const remaining = getRemainingUsage(usage.photo_analyses || 0, tier, 'photo_analyses');

      if (remaining === 0) {
        return {
          data: null,
          error: 'Monthly photo analysis limit reached. Please upgrade your subscription.',
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

  private async uploadImage(imageFile: File | Blob, userId: string): Promise<APIResponse<string>> {
    try {
      const fileExt = imageFile instanceof File ? imageFile.name.split('.').pop() : 'jpg';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('photo-analyses')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new APIError(
          ErrorType.SERVER_ERROR,
          `Image upload failed: ${error.message}`
        );
      }

      const { data: { publicUrl } } = supabase.storage
        .from('photo-analyses')
        .getPublicUrl(data.path);

      return {
        data: publicUrl,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof APIError ? error.message : 'Image upload failed',
        success: false
      };
    }
  }

  private async generateImageHash(imageFile: File | Blob | string): Promise<string> {
    if (typeof imageFile === 'string') {
      return btoa(imageFile).slice(0, 16);
    }

    // Simple hash based on file size and type
    const size = imageFile.size;
    const type = imageFile instanceof File ? imageFile.type : 'blob';
    return btoa(`${size}-${type}-${Date.now()}`).slice(0, 16);
  }

  private getCachedResult(imageHash: string): PhotoAnalysisResult | null {
    const cached = this.cache.get(imageHash);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result;
    }
    
    if (cached) {
      this.cache.delete(imageHash);
    }
    
    return null;
  }

  private cacheResult(imageHash: string, result: PhotoAnalysisResult): void {
    this.cache.set(imageHash, {
      result,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  private async saveAnalysisResult(result: PhotoAnalysisResult): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.PHOTO_ANALYSES)
        .insert(result);

      if (error) {
        console.error('Failed to save analysis result:', error);
      }
    } catch (error) {
      console.error('Save analysis result error:', error);
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
   * Clear cache (useful for testing or memory management)
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
export const photoAnalysisService = PhotoAnalysisService.getInstance();
export default photoAnalysisService;

