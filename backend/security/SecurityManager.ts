/**
 * AI Dating Coach - Comprehensive Security Manager
 * Handles authentication, authorization, data protection, and security monitoring
 */

import { createHash, randomBytes, pbkdf2Sync } from 'crypto'
import { PromptInjectionDefense, SecurityResult } from './PromptInjectionDefense'

export interface SecurityManagerConfig {
  jwtSecret: string
  encryptionKey: string
  sessionTimeout: number
  maxLoginAttempts: number
  lockoutDuration: number
  passwordMinLength: number
  requireMFA: boolean
  enableAuditLogging: boolean
  dataRetentionDays: number
}

export interface UserSession {
  userId: string
  sessionId: string
  email: string
  role: UserRole
  subscriptionTier: SubscriptionTier
  createdAt: number
  lastActivity: number
  ipAddress: string
  userAgent: string
  mfaVerified: boolean
}

export interface SecurityAuditLog {
  id: string
  timestamp: number
  userId?: string
  sessionId?: string
  action: SecurityAction
  resource: string
  result: 'success' | 'failure' | 'blocked'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  metadata: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export enum UserRole {
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum SubscriptionTier {
  SPARK = 'spark',
  FLAME = 'flame',
  BLAZE = 'blaze'
}

export enum SecurityAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PROFILE_UPDATE = 'profile_update',
  PHOTO_ANALYSIS = 'photo_analysis',
  CONVERSATION_ANALYSIS = 'conversation_analysis',
  AI_KEYBOARD_USE = 'ai_keyboard_use',
  SUBSCRIPTION_CHANGE = 'subscription_change',
  DATA_EXPORT = 'data_export',
  DATA_DELETE = 'data_delete',
  ADMIN_ACTION = 'admin_action',
  SECURITY_VIOLATION = 'security_violation'
}

export interface PermissionMatrix {
  [UserRole.USER]: string[]
  [UserRole.PREMIUM]: string[]
  [UserRole.ADMIN]: string[]
  [UserRole.SUPER_ADMIN]: string[]
}

export class SecurityManager {
  private config: SecurityManagerConfig
  private promptDefense: PromptInjectionDefense
  private activeSessions: Map<string, UserSession> = new Map()
  private loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map()
  private auditLogs: SecurityAuditLog[] = []
  
  // Permission matrix defining what each role can do
  private readonly PERMISSIONS: PermissionMatrix = {
    [UserRole.USER]: [
      'photo:analyze',
      'conversation:analyze',
      'profile:read',
      'profile:update',
      'usage:read'
    ],
    [UserRole.PREMIUM]: [
      'photo:analyze',
      'conversation:analyze',
      'voice:analyze',
      'keyboard:use',
      'profile:read',
      'profile:update',
      'usage:read',
      'data:export'
    ],
    [UserRole.ADMIN]: [
      'photo:analyze',
      'conversation:analyze',
      'voice:analyze',
      'keyboard:use',
      'profile:read',
      'profile:update',
      'usage:read',
      'data:export',
      'users:read',
      'users:update',
      'analytics:read',
      'system:monitor'
    ],
    [UserRole.SUPER_ADMIN]: [
      '*' // All permissions
    ]
  }
  
  // Subscription tier limits
  private readonly TIER_LIMITS = {
    [SubscriptionTier.SPARK]: {
      photoAnalysisPerMonth: 5,
      conversationAnalysisPerMonth: 5,
      aiKeyboardEnabled: false,
      voiceAnalysisEnabled: false,
      prioritySupport: false
    },
    [SubscriptionTier.FLAME]: {
      photoAnalysisPerMonth: 50,
      conversationAnalysisPerMonth: 50,
      aiKeyboardEnabled: true,
      voiceAnalysisEnabled: false,
      prioritySupport: false
    },
    [SubscriptionTier.BLAZE]: {
      photoAnalysisPerMonth: -1, // Unlimited
      conversationAnalysisPerMonth: -1, // Unlimited
      aiKeyboardEnabled: true,
      voiceAnalysisEnabled: true,
      prioritySupport: true
    }
  }
  
  constructor(config: SecurityManagerConfig) {
    this.config = config
    this.promptDefense = new PromptInjectionDefense({
      maxInputLength: 2000,
      rateLimitWindow: 60000,
      maxRequestsPerWindow: 30,
      enableContentFiltering: true,
      enableToxicityDetection: true
    })
    
    // Start cleanup intervals
    this.startCleanupIntervals()
  }
  
