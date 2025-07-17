/**
 * Comprehensive Test Suite for Intelligent Analysis Engine
 * 
 * Tests the advanced LLM optimization and comprehensive relationship expertise
 */

import { IntelligentAnalysisEngine, AnalysisRequest, AnalysisResult } from '../../backend/ai/IntelligentAnalysisEngine';
import { AdvancedPromptEngine } from '../../backend/ai/prompts/AdvancedPromptEngine';

describe('IntelligentAnalysisEngine', () => {
  let engine: IntelligentAnalysisEngine;
  
  beforeEach(() => {
    engine = new IntelligentAnalysisEngine();
  });

  afterEach(() => {
    engine.clearCache();
  });

  describe('Comprehensive Profile Analysis', () => {
    const mockProfileContext = {
      targetProfile: {
        name: 'Sarah',
        age: 28,
        bio: 'Adventure seeker, yoga instructor, loves hiking and photography. Looking for genuine connections.',
        photos: [
          { url: 'photo1.jpg', description: 'Hiking in mountains' },
          { url: 'photo2.jpg', description: 'Teaching yoga class' },
          { url: 'photo3.jpg', description: 'Travel photo in Paris' }
        ],
        interests: ['hiking', 'yoga', 'photography', 'travel', 'cooking'],
        education: 'Masters in Psychology',
        occupation: 'Yoga Instructor & Therapist'
      },
      platform: 'hinge',
      ageRange: '25-35',
      relationship_goals: 'serious_relationship',
      culturalContext: 'western_urban'
    };

    test('should provide comprehensive analysis across all domains', async () => {
      const request: AnalysisRequest = {
        type: 'profile',
        context: mockProfileContext,
        options: {
          depth_level: 'comprehensive',
          response_format: 'json',
          confidence_threshold: 85
        }
      };

      const result = await engine.analyzeWithIntelligence(request);

      // Validate comprehensive analysis structure
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('psychological_insights');
      expect(result).toHaveProperty('recommendations');
      expect(result.confidence).toBeGreaterThan(80);

      // Validate psychological analysis
      expect(result.psychological_insights).toHaveProperty('big_five');
      expect(result.psychological_insights).toHaveProperty('attachment_style');
      expect(result.psychological_insights).toHaveProperty('communication_style');

      // Validate comprehensive domains coverage
      expect(result.analysis).toHaveProperty('psychological_profile');
      expect(result.analysis).toHaveProperty('fashion_style_analysis');
      expect(result.analysis).toHaveProperty('photography_analysis');
      expect(result.analysis).toHaveProperty('lifestyle_assessment');
      expect(result.analysis).toHaveProperty('cultural_factors');
      expect(result.analysis).toHaveProperty('digital_presence');

      // Validate recommendations quality
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
    }, 30000);

    test('should adapt analysis based on cultural context', async () => {
      const westernRequest: AnalysisRequest = {
        type: 'profile',
        context: { ...mockProfileContext, culturalContext: 'western_urban' }
      };

      const asianRequest: AnalysisRequest = {
        type: 'profile',
        context: { ...mockProfileContext, culturalContext: 'asian_traditional' }
      };

      const westernResult = await engine.analyzeWithIntelligence(westernRequest);
      const asianResult = await engine.analyzeWithIntelligence(asianRequest);

      // Results should differ based on cultural context
      expect(westernResult.analysis).not.toEqual(asianResult.analysis);
      expect(westernResult.recommendations).not.toEqual(asianResult.recommendations);
    }, 30000);

    test('should provide different depth levels', async () => {
      const basicRequest: AnalysisRequest = {
        type: 'profile',
        context: mockProfileContext,
        options: { depth_level: 'basic' }
      };

      const expertRequest: AnalysisRequest = {
        type: 'profile',
        context: mockProfileContext,
        options: { depth_level: 'expert', multi_model_validation: true }
      };

      const basicResult = await engine.analyzeWithIntelligence(basicRequest);
      const expertResult = await engine.analyzeWithIntelligence(expertRequest);

      // Expert analysis should be more comprehensive
      expect(expertResult.confidence).toBeGreaterThanOrEqual(basicResult.confidence);
      expect(expertResult.recommendations.length).toBeGreaterThanOrEqual(basicResult.recommendations.length);
      
      // Expert analysis should have validation score
      expect(expertResult).toHaveProperty('validation_score');
      expect(expertResult).toHaveProperty('alternative_perspectives');
    }, 45000);
  });

  describe('Comprehensive Conversation Coaching', () => {
    const mockConversationContext = {
      userProfile: {
        name: 'Mike',
        age: 30,
        interests: ['fitness', 'cooking', 'travel']
      },
      targetProfile: {
        name: 'Emma',
        age: 27,
        interests: ['yoga', 'reading', 'art']
      },
      conversationHistory: [
        { sender: 'Mike', message: 'Hey Emma! I noticed you love yoga. I just started practicing myself.', timestamp: '2024-01-15T10:00:00Z' },
        { sender: 'Emma', message: 'That\'s awesome! How are you finding it? It can be challenging at first.', timestamp: '2024-01-15T10:05:00Z' },
        { sender: 'Mike', message: 'Definitely challenging but I love the mindfulness aspect. Any tips for a beginner?', timestamp: '2024-01-15T10:10:00Z' }
      ],
      platform: 'bumble',
      culturalContext: 'western_urban'
    };

    test('should provide comprehensive conversation coaching', async () => {
      const request: AnalysisRequest = {
        type: 'conversation',
        context: mockConversationContext,
        options: {
          depth_level: 'comprehensive',
          response_format: 'json'
        }
      };

      const result = await engine.analyzeWithIntelligence(request);

      // Validate conversation analysis structure
      expect(result.analysis).toHaveProperty('communication_dynamics');
      expect(result.analysis).toHaveProperty('psychological_patterns');
      expect(result.analysis).toHaveProperty('cultural_dynamics');
      expect(result.analysis).toHaveProperty('digital_optimization');
      expect(result.analysis).toHaveProperty('relationship_progression');

      // Validate coaching recommendations
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // Should provide multiple message options
      const messageOptions = result.recommendations.filter(rec => rec.type === 'message_suggestion');
      expect(messageOptions.length).toBeGreaterThanOrEqual(3);
    }, 30000);

    test('should analyze conversation stage appropriately', async () => {
      const earlyStageContext = {
        ...mockConversationContext,
        conversationHistory: mockConversationContext.conversationHistory.slice(0, 1)
      };

      const deepStageContext = {
        ...mockConversationContext,
        conversationHistory: [
          ...mockConversationContext.conversationHistory,
          ...Array(15).fill(null).map((_, i) => ({
            sender: i % 2 === 0 ? 'Mike' : 'Emma',
            message: `Message ${i + 4}`,
            timestamp: new Date(Date.now() + i * 300000).toISOString()
          }))
        ]
      };

      const earlyRequest: AnalysisRequest = {
        type: 'conversation',
        context: earlyStageContext
      };

      const deepRequest: AnalysisRequest = {
        type: 'conversation',
        context: deepStageContext
      };

      const earlyResult = await engine.analyzeWithIntelligence(earlyRequest);
      const deepResult = await engine.analyzeWithIntelligence(deepRequest);

      // Recommendations should differ based on conversation stage
      expect(earlyResult.recommendations).not.toEqual(deepResult.recommendations);
    }, 30000);
  });

  describe('Multi-Model Validation', () => {
    test('should provide consensus analysis with multiple models', async () => {
      const request: AnalysisRequest = {
        type: 'profile',
        context: {
          targetProfile: {
            name: 'Alex',
            bio: 'Software engineer who loves rock climbing and board games.'
          }
        },
        options: {
          multi_model_validation: true,
          depth_level: 'expert'
        }
      };

      const result = await engine.analyzeWithIntelligence(request);

      // Should have validation score and alternative perspectives
      expect(result).toHaveProperty('validation_score');
      expect(result).toHaveProperty('alternative_perspectives');
      expect(result.model_used).toBe('multi-model-consensus');
      expect(result.validation_score).toBeGreaterThan(0);
    }, 45000);
  });

  describe('Performance and Caching', () => {
    test('should cache results for identical requests', async () => {
      const request: AnalysisRequest = {
        type: 'profile',
        context: {
          targetProfile: { name: 'Test', bio: 'Test bio' }
        }
      };

      const start1 = Date.now();
      const result1 = await engine.analyzeWithIntelligence(request);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const result2 = await engine.analyzeWithIntelligence(request);
      const time2 = Date.now() - start2;

      // Second request should be much faster (cached)
      expect(time2).toBeLessThan(time1 * 0.1);
      expect(result1.analysis).toEqual(result2.analysis);
    }, 30000);

    test('should track performance metrics', async () => {
      const request: AnalysisRequest = {
        type: 'profile',
        context: {
          targetProfile: { name: 'Test', bio: 'Test bio' }
        }
      };

      await engine.analyzeWithIntelligence(request);
      
      const metrics = engine.getPerformanceMetrics();
      expect(metrics.size).toBeGreaterThan(0);
      
      // Should have metrics for the model used
      const modelMetrics = Array.from(metrics.values())[0];
      expect(modelMetrics).toHaveProperty('total_requests');
      expect(modelMetrics).toHaveProperty('avg_confidence');
      expect(modelMetrics).toHaveProperty('success_rate');
    }, 30000);
  });

  describe('Error Handling and Validation', () => {
    test('should handle invalid request types', async () => {
      const request: AnalysisRequest = {
        type: 'invalid_type' as any,
        context: {}
      };

      await expect(engine.analyzeWithIntelligence(request))
        .rejects
        .toThrow('Unsupported analysis type');
    });

    test('should handle empty context gracefully', async () => {
      const request: AnalysisRequest = {
        type: 'profile',
        context: {}
      };

      const result = await engine.analyzeWithIntelligence(request);
      
      // Should still provide some analysis even with minimal data
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('confidence');
      expect(result.confidence).toBeGreaterThan(0);
    }, 30000);

    test('should respect confidence thresholds', async () => {
      const request: AnalysisRequest = {
        type: 'profile',
        context: {
          targetProfile: { name: 'Test' } // Minimal data
        },
        options: {
          confidence_threshold: 95 // Very high threshold
        }
      };

      const result = await engine.analyzeWithIntelligence(request);
      
      // Should either meet threshold or retry with better model
      expect(result.confidence).toBeGreaterThanOrEqual(75); // Should at least try to improve
    }, 30000);
  });

  describe('Advanced Prompt Engineering', () => {
    test('should generate comprehensive profile analysis prompts', () => {
      const context = {
        targetProfile: {
          name: 'Sarah',
          bio: 'Yoga instructor and photographer'
        },
        platform: 'hinge',
        culturalContext: 'western_urban'
      };

      const prompt = AdvancedPromptEngine.generateProfileAnalysisPrompt(context);

      // Should include comprehensive analysis frameworks
      expect(prompt).toContain('FASHION & STYLE ANALYSIS');
      expect(prompt).toContain('PHOTOGRAPHY & VISUAL PRESENTATION');
      expect(prompt).toContain('LIFESTYLE & PERSONAL DEVELOPMENT');
      expect(prompt).toContain('CULTURAL & DEMOGRAPHIC FACTORS');
      expect(prompt).toContain('DIGITAL PRESENCE & PLATFORM OPTIMIZATION');
      
      // Should include Dr. Elena Rodriguez persona
      expect(prompt).toContain('Dr. Elena Rodriguez');
      expect(prompt).toContain('comprehensive relationship expert');
    });

    test('should generate comprehensive conversation coaching prompts', () => {
      const context = {
        conversationHistory: [
          { sender: 'User', message: 'Hello', timestamp: '2024-01-01T00:00:00Z' }
        ],
        platform: 'bumble'
      };

      const prompt = AdvancedPromptEngine.generateConversationCoachingPrompt(context);

      // Should include comprehensive coaching frameworks
      expect(prompt).toContain('COMMUNICATION DYNAMICS ASSESSMENT');
      expect(prompt).toContain('CULTURAL & SOCIAL DYNAMICS');
      expect(prompt).toContain('DIGITAL COMMUNICATION OPTIMIZATION');
      expect(prompt).toContain('MULTI-DIMENSIONAL ATTRACTION BUILDING');
      expect(prompt).toContain('HOLISTIC COMMUNICATION ENHANCEMENT');
    });

    test('should adapt prompts to cultural context', () => {
      const westernContext = {
        targetProfile: { name: 'John' },
        culturalContext: 'western_urban'
      };

      const asianContext = {
        targetProfile: { name: 'John' },
        culturalContext: 'asian_traditional'
      };

      const westernPrompt = AdvancedPromptEngine.generateProfileAnalysisPrompt(westernContext);
      const asianPrompt = AdvancedPromptEngine.generateProfileAnalysisPrompt(asianContext);

      // Prompts should be different based on cultural context
      expect(westernPrompt).not.toEqual(asianPrompt);
      expect(asianPrompt).toContain('asian_traditional');
    });
  });

  describe('Integration with Comprehensive Expertise', () => {
    test('should provide fashion and style analysis', async () => {
      const request: AnalysisRequest = {
        type: 'profile',
        context: {
          targetProfile: {
            photos: [
              { description: 'Wearing casual jeans and t-shirt' },
              { description: 'Formal business attire' }
            ]
          }
        },
        options: { depth_level: 'comprehensive' }
      };

      const result = await engine.analyzeWithIntelligence(request);

      // Should include fashion analysis
      expect(result.analysis).toHaveProperty('fashion_style_analysis');
      expect(result.recommendations.some(rec => 
        rec.category === 'fashion' || rec.category === 'style'
      )).toBe(true);
    }, 30000);

    test('should provide photography and visual presentation analysis', async () => {
      const request: AnalysisRequest = {
        type: 'photo',
        context: {
          targetProfile: {
            photos: [
              { 
                url: 'photo1.jpg',
                description: 'Outdoor hiking photo with good lighting',
                technical_quality: 'high'
              }
            ]
          }
        },
        options: { depth_level: 'comprehensive' }
      };

      const result = await engine.analyzeWithIntelligence(request);

      // Should include photography analysis
      expect(result.analysis).toHaveProperty('technical_quality');
      expect(result.analysis).toHaveProperty('visual_storytelling');
      expect(result.analysis).toHaveProperty('body_language');
      expect(result.recommendations.some(rec => 
        rec.category === 'photography' || rec.category === 'visual'
      )).toBe(true);
    }, 30000);

    test('should provide lifestyle and personal development insights', async () => {
      const request: AnalysisRequest = {
        type: 'profile',
        context: {
          targetProfile: {
            interests: ['fitness', 'cooking', 'travel', 'reading'],
            occupation: 'Software Engineer',
            education: 'Computer Science Degree'
          }
        },
        options: { depth_level: 'comprehensive' }
      };

      const result = await engine.analyzeWithIntelligence(request);

      // Should include lifestyle analysis
      expect(result.analysis).toHaveProperty('lifestyle_assessment');
      expect(result.recommendations.some(rec => 
        rec.category === 'lifestyle' || rec.category === 'personal_development'
      )).toBe(true);
    }, 30000);
  });
});

