import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types
interface TierCheckRequest {
    userId: string;
    feature: string;
    platform?: string;
}

interface TierCheckResponse {
    allowed: boolean;
    currentTier: string;
    requiredTier?: string;
    remainingUsage?: number;
    upgradePrompt?: string;
    tierLimitations: TierLimitations;
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

interface UsageUpdate {
    userId: string;
    feature: string;
    increment?: number;
    metadata?: Record<string, any>;
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
        if (duration > 1000) { // 1 second threshold for tier checks
            console.warn(`Performance warning: Tier check took ${duration}ms`);
        }
        
        return duration;
    }
}

serve(async (req) => {
    const requestId = crypto.randomUUID();
    const performanceTimer = PerformanceMonitor.startTimer('tier_management_request');
    
    try {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Max-Age': '86400',
        };

        if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders });
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

        const url = new URL(req.url);
        const path = url.pathname;

        // Route handling
        if (req.method === 'POST' && path.endsWith('/check')) {
            return await handleTierCheck(req, supabase, user.user.id, corsHeaders, requestId);
        } else if (req.method === 'POST' && path.endsWith('/update-usage')) {
            return await handleUsageUpdate(req, supabase, user.user.id, corsHeaders, requestId);
        } else if (req.method === 'GET' && path.endsWith('/limits')) {
            return await handleGetLimits(supabase, user.user.id, corsHeaders, requestId);
        } else if (req.method === 'GET' && path.endsWith('/usage')) {
            return await handleGetUsage(supabase, user.user.id, corsHeaders, requestId);
        } else {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Endpoint not found',
                    requestId 
                }),
                { 
                    status: 404, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

    } catch (error) {
        const totalProcessingTime = PerformanceMonitor.endTimer(performanceTimer);
        
        console.error('Tier management error:', {
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

// Handle tier check requests
async function handleTierCheck(
    req: Request,
    supabase: any,
    userId: string,
    corsHeaders: Record<string, string>,
    requestId: string
): Promise<Response> {
    const checkTimer = PerformanceMonitor.startTimer('tier_check');
    
    try {
        const request: TierCheckRequest = await req.json();
        
        // Validate request
        if (!request.feature) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Feature parameter required',
                    requestId 
                }),
                { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

        // Get user profile and tier
        const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('tier, preferences')
            .eq('user_id', userId)
            .single();

        if (profileError || !userProfile) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'User profile not found',
                    requestId 
                }),
                { 
                    status: 404, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

        const currentTier = userProfile.tier;

        // Get tier limitations
        const { data: tierLimits, error: limitsError } = await supabase
            .from('tier_limits')
            .select('*')
            .eq('tier', currentTier)
            .single();

        if (limitsError || !tierLimits) {
            console.error('Error fetching tier limits:', limitsError);
            // Return default free tier limits as fallback
            const defaultLimits = getDefaultTierLimitations('free');
            return createTierCheckResponse(false, 'free', 'premium', 0, 
                'Unable to verify tier limits. Please try again.', defaultLimits, corsHeaders, requestId);
        }

        // Check feature availability for tier
        const featureCheck = checkFeatureAvailability(request.feature, currentTier, tierLimits);
        
        if (!featureCheck.allowed) {
            const tierLimitations = mapTierLimitsToInterface(tierLimits);
            return createTierCheckResponse(false, currentTier, featureCheck.requiredTier, 0,
                featureCheck.upgradePrompt, tierLimitations, corsHeaders, requestId);
        }

        // Check daily usage limits
        const usageCheck = await checkDailyUsage(supabase, userId, request.feature, tierLimits);
        
        if (!usageCheck.allowed) {
            const tierLimitations = mapTierLimitsToInterface(tierLimits);
            return createTierCheckResponse(false, currentTier, usageCheck.requiredTier, 
                usageCheck.remainingUsage, usageCheck.upgradePrompt, tierLimitations, corsHeaders, requestId);
        }

        // Feature is allowed
        const tierLimitations = mapTierLimitsToInterface(tierLimits);
        const processingTime = PerformanceMonitor.endTimer(checkTimer);
        
        return new Response(
            JSON.stringify({
                success: true,
                allowed: true,
                currentTier,
                remainingUsage: usageCheck.remainingUsage,
                tierLimitations,
                requestId,
                processingTime
            }),
            { 
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'X-Processing-Time': processingTime.toString(),
                    'X-Request-ID': requestId
                } 
            }
        );

    } catch (error) {
        const processingTime = PerformanceMonitor.endTimer(checkTimer);
        console.error('Tier check error:', error);
        
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Tier check failed',
                requestId,
                processingTime
            }),
            { 
                status: 500, 
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'X-Processing-Time': processingTime.toString(),
                    'X-Request-ID': requestId
                } 
            }
        );
    }
}