  /**
   * Authenticate user and create session
   */
  public async authenticateUser(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean; session?: UserSession; error?: string }> {
    try {
      // Check for account lockout
      const lockoutCheck = this.checkAccountLockout(email)
      if (!lockoutCheck.allowed) {
        await this.logSecurityEvent({
          action: SecurityAction.LOGIN,
          resource: `user:${email}`,
          result: 'blocked',
          riskLevel: 'medium',
          metadata: { reason: 'account_locked', remainingTime: lockoutCheck.remainingTime },
          ipAddress,
          userAgent
        })
        
        return {
          success: false,
          error: `Account locked. Try again in ${Math.ceil(lockoutCheck.remainingTime! / 60000)} minutes.`
        }
      }
      
      // Validate credentials (this would typically query your database)
      const user = await this.validateCredentials(email, password)
      if (!user) {
        this.recordFailedLogin(email)
        
        await this.logSecurityEvent({
          action: SecurityAction.LOGIN,
          resource: `user:${email}`,
          result: 'failure',
          riskLevel: 'medium',
          metadata: { reason: 'invalid_credentials' },
          ipAddress,
          userAgent
        })
        
        return { success: false, error: 'Invalid credentials' }
      }
      
      // Clear failed login attempts
      this.loginAttempts.delete(email)
      
      // Create session
      const session = this.createSession(user, ipAddress, userAgent)
      
      await this.logSecurityEvent({
        userId: user.id,
        sessionId: session.sessionId,
        action: SecurityAction.LOGIN,
        resource: `user:${email}`,
        result: 'success',
        riskLevel: 'low',
        metadata: { role: user.role, tier: user.subscriptionTier },
        ipAddress,
        userAgent
      })
      
      return { success: true, session }
      
    } catch (error) {
      await this.logSecurityEvent({
        action: SecurityAction.LOGIN,
        resource: `user:${email}`,
        result: 'failure',
        riskLevel: 'high',
        metadata: { error: error.message },
        ipAddress,
        userAgent
      })
      
      return { success: false, error: 'Authentication failed' }
    }
  }
  
  /**
   * Validate session and check permissions
   */
  public async validateSession(
    sessionId: string,
    requiredPermission?: string
  ): Promise<{ valid: boolean; session?: UserSession; error?: string }> {
    const session = this.activeSessions.get(sessionId)
    
    if (!session) {
      return { valid: false, error: 'Invalid session' }
    }
    
    // Check session timeout
    const now = Date.now()
    if (now - session.lastActivity > this.config.sessionTimeout) {
      this.activeSessions.delete(sessionId)
      return { valid: false, error: 'Session expired' }
    }
    
    // Update last activity
    session.lastActivity = now
    
    // Check permission if required
    if (requiredPermission && !this.hasPermission(session.role, requiredPermission)) {
      await this.logSecurityEvent({
        userId: session.userId,
        sessionId: session.sessionId,
        action: SecurityAction.SECURITY_VIOLATION,
        resource: requiredPermission,
        result: 'blocked',
        riskLevel: 'medium',
        metadata: { reason: 'insufficient_permissions', role: session.role },
        ipAddress: session.ipAddress,
        userAgent: session.userAgent
      })
      
      return { valid: false, error: 'Insufficient permissions' }
    }
    
    return { valid: true, session }
  }
  
