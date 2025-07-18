import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types for intelligent caching
interface CacheEntry {
    key: string;
    value: any;
    timestamp: number;
    ttl: number;
    hitCount: number;
    lastAccessed: number;
    semanticVector?: number[];
    metadata: CacheMetadata;
}

interface CacheMetadata {
    userId?: string;
    analysisType?: string;
    tier?: string;
    confidence?: number;
    tags?: string[];
    size: number;
}

interface CacheContext {
    userId?: string;
    analysisType?: string;
    tier?: string;
    similarity?: number;
    timestamp?: number;
}

interface CacheStats {
    totalEntries: number;
    hitRate: number;
    missRate: number;
    totalHits: number;
    totalMisses: number;
    memoryUsage: number;
    averageResponseTime: number;
}

interface SemanticSimilarityResult {
    entry: CacheEntry;
    similarity: number;
    confidence: number;
}

class IntelligentCacheManager {
    private memoryCache: Map<string, CacheEntry> = new Map();
    private semanticIndex: Map<string, number[]> = new Map();
    private supabase: any;
    private maxMemorySize: number = 100 * 1024 * 1024; // 100MB
    private currentMemoryUsage: number = 0;
    private stats: CacheStats;
    private openaiApiKey: string;

    constructor(supabase: any, openaiApiKey: string) {
        this.supabase = supabase;
        this.openaiApiKey = openaiApiKey;
        this.stats = {
            totalEntries: 0,
            hitRate: 0,
            missRate: 0,
            totalHits: 0,
            totalMisses: 0,
            memoryUsage: 0,
            averageResponseTime: 0
        };
        
        // Initialize cache cleanup interval
        this.initializeCacheCleanup();
    }

    async get(key: string, context?: CacheContext): Promise<any> {
        const startTime = Date.now();
        
        try {
            // Layer 1: Memory cache (fastest)
            let result = await this.getFromMemory(key);
            if (result) {
                this.updateStats(true, Date.now() - startTime);
                return result.value;
            }

            // Layer 2: Persistent cache (Supabase)
            result = await this.getFromPersistent(key);
            if (result) {
                // Store in memory for faster access
                await this.setInMemory(key, result.value, result.ttl, result.metadata);
                this.updateStats(true, Date.now() - startTime);
                return result.value;
            }

            // Layer 3: Semantic similarity search
            if (context) {
                const similarResult = await this.findSimilar(key, context);
                if (similarResult) {
                    this.updateStats(true, Date.now() - startTime);
                    return similarResult.entry.value;
                }
            }

            // Cache miss
            this.updateStats(false, Date.now() - startTime);
            return null;

        } catch (error) {
            console.error('Cache get error:', error);
            this.updateStats(false, Date.now() - startTime);
            return null;
        }
    }