// Handle usage update requests
async function handleUsageUpdate(
    req: Request,
    supabase: any,
    userId: string,
    corsHeaders: Record<string, string>,
    requestId: string
): Promise<Response> {
    const updateTimer = PerformanceMonitor.startTimer('usage_update');
    
    try {
        const request: UsageUpdate = await req.json();
        
        // Validate request
        if (!request.feature) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Feature parameter required',
                    requestId 
                }),
                { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

        const increment = request.increment || 1;
        const today = new Date().toISOString().split('T')[0];
        
        // Map feature to database column
        const usageColumn = mapFeatureToUsageColumn(request.feature);
        if (!usageColumn) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'Invalid feature type',
                    requestId 
                }),
                { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

        // Update usage using the database function
        const { error: updateError } = await supabase.rpc('increment_usage', {
            p_user_id: userId,
            p_date: today,
            p_usage_type: usageColumn
        });

        if (updateError) {
            console.error('Usage update error:', updateError);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Failed to update usage',
                    requestId
                }),
                { 
                    status: 500, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

        // Track analytics if metadata provided
        if (request.metadata) {
            await trackUsageAnalytics(supabase, userId, request.feature, request.metadata);
        }

        const processingTime = PerformanceMonitor.endTimer(updateTimer);
        
        return new Response(
            JSON.stringify({
                success: true,
                message: 'Usage updated successfully',
                requestId,
                processingTime
            }),
            { 
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'X-Processing-Time': processingTime.toString(),
                    'X-Request-ID': requestId
                } 
            }
        );

    } catch (error) {
        const processingTime = PerformanceMonitor.endTimer(updateTimer);
        console.error('Usage update error:', error);
        
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Usage update failed',
                requestId,
                processingTime
            }),
            { 
                status: 500, 
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'X-Processing-Time': processingTime.toString(),
                    'X-Request-ID': requestId
                } 
            }
        );
    }
}

// Handle get limits requests
async function handleGetLimits(
    supabase: any,
    userId: string,
    corsHeaders: Record<string, string>,
    requestId: string
): Promise<Response> {
    const limitsTimer = PerformanceMonitor.startTimer('get_limits');
    
    try {
        // Get user tier
        const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('tier')
            .eq('user_id', userId)
            .single();

        if (profileError || !userProfile) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: 'User profile not found',
                    requestId 
                }),
                { 
                    status: 404, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

        // Get tier limits
        const { data: tierLimits, error: limitsError } = await supabase
            .from('tier_limits')
            .select('*')
            .eq('tier', userProfile.tier)
            .single();

        if (limitsError || !tierLimits) {
            console.error('Error fetching tier limits:', limitsError);
            const defaultLimits = getDefaultTierLimitations(userProfile.tier);
            
            const processingTime = PerformanceMonitor.endTimer(limitsTimer);
            return new Response(
                JSON.stringify({
                    success: true,
                    tier: userProfile.tier,
                    limits: defaultLimits,
                    requestId,
                    processingTime
                }),
                { 
                    headers: { 
                        ...corsHeaders, 
                        'Content-Type': 'application/json',
                        'X-Processing-Time': processingTime.toString(),
                        'X-Request-ID': requestId
                    } 
                }
            );
        }

        const tierLimitations = mapTierLimitsToInterface(tierLimits);
        const processingTime = PerformanceMonitor.endTimer(limitsTimer);
        
        return new Response(
            JSON.stringify({
                success: true,
                tier: userProfile.tier,
                limits: tierLimitations,
                dailyLimits: {
                    photoAnalyses: tierLimits.daily_photo_analyses,
                    conversationAnalyses: tierLimits.daily_conversation_analyses,
                    voiceAnalyses: tierLimits.daily_voice_analyses,
                    screenshotAnalyses: tierLimits.daily_screenshot_analyses,
                    keyboardSuggestions: tierLimits.daily_keyboard_suggestions,
                    browserCoaching: tierLimits.daily_browser_coaching
                },
                requestId,
                processingTime
            }),
            { 
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'X-Processing-Time': processingTime.toString(),
                    'X-Request-ID': requestId
                } 
            }
        );

    } catch (error) {
        const processingTime = PerformanceMonitor.endTimer(limitsTimer);
        console.error('Get limits error:', error);
        
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to get limits',
                requestId,
                processingTime
            }),
            { 
                status: 500, 
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'X-Processing-Time': processingTime.toString(),
                    'X-Request-ID': requestId
                } 
            }
        );
    }
}

