import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {supabase, callEdgeFunction} from '@/services/supabase';
import {useAuth} from './AuthContext';
import type {
  PricingPlan,
  SubscriptionTier,
  FeatureAccess,
  UsageTracking,
} from '@/types';
import {showToast} from '@/utils/toast';

interface SubscriptionContextType {
  currentPlan: PricingPlan | null;
  pricingPlans: PricingPlan[];
  isLoading: boolean;
  subscribe: (planId: SubscriptionTier) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  checkFeatureAccess: (featureName: string) => Promise<FeatureAccess>;
  trackUsage: (featureName: string) => Promise<void>;
  getUsageStats: () => Promise<Record<string, UsageTracking>>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'spark',
    name: 'Spark',
    price: 'Free',
    priceId: '',
    description: 'Perfect for getting started',
    features: [
      '5 AI analyses per month',
      'Photo feedback & tips',
      'Basic conversation analysis',
      'Confidence tracking',
      'Email support',
    ],
    cta: 'Get Started Free',
    monthlyAnalyses: 5,
    hasVoiceAnalysis: false,
    hasScreenMonitoring: false,
    hasSocialAnalytics: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19,
    priceId: 'price_premium_monthly',
    description: 'Most popular choice',
    features: [
      '25 AI analyses per month',
      'Advanced photo optimization',
      'Detailed conversation coaching',
      'Screen monitoring alerts',
      'Real-time chat suggestions',
      'Goal tracking & milestones',
      'Priority support',
    ],
    popular: true,
    cta: 'Start Premium',
    monthlyAnalyses: 25,
    hasVoiceAnalysis: false,
    hasScreenMonitoring: true,
    hasSocialAnalytics: false,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 49,
    priceId: 'price_elite_monthly',
    description: 'Ultimate dating success',
    features: [
      '100 AI analyses per month',
      'Voice confidence coaching',
      'Social media profile analysis',
      'Background verification tools',
      'Advanced psychology insights',
      'Personal dating strategy',
      'Weekly 1-on-1 coaching calls',
      'VIP support',
    ],
    cta: 'Go Elite',
    monthlyAnalyses: 100,
    hasVoiceAnalysis: true,
    hasScreenMonitoring: true,
    hasSocialAnalytics: true,
  },
];

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const {user, isAuthenticated} = useAuth();
  const [currentPlan, setCurrentPlan] = useState<PricingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadCurrentPlan();
    }
  }, [isAuthenticated, user]);

  const loadCurrentPlan = () => {
    if (!user) return;
    
    const plan = PRICING_PLANS.find(p => p.id === user.subscription_tier);
    setCurrentPlan(plan || PRICING_PLANS[0]);
  };

  const subscribe = async (planId: SubscriptionTier): Promise<void> => {
    if (!user || planId === 'spark') return;

    try {
      setIsLoading(true);
      const plan = PRICING_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Invalid plan');

      const {data, error} = await callEdgeFunction('create-subscription', {
        priceId: plan.priceId,
        userId: user.id,
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout URL in browser
        // In a real app, you would use in-app purchase or web view
        showToast('Redirecting to payment...', 'info');
        // Linking.openURL(data.url);
      }
    } catch (error: any) {
      console.error('Subscribe error:', error);
      showToast(error.message || 'Failed to start subscription', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async (): Promise<void> => {
    if (!user || user.subscription_tier === 'spark') return;

    try {
      setIsLoading(true);
      // Implement subscription cancellation logic
      showToast('Subscription cancelled', 'success');
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      showToast(error.message || 'Failed to cancel subscription', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkFeatureAccess = async (
    featureName: string,
  ): Promise<FeatureAccess> => {
    if (!user || !currentPlan) {
      return {
        canUseFeature: false,
        hasReachedLimit: true,
        usageCount: 0,
        maxUsage: 0,
        requiresUpgrade: true,
        upgradeMessage: 'Please sign in to use this feature',
      };
    }

    try {
      // Get current month's usage
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const {data: usage} = await supabase
        .from('usage_tracking')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('feature_used', featureName)
        .eq('month_year', currentMonth)
        .single();

      const usageCount = usage?.usage_count || 0;
      const maxUsage = getFeatureLimit(featureName, currentPlan);
      const hasReachedLimit = usageCount >= maxUsage;

      // Check feature availability based on tier
      let canUseFeature = true;
      let upgradeMessage: string | undefined;

      if (featureName === 'voice_analysis' && !currentPlan.hasVoiceAnalysis) {
        canUseFeature = false;
        upgradeMessage = 'Voice analysis is available in Elite plan';
      } else if (
        featureName === 'screen_monitoring' &&
        !currentPlan.hasScreenMonitoring
      ) {
        canUseFeature = false;
        upgradeMessage = 'Screen monitoring is available in Premium and Elite plans';
      } else if (
        featureName === 'social_analytics' &&
        !currentPlan.hasSocialAnalytics
      ) {
        canUseFeature = false;
        upgradeMessage = 'Social analytics is available in Elite plan';
      }

      return {
        canUseFeature: canUseFeature && !hasReachedLimit,
        hasReachedLimit,
        usageCount,
        maxUsage,
        requiresUpgrade: !canUseFeature || hasReachedLimit,
        upgradeMessage,
      };
    } catch (error) {
      console.error('Check feature access error:', error);
      return {
        canUseFeature: false,
        hasReachedLimit: true,
        usageCount: 0,
        maxUsage: 0,
        requiresUpgrade: true,
        upgradeMessage: 'Error checking feature access',
      };
    }
  };

  const trackUsage = async (featureName: string): Promise<void> => {
    if (!user) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Use upsert to increment usage or create new record
      const {error} = await supabase.rpc('increment_usage', {
        p_user_id: user.id,
        p_feature_used: featureName,
        p_month_year: currentMonth,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Track usage error:', error);
    }
  };

  const getUsageStats = async (): Promise<Record<string, UsageTracking>> => {
    if (!user) return {};

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const {data, error} = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', currentMonth);

      if (error) throw error;

      const usageMap: Record<string, UsageTracking> = {};
      data?.forEach(usage => {
        usageMap[usage.feature_used] = usage;
      });

      return usageMap;
    } catch (error) {
      console.error('Get usage stats error:', error);
      return {};
    }
  };

  const refreshSubscription = async (): Promise<void> => {
    if (!user) return;

    try {
      setIsLoading(true);
      // Reload user data to get latest subscription info
      const {data, error} = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      // Update user context and reload plan
      loadCurrentPlan();
    } catch (error) {
      console.error('Refresh subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureLimit = (
    featureName: string,
    plan: PricingPlan,
  ): number => {
    const analysisFeatures = [
      'photo_analysis',
      'conversation_analysis',
      'voice_analysis',
    ];
    
    if (analysisFeatures.includes(featureName)) {
      return plan.monthlyAnalyses;
    }
    
    return 1000; // Default high limit for other features
  };

  const value: SubscriptionContextType = {
    currentPlan,
    pricingPlans: PRICING_PLANS,
    isLoading,
    subscribe,
    cancelSubscription,
    checkFeatureAccess,
    trackUsage,
    getUsageStats,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};