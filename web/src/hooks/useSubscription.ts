import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Subscription, SubscriptionTier, PricingPlan } from '@/types'
import toast from 'react-hot-toast'

// Pricing plans configuration
const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'spark',
    name: 'Spark',
    price: 'Free',
    priceId: '', // Free plan doesn't need Stripe price ID
    description: 'Perfect for getting started',
    features: [
      '5 AI analyses per month',
      'Photo feedback & tips',
      'Basic conversation analysis',
      'Confidence tracking',
      'Email support'
    ],
    cta: 'Get Started Free'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19,
    priceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    description: 'Most popular choice',
    features: [
      '25 AI analyses per month',
      'Advanced photo optimization',
      'Detailed conversation coaching',
      'Screen monitoring alerts',
      'Real-time chat suggestions',
      'Goal tracking & milestones',
      'Priority support'
    ],
    popular: true,
    cta: 'Start Premium'
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 49,
    priceId: 'price_elite_monthly', // Replace with actual Stripe price ID
    description: 'Ultimate dating success',
    features: [
      '100 AI analyses per month',
      'Voice confidence coaching',
      'Social media profile analysis',
      'Background verification tools',
      'Advanced psychology insights',
      'Personal dating strategy',
      'Weekly 1-on-1 coaching calls',
      'VIP support'
    ],
    cta: 'Go Elite'
  }
]

