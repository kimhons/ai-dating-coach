import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types
interface AnalysisRequest {
    type: 'photo' | 'conversation' | 'voice' | 'screenshot' | 'keyboard' | 'browser';
    data: any;
    userTier: 'free' | 'premium' | 'pro';
    userId: string;
    platform?: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

interface AnalysisResponse {
    success: boolean;
    analysis?: AnalysisResult;
    error?: string;
    tierLimitations?: TierLimitations;
    upgradePrompt?: string;
    processingTime?: number;
    requestId: string;
}

interface AnalysisResult {
    compatibility?: number | string;
    insights: string[];
    suggestions: string[];
    redFlags: string[];
    conversationStarters: string[];
    personalityProfile?: PersonalityProfile;
    relationshipPotential?: RelationshipPotential;
    confidence: number;
    analysisType: 'basic' | 'comprehensive' | 'complete_reconstruction';
    timestamp: number;
}

interface PersonalityProfile {
    traits: Array<{
        name: string;
        score: number;
        description: string;
    }>;
    communicationStyle: string;
    interests: string[];
    values: string[];
    lifestyle: string;
    relationshipGoals: string;
}

interface RelationshipPotential {
    shortTerm: number;
    longTerm: number;
    compatibility: number;
    challenges: string[];
    strengths: string[];
    advice: string;
}

interface TierLimitations {
    maxSuggestions: number;
    maxInsights: number;
    advancedFeatures: boolean;
    realTimeAnalysis: boolean;
    crossPlatformSync: boolean;
    voiceAnalysis: boolean;
    personalityProfiling: boolean;
    unlimitedScreenshots: boolean;
}

interface TierCheck {
    allowed: boolean;
    upgradePrompt?: string;
    remainingUsage?: number;
}

// Performance monitoring
class PerformanceMonitor {
    private static timers: Map<string, number> = new Map();
    
    static startTimer(operation: string): string {
        const timerId = `${operation}_${Date.now()}_${Math.random()}`;
        this.timers.set(timerId, performance.now());
        return timerId;
    }
    
    static endTimer(timerId: string): number {
        const startTime = this.timers.get(timerId);
        if (!startTime) {
            throw new Error(`Timer ${timerId} not found`);
        }
        
        const duration = performance.now() - startTime;
        this.timers.delete(timerId);
        
        // Log performance warnings
        if (duration > 2000) { // 2 second threshold
            console.warn(`Performance warning: Operation took ${duration}ms`);
        }
        
        return duration;
    }
}

// Main handler
serve(async (req) => {
    const requestId = crypto.randomUUID();
    const performanceTimer = PerformanceMonitor.startTimer('total_request');
    
    try {
        // CORS headers for cross-platform access
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Max-Age': '86400',
        };

        if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders });
        }

        if (req.method !== 'POST') {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Method not allowed',
                    requestId 
                }),
                { 
                    status: 405, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

        // Parse and validate request
        let analysisRequest: AnalysisRequest;
        try {
            analysisRequest = await req.json();
        } catch (error) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Invalid JSON payload',
                    requestId 
                }),
                { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

        // Validate required fields
        const validation = validateRequest(analysisRequest);
        if (!validation.isValid) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: validation.error,
                    requestId 
                }),
                { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

        // Initialize Supabase client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );

        // Authenticate user
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Authentication required',
                    requestId 
                }),
                { 
                    status: 401, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: user, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user?.user) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Invalid authentication token',
                    requestId 
                }),
                { 
                    status: 401, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

        // Verify user tier and check usage limits
        const tierCheckTimer = PerformanceMonitor.startTimer('tier_check');
        const tierCheck = await checkTierLimits(supabase, user.user.id, analysisRequest);
        PerformanceMonitor.endTimer(tierCheckTimer);

        if (!tierCheck.allowed) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Tier limit exceeded',
                    upgradePrompt: tierCheck.upgradePrompt,
                    remainingUsage: tierCheck.remainingUsage,
                    requestId
                }),
                { 
                    status: 429, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

        // Perform analysis based on type
        const analysisTimer = PerformanceMonitor.startTimer('analysis');
        let analysisResult: AnalysisResult;
        
        try {
            switch (analysisRequest.type) {
                case 'photo':
                    analysisResult = await analyzePhoto(analysisRequest);
                    break;
                case 'conversation':
                    analysisResult = await analyzeConversation(analysisRequest);
                    break;
                case 'voice':
                    analysisResult = await analyzeVoice(analysisRequest);
                    break;
                case 'screenshot':
                    analysisResult = await analyzeScreenshot(analysisRequest);
                    break;
                case 'keyboard':
                    analysisResult = await generateKeyboardSuggestion(analysisRequest);
                    break;
                case 'browser':
                    analysisResult = await provideBrowserCoaching(analysisRequest);
                    break;
                default:
                    throw new Error(`Invalid analysis type: ${analysisRequest.type}`);
            }
        } catch (error) {
            console.error('Analysis failed:', error);
            throw new Error(`Analysis failed: ${error.message}`);
        }
        
        const analysisDuration = PerformanceMonitor.endTimer(analysisTimer);

        // Apply tier limitations to results
        const tieredResult = applyTierLimitations(analysisResult, analysisRequest.userTier);

        // Track usage and analytics
        const trackingTimer = PerformanceMonitor.startTimer('tracking');
        await Promise.all([
            trackUsage(supabase, user.user.id, analysisRequest),
            trackAnalytics(supabase, user.user.id, analysisRequest, tieredResult, analysisDuration)
        ]);
        PerformanceMonitor.endTimer(trackingTimer);

        // Sync across platforms if premium+
        if (analysisRequest.userTier !== 'free') {
            const syncTimer = PerformanceMonitor.startTimer('sync');
            await syncToPlatforms(supabase, user.user.id, tieredResult, analysisRequest.platform);
            PerformanceMonitor.endTimer(syncTimer);
        }

        const totalProcessingTime = PerformanceMonitor.endTimer(performanceTimer);

        // Return successful response
        const response: AnalysisResponse = {
            success: true,
            analysis: tieredResult,
            tierLimitations: getTierLimitations(analysisRequest.userTier),
            processingTime: totalProcessingTime,
            requestId
        };

        return new Response(
            JSON.stringify(response),
            { 
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'X-Processing-Time': totalProcessingTime.toString(),
                    'X-Request-ID': requestId
                } 
            }
        );

    } catch (error) {
        const totalProcessingTime = PerformanceMonitor.endTimer(performanceTimer);
        
        console.error('Request processing error:', {
            requestId,
            error: error.message,
            stack: error.stack,
            processingTime: totalProcessingTime
        });
        
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Internal server error',
                requestId,
                processingTime: totalProcessingTime
            }),
            { 
                status: 500, 
                headers: { 
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                    'X-Processing-Time': totalProcessingTime.toString(),
                    'X-Request-ID': requestId
                } 
            }
        );
    }
});

