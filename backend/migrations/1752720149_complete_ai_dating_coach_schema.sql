-- Migration: complete_ai_dating_coach_schema
-- Created at: 1752720149

-- AI Dating Coach Production Database Schema
-- Complete setup for all advanced features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types/enums
CREATE TYPE subscription_tier AS ENUM ('spark', 'premium', 'elite');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing', 'incomplete');
CREATE TYPE persona_type AS ENUM ('frustrated_professional', 'recently_single', 'experienced_optimizer', 'confidence_builder');
CREATE TYPE goal_type AS ENUM ('more_matches', 'better_conversations', 'build_confidence', 'find_relationship', 'improve_profile', 'voice_confidence');
CREATE TYPE conversation_type AS ENUM ('text', 'screenshot', 'voice', 'live_chat');
CREATE TYPE input_method AS ENUM ('upload', 'text_input', 'voice_upload', 'screen_capture', 'auto_sync');
CREATE TYPE attachment_style AS ENUM ('secure', 'anxious', 'avoidant', 'disorganized');
CREATE TYPE analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE ai_provider AS ENUM ('openai', 'anthropic', 'google', 'ensemble');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    persona_type persona_type,
    subscription_tier subscription_tier DEFAULT 'spark',
    subscription_status subscription_status DEFAULT 'active',
    subscription_expires_at TIMESTAMPTZ,
    stripe_customer_id TEXT,
    confidence_score DECIMAL(4,1) DEFAULT 50.0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    monthly_limit INTEGER DEFAULT 5,
    last_usage_reset TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User goals table
CREATE TABLE IF NOT EXISTS public.user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    goal_type goal_type NOT NULL,
    target_value INTEGER,
    current_progress INTEGER DEFAULT 0,
    deadline TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photo analyses table
CREATE TABLE IF NOT EXISTS public.photo_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    analysis_status analysis_status DEFAULT 'pending',
    ai_provider ai_provider DEFAULT 'openai',
    overall_score DECIMAL(3,1),
    attractiveness_score DECIMAL(3,1),
    composition_score DECIMAL(3,1),
    emotion_score DECIMAL(3,1),
    technical_issues JSONB,
    feedback TEXT,
    suggestions TEXT[],
    improvements TEXT[],
    next_steps TEXT[],
    raw_analysis JSONB,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation analyses table
CREATE TABLE IF NOT EXISTS public.conversation_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    conversation_type conversation_type NOT NULL,
    input_method input_method NOT NULL,
    platform TEXT, -- tinder, bumble, hinge, sms, etc.
    conversation_content TEXT,
    screenshot_url TEXT,
    analysis_status analysis_status DEFAULT 'pending',
    ai_provider ai_provider DEFAULT 'openai',
    engagement_score DECIMAL(3,1),
    sentiment_score DECIMAL(3,1),
    response_quality_score DECIMAL(3,1),
    conversation_context JSONB,
    suggestions TEXT[],
    next_message_suggestions TEXT[],
    red_flags TEXT[],
    positive_signals TEXT[],
    coaching_feedback TEXT,
    raw_analysis JSONB,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice analyses table (Elite tier)
CREATE TABLE IF NOT EXISTS public.voice_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    audio_url TEXT NOT NULL,
    audio_duration_seconds INTEGER,
    transcription TEXT,
    analysis_status analysis_status DEFAULT 'pending',
    ai_provider ai_provider DEFAULT 'openai',
    confidence_score DECIMAL(3,1),
    tone_analysis JSONB,
    emotion_analysis JSONB,
    speech_patterns JSONB,
    suggestions TEXT[],
    coaching_feedback TEXT,
    raw_analysis JSONB,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Psychological profiles table
CREATE TABLE IF NOT EXISTS public.psychological_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    attachment_style attachment_style,
    personality_type TEXT, -- MBTI, Big Five, etc.
    confidence_factors JSONB,
    behavioral_patterns JSONB,
    dating_strengths TEXT[],
    areas_for_improvement TEXT[],
    personalized_strategies TEXT[],
    analysis_summary TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social analytics table (Elite tier)
CREATE TABLE IF NOT EXISTS public.social_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    target_profile_data JSONB,
    authenticity_score DECIMAL(3,1),
    background_verification JSONB,
    social_media_analysis JSONB,
    red_flags TEXT[],
    compatibility_factors JSONB,
    approach_strategy TEXT,
    analysis_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL, -- photo_analysis, conversation_analysis, voice_analysis, etc.
    usage_date DATE DEFAULT CURRENT_DATE,
    count INTEGER DEFAULT 1,
    tier_at_time subscription_tier,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, feature_type, usage_date)
);

-- Progress tracking table
CREATE TABLE IF NOT EXISTS public.progress_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- confidence, matches, conversations, dates, etc.
    metric_value DECIMAL(10,2),
    tracking_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, metric_type, tracking_date)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    badge_icon TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    is_milestone BOOLEAN DEFAULT FALSE
);

-- Subscriptions table for Stripe integration
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    plan_type subscription_tier NOT NULL,
    status subscription_status NOT NULL,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    customer_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaching plans table
CREATE TABLE IF NOT EXISTS public.coaching_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL, -- weekly, monthly, custom
    goals JSONB,
    action_items JSONB,
    milestones JSONB,
    current_week INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screen analysis table (Advanced integration)
CREATE TABLE IF NOT EXISTS public.screen_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    app_detected TEXT, -- tinder, bumble, hinge, etc.
    screen_content TEXT, -- OCR extracted text
    analysis_type TEXT, -- profile_scan, conversation_monitor, auto_suggest
    suggestions JSONB,
    compatibility_score DECIMAL(3,1),
    approach_strategy TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time monitoring table
CREATE TABLE IF NOT EXISTS public.live_monitoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    monitoring_type TEXT NOT NULL, -- screen, voice, sms
    is_active BOOLEAN DEFAULT TRUE,
    platform TEXT,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_photo_analyses_user_id ON public.photo_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_analyses_status ON public.photo_analyses(analysis_status);
CREATE INDEX IF NOT EXISTS idx_conversation_analyses_user_id ON public.conversation_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analyses_platform ON public.conversation_analyses(platform);
CREATE INDEX IF NOT EXISTS idx_voice_analyses_user_id ON public.voice_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON public.usage_tracking(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_user_date ON public.progress_tracking(user_id, tracking_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychological_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screen_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_monitoring ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own goals" ON public.user_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.user_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.user_goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own photo analyses" ON public.photo_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own photo analyses" ON public.photo_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own photo analyses" ON public.photo_analyses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own conversation analyses" ON public.conversation_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversation analyses" ON public.conversation_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversation analyses" ON public.conversation_analyses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own voice analyses" ON public.voice_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own voice analyses" ON public.voice_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own voice analyses" ON public.voice_analyses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own psychological profiles" ON public.psychological_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own psychological profiles" ON public.psychological_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own psychological profiles" ON public.psychological_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own social analytics" ON public.social_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own social analytics" ON public.social_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own usage tracking" ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage tracking" ON public.usage_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own progress tracking" ON public.progress_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress tracking" ON public.progress_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own coaching plans" ON public.coaching_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coaching plans" ON public.coaching_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own coaching plans" ON public.coaching_plans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own screen analyses" ON public.screen_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own screen analyses" ON public.screen_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own live monitoring" ON public.live_monitoring FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own live monitoring" ON public.live_monitoring FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own live monitoring" ON public.live_monitoring FOR UPDATE USING (auth.uid() = user_id);;