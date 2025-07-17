/**
 * Privacy Manager for AI Dating Coach
 * Handles GDPR compliance, data protection, and privacy controls
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

interface PrivacySettings {
  userId: string;
  dataCollection: boolean;
  profileVisibility: 'public' | 'private' | 'friends';
  conversationAnalysis: boolean;
  marketingEmails: boolean;
  analyticsTracking: boolean;
  dataRetentionDays: number;
  shareWithPartners: boolean;
  locationTracking: boolean;
  personalizedAds: boolean;
  thirdPartyIntegrations: boolean;
  dataProcessingConsent: boolean;
  researchParticipation: boolean;
  updatedAt: Date;
}

interface DataProcessingRecord {
  id: string;
  userId: string;
  dataType: string;
  processingPurpose: string;
  legalBasis: string;
  dataSource: string;
  retentionPeriod: number;
  thirdPartySharing: boolean;
  encryptionStatus: boolean;
  createdAt: Date;
  lastAccessed: Date;
}

interface ConsentRecord {
  id: string;
  userId: string;
  consentType: string;
  granted: boolean;
  version: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  withdrawnAt?: Date;
  withdrawalReason?: string;
}

interface DataExportRequest {
  id: string;
  userId: string;
  requestType: 'export' | 'deletion' | 'rectification';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
  verificationCode: string;
}

interface AnonymizationRule {
  dataType: string;
  fields: string[];
  method: 'hash' | 'encrypt' | 'remove' | 'pseudonymize';
  retentionDays: number;
}

class PrivacyManager {
  private supabase: any;
  private anonymizationRules: AnonymizationRule[] = [
    {
      dataType: 'user_profile',
      fields: ['email', 'phone', 'full_name'],
      method: 'hash',
      retentionDays: 2555 // 7 years
    },
    {
      dataType: 'conversation_data',
      fields: ['message_content', 'participant_info'],
      method: 'encrypt',
      retentionDays: 365 // 1 year
    },
    {
      dataType: 'analytics_data',
      fields: ['ip_address', 'device_id'],
      method: 'pseudonymize',
      retentionDays: 730 // 2 years
    },
    {
      dataType: 'photo_analysis',
      fields: ['image_data', 'facial_features'],
      method: 'remove',
      retentionDays: 90 // 3 months
    }
  ];

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Initialize privacy compliance tasks
    this.initializeComplianceTasks();
  }

  /**
   * Get user privacy settings
   */
  public async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      if (!data) {
        // Create default privacy settings
        return await this.createDefaultPrivacySettings(userId);
      }

      return {
        userId: data.user_id,
        dataCollection: data.data_collection,
        profileVisibility: data.profile_visibility,
        conversationAnalysis: data.conversation_analysis,
        marketingEmails: data.marketing_emails,
        analyticsTracking: data.analytics_tracking,
        dataRetentionDays: data.data_retention_days,
        shareWithPartners: data.share_with_partners,
        locationTracking: data.location_tracking,
        personalizedAds: data.personalized_ads,
        thirdPartyIntegrations: data.third_party_integrations,
        dataProcessingConsent: data.data_processing_consent,
        researchParticipation: data.research_participation,
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      return null;
    }
  }

  /**
   * Update privacy settings
   */
  public async updatePrivacySettings(
    userId: string, 
    settings: Partial<PrivacySettings>,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update settings
      const { error: updateError } = await this.supabase
        .from('user_privacy_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      // Log consent changes
      for (const [key, value] of Object.entries(settings)) {
        if (typeof value === 'boolean') {
          await this.recordConsent(userId, key, value, ipAddress, userAgent);
        }
      }

      // Trigger data processing updates based on new settings
      await this.updateDataProcessingBasedOnSettings(userId, settings);

      return { success: true };
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      return {
        success: false,
        error: 'Failed to update privacy settings'
      };
    }
  }

  /**
   * Record user consent
   */
  public async recordConsent(
    userId: string,
    consentType: string,
    granted: boolean,
    ipAddress: string,
    userAgent: string,
    version: string = '1.0'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const consentRecord: Omit<ConsentRecord, 'id'> = {
        userId,
        consentType,
        granted,
        version,
        ipAddress,
        userAgent,
        timestamp: new Date()
      };

      const { error } = await this.supabase
        .from('consent_records')
        .insert({
          id: crypto.randomUUID(),
          user_id: consentRecord.userId,
          consent_type: consentRecord.consentType,
          granted: consentRecord.granted,
          version: consentRecord.version,
          ip_address: consentRecord.ipAddress,
          user_agent: consentRecord.userAgent,
          timestamp: consentRecord.timestamp.toISOString()
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error recording consent:', error);
      return {
        success: false,
        error: 'Failed to record consent'
      };
    }
  }

  /**
   * Withdraw consent
   */
  public async withdrawConsent(
    userId: string,
    consentType: string,
    reason: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Record withdrawal
      await this.recordConsent(userId, consentType, false, ipAddress, userAgent);

      // Update the original consent record
      const { error } = await this.supabase
        .from('consent_records')
        .update({
          withdrawn_at: new Date().toISOString(),
          withdrawal_reason: reason
        })
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .eq('granted', true)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) throw error;

      // Update privacy settings
      const settingsUpdate = { [consentType]: false };
      await this.updatePrivacySettings(userId, settingsUpdate, ipAddress, userAgent);

      return { success: true };
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      return {
        success: false,
        error: 'Failed to withdraw consent'
      };
    }
  }

  /**
   * Request data export (GDPR Article 20)
   */
  public async requestDataExport(
    userId: string,
    email: string
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      const requestId = crypto.randomUUID();
      const verificationCode = crypto.randomBytes(16).toString('hex');

      const exportRequest: Omit<DataExportRequest, 'id'> = {
        id: requestId,
        userId,
        requestType: 'export',
        status: 'pending',
        requestedAt: new Date(),
        verificationCode
      };

      const { error } = await this.supabase
        .from('data_export_requests')
        .insert({
          id: exportRequest.id,
          user_id: exportRequest.userId,
          request_type: exportRequest.requestType,
          status: exportRequest.status,
          requested_at: exportRequest.requestedAt.toISOString(),
          verification_code: exportRequest.verificationCode
        });

      if (error) throw error;

      // Process export asynchronously
      this.processDataExport(requestId);

      // Send verification email (would integrate with email service)
      await this.sendVerificationEmail(email, verificationCode, 'export');

      return {
        success: true,
        requestId
      };
    } catch (error) {
      console.error('Error requesting data export:', error);
      return {
        success: false,
        error: 'Failed to request data export'
      };
    }
  }

  /**
   * Request data deletion (GDPR Article 17)
   */
  public async requestDataDeletion(
    userId: string,
    email: string,
    reason: string
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      const requestId = crypto.randomUUID();
      const verificationCode = crypto.randomBytes(16).toString('hex');

      const deletionRequest: Omit<DataExportRequest, 'id'> = {
        id: requestId,
        userId,
        requestType: 'deletion',
        status: 'pending',
        requestedAt: new Date(),
        verificationCode
      };

      const { error } = await this.supabase
        .from('data_export_requests')
        .insert({
          id: deletionRequest.id,
          user_id: deletionRequest.userId,
          request_type: deletionRequest.requestType,
          status: deletionRequest.status,
          requested_at: deletionRequest.requestedAt.toISOString(),
          verification_code: deletionRequest.verificationCode,
          deletion_reason: reason
        });

      if (error) throw error;

      // Send verification email
      await this.sendVerificationEmail(email, verificationCode, 'deletion');

      return {
        success: true,
        requestId
      };
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      return {
        success: false,
        error: 'Failed to request data deletion'
      };
    }
  }

  /**
   * Verify and process data request
   */
  public async verifyAndProcessRequest(
    requestId: string,
    verificationCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify request
      const { data: request, error: fetchError } = await this.supabase
        .from('data_export_requests')
        .select('*')
        .eq('id', requestId)
        .eq('verification_code', verificationCode)
        .single();

      if (fetchError || !request) {
        return {
          success: false,
          error: 'Invalid request or verification code'
        };
      }

      if (request.status !== 'pending') {
        return {
          success: false,
          error: 'Request has already been processed'
        };
      }

      // Update status to processing
      await this.supabase
        .from('data_export_requests')
        .update({ status: 'processing' })
        .eq('id', requestId);

      // Process based on request type
      if (request.request_type === 'export') {
        await this.processDataExport(requestId);
      } else if (request.request_type === 'deletion') {
        await this.processDataDeletion(requestId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error verifying and processing request:', error);
      return {
        success: false,
        error: 'Failed to process request'
      };
    }
  }

  /**
   * Process data export
   */
  private async processDataExport(requestId: string): Promise<void> {
    try {
      const { data: request } = await this.supabase
        .from('data_export_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request) return;

      const userId = request.user_id;
      const exportData = await this.collectUserData(userId);

      // Create export file
      const exportJson = JSON.stringify(exportData, null, 2);
      const fileName = `user_data_export_${userId}_${Date.now()}.json`;

      // Upload to secure storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('data-exports')
        .upload(fileName, exportJson, {
          contentType: 'application/json',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Generate signed URL (expires in 7 days)
      const { data: urlData } = await this.supabase.storage
        .from('data-exports')
        .createSignedUrl(fileName, 7 * 24 * 60 * 60);

      // Update request with download URL
      await this.supabase
        .from('data_export_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          download_url: urlData?.signedUrl,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', requestId);

    } catch (error) {
      console.error('Error processing data export:', error);
      
      // Update request status to failed
      await this.supabase
        .from('data_export_requests')
        .update({ status: 'failed' })
        .eq('id', requestId);
    }
  }

  /**
   * Process data deletion
   */
  private async processDataDeletion(requestId: string): Promise<void> {
    try {
      const { data: request } = await this.supabase
        .from('data_export_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request) return;

      const userId = request.user_id;

      // Delete user data from all tables
      const tables = [
        'user_profiles',
        'profile_analyses',
        'conversation_coaching',
        'tier_usage',
        'user_analytics',
        'sync_data',
        'device_sync_status',
        'user_privacy_settings',
        'consent_records',
        'data_processing_records'
      ];

      for (const table of tables) {
        await this.supabase
          .from(table)
          .delete()
          .eq('user_id', userId);
      }

      // Delete auth user
      await this.supabase.auth.admin.deleteUser(userId);

      // Update request status
      await this.supabase
        .from('data_export_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

    } catch (error) {
      console.error('Error processing data deletion:', error);
      
      // Update request status to failed
      await this.supabase
        .from('data_export_requests')
        .update({ status: 'failed' })
        .eq('id', requestId);
    }
  }

  /**
   * Collect all user data for export
   */
  private async collectUserData(userId: string): Promise<any> {
    const userData = {
      exportInfo: {
        userId,
        exportDate: new Date().toISOString(),
        dataTypes: []
      },
      personalData: {},
      activityData: {},
      settingsData: {},
      consentData: {}
    };

    try {
      // User profile
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId);
      
      if (profile) {
        userData.personalData.profile = profile;
        userData.exportInfo.dataTypes.push('profile');
      }

      // Profile analyses
      const { data: analyses } = await this.supabase
        .from('profile_analyses')
        .select('*')
        .eq('user_id', userId);
      
      if (analyses) {
        userData.activityData.profileAnalyses = analyses;
        userData.exportInfo.dataTypes.push('profileAnalyses');
      }

      // Conversation coaching
      const { data: coaching } = await this.supabase
        .from('conversation_coaching')
        .select('*')
        .eq('user_id', userId);
      
      if (coaching) {
        userData.activityData.conversationCoaching = coaching;
        userData.exportInfo.dataTypes.push('conversationCoaching');
      }

      // Tier usage
      const { data: usage } = await this.supabase
        .from('tier_usage')
        .select('*')
        .eq('user_id', userId);
      
      if (usage) {
        userData.activityData.tierUsage = usage;
        userData.exportInfo.dataTypes.push('tierUsage');
      }

      // Privacy settings
      const { data: privacy } = await this.supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', userId);
      
      if (privacy) {
        userData.settingsData.privacy = privacy;
        userData.exportInfo.dataTypes.push('privacy');
      }

      // Consent records
      const { data: consents } = await this.supabase
        .from('consent_records')
        .select('*')
        .eq('user_id', userId);
      
      if (consents) {
        userData.consentData.records = consents;
        userData.exportInfo.dataTypes.push('consents');
      }

      return userData;
    } catch (error) {
      console.error('Error collecting user data:', error);
      throw error;
    }
  }

  /**
   * Create default privacy settings
   */
  private async createDefaultPrivacySettings(userId: string): Promise<PrivacySettings> {
    const defaultSettings: PrivacySettings = {
      userId,
      dataCollection: true,
      profileVisibility: 'private',
      conversationAnalysis: true,
      marketingEmails: false,
      analyticsTracking: true,
      dataRetentionDays: 365,
      shareWithPartners: false,
      locationTracking: false,
      personalizedAds: false,
      thirdPartyIntegrations: false,
      dataProcessingConsent: true,
      researchParticipation: false,
      updatedAt: new Date()
    };

    try {
      const { error } = await this.supabase
        .from('user_privacy_settings')
        .insert({
          user_id: defaultSettings.userId,
          data_collection: defaultSettings.dataCollection,
          profile_visibility: defaultSettings.profileVisibility,
          conversation_analysis: defaultSettings.conversationAnalysis,
          marketing_emails: defaultSettings.marketingEmails,
          analytics_tracking: defaultSettings.analyticsTracking,
          data_retention_days: defaultSettings.dataRetentionDays,
          share_with_partners: defaultSettings.shareWithPartners,
          location_tracking: defaultSettings.locationTracking,
          personalized_ads: defaultSettings.personalizedAds,
          third_party_integrations: defaultSettings.thirdPartyIntegrations,
          data_processing_consent: defaultSettings.dataProcessingConsent,
          research_participation: defaultSettings.researchParticipation,
          updated_at: defaultSettings.updatedAt.toISOString()
        });

      if (error) throw error;

      return defaultSettings;
    } catch (error) {
      console.error('Error creating default privacy settings:', error);
      throw error;
    }
  }

  /**
   * Update data processing based on settings
   */
  private async updateDataProcessingBasedOnSettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<void> {
    // If analytics tracking is disabled, anonymize existing analytics data
    if (settings.analyticsTracking === false) {
      await this.anonymizeUserData(userId, 'analytics_data');
    }

    // If conversation analysis is disabled, stop processing conversation data
    if (settings.conversationAnalysis === false) {
      await this.stopDataProcessing(userId, 'conversation_analysis');
    }

    // Update data retention periods
    if (settings.dataRetentionDays) {
      await this.updateDataRetention(userId, settings.dataRetentionDays);
    }
  }

  /**
   * Anonymize user data
   */
  private async anonymizeUserData(userId: string, dataType: string): Promise<void> {
    const rule = this.anonymizationRules.find(r => r.dataType === dataType);
    if (!rule) return;

    try {
      // Implementation would depend on specific data structure
      // This is a simplified example
      await this.supabase
        .from(dataType)
        .update({ anonymized: true, anonymized_at: new Date().toISOString() })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error anonymizing user data:', error);
    }
  }

  /**
   * Stop data processing for specific type
   */
  private async stopDataProcessing(userId: string, processingType: string): Promise<void> {
    try {
      await this.supabase
        .from('data_processing_records')
        .update({ 
          stopped: true, 
          stopped_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('processing_type', processingType);
    } catch (error) {
      console.error('Error stopping data processing:', error);
    }
  }

  /**
   * Update data retention period
   */
  private async updateDataRetention(userId: string, retentionDays: number): Promise<void> {
    try {
      await this.supabase
        .from('user_privacy_settings')
        .update({ 
          data_retention_days: retentionDays,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating data retention:', error);
    }
  }

  /**
   * Send verification email (mock implementation)
   */
  private async sendVerificationEmail(
    email: string,
    verificationCode: string,
    requestType: string
  ): Promise<void> {
    // In a real implementation, this would integrate with an email service
    console.log(`Verification email sent to ${email} for ${requestType} request`);
    console.log(`Verification code: ${verificationCode}`);
  }

  /**
   * Initialize compliance tasks
   */
  private initializeComplianceTasks(): void {
    // Run data retention cleanup daily
    setInterval(async () => {
      await this.runDataRetentionCleanup();
    }, 24 * 60 * 60 * 1000);

    // Clean expired export requests weekly
    setInterval(async () => {
      await this.cleanExpiredExportRequests();
    }, 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * Run data retention cleanup
   */
  private async runDataRetentionCleanup(): Promise<void> {
    try {
      // Get all users with custom retention periods
      const { data: users } = await this.supabase
        .from('user_privacy_settings')
        .select('user_id, data_retention_days');

      for (const user of users || []) {
        const cutoffDate = new Date(Date.now() - user.data_retention_days * 24 * 60 * 60 * 1000);
        
        // Delete old data based on retention period
        await this.supabase
          .from('user_analytics')
          .delete()
          .eq('user_id', user.user_id)
          .lt('created_at', cutoffDate.toISOString());
      }
    } catch (error) {
      console.error('Error running data retention cleanup:', error);
    }
  }

  /**
   * Clean expired export requests
   */
  private async cleanExpiredExportRequests(): Promise<void> {
    try {
      const now = new Date();
      
      // Delete expired export files and requests
      const { data: expiredRequests } = await this.supabase
        .from('data_export_requests')
        .select('*')
        .lt('expires_at', now.toISOString())
        .eq('status', 'completed');

      for (const request of expiredRequests || []) {
        if (request.download_url) {
          // Delete file from storage
          const fileName = request.download_url.split('/').pop();
          await this.supabase.storage
            .from('data-exports')
            .remove([fileName]);
        }
        
        // Delete request record
        await this.supabase
          .from('data_export_requests')
          .delete()
          .eq('id', request.id);
      }
    } catch (error) {
      console.error('Error cleaning expired export requests:', error);
    }
  }

  /**
   * Get privacy compliance report
   */
  public async getComplianceReport(): Promise<any> {
    try {
      const [
        { count: totalUsers },
        { count: activeConsents },
        { count: pendingRequests },
        { count: completedExports },
        { count: completedDeletions }
      ] = await Promise.all([
        this.supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        this.supabase.from('consent_records').select('*', { count: 'exact', head: true }).eq('granted', true),
        this.supabase.from('data_export_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        this.supabase.from('data_export_requests').select('*', { count: 'exact', head: true }).eq('request_type', 'export').eq('status', 'completed'),
        this.supabase.from('data_export_requests').select('*', { count: 'exact', head: true }).eq('request_type', 'deletion').eq('status', 'completed')
      ]);

      return {
        totalUsers,
        activeConsents,
        pendingRequests,
        completedExports,
        completedDeletions,
        complianceScore: this.calculateComplianceScore({
          totalUsers,
          activeConsents,
          pendingRequests
        })
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return null;
    }
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(metrics: any): number {
    let score = 100;
    
    // Deduct points for pending requests (should be processed quickly)
    if (metrics.pendingRequests > 0) {
      score -= Math.min(metrics.pendingRequests * 5, 30);
    }
    
    // Deduct points if consent rate is low
    const consentRate = metrics.totalUsers > 0 ? metrics.activeConsents / metrics.totalUsers : 1;
    if (consentRate < 0.8) {
      score -= (0.8 - consentRate) * 50;
    }
    
    return Math.max(score, 0);
  }
}

export default PrivacyManager;
export type { 
  PrivacySettings, 
  DataProcessingRecord, 
  ConsentRecord, 
  DataExportRequest, 
  AnonymizationRule 
};

