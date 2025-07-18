import { AnalysisService } from '../../services/AnalysisService';

// Mock Supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn()
    }
  }
}));

// Mock AnalyticsService (use ABTestingService which exists)
jest.mock('../../services/ABTestingService', () => ({
  ABTestingService: {
    track: jest.fn()
  }
}));

describe('AnalysisService', () => {
  let analysisService: AnalysisService;

  beforeEach(() => {
    analysisService = AnalysisService.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = AnalysisService.getInstance();
      const instance2 = AnalysisService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('analyzePhoto', () => {
    it('should handle photo analysis request', async () => {
      const mockRequest = {
        imageUri: 'test-image-uri',
        tier: 'premium',
        analysisDepth: 'comprehensive' as const,
        analysisType: 'photo' as const
      };

      // Mock successful response
      const { supabase } = require('../../services/supabase');
      supabase.functions.invoke.mockResolvedValueOnce({
        data: {
          confidence: 0.85,
          insights: ['Good lighting', 'Clear image'],
          score: 82,
          suggestions: ['Try smiling more']
        },
        error: null
      });

      const result = await analysisService.analyzePhoto(mockRequest);

      expect(result).toBeDefined();
      expect(supabase.functions.invoke).toHaveBeenCalledWith('unified-analysis-v2', {
        body: expect.objectContaining({
          type: 'photo',
          data: expect.objectContaining({
            imageUri: 'test-image-uri',
            tier: 'premium'
          })
        })
      });
    });

    it('should handle analysis errors gracefully', async () => {
      const mockRequest = {
        imageUri: 'test-image-uri',
        tier: 'premium',
        analysisDepth: 'comprehensive' as const,
        analysisType: 'photo' as const
      };

      // Mock error response
      const { supabase } = require('../../services/supabase');
      supabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Analysis failed' }
      });

      await expect(analysisService.analyzePhoto(mockRequest)).rejects.toThrow();
    });
  });

  describe('caching', () => {
    it('should cache analysis results', async () => {
      const mockRequest = {
        imageUri: 'test-image-uri',
        tier: 'premium',
        analysisDepth: 'comprehensive' as const,
        analysisType: 'photo' as const
      };

      const { supabase } = require('../../services/supabase');
      supabase.functions.invoke.mockResolvedValue({
        data: {
          confidence: 0.85,
          insights: ['Good lighting'],
          score: 82,
          suggestions: ['Try smiling more']
        },
        error: null
      });

      // First call
      await analysisService.analyzePhoto(mockRequest);
      
      // Second call should use cache
      await analysisService.analyzePhoto(mockRequest);

      // Should only call the API once due to caching
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    });
  });
});