export function useSubscription() {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()

  // Get current subscription
  const subscriptionQuery = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .maybeSingle()

      if (error) throw error
      return data as Subscription | null
    },
    enabled: !!user
  })

  // Create subscription
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { planType: SubscriptionTier; priceId: string }) => {
      if (!user) throw new Error('User not logged in')

      const { data: response, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId: data.priceId,
          customerEmail: user.email,
          customerName: user.full_name || '',
          planType: data.planType
        }
      })

      if (error) throw error
      return response.data
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success('Redirecting to payment...')
        window.location.href = data.checkoutUrl
      } else {
        toast.success('Subscription created successfully!')
        queryClient.invalidateQueries({ queryKey: ['subscription'] })
        refreshUser()
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create subscription')
    }
  })

  // Handle subscription upgrade
  const handleSubscribe = async (planType: SubscriptionTier) => {
    if (!user) {
      toast.error('Please sign in to subscribe')
      return
    }

    const plan = PRICING_PLANS.find(p => p.id === planType)
    if (!plan) {
      toast.error('Invalid plan selected')
      return
    }

    // Free plan - just update user tier
    if (planType === 'spark') {
      try {
        await supabase
          .from('users')
          .update({ 
            subscription_tier: 'spark',
            monthly_limit: 5,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        toast.success('Plan updated successfully!')
        refreshUser()
        queryClient.invalidateQueries({ queryKey: ['subscription'] })
      } catch (error: any) {
        toast.error(error.message || 'Failed to update plan')
      }
      return
    }

    if (!plan.priceId) {
      toast.error('This plan is not available for subscription yet')
      return
    }

    createSubscriptionMutation.mutate({
      planType,
      priceId: plan.priceId
    })
  }

  // Get plan features
  const getCurrentPlanFeatures = () => {
    const currentPlan = PRICING_PLANS.find(p => p.id === user?.subscription_tier) || PRICING_PLANS[0]
    return currentPlan.features
  }

  // Check if user can upgrade
  const canUpgradeTo = (planType: SubscriptionTier) => {
    if (!user) return true
    
    const currentTierIndex = PRICING_PLANS.findIndex(p => p.id === user.subscription_tier)
    const targetTierIndex = PRICING_PLANS.findIndex(p => p.id === planType)
    
    return targetTierIndex > currentTierIndex
  }

  // Get recommended upgrade
  const getRecommendedUpgrade = () => {
    if (!user || user.subscription_tier === 'elite') return null
    
    const currentTierIndex = PRICING_PLANS.findIndex(p => p.id === user.subscription_tier)
    return PRICING_PLANS[currentTierIndex + 1] || null
  }

  // Check subscription status
  const getSubscriptionStatus = () => {
    if (!user) return { isActive: false, isExpired: false, daysLeft: 0 }
    
    const subscription = subscriptionQuery.data
    if (!subscription) {
      return { isActive: user.subscription_tier !== 'spark', isExpired: false, daysLeft: 0 }
    }

    const now = new Date()
    const endDate = subscription.current_period_end ? new Date(subscription.current_period_end) : null
    
    if (!endDate) {
      return { isActive: false, isExpired: false, daysLeft: 0 }
    }

    const isActive = subscription.status === 'active' && now < endDate
    const isExpired = now >= endDate
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    return { isActive, isExpired, daysLeft }
  }

  // Usage and limits
  const getUsageLimits = () => {
    if (!user) return { used: 0, limit: 5, percentage: 0, canUse: false }
    
    const used = user.usage_count
    const limit = user.monthly_limit
    const percentage = Math.min(100, (used / limit) * 100)
    const canUse = used < limit

    return { used, limit, percentage, canUse }
  }

  return {
    // Data
    subscription: subscriptionQuery.data,
    pricingPlans: PRICING_PLANS,
    currentPlan: PRICING_PLANS.find(p => p.id === user?.subscription_tier) || PRICING_PLANS[0],
    
    // Status
    isLoading: subscriptionQuery.isLoading || createSubscriptionMutation.isPending,
    subscriptionStatus: getSubscriptionStatus(),
    usageLimits: getUsageLimits(),
    
    // Actions
    handleSubscribe,
    canUpgradeTo,
    
    // Utilities
    getCurrentPlanFeatures,
    getRecommendedUpgrade,
    
    // Error
    error: subscriptionQuery.error || createSubscriptionMutation.error
  }
}

// Hook for handling subscription success/cancel redirects
export function useSubscriptionRedirect() {
  const { refreshUser } = useAuth()
  const queryClient = useQueryClient()

  // Handle subscription success/cancel from URL params
  const handleSubscriptionRedirect = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const subscriptionStatus = urlParams.get('subscription')
    const sessionId = urlParams.get('session_id')

    if (subscriptionStatus === 'success' && sessionId) {
      toast.success('🎉 Subscription activated successfully! Welcome to your new plan!')
      refreshUser()
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (subscriptionStatus === 'cancelled') {
      toast.error('Subscription cancelled. You can try again anytime!')
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }

  return { handleSubscriptionRedirect }
}

// Hook for subscription-gated features
export function useFeatureGate() {
  const { user } = useAuth()
  const { getRecommendedUpgrade } = useSubscription()

  const checkFeatureAccess = (requiredTier: SubscriptionTier) => {
    if (!user) return { hasAccess: false, shouldUpgrade: true, requiredTier }
    
    const tierLevels = { spark: 0, premium: 1, elite: 2 }
    const userLevel = tierLevels[user.subscription_tier]
    const requiredLevel = tierLevels[requiredTier]
    
    const hasAccess = userLevel >= requiredLevel
    const shouldUpgrade = !hasAccess
    
    return { hasAccess, shouldUpgrade, requiredTier }
  }

  const requireTier = (requiredTier: SubscriptionTier) => {
    const access = checkFeatureAccess(requiredTier)
    
    if (!access.hasAccess) {
      const upgrade = getRecommendedUpgrade()
      toast.error(
        `This feature requires ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} tier. ${
          upgrade ? `Upgrade to ${upgrade.name} for $${upgrade.price}/month.` : 'Please upgrade your plan.'
        }`
      )
      return false
    }
    
    return true
  }

  return {
    checkFeatureAccess,
    requireTier,
    hasEliteAccess: () => checkFeatureAccess('elite').hasAccess,
    hasPremiumAccess: () => checkFeatureAccess('premium').hasAccess
  }
}
