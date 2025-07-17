/**
 * Comprehensive Security Manager for AI Dating Coach
 * Handles authentication, authorization, encryption, and privacy controls
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  encryptionKey: string;
  rateLimitWindow: number;
  rateLimitMax: number;
  corsOrigins: string[];
  enableCSP: boolean;
  enableHSTS: boolean;
}

interface UserSession {
  userId: string;
  email: string;
  tier: string;
  permissions: string[];
  deviceId: string;
  platform: string;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
}

interface SecurityAuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  success: boolean;
  details?: any;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface PrivacySettings {
  dataCollection: boolean;
  profileVisibility: boolean;
  conversationAnalysis: boolean;
  marketingEmails: boolean;
  analyticsTracking: boolean;
  dataRetentionDays: number;
  shareWithPartners: boolean;
}

class SecurityManager {
  private config: SecurityConfig;
  private supabase: any;
  private activeSessions: Map<string, UserSession> = new Map();
  private failedAttempts: Map<string, number> = new Map();
  private auditLogs: SecurityAuditLog[] = [];

  constructor(config: SecurityConfig) {
    this.config = config;
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Initialize security cleanup intervals
    this.initializeCleanupTasks();
  }

  /**
   * Initialize security middleware
   */
  public initializeMiddleware(app: any) {
    // Security headers
    app.use(helmet({
      contentSecurityPolicy: this.config.enableCSP ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.openai.com", "https://*.supabase.co"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: []
        }
      } : false,
      hsts: this.config.enableHSTS ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      } : false
    }));

    // CORS configuration
    app.use((req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;
      if (this.config.corsOrigins.includes('*') || 
          (origin && this.config.corsOrigins.includes(origin))) {
        res.header('Access-Control-Allow-Origin', origin || '*');
      }
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Device-ID, X-Platform');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      next();
    });

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindow,
      max: this.config.rateLimitMax,
      message: {
        success: false,
        error: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.ip + ':' + (req.headers['x-device-id'] || 'unknown');
      }
    });
    app.use('/api/', limiter);

    // Request logging and monitoring
    app.use(this.requestLoggingMiddleware.bind(this));
  }

  /**
   * Authentication middleware
   */
  public authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        await this.logSecurityEvent({
          action: 'authentication_failed',
          resource: req.path,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || '',
          timestamp: Date.now(),
          success: false,
          details: { reason: 'missing_token' },
          riskLevel: 'medium'
        });

        return res.status(401).json({
          success: false,
          error: 'Access token required',
          code: 'TOKEN_REQUIRED'
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, this.config.jwtSecret) as any;
      
      // Check if session is still valid
      const session = this.activeSessions.get(decoded.sessionId);
      if (!session) {
        await this.logSecurityEvent({
          action: 'authentication_failed',
          resource: req.path,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || '',
          timestamp: Date.now(),
          success: false,
          details: { reason: 'invalid_session', userId: decoded.userId },
          riskLevel: 'high'
        });

        return res.status(401).json({
          success: false,
          error: 'Invalid or expired session',
          code: 'INVALID_SESSION'
        });
      }

      // Update session activity
      session.lastActivity = Date.now();
      this.activeSessions.set(decoded.sessionId, session);

      // Add user info to request
      (req as any).user = {
        userId: session.userId,
        email: session.email,
        tier: session.tier,
        permissions: session.permissions,
        sessionId: decoded.sessionId
      };

      await this.logSecurityEvent({
        userId: session.userId,
        action: 'authentication_success',
        resource: req.path,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        timestamp: Date.now(),
        success: true,
        riskLevel: 'low'
      });

      next();
    } catch (error) {
      await this.logSecurityEvent({
        action: 'authentication_error',
        resource: req.path,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        timestamp: Date.now(),
        success: false,
        details: { error: error.message },
        riskLevel: 'high'
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
  };

  /**
   * Authorization middleware
   */
  public authorize = (requiredPermissions: string[] = []) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Check permissions
      const hasPermission = requiredPermissions.every(permission => 
        user.permissions.includes(permission) || user.permissions.includes('admin')
      );

      if (!hasPermission) {
        await this.logSecurityEvent({
          userId: user.userId,
          action: 'authorization_failed',
          resource: req.path,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || '',
          timestamp: Date.now(),
          success: false,
          details: { 
            requiredPermissions, 
            userPermissions: user.permissions 
          },
          riskLevel: 'medium'
        });

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    };
  };

  /**
   * User login with security checks
   */
  public async login(email: string, password: string, deviceId: string, platform: string, ipAddress: string, userAgent: string) {
    try {
      // Check for too many failed attempts
      const attemptKey = `${email}:${ipAddress}`;
      const failedCount = this.failedAttempts.get(attemptKey) || 0;
      
      if (failedCount >= 5) {
        await this.logSecurityEvent({
          action: 'login_blocked',
          resource: 'auth/login',
          ipAddress,
          userAgent,
          timestamp: Date.now(),
          success: false,
          details: { email, reason: 'too_many_attempts' },
          riskLevel: 'high'
        });

        return {
          success: false,
          error: 'Account temporarily locked due to too many failed attempts',
          code: 'ACCOUNT_LOCKED'
        };
      }

      // Authenticate with Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        // Increment failed attempts
        this.failedAttempts.set(attemptKey, failedCount + 1);
        
        await this.logSecurityEvent({
          action: 'login_failed',
          resource: 'auth/login',
          ipAddress,
          userAgent,
          timestamp: Date.now(),
          success: false,
          details: { email, reason: 'invalid_credentials' },
          riskLevel: 'medium'
        });

        return {
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        };
      }

      // Clear failed attempts on successful login
      this.failedAttempts.delete(attemptKey);

      // Get user profile and permissions
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('tier, permissions')
        .eq('user_id', authData.user.id)
        .single();

      // Create session
      const sessionId = crypto.randomUUID();
      const session: UserSession = {
        userId: authData.user.id,
        email: authData.user.email!,
        tier: profile?.tier || 'free',
        permissions: profile?.permissions || ['user'],
        deviceId,
        platform,
        lastActivity: Date.now(),
        ipAddress,
        userAgent
      };

      this.activeSessions.set(sessionId, session);

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: authData.user.id, 
          sessionId,
          email: authData.user.email 
        },
        this.config.jwtSecret,
        { expiresIn: this.config.jwtExpiresIn }
      );

      await this.logSecurityEvent({
        userId: authData.user.id,
        action: 'login_success',
        resource: 'auth/login',
        ipAddress,
        userAgent,
        timestamp: Date.now(),
        success: true,
        details: { platform, deviceId },
        riskLevel: 'low'
      });

      return {
        success: true,
        data: {
          token,
          user: {
            id: authData.user.id,
            email: authData.user.email,
            tier: session.tier,
            permissions: session.permissions
          },
          sessionId
        }
      };

    } catch (error) {
      await this.logSecurityEvent({
        action: 'login_error',
        resource: 'auth/login',
        ipAddress,
        userAgent,
        timestamp: Date.now(),
        success: false,
        details: { error: error.message },
        riskLevel: 'high'
      });

      return {
        success: false,
        error: 'Login failed',
        code: 'LOGIN_ERROR'
      };
    }
  }

  /**
   * User logout
   */
  public async logout(sessionId: string, userId: string, ipAddress: string, userAgent: string) {
    try {
      // Remove session
      this.activeSessions.delete(sessionId);

      // Revoke Supabase session
      await this.supabase.auth.signOut();

      await this.logSecurityEvent({
        userId,
        action: 'logout_success',
        resource: 'auth/logout',
        ipAddress,
        userAgent,
        timestamp: Date.now(),
        success: true,
        riskLevel: 'low'
      });

      return { success: true };
    } catch (error) {
      await this.logSecurityEvent({
        userId,
        action: 'logout_error',
        resource: 'auth/logout',
        ipAddress,
        userAgent,
        timestamp: Date.now(),
        success: false,
        details: { error: error.message },
        riskLevel: 'medium'
      });

      return {
        success: false,
        error: 'Logout failed',
        code: 'LOGOUT_ERROR'
      };
    }
  }

  /**
   * Data encryption
   */
  public encryptData(data: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, this.config.encryptionKey);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Data decryption
   */
  public decryptData(encryptedData: string): string {
    const algorithm = 'aes-256-gcm';
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(algorithm, this.config.encryptionKey);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Hash sensitive data
   */
  public async hashData(data: string): Promise<string> {
    return bcrypt.hash(data, this.config.bcryptRounds);
  }

  /**
   * Verify hashed data
   */
  public async verifyHash(data: string, hash: string): Promise<boolean> {
    return bcrypt.compare(data, hash);
  }

  /**
   * Privacy settings management
   */
  public async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>) {
    try {
      const { error } = await this.supabase
        .from('user_privacy_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await this.logSecurityEvent({
        userId,
        action: 'privacy_settings_updated',
        resource: 'privacy/settings',
        ipAddress: 'system',
        userAgent: 'system',
        timestamp: Date.now(),
        success: true,
        details: { updatedFields: Object.keys(settings) },
        riskLevel: 'low'
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update privacy settings',
        code: 'PRIVACY_UPDATE_ERROR'
      };
    }
  }

  /**
   * Data deletion (GDPR compliance)
   */
  public async deleteUserData(userId: string, requestedBy: string) {
    try {
      // Delete from all tables
      const tables = [
        'user_profiles',
        'profile_analyses',
        'conversation_coaching',
        'tier_usage',
        'user_analytics',
        'sync_data',
        'device_sync_status',
        'user_privacy_settings'
      ];

      for (const table of tables) {
        await this.supabase
          .from(table)
          .delete()
          .eq('user_id', userId);
      }

      // Delete auth user
      await this.supabase.auth.admin.deleteUser(userId);

      // Remove active sessions
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.userId === userId) {
          this.activeSessions.delete(sessionId);
        }
      }

      await this.logSecurityEvent({
        userId,
        action: 'user_data_deleted',
        resource: 'privacy/delete',
        ipAddress: 'system',
        userAgent: 'system',
        timestamp: Date.now(),
        success: true,
        details: { requestedBy, deletedTables: tables },
        riskLevel: 'high'
      });

      return { success: true };
    } catch (error) {
      await this.logSecurityEvent({
        userId,
        action: 'user_data_deletion_failed',
        resource: 'privacy/delete',
        ipAddress: 'system',
        userAgent: 'system',
        timestamp: Date.now(),
        success: false,
        details: { error: error.message, requestedBy },
        riskLevel: 'critical'
      });

      return {
        success: false,
        error: 'Failed to delete user data',
        code: 'DATA_DELETION_ERROR'
      };
    }
  }

  /**
   * Data export (GDPR compliance)
   */
  public async exportUserData(userId: string) {
    try {
      const userData = {};

      // Export from all relevant tables
      const tables = [
        'user_profiles',
        'profile_analyses',
        'conversation_coaching',
        'tier_usage',
        'user_analytics',
        'user_privacy_settings'
      ];

      for (const table of tables) {
        const { data } = await this.supabase
          .from(table)
          .select('*')
          .eq('user_id', userId);
        
        userData[table] = data || [];
      }

      await this.logSecurityEvent({
        userId,
        action: 'user_data_exported',
        resource: 'privacy/export',
        ipAddress: 'system',
        userAgent: 'system',
        timestamp: Date.now(),
        success: true,
        details: { exportedTables: tables },
        riskLevel: 'medium'
      });

      return {
        success: true,
        data: userData
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to export user data',
        code: 'DATA_EXPORT_ERROR'
      };
    }
  }

  /**
   * Security audit logging
   */
  private async logSecurityEvent(event: Omit<SecurityAuditLog, 'id'>) {
    const auditLog: SecurityAuditLog = {
      id: crypto.randomUUID(),
      ...event
    };

    // Store in memory (for immediate access)
    this.auditLogs.push(auditLog);

    // Keep only last 10000 logs in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }

    // Store in database
    try {
      await this.supabase
        .from('security_audit_logs')
        .insert({
          id: auditLog.id,
          user_id: auditLog.userId,
          action: auditLog.action,
          resource: auditLog.resource,
          ip_address: auditLog.ipAddress,
          user_agent: auditLog.userAgent,
          timestamp: new Date(auditLog.timestamp).toISOString(),
          success: auditLog.success,
          details: auditLog.details,
          risk_level: auditLog.riskLevel
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Request logging middleware
   */
  private requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const user = (req as any).user;
      
      // Log suspicious activity
      if (res.statusCode >= 400 || duration > 5000) {
        this.logSecurityEvent({
          userId: user?.userId,
          action: 'request_completed',
          resource: req.path,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || '',
          timestamp: Date.now(),
          success: res.statusCode < 400,
          details: {
            method: req.method,
            statusCode: res.statusCode,
            duration,
            body: req.method === 'POST' ? 'redacted' : undefined
          },
          riskLevel: res.statusCode >= 500 ? 'high' : 'medium'
        });
      }
    });

    next();
  }

  /**
   * Initialize cleanup tasks
   */
  private initializeCleanupTasks() {
    // Clean expired sessions every 15 minutes
    setInterval(() => {
      const now = Date.now();
      const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now - session.lastActivity > sessionTimeout) {
          this.activeSessions.delete(sessionId);
        }
      }
    }, 15 * 60 * 1000);

    // Clean failed attempts every hour
    setInterval(() => {
      this.failedAttempts.clear();
    }, 60 * 60 * 1000);

    // Clean old audit logs every day
    setInterval(async () => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        await this.supabase
          .from('security_audit_logs')
          .delete()
          .lt('timestamp', thirtyDaysAgo.toISOString());
      } catch (error) {
        console.error('Failed to clean old audit logs:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Get security metrics
   */
  public getSecurityMetrics() {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    
    const recentLogs = this.auditLogs.filter(log => log.timestamp > last24Hours);
    
    return {
      activeSessions: this.activeSessions.size,
      failedAttempts: this.failedAttempts.size,
      recentEvents: recentLogs.length,
      criticalEvents: recentLogs.filter(log => log.riskLevel === 'critical').length,
      highRiskEvents: recentLogs.filter(log => log.riskLevel === 'high').length,
      successfulLogins: recentLogs.filter(log => 
        log.action === 'login_success' && log.success
      ).length,
      failedLogins: recentLogs.filter(log => 
        log.action === 'login_failed' && !log.success
      ).length
    };
  }

  /**
   * Validate request integrity
   */
  public validateRequestIntegrity(req: Request): boolean {
    // Check for common attack patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /drop\s+table/i,
      /exec\s*\(/i
    ];

    const requestString = JSON.stringify({
      url: req.url,
      body: req.body,
      query: req.query
    });

    return !suspiciousPatterns.some(pattern => pattern.test(requestString));
  }

  /**
   * Generate secure random token
   */
  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate password strength
   */
  public validatePasswordStrength(password: string): { valid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Password must be at least 8 characters long');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password must contain lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password must contain uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Password must contain numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Password must contain special characters');

    if (password.length >= 12) score += 1;

    return {
      valid: score >= 4,
      score,
      feedback
    };
  }
}

export default SecurityManager;
export type { SecurityConfig, UserSession, SecurityAuditLog, PrivacySettings };

