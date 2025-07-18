-- Cross-Platform Sync Database Schema
-- Enhanced AI Dating Coach Platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sync Data Table
-- Stores all synchronized data across platforms
CREATE TABLE IF NOT EXISTS sync_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL,
    data_id VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('mobile', 'web', 'extension')),
    device_id VARCHAR(255) NOT NULL,
    timestamp BIGINT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    checksum VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite unique constraint to prevent duplicates
    UNIQUE(user_id, data_type, data_id, device_id),
    
    -- Index for efficient querying
    INDEX idx_sync_data_user_timestamp (user_id, timestamp),
    INDEX idx_sync_data_type_timestamp (data_type, timestamp),
    INDEX idx_sync_data_device (device_id, timestamp),
    INDEX idx_sync_data_checksum (checksum)
);

-- Sync Conflicts Table
-- Tracks conflicts that need resolution
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL,
    data_id VARCHAR(255) NOT NULL,
    conflict_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'expired')),
    severity VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    suggested_strategy VARCHAR(20),
    resolution_strategy VARCHAR(20),
    resolved_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Indexes for conflict management
    INDEX idx_sync_conflicts_user_status (user_id, status),
    INDEX idx_sync_conflicts_expires (expires_at),
    INDEX idx_sync_conflicts_data (data_type, data_id)
);

-- Device Sync Status Table
-- Tracks sync status for each device
CREATE TABLE IF NOT EXISTS device_sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('mobile', 'web', 'extension')),
    device_name VARCHAR(255),
    device_info JSONB,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_count INTEGER DEFAULT 0,
    last_conflict_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for user-device combination
    UNIQUE(user_id, device_id),
    
    -- Indexes
    INDEX idx_device_sync_user (user_id),
    INDEX idx_device_sync_platform (platform),
    INDEX idx_device_sync_active (is_active, last_sync)
);

-- Sync Metrics Table
-- Tracks sync performance and usage metrics
CREATE TABLE IF NOT EXISTS sync_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('pull', 'push', 'conflict_resolution')),
    success BOOLEAN NOT NULL,
    changes_count INTEGER DEFAULT 0,
    conflicts_count INTEGER DEFAULT 0,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for analytics
    INDEX idx_sync_metrics_user_timestamp (user_id, timestamp),
    INDEX idx_sync_metrics_platform_timestamp (platform, timestamp),
    INDEX idx_sync_metrics_operation (operation, success),
    INDEX idx_sync_metrics_performance (duration_ms, changes_count)
);

-- Sync Queue Table
-- Manages queued sync operations for offline scenarios
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    operation VARCHAR(20) NOT NULL,
    data JSONB NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for queue processing
    INDEX idx_sync_queue_status_priority (status, priority, scheduled_at),
    INDEX idx_sync_queue_user_device (user_id, device_id),
    INDEX idx_sync_queue_retry (retry_count, max_retries)
);

