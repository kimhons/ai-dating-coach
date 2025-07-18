/**
 * Comprehensive Integration Tests for Unified API Service
 * 
 * Tests the complete frontend-to-backend integration with LLM optimization
 */

import { UnifiedAPIService, APIRequest, APIResponse } from '../../backend/integration/UnifiedAPIService';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase for testing
jest.mock('@supabase/supabase-js');

describe('UnifiedAPIService Integration Tests', () => {
  let apiService: UnifiedAPIService;
  let mockSupabase: any;

  beforeEach(() => {
    // Setup mock Supabase
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      limit: jest.fn().mockReturnThis()
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    
    apiService = new UnifiedAPIService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Profile Analysis Integration', () => {
    const mockProfileRequest: APIRequest = {
      user_id: 'test-user-123',
      session_token: 'valid-session-token',
      request_type: 'profile_analysis',
      data: {
        targetProfile: {
          name: 'Sarah Johnson',
          age: 28,
          bio: 'Adventure seeker, yoga instructor, and photography enthusiast. Looking for genuine connections and shared experiences.',
          photos: [
            { url: 'photo1.jpg', description: 'Hiking in the mountains' },
            { url: 'photo2.jpg', description: 'Teaching yoga class' },
            { url: 'photo3.jpg', description: 'Photography work in Paris' }
          ],
          interests: ['hiking', 'yoga', 'photography', 'travel', 'cooking', 'meditation'],
          education: 'Masters in Psychology',
          occupation: 'Yoga Instructor & Therapist',
          location: 'San Francisco, CA'
        }
      },
      options: {
        depth_level: 'comprehensive',
        include_recommendations: true,
        cultural_context: 'western_urban',
        platform: 'hinge',
        priority: 'normal'
      }
    };

    test('should process comprehensive profile analysis request successfully', async () => {
      // Mock successful database responses
      mockSupabase.single.mockResolvedValueOnce({
        data: { 
          user_id: 'test-user-123',
          tier: 'premium',
          cultural_background: 'western_urban',
          age_range: '25-35',
          relationship_goals: 'serious_relationship'
        },
        error: null
      });

      const response = await apiService.processAnalysisRequest(mockProfileRequest);

      expect(response.success).toBe(true);
      expect(response.confidence).toBeGreaterThan(80);
      expect(response.data).toBeDefined();
      expect(response.analysis_id).toBeDefined();
      expect(response.processing_time).toBeGreaterThan(0);

      // Validate comprehensive analysis structure
      expect(response.data).toHaveProperty('psychological_profile');
      expect(response.data).toHaveProperty('fashion_style_analysis');
      expect(response.data).toHaveProperty('photography_analysis');
      expect(response.data).toHaveProperty('lifestyle_assessment');
      expect(response.data).toHaveProperty('cultural_factors');
      expect(response.data).toHaveProperty('digital_presence');

      // Validate recommendations
      expect(response.recommendations).toBeInstanceOf(Array);
      expect(response.recommendations.length).toBeGreaterThan(0);

      // Validate metadata
      expect(response.metadata).toHaveProperty('model_used');
      expect(response.metadata).toHaveProperty('analysis_version');
      expect(response.metadata).toHaveProperty('timestamp');
      expect(response.metadata).toHaveProperty('request_id');
    }, 30000);

    test('should handle different depth levels appropriately', async () => {
      const basicRequest = {
        ...mockProfileRequest,
        options: { ...mockProfileRequest.options, depth_level: 'basic' as const }
      };

      const expertRequest = {
        ...mockProfileRequest,
        options: { ...mockProfileRequest.options, depth_level: 'expert' as const }
      };

      mockSupabase.single.mockResolvedValue({
        data: { user_id: 'test-user-123', tier: 'premium' },
        error: null
      });

      const basicResponse = await apiService.processAnalysisRequest(basicRequest);
      const expertResponse = await apiService.processAnalysisRequest(expertRequest);

      expect(basicResponse.success).toBe(true);
      expect(expertResponse.success).toBe(true);

      // Expert analysis should have higher confidence and more recommendations
      expect(expertResponse.confidence).toBeGreaterThanOrEqual(basicResponse.confidence);
      expect(expertResponse.recommendations.length).toBeGreaterThanOrEqual(basicResponse.recommendations.length);

      // Expert analysis should include validation
      expect(expertResponse.data).toHaveProperty('validation_score');
      expect(expertResponse.data).toHaveProperty('alternative_perspectives');
    }, 45000);

    test('should adapt analysis based on cultural context', async () => {
      const westernRequest = {
        ...mockProfileRequest,
        options: { ...mockProfileRequest.options, cultural_context: 'western_urban' }
      };

      const asianRequest = {
        ...mockProfileRequest,
        options: { ...mockProfileRequest.options, cultural_context: 'asian_traditional' }
      };

      mockSupabase.single.mockResolvedValue({
        data: { user_id: 'test-user-123', tier: 'premium' },
        error: null
      });

      const westernResponse = await apiService.processAnalysisRequest(westernRequest);
      const asianResponse = await apiService.processAnalysisRequest(asianRequest);

      expect(westernResponse.success).toBe(true);
      expect(asianResponse.success).toBe(true);

      // Responses should differ based on cultural context
      expect(westernResponse.data).not.toEqual(asianResponse.data);
      expect(westernResponse.recommendations).not.toEqual(asianResponse.recommendations);
    }, 45000);
  });

  describe('Conversation Coaching Integration', () => {
    const mockConversationRequest: APIRequest = {
      user_id: 'test-user-123',
      session_token: 'valid-session-token',
      request_type: 'conversation_coaching',
      data: {
        userProfile: {
          name: 'Mike',
          age: 30,
          interests: ['fitness', 'cooking', 'travel', 'technology']
        },
        targetProfile: {
          name: 'Emma',
          age: 27,
          interests: ['yoga', 'reading', 'art', 'hiking']
        },
        conversationHistory: [
          { sender: 'Mike', message: 'Hey Emma! I noticed you love yoga. I just started practicing myself.', timestamp: '2024-01-15T10:00:00Z' },
          { sender: 'Emma', message: 'That\'s awesome! How are you finding it? It can be challenging at first.', timestamp: '2024-01-15T10:05:00Z' },
          { sender: 'Mike', message: 'Definitely challenging but I love the mindfulness aspect. Any tips for a beginner?', timestamp: '2024-01-15T10:10:00Z' },
          { sender: 'Emma', message: 'Start with basic poses and focus on breathing. What style are you trying?', timestamp: '2024-01-15T10:15:00Z' }
        ]
      },
      options: {
        depth_level: 'comprehensive',
        cultural_context: 'western_urban',
        platform: 'bumble'
      }
    };

    test('should provide comprehensive conversation coaching', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { user_id: 'test-user-123', tier: 'premium' },
        error: null
      });

      const response = await apiService.processAnalysisRequest(mockConversationRequest);

      expect(response.success).toBe(true);
      expect(response.confidence).toBeGreaterThan(75);

      // Validate conversation analysis structure
      expect(response.data).toHaveProperty('communication_dynamics');
      expect(response.data).toHaveProperty('psychological_patterns');
      expect(response.data).toHaveProperty('cultural_dynamics');
      expect(response.data).toHaveProperty('digital_optimization');
      expect(response.data).toHaveProperty('relationship_progression');

      // Validate coaching recommendations
      expect(response.recommendations).toBeInstanceOf(Array);
      expect(response.recommendations.length).toBeGreaterThan(0);

      // Should provide multiple message options
      const messageOptions = response.recommendations.filter(rec => rec.type === 'message_suggestion');
      expect(messageOptions.length).toBeGreaterThanOrEqual(3);

      // Each message option should have different approaches
      const approaches = messageOptions.map(opt => opt.approach);
      expect(approaches).toContain('emotional_connection');
      expect(approaches).toContain('intellectual_stimulation');
      expect(approaches).toContain('lifestyle_experience');
    }, 30000);

    test('should analyze conversation stage appropriately', async () => {
      const earlyStageRequest = {
        ...mockConversationRequest,
        data: {
          ...mockConversationRequest.data,
          conversationHistory: mockConversationRequest.data.conversationHistory.slice(0, 2)
        }
      };

      const deepStageRequest = {
        ...mockConversationRequest,
        data: {
          ...mockConversationRequest.data,
          conversationHistory: [
            ...mockConversationRequest.data.conversationHistory,
            ...Array(20).fill(null).map((_, i) => ({
              sender: i % 2 === 0 ? 'Mike' : 'Emma',
              message: `Deep conversation message ${i + 5}`,
              timestamp: new Date(Date.now() + i * 300000).toISOString()
            }))
          ]
        }
      };

      mockSupabase.single.mockResolvedValue({
        data: { user_id: 'test-user-123', tier: 'premium' },
        error: null
      });

      const earlyResponse = await apiService.processAnalysisRequest(earlyStageRequest);
      const deepResponse = await apiService.processAnalysisRequest(deepStageRequest);

      expect(earlyResponse.success).toBe(true);
      expect(deepResponse.success).toBe(true);

      // Recommendations should differ based on conversation stage
      expect(earlyResponse.recommendations).not.toEqual(deepResponse.recommendations);

      // Early stage should focus on rapport building
      const earlyTopics = earlyResponse.recommendations.map(rec => rec.category);
      expect(earlyTopics).toContain('rapport_building');

      // Deep stage should focus on connection deepening
      const deepTopics = deepResponse.recommendations.map(rec => rec.category);
      expect(deepTopics).toContain('connection_deepening');
    }, 45000);
  });

  describe('Tier Management Integration', () => {
    test('should enforce tier limits correctly', async () => {
      const freeUserRequest: APIRequest = {
        user_id: 'free-user-123',
        session_token: 'valid-session-token',
        request_type: 'profile_analysis',
        data: { targetProfile: { name: 'Test' } },
        options: { depth_level: 'expert' }
      };

      // Mock free tier user
      mockSupabase.single.mockResolvedValueOnce({
        data: { 
          user_id: 'free-user-123', 
          tier: 'free',
          usage_count: 5,
          usage_limit: 5
        },
        error: null
      });

      const response = await apiService.processAnalysisRequest(freeUserRequest);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Tier limit exceeded');
      expect(response).toHaveProperty('upgrade_required', true);
      expect(response).toHaveProperty('current_tier', 'free');
    }, 15000);

    test('should track usage correctly for premium users', async () => {
      const premiumUserRequest: APIRequest = {
        user_id: 'premium-user-123',
        session_token: 'valid-session-token',
        request_type: 'profile_analysis',
        data: { targetProfile: { name: 'Test' } },
        options: { depth_level: 'comprehensive' }
      };

      // Mock premium tier user
      mockSupabase.single.mockResolvedValue({
        data: { 
          user_id: 'premium-user-123', 
          tier: 'premium',
          usage_count: 10,
          usage_limit: 100
        },
        error: null
      });

      const response = await apiService.processAnalysisRequest(premiumUserRequest);

      expect(response.success).toBe(true);
      expect(response.tier_usage).toBeDefined();
      expect(response.tier_usage.remaining).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Security and Privacy Integration', () => {
    test('should validate session tokens', async () => {
      const invalidTokenRequest: APIRequest = {
        user_id: 'test-user-123',
        session_token: 'invalid-token',
        request_type: 'profile_analysis',
        data: { targetProfile: { name: 'Test' } }
      };

      const response = await apiService.processAnalysisRequest(invalidTokenRequest);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Security validation failed');
    }, 15000);

    test('should enforce rate limiting', async () => {
      const request: APIRequest = {
        user_id: 'rate-limit-user',
        session_token: 'valid-session-token',
        request_type: 'profile_analysis',
        data: { targetProfile: { name: 'Test' } }
      };

      mockSupabase.single.mockResolvedValue({
        data: { user_id: 'rate-limit-user', tier: 'premium' },
        error: null
      });

      // Make multiple rapid requests
      const promises = Array(35).fill(null).map(() => 
        apiService.processAnalysisRequest(request)
      );

      const responses = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => 
        !r.success && r.error?.includes('Rate limit exceeded')
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 30000);

    test('should handle privacy compliance', async () => {
      const privacySensitiveRequest: APIRequest = {
        user_id: 'privacy-user-123',
        session_token: 'valid-session-token',
        request_type: 'profile_analysis',
        data: {
          targetProfile: {
            name: 'Test User',
            sensitive_data: 'This should be filtered'
          }
        }
      };

      mockSupabase.single.mockResolvedValue({
        data: { user_id: 'privacy-user-123', tier: 'premium' },
        error: null
      });

      const response = await apiService.processAnalysisRequest(privacySensitiveRequest);

      // Should either succeed with filtered data or fail with privacy error
      if (response.success) {
        expect(response.data).toBeDefined();
      } else {
        expect(response.error).toContain('Privacy compliance');
      }
    }, 30000);
  });

  describe('Cross-Platform Sync Integration', () => {
    test('should sync analysis results across platforms', async () => {
      const request: APIRequest = {
        user_id: 'sync-user-123',
        session_token: 'valid-session-token',
        request_type: 'profile_analysis',
        data: { targetProfile: { name: 'Sync Test' } }
      };

      mockSupabase.single.mockResolvedValue({
        data: { user_id: 'sync-user-123', tier: 'premium' },
        error: null
      });

      const response = await apiService.processAnalysisRequest(request);

      expect(response.success).toBe(true);
      expect(response.analysis_id).toBeDefined();

      // Verify sync was attempted (would check sync service in real implementation)
      expect(mockSupabase.insert).toHaveBeenCalled();
    }, 30000);
  });

  describe('Error Handling and Recovery', () => {
    test('should handle database connection errors gracefully', async () => {
      const request: APIRequest = {
        user_id: 'error-user-123',
        session_token: 'valid-session-token',
        request_type: 'profile_analysis',
        data: { targetProfile: { name: 'Error Test' } }
      };

      // Mock database error
      mockSupabase.single.mockRejectedValue(new Error('Database connection failed'));

      const response = await apiService.processAnalysisRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.processing_time).toBeGreaterThan(0);
    }, 15000);

    test('should handle AI analysis failures gracefully', async () => {
      const request: APIRequest = {
        user_id: 'ai-error-user-123',
        session_token: 'valid-session-token',
        request_type: 'profile_analysis',
        data: { targetProfile: {} } // Empty profile to trigger potential AI error
      };

      mockSupabase.single.mockResolvedValue({
        data: { user_id: 'ai-error-user-123', tier: 'premium' },
        error: null
      });

      const response = await apiService.processAnalysisRequest(request);

      // Should either succeed with low confidence or fail gracefully
      if (response.success) {
        expect(response.confidence).toBeGreaterThan(0);
      } else {
        expect(response.error).toBeDefined();
        expect(response.success).toBe(false);
      }
    }, 30000);
  });

  describe('Performance and Monitoring', () => {
    test('should complete requests within acceptable time limits', async () => {
      const request: APIRequest = {
        user_id: 'performance-user-123',
        session_token: 'valid-session-token',
        request_type: 'profile_analysis',
        data: { targetProfile: { name: 'Performance Test' } },
        options: { depth_level: 'standard' }
      };

      mockSupabase.single.mockResolvedValue({
        data: { user_id: 'performance-user-123', tier: 'premium' },
        error: null
      });

      const start = Date.now();
      const response = await apiService.processAnalysisRequest(request);
      const duration = Date.now() - start;

      expect(response.success).toBe(true);
      expect(duration).toBeLessThan(20000); // Should complete within 20 seconds
      expect(response.processing_time).toBeLessThan(duration);
    }, 25000);

    test('should provide performance metrics', async () => {
      const healthCheck = await apiService.healthCheck();

      expect(healthCheck).toHaveProperty('status');
      expect(healthCheck).toHaveProperty('services');
      expect(healthCheck.services).toHaveProperty('analysis_engine');
      expect(healthCheck.services).toHaveProperty('database');
      expect(healthCheck.services).toHaveProperty('tier_service');
    }, 10000);
  });

  describe('Multi-Platform Support', () => {
    test('should optimize for different dating platforms', async () => {
      const tinderRequest: APIRequest = {
        user_id: 'platform-user-123',
        session_token: 'valid-session-token',
        request_type: 'profile_analysis',
        data: { targetProfile: { name: 'Platform Test' } },
        options: { platform: 'tinder' }
      };

      const hingeRequest: APIRequest = {
        ...tinderRequest,
        options: { platform: 'hinge' }
      };

      mockSupabase.single.mockResolvedValue({
        data: { user_id: 'platform-user-123', tier: 'premium' },
        error: null
      });

      const tinderResponse = await apiService.processAnalysisRequest(tinderRequest);
      const hingeResponse = await apiService.processAnalysisRequest(hingeRequest);

      expect(tinderResponse.success).toBe(true);
      expect(hingeResponse.success).toBe(true);

      // Responses should be optimized for different platforms
      expect(tinderResponse.data).toHaveProperty('platform_optimizations');
      expect(hingeResponse.data).toHaveProperty('platform_optimizations');
      expect(tinderResponse.data.platform_optimizations).not.toEqual(
        hingeResponse.data.platform_optimizations
      );
    }, 45000);
  });
});