// Validation function
function validateRequest(request: any): { isValid: boolean; error?: string } {
    if (!request.type || !['photo', 'conversation', 'voice', 'screenshot', 'keyboard', 'browser'].includes(request.type)) {
        return { isValid: false, error: 'Invalid or missing analysis type' };
    }
    
    if (!request.userTier || !['free', 'premium', 'pro'].includes(request.userTier)) {
        return { isValid: false, error: 'Invalid or missing user tier' };
    }
    
    if (!request.userId || typeof request.userId !== 'string') {
        return { isValid: false, error: 'Invalid or missing user ID' };
    }
    
    if (!request.data) {
        return { isValid: false, error: 'Missing analysis data' };
    }
    
    if (!request.timestamp || typeof request.timestamp !== 'number') {
        return { isValid: false, error: 'Invalid or missing timestamp' };
    }
    
    return { isValid: true };
}

// Screenshot analysis with dual LLM system
async function analyzeScreenshot(request: AnalysisRequest): Promise<AnalysisResult> {
    const { data, userTier, platform } = request;
    
    // Dual LLM system with intelligent failover
    let analysisResult: AnalysisResult;
    let primaryProvider = 'openai';
    
    try {
        // Try OpenAI first (generally better for complex analysis)
        analysisResult = await analyzeWithOpenAI(data, userTier, platform, 'screenshot');
        
    } catch (openaiError) {
        console.warn('OpenAI analysis failed, falling back to Gemini:', {
            error: openaiError.message,
            userTier,
            platform
        });
        
        primaryProvider = 'gemini';
        
        try {
            // Fallback to Gemini
            analysisResult = await analyzeWithGemini(data, userTier, platform, 'screenshot');
            
        } catch (geminiError) {
            console.error('Both AI services failed:', {
                openaiError: openaiError.message,
                geminiError: geminiError.message,
                userTier,
                platform
            });
            
            // Return fallback analysis
            return getFallbackAnalysis(userTier, 'screenshot');
        }
    }
    
    // Add metadata about which provider was used
    analysisResult.metadata = {
        ...analysisResult.metadata,
        aiProvider: primaryProvider,
        timestamp: Date.now()
    };
    
    return analysisResult;
}