-- Data Type Registry Table
-- Defines sync behavior for different data types
CREATE TABLE IF NOT EXISTS sync_data_types (
    data_type VARCHAR(50) PRIMARY KEY,
    description TEXT,
    sync_strategy VARCHAR(20) DEFAULT 'merge' CHECK (sync_strategy IN ('merge', 'replace', 'append')),
    conflict_resolution VARCHAR(20) DEFAULT 'manual' CHECK (conflict_resolution IN ('auto', 'manual', 'latest_wins')),
    retention_days INTEGER DEFAULT 365,
    max_versions INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default data types
INSERT INTO sync_data_types (data_type, description, sync_strategy, conflict_resolution) VALUES
('profile_analysis', 'Profile analysis results and insights', 'merge', 'latest_wins'),
('conversation_coaching', 'Conversation coaching sessions and suggestions', 'append', 'manual'),
('user_preferences', 'User settings and preferences', 'replace', 'latest_wins'),
('tier_usage', 'Tier usage tracking and limits', 'merge', 'auto'),
('analytics_data', 'User analytics and performance metrics', 'append', 'auto'),
('keyboard_suggestions', 'AI keyboard suggestions and usage', 'append', 'auto'),
('browser_extension_data', 'Browser extension settings and data', 'merge', 'latest_wins'),
('mobile_app_data', 'Mobile app specific data and settings', 'merge', 'latest_wins')
ON CONFLICT (data_type) DO NOTHING;

-- Sync Sessions Table
-- Tracks complete sync sessions for debugging and analytics
CREATE TABLE IF NOT EXISTS sync_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('full', 'incremental', 'conflict_resolution')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
    total_changes INTEGER DEFAULT 0,
    successful_changes INTEGER DEFAULT 0,
    failed_changes INTEGER DEFAULT 0,
    conflicts_detected INTEGER DEFAULT 0,
    conflicts_resolved INTEGER DEFAULT 0,
    data_transferred_bytes INTEGER DEFAULT 0,
    error_details JSONB,
    
    -- Indexes
    INDEX idx_sync_sessions_user_timestamp (user_id, started_at),
    INDEX idx_sync_sessions_status (status, started_at),
    INDEX idx_sync_sessions_platform (platform, started_at)
);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_sync_data_updated_at BEFORE UPDATE ON sync_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_sync_status_updated_at BEFORE UPDATE ON device_sync_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_data_types_updated_at BEFORE UPDATE ON sync_data_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired conflicts
CREATE OR REPLACE FUNCTION cleanup_expired_conflicts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE sync_conflicts 
    SET status = 'expired' 
    WHERE status = 'pending' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get sync statistics