    async set(
        key: string, 
        value: any, 
        ttl: number = 3600000, // 1 hour default
        metadata: Partial<CacheMetadata> = {}
    ): Promise<void> {
        try {
            const fullMetadata: CacheMetadata = {
                size: this.calculateSize(value),
                ...metadata
            };

            // Set in memory cache
            await this.setInMemory(key, value, ttl, fullMetadata);

            // Set in persistent cache
            await this.setInPersistent(key, value, ttl, fullMetadata);

            // Create semantic vector if applicable
            if (this.shouldCreateSemanticVector(key, value, fullMetadata)) {
                await this.createSemanticVector(key, value, fullMetadata);
            }

        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    async invalidate(pattern: string | RegExp, context?: CacheContext): Promise<number> {
        let invalidatedCount = 0;

        try {
            // Invalidate from memory
            for (const [key, entry] of this.memoryCache.entries()) {
                if (this.matchesPattern(key, pattern, entry, context)) {
                    this.memoryCache.delete(key);
                    this.currentMemoryUsage -= entry.metadata.size;
                    invalidatedCount++;
                }
            }

            // Invalidate from persistent cache
            const persistentCount = await this.invalidateFromPersistent(pattern, context);
            invalidatedCount += persistentCount;

            this.updateCacheStats();
            return invalidatedCount;

        } catch (error) {
            console.error('Cache invalidation error:', error);
            return 0;
        }
    }

    async findSimilar(
        key: string, 
        context: CacheContext, 
        threshold: number = 0.8
    ): Promise<SemanticSimilarityResult | null> {
        try {
            // Generate vector for the search key
            const searchVector = await this.generateVector(key);
            if (!searchVector) return null;

            let bestMatch: SemanticSimilarityResult | null = null;
            let highestSimilarity = 0;

            // Search in memory cache
            for (const [cacheKey, entry] of this.memoryCache.entries()) {
                if (entry.semanticVector) {
                    const similarity = this.calculateCosineSimilarity(searchVector, entry.semanticVector);
                    
                    if (similarity > threshold && similarity > highestSimilarity) {
                        // Check context compatibility
                        if (this.isContextCompatible(entry, context)) {
                            highestSimilarity = similarity;
                            bestMatch = {
                                entry,
                                similarity,
                                confidence: this.calculateConfidence(similarity, entry)
                            };
                        }
                    }
                }
            }

            // Search in persistent cache if no good match found
            if (!bestMatch || highestSimilarity < 0.9) {
                const persistentMatch = await this.searchPersistentSemantic(searchVector, context, threshold);
                if (persistentMatch && persistentMatch.similarity > highestSimilarity) {
                    bestMatch = persistentMatch;
                }
            }

            return bestMatch;

        } catch (error) {
            console.error('Semantic search error:', error);
            return null;
        }
    }

    async getStats(): Promise<CacheStats> {
        this.updateCacheStats();
        return { ...this.stats };
    }

    async clearCache(context?: CacheContext): Promise<void> {
        try {
            if (context) {
                // Selective clearing based on context
                await this.invalidate('.*', context);
            } else {
                // Clear all caches
                this.memoryCache.clear();
                this.semanticIndex.clear();
                this.currentMemoryUsage = 0;
                
                await this.supabase
                    .from('cache_entries')
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            }

            this.updateCacheStats();

        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }

    // Private methods
    private async getFromMemory(key: string): Promise<CacheEntry | null> {
        const entry = this.memoryCache.get(key);
        
        if (!entry) return null;
        
        // Check if expired
        if (Date.now() > entry.timestamp + entry.ttl) {
            this.memoryCache.delete(key);
            this.currentMemoryUsage -= entry.metadata.size;
            return null;
        }

        // Update access statistics
        entry.hitCount++;
        entry.lastAccessed = Date.now();
        
        return entry;
    }

    private async setInMemory(
        key: string, 
        value: any, 
        ttl: number, 
        metadata: CacheMetadata
    ): Promise<void> {
        // Check memory limits
        const entrySize = metadata.size;
        if (this.currentMemoryUsage + entrySize > this.maxMemorySize) {
            await this.evictLRU(entrySize);
        }

        const entry: CacheEntry = {
            key,
            value,
            timestamp: Date.now(),
            ttl,
            hitCount: 0,
            lastAccessed: Date.now(),
            metadata
        };

        this.memoryCache.set(key, entry);
        this.currentMemoryUsage += entrySize;
    }

    private async getFromPersistent(key: string): Promise<CacheEntry | null> {
        try {
            const { data, error } = await this.supabase
                .from('cache_entries')
                .select('*')
                .eq('cache_key', key)
                .single();

            if (error || !data) return null;

            // Check if expired
            const entry = this.deserializeCacheEntry(data);
            if (Date.now() > entry.timestamp + entry.ttl) {
                // Delete expired entry
                await this.supabase
                    .from('cache_entries')
                    .delete()
                    .eq('cache_key', key);
                return null;
            }

            return entry;

        } catch (error) {
            console.error('Persistent cache get error:', error);
            return null;
        }
    }

    private async setInPersistent(
        key: string, 
        value: any, 
        ttl: number, 
        metadata: CacheMetadata
    ): Promise<void> {
        try {
            const cacheData = {
                cache_key: key,
                cache_value: JSON.stringify(value),
                timestamp: new Date().toISOString(),
                ttl: ttl,
                metadata: JSON.stringify(metadata),
                expires_at: new Date(Date.now() + ttl).toISOString()
            };

            await this.supabase
                .from('cache_entries')
                .upsert(cacheData);

        } catch (error) {
            console.error('Persistent cache set error:', error);
        }
    }

    private async createSemanticVector(
        key: string, 
        value: any, 
        metadata: CacheMetadata
    ): Promise<void> {
        try {
            const textToVectorize = this.extractTextForVectorization(key, value, metadata);
            const vector = await this.generateVector(textToVectorize);
            
            if (vector) {
                this.semanticIndex.set(key, vector);
                
                // Update memory cache entry with vector
                const entry = this.memoryCache.get(key);
                if (entry) {
                    entry.semanticVector = vector;
                }

                // Update persistent cache with vector
                await this.supabase
                    .from('cache_entries')
                    .update({ semantic_vector: JSON.stringify(vector) })
                    .eq('cache_key', key);
            }

        } catch (error) {
            console.error('Semantic vector creation error:', error);
        }
    }

    private async generateVector(text: string): Promise<number[] | null> {
        try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'text-embedding-3-small',
                    input: text,
                    encoding_format: 'float'
                })
            });

