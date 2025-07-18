import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { AnalyticsService } from './AnalyticsService';
import { 
  UserTier, 
  TierLimits, 
  UsageRecord, 
  TierCheckResult,
  UpgradePrompt,
  TierFeature 
} from '../types';

export class TierService {
  private static instance: TierService;
  private currentTier: UserTier | null = null;
  private tierLimits: TierLimits | null = null;
  private usageCache: Map<string, UsageRecord[]> = new Map();
  private lastSyncTime: number = 0;
  private syncInterval: number = 5 * 60 * 1000; // 5 minutes

  // Singleton pattern
  public static getInstance(): TierService {
    if (!TierService.instance) {
      TierService.instance = new TierService();
    }
    return TierService.instance;
  }

  // Initialize tier service
  public async initialize(userId: string): Promise<void> {
    try {
      await this.loadTierData(userId);
      await this.syncUsageData(userId);
      this.startPeriodicSync(userId);
    } catch (error) {
      console.error('TierService initialization error:', error);
      throw new Error('Failed to initialize tier service');
    }
  }

  // Load user tier data
  private async loadTierData(userId: string): Promise<void> {
    try {
      // Try to load from cache first
      const cachedTier = await AsyncStorage.getItem(`tier_${userId}`);
      if (cachedTier) {
        this.currentTier = JSON.parse(cachedTier);
      }

      // Fetch latest from server
      const { data: tierData, error } = await supabase
        .from('user_tiers')
        .select(`
          *,
          tier_limits (*)
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      this.currentTier = {
        id: tierData.id,
        userId: tierData.user_id,
        tierName: tierData.tier_name,
        subscriptionStatus: tierData.subscription_status,
        subscriptionStart: new Date(tierData.subscription_start),
        subscriptionEnd: tierData.subscription_end ? new Date(tierData.subscription_end) : null,
        autoRenew: tierData.auto_renew,
        paymentMethod: tierData.payment_method,
        createdAt: new Date(tierData.created_at),
        updatedAt: new Date(tierData.updated_at)
      };

      this.tierLimits = tierData.tier_limits;

      // Cache the tier data
      await AsyncStorage.setItem(`tier_${userId}`, JSON.stringify(this.currentTier));

      AnalyticsService.track('tier_data_loaded', {
        tierName: this.currentTier.tierName,
        subscriptionStatus: this.currentTier.subscriptionStatus
      });

    } catch (error) {
      console.error('Error loading tier data:', error);
      
      // Fallback to free tier if error
      this.currentTier = {
        id: 'temp',
        userId,
        tierName: 'free',
        subscriptionStatus: 'active',
        subscriptionStart: new Date(),
        subscriptionEnd: null,
        autoRenew: false,
        paymentMethod: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.tierLimits = this.getDefaultTierLimits('free');
    }
  }

  // Sync usage data with server
  private async syncUsageData(userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: usageData, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .gte('date', today);

      if (error) {
        throw error;
      }

      // Group usage by feature
      const usageByFeature = usageData.reduce((acc, record) => {
        if (!acc[record.feature_type]) {
          acc[record.feature_type] = [];
        }
        acc[record.feature_type].push({
          id: record.id,
          userId: record.user_id,
          featureType: record.feature_type,
          usageCount: record.usage_count,
          date: new Date(record.date),
          metadata: record.metadata,
          createdAt: new Date(record.created_at)
        });
        return acc;
      }, {} as Record<string, UsageRecord[]>);

      // Update cache
      Object.entries(usageByFeature).forEach(([feature, records]) => {
        this.usageCache.set(feature, records);
      });

      this.lastSyncTime = Date.now();

      AnalyticsService.track('usage_data_synced', {
        featuresCount: Object.keys(usageByFeature).length,
        totalUsage: usageData.length
      });

    } catch (error) {
      console.error('Error syncing usage data:', error);
    }
  }

  // Start periodic sync
  private startPeriodicSync(userId: string): void {
    setInterval(async () => {
      if (Date.now() - this.lastSyncTime > this.syncInterval) {
        await this.syncUsageData(userId);
      }
    }, this.syncInterval);
  }

  // Check if user can access a feature
  public async checkTierAccess(feature: TierFeature, userId?: string): Promise<TierCheckResult> {
    try {
      if (!this.currentTier || !this.tierLimits) {
        throw new Error('Tier data not loaded');
      }

      const today = new Date().toISOString().split('T')[0];
      const currentUsage = await this.getCurrentUsage(feature, today);
      const limit = this.getFeatureLimit(feature);

      // Check if feature is available for current tier
      if (!this.isFeatureAvailable(feature)) {
        return {
          allowed: false,
          reason: 'feature_not_available',
          currentUsage: 0,
          limit: 0,
          upgradePrompt: this.getUpgradePrompt(feature),
          requiredTier: this.getRequiredTier(feature)
        };
      }

      // Check usage limits
      if (limit !== -1 && currentUsage >= limit) {
        return {
          allowed: false,
          reason: 'limit_exceeded',
          currentUsage,
          limit,
          upgradePrompt: this.getUpgradePrompt(feature),
          requiredTier: this.getNextTier()
        };
      }

      // Check subscription status
      if (!this.isSubscriptionActive()) {
        return {
          allowed: false,
          reason: 'subscription_expired',
          currentUsage,
          limit,
          upgradePrompt: this.getSubscriptionRenewalPrompt(),
          requiredTier: this.currentTier.tierName
        };
      }

      return {
        allowed: true,
        reason: 'access_granted',
        currentUsage,
        limit,
        remainingUsage: limit === -1 ? -1 : limit - currentUsage
      };

    } catch (error) {
      console.error('Error checking tier access:', error);
      
      // Fallback to deny access on error
      return {
        allowed: false,
        reason: 'error',
        currentUsage: 0,
        limit: 0,
        upgradePrompt: 'Unable to verify access. Please try again.',
        requiredTier: 'premium'
      };
    }
  }

  // Update usage for a feature
  public async updateUsage(
    feature: TierFeature, 
    count: number = 1, 
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      if (!this.currentTier) {
        throw new Error('Tier data not loaded');
      }

      const today = new Date().toISOString().split('T')[0];
      const userId = this.currentTier.userId;

      // Update server
      const { error } = await supabase
        .from('usage_tracking')
        .upsert({
          user_id: userId,
          feature_type: feature,
          usage_count: count,
          date: today,
          metadata: metadata || {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,feature_type,date'
        });

      if (error) {
        throw error;
      }

      // Update local cache
      const existingUsage = this.usageCache.get(feature) || [];
      const todayUsage = existingUsage.find(u => 
        u.date.toISOString().split('T')[0] === today
      );

      if (todayUsage) {
        todayUsage.usageCount += count;
        if (metadata) {
          todayUsage.metadata = { ...todayUsage.metadata, ...metadata };
        }
      } else {
        existingUsage.push({
          id: `temp_${Date.now()}`,
          userId,
          featureType: feature,
          usageCount: count,
          date: new Date(),
          metadata: metadata || {},
          createdAt: new Date()
        });
      }

      this.usageCache.set(feature, existingUsage);

      AnalyticsService.track('usage_updated', {
        feature,
        count,
        totalUsage: todayUsage ? todayUsage.usageCount : count,
        tier: this.currentTier.tierName
      });

    } catch (error) {
      console.error('Error updating usage:', error);
      throw new Error('Failed to update usage');
    }
  }

  // Get current usage for a feature
  public async getCurrentUsage(feature: TierFeature, date?: string): Promise<number> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const usage = this.usageCache.get(feature) || [];
    
    const todayUsage = usage.find(u => 
      u.date.toISOString().split('T')[0] === targetDate
    );

    return todayUsage ? todayUsage.usageCount : 0;
  }

  // Get feature limit for current tier
  private getFeatureLimit(feature: TierFeature): number {
    if (!this.tierLimits) {
      return this.getDefaultTierLimits(this.currentTier?.tierName || 'free')[feature] || 0;
    }

    switch (feature) {
      case 'screenshot':
        return this.tierLimits.screenshotAnalysisDaily;
      case 'conversation':
        return this.tierLimits.conversationAnalysisDaily;
      case 'photo':
        return this.tierLimits.photoAnalysisDaily;
      case 'voice':
        return this.tierLimits.voiceAnalysisDaily;
      case 'keyboard':
        return this.tierLimits.keyboardSuggestionsDaily;
      case 'browser_extension':
        return this.tierLimits.browserExtensionDaily;
      default:
        return 0;
    }
  }

  // Check if feature is available for current tier
  private isFeatureAvailable(feature: TierFeature): boolean {
    const tierName = this.currentTier?.tierName || 'free';
    
    const featureAvailability = {
      free: ['screenshot', 'conversation', 'photo'],
      premium: ['screenshot', 'conversation', 'photo', 'voice', 'keyboard', 'browser_extension'],
      pro: ['screenshot', 'conversation', 'photo', 'voice', 'keyboard', 'browser_extension']
    };

    return featureAvailability[tierName as keyof typeof featureAvailability]?.includes(feature) || false;
  }

  // Check if subscription is active
  private isSubscriptionActive(): boolean {
    if (!this.currentTier) return false;
    
    if (this.currentTier.tierName === 'free') return true;
    
    if (this.currentTier.subscriptionStatus !== 'active') return false;
    
    if (this.currentTier.subscriptionEnd && this.currentTier.subscriptionEnd < new Date()) {
      return false;
    }
    
    return true;
  }

  // Get upgrade prompt for feature
  private getUpgradePrompt(feature: TierFeature): string {
    const currentTier = this.currentTier?.tierName || 'free';
    
    const prompts = {
      screenshot: {
        free: 'Upgrade to Premium for unlimited screenshot analysis with advanced insights!',
        premium: 'Upgrade to Pro for complete profile reconstruction and predictive modeling!'
      },
      conversation: {
        free: 'Unlock unlimited conversation analysis with Premium - get better dating results!',
        premium: 'Pro tier offers advanced conversation strategies and success prediction!'
      },
      photo: {
        free: 'Premium gives you unlimited photo analysis plus advanced attractiveness scoring!',
        premium: 'Pro includes professional photo coaching and optimization recommendations!'
      },
      voice: {
        free: 'Voice analysis is a Premium feature - upgrade for tone and confidence coaching!',
        premium: 'Pro offers advanced voice coaching with accent and delivery optimization!'
      },
      keyboard: {
        free: 'AI keyboard suggestions require Premium - get real-time message improvements!',
        premium: 'Pro keyboard includes advanced context awareness and personality matching!'
      },
      browser_extension: {
        free: 'Browser extension is Premium-only - get real-time coaching while you date!',
        premium: 'Pro browser extension offers predictive analysis and success optimization!'
      }
    };

    return prompts[feature]?.[currentTier as keyof typeof prompts[typeof feature]] || 
           'Upgrade for access to this premium feature!';
  }

  // Get required tier for feature
  private getRequiredTier(feature: TierFeature): string {
    const premiumFeatures = ['voice', 'keyboard', 'browser_extension'];
    return premiumFeatures.includes(feature) ? 'premium' : 'free';
  }

  // Get next tier
  private getNextTier(): string {
    const currentTier = this.currentTier?.tierName || 'free';
    
    const tierProgression = {
      free: 'premium',
      premium: 'pro',
      pro: 'pro'
    };

    return tierProgression[currentTier as keyof typeof tierProgression] || 'premium';
  }

  // Get subscription renewal prompt
  private getSubscriptionRenewalPrompt(): string {
    return 'Your subscription has expired. Renew now to continue enjoying premium features!';
  }

  // Get default tier limits
  private getDefaultTierLimits(tierName: string): Record<string, number> {
    const limits = {
      free: {
        screenshot: 3,
        conversation: 3,
        photo: 3,
        voice: 0,
        keyboard: 0,
        browser_extension: 0
      },
      premium: {
        screenshot: -1, // unlimited
        conversation: -1,
        photo: -1,
        voice: -1,
        keyboard: -1,
        browser_extension: -1
      },
      pro: {
        screenshot: -1,
        conversation: -1,
        photo: -1,
        voice: -1,
        keyboard: -1,
        browser_extension: -1
      }
    };

    return limits[tierName as keyof typeof limits] || limits.free;
  }

  // Get current tier info
  public getCurrentTier(): UserTier | null {
    return this.currentTier;
  }

  // Get tier limits
  public getTierLimits(): TierLimits | null {
    return this.tierLimits;
  }

  // Get usage summary
  public async getUsageSummary(date?: string): Promise<Record<TierFeature, number>> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const features: TierFeature[] = ['screenshot', 'conversation', 'photo', 'voice', 'keyboard', 'browser_extension'];
    
    const summary: Record<TierFeature, number> = {} as Record<TierFeature, number>;
    
    for (const feature of features) {
      summary[feature] = await this.getCurrentUsage(feature, targetDate);
    }
    
    return summary;
  }

  // Upgrade tier
  public async upgradeTier(newTier: string, paymentMethod?: string): Promise<boolean> {
    try {
      if (!this.currentTier) {
        throw new Error('Current tier not loaded');
      }

      const { error } = await supabase
        .from('user_tiers')
        .update({
          tier_name: newTier,
          subscription_status: 'active',
          subscription_start: new Date().toISOString(),
          subscription_end: this.calculateSubscriptionEnd(newTier),
          payment_method: paymentMethod,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.currentTier.userId);

      if (error) {
        throw error;
      }

      // Reload tier data
      await this.loadTierData(this.currentTier.userId);

      AnalyticsService.track('tier_upgraded', {
        fromTier: this.currentTier.tierName,
        toTier: newTier,
        paymentMethod
      });

      return true;

    } catch (error) {
      console.error('Error upgrading tier:', error);
      return false;
    }
  }

  // Calculate subscription end date
  private calculateSubscriptionEnd(tierName: string): string | null {
    if (tierName === 'free') return null;
    
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription
    return endDate.toISOString();
  }

  // Clear cache
  public clearCache(): void {
    this.usageCache.clear();
    this.currentTier = null;
    this.tierLimits = null;
    this.lastSyncTime = 0;
  }
}

export default TierService.getInstance();

