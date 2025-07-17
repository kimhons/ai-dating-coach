// Database Types
export type SubscriptionTier = 'spark' | 'premium' | 'elite'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete'
export type PersonaType = 'frustrated_professional' | 'recently_single' | 'experienced_optimizer' | 'confidence_builder'
export type GoalType = 'more_matches' | 'better_conversations' | 'build_confidence' | 'find_relationship' | 'improve_profile' | 'voice_confidence'
export type ConversationType = 'text' | 'screenshot' | 'voice' | 'live_chat'
export type InputMethod = 'upload' | 'text_input' | 'voice_upload' | 'screen_capture' | 'auto_sync'
export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'disorganized'
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'ensemble'

// User Types
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  persona_type?: PersonaType
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  subscription_expires_at?: string
  stripe_customer_id?: string
  confidence_score: number
  onboarding_completed: boolean
  usage_count: number
  monthly_limit: number
  last_usage_reset?: string
  created_at: string
  updated_at: string
}

// Goal Types
export interface UserGoal {
  id: string
  user_id: string
  goal_type: GoalType
  target_value?: number
  current_progress: number
  deadline?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Analysis Types
export interface PhotoAnalysis {
  id: string
  user_id: string
  image_url: string
  file_name?: string
  file_size?: number
  analysis_status: AnalysisStatus
  ai_provider: AIProvider
  overall_score?: number
  attractiveness_score?: number
  composition_score?: number
  emotion_score?: number
  technical_issues?: string[]
  feedback?: string
  suggestions?: string[]
  improvements?: string[]
  next_steps?: string[]
  raw_analysis?: any
  processing_time_ms?: number
  created_at: string
  updated_at: string
}

export interface ConversationAnalysis {
  id: string
  user_id: string
  conversation_type: ConversationType
  input_method: InputMethod
  platform?: string
  conversation_content?: string
  screenshot_url?: string
  analysis_status: AnalysisStatus
  ai_provider: AIProvider
  engagement_score?: number
  sentiment_score?: number
  response_quality_score?: number
  conversation_context?: any
  suggestions?: string[]
  next_message_suggestions?: string[]
  red_flags?: string[]
  positive_signals?: string[]
  coaching_feedback?: string
  raw_analysis?: any
  processing_time_ms?: number
  created_at: string
  updated_at: string
}

export interface VoiceAnalysis {
  id: string
  user_id: string
  audio_url: string
  audio_duration_seconds?: number
  transcription?: string
  analysis_status: AnalysisStatus
  ai_provider: AIProvider
  confidence_score?: number
  tone_analysis?: any
  emotion_analysis?: any
  speech_patterns?: any
  suggestions?: string[]
  coaching_feedback?: string
  raw_analysis?: any
  processing_time_ms?: number
  created_at: string
  updated_at: string
}

export interface PsychologicalProfile {
  id: string
  user_id: string
  attachment_style?: AttachmentStyle
  personality_type?: string
  confidence_factors?: any
  behavioral_patterns?: any
  dating_strengths?: string[]
  areas_for_improvement?: string[]
  personalized_strategies?: string[]
  analysis_summary?: string
  last_updated: string
  created_at: string
}

export interface SocialAnalytics {
  id: string
  user_id: string
  target_profile_data?: any
  authenticity_score?: number
  background_verification?: any
  social_media_analysis?: any
  red_flags?: string[]
  compatibility_factors?: any
  approach_strategy?: string
  analysis_summary?: string
  created_at: string
  updated_at: string
}

// Progress & Analytics Types
export interface UsageTracking {
  id: string
  user_id: string
  feature_type: string
  usage_date: string
  count: number
  tier_at_time: SubscriptionTier
  created_at: string
}

export interface ProgressTracking {
  id: string
  user_id: string
  metric_type: string
  metric_value: number
  tracking_date: string
  notes?: string
  created_at: string
}

export interface Achievement {
  id: string
  user_id: string
  achievement_type: string
  achievement_name: string
  description?: string
  badge_icon?: string
  earned_at: string
  is_milestone: boolean
}

// Subscription Types
export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id?: string
  stripe_customer_id?: string
  plan_type: SubscriptionTier
  status: SubscriptionStatus
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end: boolean
  canceled_at?: string
  customer_email?: string
  created_at: string
  updated_at: string
}

// UI Component Types
export interface AnalysisResult {
  id: string
  type: 'photo' | 'conversation' | 'voice'
  score: number
  feedback: string
  suggestions: string[]
  created_at: string
}

export interface DashboardStats {
  totalAnalyses: number
  averageScore: number
  confidenceGrowth: number
  usageRemaining: number
  monthlyGoalProgress: number
}