// Handle get usage requests
async function handleGetUsage(
    supabase: any,
    userId: string,
    corsHeaders: Record<string, string>,
    requestId: string
): Promise<Response> {
    const usageTimer = PerformanceMonitor.startTimer('get_usage');
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get today's usage
        const { data: todayUsage, error: usageError } = await supabase
            .from('user_usage')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();

        // Get last 7 days usage for trends
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: weeklyUsage, error: weeklyError } = await supabase
            .from('user_usage')
            .select('*')
            .eq('user_id', userId)
            .gte('date', sevenDaysAgo.toISOString().split('T')[0])
            .order('date', { ascending: false });

        const currentUsage = todayUsage || {
            photo_analyses: 0,
            conversation_analyses: 0,
            voice_analyses: 0,
            screenshot_analyses: 0,
            keyboard_suggestions: 0,
            browser_coaching: 0,
            total_processing_time: 0,
            average_confidence: 0,
            success_count: 0,
            error_count: 0
        };

        const processingTime = PerformanceMonitor.endTimer(usageTimer);
        
        return new Response(
            JSON.stringify({
                success: true,
                today: currentUsage,
                weekly: weeklyUsage || [],
                requestId,
                processingTime
            }),
            { 
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'X-Processing-Time': processingTime.toString(),
                    'X-Request-ID': requestId
                } 
            }
        );

    } catch (error) {
        const processingTime = PerformanceMonitor.endTimer(usageTimer);
        console.error('Get usage error:', error);
        
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Failed to get usage',
                requestId,
                processingTime
            }),
            { 
                status: 500, 
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'X-Processing-Time': processingTime.toString(),
                    'X-Request-ID': requestId
                } 
            }
        );
    }
}

// Helper functions
function checkFeatureAvailability(feature: string, tier: string, tierLimits: any): {
    allowed: boolean;
    requiredTier?: string;
    upgradePrompt?: string;
} {
    const featureMap: Record<string, { column: string; requiredTier: string }> = {
        'voice_analysis': { column: 'voice_analysis', requiredTier: 'premium' },
        'personality_profiling': { column: 'personality_profiling', requiredTier: 'pro' },
        'unlimited_screenshots': { column: 'unlimited_screenshots', requiredTier: 'pro' },
        'real_time_analysis': { column: 'real_time_analysis', requiredTier: 'premium' },
        'cross_platform_sync': { column: 'cross_platform_sync', requiredTier: 'premium' },
        'advanced_features': { column: 'advanced_features', requiredTier: 'premium' },
        'browser_coaching': { column: 'daily_browser_coaching', requiredTier: 'premium' }
    };

    const featureConfig = featureMap[feature];
    if (!featureConfig) {
        // Feature not in restricted list, allow for all tiers
        return { allowed: true };
    }

    const isAllowed = tierLimits[featureConfig.column];
    
    if (!isAllowed) {
        const upgradePrompt = `${feature.replace('_', ' ')} requires ${featureConfig.requiredTier} tier. Upgrade now for unlimited access!`;
        return {
            allowed: false,
            requiredTier: featureConfig.requiredTier,
            upgradePrompt
        };
    }

    return { allowed: true };
}

