-- AI Dating Coach Enhanced Platform Database Schema
-- Designed for Supabase PostgreSQL with Row Level Security (RLS)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USER MANAGEMENT TABLES
-- =============================================

-- Enhanced user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'pro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB DEFAULT '{}',
    subscription_data JSONB DEFAULT '{}',
    usage_stats JSONB DEFAULT '{}',
    sync_token TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Performance and analytics
    total_analyses INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.0,
    average_confidence DECIMAL(5,2) DEFAULT 0.0,
    
    -- Privacy and security
    privacy_settings JSONB DEFAULT '{"data_retention_days": 30, "analytics_enabled": true}',
    encryption_key TEXT,
    
    UNIQUE(user_id),
    UNIQUE(email)
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'pro')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- =============================================
-- USAGE TRACKING TABLES
-- =============================================

-- Daily usage tracking
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Analysis counts
    photo_analyses INTEGER DEFAULT 0,
    conversation_analyses INTEGER DEFAULT 0,
    voice_analyses INTEGER DEFAULT 0,
    screenshot_analyses INTEGER DEFAULT 0,
    keyboard_suggestions INTEGER DEFAULT 0,
    browser_coaching INTEGER DEFAULT 0,
    
    -- Performance metrics
    total_processing_time INTEGER DEFAULT 0, -- milliseconds
    average_confidence DECIMAL(5,2) DEFAULT 0.0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- Usage limits by tier