            if (!response.ok) {
                throw new Error(`Embedding API error: ${response.status}`);
            }

            const result = await response.json();
            return result.data[0].embedding;

        } catch (error) {
            console.error('Vector generation error:', error);
            return null;
        }
    }

    private calculateCosineSimilarity(a: number[], b: number[]): number {
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }

    private calculateConfidence(similarity: number, entry: CacheEntry): number {
        let confidence = similarity;
        
        // Factor in cache entry age
        const age = Date.now() - entry.timestamp;
        const ageWeight = Math.max(0.5, 1 - (age / (24 * 60 * 60 * 1000))); // Reduce confidence over 24 hours
        
        // Factor in hit count
        const hitWeight = Math.min(1, entry.hitCount / 10); // Higher confidence with more hits
        
        return confidence * 0.7 + ageWeight * 0.2 + hitWeight * 0.1;
    }

    private isContextCompatible(entry: CacheEntry, context: CacheContext): boolean {
        const metadata = entry.metadata;
        
        // Check user compatibility
        if (context.userId && metadata.userId && context.userId !== metadata.userId) {
            return false;
        }

        // Check analysis type compatibility
        if (context.analysisType && metadata.analysisType) {
            if (context.analysisType !== metadata.analysisType) {
                return false;
            }
        }

        // Check tier compatibility
        if (context.tier && metadata.tier) {
            const tierHierarchy = { 'free': 0, 'premium': 1, 'pro': 2 };
            const contextTierLevel = tierHierarchy[context.tier as keyof typeof tierHierarchy];
            const entryTierLevel = tierHierarchy[metadata.tier as keyof typeof tierHierarchy];
            
            // Can use cache from same or higher tier
            if (contextTierLevel > entryTierLevel) {
                return false;
            }
        }

        return true;
    }

    private extractTextForVectorization(key: string, value: any, metadata: CacheMetadata): string {
        let text = key;
        
        if (typeof value === 'string') {
            text += ' ' + value;
        } else if (typeof value === 'object') {
            // Extract meaningful text from analysis results
            if (value.insights) {
                text += ' ' + value.insights.join(' ');
            }
            if (value.suggestions) {
                text += ' ' + value.suggestions.join(' ');
            }
            if (value.analysis) {
                text += ' ' + JSON.stringify(value.analysis);
            }
        }

        // Add metadata context
        if (metadata.analysisType) {
            text += ' ' + metadata.analysisType;
        }
        if (metadata.tags) {
            text += ' ' + metadata.tags.join(' ');
        }

        return text;
    }

    private shouldCreateSemanticVector(key: string, value: any, metadata: CacheMetadata): boolean {
        // Create vectors for analysis results and similar content
        return metadata.analysisType !== undefined || 
               (typeof value === 'object' && (value.insights || value.suggestions));
    }

    private async evictLRU(spaceNeeded: number): Promise<void> {
        // Sort entries by last accessed time
        const entries = Array.from(this.memoryCache.entries())
            .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

        let spaceFreed = 0;
        
        for (const [key, entry] of entries) {
            this.memoryCache.delete(key);
            this.currentMemoryUsage -= entry.metadata.size;
            spaceFreed += entry.metadata.size;
            
            if (spaceFreed >= spaceNeeded) {
                break;
            }
        }
    }

    private calculateSize(value: any): number {
        return new Blob([JSON.stringify(value)]).size;
    }

    private matchesPattern(
        key: string, 
        pattern: string | RegExp, 
        entry: CacheEntry, 
        context?: CacheContext
    ): boolean {
        let matches = false;
        
        if (typeof pattern === 'string') {
            matches = new RegExp(pattern).test(key);
        } else {
            matches = pattern.test(key);
        }

        // Additional context filtering
        if (matches && context) {
            matches = this.isContextCompatible(entry, context);
        }

        return matches;
    }

    private async invalidateFromPersistent(
        pattern: string | RegExp, 
        context?: CacheContext
    ): Promise<number> {
        // For simplicity, we'll implement basic pattern matching
        // In production, you might want more sophisticated SQL pattern matching
        try {
            let query = this.supabase.from('cache_entries');

            if (typeof pattern === 'string' && pattern !== '.*') {
                query = query.like('cache_key', `%${pattern}%`);
            }

            if (context?.userId) {
                query = query.eq('metadata->userId', context.userId);
            }

            if (context?.analysisType) {
                query = query.eq('metadata->analysisType', context.analysisType);
            }

            const { data, error } = await query.delete();
            
            return data ? data.length : 0;

        } catch (error) {
            console.error('Persistent cache invalidation error:', error);
            return 0;
        }
    }

    private async searchPersistentSemantic(
        searchVector: number[], 
        context: CacheContext, 
        threshold: number
    ): Promise<SemanticSimilarityResult | null> {
        // This would require a vector database or similarity search
        // For now, we'll implement a basic version
        try {
            const { data, error } = await this.supabase
                .from('cache_entries')
                .select('*')
                .not('semantic_vector', 'is', null)
                .limit(50); // Limit for performance

            if (error || !data) return null;

            let bestMatch: SemanticSimilarityResult | null = null;
            let highestSimilarity = 0;

            for (const row of data) {
                const entry = this.deserializeCacheEntry(row);
                if (entry.semanticVector) {
                    const similarity = this.calculateCosineSimilarity(searchVector, entry.semanticVector);
                    
                    if (similarity > threshold && similarity > highestSimilarity) {
                        if (this.isContextCompatible(entry, context)) {
                            highestSimilarity = similarity;
                            bestMatch = {
                                entry,
                                similarity,
                                confidence: this.calculateConfidence(similarity, entry)
                            };
                        }
                    }
                }
            }

            return bestMatch;

        } catch (error) {
            console.error('Persistent semantic search error:', error);
            return null;
        }
    }

    private deserializeCacheEntry(data: any): CacheEntry {
        return {
            key: data.cache_key,
            value: JSON.parse(data.cache_value),
            timestamp: new Date(data.timestamp).getTime(),
            ttl: data.ttl,
            hitCount: data.hit_count || 0,
            lastAccessed: new Date(data.last_accessed || data.timestamp).getTime(),
            semanticVector: data.semantic_vector ? JSON.parse(data.semantic_vector) : undefined,
            metadata: JSON.parse(data.metadata)
        };
    }

    private updateStats(isHit: boolean, responseTime: number): void {
        if (isHit) {
            this.stats.totalHits++;
        } else {
            this.stats.totalMisses++;
        }

        const total = this.stats.totalHits + this.stats.totalMisses;
        this.stats.hitRate = this.stats.totalHits / total;
        this.stats.missRate = this.stats.totalMisses / total;
        
        // Update average response time (exponential moving average)
        this.stats.averageResponseTime = this.stats.averageResponseTime * 0.9 + responseTime * 0.1;
    }

    private updateCacheStats(): void {
        this.stats.totalEntries = this.memoryCache.size;
        this.stats.memoryUsage = this.currentMemoryUsage;
    }

    private initializeCacheCleanup(): void {
        // Run cleanup every 5 minutes
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 5 * 60 * 1000);
    }

    private cleanupExpiredEntries(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];

        for (const [key, entry] of this.memoryCache.entries()) {
            if (now > entry.timestamp + entry.ttl) {
                expiredKeys.push(key);
            }
        }

        for (const key of expiredKeys) {
            const entry = this.memoryCache.get(key);
            if (entry) {
                this.memoryCache.delete(key);
                this.currentMemoryUsage -= entry.metadata.size;
            }
        }

        this.updateCacheStats();
    }
}

