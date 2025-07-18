import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BarChart3, Heart, TrendingUp, MessageSquare } from 'lucide-react';

// Components
import StatsCard from '../components/StatsCard';
import AnalysisChart from '../components/AnalysisChart';
import RecentActivity from '../components/RecentActivity';
import QuickActions from '../components/QuickActions';
import TierUsageWidget from '../components/TierUsageWidget';
import PerformanceMetrics from '../components/PerformanceMetrics';
import UpgradePrompt from '../components/UpgradePrompt';

// Services
import { AnalyticsService } from '../services/AnalyticsService';
import { DashboardService } from '../services/DashboardService';

// Types
interface DashboardProps {
  user: any;
  tier: any;
  usage: any;
}

interface DashboardData {
  stats: {
    totalAnalyses: number;
    successRate: number;
    matchRate: number;
    responseRate: number;
  };
  recentActivity: any[];
  performanceMetrics: any;
  tierUsage: any;
}

const Dashboard: React.FC<DashboardProps> = ({ user, tier, usage }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await DashboardService.getDashboardData(selectedTimeRange);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange]);

  useEffect(() => {
    loadDashboardData();
    
    // Track dashboard view
    AnalyticsService.trackEvent('dashboard_viewed', {
      user_tier: tier?.name,
      time_range: selectedTimeRange
    });
  }, [selectedTimeRange, tier, loadDashboardData]);

  const handleQuickAction = async (action: string) => {
    AnalyticsService.trackEvent('quick_action_clicked', { action });
    
    switch (action) {
      case 'analyze_profile':
        // Navigate to profile analysis
        window.location.href = '/profile-analysis';
        break;
      case 'start_coaching':
        // Navigate to conversation coaching
        window.location.href = '/conversation-coaching';
        break;
      case 'screenshot_analysis':
        // Navigate to screenshot analysis
        window.location.href = '/screenshot-analysis';
        break;
      case 'view_insights':
        // Scroll to insights section
        document.getElementById('insights-section')?.scrollIntoView({ behavior: 'smooth' });
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Welcome back, {user?.firstName || 'User'}! 👋</h1>
          <p className="dashboard-subtitle">
            Here's your dating performance overview
          </p>
        </div>
        
        <div className="dashboard-controls">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="time-range-selector"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button 
            onClick={loadDashboardData}
            className="refresh-button"
            title="Refresh data"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Tier Usage Widget */}
      <TierUsageWidget tier={tier} usage={usage} />

      {/* Stats Overview */}
      <div className="stats-grid">
        <StatsCard
          title="Total Analyses"
          value={dashboardData?.stats.totalAnalyses || 0}
          icon={BarChart3}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Success Rate"
          value={`${dashboardData?.stats.successRate || 0}%`}
          icon={Heart}
          trend={{ value: 25, isPositive: true }}
        />
        <StatsCard
          title="Match Rate"
          value={`${dashboardData?.stats.matchRate || 0}%`}
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Response Rate"
          value={`${dashboardData?.stats.responseRate || 0}%`}
          icon={MessageSquare}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Performance Chart */}
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <h3>Performance Trends</h3>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-color blue"></span>
                Profile Views
              </span>
              <span className="legend-item">
                <span className="legend-color green"></span>
                Matches
              </span>
              <span className="legend-item">
                <span className="legend-color purple"></span>
                Conversations
              </span>
            </div>
          </div>
          <AnalysisChart 
            data={dashboardData?.performanceMetrics || { labels: [], matchRates: [], responseRates: [] }}
          />
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card activity-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <Link to="/activity" className="view-all-link">
              View All
            </Link>
          </div>
          <RecentActivity activities={dashboardData?.recentActivity || []} />
        </div>

        {/* Performance Metrics */}
        <div className="dashboard-card metrics-card">
          <div className="card-header">
            <h3>Key Metrics</h3>
          </div>
          <PerformanceMetrics metrics={dashboardData?.performanceMetrics} />
        </div>

        {/* Tier Usage */}
        <TierUsageWidget 
          usage={dashboardData?.tierUsage || { 
            photos: { used: 0, limit: 5 },
            conversations: { used: 0, limit: 10 },
            voice: { used: 0, limit: 3 },
            screenshots: { used: 0, limit: 5 }
          }} 
          tier={tier?.name || 'free'} 
        />

        {/* Performance Metrics */}
        <PerformanceMetrics />

        {/* Feature Highlights */}
        <div className="dashboard-card features-card">
          <div className="card-header">
            <h3>New Features</h3>
          </div>
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <div className="feature-content">
                <h4>AI Keyboard</h4>
                <p>Smart suggestions while you type</p>
                <Link to="/settings" className="feature-link">
                  Enable →
                </Link>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">📸</div>
              <div className="feature-content">
                <h4>Screenshot Analysis</h4>
                <p>Instant profile analysis with one tap</p>
                <Link to="/screenshot-analysis" className="feature-link">
                  Try Now →
                </Link>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">🔄</div>
              <div className="feature-content">
                <h4>Cross-Platform Sync</h4>
                <p>Your data synced across all devices</p>
                <span className="feature-status enabled">Enabled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Prompt (for free/basic users) */}
        {tier?.name !== 'pro' && (
          <UpgradePrompt 
            currentTier={tier?.name || 'free'}
            onUpgrade={() => {
              window.location.href = '/pricing';
              AnalyticsService.trackEvent('dashboard_upgrade_clicked', {
                current_tier: tier?.name
              });
            }}
          />
        )}
      </div>

      {/* Success Stories Section */}
      <div className="dashboard-card success-stories">
        <div className="card-header">
          <h3>Success Stories</h3>
          <p className="card-subtitle">See how AI Dating Coach helped others</p>
        </div>
        <div className="success-stories-grid">
          <div className="success-story">
            <div className="story-avatar">👨</div>
            <div className="story-content">
              <p>"Increased my matches by 300% in just 2 weeks!"</p>
              <span className="story-author">- Mike R.</span>
            </div>
          </div>
          <div className="success-story">
            <div className="story-avatar">👩</div>
            <div className="story-content">
              <p>"The conversation coaching is amazing. Found my perfect match!"</p>
              <span className="story-author">- Sarah L.</span>
            </div>
          </div>
          <div className="success-story">
            <div className="story-avatar">👨</div>
            <div className="story-content">
              <p>"Profile analysis helped me understand what I was doing wrong."</p>
              <span className="story-author">- David K.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="dashboard-card tips-section">
        <div className="card-header">
          <h3>Daily Tips</h3>
          <span className="tips-refresh" onClick={loadDashboardData}>🔄</span>
        </div>
        <div className="tips-list">
          <div className="tip-item">
            <div className="tip-icon">💡</div>
            <div className="tip-content">
              <h4>Profile Tip</h4>
              <p>Add a photo with friends to show your social side. Profiles with group photos get 25% more matches.</p>
            </div>
          </div>
          <div className="tip-item">
            <div className="tip-icon">💬</div>
            <div className="tip-content">
              <h4>Conversation Tip</h4>
              <p>Ask open-ended questions about their interests. This leads to 40% longer conversations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