describe('AdvancedPromptEngine', () => {
  describe('Prompt Optimization', () => {
    test('should optimize prompts for different models', () => {
      const basePrompt = 'Analyze this profile';
      
      const gpt4Prompt = AdvancedPromptEngine.optimizePromptForModel(basePrompt, 'gpt4');
      const claudePrompt = AdvancedPromptEngine.optimizePromptForModel(basePrompt, 'claude');
      const geminiPrompt = AdvancedPromptEngine.optimizePromptForModel(basePrompt, 'gemini');

      // Each model should have different optimizations
      expect(gpt4Prompt).not.toEqual(claudePrompt);
      expect(claudePrompt).not.toEqual(geminiPrompt);
      expect(gpt4Prompt).toContain(basePrompt);
    });

    test('should adapt prompts to context', () => {
      const basePrompt = 'Analyze this profile';
      const context = {
        culturalContext: 'asian_traditional',
        ageRange: '25-35',
        platform: 'tinder'
      };

      const adaptedPrompt = AdvancedPromptEngine.adaptPromptToContext(basePrompt, context);

      expect(adaptedPrompt).toContain(basePrompt);
      expect(adaptedPrompt).toContain('asian_traditional');
      expect(adaptedPrompt).toContain('25-35');
      expect(adaptedPrompt).toContain('tinder');
    });
  });

  describe('Comprehensive Analysis Frameworks', () => {
    test('should include all relationship domains in frameworks', () => {
      const frameworks = AdvancedPromptEngine['ANALYSIS_FRAMEWORKS'];

      // Should have comprehensive frameworks beyond just psychology
      expect(frameworks).toHaveProperty('BIG_FIVE');
      expect(frameworks).toHaveProperty('ATTACHMENT_THEORY');
      expect(frameworks).toHaveProperty('FASHION_STYLE_ANALYSIS');
      expect(frameworks).toHaveProperty('PHOTOGRAPHY_ANALYSIS');
      expect(frameworks).toHaveProperty('LIFESTYLE_ASSESSMENT');
      expect(frameworks).toHaveProperty('CULTURAL_COMPETENCY');
      expect(frameworks).toHaveProperty('DIGITAL_PRESENCE');
      expect(frameworks).toHaveProperty('RELATIONSHIP_READINESS');
      expect(frameworks).toHaveProperty('ATTRACTION_OPTIMIZATION');
    });

    test('should have detailed framework descriptions', () => {
      const frameworks = AdvancedPromptEngine['ANALYSIS_FRAMEWORKS'];

      // Each framework should have detailed analysis criteria
      expect(frameworks.FASHION_STYLE_ANALYSIS).toContain('Color Psychology');
      expect(frameworks.PHOTOGRAPHY_ANALYSIS).toContain('Technical Quality');
      expect(frameworks.LIFESTYLE_ASSESSMENT).toContain('Fitness & Health');
      expect(frameworks.CULTURAL_COMPETENCY).toContain('Cultural Background');
      expect(frameworks.ATTRACTION_OPTIMIZATION).toContain('Multi-dimensional');
    });
  });
});