// OpenAI analysis implementation
async function analyzeWithOpenAI(
    data: any, 
    userTier: string, 
    platform?: string, 
    analysisType?: string
): Promise<AnalysisResult> {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured');
    }

    const prompt = generateAnalysisPrompt(data, userTier, platform, analysisType);
    const maxTokens = getMaxTokensForTier(userTier);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: getSystemPrompt(userTier, analysisType)
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: maxTokens,
            temperature: 0.7,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('Invalid OpenAI response format');
    }

    return parseAnalysisResult(result.choices[0].message.content, userTier);
}

// Gemini analysis implementation
async function analyzeWithGemini(
    data: any, 
    userTier: string, 
    platform?: string, 
    analysisType?: string
): Promise<AnalysisResult> {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
        throw new Error('Gemini API key not configured');
    }

    const prompt = generateAnalysisPrompt(data, userTier, platform, analysisType);
    const maxTokens = getMaxTokensForTier(userTier);
    
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${getSystemPrompt(userTier, analysisType)}\n\n${prompt}\n\nRespond with valid JSON only.`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature: 0.7
                }
            })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
        throw new Error('Invalid Gemini response format');
    }

    const content = result.candidates[0].content.parts[0].text;
    return parseAnalysisResult(content, userTier);
}

// Helper functions
function getMaxTokensForTier(userTier: string): number {
    switch (userTier) {
        case 'free': return 500;
        case 'premium': return 1000;
        case 'pro': return 2000;
        default: return 500;
    }
}

function getSystemPrompt(userTier: string, analysisType?: string): string {
    const basePrompt = `You are an expert dating coach providing ethical, helpful advice. Always respond with valid JSON format.`;
    
    const tierInstructions = {
        free: 'Provide basic analysis with simple insights and 1 suggestion.',
        premium: 'Provide comprehensive analysis with detailed insights and 3 suggestions.',
        pro: 'Provide complete professional analysis with personality profiling and unlimited suggestions.'
    };
    
    return `${basePrompt} ${tierInstructions[userTier as keyof typeof tierInstructions]}`;
}

function generateAnalysisPrompt(
    data: any, 
    userTier: string, 
    platform?: string, 
    analysisType?: string
): string {
    const basePrompt = `
    Analyze this dating ${analysisType || 'data'} and provide coaching advice.
    Platform: ${platform || 'Unknown'}
    User Tier: ${userTier}
    
    Data: ${JSON.stringify(data)}
    
    Provide analysis in JSON format with the following structure:
    {
        "compatibility": "percentage or score",
        "insights": ["insight1", "insight2", ...],
        "suggestions": ["suggestion1", "suggestion2", ...],
        "redFlags": ["flag1", "flag2", ...],
        "conversationStarters": ["starter1", "starter2", ...],
        "confidence": 85,
        "analysisType": "basic|comprehensive|complete_reconstruction"
    }
    `;
    
    // Add tier-specific instructions
    switch (userTier) {
        case 'free':
            return basePrompt + `
            Provide basic analysis with:
            - Simple compatibility score (0-100)
            - 1-2 key insights
            - 1 conversation starter
            - 1 main red flag if any
            - analysisType: "basic"
            `;
        case 'premium':
            return basePrompt + `
            Provide comprehensive analysis with:
            - Detailed compatibility assessment (0-100)
            - 3-5 insights
            - 3 conversation starters
            - Complete red flag analysis
            - analysisType: "comprehensive"
            `;
        case 'pro':
            return basePrompt + `
            Provide complete professional analysis with:
            - Detailed compatibility with reasoning (0-100)
            - Comprehensive personality insights
            - 5+ personalized conversation starters
            - Complete risk assessment
            - analysisType: "complete_reconstruction"
            - Include personalityProfile and relationshipPotential objects
            `;
        default:
            return basePrompt;
    }
}

function parseAnalysisResult(content: string, userTier: string): AnalysisResult {
    try {
        // Clean the content to extract JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }
        
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Ensure required fields exist
        const result: AnalysisResult = {
            compatibility: parsed.compatibility || 'Unknown',
            insights: Array.isArray(parsed.insights) ? parsed.insights : [],
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
            redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
            conversationStarters: Array.isArray(parsed.conversationStarters) ? parsed.conversationStarters : [],
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 75,
            analysisType: parsed.analysisType || 'basic',
            timestamp: Date.now()
        };
        
        // Add advanced features for higher tiers
        if (userTier === 'pro' && parsed.personalityProfile) {
            result.personalityProfile = parsed.personalityProfile;
        }
        
        if (userTier === 'pro' && parsed.relationshipPotential) {
            result.relationshipPotential = parsed.relationshipPotential;
        }
        
        return result;
        
    } catch (error) {
        console.error('Failed to parse analysis result:', error);
        return getFallbackAnalysis(userTier, 'unknown');
    }
}

function getFallbackAnalysis(userTier: string, analysisType: string): AnalysisResult {
    const fallbackSuggestions = {
        free: ['Be authentic and genuine in your approach'],
        premium: [
            'Be authentic and genuine in your approach',
            'Ask open-ended questions to learn more about them',
            'Show interest in their hobbies and passions'
        ],
        pro: [
            'Be authentic and genuine in your approach',
            'Ask open-ended questions to learn more about them',
            'Show interest in their hobbies and passions',
            'Share something interesting about yourself',
            'Suggest a specific activity you could do together'
        ]
    };
    
    return {
        compatibility: 'Unable to analyze',
        insights: ['Analysis temporarily unavailable'],
        suggestions: fallbackSuggestions[userTier as keyof typeof fallbackSuggestions] || fallbackSuggestions.free,
        redFlags: [],
        conversationStarters: ['Hi! I noticed we have some things in common'],
        confidence: 50,
        analysisType: 'basic',
        timestamp: Date.now()
    };
}

// Implement other analysis functions
async function analyzePhoto(request: AnalysisRequest): Promise<AnalysisResult> {
    return await analyzeWithOpenAI(request.data, request.userTier, request.platform, 'photo');
}

async function analyzeConversation(request: AnalysisRequest): Promise<AnalysisResult> {
    return await analyzeWithOpenAI(request.data, request.userTier, request.platform, 'conversation');
}

async function analyzeVoice(request: AnalysisRequest): Promise<AnalysisResult> {
    if (request.userTier === 'free') {
        throw new Error('Voice analysis requires Premium or Pro tier');
    }
    return await analyzeWithOpenAI(request.data, request.userTier, request.platform, 'voice');
}

async function generateKeyboardSuggestion(request: AnalysisRequest): Promise<AnalysisResult> {
    return await analyzeWithOpenAI(request.data, request.userTier, request.platform, 'keyboard');
}

async function provideBrowserCoaching(request: AnalysisRequest): Promise<AnalysisResult> {
    return await analyzeWithOpenAI(request.data, request.userTier, request.platform, 'browser');
}

// Tier management functions
function applyTierLimitations(result: AnalysisResult, userTier: string): AnalysisResult {
    const tierLimitations = {
        free: {
            maxSuggestions: 1,
            maxInsights: 2,
            advancedFeatures: false
        },
        premium: {
            maxSuggestions: 3,
            maxInsights: 5,
            advancedFeatures: true
        },
        pro: {
            maxSuggestions: -1, // Unlimited
            maxInsights: -1,    // Unlimited
            advancedFeatures: true
        }
    };
    
    const limits = tierLimitations[userTier as keyof typeof tierLimitations];
    const limitedResult = { ...result };
    
    if (limits.maxSuggestions > 0 && limitedResult.suggestions) {
        limitedResult.suggestions = limitedResult.suggestions.slice(0, limits.maxSuggestions);
    }
    
    if (limits.maxInsights > 0 && limitedResult.insights) {
        limitedResult.insights = limitedResult.insights.slice(0, limits.maxInsights);
    }
    
    if (!limits.advancedFeatures) {
        delete limitedResult.personalityProfile;
        delete limitedResult.relationshipPotential;
    }
    
    return limitedResult;
}

function getTierLimitations(userTier: string): TierLimitations {
    const limitations = {
        free: {
            maxSuggestions: 1,
            maxInsights: 2,
            advancedFeatures: false,
            realTimeAnalysis: false,
            crossPlatformSync: false,
            voiceAnalysis: false,
            personalityProfiling: false,
            unlimitedScreenshots: false
        },
        premium: {
            maxSuggestions: 3,
            maxInsights: 5,
            advancedFeatures: true,
            realTimeAnalysis: true,
            crossPlatformSync: true,
            voiceAnalysis: true,
            personalityProfiling: false,
            unlimitedScreenshots: false
        },
        pro: {
            maxSuggestions: -1,
            maxInsights: -1,
            advancedFeatures: true,
            realTimeAnalysis: true,
            crossPlatformSync: true,
            voiceAnalysis: true,
            personalityProfiling: true,
            unlimitedScreenshots: true
        }
    };
    
    return limitations[userTier as keyof typeof limitations] || limitations.free;
}

async function checkTierLimits(
    supabase: any, 
    userId: string, 
    request: AnalysisRequest
): Promise<TierCheck> {
    try {
        // Get user's current usage for today
        const today = new Date().toISOString().split('T')[0];
        
        const { data: usage, error } = await supabase
            .from('user_usage')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = not found, which is OK
            console.error('Error checking usage:', error);
            throw error;
        }
        
        const currentUsage = usage || { 
            photo_analyses: 0, 
            conversation_analyses: 0, 
            voice_analyses: 0,
            screenshot_analyses: 0,
            keyboard_suggestions: 0,
            browser_coaching: 0
        };
        
        // Define tier limits
        const tierLimits = {
            free: {
                photo_analyses: 3,
                conversation_analyses: 3,
                voice_analyses: 0, // Not allowed
                screenshot_analyses: 3,
                keyboard_suggestions: 5,
                browser_coaching: 0 // Not allowed
            },
            premium: {
                photo_analyses: -1, // Unlimited
                conversation_analyses: -1,
                voice_analyses: 10,
                screenshot_analyses: -1,
                keyboard_suggestions: -1,
                browser_coaching: -1
            },
            pro: {
                photo_analyses: -1,
                conversation_analyses: -1,
                voice_analyses: -1,
                screenshot_analyses: -1,
                keyboard_suggestions: -1,
                browser_coaching: -1
            }
        };
        
        const userLimits = tierLimits[request.userTier as keyof typeof tierLimits];
        const usageKey = `${request.type}_analyses` as keyof typeof currentUsage;
        
        // Special handling for keyboard and browser
        const actualUsageKey = request.type === 'keyboard' ? 'keyboard_suggestions' : 
                              request.type === 'browser' ? 'browser_coaching' : 
                              usageKey;
        
        const currentCount = currentUsage[actualUsageKey as keyof typeof currentUsage] || 0;
        const limit = userLimits[actualUsageKey as keyof typeof userLimits];
        
        if (limit === 0) {
            return {
                allowed: false,
                upgradePrompt: `${request.type} analysis requires ${request.userTier === 'free' ? 'Premium' : 'Pro'} tier. Upgrade now!`
            };
        }
        
        if (limit !== -1 && currentCount >= limit) {
            return {
                allowed: false,
                upgradePrompt: `Daily limit reached (${limit}). Upgrade to ${request.userTier === 'free' ? 'Premium' : 'Pro'} for unlimited access!`,
                remainingUsage: 0
            };
        }
        
        return { 
            allowed: true,
            remainingUsage: limit === -1 ? -1 : limit - currentCount
        };
        
    } catch (error) {
        console.error('Error in checkTierLimits:', error);
        // Allow the request to proceed on error to avoid blocking users
        return { allowed: true };
    }
}

async function trackUsage(
    supabase: any, 
    userId: string, 
    request: AnalysisRequest
): Promise<void> {
    try {
        const today = new Date().toISOString().split('T')[0];
        const usageKey = request.type === 'keyboard' ? 'keyboard_suggestions' : 
                        request.type === 'browser' ? 'browser_coaching' : 
                        `${request.type}_analyses`;
        
        // Upsert usage record (increment by 1)
        const { error } = await supabase.rpc('increment_usage', {
            p_user_id: userId,
            p_date: today,
            p_usage_type: usageKey
        });
        
        if (error) {
            console.error('Error tracking usage:', error);
        }
        
    } catch (error) {
        console.error('Error in trackUsage:', error);
    }
}

async function trackAnalytics(
    supabase: any,
    userId: string,
    request: AnalysisRequest,
    result: AnalysisResult,
    processingTime: number
): Promise<void> {
    try {
        const { error } = await supabase
            .from('analytics_events')
            .insert({
                user_id: userId,
                event_type: 'analysis_performed',
                event_data: {
                    type: request.type,
                    tier: request.userTier,
                    platform: request.platform,
                    confidence: result.confidence,
                    processing_time: processingTime,
                    analysis_type: result.analysisType,
                    timestamp: request.timestamp
                },
                created_at: new Date().toISOString()
            });
        
        if (error) {
            console.error('Error tracking analytics:', error);
        }
        
    } catch (error) {
        console.error('Error in trackAnalytics:', error);
    }
}

async function syncToPlatforms(
    supabase: any,
    userId: string,
    result: AnalysisResult,
    platform?: string
): Promise<void> {
    try {
        // Store analysis result for cross-platform sync
        const { error } = await supabase
            .from('analysis_history')
            .insert({
                user_id: userId,
                analysis_data: result,
                platform: platform,
                created_at: new Date().toISOString(),
                synced: true
            });
        
        if (error) {
            console.error('Error syncing to platforms:', error);
        }
        
    } catch (error) {
        console.error('Error in syncToPlatforms:', error);
    }
}