// Main function handler
serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

        if (!supabaseUrl || !serviceRoleKey || !openaiApiKey) {
            throw new Error('Missing environment configuration');
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const cacheManager = new IntelligentCacheManager(supabase, openaiApiKey);

        const url = new URL(req.url);
        const action = url.searchParams.get('action') || 'get';

        switch (action) {
            case 'get': {
                const requestData = await req.json();
                const { key, context } = requestData;
                
                const result = await cacheManager.get(key, context);
                
                return new Response(
                    JSON.stringify({
                        success: true,
                        data: result,
                        cached: result !== null
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            case 'set': {
                const requestData = await req.json();
                const { key, value, ttl, metadata } = requestData;
                
                await cacheManager.set(key, value, ttl, metadata);
                
                return new Response(
                    JSON.stringify({ success: true }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            case 'invalidate': {
                const requestData = await req.json();
                const { pattern, context } = requestData;
                
                const count = await cacheManager.invalidate(pattern, context);
                
                return new Response(
                    JSON.stringify({ 
                        success: true, 
                        invalidatedCount: count 
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            case 'stats': {
                const stats = await cacheManager.getStats();
                
                return new Response(
                    JSON.stringify({ 
                        success: true, 
                        stats 
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            case 'clear': {
                const requestData = await req.json();
                const { context } = requestData;
                
                await cacheManager.clearCache(context);
                
                return new Response(
                    JSON.stringify({ success: true }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Cache manager error:', error);
        
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