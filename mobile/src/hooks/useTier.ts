import { useState, useEffect, useCallback, useContext } from 'react';
import { Alert } from 'react-native';
import TierService from '../services/TierService';
import { AnalyticsService } from '../services/AnalyticsService';
import { AuthContext } from '../contexts/AuthContext';
import {
  UserTier,
  TierLimits,
  TierCheckResult,
  TierFeature,
  UsageRecord
} from '../types';

interface UseTierReturn {
  // State
  tier: UserTier | null;
  tierLimits: TierLimits | null;
  loading: boolean;
  error: string | null;
  
  // Usage tracking
  usageSummary: Record<TierFeature, number>;
  
  // Actions
  checkTierAccess: (feature: TierFeature) => Promise<TierCheckResult>;
  updateUsage: (feature: TierFeature, count?: number, metadata?: Record<string, any>) => Promise<void>;
  refreshTierData: () => Promise<void>;
  upgradeTier: (newTier: string, paymentMethod?: string) => Promise<boolean>;
  
  // Utilities
  canUseFeature: (feature: TierFeature) => boolean;
  getRemainingUsage: (feature: TierFeature) => Promise<number>;
  getUpgradePrompt: (feature: TierFeature) => string;
  isFeatureUnlimited: (feature: TierFeature) => boolean;
}