async function checkDailyUsage(
    supabase: any,
    userId: string,
    feature: string,
    tierLimits: any
): Promise<{
    allowed: boolean;
    remainingUsage?: number;
    requiredTier?: string;
    upgradePrompt?: string;
}> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get current usage
    const { data: usage, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking daily usage:', error);
        return { allowed: true }; // Allow on error to avoid blocking users
    }

    const currentUsage = usage || {};
    const usageColumn = mapFeatureToUsageColumn(feature);
    const limitColumn = mapFeatureToLimitColumn(feature);
    
    if (!usageColumn || !limitColumn) {
        return { allowed: true }; // Unknown feature, allow
    }

    const currentCount = currentUsage[usageColumn] || 0;
    const limit = tierLimits[limitColumn];

    // -1 means unlimited
    if (limit === -1) {
        return { allowed: true, remainingUsage: -1 };
    }

    // 0 means not allowed for this tier
    if (limit === 0) {
        return {
            allowed: false,
            remainingUsage: 0,
            requiredTier: 'premium',
            upgradePrompt: `${feature.replace('_', ' ')} requires Premium tier. Upgrade now!`
        };
    }

    // Check if limit exceeded
    if (currentCount >= limit) {
        return {
            allowed: false,
            remainingUsage: 0,
            upgradePrompt: `Daily limit reached (${limit}). Upgrade for unlimited access!`
        };
    }

    return {
        allowed: true,
        remainingUsage: limit - currentCount
    };
}

function mapFeatureToUsageColumn(feature: string): string | null {
    const mapping: Record<string, string> = {
        'photo': 'photo_analyses',
        'conversation': 'conversation_analyses',
        'voice': 'voice_analyses',
        'screenshot': 'screenshot_analyses',
        'keyboard': 'keyboard_suggestions',
        'browser': 'browser_coaching'
    };
    
    return mapping[feature] || null;
}

function mapFeatureToLimitColumn(feature: string): string | null {
    const mapping: Record<string, string> = {
        'photo': 'daily_photo_analyses',
        'conversation': 'daily_conversation_analyses',
        'voice': 'daily_voice_analyses',
        'screenshot': 'daily_screenshot_analyses',
        'keyboard': 'daily_keyboard_suggestions',
        'browser': 'daily_browser_coaching'
    };
    
    return mapping[feature] || null;
}

function mapTierLimitsToInterface(tierLimits: any): TierLimitations {
    return {
        maxSuggestions: tierLimits.daily_keyboard_suggestions === -1 ? -1 : 
                       tierLimits.daily_keyboard_suggestions || 0,
        maxInsights: tierLimits.daily_screenshot_analyses === -1 ? -1 : 
                    tierLimits.daily_screenshot_analyses || 0,
        advancedFeatures: tierLimits.advanced_features || false,
        realTimeAnalysis: tierLimits.real_time_analysis || false,
        crossPlatformSync: tierLimits.cross_platform_sync || false,
        voiceAnalysis: tierLimits.voice_analysis || false,
        personalityProfiling: tierLimits.personality_profiling || false,
        unlimitedScreenshots: tierLimits.unlimited_screenshots || false
    };
}

function getDefaultTierLimitations(tier: string): TierLimitations {
    const defaults = {
        free: {
            maxSuggestions: 5,
            maxInsights: 3,
            advancedFeatures: false,
            realTimeAnalysis: false,
            crossPlatformSync: false,
            voiceAnalysis: false,
            personalityProfiling: false,
            unlimitedScreenshots: false
        },
        premium: {
            maxSuggestions: -1,
            maxInsights: -1,
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
    
    return defaults[tier as keyof typeof defaults] || defaults.free;
}

function createTierCheckResponse(
    allowed: boolean,
    currentTier: string,
    requiredTier: string | undefined,
    remainingUsage: number,
    upgradePrompt: string,
    tierLimitations: TierLimitations,
    corsHeaders: Record<string, string>,
    requestId: string
): Response {
    return new Response(
        JSON.stringify({
            success: true,
            allowed,
            currentTier,
            requiredTier,
            remainingUsage,
            upgradePrompt,
            tierLimitations,
            requestId
        }),
        { 
            headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'X-Request-ID': requestId
            } 
        }
    );
}

async function trackUsageAnalytics(
    supabase: any,
    userId: string,
    feature: string,
    metadata: Record<string, any>
): Promise<void> {
    try {
        await supabase
            .from('analytics_events')
            .insert({
                user_id: userId,
                event_type: 'feature_usage',
                event_category: 'user',
                event_data: {
                    feature,
                    ...metadata,
                    timestamp: Date.now()
                },
                created_at: new Date().toISOString()
            });
    } catch (error) {
        console.error('Error tracking usage analytics:', error);
        // Don't throw - analytics failure shouldn't block the main operation
    }
}

