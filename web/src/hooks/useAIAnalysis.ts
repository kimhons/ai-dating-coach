import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PhotoAnalysis, ConversationAnalysis, VoiceAnalysis, AIAnalysisRequest, SubscriptionTier } from '@/types'
import toast from 'react-hot-toast'

// Photo Analysis Hook
export function usePhotoAnalysis() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const uploadPhotoMutation = useMutation({
    mutationFn: async (data: { file: File; analysisType?: string }) => {
      if (!user) throw new Error('User not logged in')

      // Check usage limits
      if (user.usage_count >= user.monthly_limit) {
        throw new Error('Monthly usage limit reached. Please upgrade your plan.')
      }

      // Convert file to base64
      return new Promise<PhotoAnalysis>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = async () => {
          try {
            const base64Data = reader.result as string
            
            const { data: response, error } = await supabase.functions.invoke('photo-analysis', {
              body: {
                imageData: base64Data,
                fileName: data.file.name,
                analysisType: data.analysisType || 'comprehensive'
              }
            })

            if (error) throw error
            
            // Update usage count
            await supabase
              .from('users')
              .update({ usage_count: user.usage_count + 1 })
              .eq('id', user.id)

            resolve(response.data.analysis)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(data.file)
      })
    },
    onSuccess: (data) => {
      toast.success('Photo analysis completed!')
      queryClient.invalidateQueries({ queryKey: ['photo-analyses'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Photo analysis failed')
    }
  })

  const photoAnalysesQuery = useQuery({
    queryKey: ['photo-analyses', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('photo_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as PhotoAnalysis[]
    },
    enabled: !!user
  })

  return {
    uploadPhoto: uploadPhotoMutation.mutate,
    isUploading: uploadPhotoMutation.isPending,
    photoAnalyses: photoAnalysesQuery.data || [],
    isLoading: photoAnalysesQuery.isLoading,
    error: uploadPhotoMutation.error || photoAnalysesQuery.error
  }
}

// Conversation Analysis Hook
export function useConversationAnalysis() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const analyzeConversationMutation = useMutation({
    mutationFn: async (data: {
      conversationContent?: string
      screenshot?: File
      platform?: string
      conversationType: 'text' | 'screenshot'
    }) => {
      if (!user) throw new Error('User not logged in')

      if (user.usage_count >= user.monthly_limit) {
        throw new Error('Monthly usage limit reached. Please upgrade your plan.')
      }

      let screenshotData: string | undefined
      if (data.screenshot) {
        screenshotData = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(data.screenshot!)
        })
      }

      const { data: response, error } = await supabase.functions.invoke('conversation-analysis', {
        body: {
          conversationContent: data.conversationContent,
          screenshotData,
          platform: data.platform,
          conversationType: data.conversationType,
          inputMethod: data.screenshot ? 'upload' : 'text_input'
        }
      })

      if (error) throw error

      // Update usage count
      await supabase
        .from('users')
        .update({ usage_count: user.usage_count + 1 })
        .eq('id', user.id)

      return response.data.analysis
    },
    onSuccess: () => {
      toast.success('Conversation analysis completed!')
      queryClient.invalidateQueries({ queryKey: ['conversation-analyses'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Conversation analysis failed')
    }
  })

  const conversationAnalysesQuery = useQuery({
    queryKey: ['conversation-analyses', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('conversation_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ConversationAnalysis[]
    },
    enabled: !!user
  })

  return {
    analyzeConversation: analyzeConversationMutation.mutate,
    isAnalyzing: analyzeConversationMutation.isPending,
    conversationAnalyses: conversationAnalysesQuery.data || [],
    isLoading: conversationAnalysesQuery.isLoading,
    error: analyzeConversationMutation.error || conversationAnalysesQuery.error
  }
}

// Voice Analysis Hook (Elite tier only)
export function useVoiceAnalysis() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const analyzeVoiceMutation = useMutation({
    mutationFn: async (data: { audioFile: File; duration?: number }) => {
      if (!user) throw new Error('User not logged in')
      
      if (user.subscription_tier !== 'elite') {
        throw new Error('Voice analysis is only available for Elite tier subscribers')
      }

      if (user.usage_count >= user.monthly_limit) {
        throw new Error('Monthly usage limit reached. Please upgrade your plan.')
      }

      // Convert audio file to base64
      return new Promise<VoiceAnalysis>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = async () => {
          try {
            const base64Data = reader.result as string
            
            const { data: response, error } = await supabase.functions.invoke('voice-analysis', {
              body: {
                audioData: base64Data,
                fileName: data.audioFile.name,
                duration: data.duration
              }
            })

            if (error) throw error
            
            // Update usage count
            await supabase
              .from('users')
              .update({ usage_count: user.usage_count + 1 })
              .eq('id', user.id)

            resolve(response.data.analysis)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(data.audioFile)
      })
    },
    onSuccess: () => {
      toast.success('Voice analysis completed!')
      queryClient.invalidateQueries({ queryKey: ['voice-analyses'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Voice analysis failed')
    }
  })

  const voiceAnalysesQuery = useQuery({
    queryKey: ['voice-analyses', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('voice_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as VoiceAnalysis[]
    },
    enabled: !!user && user.subscription_tier === 'elite'
  })

  return {
    analyzeVoice: analyzeVoiceMutation.mutate,
    isAnalyzing: analyzeVoiceMutation.isPending,
    voiceAnalyses: voiceAnalysesQuery.data || [],
    isLoading: voiceAnalysesQuery.isLoading,
    error: analyzeVoiceMutation.error || voiceAnalysesQuery.error,
    isEliteTier: user?.subscription_tier === 'elite'
  }
}

// Usage Statistics Hook
export function useUsageStats() {
  const { user } = useAuth()

  const usageStatsQuery = useQuery({
    queryKey: ['usage-stats', user?.id],
    queryFn: async () => {
      if (!user) return null

      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .gte('usage_date', today)

      if (error) throw error

      const totalToday = data.reduce((sum, record) => sum + record.count, 0)
      const remaining = Math.max(0, user.monthly_limit - user.usage_count)
      const usagePercentage = (user.usage_count / user.monthly_limit) * 100

      return {
        usedToday: totalToday,
        usedThisMonth: user.usage_count,
        monthlyLimit: user.monthly_limit,
        remaining,
        usagePercentage: Math.min(100, usagePercentage),
        canUseFeature: user.usage_count < user.monthly_limit
      }
    },
    enabled: !!user
  })

  return {
    usageStats: usageStatsQuery.data,
    isLoading: usageStatsQuery.isLoading,
    error: usageStatsQuery.error
  }
}

// Tier Feature Access Hook
export function useTierFeatures() {
  const { user } = useAuth()

  const getFeatureAccess = (tier: SubscriptionTier) => {
    const features = {
      spark: {
        photo_analysis: true,
        conversation_analysis: true,
        voice_analysis: false,
        screen_monitoring: false,
        social_analytics: false,
        real_time_coaching: false,
        monthly_limit: 5
      },
      premium: {
        photo_analysis: true,
        conversation_analysis: true,
        voice_analysis: false,
        screen_monitoring: true,
        social_analytics: false,
        real_time_coaching: true,
        monthly_limit: 25
      },
      elite: {
        photo_analysis: true,
        conversation_analysis: true,
        voice_analysis: true,
        screen_monitoring: true,
        social_analytics: true,
        real_time_coaching: true,
        monthly_limit: 100
      }
    }

    return features[tier] || features.spark
  }

  const currentFeatures = user ? getFeatureAccess(user.subscription_tier) : getFeatureAccess('spark')
  
  const hasFeature = (feature: keyof ReturnType<typeof getFeatureAccess>) => {
    return currentFeatures[feature]
  }

  const requiresUpgrade = (feature: keyof ReturnType<typeof getFeatureAccess>) => {
    return !hasFeature(feature)
  }

  return {
    features: currentFeatures,
    hasFeature,
    requiresUpgrade,
    currentTier: user?.subscription_tier || 'spark'
  }
}
