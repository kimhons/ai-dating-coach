/**
 * AI Dating Coach - Prompt Injection Defense System
 * Comprehensive security measures to prevent prompt injection attacks
 * and ensure safe AI interactions
 */

import { createHash } from 'crypto'

export interface SecurityConfig {
  maxInputLength: number
  allowedLanguages: string[]
  blockedPatterns: RegExp[]
  suspiciousPatterns: RegExp[]
  rateLimitWindow: number
  maxRequestsPerWindow: number
  enableContentFiltering: boolean
  enableToxicityDetection: boolean
}

export interface SecurityResult {
  isSecure: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  violations: SecurityViolation[]
  sanitizedInput: string
  metadata: SecurityMetadata
}

export interface SecurityViolation {
  type: 'prompt_injection' | 'content_policy' | 'rate_limit' | 'input_validation' | 'toxicity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  pattern?: string
  confidence: number
}

export interface SecurityMetadata {
  inputHash: string
  timestamp: number
  userAgent?: string
  ipAddress?: string
  userId?: string
  sessionId?: string
}

export class PromptInjectionDefense {
  private config: SecurityConfig
  private requestCounts: Map<string, { count: number; windowStart: number }> = new Map()
  
  // Known prompt injection patterns
  private readonly INJECTION_PATTERNS = [
    // Direct instruction attempts
    /ignore\s+(previous|all|above|prior)\s+(instructions?|prompts?|commands?)/gi,
    /forget\s+(everything|all|previous|above)/gi,
    /disregard\s+(previous|all|above|prior)\s+(instructions?|prompts?|commands?)/gi,
    
    // Role manipulation
    /you\s+are\s+(now|a|an)\s+(assistant|ai|bot|system|admin|developer)/gi,
    /act\s+as\s+(if\s+you\s+are\s+)?(a|an)\s+(assistant|ai|bot|system|admin|developer)/gi,
    /pretend\s+(to\s+be\s+)?(a|an)\s+(assistant|ai|bot|system|admin|developer)/gi,
    
    // System prompt extraction
    /show\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions?|rules)/gi,
    /what\s+(are\s+)?(your|the)\s+(system\s+)?(prompt|instructions?|rules)/gi,
    /reveal\s+(your|the)\s+(system\s+)?(prompt|instructions?|rules)/gi,
    
    // Jailbreak attempts
    /\[SYSTEM\]/gi,
    /\[ADMIN\]/gi,
    /\[DEVELOPER\]/gi,
    /\[OVERRIDE\]/gi,
    /\[JAILBREAK\]/gi,
    
    // Code injection attempts
    /<script[^>]*>/gi,
    /<iframe[^>]*>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    
    // SQL injection patterns
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
    /insert\s+into/gi,
    
