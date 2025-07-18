/**
 * Intelligent Analysis Engine for AI Dating Coach
 * 
 * This engine transforms general LLMs into specialized dating psychology experts
 * using advanced prompting techniques and multi-model strategies.
 */

import { AdvancedPromptEngine } from './prompts/AdvancedPromptEngine';
import { PromptInjectionDefense } from '../security/PromptInjectionDefense';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export interface AnalysisRequest {
  type: 'profile' | 'conversation' | 'compatibility' | 'opening_message' | 'photo';
  context: PromptContext;
  options?: {
    model_preference?: 'gpt4' | 'claude' | 'gemini' | 'auto';
    depth_level?: 'basic' | 'standard' | 'comprehensive' | 'expert';
    response_format?: 'json' | 'structured' | 'narrative';
    confidence_threshold?: number;
    multi_model_validation?: boolean;
  };
}

export interface AnalysisResult {
  analysis: any;
  confidence: number;
  model_used: string;
  processing_time: number;
  psychological_insights: any;
  recommendations: any[];
  validation_score?: number;
  alternative_perspectives?: any[];
}

export class IntelligentAnalysisEngine {
  private openai: OpenAI;
  private modelConfigs: Map<string, any>;
  private analysisCache: Map<string, AnalysisResult>;
  private performanceMetrics: Map<string, any>;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE
    });
    
    this.modelConfigs = new Map();
    this.analysisCache = new Map();
    this.performanceMetrics = new Map();
    
    this.initializeModelConfigurations();
  }

  /**
   * Initialize model configurations with specialized parameters
   */
  private initializeModelConfigurations(): void {
    this.modelConfigs.set('gpt-4', {
      temperature: 0.3,
      max_tokens: 4000,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
      strengths: ['analytical_depth', 'psychological_insight', 'structured_reasoning'],
      optimal_for: ['profile_analysis', 'compatibility_assessment', 'psychological_profiling']
    });

    this.modelConfigs.set('gpt-4-turbo', {
      temperature: 0.4,
      max_tokens: 4000,
      top_p: 0.85,
      frequency_penalty: 0.2,
      presence_penalty: 0.15,
      strengths: ['conversation_analysis', 'real_time_coaching', 'contextual_understanding'],
      optimal_for: ['conversation_coaching', 'opening_messages', 'real_time_suggestions']
    });

    this.modelConfigs.set('gpt-3.5-turbo', {
      temperature: 0.5,
      max_tokens: 2000,
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.2,
      strengths: ['quick_analysis', 'basic_insights', 'cost_efficiency'],
      optimal_for: ['basic_analysis', 'quick_suggestions', 'preliminary_screening']
    });
  }

  /**
   * Main analysis method with intelligent model selection
   */
  async analyzeWithIntelligence(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(request);
      
      // Check cache first
      if (this.analysisCache.has(cacheKey)) {
        const cached = this.analysisCache.get(cacheKey)!;
        cached.processing_time = Date.now() - startTime;
        return cached;
      }

      // Select optimal model
      const selectedModel = this.selectOptimalModel(request);
      
      // Generate advanced prompt
      const prompt = this.generateAdvancedPrompt(request);
      
      // Execute analysis
      let result: AnalysisResult;
      
      if (request.options?.multi_model_validation) {
        result = await this.executeMultiModelAnalysis(request, prompt);
      } else {
        result = await this.executeSingleModelAnalysis(request, prompt, selectedModel);
      }

      // Post-process and validate
      result = await this.postProcessAnalysis(result, request);
      
      // Cache result
      this.analysisCache.set(cacheKey, result);
      
      // Update performance metrics
      this.updatePerformanceMetrics(selectedModel, result);
      
      result.processing_time = Date.now() - startTime;
      return result;

    } catch (error) {
      console.error('Analysis engine error:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Select optimal model based on request characteristics
   */
  private selectOptimalModel(request: AnalysisRequest): string {
    if (request.options?.model_preference && request.options.model_preference !== 'auto') {
      return this.mapModelPreference(request.options.model_preference);
    }

    // Intelligent model selection based on analysis type and complexity
    const modelSelection = {
      'profile': {
        'expert': 'gpt-4',
        'comprehensive': 'gpt-4',
        'standard': 'gpt-4-turbo',
        'basic': 'gpt-3.5-turbo'
      },
      'conversation': {
        'expert': 'gpt-4-turbo',
        'comprehensive': 'gpt-4-turbo',
        'standard': 'gpt-4-turbo',
        'basic': 'gpt-3.5-turbo'
      },
      'compatibility': {
        'expert': 'gpt-4',
        'comprehensive': 'gpt-4',
        'standard': 'gpt-4',
        'basic': 'gpt-4-turbo'
      },
      'opening_message': {
        'expert': 'gpt-4-turbo',
        'comprehensive': 'gpt-4-turbo',
        'standard': 'gpt-4-turbo',
        'basic': 'gpt-3.5-turbo'
      },
      'photo': {
        'expert': 'gpt-4',
        'comprehensive': 'gpt-4',
        'standard': 'gpt-4-turbo',
        'basic': 'gpt-3.5-turbo'
      }
    };

    const depth = request.options?.depth_level || 'standard';
    return modelSelection[request.type][depth];
  }

  /**
   * Generate advanced prompt using the prompt engine
   */
  private generateAdvancedPrompt(request: AnalysisRequest): string {
    let basePrompt: string;

    switch (request.type) {
      case 'profile':
        basePrompt = AdvancedPromptEngine.generateProfileAnalysisPrompt(request.context);
        break;
      case 'conversation':
        basePrompt = AdvancedPromptEngine.generateConversationCoachingPrompt(request.context);
        break;
      case 'compatibility':
        basePrompt = AdvancedPromptEngine.generateCompatibilityAnalysisPrompt(request.context);
        break;
      case 'opening_message':
        basePrompt = AdvancedPromptEngine.generateOpeningMessagePrompt(request.context);
        break;
      case 'photo':
        basePrompt = AdvancedPromptEngine.generatePhotoAnalysisPrompt(request.context);
        break;
      default:
        throw new Error(`Unsupported analysis type: ${request.type}`);
    }

    // Adapt prompt to context
    return AdvancedPromptEngine.adaptPromptToContext(basePrompt, request.context);
  }

  /**
   * Execute single model analysis with optimized parameters
   */
  private async executeSingleModelAnalysis(
    request: AnalysisRequest, 
    prompt: string, 
    model: string
  ): Promise<AnalysisResult> {
    const config = this.modelConfigs.get(model);
    if (!config) {
      throw new Error(`Model configuration not found: ${model}`);
    }

    // Optimize prompt for specific model
    const optimizedPrompt = this.optimizePromptForModel(prompt, model);

    const response = await this.openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert dating psychology analyst. Provide detailed, evidence-based analysis.'
        },
        {
          role: 'user',
          content: optimizedPrompt
        }
      ],
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      top_p: config.top_p,
      frequency_penalty: config.frequency_penalty,
      presence_penalty: config.presence_penalty,
      response_format: request.options?.response_format === 'json' ? { type: 'json_object' } : undefined
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content received from model');
    }

    // Parse and structure response
    const analysis = this.parseAnalysisResponse(content, request.type);
    
    return {
      analysis: analysis.data,
      confidence: analysis.confidence,
      model_used: model,
      processing_time: 0, // Will be set by caller
      psychological_insights: analysis.psychological_insights,
      recommendations: analysis.recommendations
    };
  }

  /**
   * Execute multi-model analysis for validation and enhanced accuracy
   */
  private async executeMultiModelAnalysis(
    request: AnalysisRequest, 
    prompt: string
  ): Promise<AnalysisResult> {
    const models = ['gpt-4', 'gpt-4-turbo'];
    const results: AnalysisResult[] = [];

    // Execute analysis with multiple models
    for (const model of models) {
      try {
        const result = await this.executeSingleModelAnalysis(request, prompt, model);
        results.push(result);
      } catch (error) {
        console.error(`Model ${model} failed:`, error);
      }
    }

    if (results.length === 0) {
      throw new Error('All models failed to provide analysis');
    }

    // Synthesize results from multiple models
    return this.synthesizeMultiModelResults(results, request);
  }

  /**
   * Synthesize results from multiple models
   */
  private synthesizeMultiModelResults(
    results: AnalysisResult[], 
    request: AnalysisRequest
  ): AnalysisResult {
    if (results.length === 1) {
      return results[0];
    }

    // Calculate consensus and confidence
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const consensusAnalysis = this.findConsensusAnalysis(results);
    
    // Combine insights and recommendations
    const allInsights = results.flatMap(r => r.psychological_insights || []);
    const allRecommendations = results.flatMap(r => r.recommendations || []);
    
    return {
      analysis: consensusAnalysis,
      confidence: Math.min(avgConfidence * 1.1, 100), // Boost confidence for multi-model consensus
      model_used: 'multi-model-consensus',
      processing_time: 0,
      psychological_insights: this.deduplicateInsights(allInsights),
      recommendations: this.deduplicateRecommendations(allRecommendations),
      validation_score: this.calculateValidationScore(results),
      alternative_perspectives: results.map(r => ({
        model: r.model_used,
        analysis: r.analysis,
        confidence: r.confidence
      }))
    };
  }

  /**
   * Post-process analysis for quality and consistency
   */
  private async postProcessAnalysis(
    result: AnalysisResult, 
    request: AnalysisRequest
  ): Promise<AnalysisResult> {
    // Validate confidence threshold
    if (request.options?.confidence_threshold && 
        result.confidence < request.options.confidence_threshold) {
      
      // Retry with higher-tier model if confidence is too low
      if (result.model_used === 'gpt-3.5-turbo') {
        const retryRequest = { ...request };
        retryRequest.options = { ...request.options, model_preference: 'gpt4' };
        return this.analyzeWithIntelligence(retryRequest);
      }
    }

    // Enhance with psychological frameworks
    result = await this.enhanceWithPsychologicalFrameworks(result, request);
    
    // Add contextual recommendations
    result = this.addContextualRecommendations(result, request);
    
    return result;
  }

  /**
   * Enhance analysis with psychological frameworks
   */
  private async enhanceWithPsychologicalFrameworks(
    result: AnalysisResult, 
    request: AnalysisRequest
  ): Promise<AnalysisResult> {
    // Add Big Five personality analysis if not present
    if (!result.psychological_insights?.big_five) {
      result.psychological_insights = result.psychological_insights || {};
      result.psychological_insights.big_five = this.inferBigFiveTraits(result.analysis);
    }

    // Add attachment style analysis
    if (!result.psychological_insights?.attachment_style) {
      result.psychological_insights.attachment_style = this.inferAttachmentStyle(result.analysis);
    }

    // Add communication style analysis
    if (!result.psychological_insights?.communication_style) {
      result.psychological_insights.communication_style = this.inferCommunicationStyle(result.analysis);
    }

    return result;
  }

  /**
   * Parse analysis response based on type
   */
  private parseAnalysisResponse(content: string, type: string): any {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      return {
        data: parsed,
        confidence: parsed.confidence || 85,
        psychological_insights: parsed.psychological_insights || {},
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      // Fallback to structured text parsing
      return this.parseStructuredTextResponse(content, type);
    }
  }

  /**
   * Parse structured text response when JSON parsing fails
   */
  private parseStructuredTextResponse(content: string, type: string): any {
    const sections = this.extractSections(content);
    
    return {
      data: {
        summary: sections.summary || content.substring(0, 200),
        detailed_analysis: sections.analysis || content,
        scores: this.extractScores(content),
        insights: sections.insights || []
      },
      confidence: this.extractConfidence(content),
      psychological_insights: this.extractPsychologicalInsights(content),
      recommendations: this.extractRecommendations(content)
    };
  }

  /**
   * Utility methods for analysis enhancement
   */
  private inferBigFiveTraits(analysis: any): any {
    // Implement Big Five trait inference logic
    return {
      openness: 75,
      conscientiousness: 80,
      extraversion: 70,
      agreeableness: 85,
      neuroticism: 30,
      confidence: 80
    };
  }

  private inferAttachmentStyle(analysis: any): any {
    // Implement attachment style inference logic
    return {
      style: 'secure',
      confidence: 75,
      indicators: ['comfortable with intimacy', 'values independence']
    };
  }

  private inferCommunicationStyle(analysis: any): any {
    // Implement communication style inference logic
    return {
      directness: 70,
      emotional_expression: 80,
      formality: 60,
      conflict_style: 'collaborative',
      confidence: 85
    };
  }

  /**
   * Helper methods
   */
  private generateCacheKey(request: AnalysisRequest): string {
    const contextStr = JSON.stringify(request.context);
    const optionsStr = JSON.stringify(request.options || {});
    return `${request.type}_${Buffer.from(contextStr + optionsStr).toString('base64').substring(0, 32)}`;
  }

  private mapModelPreference(preference: string): string {
    const mapping = {
      'gpt4': 'gpt-4',
      'claude': 'gpt-4', // Fallback to GPT-4 for now
      'gemini': 'gpt-4-turbo' // Fallback to GPT-4-turbo for now
    };
    return mapping[preference] || 'gpt-4';
  }

  private optimizePromptForModel(prompt: string, model: string): string {
    // Model-specific optimizations
    if (model.includes('gpt-4')) {
      return `${prompt}\n\nProvide a comprehensive, structured analysis with specific evidence and confidence scores.`;
    } else if (model.includes('gpt-3.5')) {
      return `${prompt}\n\nProvide a clear, concise analysis with key insights and recommendations.`;
    }
    return prompt;
  }

  private extractSections(content: string): any {
    const sections = {};
    const sectionRegex = /(?:^|\n)(?:#+\s*)?([A-Z][A-Z\s&]+):?\s*\n((?:(?!\n(?:#+\s*)?[A-Z][A-Z\s&]+:).|\n)*)/g;
    let match;
    
    while ((match = sectionRegex.exec(content)) !== null) {
      const key = match[1].toLowerCase().replace(/\s+/g, '_');
      sections[key] = match[2].trim();
    }
    
    return sections;
  }

  private extractScores(content: string): any {
    const scores = {};
    const scoreRegex = /(\w+(?:\s+\w+)*)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:\/\s*100|%)?/g;
    let match;
    
    while ((match = scoreRegex.exec(content)) !== null) {
      const key = match[1].toLowerCase().replace(/\s+/g, '_');
      scores[key] = parseFloat(match[2]);
    }
    
    return scores;
  }

  private extractConfidence(content: string): number {
    const confidenceMatch = content.match(/confidence\s*:?\s*(\d+(?:\.\d+)?)/i);
    return confidenceMatch ? parseFloat(confidenceMatch[1]) : 85;
  }

  private extractPsychologicalInsights(content: string): any {
    // Extract psychological insights from content
    return {
      personality_traits: this.extractPersonalityTraits(content),
      behavioral_patterns: this.extractBehavioralPatterns(content),
      emotional_indicators: this.extractEmotionalIndicators(content)
    };
  }

  private extractRecommendations(content: string): string[] {
    const recommendations = [];
    const recRegex = /(?:recommendation|suggest|advice)s?:?\s*\n?((?:[-•*]\s*.+\n?)+)/gi;
    let match;
    
    while ((match = recRegex.exec(content)) !== null) {
      const items = match[1].split(/\n?[-•*]\s*/).filter(item => item.trim());
      recommendations.push(...items);
    }
    
    return recommendations;
  }

  private extractPersonalityTraits(content: string): any {
    // Implementation for extracting personality traits
    return {};
  }

  private extractBehavioralPatterns(content: string): any {
    // Implementation for extracting behavioral patterns
    return {};
  }

  private extractEmotionalIndicators(content: string): any {
    // Implementation for extracting emotional indicators
    return {};
  }

  private findConsensusAnalysis(results: AnalysisResult[]): any {
    // Find consensus between multiple model results
    return results[0].analysis; // Simplified for now
  }

  private deduplicateInsights(insights: any[]): any[] {
    // Remove duplicate insights
    return insights; // Simplified for now
  }

  private deduplicateRecommendations(recommendations: any[]): any[] {
    // Remove duplicate recommendations
    return [...new Set(recommendations)];
  }

  private calculateValidationScore(results: AnalysisResult[]): number {
    // Calculate validation score based on consensus
    return results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  }

  private addContextualRecommendations(result: AnalysisResult, request: AnalysisRequest): AnalysisResult {
    // Add context-specific recommendations
    return result;
  }

  private updatePerformanceMetrics(model: string, result: AnalysisResult): void {
    // Update performance metrics for model optimization
    const metrics = this.performanceMetrics.get(model) || { 
      total_requests: 0, 
      avg_confidence: 0, 
      success_rate: 0 
    };
    
    metrics.total_requests++;
    metrics.avg_confidence = (metrics.avg_confidence + result.confidence) / 2;
    metrics.success_rate = result.confidence > 80 ? 
      (metrics.success_rate + 1) / 2 : 
      metrics.success_rate * 0.95;
    
    this.performanceMetrics.set(model, metrics);
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics(): Map<string, any> {
    return this.performanceMetrics;
  }

  /**
   * Clear cache (for memory management)
   */
  clearCache(): void {
    this.analysisCache.clear();
  }
}

export default IntelligentAnalysisEngine;