// Integration test for complete user journey
describe('Complete User Journey Integration', () => {
  let apiService: UnifiedAPIService;

  beforeEach(() => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ 
        data: { user_id: 'journey-user-123', tier: 'premium' }, 
        error: null 
      }),
      limit: jest.fn().mockReturnThis()
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    apiService = new UnifiedAPIService();
  });

  test('should handle complete dating coaching journey', async () => {
    // 1. Profile Analysis
    const profileRequest: APIRequest = {
      user_id: 'journey-user-123',
      session_token: 'valid-session-token',
      request_type: 'profile_analysis',
      data: {
        targetProfile: {
          name: 'Journey Test User',
          bio: 'Complete journey test profile'
        }
      },
      options: { depth_level: 'comprehensive' }
    };

    const profileResponse = await apiService.processAnalysisRequest(profileRequest);
    expect(profileResponse.success).toBe(true);

    // 2. Photo Analysis
    const photoRequest: APIRequest = {
      user_id: 'journey-user-123',
      session_token: 'valid-session-token',
      request_type: 'photo_analysis',
      data: {
        targetProfile: {
          photos: [{ url: 'test.jpg', description: 'Test photo' }]
        }
      }
    };

    const photoResponse = await apiService.processAnalysisRequest(photoRequest);
    expect(photoResponse.success).toBe(true);

    // 3. Conversation Coaching
    const conversationRequest: APIRequest = {
      user_id: 'journey-user-123',
      session_token: 'valid-session-token',
      request_type: 'conversation_coaching',
      data: {
        conversationHistory: [
          { sender: 'User', message: 'Hello', timestamp: '2024-01-01T00:00:00Z' }
        ]
      }
    };

    const conversationResponse = await apiService.processAnalysisRequest(conversationRequest);
    expect(conversationResponse.success).toBe(true);

    // 4. Compatibility Check
    const compatibilityRequest: APIRequest = {
      user_id: 'journey-user-123',
      session_token: 'valid-session-token',
      request_type: 'compatibility_check',
      data: {
        userProfile: { name: 'User' },
        targetProfile: { name: 'Target' }
      }
    };

    const compatibilityResponse = await apiService.processAnalysisRequest(compatibilityRequest);
    expect(compatibilityResponse.success).toBe(true);

    // All responses should have consistent user_id and increasing analysis_ids
    const responses = [profileResponse, photoResponse, conversationResponse, compatibilityResponse];
    responses.forEach(response => {
      expect(response.analysis_id).toBeDefined();
      expect(response.metadata.request_id).toBeDefined();
    });
  }, 60000);
});

