import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types for streaming analysis
interface StreamingAnalysisRequest {
    type: 'photo' | 'conversation' | 'voice' | 'screenshot';
    data: any;
    userId: string;
    userTier: 'free' | 'premium' | 'pro';
    streamingEnabled: boolean;
    priority: 'speed' | 'quality' | 'cost';
}

interface AnalysisChunk {
    chunkId: string;
    type: 'progress' | 'partial_result' | 'final_result' | 'error';
    progress: number;
    data?: any;
    error?: string;
    timestamp: number;
    processingTime?: number;
}

interface ProgressUpdate {
    stage: string;
    progress: number;
    message: string;
    eta?: number;
}

class StreamingAnalysisService {
    private supabase: any;
    private openaiApiKey: string;
    private geminiApiKey: string;

    constructor(supabase: any, openaiApiKey: string, geminiApiKey: string) {
        this.supabase = supabase;
        this.openaiApiKey = openaiApiKey;
        this.geminiApiKey = geminiApiKey;
    }

    async processStreamingAnalysis(
        request: StreamingAnalysisRequest
    ): Promise<ReadableStream<Uint8Array>> {
        const encoder = new TextEncoder();
        const startTime = Date.now();

        return new ReadableStream({
            async start(controller) {
                try {
                    // Stage 1: Initialization
                    const initChunk = this.createProgressChunk('initializing', 0, 'Setting up analysis...', startTime);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(initChunk)}\n\n`));

                    // Stage 2: Data validation and preprocessing
                    await this.delay(100); // Simulate processing time
                    const validationChunk = this.createProgressChunk('validation', 10, 'Validating input data...', startTime);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(validationChunk)}\n\n`));

                    // Stage 3: User context retrieval
                    const contextChunk = this.createProgressChunk('context', 20, 'Loading user profile and preferences...', startTime);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(contextChunk)}\n\n`));
                    
                    const userContext = await this.getUserContext(request.userId);
                    
                    // Stage 4: Prompt optimization
                    const promptChunk = this.createProgressChunk('optimization', 30, 'Optimizing analysis prompts...', startTime);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(promptChunk)}\n\n`));

                    const optimizedPrompt = await this.optimizePrompt(request, userContext);

                    // Stage 5: Initial AI analysis (streaming)
                    const analysisChunk = this.createProgressChunk('analysis', 40, 'Starting AI analysis...', startTime);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(analysisChunk)}\n\n`));

                    // Process analysis in chunks for streaming
                    const analysisChunks = this.breakdownAnalysis(request);
                    let completedChunks = 0;

                    for (const chunk of analysisChunks) {
                        const chunkResult = await this.processAnalysisChunk(chunk, optimizedPrompt, userContext);
                        completedChunks++;
                        
                        const progress = 40 + (completedChunks / analysisChunks.length) * 40;
                        const partialChunk = this.createPartialResultChunk(
                            progress,
                            chunkResult,
                            `Processing ${chunk.type}...`,
                            startTime
                        );
                        
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(partialChunk)}\n\n`));
                        
                        // Small delay to allow client to process
                        await this.delay(50);
                    }

                    // Stage 6: Aggregation and post-processing
                    const aggregationChunk = this.createProgressChunk('aggregation', 85, 'Combining analysis results...', startTime);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(aggregationChunk)}\n\n`));

                    const finalResult = await this.aggregateResults(analysisChunks, userContext);

                    // Stage 7: Personalization and tier filtering
                    const personalizationChunk = this.createProgressChunk('personalization', 95, 'Personalizing insights...', startTime);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(personalizationChunk)}\n\n`));

                    const personalizedResult = await this.personalizeResult(finalResult, userContext, request.userTier);

                    // Stage 8: Final result
                    const finalChunk = this.createFinalResultChunk(personalizedResult, startTime);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalChunk)}\n\n`));

                    // Save to database
                    await this.saveAnalysisResult(request.userId, personalizedResult);

                    controller.close();

                } catch (error) {
                    console.error('Streaming analysis error:', error);
                    
                    const errorChunk = this.createErrorChunk(error.message, startTime);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
                    controller.close();
                }
            }
        });
    }

    private createProgressChunk(
        stage: string,
        progress: number,
        message: string,
        startTime: number,
        eta?: number
    ): AnalysisChunk {
        return {
            chunkId: `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'progress',
            progress,
            data: {
                stage,
                message,
                eta: eta || this.estimateETA(progress, startTime)
            },
            timestamp: Date.now(),
            processingTime: Date.now() - startTime
        };
    }

    private createPartialResultChunk(
        progress: number,
        partialData: any,
        message: string,
        startTime: number
    ): AnalysisChunk {
        return {
            chunkId: `partial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'partial_result',
            progress,
            data: {
                partial: partialData,
                message,
                canDisplayToUser: true
            },
            timestamp: Date.now(),
            processingTime: Date.now() - startTime
        };
    }

    private createFinalResultChunk(result: any, startTime: number): AnalysisChunk {
        return {
            chunkId: `final_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'final_result',
            progress: 100,
            data: result,
            timestamp: Date.now(),
            processingTime: Date.now() - startTime
        };
    }

    private createErrorChunk(error: string, startTime: number): AnalysisChunk {
        return {
            chunkId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'error',
            progress: 0,
            error,
            timestamp: Date.now(),
            processingTime: Date.now() - startTime
        };
    }

    private estimateETA(progress: number, startTime: number): number {
        if (progress <= 0) return 0;
        
        const elapsed = Date.now() - startTime;
        const rate = progress / elapsed;
        const remaining = 100 - progress;
        
        return Math.ceil(remaining / rate);
    }

    private async getUserContext(userId: string): Promise<any> {
        // Fetch user context from database
        const { data: user } = await this.supabase
            .from('users')
            .select(`
                *,
                user_preferences(*),
                analysis_history(*)
            `)
            .eq('id', userId)
            .single();

        return user;
    }

    private async optimizePrompt(request: StreamingAnalysisRequest, userContext: any): Promise<any> {
        // Call the prompt optimizer function
        const { data, error } = await this.supabase.functions.invoke('enhanced-prompt-optimizer', {
            body: {
                basePrompt: this.getBasePrompt(request.type),
                userContext,
                analysisType: request.type,
                priority: request.priority
            }
        });

        if (error) throw new Error(`Prompt optimization failed: ${error.message}`);
        return data.optimizedPrompt;
    }

    private getBasePrompt(analysisType: string): string {
        const prompts = {
            'photo': 'Analyze this dating profile photo for attractiveness, composition, and dating effectiveness.',
            'conversation': 'Analyze this conversation for engagement level, communication quality, and improvement opportunities.',
            'voice': 'Analyze this voice recording for confidence, clarity, and overall dating appeal.',
            'screenshot': 'Analyze this dating app screenshot for conversation quality and coaching opportunities.'
        };

        return prompts[analysisType as keyof typeof prompts] || prompts.conversation;
    }

    private breakdownAnalysis(request: StreamingAnalysisRequest): any[] {
        switch (request.type) {
            case 'photo':
                return [
                    { type: 'technical_quality', data: request.data },
                    { type: 'attractiveness_assessment', data: request.data },
                    { type: 'composition_analysis', data: request.data },
                    { type: 'dating_effectiveness', data: request.data }
                ];
            
            case 'conversation':
                return [
                    { type: 'engagement_analysis', data: request.data },
                    { type: 'communication_patterns', data: request.data },
                    { type: 'emotional_intelligence', data: request.data },
                    { type: 'improvement_suggestions', data: request.data }
                ];
            
            case 'voice':
                return [
                    { type: 'vocal_quality', data: request.data },
                    { type: 'confidence_assessment', data: request.data },
                    { type: 'emotional_expression', data: request.data },
                    { type: 'coaching_recommendations', data: request.data }
                ];
            
            default:
                return [{ type: 'general_analysis', data: request.data }];
        }
    }

    private async processAnalysisChunk(
        chunk: any,
        optimizedPrompt: any,
        userContext: any
    ): Promise<any> {
        // Simulate AI processing with specific prompts for each chunk
        const chunkPrompt = this.buildChunkPrompt(chunk, optimizedPrompt);
        
        // Use appropriate AI model based on chunk type
        const modelConfig = this.getModelConfig(chunk.type);
        
        try {
            if (modelConfig.provider === 'openai') {
                return await this.processWithOpenAI(chunkPrompt, modelConfig);
            } else {
                return await this.processWithGemini(chunkPrompt, modelConfig);
            }
        } catch (error) {
            console.error(`Error processing chunk ${chunk.type}:`, error);
            return { error: error.message, chunk_type: chunk.type };
        }
    }

    private buildChunkPrompt(chunk: any, optimizedPrompt: any): string {
        return `${optimizedPrompt.systemMessage}

Focus specifically on: ${chunk.type}

${optimizedPrompt.userPrompt}

Data to analyze: ${JSON.stringify(chunk.data)}

Provide analysis in JSON format focusing on ${chunk.type}.`;
    }

    private getModelConfig(chunkType: string): any {
        const configs = {
            'technical_quality': { provider: 'openai', model: 'gpt-4o', maxTokens: 500 },
            'attractiveness_assessment': { provider: 'openai', model: 'gpt-4o', maxTokens: 600 },
            'engagement_analysis': { provider: 'openai', model: 'gpt-4-turbo', maxTokens: 700 },
            'vocal_quality': { provider: 'gemini', model: 'gemini-pro', maxTokens: 500 },
            'default': { provider: 'openai', model: 'gpt-4o', maxTokens: 600 }
        };

        return configs[chunkType as keyof typeof configs] || configs.default;
    }

    private async processWithOpenAI(prompt: string, config: any): Promise<any> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: config.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: config.maxTokens,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const result = await response.json();
        const content = result.choices[0].message.content;
        
        try {
            return JSON.parse(content);
        } catch {
            return { analysis: content, raw: true };
        }
    }

    private async processWithGemini(prompt: string, config: any): Promise<any> {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${this.geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        maxOutputTokens: config.maxTokens,
                        temperature: 0.7
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const result = await response.json();
        const content = result.candidates[0].content.parts[0].text;
        
        try {
            return JSON.parse(content);
        } catch {
            return { analysis: content, raw: true };
        }
    }

    private async aggregateResults(chunks: any[], userContext: any): Promise<any> {
        // Combine all chunk results into a comprehensive analysis
        const aggregated = {
            overall_score: 0,
            detailed_analysis: {},
            insights: [],
            suggestions: [],
            confidence: 0,
            timestamp: Date.now()
        };

        for (const chunk of chunks) {
            if (chunk.analysis && !chunk.error) {
                aggregated.detailed_analysis[chunk.type] = chunk.analysis;
                
                if (chunk.analysis.insights) {
                    aggregated.insights.push(...chunk.analysis.insights);
                }
                
                if (chunk.analysis.suggestions) {
                    aggregated.suggestions.push(...chunk.analysis.suggestions);
                }
            }
        }

        // Calculate overall scores and confidence
        aggregated.overall_score = this.calculateOverallScore(aggregated.detailed_analysis);
        aggregated.confidence = this.calculateConfidence(aggregated.detailed_analysis);

        return aggregated;
    }

    private calculateOverallScore(analysis: any): number {
        const scores = Object.values(analysis)
            .map((item: any) => item.score || item.rating || 0)
            .filter(score => score > 0);
        
        return scores.length > 0 ? 
            scores.reduce((sum, score) => sum + score, 0) / scores.length : 
            0;
    }

    private calculateConfidence(analysis: any): number {
        const confidences = Object.values(analysis)
            .map((item: any) => item.confidence || 0.8)
            .filter(conf => conf > 0);
        
        return confidences.length > 0 ? 
            confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length : 
            0.8;
    }

    private async personalizeResult(result: any, userContext: any, tier: string): Promise<any> {
        // Apply tier-based filtering and personalization
        const tierLimits = {
            'free': { maxSuggestions: 2, maxInsights: 3 },
            'premium': { maxSuggestions: 5, maxInsights: 8 },
            'pro': { maxSuggestions: -1, maxInsights: -1 }
        };

        const limits = tierLimits[tier as keyof typeof tierLimits];
        
        if (limits.maxSuggestions > 0) {
            result.suggestions = result.suggestions.slice(0, limits.maxSuggestions);
        }
        
        if (limits.maxInsights > 0) {
            result.insights = result.insights.slice(0, limits.maxInsights);
        }

        // Add personalized messaging
        result.personalization = {
            tone: userContext.preferences?.communicationStyle || 'balanced',
            culturalContext: userContext.preferences?.culturalContext || 'general',
            tier: tier
        };

        return result;
    }

    private async saveAnalysisResult(userId: string, result: any): Promise<void> {
        await this.supabase
            .from('analysis_results')
            .insert({
                user_id: userId,
                analysis_data: result,
                created_at: new Date().toISOString()
            });
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main function handler
serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const requestData = await req.json();
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

        if (!supabaseUrl || !serviceRoleKey || !openaiApiKey) {
            throw new Error('Missing environment configuration');
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const streamingService = new StreamingAnalysisService(supabase, openaiApiKey, geminiApiKey);

        const stream = await streamingService.processStreamingAnalysis(requestData);

        return new Response(stream, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error) {
        console.error('Streaming analysis error:', error);
        
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