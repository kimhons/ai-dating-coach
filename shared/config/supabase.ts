/**
 * Supabase Client Configuration
 * Shared configuration for mobile app, web dashboard, and browser extension
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment configuration
interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

// Production configuration
const SUPABASE_CONFIG: SupabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'your-anon-key',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
};

// Client instance for public operations
export const supabase: SupabaseClient = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Admin client for server-side operations
export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.serviceRoleKey || SUPABASE_CONFIG.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database table names
export const TABLES = {
  USERS: 'users',
  PHOTO_ANALYSES: 'photo_analyses',
  CONVERSATION_ANALYSES: 'conversation_analyses',
  SUBSCRIPTIONS: 'subscriptions',
  USAGE_TRACKING: 'usage_tracking',
  USER_SETTINGS: 'user_settings',
  SYNC_DATA: 'sync_data'
} as const;

// Edge function names
export const FUNCTIONS = {
  PHOTO_ANALYSIS: 'photo-analysis',
  CONVERSATION_ANALYSIS: 'conversation-analysis',
  SUBSCRIPTION_WEBHOOK: 'subscription-webhook',
  USAGE_TRACKING: 'usage-tracking'
} as const;

// Subscription tiers
export enum SubscriptionTier {
  SPARK = 'spark',    // Free tier
  FLAME = 'flame',    // $9.99/month
  BLAZE = 'blaze'     // $19.99/month
}

// Usage limits by tier
export const USAGE_LIMITS = {
  [SubscriptionTier.SPARK]: {
    photo_analyses: 5,
    conversation_analyses: 5,
    voice_analyses: 0,
    ai_keyboard: false,
    floating_button: false,
    priority_support: false
  },
  [SubscriptionTier.FLAME]: {
    photo_analyses: 50,
    conversation_analyses: 50,
    voice_analyses: 10,
    ai_keyboard: true,
    floating_button: true,
    priority_support: false
  },
  [SubscriptionTier.BLAZE]: {
    photo_analyses: -1, // Unlimited
    conversation_analyses: -1, // Unlimited
    voice_analyses: -1, // Unlimited
    ai_keyboard: true,
    floating_button: true,
    priority_support: true
  }
} as const;

// API response types
export interface APIResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
  metadata?: {
    timestamp: string;
    requestId: string;
    usage?: UsageInfo;
  };
}

export interface UsageInfo {
  current_usage: number;
  limit: number;
  tier: SubscriptionTier;
  reset_date: string;
}

// Photo analysis types
export interface PhotoAnalysisRequest {
  image_url: string;
  user_id: string;
  platform?: string;
  analysis_type?: 'profile' | 'general';
}

export interface PhotoAnalysisResult {
  id: string;
  user_id: string;
  image_url: string;
  overall_score: number;
  appeal_score: number;
  composition_score: number;
  emotion_score: number;
  feedback: string;
  suggestions: string[];
  technical_issues: string[];
  analysis_date: string;
  platform?: string;
}

// Conversation analysis types
export interface ConversationAnalysisRequest {
  conversation_text?: string;
  screenshot_url?: string;
  user_id: string;
  platform: string;
  analysis_type: 'text' | 'screenshot';
}

export interface MessageSuggestion {
  text: string;
  tone: 'enthusiastic' | 'casual' | 'flirty' | 'thoughtful';
  engagement_prediction: number;
  reasoning: string;
}

export interface ConversationAnalysisResult {
  id: string;
  user_id: string;
  engagement_score: number;
  sentiment_score: number;
  response_quality_score: number;
  context_summary: string;
  coaching_feedback: string;
  next_message_suggestions: MessageSuggestion[];
  red_flags: string[];
  positive_signals: string[];
  analysis_date: string;
  platform: string;
}

// User profile types
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  subscription_tier: SubscriptionTier;
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  subscription_end_date?: string;
  created_at: string;
  updated_at: string;
  last_active: string;
}

// Settings types
export interface UserSettings {
  user_id: string;
  notifications_enabled: boolean;
  floating_button_enabled: boolean;
  ai_keyboard_enabled: boolean;
  auto_analysis_enabled: boolean;
  privacy_mode: boolean;
  preferred_platforms: string[];
  coaching_style: 'gentle' | 'direct' | 'encouraging';
  updated_at: string;
}

// Error types
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  SUBSCRIPTION_ERROR = 'SUBSCRIPTION_ERROR',
  USAGE_LIMIT_ERROR = 'USAGE_LIMIT_ERROR'
}

export class APIError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Utility functions
export const isValidSubscriptionTier = (tier: string): tier is SubscriptionTier => {
  return Object.values(SubscriptionTier).includes(tier as SubscriptionTier);
};

export const hasFeatureAccess = (tier: SubscriptionTier, feature: keyof typeof USAGE_LIMITS[SubscriptionTier.SPARK]): boolean => {
  const limits = USAGE_LIMITS[tier];
  const featureValue = limits[feature];
  
  if (typeof featureValue === 'boolean') {
    return featureValue;
  }
  
  return featureValue !== 0;
};

export const getRemainingUsage = (currentUsage: number, tier: SubscriptionTier, analysisType: 'photo_analyses' | 'conversation_analyses' | 'voice_analyses'): number => {
  const limit = USAGE_LIMITS[tier][analysisType];
  
  if (limit === -1) return -1; // Unlimited
  return Math.max(0, limit - currentUsage);
};

// Configuration validation
export const validateSupabaseConfig = (): boolean => {
  if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'https://your-project.supabase.co') {
    console.error('Supabase URL not configured');
    return false;
  }
  
  if (!SUPABASE_CONFIG.anonKey || SUPABASE_CONFIG.anonKey === 'your-anon-key') {
    console.error('Supabase anonymous key not configured');
    return false;
  }
  
  return true;
};

// Initialize configuration validation
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  validateSupabaseConfig();
}

export default supabase;