CREATE OR REPLACE FUNCTION get_sync_statistics(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    total_syncs BIGINT,
    successful_syncs BIGINT,
    failed_syncs BIGINT,
    total_conflicts BIGINT,
    resolved_conflicts BIGINT,
    avg_sync_duration NUMERIC,
    platforms_used TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_syncs,
        COUNT(*) FILTER (WHERE success = true) as successful_syncs,
        COUNT(*) FILTER (WHERE success = false) as failed_syncs,
        COALESCE(SUM(conflicts_count), 0) as total_conflicts,
        (SELECT COUNT(*) FROM sync_conflicts 
         WHERE user_id = p_user_id 
         AND status = 'resolved' 
         AND created_at >= NOW() - INTERVAL '%s days', p_days) as resolved_conflicts,
        AVG(duration_ms) as avg_sync_duration,
        ARRAY_AGG(DISTINCT platform) as platforms_used
    FROM sync_metrics 
    WHERE user_id = p_user_id 
    AND timestamp >= NOW() - INTERVAL '%s days', p_days;
END;
$$ LANGUAGE plpgsql;

-- Function to optimize sync data (remove old versions)
CREATE OR REPLACE FUNCTION optimize_sync_data(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    data_type_record RECORD;
BEGIN
    -- Loop through each data type configuration
    FOR data_type_record IN 
        SELECT data_type, max_versions, retention_days 
        FROM sync_data_types 
        WHERE is_active = true
    LOOP
        -- Delete old versions beyond max_versions limit
        WITH ranked_data AS (
            SELECT id, 
                   ROW_NUMBER() OVER (
                       PARTITION BY user_id, data_type, data_id 
                       ORDER BY version DESC
                   ) as rn
            FROM sync_data 
            WHERE data_type = data_type_record.data_type
            AND (p_user_id IS NULL OR user_id = p_user_id)
        )
        DELETE FROM sync_data 
        WHERE id IN (
            SELECT id FROM ranked_data 
            WHERE rn > data_type_record.max_versions
        );
        
        GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
        
        -- Delete data beyond retention period
        DELETE FROM sync_data 
        WHERE data_type = data_type_record.data_type
        AND (p_user_id IS NULL OR user_id = p_user_id)
        AND created_at < NOW() - INTERVAL '%s days', data_type_record.retention_days;
        
        GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sync_data_user_type_timestamp 
ON sync_data (user_id, data_type, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sync_data_version_cleanup 
ON sync_data (data_type, user_id, data_id, version DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sync_metrics_analytics 
ON sync_metrics (user_id, platform, timestamp DESC) 
WHERE success = true;

-- Row Level Security (RLS) policies
ALTER TABLE sync_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for sync_data
CREATE POLICY "Users can access their own sync data" ON sync_data
    FOR ALL USING (auth.uid() = user_id);

-- Policies for sync_conflicts
CREATE POLICY "Users can access their own conflicts" ON sync_conflicts
    FOR ALL USING (auth.uid() = user_id);

-- Policies for device_sync_status
CREATE POLICY "Users can access their own device status" ON device_sync_status
    FOR ALL USING (auth.uid() = user_id);

-- Policies for sync_metrics
CREATE POLICY "Users can access their own sync metrics" ON sync_metrics
    FOR ALL USING (auth.uid() = user_id);

-- Policies for sync_queue
CREATE POLICY "Users can access their own sync queue" ON sync_queue
    FOR ALL USING (auth.uid() = user_id);

-- Policies for sync_sessions
CREATE POLICY "Users can access their own sync sessions" ON sync_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Create a view for sync dashboard
CREATE OR REPLACE VIEW sync_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT dss.device_id) as total_devices,
    COUNT(DISTINCT dss.platform) as platforms_used,
    MAX(dss.last_sync) as last_sync_time,
    SUM(dss.sync_count) as total_sync_operations,
    COUNT(sc.id) FILTER (WHERE sc.status = 'pending') as pending_conflicts,
    COUNT(sc.id) FILTER (WHERE sc.status = 'resolved') as resolved_conflicts,
    AVG(sm.duration_ms) FILTER (WHERE sm.timestamp >= NOW() - INTERVAL '7 days') as avg_sync_duration_7d,
    COUNT(sm.id) FILTER (WHERE sm.timestamp >= NOW() - INTERVAL '24 hours' AND sm.success = true) as successful_syncs_24h,
    COUNT(sm.id) FILTER (WHERE sm.timestamp >= NOW() - INTERVAL '24 hours' AND sm.success = false) as failed_syncs_24h
FROM auth.users u
LEFT JOIN device_sync_status dss ON u.id = dss.user_id
LEFT JOIN sync_conflicts sc ON u.id = sc.user_id
LEFT JOIN sync_metrics sm ON u.id = sm.user_id
GROUP BY u.id, u.email;

-- Grant necessary permissions
GRANT SELECT ON sync_dashboard TO authenticated;
GRANT SELECT ON sync_data_types TO authenticated;

-- Create scheduled job to cleanup expired conflicts (if pg_cron is available)
-- SELECT cron.schedule('cleanup-expired-conflicts', '0 */6 * * *', 'SELECT cleanup_expired_conflicts();');

-- Create scheduled job to optimize sync data (if pg_cron is available)
-- SELECT cron.schedule('optimize-sync-data', '0 2 * * 0', 'SELECT optimize_sync_data();');

-- Comments for documentation
COMMENT ON TABLE sync_data IS 'Stores synchronized data across all platforms with versioning and conflict detection';
COMMENT ON TABLE sync_conflicts IS 'Tracks data conflicts that require resolution between platforms';
COMMENT ON TABLE device_sync_status IS 'Maintains sync status and metadata for each user device';
COMMENT ON TABLE sync_metrics IS 'Records sync operation metrics for performance monitoring and analytics';
COMMENT ON TABLE sync_queue IS 'Manages queued sync operations for offline and retry scenarios';
COMMENT ON TABLE sync_data_types IS 'Configuration for different data types and their sync behavior';
COMMENT ON TABLE sync_sessions IS 'Tracks complete sync sessions for debugging and analytics';

COMMENT ON FUNCTION cleanup_expired_conflicts() IS 'Marks expired conflicts as expired status';
COMMENT ON FUNCTION get_sync_statistics(UUID, INTEGER) IS 'Returns sync statistics for a user over specified days';
COMMENT ON FUNCTION optimize_sync_data(UUID) IS 'Removes old sync data versions based on retention policies';

