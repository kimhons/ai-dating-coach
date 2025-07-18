import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types for advanced prompt optimization
interface UserContext {
    userId: string;
    tier: 'free' | 'premium' | 'pro';
    demographics: {
        age?: number;
        gender?: string;
        location?: string;
        interests?: string[];
    };
    datingHistory: {
        platforms: string[];
        successRate?: number;
        commonChallenges?: string[];
    };
    analysisHistory: AnalysisHistoryItem[];
    preferences: UserPreferences;
}

interface AnalysisHistoryItem {
    type: string;
    confidence: number;
    insights: string[];
    timestamp: number;
    feedback?: UserFeedback;
}

interface UserFeedback {
    helpful: boolean;
    rating: number;
    comments?: string;
}

interface UserPreferences {
    communicationStyle: 'direct' | 'casual' | 'formal' | 'playful';
    feedbackIntensity: 'gentle' | 'balanced' | 'direct' | 'intense';
    culturalContext: string;
    relationshipGoals: string[];
}

interface OptimizedPrompt {
    systemMessage: string;
    userPrompt: string;
    fewShotExamples: FewShotExample[];
    expectedTokens: number;
    cacheKey: string;
    reasoning: string[];
    personalizationLevel: number;
}

interface FewShotExample {
    input: string;
    output: string;
    reasoning: string;
}

interface SemanticCacheEntry {
    promptVector: number[];
    originalPrompt: string;
    optimizedPrompt: OptimizedPrompt;
    userContext: Partial<UserContext>;
    timestamp: number;
    hitCount: number;
    successRate: number;
}

class IntelligentPromptOptimizer {
    private supabase: any;
    private openaiApiKey: string;
    private semanticCache: Map<string, SemanticCacheEntry> = new Map();
    private exampleBank: FewShotExampleBank;
    private personalizationEngine: PersonalizationEngine;

    constructor(supabase: any, openaiApiKey: string) {
        this.supabase = supabase;
        this.openaiApiKey = openaiApiKey;
        this.exampleBank = new FewShotExampleBank();
        this.personalizationEngine = new PersonalizationEngine();
    }

    async optimizePrompt(
        basePrompt: string,
        userContext: UserContext,
        analysisType: string,
        priority: 'speed' | 'quality' | 'cost' = 'quality'
    ): Promise<OptimizedPrompt> {
        const cacheKey = this.generateSemanticCacheKey(basePrompt, userContext, analysisType);
        
        // Check semantic cache
        const cached = await this.checkSemanticCache(basePrompt, userContext, analysisType);
        if (cached && this.shouldUseCached(cached, priority)) {
            return this.adaptCachedResult(cached, userContext);
        }

        // Generate new optimized prompt
        const optimized = await this.generateOptimizedPrompt(
            basePrompt,
            userContext,
            analysisType,
            priority
        );

        // Cache the result
        await this.cacheOptimizedPrompt(basePrompt, optimized, userContext, analysisType);

        return optimized;
    }

    private async generateOptimizedPrompt(
        basePrompt: string,
        userContext: UserContext,
        analysisType: string,
        priority: 'speed' | 'quality' | 'cost'
    ): Promise<OptimizedPrompt> {
        // Step 1: Personalize system message
        const personalizedSystem = await this.personalizationEngine.createSystemMessage(
            userContext,
            analysisType,
            priority
        );

        // Step 2: Optimize user prompt with context
        const contextualizedPrompt = await this.contextualizePrompt(
            basePrompt,
            userContext,
            analysisType
        );

        // Step 3: Add relevant few-shot examples
        const relevantExamples = await this.exampleBank.getRelevantExamples(
            analysisType,
            userContext,
            Math.min(userContext.tier === 'free' ? 1 : userContext.tier === 'premium' ? 3 : 5, 5)
        );

        // Step 4: Optimize for token efficiency
        const tokenOptimized = await this.optimizeTokenUsage(
            contextualizedPrompt,
            userContext.tier,
            priority
        );

        // Step 5: Add chain-of-thought reasoning
        const withReasoning = this.addChainOfThought(
            tokenOptimized,
            analysisType,
            userContext.tier
        );

        const expectedTokens = this.estimateTokens(personalizedSystem + withReasoning);
        
        return {
            systemMessage: personalizedSystem,
            userPrompt: withReasoning,
            fewShotExamples: relevantExamples,
            expectedTokens,
            cacheKey: this.generateSemanticCacheKey(basePrompt, userContext, analysisType),
            reasoning: [
                'Personalized system message for user context',
                'Contextualized prompt with user history',
                'Added relevant few-shot examples',
                'Optimized token usage for tier',
                'Enhanced with chain-of-thought reasoning'
            ],
            personalizationLevel: this.calculatePersonalizationLevel(userContext)
        };
    }

