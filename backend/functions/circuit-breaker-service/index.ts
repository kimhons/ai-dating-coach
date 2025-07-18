import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types for circuit breaker
interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
    minimumRequestThreshold: number;
}

interface CircuitBreakerState {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    successCount: number;
    totalRequests: number;
    lastFailureTime: number;
    lastSuccessTime: number;
    isHealthy: boolean;
}

interface ServiceMetrics {
    totalRequests: number;
    successRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    errorRate: number;
    lastErrorTime: number;
    uptime: number;
}

interface RetryConfig {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffTime: number;
    retryableErrors: string[];
}

class CircuitBreakerManager {
    private circuitBreakers: Map<string, CircuitBreaker> = new Map();
    private supabase: any;
    private monitoringInterval: number;

    constructor(supabase: any) {
        this.supabase = supabase;
        this.monitoringInterval = setInterval(() => {
            this.performHealthChecks();
        }, 30000); // Check every 30 seconds
    }

    getCircuitBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
        if (!this.circuitBreakers.has(serviceName)) {
            const defaultConfig: CircuitBreakerConfig = {
                failureThreshold: 5,
                recoveryTimeout: 60000, // 1 minute
                monitoringPeriod: 300000, // 5 minutes
                minimumRequestThreshold: 10
            };

            const finalConfig = { ...defaultConfig, ...config };
            this.circuitBreakers.set(serviceName, new CircuitBreaker(serviceName, finalConfig, this.supabase));
        }

        return this.circuitBreakers.get(serviceName)!;
    }

    async getServiceMetrics(serviceName: string): Promise<ServiceMetrics> {
        const breaker = this.getCircuitBreaker(serviceName);
        return breaker.getMetrics();
    }

    async getAllServiceMetrics(): Promise<Map<string, ServiceMetrics>> {
        const metrics = new Map<string, ServiceMetrics>();
        
        for (const [serviceName, breaker] of this.circuitBreakers.entries()) {
            metrics.set(serviceName, await breaker.getMetrics());
        }

        return metrics;
    }

    private async performHealthChecks(): Promise<void> {
        for (const [serviceName, breaker] of this.circuitBreakers.entries()) {
            await breaker.performHealthCheck();
        }
    }

    destroy(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
    }
}

class CircuitBreaker {
    private serviceName: string;
    private config: CircuitBreakerConfig;
    private state: CircuitBreakerState;
    private supabase: any;
    private retryConfig: RetryConfig;

    constructor(serviceName: string, config: CircuitBreakerConfig, supabase: any) {
        this.serviceName = serviceName;
        this.config = config;
        this.supabase = supabase;
        
        this.state = {
            state: 'CLOSED',
            failureCount: 0,
            successCount: 0,
            totalRequests: 0,
            lastFailureTime: 0,
            lastSuccessTime: Date.now(),
            isHealthy: true
        };

        this.retryConfig = {
            maxRetries: 3,
            backoffMultiplier: 2,
            maxBackoffTime: 30000,
            retryableErrors: ['TIMEOUT', 'CONNECTION_ERROR', 'SERVICE_UNAVAILABLE']
        };
    }

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        // Check if circuit is open
        if (this.state.state === 'OPEN') {
            if (this.shouldAttemptReset()) {
                this.state.state = 'HALF_OPEN';
                console.log(`Circuit breaker for ${this.serviceName} moved to HALF_OPEN state`);
            } else {
                throw new Error(`Circuit breaker is OPEN for service: ${this.serviceName}`);
            }
        }

        this.state.totalRequests++;
        const startTime = Date.now();

