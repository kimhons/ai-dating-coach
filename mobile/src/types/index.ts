// Database Types
export type SubscriptionTier = 'spark' | 'premium' | 'elite';
export type PersonaType = 'frustrated_professional' | 'recently_single' | 'experienced_optimizer' | 'confidence_builder';
export type GoalType = 'more_matches' | 'better_conversations' | 'build_confidence' | 'find_relationship';
export type AnalysisType = 'photo' | 'conversation' | 'voice' | 'screen';

// User Types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: SubscriptionTier;
  subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing';
  persona_type?: PersonaType;
  created_at: string;
  updated_at: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  target_value: number;
  current_value: number;
  deadline?: string;
  created_at: string;
}

// Analysis Types
export interface PhotoAnalysis {
  id: string;
  user_id: string;
  photo_url: string;
  ai_feedback: string;
  attractiveness_score: number;
  authenticity_score: number;
  suggestions: string[];
  analysis_metadata: Record<string, any>;
  created_at: string;
}

export interface ConversationAnalysis {
  id: string;
  user_id: string;
  screenshot_url?: string;
  conversation_text: string;
  ai_feedback: string;
  engagement_score: number;
  tone_analysis: Record<string, any>;
  suggestions: string[];
  created_at: string;
}

export interface VoiceAnalysis {
  id: string;
  user_id: string;
  audio_url: string;
  transcript: string;
  ai_feedback: string;
  confidence_score: number;
  tone_analysis: Record<string, any>;
  suggestions: string[];
  created_at: string;
}

// Progress Tracking
export interface ProgressTracking {
  id: string;
  user_id: string;
  metric_name: string;
  metric_value: number;
  previous_value: number;
  improvement_percentage: number;
  tracked_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  description: string;
  icon_url?: string;
  unlocked_at: string;
}

// Usage Tracking
export interface UsageTracking {
  id: string;
  user_id: string;
  feature_used: string;
  usage_count: number;
  last_used_at: string;
  month_year: string;
}

// Subscription Types
export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  stripe_subscription_id?: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export interface PricingPlan {
  id: SubscriptionTier;
  name: string;
  price: number | 'Free';
  priceId: string;
  features: string[];
  popular?: boolean;
  cta: string;
  description: string;
  monthlyAnalyses: number;
  hasVoiceAnalysis: boolean;
  hasScreenMonitoring: boolean;
  hasSocialAnalytics: boolean;
}

// AI Analysis Request/Response Types
export interface PhotoAnalysisRequest {
  imageUri: string;
  analysisType?: 'profile' | 'casual' | 'professional';
}

export interface ConversationAnalysisRequest {
  text?: string;
  imageUri?: string;
  platform?: 'tinder' | 'bumble' | 'hinge' | 'other';
}

export interface VoiceAnalysisRequest {
  audioUri: string;
  context?: 'phone_call' | 'voice_message' | 'practice';
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
  PhotoAnalysis: {photo?: string};
  ConversationAnalysis: {screenshot?: string};
  VoiceAnalysis: undefined;
  ScreenMonitoring: undefined;
  SocialAnalytics: undefined;
  Progress: undefined;
  Settings: undefined;
  Profile: undefined;
  Pricing: undefined;
  Premium: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Analyze: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type AnalyzeStackParamList = {
  AnalyzeHome: undefined;
  PhotoAnalysis: {photo?: string};
  ConversationAnalysis: {screenshot?: string};
  VoiceAnalysis: undefined;
  ScreenMonitoring: undefined;
  SocialAnalytics: undefined;
};

// App State Types
export interface AppState {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasOnboarded: boolean;
  currentUser: User | null;
  subscription: Subscription | null;
}

// Feature Access Types
export interface FeatureAccess {
  canUseFeature: boolean;
  hasReachedLimit: boolean;
  usageCount: number;
  maxUsage: number;
  requiresUpgrade: boolean;
  upgradeMessage?: string;
}

// Camera/Media Types
export interface MediaAsset {
  uri: string;
  type: 'photo' | 'video' | 'audio';
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
}

// Notification Types
export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledTime?: Date;
}

// Analytics Types
export interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp: Date;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AppError;
  message?: string;
}

// Supabase Database Schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<User>;
      };
      user_goals: {
        Row: UserGoal;
        Insert: Omit<UserGoal, 'id' | 'created_at'>;
        Update: Partial<UserGoal>;
      };
      photo_analyses: {
        Row: PhotoAnalysis;
        Insert: Omit<PhotoAnalysis, 'id' | 'created_at'>;
        Update: Partial<PhotoAnalysis>;
      };
      conversation_analyses: {
        Row: ConversationAnalysis;
        Insert: Omit<ConversationAnalysis, 'id' | 'created_at'>;
        Update: Partial<ConversationAnalysis>;
      };
      voice_analyses: {
        Row: VoiceAnalysis;
        Insert: Omit<VoiceAnalysis, 'id' | 'created_at'>;
        Update: Partial<VoiceAnalysis>;
      };
      progress_tracking: {
        Row: ProgressTracking;
        Insert: Omit<ProgressTracking, 'id'>;
        Update: Partial<ProgressTracking>;
      };
      achievements: {
        Row: Achievement;
        Insert: Omit<Achievement, 'id'>;
        Update: Partial<Achievement>;
      };
      usage_tracking: {
        Row: UsageTracking;
        Insert: Omit<UsageTracking, 'id'>;
        Update: Partial<UsageTracking>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at'>;
        Update: Partial<Subscription>;
      };
    };
  };
}