    private async checkSemanticCache(
        prompt: string,
        userContext: UserContext,
        analysisType: string
    ): Promise<SemanticCacheEntry | null> {
        const promptVector = await this.vectorizePrompt(prompt);
        const contextVector = await this.vectorizeUserContext(userContext);
        
        // Search for semantically similar cached prompts
        for (const [key, entry] of this.semanticCache.entries()) {
            const similarity = this.calculateCosineSimilarity(promptVector, entry.promptVector);
            const contextSimilarity = this.calculateContextSimilarity(userContext, entry.userContext);
            
            // High similarity threshold for cache hit
            if (similarity > 0.85 && contextSimilarity > 0.7) {
                entry.hitCount++;
                entry.timestamp = Date.now();
                return entry;
            }
        }

        return null;
    }

    private async vectorizePrompt(prompt: string): Promise<number[]> {
        // Use OpenAI embeddings for semantic similarity
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: prompt,
                encoding_format: 'float'
            })
        });

        if (!response.ok) {
            throw new Error(`Embedding API error: ${response.status}`);
        }

        const result = await response.json();
        return result.data[0].embedding;
    }

    private calculateCosineSimilarity(a: number[], b: number[]): number {
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }

    private addChainOfThought(
        prompt: string,
        analysisType: string,
        tier: string
    ): string {
        const reasoningSteps = this.getReasoningSteps(analysisType, tier);
        
        return `${prompt}

Please analyze this step by step:
${reasoningSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Think through each step carefully and provide your reasoning before the final analysis.`;
    }

    private getReasoningSteps(analysisType: string, tier: string): string[] {
        const baseSteps = {
            'photo': [
                'First, assess the overall visual appeal and technical quality',
                'Next, analyze facial expressions and body language',
                'Then, evaluate the setting and background appropriateness',
                'Finally, consider the target audience and dating context'
            ],
            'conversation': [
                'First, analyze the conversation flow and engagement level',
                'Next, identify communication patterns and emotional tone',
                'Then, assess potential red flags or positive indicators',
                'Finally, provide specific improvement suggestions'
            ],
            'voice': [
                'First, evaluate vocal tone, pace, and clarity',
                'Next, analyze emotional expression and confidence',
                'Then, assess content relevance and engagement',
                'Finally, provide personalized coaching recommendations'
            ]
        };

        const steps = baseSteps[analysisType as keyof typeof baseSteps] || baseSteps.conversation;
        
        if (tier === 'pro') {
            steps.push(
                'Additionally, provide advanced psychological insights',
                'Consider long-term relationship compatibility factors'
            );
        }

        return steps;
    }

    private estimateTokens(text: string): number {
        // Rough estimation: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }

    private generateSemanticCacheKey(
        prompt: string,
        userContext: UserContext,
        analysisType: string
    ): string {
        const contextHash = this.hashUserContext(userContext);
        const promptHash = this.hashString(prompt);
        return `${analysisType}_${contextHash}_${promptHash}`;
    }

    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    private hashUserContext(context: UserContext): string {
        const relevantData = {
            tier: context.tier,
            age: context.demographics.age,
            gender: context.demographics.gender,
            goals: context.preferences.relationshipGoals,
            style: context.preferences.communicationStyle
        };
        return this.hashString(JSON.stringify(relevantData));
    }
}

class PersonalizationEngine {
    async createSystemMessage(
        userContext: UserContext,
        analysisType: string,
        priority: 'speed' | 'quality' | 'cost'
    ): Promise<string> {
        const basePersona = this.getBasePersona(analysisType);
        const tierCustomization = this.getTierCustomization(userContext.tier);
        const demographicCustomization = this.getDemographicCustomization(userContext.demographics);
        const preferenceCustomization = this.getPreferenceCustomization(userContext.preferences);
        
        return `${basePersona}

${tierCustomization}

${demographicCustomization}

${preferenceCustomization}

Communication Guidelines:
- Use a ${userContext.preferences.communicationStyle} tone
- Provide ${userContext.preferences.feedbackIntensity} feedback
- Consider cultural context: ${userContext.preferences.culturalContext}
- Focus on relationship goals: ${userContext.preferences.relationshipGoals.join(', ')}

Always respond with valid JSON format and maintain user privacy and dignity.`;
    }

    private getBasePersona(analysisType: string): string {
        const personas = {
            'photo': 'You are Dr. Elena Rodriguez, a leading dating psychology expert and professional photographer specializing in dating profile optimization.',
            'conversation': 'You are Dr. Marcus Chen, a renowned relationship communication specialist with expertise in cross-cultural dating dynamics.',
            'voice': 'You are Dr. Sarah Johnson, a voice coach and dating confidence expert who helps people express their authentic selves.'
        };

        return personas[analysisType as keyof typeof personas] || personas.conversation;
    }