  /**
   * Validate AI input with security checks
   */
  public async validateAIInput(
    input: string,
    session: UserSession,
    analysisType: 'photo' | 'conversation' | 'voice'
  ): Promise<{ allowed: boolean; sanitizedInput?: string; error?: string }> {
    try {
      // Check subscription limits
      const limitCheck = await this.checkUsageLimits(session.userId, session.subscriptionTier, analysisType)
      if (!limitCheck.allowed) {
        await this.logSecurityEvent({
          userId: session.userId,
          sessionId: session.sessionId,
          action: SecurityAction.SECURITY_VIOLATION,
          resource: `${analysisType}:analyze`,
          result: 'blocked',
          riskLevel: 'low',
          metadata: { reason: 'usage_limit_exceeded', tier: session.subscriptionTier },
          ipAddress: session.ipAddress,
          userAgent: session.userAgent
        })
        
        return { allowed: false, error: limitCheck.error }
      }
      
      // Validate input with prompt injection defense
      const securityResult = await this.promptDefense.validateInput(input, {
        userId: session.userId,
        sessionId: session.sessionId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent
      })
      
      if (!securityResult.isSecure) {
        await this.logSecurityEvent({
          userId: session.userId,
          sessionId: session.sessionId,
          action: SecurityAction.SECURITY_VIOLATION,
          resource: `${analysisType}:analyze`,
          result: 'blocked',
          riskLevel: securityResult.riskLevel,
          metadata: {
            violations: securityResult.violations,
            inputHash: securityResult.metadata.inputHash
          },
          ipAddress: session.ipAddress,
          userAgent: session.userAgent
        })
        
        return {
          allowed: false,
          error: 'Input contains potentially harmful content and has been blocked for security reasons.'
        }
      }
      
      // Log successful validation
      await this.logSecurityEvent({
        userId: session.userId,
        sessionId: session.sessionId,
        action: analysisType === 'photo' ? SecurityAction.PHOTO_ANALYSIS : 
                analysisType === 'conversation' ? SecurityAction.CONVERSATION_ANALYSIS : 
                SecurityAction.AI_KEYBOARD_USE,
        resource: `${analysisType}:analyze`,
        result: 'success',
        riskLevel: securityResult.riskLevel,
        metadata: { inputHash: securityResult.metadata.inputHash },
        ipAddress: session.ipAddress,
        userAgent: session.userAgent
      })
      
      return {
        allowed: true,
        sanitizedInput: securityResult.sanitizedInput
      }
      
    } catch (error) {
      await this.logSecurityEvent({
        userId: session.userId,
        sessionId: session.sessionId,
        action: SecurityAction.SECURITY_VIOLATION,
        resource: `${analysisType}:analyze`,
        result: 'failure',
        riskLevel: 'high',
        metadata: { error: error.message },
        ipAddress: session.ipAddress,
        userAgent: session.userAgent
      })
      
      return { allowed: false, error: 'Security validation failed' }
    }
  }
  
  /**
   * Encrypt sensitive data
   */
  public encryptData(data: string): string {
    const cipher = require('crypto').createCipher('aes-256-cbc', this.config.encryptionKey)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  }
  