// Form Types
export interface OnboardingData {
  persona_type: PersonaType
  goals: GoalType[]
  dating_experience: string
  main_challenges: string[]
  preferred_apps: string[]
}

export interface PhotoUploadData {
  file: File
  analysis_type?: string
  notes?: string
}

export interface ConversationUploadData {
  conversation_content?: string
  screenshot?: File
  platform?: string
  conversation_type: ConversationType
}

export interface VoiceUploadData {
  audio_file: File
  duration?: number
  practice_type?: string
}

// Subscription Plan Types
export interface PricingPlan {
  id: SubscriptionTier
  name: string
  price: number | 'Free'
  priceId: string
  features: string[]
  popular?: boolean
  cta: string
  description?: string
}

// AI Analysis Types
export interface AIAnalysisRequest {
  type: 'photo' | 'conversation' | 'voice'
  data: any
  options?: {
    provider?: AIProvider
    detail_level?: 'basic' | 'detailed' | 'comprehensive'
  }
}

export interface AIAnalysisResponse {
  success: boolean
  analysis_id: string
  result?: any
  error?: string
  processing_time_ms: number
}

// Screen Monitoring Types (Elite Feature)
export interface ScreenMonitoring {
  id: string
  user_id: string
  app_detected?: string
  screen_content?: string
  analysis_type: string
  suggestions?: any
  compatibility_score?: number
  approach_strategy?: string
  created_at: string
}

export interface LiveMonitoring {
  id: string
  user_id: string
  monitoring_type: string
  is_active: boolean
  platform?: string
  last_activity: string
  settings?: any
  created_at: string
}

// Coaching Types
export interface CoachingPlan {
  id: string
  user_id: string
  plan_type: string
  goals?: any
  action_items?: any
  milestones?: any
  current_week: number
  status: string
  created_at: string
  updated_at: string
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: any
}

// API Response Types
export interface APIResponse<T = any> {
  data?: T
  error?: AppError
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

// Feature Flags
export interface FeatureFlags {
  voice_analysis: boolean
  screen_monitoring: boolean
  social_analytics: boolean
  real_time_coaching: boolean
  advanced_insights: boolean
}

// Export Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      user_goals: {
        Row: UserGoal
        Insert: Omit<UserGoal, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserGoal, 'id' | 'created_at'>>
      }
      photo_analyses: {
        Row: PhotoAnalysis
        Insert: Omit<PhotoAnalysis, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PhotoAnalysis, 'id' | 'created_at'>>
      }
      conversation_analyses: {
        Row: ConversationAnalysis
        Insert: Omit<ConversationAnalysis, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ConversationAnalysis, 'id' | 'created_at'>>
      }
      voice_analyses: {
        Row: VoiceAnalysis
        Insert: Omit<VoiceAnalysis, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<VoiceAnalysis, 'id' | 'created_at'>>
      }
      psychological_profiles: {
        Row: PsychologicalProfile
        Insert: Omit<PsychologicalProfile, 'id' | 'created_at'>
        Update: Partial<Omit<PsychologicalProfile, 'id' | 'created_at'>>
      }
      social_analytics: {
        Row: SocialAnalytics
        Insert: Omit<SocialAnalytics, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SocialAnalytics, 'id' | 'created_at'>>
      }
      usage_tracking: {
        Row: UsageTracking
        Insert: Omit<UsageTracking, 'id' | 'created_at'>
        Update: Partial<Omit<UsageTracking, 'id' | 'created_at'>>
      }
      progress_tracking: {
        Row: ProgressTracking
        Insert: Omit<ProgressTracking, 'id' | 'created_at'>
        Update: Partial<Omit<ProgressTracking, 'id' | 'created_at'>>
      }
      achievements: {
        Row: Achievement
        Insert: Omit<Achievement, 'id'>
        Update: Partial<Omit<Achievement, 'id'>>
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Subscription, 'id' | 'created_at'>>
      }
      coaching_plans: {
        Row: CoachingPlan
        Insert: Omit<CoachingPlan, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CoachingPlan, 'id' | 'created_at'>>
      }
      screen_analyses: {
        Row: ScreenMonitoring
        Insert: Omit<ScreenMonitoring, 'id' | 'created_at'>
        Update: Partial<Omit<ScreenMonitoring, 'id' | 'created_at'>>
      }
      live_monitoring: {
        Row: LiveMonitoring
        Insert: Omit<LiveMonitoring, 'id' | 'created_at'>
        Update: Partial<Omit<LiveMonitoring, 'id' | 'created_at'>>
      }
    }
  }
}