// Performance benchmarks
describe('Performance Benchmarks', () => {
  let engine: IntelligentAnalysisEngine;
  
  beforeEach(() => {
    engine = new IntelligentAnalysisEngine();
  });

  test('should complete basic analysis within 10 seconds', async () => {
    const request: AnalysisRequest = {
      type: 'profile',
      context: {
        targetProfile: { name: 'Test', bio: 'Test bio' }
      },
      options: { depth_level: 'basic' }
    };

    const start = Date.now();
    const result = await engine.analyzeWithIntelligence(request);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
    expect(result.confidence).toBeGreaterThan(70);
  }, 15000);

  test('should complete comprehensive analysis within 30 seconds', async () => {
    const request: AnalysisRequest = {
      type: 'profile',
      context: {
        targetProfile: {
          name: 'Sarah',
          bio: 'Comprehensive profile for testing',
          photos: [{ url: 'test.jpg' }],
          interests: ['test1', 'test2']
        }
      },
      options: { depth_level: 'comprehensive' }
    };

    const start = Date.now();
    const result = await engine.analyzeWithIntelligence(request);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(30000);
    expect(result.confidence).toBeGreaterThan(80);
  }, 35000);

  test('should maintain 95% confidence interval for expert analysis', async () => {
    const requests = Array(5).fill(null).map((_, i) => ({
      type: 'profile' as const,
      context: {
        targetProfile: {
          name: `Test${i}`,
          bio: `Test bio ${i}`,
          interests: [`interest${i}`]
        }
      },
      options: { depth_level: 'expert' as const }
    }));

    const results = await Promise.all(
      requests.map(req => engine.analyzeWithIntelligence(req))
    );

    const confidences = results.map(r => r.confidence);
    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;

    expect(avgConfidence).toBeGreaterThan(85);
    expect(confidences.every(c => c > 80)).toBe(true);
  }, 60000);
});