CREATE TABLE IF NOT EXISTS tier_limits (
    tier TEXT PRIMARY KEY CHECK (tier IN ('free', 'premium', 'pro')),
    daily_photo_analyses INTEGER,
    daily_conversation_analyses INTEGER,
    daily_voice_analyses INTEGER,
    daily_screenshot_analyses INTEGER,
    daily_keyboard_suggestions INTEGER,
    daily_browser_coaching INTEGER,
    
    -- Feature flags
    advanced_features BOOLEAN DEFAULT FALSE,
    real_time_analysis BOOLEAN DEFAULT FALSE,
    cross_platform_sync BOOLEAN DEFAULT FALSE,
    voice_analysis BOOLEAN DEFAULT FALSE,
    personality_profiling BOOLEAN DEFAULT FALSE,
    unlimited_screenshots BOOLEAN DEFAULT FALSE,
    
    -- AI model access
    openai_access BOOLEAN DEFAULT TRUE,
    gemini_access BOOLEAN DEFAULT FALSE,
    premium_models BOOLEAN DEFAULT FALSE,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tier limits
INSERT INTO tier_limits (tier, daily_photo_analyses, daily_conversation_analyses, daily_voice_analyses, 
                        daily_screenshot_analyses, daily_keyboard_suggestions, daily_browser_coaching,
                        advanced_features, real_time_analysis, cross_platform_sync, voice_analysis,
                        personality_profiling, unlimited_screenshots, openai_access, gemini_access, premium_models)
VALUES 
    ('free', 3, 3, 0, 3, 5, 0, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, FALSE, FALSE),
    ('premium', -1, -1, 10, -1, -1, -1, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, TRUE, TRUE, FALSE),
    ('pro', -1, -1, -1, -1, -1, -1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (tier) DO UPDATE SET
    daily_photo_analyses = EXCLUDED.daily_photo_analyses,
    daily_conversation_analyses = EXCLUDED.daily_conversation_analyses,
    daily_voice_analyses = EXCLUDED.daily_voice_analyses,
    daily_screenshot_analyses = EXCLUDED.daily_screenshot_analyses,
    daily_keyboard_suggestions = EXCLUDED.daily_keyboard_suggestions,
    daily_browser_coaching = EXCLUDED.daily_browser_coaching,
    advanced_features = EXCLUDED.advanced_features,
    real_time_analysis = EXCLUDED.real_time_analysis,
    cross_platform_sync = EXCLUDED.cross_platform_sync,
    voice_analysis = EXCLUDED.voice_analysis,
    personality_profiling = EXCLUDED.personality_profiling,
    unlimited_screenshots = EXCLUDED.unlimited_screenshots,
    openai_access = EXCLUDED.openai_access,
    gemini_access = EXCLUDED.gemini_access,
    premium_models = EXCLUDED.premium_models,
    updated_at = NOW();

-- =============================================
-- ANALYSIS TABLES
-- =============================================

-- Analysis history
CREATE TABLE IF NOT EXISTS analysis_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('photo', 'conversation', 'voice', 'screenshot', 'keyboard', 'browser')),
    platform TEXT,
    
    -- Input data (encrypted)
    input_data_encrypted TEXT,
    input_metadata JSONB DEFAULT '{}',
    
    -- Analysis results
    analysis_data JSONB NOT NULL,
    confidence DECIMAL(5,2),
    processing_time INTEGER, -- milliseconds
    ai_provider TEXT CHECK (ai_provider IN ('openai', 'gemini', 'fallback')),
    
    -- Quality metrics
    user_feedback INTEGER CHECK (user_feedback BETWEEN 1 AND 5),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Sync and versioning
    synced BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screenshot analysis specific table
CREATE TABLE IF NOT EXISTS screenshot_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES analysis_history(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    
    -- Screenshot data
    screenshot_count INTEGER DEFAULT 1,
    screenshots JSONB NOT NULL, -- Array of screenshot objects
    extracted_text TEXT,
    detected_elements JSONB DEFAULT '[]',
    
    -- Profile data extracted
    profile_data JSONB DEFAULT '{}',
    compatibility_score DECIMAL(5,2),
    
    -- Tier-specific results
    tier_used TEXT NOT NULL CHECK (tier_used IN ('free', 'premium', 'pro')),
    analysis_depth TEXT NOT NULL CHECK (analysis_depth IN ('basic', 'comprehensive', 'complete_reconstruction')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation analysis specific table
CREATE TABLE IF NOT EXISTS conversation_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES analysis_history(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    
    -- Conversation data
    messages JSONB NOT NULL,
    conversation_stage TEXT,
    engagement_score DECIMAL(5,2),
    sentiment_score DECIMAL(5,2),
    momentum TEXT CHECK (momentum IN ('increasing', 'decreasing', 'stable')),
    
    -- Analysis results
    risk_factors JSONB DEFAULT '[]',
    next_steps JSONB DEFAULT '[]',
    conversation_starters JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FLOATING BUTTON TABLES
-- =============================================

-- Floating button configurations
CREATE TABLE IF NOT EXISTS floating_button_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    
    -- Position and appearance
    position_x INTEGER DEFAULT 50,
    position_y INTEGER DEFAULT 50,
    size INTEGER DEFAULT 60,
    opacity DECIMAL(3,2) DEFAULT 0.8,
    
    -- Behavior settings
    auto_hide BOOLEAN DEFAULT TRUE,
    hide_delay INTEGER DEFAULT 3000, -- milliseconds
    vibration_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT FALSE,
    
    -- Platform-specific settings
    platform_settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Floating button usage tracking
CREATE TABLE IF NOT EXISTS floating_button_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    
    -- Usage metrics
    total_taps INTEGER DEFAULT 0,
    successful_analyses INTEGER DEFAULT 0,
    failed_analyses INTEGER DEFAULT 0,
    average_response_time INTEGER DEFAULT 0, -- milliseconds
    
    -- Daily breakdown
    date DATE NOT NULL,
    daily_taps INTEGER DEFAULT 0,
    daily_successful INTEGER DEFAULT 0,
    daily_failed INTEGER DEFAULT 0,
    
    -- Platform breakdown
    platform_usage JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- =============================================
-- AI KEYBOARD TABLES
-- =============================================

-- AI keyboard configurations
CREATE TABLE IF NOT EXISTS ai_keyboard_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    
    -- Keyboard settings
    enabled BOOLEAN DEFAULT TRUE,
    suggestion_count INTEGER DEFAULT 3,
    auto_suggest BOOLEAN DEFAULT TRUE,
    learning_enabled BOOLEAN DEFAULT TRUE,
    
    -- Personalization
    communication_style TEXT DEFAULT 'balanced',
    humor_level INTEGER DEFAULT 3 CHECK (humor_level BETWEEN 1 AND 5),
    formality_level INTEGER DEFAULT 3 CHECK (formality_level BETWEEN 1 AND 5),
    
    -- Platform-specific settings
    platform_preferences JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Keyboard suggestion history
CREATE TABLE IF NOT EXISTS keyboard_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    
    -- Context
    original_text TEXT,
    conversation_context JSONB DEFAULT '{}',
    platform TEXT,
    conversation_stage TEXT,
    
    -- Suggestions
    suggestions JSONB NOT NULL,
    selected_suggestion INTEGER,
    user_modified BOOLEAN DEFAULT FALSE,
    final_text TEXT,
    
    -- Performance
    generation_time INTEGER, -- milliseconds
    confidence DECIMAL(5,2),
    ai_provider TEXT,
    
    -- Feedback
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    used BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BROWSER EXTENSION TABLES
-- =============================================

-- Browser extension configurations
CREATE TABLE IF NOT EXISTS browser_extension_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    
    -- Extension settings
    enabled BOOLEAN DEFAULT TRUE,
    overlay_position TEXT DEFAULT 'bottom-right',
    overlay_size TEXT DEFAULT 'medium',
    overlay_opacity DECIMAL(3,2) DEFAULT 0.9,
    
    -- Behavior
    auto_analyze BOOLEAN DEFAULT TRUE,
    real_time_suggestions BOOLEAN DEFAULT TRUE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    
    -- Platform-specific settings
    platform_configs JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Browser coaching sessions
CREATE TABLE IF NOT EXISTS browser_coaching_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    
    -- Session data
    platform TEXT NOT NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- seconds
    
    -- Activity metrics
    profiles_viewed INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    suggestions_provided INTEGER DEFAULT 0,
    suggestions_used INTEGER DEFAULT 0,
    
    -- Performance
    average_response_time INTEGER DEFAULT 0, -- milliseconds
    success_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Session data
    session_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANALYTICS TABLES
-- =============================================

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    
    -- Event data
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL CHECK (event_category IN ('user', 'system', 'business', 'error', 'performance')),
    event_data JSONB DEFAULT '{}',
    
    -- Context
    session_id TEXT,
    platform TEXT,
    user_tier TEXT,
    
    -- Metadata
    user_agent TEXT,
    ip_address INET,
    country_code TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Operation details
    operation TEXT NOT NULL,
    component TEXT NOT NULL,
    
    -- Timing
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- milliseconds
    
    -- Success/failure
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Context
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    session_id TEXT,
    request_id TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CROSS-PLATFORM SYNC TABLES
-- =============================================

-- Sync data
CREATE TABLE IF NOT EXISTS sync_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    
    -- Sync metadata
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_version INTEGER DEFAULT 1,
    device_id TEXT,
    platform TEXT,
    
    -- Data payload
    preferences JSONB DEFAULT '{}',
    analysis_history JSONB DEFAULT '[]',
    conversations JSONB DEFAULT '[]',
    profiles JSONB DEFAULT '[]',
    usage_data JSONB DEFAULT '{}',
    
    -- Conflict resolution
    conflicts JSONB DEFAULT '[]',
    resolved BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync conflicts
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    sync_data_id UUID REFERENCES sync_data(id) ON DELETE CASCADE,
    
    -- Conflict details
    field_name TEXT NOT NULL,
    local_value JSONB,
    remote_value JSONB,
    conflict_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Resolution
    resolution TEXT CHECK (resolution IN ('local', 'remote', 'merge', 'manual')),
    resolved_value JSONB,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_date DATE,
    p_usage_type TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_usage (user_id, date)
    VALUES (p_user_id, p_date)
    ON CONFLICT (user_id, date) DO NOTHING;
    
    CASE p_usage_type
        WHEN 'photo_analyses' THEN
            UPDATE user_usage 
            SET photo_analyses = photo_analyses + 1, updated_at = NOW()
            WHERE user_id = p_user_id AND date = p_date;
        WHEN 'conversation_analyses' THEN
            UPDATE user_usage 
            SET conversation_analyses = conversation_analyses + 1, updated_at = NOW()
            WHERE user_id = p_user_id AND date = p_date;
        WHEN 'voice_analyses' THEN
            UPDATE user_usage 
            SET voice_analyses = voice_analyses + 1, updated_at = NOW()
            WHERE user_id = p_user_id AND date = p_date;
        WHEN 'screenshot_analyses' THEN
            UPDATE user_usage 
            SET screenshot_analyses = screenshot_analyses + 1, updated_at = NOW()
            WHERE user_id = p_user_id AND date = p_date;
        WHEN 'keyboard_suggestions' THEN
            UPDATE user_usage 
            SET keyboard_suggestions = keyboard_suggestions + 1, updated_at = NOW()
            WHERE user_id = p_user_id AND date = p_date;
        WHEN 'browser_coaching' THEN
            UPDATE user_usage 
            SET browser_coaching = browser_coaching + 1, updated_at = NOW()
            WHERE user_id = p_user_id AND date = p_date;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_usage_updated_at BEFORE UPDATE ON user_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_floating_button_configs_updated_at BEFORE UPDATE ON floating_button_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_floating_button_usage_updated_at BEFORE UPDATE ON floating_button_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_keyboard_configs_updated_at BEFORE UPDATE ON ai_keyboard_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_browser_extension_configs_updated_at BEFORE UPDATE ON browser_extension_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sync_data_updated_at BEFORE UPDATE ON sync_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshot_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE floating_button_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE floating_button_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_keyboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyboard_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_extension_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON user_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON user_usage FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON user_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own analysis history" ON analysis_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analysis history" ON analysis_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analysis history" ON analysis_history FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own screenshot analyses" ON screenshot_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own screenshot analyses" ON screenshot_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own conversation analyses" ON conversation_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversation analyses" ON conversation_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own floating button config" ON floating_button_configs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own floating button usage" ON floating_button_usage FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own keyboard config" ON ai_keyboard_configs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own keyboard suggestions" ON keyboard_suggestions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own browser config" ON browser_extension_configs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own browser sessions" ON browser_coaching_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics" ON analytics_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics" ON analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own sync data" ON sync_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sync conflicts" ON sync_conflicts FOR ALL USING (auth.uid() = user_id);

-- Performance metrics can be viewed by users for their own data
CREATE POLICY "Users can view own performance metrics" ON performance_metrics FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(tier);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- Usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id_date ON user_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_usage_date ON user_usage(date);

-- Analysis indexes
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_type ON analysis_history(analysis_type);
CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON analysis_history(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_history_platform ON analysis_history(platform);

-- Screenshot analysis indexes
CREATE INDEX IF NOT EXISTS idx_screenshot_analyses_user_id ON screenshot_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_screenshot_analyses_analysis_id ON screenshot_analyses(analysis_id);
CREATE INDEX IF NOT EXISTS idx_screenshot_analyses_tier ON screenshot_analyses(tier_used);

-- Conversation analysis indexes
CREATE INDEX IF NOT EXISTS idx_conversation_analyses_user_id ON conversation_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analyses_analysis_id ON conversation_analyses(analysis_id);

-- Floating button indexes
CREATE INDEX IF NOT EXISTS idx_floating_button_usage_user_id_date ON floating_button_usage(user_id, date);

-- Keyboard indexes
CREATE INDEX IF NOT EXISTS idx_keyboard_suggestions_user_id ON keyboard_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_keyboard_suggestions_platform ON keyboard_suggestions(platform);
CREATE INDEX IF NOT EXISTS idx_keyboard_suggestions_created_at ON keyboard_suggestions(created_at);

-- Browser extension indexes
CREATE INDEX IF NOT EXISTS idx_browser_coaching_sessions_user_id ON browser_coaching_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_browser_coaching_sessions_platform ON browser_coaching_sessions(platform);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_operation ON performance_metrics(operation);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);

-- Sync indexes
CREATE INDEX IF NOT EXISTS idx_sync_data_user_id ON sync_data(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_data_last_sync_at ON sync_data(last_sync_at);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_user_id ON sync_conflicts(user_id);

-- =============================================
-- INITIAL DATA
-- =============================================

-- Create default configurations for new users (handled by triggers)
CREATE OR REPLACE FUNCTION create_default_user_configs()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default floating button config
    INSERT INTO floating_button_configs (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create default AI keyboard config
    INSERT INTO ai_keyboard_configs (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create default browser extension config
    INSERT INTO browser_extension_configs (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default configs for new users
CREATE TRIGGER create_user_defaults_trigger
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_configs();

-- =============================================
-- VIEWS FOR ANALYTICS
-- =============================================

-- User analytics view
CREATE OR REPLACE VIEW user_analytics AS
SELECT 
    up.user_id,
    up.tier,
    up.created_at as user_since,
    COALESCE(SUM(uu.photo_analyses), 0) as total_photo_analyses,
    COALESCE(SUM(uu.conversation_analyses), 0) as total_conversation_analyses,
    COALESCE(SUM(uu.voice_analyses), 0) as total_voice_analyses,
    COALESCE(SUM(uu.screenshot_analyses), 0) as total_screenshot_analyses,
    COALESCE(SUM(uu.keyboard_suggestions), 0) as total_keyboard_suggestions,
    COALESCE(SUM(uu.browser_coaching), 0) as total_browser_coaching,
    COALESCE(AVG(uu.average_confidence), 0) as overall_confidence,
    COUNT(DISTINCT uu.date) as active_days,
    MAX(uu.date) as last_active_date
FROM user_profiles up
LEFT JOIN user_usage uu ON up.user_id = uu.user_id
GROUP BY up.user_id, up.tier, up.created_at;

-- Daily platform usage view
CREATE OR REPLACE VIEW daily_platform_usage AS
SELECT 
    date,
    COUNT(DISTINCT user_id) as active_users,
    SUM(photo_analyses) as total_photo_analyses,
    SUM(conversation_analyses) as total_conversation_analyses,
    SUM(voice_analyses) as total_voice_analyses,
    SUM(screenshot_analyses) as total_screenshot_analyses,
    SUM(keyboard_suggestions) as total_keyboard_suggestions,
    SUM(browser_coaching) as total_browser_coaching,
    AVG(average_confidence) as avg_confidence
FROM user_usage
GROUP BY date
ORDER BY date DESC;

-- Performance summary view
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
    operation,
    component,
    COUNT(*) as total_operations,
    AVG(duration) as avg_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration) as p95_duration_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration) as p99_duration_ms,
    SUM(CASE WHEN success THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) * 100 as success_rate_percent,
    DATE_TRUNC('hour', created_at) as hour_bucket
FROM performance_metrics
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY operation, component, DATE_TRUNC('hour', created_at)
ORDER BY hour_bucket DESC, avg_duration_ms DESC;