    // Command injection
    /\$\([^)]+\)/g,
    /`[^`]+`/g,
    /\|\s*[a-zA-Z]/g,
    /&&\s*[a-zA-Z]/g,
    
    // Prompt boundary manipulation
    /---+/g,
    /===+/g,
    /\*\*\*+/g,
    /####+/g,
    
    // Context switching attempts
    /new\s+conversation/gi,
    /start\s+over/gi,
    /reset\s+context/gi,
    /clear\s+history/gi,
    
    // Instruction override
    /override\s+(previous|all|above|prior)/gi,
    /replace\s+(previous|all|above|prior)\s+(instructions?|prompts?|commands?)/gi,
    /update\s+(your|the)\s+(instructions?|prompts?|commands?)/gi
  ]
  
  // Suspicious patterns that warrant closer inspection
  private readonly SUSPICIOUS_PATTERNS = [
    /system\s*:/gi,
    /human\s*:/gi,
    /assistant\s*:/gi,
    /ai\s*:/gi,
    /\[.*\]/g,
    /\{.*\}/g,
    /prompt/gi,
    /instruction/gi,
    /command/gi,
    /execute/gi,
    /run/gi,
    /eval/gi
  ]
  
  // Toxic content patterns
  private readonly TOXICITY_PATTERNS = [
    // Hate speech
    /\b(hate|kill|murder|die|death)\s+(all\s+)?(women|men|people|users)/gi,
    
    // Sexual harassment
    /\b(send|show|give)\s+(me\s+)?(nudes?|naked|sex)/gi,
    
    // Threats
    /\b(i\s+will\s+)?(kill|murder|hurt|harm|destroy)\s+(you|them|everyone)/gi,
    
    // Discrimination
    /\b(all\s+)?(women|men|people)\s+are\s+(stupid|worthless|inferior)/gi
  ]
  
  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      maxInputLength: 2000,
      allowedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt'],
      blockedPatterns: this.INJECTION_PATTERNS,
      suspiciousPatterns: this.SUSPICIOUS_PATTERNS,
      rateLimitWindow: 60000, // 1 minute
      maxRequestsPerWindow: 30,
      enableContentFiltering: true,
      enableToxicityDetection: true,
      ...config
    }
  }
  
  /**
   * Main security validation method
   */
  public async validateInput(
    input: string,
    metadata: Partial<SecurityMetadata> = {}
  ): Promise<SecurityResult> {
    const violations: SecurityViolation[] = []
    const fullMetadata: SecurityMetadata = {
      inputHash: this.hashInput(input),
      timestamp: Date.now(),
      ...metadata
    }
    
    // 1. Input length validation
    if (input.length > this.config.maxInputLength) {
      violations.push({
        type: 'input_validation',
        severity: 'medium',
        description: `Input exceeds maximum length of ${this.config.maxInputLength} characters`,
        confidence: 1.0
      })
    }
    
    // 2. Rate limiting
    if (metadata.userId || metadata.ipAddress) {
      const rateLimitViolation = this.checkRateLimit(metadata.userId || metadata.ipAddress!)
      if (rateLimitViolation) {
        violations.push(rateLimitViolation)
      }
    }
    
    // 3. Prompt injection detection
    const injectionViolations = this.detectPromptInjection(input)
    violations.push(...injectionViolations)
    
    // 4. Content policy validation
    if (this.config.enableContentFiltering) {
      const contentViolations = this.validateContentPolicy(input)
      violations.push(...contentViolations)
    }
    
    // 5. Toxicity detection
    if (this.config.enableToxicityDetection) {
      const toxicityViolations = this.detectToxicity(input)
      violations.push(...toxicityViolations)
    }
    
    // 6. Sanitize input
    const sanitizedInput = this.sanitizeInput(input)
    
    // 7. Calculate risk level
    const riskLevel = this.calculateRiskLevel(violations)
    
    // 8. Determine if input is secure
    const isSecure = riskLevel !== 'critical' && !violations.some(v => v.severity === 'critical')
    
    return {
      isSecure,
      riskLevel,
      violations,
      sanitizedInput,
      metadata: fullMetadata
    }
  }
  
  /**
   * Detect prompt injection attempts
   */
  private detectPromptInjection(input: string): SecurityViolation[] {
    const violations: SecurityViolation[] = []
    
    // Check against known injection patterns
    for (const pattern of this.config.blockedPatterns) {
      const matches = input.match(pattern)
      if (matches) {
        violations.push({
          type: 'prompt_injection',
          severity: 'high',
          description: 'Potential prompt injection detected',
          pattern: pattern.source,
          confidence: 0.9
        })
      }
    }
    
    // Check suspicious patterns
    let suspiciousCount = 0
    for (const pattern of this.config.suspiciousPatterns) {
      const matches = input.match(pattern)
      if (matches) {
        suspiciousCount += matches.length
      }
    }
    
    // If too many suspicious patterns, flag as potential injection
    if (suspiciousCount >= 3) {
      violations.push({
        type: 'prompt_injection',
        severity: 'medium',
        description: 'Multiple suspicious patterns detected',
        confidence: 0.7
      })
    }
    
    // Advanced heuristics
    const advancedViolations = this.advancedInjectionDetection(input)
    violations.push(...advancedViolations)
    
    return violations
  }
  
  /**
   * Advanced prompt injection detection using heuristics
   */
  private advancedInjectionDetection(input: string): SecurityViolation[] {
    const violations: SecurityViolation[] = []
    
    // Check for unusual formatting that might indicate injection
    const lines = input.split('\\n')
    let formatViolations = 0
    
    for (const line of lines) {
      // Lines that look like system prompts
      if (line.trim().startsWith('System:') || line.trim().startsWith('AI:')) {
        formatViolations++
      }
      
      // Lines with excessive special characters
      if ((line.match(/[^a-zA-Z0-9\s]/g) || []).length > line.length * 0.3) {
        formatViolations++
      }
      
      // Very short lines with commands
      if (line.trim().length < 10 && /^(run|exec|eval|system|admin)/.test(line.trim().toLowerCase())) {
        formatViolations++
      }
    }
    
    if (formatViolations >= 2) {
      violations.push({
        type: 'prompt_injection',
        severity: 'medium',
        description: 'Suspicious formatting patterns detected',
        confidence: 0.6
      })
    }
    
    // Check for encoding attempts
    if (this.detectEncodingAttempts(input)) {
      violations.push({
        type: 'prompt_injection',
        severity: 'high',
        description: 'Potential encoding-based injection detected',
        confidence: 0.8
      })
    }
    
    return violations
  }
  
  /**
   * Detect encoding-based injection attempts
   */
  private detectEncodingAttempts(input: string): boolean {
    // Base64 patterns
    const base64Pattern = /[A-Za-z0-9+/]{20,}={0,2}/g
    const base64Matches = input.match(base64Pattern)
    
    if (base64Matches && base64Matches.length > 0) {
      // Try to decode and check for suspicious content
      for (const match of base64Matches) {
        try {
          const decoded = Buffer.from(match, 'base64').toString('utf-8')
          if (this.INJECTION_PATTERNS.some(pattern => pattern.test(decoded))) {
            return true
          }
        } catch {
          // Invalid base64, continue
        }
      }
    }
    
    // URL encoding patterns
    const urlEncodedPattern = /%[0-9A-Fa-f]{2}/g
    const urlMatches = input.match(urlEncodedPattern)
    
    if (urlMatches && urlMatches.length > 5) {
      try {
        const decoded = decodeURIComponent(input)
        if (this.INJECTION_PATTERNS.some(pattern => pattern.test(decoded))) {
          return true
        }
      } catch {
        // Invalid URL encoding, continue
      }
    }
    
    // Unicode escape patterns
    const unicodePattern = /\\\\u[0-9A-Fa-f]{4}/g
    const unicodeMatches = input.match(unicodePattern)
    
    if (unicodeMatches && unicodeMatches.length > 3) {
      return true
    }
    
    return false
  }
  
  /**
   * Validate content against policy
   */
  private validateContentPolicy(input: string): SecurityViolation[] {
    const violations: SecurityViolation[] = []
    
    // Check for inappropriate content requests
    const inappropriatePatterns = [
      /generate\s+(fake|false|misleading)\s+(information|news|data)/gi,
      /create\s+(fake|false|misleading)\s+(profile|identity|person)/gi,
      /help\s+(me\s+)?(lie|deceive|cheat|scam)/gi,
      /write\s+(a\s+)?(fake|false|misleading)\s+(review|testimonial)/gi
    ]
    
    for (const pattern of inappropriatePatterns) {
      if (pattern.test(input)) {
        violations.push({
          type: 'content_policy',
          severity: 'high',
          description: 'Request violates content policy',
          pattern: pattern.source,
          confidence: 0.9
        })
      }
    }
    
    return violations
  }
  
  /**
   * Detect toxic content
   */
  private detectToxicity(input: string): SecurityViolation[] {
    const violations: SecurityViolation[] = []
    
    for (const pattern of this.TOXICITY_PATTERNS) {
      if (pattern.test(input)) {
        violations.push({
          type: 'toxicity',
          severity: 'critical',
          description: 'Toxic content detected',
          pattern: pattern.source,
          confidence: 0.95
        })
      }
    }
    
    return violations
  }
  
  /**
   * Rate limiting check
   */
  private checkRateLimit(identifier: string): SecurityViolation | null {
    const now = Date.now()
    const windowStart = now - this.config.rateLimitWindow
    
    const current = this.requestCounts.get(identifier)
    
    if (!current || current.windowStart < windowStart) {
      // New window
      this.requestCounts.set(identifier, { count: 1, windowStart: now })
      return null
    }
    
    current.count++
    
    if (current.count > this.config.maxRequestsPerWindow) {
      return {
        type: 'rate_limit',
        severity: 'medium',
        description: `Rate limit exceeded: ${current.count}/${this.config.maxRequestsPerWindow} requests`,
        confidence: 1.0
      }
    }
    
    return null
  }
  
  /**
   * Sanitize input by removing potentially dangerous content
   */
  private sanitizeInput(input: string): string {
    let sanitized = input
    
    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '')
    
    // Remove script content
    sanitized = sanitized.replace(/javascript:[^\\s]*/gi, '')
    
    // Remove data URLs
    sanitized = sanitized.replace(/data:[^\\s]*/gi, '')
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\\s+/g, ' ').trim()
    
    // Remove excessive special characters
    sanitized = sanitized.replace(/[^a-zA-Z0-9\\s.,!?;:'"()\\-]/g, '')
    
    return sanitized
  }
  
  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(violations: SecurityViolation[]): 'low' | 'medium' | 'high' | 'critical' {
    if (violations.some(v => v.severity === 'critical')) {
      return 'critical'
    }
    
    const highCount = violations.filter(v => v.severity === 'high').length
    const mediumCount = violations.filter(v => v.severity === 'medium').length
    
    if (highCount >= 2 || (highCount >= 1 && mediumCount >= 2)) {
      return 'high'
    }
    
    if (highCount >= 1 || mediumCount >= 3) {
      return 'medium'
    }
    
    return 'low'
  }
  
  /**
   * Generate hash of input for tracking
   */
  private hashInput(input: string): string {
    return createHash('sha256').update(input).digest('hex')
  }
  
  /**
   * Clean up old rate limit entries
   */
  public cleanupRateLimits(): void {
    const now = Date.now()
    const cutoff = now - this.config.rateLimitWindow
    
    for (const [key, value] of this.requestCounts.entries()) {
      if (value.windowStart < cutoff) {
        this.requestCounts.delete(key)
      }
    }
  }
  
  /**
   * Get security statistics
   */
  public getSecurityStats(): {
    activeRateLimits: number
    totalPatterns: number
    configuredMaxLength: number
  } {
    return {
      activeRateLimits: this.requestCounts.size,
      totalPatterns: this.config.blockedPatterns.length + this.config.suspiciousPatterns.length,
      configuredMaxLength: this.config.maxInputLength
    }
  }
}

/**
 * Middleware for Express/Supabase Edge Functions
 */
export class SecurityMiddleware {
  private defense: PromptInjectionDefense
  
  constructor(config?: Partial<SecurityConfig>) {
    this.defense = new PromptInjectionDefense(config)
  }
  
  /**
   * Validate request before processing
   */
  public async validateRequest(
    input: string,
    metadata: Partial<SecurityMetadata> = {}
  ): Promise<{ allowed: boolean; result: SecurityResult }> {
    const result = await this.defense.validateInput(input, metadata)
    
    // Log security events
    if (!result.isSecure) {
      console.warn('Security violation detected:', {
        hash: result.metadata.inputHash,
        riskLevel: result.riskLevel,
        violations: result.violations.map(v => ({
          type: v.type,
          severity: v.severity,
          description: v.description
        }))
      })
    }
    
    return {
      allowed: result.isSecure,
      result
    }
  }
  
  /**
   * Get sanitized input for processing
   */
  public getSanitizedInput(result: SecurityResult): string {
    return result.sanitizedInput
  }
}

// Export default instance
export const defaultSecurityMiddleware = new SecurityMiddleware()
export const defaultPromptDefense = new PromptInjectionDefense()