    private getTierCustomization(tier: string): string {
        const customizations = {
            'free': 'Provide clear, actionable basic insights with 1-2 key suggestions.',
            'premium': 'Deliver comprehensive analysis with 3-5 detailed suggestions and personality insights.',
            'pro': 'Offer complete professional-level analysis with advanced psychological profiling, unlimited suggestions, and strategic dating coaching.'
        };

        return customizations[tier as keyof typeof customizations];
    }

    private getDemographicCustomization(demographics: UserContext['demographics']): string {
        let customization = '';
        
        if (demographics.age) {
            if (demographics.age < 25) {
                customization += 'Consider the unique aspects of early career dating and self-discovery. ';
            } else if (demographics.age > 35) {
                customization += 'Focus on mature relationship goals and life experience compatibility. ';
            }
        }

        if (demographics.location) {
            customization += `Consider the dating culture and social norms of ${demographics.location}. `;
        }

        if (demographics.interests && demographics.interests.length > 0) {
            customization += `Incorporate insights about interests in: ${demographics.interests.join(', ')}. `;
        }

        return customization;
    }

    private getPreferenceCustomization(preferences: UserPreferences): string {
        return `Tailor advice to ${preferences.communicationStyle} communication style with ${preferences.feedbackIntensity} feedback intensity.`;
    }
}

class FewShotExampleBank {
    private examples: Map<string, FewShotExample[]> = new Map();

    constructor() {
        this.initializeExamples();
    }

    async getRelevantExamples(
        analysisType: string,
        userContext: UserContext,
        maxExamples: number
    ): Promise<FewShotExample[]> {
        const typeExamples = this.examples.get(analysisType) || [];
        
        // Score examples based on relevance to user context
        const scoredExamples = typeExamples.map(example => ({
            example,
            score: this.calculateRelevanceScore(example, userContext)
        }));

        // Sort by relevance and return top examples
        return scoredExamples
            .sort((a, b) => b.score - a.score)
            .slice(0, maxExamples)
            .map(item => item.example);
    }

    private calculateRelevanceScore(example: FewShotExample, userContext: UserContext): number {
        // Implement relevance scoring based on user context
        let score = 0.5; // Base score

        // Factor in user tier
        if (userContext.tier === 'pro' && example.reasoning.includes('advanced')) {
            score += 0.3;
        }

        // Factor in communication style
        if (example.output.toLowerCase().includes(userContext.preferences.communicationStyle)) {
            score += 0.2;
        }

        return score;
    }

    private initializeExamples(): void {
        // Photo analysis examples
        this.examples.set('photo', [
            {
                input: 'Selfie in car with sunglasses, casual smile',
                output: JSON.stringify({
                    overall_score: 6,
                    suggestions: ['Remove sunglasses to show eyes', 'Use natural lighting instead of car interior'],
                    improvements: ['Take photo outdoors with better lighting', 'Show genuine smile without barriers']
                }),
                reasoning: 'Basic photo improvement focusing on visibility and authenticity'
            }
        ]);

        // Conversation analysis examples  
        this.examples.set('conversation', [
            {
                input: 'You: Hey, how was your day? Them: Good thanks, you?',
                output: JSON.stringify({
                    engagement_level: 4,
                    suggestions: ['Ask more specific questions', 'Share something interesting about your day'],
                    conversation_starters: ['What was the highlight of your day?', 'I had an interesting experience today...']
                }),
                reasoning: 'Improving conversation depth and engagement'
            }
        ]);
    }
}

// Main function handler
serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { basePrompt, userContext, analysisType, priority = 'quality' } = await req.json();

        if (!basePrompt || !userContext || !analysisType) {
            throw new Error('Missing required parameters');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

        if (!supabaseUrl || !serviceRoleKey || !openaiApiKey) {
            throw new Error('Missing environment configuration');
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const optimizer = new IntelligentPromptOptimizer(supabase, openaiApiKey);

        const optimizedPrompt = await optimizer.optimizePrompt(
            basePrompt,
            userContext,
            analysisType,
            priority
        );

        return new Response(
            JSON.stringify({
                success: true,
                optimizedPrompt,
                performance: {
                    tokenEstimate: optimizedPrompt.expectedTokens,
                    personalizationLevel: optimizedPrompt.personalizationLevel,
                    cacheKey: optimizedPrompt.cacheKey
                }
            }),
            { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Prompt optimization error:', error);
        
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});