export const useTier = (): UseTierReturn => {
  // State
  const [tier, setTier] = useState<UserTier | null>(null);
  const [tierLimits, setTierLimits] = useState<TierLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageSummary, setUsageSummary] = useState<Record<TierFeature, number>>({
    screenshot: 0,
    conversation: 0,
    photo: 0,
    voice: 0,
    keyboard: 0,
    browser_extension: 0
  });

  // Context
  const { user } = useContext(AuthContext);

  // Initialize tier service
  useEffect(() => {
    if (user?.id) {
      initializeTierService();
    }
  }, [user?.id]);

  // Initialize tier service
  const initializeTierService = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await TierService.initialize(user!.id);
      
      // Load initial data
      const currentTier = TierService.getCurrentTier();
      const limits = TierService.getTierLimits();
      const usage = await TierService.getUsageSummary();

      setTier(currentTier);
      setTierLimits(limits);
      setUsageSummary(usage);

      AnalyticsService.track('tier_hook_initialized', {
        tierName: currentTier?.tierName,
        userId: user!.id
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize tier service';
      setError(errorMessage);
      console.error('Tier initialization error:', err);
      
      AnalyticsService.track('tier_initialization_error', {
        error: errorMessage,
        userId: user?.id
      });

    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Check tier access for a feature
  const checkTierAccess = useCallback(async (feature: TierFeature): Promise<TierCheckResult> => {
    try {
      const result = await TierService.checkTierAccess(feature, user?.id);
      
      AnalyticsService.track('tier_access_checked', {
        feature,
        allowed: result.allowed,
        reason: result.reason,
        currentTier: tier?.tierName
      });

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check tier access';
      console.error('Tier access check error:', err);
      
      return {
        allowed: false,
        reason: 'error',
        currentUsage: 0,
        limit: 0,
        upgradePrompt: 'Unable to verify access. Please try again.',
        requiredTier: 'premium'
      };
    }
  }, [tier?.tierName, user?.id]);

  // Update usage for a feature
  const updateUsage = useCallback(async (
    feature: TierFeature, 
    count: number = 1, 
    metadata?: Record<string, any>
  ): Promise<void> => {
    try {
      await TierService.updateUsage(feature, count, metadata);
      
      // Refresh usage summary
      const newUsage = await TierService.getUsageSummary();
      setUsageSummary(newUsage);

      AnalyticsService.track('usage_updated_via_hook', {
        feature,
        count,
        newTotal: newUsage[feature],
        tier: tier?.tierName
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update usage';
      console.error('Usage update error:', err);
      
      AnalyticsService.track('usage_update_error', {
        feature,
        count,
        error: errorMessage
      });

      throw new Error(errorMessage);
    }
  }, [tier?.tierName]);

  // Refresh tier data
  const refreshTierData = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Clear cache and reinitialize
      TierService.clearCache();
      await TierService.initialize(user.id);
      
      // Reload data
      const currentTier = TierService.getCurrentTier();
      const limits = TierService.getTierLimits();
      const usage = await TierService.getUsageSummary();

      setTier(currentTier);
      setTierLimits(limits);
      setUsageSummary(usage);

      AnalyticsService.track('tier_data_refreshed', {
        tierName: currentTier?.tierName,
        userId: user.id
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh tier data';
      setError(errorMessage);
      console.error('Tier refresh error:', err);

    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Upgrade tier
  const upgradeTier = useCallback(async (
    newTier: string, 
    paymentMethod?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      
      const success = await TierService.upgradeTier(newTier, paymentMethod);
      
      if (success) {
        // Refresh data after upgrade
        await refreshTierData();
        
        Alert.alert(
          'Upgrade Successful!',
          `Welcome to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}! You now have access to all premium features.`,
          [{ text: 'Great!', style: 'default' }]
        );

        AnalyticsService.track('tier_upgrade_successful', {
          fromTier: tier?.tierName,
          toTier: newTier,
          paymentMethod
        });

      } else {
        Alert.alert(
          'Upgrade Failed',
          'Unable to process your upgrade. Please try again or contact support.',
          [{ text: 'OK', style: 'default' }]
        );

        AnalyticsService.track('tier_upgrade_failed', {
          fromTier: tier?.tierName,
          toTier: newTier,
          paymentMethod
        });
      }

      return success;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upgrade failed';
      console.error('Tier upgrade error:', err);
      
      Alert.alert(
        'Upgrade Error',
        errorMessage,
        [{ text: 'OK', style: 'default' }]
      );

      return false;

    } finally {
      setLoading(false);
    }
  }, [tier?.tierName, refreshTierData]);

  // Check if user can use a feature
  const canUseFeature = useCallback((feature: TierFeature): boolean => {
    if (!tier || !tierLimits) return false;

    const tierName = tier.tierName;
    
    // Feature availability by tier
    const featureAvailability = {
      free: ['screenshot', 'conversation', 'photo'],
      premium: ['screenshot', 'conversation', 'photo', 'voice', 'keyboard', 'browser_extension'],
      pro: ['screenshot', 'conversation', 'photo', 'voice', 'keyboard', 'browser_extension']
    };

    return featureAvailability[tierName as keyof typeof featureAvailability]?.includes(feature) || false;
  }, [tier, tierLimits]);

  // Get remaining usage for a feature
  const getRemainingUsage = useCallback(async (feature: TierFeature): Promise<number> => {
    if (!tierLimits) return 0;

    const currentUsage = usageSummary[feature] || 0;
    let limit = 0;

    switch (feature) {
      case 'screenshot':
        limit = tierLimits.screenshotAnalysisDaily;
        break;
      case 'conversation':
        limit = tierLimits.conversationAnalysisDaily;
        break;
      case 'photo':
        limit = tierLimits.photoAnalysisDaily;
        break;
      case 'voice':
        limit = tierLimits.voiceAnalysisDaily;
        break;
      case 'keyboard':
        limit = tierLimits.keyboardSuggestionsDaily;
        break;
      case 'browser_extension':
        limit = tierLimits.browserExtensionDaily;
        break;
    }

    // -1 means unlimited
    if (limit === -1) return -1;
    
    return Math.max(0, limit - currentUsage);
  }, [tierLimits, usageSummary]);

  // Get upgrade prompt for a feature
  const getUpgradePrompt = useCallback((feature: TierFeature): string => {
    const currentTier = tier?.tierName || 'free';
    
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
  }, [tier?.tierName]);

  // Check if feature has unlimited usage
  const isFeatureUnlimited = useCallback((feature: TierFeature): boolean => {
    if (!tierLimits) return false;

    let limit = 0;
    switch (feature) {
      case 'screenshot':
        limit = tierLimits.screenshotAnalysisDaily;
        break;
      case 'conversation':
        limit = tierLimits.conversationAnalysisDaily;
        break;
      case 'photo':
        limit = tierLimits.photoAnalysisDaily;
        break;
      case 'voice':
        limit = tierLimits.voiceAnalysisDaily;
        break;
      case 'keyboard':
        limit = tierLimits.keyboardSuggestionsDaily;
        break;
      case 'browser_extension':
        limit = tierLimits.browserExtensionDaily;
        break;
    }

    return limit === -1;
  }, [tierLimits]);

  return {
    // State
    tier,
    tierLimits,
    loading,
    error,
    usageSummary,
    
    // Actions
    checkTierAccess,
    updateUsage,
    refreshTierData,
    upgradeTier,
    
    // Utilities
    canUseFeature,
    getRemainingUsage,
    getUpgradePrompt,
    isFeatureUnlimited
  };
};

export default useTier;

