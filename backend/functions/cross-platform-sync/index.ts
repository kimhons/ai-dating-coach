import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface SyncRequest {
  userId: string;
  platform: 'mobile' | 'web' | 'extension';
  deviceId: string;
  lastSyncTimestamp: number;
  data?: any;
  operation: 'pull' | 'push' | 'conflict_resolution';
}

interface SyncData {
  id: string;
  userId: string;
  dataType: string;
  data: any;
  platform: string;
  deviceId: string;
  timestamp: number;
  version: number;
  checksum: string;
}

interface ConflictResolution {
  conflictId: string;
  resolution: 'merge' | 'override' | 'manual';
  resolvedData: any;
  timestamp: number;
}

class CrossPlatformSyncService {
  private readonly SYNC_BATCH_SIZE = 100;
  private readonly CONFLICT_TIMEOUT = 300000; // 5 minutes
  private readonly MAX_RETRIES = 3;

  /**
   * Main sync endpoint handler
   */
  async handleSync(req: Request, res: Response) {
    try {
      const syncRequest: SyncRequest = req.body;
      
      // Validate request
      const validation = this.validateSyncRequest(syncRequest);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
          code: 'INVALID_REQUEST'
        });
      }

      // Check user authentication and permissions
      const authResult = await this.authenticateUser(syncRequest.userId, req.headers.authorization);
      if (!authResult.success) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          code: 'AUTH_FAILED'
        });
      }

      // Process sync operation
      let result;
      switch (syncRequest.operation) {
        case 'pull':
          result = await this.handlePullSync(syncRequest);
          break;
        case 'push':
          result = await this.handlePushSync(syncRequest);
          break;
        case 'conflict_resolution':
          result = await this.handleConflictResolution(syncRequest);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid operation',
            code: 'INVALID_OPERATION'
          });
      }

      // Track sync metrics
      await this.trackSyncMetrics(syncRequest, result);

      res.json({
        success: true,
        result,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Sync error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal sync error',
        code: 'SYNC_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Handle pull synchronization (download changes)
   */
  private async handlePullSync(request: SyncRequest) {
    const { userId, platform, deviceId, lastSyncTimestamp } = request;

    // Get all changes since last sync
    const { data: changes, error } = await supabase
      .from('sync_data')
      .select('*')
      .eq('user_id', userId)
      .gt('timestamp', lastSyncTimestamp)
      .neq('device_id', deviceId) // Exclude changes from same device
      .order('timestamp', { ascending: true })
      .limit(this.SYNC_BATCH_SIZE);

    if (error) {
      throw new Error(`Failed to fetch sync data: ${error.message}`);
    }

    // Group changes by data type
    const groupedChanges = this.groupChangesByType(changes || []);

    // Check for conflicts
    const conflicts = await this.detectConflicts(userId, deviceId, changes || []);

    // Prepare incremental sync data
    const incrementalData = await this.prepareIncrementalData(groupedChanges);

    return {
      changes: incrementalData,
      conflicts,
      hasMore: (changes?.length || 0) >= this.SYNC_BATCH_SIZE,
      lastSyncTimestamp: Date.now(),
      totalChanges: changes?.length || 0
    };
  }

  /**
   * Handle push synchronization (upload changes)
   */
  private async handlePushSync(request: SyncRequest) {
    const { userId, platform, deviceId, data } = request;

    if (!data || !Array.isArray(data.changes)) {
      throw new Error('Invalid push data format');
    }

    const results = {
      successful: 0,
      failed: 0,
      conflicts: 0,
      errors: [] as any[]
    };

    // Process each change
    for (const change of data.changes) {
      try {
        const processResult = await this.processChange(userId, platform, deviceId, change);
        
        if (processResult.conflict) {
          results.conflicts++;
        } else if (processResult.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({
            changeId: change.id,
            error: processResult.error
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          changeId: change.id,
          error: error.message
        });
      }
    }

    // Update device sync status
    await this.updateDeviceSyncStatus(userId, deviceId, platform);

    return {
      ...results,
      timestamp: Date.now()
    };
  }

  /**
   * Handle conflict resolution
   */
  private async handleConflictResolution(request: SyncRequest) {
    const { userId, data } = request;

    if (!data || !data.resolutions) {
      throw new Error('Invalid conflict resolution data');
    }

    const results = {
      resolved: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const resolution of data.resolutions) {
      try {
        await this.resolveConflict(userId, resolution);
        results.resolved++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          conflictId: resolution.conflictId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Process individual change
   */
  private async processChange(userId: string, platform: string, deviceId: string, change: any) {
    // Check for existing data
    const { data: existing } = await supabase
      .from('sync_data')
      .select('*')
      .eq('user_id', userId)
      .eq('data_type', change.dataType)
      .eq('id', change.id)
      .single();

    // Detect conflict
    if (existing && existing.version !== change.baseVersion) {
      // Create conflict record
      await this.createConflictRecord(userId, change, existing);
      return { conflict: true, success: false };
    }

    // Calculate checksum
    const checksum = this.calculateChecksum(change.data);

    // Prepare sync data
    const syncData: Partial<SyncData> = {
      id: change.id,
      userId,
      dataType: change.dataType,
      data: change.data,
      platform,
      deviceId,
      timestamp: Date.now(),
      version: (existing?.version || 0) + 1,
      checksum
    };

    // Upsert data
    const { error } = await supabase
      .from('sync_data')
      .upsert(syncData);

    if (error) {
      return { success: false, error: error.message };
    }

    // Update related tables based on data type
    await this.updateRelatedTables(change.dataType, change.data, userId);

    return { success: true, conflict: false };
  }

  /**
   * Detect conflicts between changes
   */
  private async detectConflicts(userId: string, deviceId: string, changes: any[]) {
    const conflicts = [];

    for (const change of changes) {
      // Check if there are multiple versions of the same data
      const { data: versions } = await supabase
        .from('sync_data')
        .select('*')
        .eq('user_id', userId)
        .eq('data_type', change.dataType)
        .eq('id', change.id)
        .neq('device_id', deviceId)
        .order('timestamp', { ascending: false })
        .limit(2);

      if (versions && versions.length > 1) {
        const conflict = await this.analyzeConflict(versions);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    return conflicts;
  }

  /**
   * Analyze conflict between versions
   */
  private async analyzeConflict(versions: any[]) {
    const [latest, previous] = versions;
    
    // Calculate conflict severity
    const severity = this.calculateConflictSeverity(latest.data, previous.data);
    
    // Suggest resolution strategy
    const strategy = this.suggestResolutionStrategy(latest.data, previous.data, severity);

    return {
      id: `conflict_${latest.id}_${Date.now()}`,
      dataType: latest.dataType,
      dataId: latest.id,
      versions: [
        {
          version: latest.version,
          data: latest.data,
          timestamp: latest.timestamp,
          platform: latest.platform,
          deviceId: latest.deviceId
        },
        {
          version: previous.version,
          data: previous.data,
          timestamp: previous.timestamp,
          platform: previous.platform,
          deviceId: previous.deviceId
        }
      ],
      severity,
      suggestedStrategy: strategy,
      createdAt: Date.now()
    };
  }

  /**
   * Calculate conflict severity
   */
  private calculateConflictSeverity(data1: any, data2: any): 'low' | 'medium' | 'high' {
    const changes = this.deepDiff(data1, data2);
    const changeCount = Object.keys(changes).length;
    
    if (changeCount <= 2) return 'low';
    if (changeCount <= 5) return 'medium';
    return 'high';
  }

  /**
   * Suggest resolution strategy
   */
  private suggestResolutionStrategy(data1: any, data2: any, severity: string): string {
    // Simple heuristics for resolution strategy
    if (severity === 'low') {
      return 'auto_merge';
    }
    
    // Check timestamps
    const timestamp1 = data1.lastModified || data1.timestamp || 0;
    const timestamp2 = data2.lastModified || data2.timestamp || 0;
    
    if (Math.abs(timestamp1 - timestamp2) < 60000) { // Within 1 minute
      return 'manual_review';
    }
    
    return 'latest_wins';
  }

  /**
   * Create conflict record
   */
  private async createConflictRecord(userId: string, newChange: any, existingData: any) {
    const conflict = {
      id: `conflict_${newChange.id}_${Date.now()}`,
      user_id: userId,
      data_type: newChange.dataType,
      data_id: newChange.id,
      conflict_data: {
        new: newChange,
        existing: existingData
      },
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + this.CONFLICT_TIMEOUT).toISOString()
    };

    await supabase.from('sync_conflicts').insert(conflict);
  }

  /**
   * Resolve conflict
   */
  private async resolveConflict(userId: string, resolution: ConflictResolution) {
    const { conflictId, resolution: strategy, resolvedData } = resolution;

    // Get conflict record
    const { data: conflict } = await supabase
      .from('sync_conflicts')
      .select('*')
      .eq('id', conflictId)
      .eq('user_id', userId)
      .single();

    if (!conflict) {
      throw new Error('Conflict not found');
    }

    // Apply resolution
    const syncData = {
      id: conflict.data_id,
      userId,
      dataType: conflict.data_type,
      data: resolvedData,
      platform: 'resolved',
      deviceId: 'conflict_resolution',
      timestamp: Date.now(),
      version: Math.max(
        conflict.conflict_data.new.version || 0,
        conflict.conflict_data.existing.version || 0
      ) + 1,
      checksum: this.calculateChecksum(resolvedData)
    };

    // Update sync data
    await supabase.from('sync_data').upsert(syncData);

    // Mark conflict as resolved
    await supabase
      .from('sync_conflicts')
      .update({
        status: 'resolved',
        resolution_strategy: strategy,
        resolved_at: new Date().toISOString(),
        resolved_data: resolvedData
      })
      .eq('id', conflictId);

    // Update related tables
    await this.updateRelatedTables(conflict.data_type, resolvedData, userId);
  }

  /**
   * Update related tables based on data type
   */
  private async updateRelatedTables(dataType: string, data: any, userId: string) {
    switch (dataType) {
      case 'profile_analysis':
        await this.updateProfileAnalysis(data, userId);
        break;
      case 'conversation_coaching':
        await this.updateConversationCoaching(data, userId);
        break;
      case 'user_preferences':
        await this.updateUserPreferences(data, userId);
        break;
      case 'tier_usage':
        await this.updateTierUsage(data, userId);
        break;
      case 'analytics_data':
        await this.updateAnalyticsData(data, userId);
        break;
    }
  }

  /**
   * Update profile analysis data
   */
  private async updateProfileAnalysis(data: any, userId: string) {
    const analysisData = {
      user_id: userId,
      platform: data.platform,
      analysis_data: data.analysis,
      score: data.score,
      suggestions: data.suggestions,
      created_at: new Date(data.timestamp).toISOString(),
      updated_at: new Date().toISOString()
    };

    await supabase
      .from('profile_analyses')
      .upsert(analysisData, { onConflict: 'user_id,platform,created_at' });
  }

  /**
   * Update conversation coaching data
   */
  private async updateConversationCoaching(data: any, userId: string) {
    const coachingData = {
      user_id: userId,
      platform: data.platform,
      conversation_data: data.conversation,
      suggestions: data.suggestions,
      effectiveness_score: data.effectivenessScore,
      created_at: new Date(data.timestamp).toISOString(),
      updated_at: new Date().toISOString()
    };

    await supabase
      .from('conversation_coaching')
      .upsert(coachingData, { onConflict: 'user_id,platform,created_at' });
  }

  /**
   * Update user preferences
   */
  private async updateUserPreferences(data: any, userId: string) {
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preferences: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
  }

  /**
   * Update tier usage data
   */
  private async updateTierUsage(data: any, userId: string) {
    await supabase
      .from('tier_usage')
      .upsert({
        user_id: userId,
        feature: data.feature,
        usage_count: data.usageCount,
        last_used: new Date(data.lastUsed).toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,feature' });
  }

  /**
   * Update analytics data
   */
  private async updateAnalyticsData(data: any, userId: string) {
    await supabase
      .from('user_analytics')
      .upsert({
        user_id: userId,
        metric_name: data.metricName,
        metric_value: data.metricValue,
        metadata: data.metadata,
        recorded_at: new Date(data.timestamp).toISOString()
      });
  }

  /**
   * Group changes by data type
   */
  private groupChangesByType(changes: any[]) {
    return changes.reduce((groups, change) => {
      const type = change.data_type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(change);
      return groups;
    }, {});
  }

  /**
   * Prepare incremental sync data
   */
  private async prepareIncrementalData(groupedChanges: any) {
    const incrementalData = {};

    for (const [dataType, changes] of Object.entries(groupedChanges)) {
      incrementalData[dataType] = {
        changes: changes,
        totalCount: (changes as any[]).length,
        lastTimestamp: Math.max(...(changes as any[]).map(c => c.timestamp))
      };
    }

    return incrementalData;
  }

  /**
   * Update device sync status
   */
  private async updateDeviceSyncStatus(userId: string, deviceId: string, platform: string) {
    await supabase
      .from('device_sync_status')
      .upsert({
        user_id: userId,
        device_id: deviceId,
        platform,
        last_sync: new Date().toISOString(),
        sync_count: supabase.raw('sync_count + 1')
      }, { onConflict: 'user_id,device_id' });
  }

  /**
   * Track sync metrics
   */
  private async trackSyncMetrics(request: SyncRequest, result: any) {
    const metrics = {
      user_id: request.userId,
      platform: request.platform,
      device_id: request.deviceId,
      operation: request.operation,
      success: result.success !== false,
      changes_count: result.totalChanges || result.successful || 0,
      conflicts_count: result.conflicts?.length || result.conflicts || 0,
      duration_ms: Date.now() - (request.lastSyncTimestamp || Date.now()),
      timestamp: new Date().toISOString()
    };

    await supabase.from('sync_metrics').insert(metrics);
  }

  /**
   * Validate sync request
   */
  private validateSyncRequest(request: SyncRequest) {
    if (!request.userId) {
      return { valid: false, error: 'User ID is required' };
    }

    if (!request.platform || !['mobile', 'web', 'extension'].includes(request.platform)) {
      return { valid: false, error: 'Valid platform is required' };
    }

    if (!request.deviceId) {
      return { valid: false, error: 'Device ID is required' };
    }

    if (!request.operation || !['pull', 'push', 'conflict_resolution'].includes(request.operation)) {
      return { valid: false, error: 'Valid operation is required' };
    }

    if (typeof request.lastSyncTimestamp !== 'number') {
      return { valid: false, error: 'Valid last sync timestamp is required' };
    }

    return { valid: true };
  }

  /**
   * Authenticate user
   */
  private async authenticateUser(userId: string, authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Invalid authorization header' };
    }

    const token = authHeader.substring(7);

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user || user.id !== userId) {
        return { success: false, error: 'Invalid token or user mismatch' };
      }

      return { success: true, user };
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: any): string {
    const crypto = require('crypto');
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Deep diff between two objects
   */
  private deepDiff(obj1: any, obj2: any): any {
    const diff = {};
    
    const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    
    for (const key of keys) {
      if (obj1[key] !== obj2[key]) {
        if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
          const nestedDiff = this.deepDiff(obj1[key], obj2[key]);
          if (Object.keys(nestedDiff).length > 0) {
            diff[key] = nestedDiff;
          }
        } else {
          diff[key] = { old: obj1[key], new: obj2[key] };
        }
      }
    }
    
    return diff;
  }
}

// Export the handler
const syncService = new CrossPlatformSyncService();

export const handler = async (req: Request, res: Response) => {
  // Enable CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  return syncService.handleSync(req, res);
};