  /**
   * Decrypt sensitive data
   */
  public decryptData(encryptedData: string): string {
    const decipher = require('crypto').createDecipher('aes-256-cbc', this.config.encryptionKey)
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
  
  /**
   * Hash password with salt
   */
  public hashPassword(password: string): { hash: string; salt: string } {
    const salt = randomBytes(32).toString('hex')
    const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    return { hash, salt }
  }
  
  /**
   * Verify password against hash
   */
  public verifyPassword(password: string, hash: string, salt: string): boolean {
    const verifyHash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    return hash === verifyHash
  }
  
  /**
   * Get security analytics
   */
  public getSecurityAnalytics(timeRange: number = 24 * 60 * 60 * 1000): {
    totalEvents: number
    securityViolations: number
    failedLogins: number
    blockedRequests: number
    riskDistribution: Record<string, number>
    topViolationTypes: Array<{ type: string; count: number }>
  } {
    const cutoff = Date.now() - timeRange
    const recentLogs = this.auditLogs.filter(log => log.timestamp >= cutoff)
    
    const securityViolations = recentLogs.filter(log => 
      log.action === SecurityAction.SECURITY_VIOLATION
    ).length
    
    const failedLogins = recentLogs.filter(log => 
      log.action === SecurityAction.LOGIN && log.result === 'failure'
    ).length
    
    const blockedRequests = recentLogs.filter(log => 
      log.result === 'blocked'
    ).length
    
    const riskDistribution = recentLogs.reduce((acc, log) => {
      acc[log.riskLevel] = (acc[log.riskLevel] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const violationTypes = recentLogs
      .filter(log => log.action === SecurityAction.SECURITY_VIOLATION)
      .reduce((acc, log) => {
        const type = log.metadata.violations?.[0]?.type || 'unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    
    const topViolationTypes = Object.entries(violationTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    return {
      totalEvents: recentLogs.length,
      securityViolations,
      failedLogins,
      blockedRequests,
      riskDistribution,
      topViolationTypes
    }
  }
  
  // Private helper methods
  
  private async validateCredentials(email: string, password: string): Promise<any> {
    // This would typically query your database
    // For now, return a mock user for demonstration
    return {
      id: 'user_123',
      email,
      role: UserRole.USER,
      subscriptionTier: SubscriptionTier.FLAME,
      passwordHash: 'mock_hash',
      passwordSalt: 'mock_salt'
    }
  }
  
  private createSession(user: any, ipAddress: string, userAgent: string): UserSession {
    const sessionId = randomBytes(32).toString('hex')
    const session: UserSession = {
      userId: user.id,
      sessionId,
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ipAddress,
      userAgent,
      mfaVerified: false
    }
    
    this.activeSessions.set(sessionId, session)
    return session
  }
  
  private checkAccountLockout(email: string): { allowed: boolean; remainingTime?: number } {
    const attempts = this.loginAttempts.get(email)
    if (!attempts) return { allowed: true }
    
    const now = Date.now()
    const timeSinceLastAttempt = now - attempts.lastAttempt
    
    if (attempts.count >= this.config.maxLoginAttempts) {
      if (timeSinceLastAttempt < this.config.lockoutDuration) {
        return {
          allowed: false,
          remainingTime: this.config.lockoutDuration - timeSinceLastAttempt
        }
      } else {
        // Reset attempts after lockout period
        this.loginAttempts.delete(email)
        return { allowed: true }
      }
    }
    
    return { allowed: true }
  }
  
  private recordFailedLogin(email: string): void {
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 }
    attempts.count++
    attempts.lastAttempt = Date.now()
    this.loginAttempts.set(email, attempts)
  }
  
  private hasPermission(role: UserRole, permission: string): boolean {
    const rolePermissions = this.PERMISSIONS[role]
    return rolePermissions.includes('*') || rolePermissions.includes(permission)
  }
  
  private async checkUsageLimits(
    userId: string,
    tier: SubscriptionTier,
    analysisType: 'photo' | 'conversation' | 'voice'
  ): Promise<{ allowed: boolean; error?: string }> {
    const limits = this.TIER_LIMITS[tier]
    
    // Check if feature is enabled for tier
    if (analysisType === 'voice' && !limits.voiceAnalysisEnabled) {
      return { allowed: false, error: 'Voice analysis requires Blaze subscription' }
    }
    
    // Check monthly limits (this would typically query your database)
    const monthlyUsage = await this.getMonthlyUsage(userId, analysisType)
    const limit = analysisType === 'photo' ? limits.photoAnalysisPerMonth : limits.conversationAnalysisPerMonth
    
    if (limit !== -1 && monthlyUsage >= limit) {
      return { allowed: false, error: `Monthly ${analysisType} analysis limit reached. Upgrade for more.` }
    }
    
    return { allowed: true }
  }
  
  private async getMonthlyUsage(userId: string, analysisType: string): Promise<number> {
    // This would typically query your database for current month usage
    // For now, return a mock value
    return 10
  }
  
  private async logSecurityEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
    if (!this.config.enableAuditLogging) return
    
    const auditLog: SecurityAuditLog = {
      id: randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      ...event
    }
    
    this.auditLogs.push(auditLog)
    
    // In production, you would also persist this to your database
    console.log('Security Event:', auditLog)
  }
  
  private startCleanupIntervals(): void {
    // Clean up expired sessions every 5 minutes
    setInterval(() => {
      const now = Date.now()
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now - session.lastActivity > this.config.sessionTimeout) {
          this.activeSessions.delete(sessionId)
        }
      }
    }, 5 * 60 * 1000)
    
    // Clean up old audit logs based on retention policy
    setInterval(() => {
      const cutoff = Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000)
      this.auditLogs = this.auditLogs.filter(log => log.timestamp >= cutoff)
    }, 24 * 60 * 60 * 1000) // Daily cleanup
    
    // Clean up rate limit data
    setInterval(() => {
      this.promptDefense.cleanupRateLimits()
    }, 60 * 1000) // Every minute
  }
}

// Export default instance
export const defaultSecurityManager = new SecurityManager({
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-key-change-in-production',
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordMinLength: 8,
  requireMFA: false,
  enableAuditLogging: true,
  dataRetentionDays: 90
})