        try {
            const result = await this.executeWithRetry(operation);
            await this.onSuccess(Date.now() - startTime);
            return result;

        } catch (error) {
            await this.onFailure(error, Date.now() - startTime);
            throw error;
        }
    }

    private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
        let lastError: any;
        let attempt = 0;

        while (attempt <= this.retryConfig.maxRetries) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                attempt++;

                if (attempt <= this.retryConfig.maxRetries && this.isRetryableError(error)) {
                    const backoffTime = Math.min(
                        1000 * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
                        this.retryConfig.maxBackoffTime
                    );

                    console.log(`Retrying ${this.serviceName} in ${backoffTime}ms (attempt ${attempt})`);
                    await this.delay(backoffTime);
                } else {
                    break;
                }
            }
        }

        throw lastError;
    }

    private isRetryableError(error: any): boolean {
        const errorMessage = error.message || error.toString();
        return this.retryConfig.retryableErrors.some(retryableError => 
            errorMessage.includes(retryableError)
        );
    }

    private async onSuccess(responseTime: number): Promise<void> {
        this.state.successCount++;
        this.state.lastSuccessTime = Date.now();
        this.state.isHealthy = true;

        if (this.state.state === 'HALF_OPEN') {
            this.state.state = 'CLOSED';
            this.state.failureCount = 0;
            console.log(`Circuit breaker for ${this.serviceName} moved to CLOSED state`);
        }

        // Log metrics
        await this.logMetrics('SUCCESS', responseTime);
    }

    private async onFailure(error: any, responseTime: number): Promise<void> {
        this.state.failureCount++;
        this.state.lastFailureTime = Date.now();
        this.state.isHealthy = false;

        if (this.state.state === 'HALF_OPEN') {
            this.state.state = 'OPEN';
            console.log(`Circuit breaker for ${this.serviceName} moved to OPEN state from HALF_OPEN`);
        } else if (this.state.state === 'CLOSED' && 
                   this.state.failureCount >= this.config.failureThreshold &&
                   this.state.totalRequests >= this.config.minimumRequestThreshold) {
            this.state.state = 'OPEN';
            console.log(`Circuit breaker for ${this.serviceName} moved to OPEN state due to failures`);
        }

        // Log metrics
        await this.logMetrics('FAILURE', responseTime, error.message);
    }

    private shouldAttemptReset(): boolean {
        return Date.now() - this.state.lastFailureTime >= this.config.recoveryTimeout;
    }

    async getMetrics(): Promise<ServiceMetrics> {
        const now = Date.now();
        const errorRate = this.state.totalRequests > 0 ? 
            (this.state.failureCount / this.state.totalRequests) * 100 : 0;

        // Get average response time from logged metrics
        const avgResponseTime = await this.getAverageResponseTime();

        return {
            totalRequests: this.state.totalRequests,
            successRequests: this.state.successCount,
            failedRequests: this.state.failureCount,
            averageResponseTime: avgResponseTime,
            errorRate,
            lastErrorTime: this.state.lastFailureTime,
            uptime: now - (this.state.lastFailureTime || now)
        };
    }

    async performHealthCheck(): Promise<void> {
        try {
            // Perform a lightweight health check based on service type
            await this.executeHealthCheckForService();
            
            if (!this.state.isHealthy && this.state.state === 'OPEN') {
                console.log(`Health check passed for ${this.serviceName}, preparing for recovery`);
            }

        } catch (error) {
            console.error(`Health check failed for ${this.serviceName}:`, error.message);
        }
    }

    private async executeHealthCheckForService(): Promise<void> {
        switch (this.serviceName) {
            case 'openai':
                await this.healthCheckOpenAI();
                break;
            case 'gemini':
                await this.healthCheckGemini();
                break;
            case 'supabase':
                await this.healthCheckSupabase();
                break;
            case 'stripe':
                await this.healthCheckStripe();
                break;
            default:
                // Generic health check
                await this.genericHealthCheck();
        }
    }

    private async healthCheckOpenAI(): Promise<void> {
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) throw new Error('OpenAI API key not configured');

        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (!response.ok) {
            throw new Error(`OpenAI health check failed: ${response.status}`);
        }
    }

    private async healthCheckGemini(): Promise<void> {
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        if (!geminiApiKey) throw new Error('Gemini API key not configured');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`,
            {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini health check failed: ${response.status}`);
        }
    }

    private async healthCheckSupabase(): Promise<void> {
        const { data, error } = await this.supabase
            .from('users')
            .select('count')
            .limit(1);

        if (error) {
            throw new Error(`Supabase health check failed: ${error.message}`);
        }
    }

    private async healthCheckStripe(): Promise<void> {
        // Stripe health check would require Stripe SDK
        // For now, we'll implement a basic check
        console.log('Stripe health check not implemented yet');
    }

    private async genericHealthCheck(): Promise<void> {
        // Generic health check - could ping a status endpoint
        console.log(`Generic health check for ${this.serviceName}`);
    }

    private async logMetrics(type: 'SUCCESS' | 'FAILURE', responseTime: number, errorMessage?: string): Promise<void> {
        try {
            await this.supabase
                .from('service_metrics')
                .insert({
                    service_name: this.serviceName,
                    event_type: type,
                    response_time: responseTime,
                    error_message: errorMessage,
                    circuit_state: this.state.state,
                    timestamp: new Date().toISOString()
                });
        } catch (error) {
            console.error('Failed to log metrics:', error);
        }
    }

    private async getAverageResponseTime(): Promise<number> {
        try {
            const { data, error } = await this.supabase
                .from('service_metrics')
                .select('response_time')
                .eq('service_name', this.serviceName)
                .gte('timestamp', new Date(Date.now() - this.config.monitoringPeriod).toISOString())
                .limit(100);

            if (error || !data || data.length === 0) return 0;

            const totalTime = data.reduce((sum, record) => sum + record.response_time, 0);
            return totalTime / data.length;

        } catch (error) {
            console.error('Failed to get average response time:', error);
            return 0;
        }
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getState(): CircuitBreakerState {
        return { ...this.state };
    }

    getConfig(): CircuitBreakerConfig {
        return { ...this.config };
    }

    // Manual circuit breaker controls
    async forceOpen(): Promise<void> {
        this.state.state = 'OPEN';
        this.state.lastFailureTime = Date.now();
        console.log(`Circuit breaker for ${this.serviceName} manually opened`);
    }

    async forceClose(): Promise<void> {
        this.state.state = 'CLOSED';
        this.state.failureCount = 0;
        this.state.lastSuccessTime = Date.now();
        console.log(`Circuit breaker for ${this.serviceName} manually closed`);
    }

    async reset(): Promise<void> {
        this.state = {
            state: 'CLOSED',
            failureCount: 0,
            successCount: 0,
            totalRequests: 0,
            lastFailureTime: 0,
            lastSuccessTime: Date.now(),
            isHealthy: true
        };
        console.log(`Circuit breaker for ${this.serviceName} reset`);
    }
}

// Global circuit breaker manager instance
let circuitBreakerManager: CircuitBreakerManager;

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

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing environment configuration');
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        // Initialize circuit breaker manager if not already initialized
        if (!circuitBreakerManager) {
            circuitBreakerManager = new CircuitBreakerManager(supabase);
        }

        const url = new URL(req.url);
        const action = url.searchParams.get('action') || 'execute';
        const serviceName = url.searchParams.get('service') || '';

        switch (action) {
            case 'execute': {
                if (!serviceName) {
                    throw new Error('Service name is required for execute action');
                }

                const requestData = await req.json();
                const { operation, config } = requestData;

                const circuitBreaker = circuitBreakerManager.getCircuitBreaker(serviceName, config);
                
                // Execute the operation through the circuit breaker
                const operationFunc = () => {
                    // This would be the actual service call
                    // For demo purposes, we'll simulate it
                    return this.simulateServiceCall(operation);
                };

                const result = await circuitBreaker.execute(operationFunc);

                return new Response(
                    JSON.stringify({
                        success: true,
                        result,
                        circuitState: circuitBreaker.getState()
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            case 'status': {
                if (!serviceName) {
                    const allMetrics = await circuitBreakerManager.getAllServiceMetrics();
                    const metricsObj = Object.fromEntries(allMetrics);
                    
                    return new Response(
                        JSON.stringify({
                            success: true,
                            services: metricsObj
                        }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    );
                } else {
                    const metrics = await circuitBreakerManager.getServiceMetrics(serviceName);
                    const circuitBreaker = circuitBreakerManager.getCircuitBreaker(serviceName);
                    
                    return new Response(
                        JSON.stringify({
                            success: true,
                            service: serviceName,
                            metrics,
                            state: circuitBreaker.getState(),
                            config: circuitBreaker.getConfig()
                        }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    );
                }
            }

            case 'control': {
                if (!serviceName) {
                    throw new Error('Service name is required for control action');
                }

                const requestData = await req.json();
                const { command } = requestData;

                const circuitBreaker = circuitBreakerManager.getCircuitBreaker(serviceName);

                switch (command) {
                    case 'open':
                        await circuitBreaker.forceOpen();
                        break;
                    case 'close':
                        await circuitBreaker.forceClose();
                        break;
                    case 'reset':
                        await circuitBreaker.reset();
                        break;
                    default:
                        throw new Error(`Unknown command: ${command}`);
                }

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: `Circuit breaker ${command} executed for ${serviceName}`,
                        state: circuitBreaker.getState()
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            case 'health': {
                if (!serviceName) {
                    throw new Error('Service name is required for health check');
                }

                const circuitBreaker = circuitBreakerManager.getCircuitBreaker(serviceName);
                await circuitBreaker.performHealthCheck();

                return new Response(
                    JSON.stringify({
                        success: true,
                        service: serviceName,
                        state: circuitBreaker.getState()
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Circuit breaker service error:', error);
        
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

// Helper function to simulate service calls (for demo)
async function simulateServiceCall(operation: any): Promise<any> {
    // This would be replaced with actual service calls
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
        throw new Error('Simulated service failure');
    }
    
    return { success: true, data: operation };
}