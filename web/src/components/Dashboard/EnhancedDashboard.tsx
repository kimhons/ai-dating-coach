import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, MessageCircle, Heart, 
  Star, Calendar, Clock, Target, Award, Zap, Shield,
  BarChart3, PieChart as PieChartIcon, Activity, Settings,
  Download, Upload, RefreshCw, Filter, Search, Bell,
  ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock
} from 'lucide-react';

interface DashboardProps {
  user: any;
  tierInfo: any;
  analytics: any;
  onUpgrade: () => void;
  onSettingsChange: (settings: any) => void;
}

interface AnalyticsData {
  profileAnalyses: number;
  conversationCoaching: number;
  successRate: number;
  matchesImproved: number;
  responseRate: number;
  averageRating: number;
  totalSessions: number;
  timeSpent: number;
}

interface TierUsage {
  feature: string;
  used: number;
  limit: number;
  percentage: number;
}

const EnhancedDashboard: React.FC<DashboardProps> = ({
  user,
  tierInfo,
  analytics,
  onUpgrade,
  onSettingsChange
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  // Sample data - in production, this would come from props/API
  const analyticsData: AnalyticsData = {
    profileAnalyses: analytics?.profileAnalyses || 127,
    conversationCoaching: analytics?.conversationCoaching || 89,
    successRate: analytics?.successRate || 0.73,
    matchesImproved: analytics?.matchesImproved || 34,
    responseRate: analytics?.responseRate || 0.68,
    averageRating: analytics?.averageRating || 4.2,
    totalSessions: analytics?.totalSessions || 156,
    timeSpent: analytics?.timeSpent || 2340 // minutes
  };

  const tierUsageData: TierUsage[] = [
    { feature: 'Profile Analysis', used: 15, limit: 20, percentage: 75 },
    { feature: 'Conversation Coaching', used: 8, limit: 15, percentage: 53 },
    { feature: 'Real-time Suggestions', used: 45, limit: 100, percentage: 45 },
    { feature: 'Advanced Analytics', used: 3, limit: 5, percentage: 60 }
  ];

  const weeklyData = [
    { day: 'Mon', analyses: 12, coaching: 8, matches: 3 },
    { day: 'Tue', analyses: 15, coaching: 11, matches: 5 },
    { day: 'Wed', analyses: 18, coaching: 14, matches: 4 },
    { day: 'Thu', analyses: 22, coaching: 16, matches: 7 },
    { day: 'Fri', analyses: 28, coaching: 20, matches: 9 },
    { day: 'Sat', analyses: 35, coaching: 25, matches: 12 },
    { day: 'Sun', analyses: 31, coaching: 22, matches: 8 }
  ];

  const platformData = [
    { name: 'Tinder', value: 45, color: '#FF6B6B' },
    { name: 'Bumble', value: 30, color: '#4ECDC4' },
    { name: 'Hinge', value: 15, color: '#45B7D1' },
    { name: 'Match', value: 10, color: '#96CEB4' }
  ];

  const successMetrics = [
    { metric: 'Match Rate', value: 73, change: 12, trend: 'up' },
    { metric: 'Response Rate', value: 68, change: 8, trend: 'up' },
    { metric: 'Conversation Length', value: 4.2, change: -2, trend: 'down' },
    { metric: 'Profile Views', value: 156, change: 23, trend: 'up' }
  ];

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'text-gray-600 bg-gray-100';
      case 'premium': return 'text-blue-600 bg-blue-100';
      case 'pro': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome back, {user?.name || 'User'}! 👋
              </h1>
              <p className="text-slate-600">
                Here's your dating performance overview and insights
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Tier Badge */}
              <div className={`px-4 py-2 rounded-full font-semibold text-sm ${getTierColor(tierInfo?.tier)}`}>
                {tierInfo?.tier?.toUpperCase() || 'FREE'} TIER
              </div>
              
              {/* Time Range Selector */}
              <select 
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
              </select>
              
              {/* Refresh Button */}
              <button 
                onClick={() => setIsLoading(true)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Profile Analyses',
              value: analyticsData.profileAnalyses,
              change: '+12%',
              trend: 'up',
              icon: Eye,
              color: 'blue'
            },
            {
              title: 'Coaching Sessions',
              value: analyticsData.conversationCoaching,
              change: '+8%',
              trend: 'up',
              icon: MessageCircle,
              color: 'green'
            },
            {
              title: 'Success Rate',
              value: `${Math.round(analyticsData.successRate * 100)}%`,
              change: '+5%',
              trend: 'up',
              icon: Target,
              color: 'purple'
            },
            {
              title: 'Matches Improved',
              value: analyticsData.matchesImproved,
              change: '+23%',
              trend: 'up',
              icon: Heart,
              color: 'red'
            }
          ].map((metric, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                  <metric.icon className={`w-6 h-6 text-${metric.color}-600`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {metric.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{metric.value}</h3>
              <p className="text-slate-600 text-sm">{metric.title}</p>
            </div>
          ))}
        </div>

        {/* Tier Usage Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
          <div 
            className="flex items-center justify-between p-6 cursor-pointer"
            onClick={() => toggleSection('usage')}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">Tier Usage & Limits</h2>
            </div>
            {expandedSections.has('usage') ? 
              <ChevronDown className="w-5 h-5 text-slate-400" /> : 
              <ChevronRight className="w-5 h-5 text-slate-400" />
            }
          </div>
          
          {expandedSections.has('usage') && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tierUsageData.map((usage, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-slate-900">{usage.feature}</span>
                      <span className="text-sm text-slate-600">
                        {usage.used}/{usage.limit === -1 ? '∞' : usage.limit}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(usage.percentage)}`}
                        style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {usage.percentage}% used
                    </div>
                  </div>
                ))}
              </div>
              
              {tierInfo?.tier === 'free' && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Upgrade to Premium</h3>
                      <p className="text-sm text-slate-600">
                        Unlock unlimited analyses, advanced coaching, and priority support
                      </p>
                    </div>
                    <button 
                      onClick={onUpgrade}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                    >
                      Upgrade Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Weekly Activity Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Weekly Activity</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-slate-600">Analyses</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-slate-600">Coaching</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-xs text-slate-600">Matches</span>
                </div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area type="monotone" dataKey="analyses" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="coaching" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="matches" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Distribution */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Platform Usage</h3>
            
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              {platformData.map((platform, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: platform.color }}
                  />
                  <span className="text-sm text-slate-600">{platform.name}</span>
                  <span className="text-sm font-medium text-slate-900">{platform.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Success Metrics */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
          <div 
            className="flex items-center justify-between p-6 cursor-pointer"
            onClick={() => toggleSection('metrics')}
          >
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-slate-900">Success Metrics</h2>
            </div>
            {expandedSections.has('metrics') ? 
              <ChevronDown className="w-5 h-5 text-slate-400" /> : 
              <ChevronRight className="w-5 h-5 text-slate-400" />
            }
          </div>
          
          {expandedSections.has('metrics') && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {successMetrics.map((metric, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-600">{metric.metric}</span>
                      <div className={`flex items-center gap-1 text-xs ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(metric.change)}%
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {typeof metric.value === 'number' && metric.value < 10 ? 
                        metric.value.toFixed(1) : 
                        metric.value
                      }
                      {metric.metric.includes('Rate') ? '%' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Advanced Analytics (Premium Feature) */}
        {(tierInfo?.tier === 'premium' || tierInfo?.tier === 'pro') && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer"
              onClick={() => toggleSection('advanced')}
            >
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-yellow-600" />
                <h2 className="text-xl font-bold text-slate-900">Advanced Analytics</h2>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                  PREMIUM
                </span>
              </div>
              {expandedSections.has('advanced') ? 
                <ChevronDown className="w-5 h-5 text-slate-400" /> : 
                <ChevronRight className="w-5 h-5 text-slate-400" />
              }
            </div>
            
            {expandedSections.has('advanced') && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Conversion Funnel */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-900 mb-4">Conversion Funnel</h4>
                    <div className="space-y-3">
                      {[
                        { stage: 'Profile Views', value: 1250, percentage: 100 },
                        { stage: 'Matches', value: 156, percentage: 12.5 },
                        { stage: 'Conversations', value: 89, percentage: 7.1 },
                        { stage: 'Dates', value: 23, percentage: 1.8 }
                      ].map((stage, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{stage.stage}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${stage.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-900 w-12 text-right">
                              {stage.value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-900 mb-4">AI Insights</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm text-blue-800">
                          <strong>Photo Optimization:</strong> Your main photo performs 23% better than average. Consider using similar lighting for other photos.
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <p className="text-sm text-green-800">
                          <strong>Bio Enhancement:</strong> Adding humor increased your match rate by 15% this week.
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                        <p className="text-sm text-yellow-800">
                          <strong>Timing Insight:</strong> You get 40% more matches when active between 7-9 PM.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Eye, label: 'Analyze Profile', color: 'blue' },
              { icon: MessageCircle, label: 'Get Coaching', color: 'green' },
              { icon: Download, label: 'Export Data', color: 'purple' },
              { icon: Settings, label: 'Settings', color: 'gray' }
            ].map((action, index) => (
              <button
                key={index}
                className={`p-4 bg-${action.color}-50 hover:bg-${action.color}-100 rounded-lg transition-colors group`}
              >
                <action.icon className={`w-6 h-6 text-${action.color}-600 mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                <span className="text-sm font-medium text-slate-900 block">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
          <div 
            className="flex items-center justify-between p-6 cursor-pointer"
            onClick={() => toggleSection('activity')}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-slate-600" />
              <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            </div>
            {expandedSections.has('activity') ? 
              <ChevronDown className="w-5 h-5 text-slate-400" /> : 
              <ChevronRight className="w-5 h-5 text-slate-400" />
            }
          </div>
          
          {expandedSections.has('activity') && (
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {[
                  { 
                    type: 'analysis', 
                    message: 'Profile analysis completed for Tinder', 
                    time: '2 hours ago',
                    icon: Eye,
                    color: 'blue'
                  },
                  { 
                    type: 'coaching', 
                    message: 'Conversation coaching session on Bumble', 
                    time: '4 hours ago',
                    icon: MessageCircle,
                    color: 'green'
                  },
                  { 
                    type: 'match', 
                    message: 'New match achieved using AI suggestions', 
                    time: '6 hours ago',
                    icon: Heart,
                    color: 'red'
                  },
                  { 
                    type: 'upgrade', 
                    message: 'Tier usage limit reached for profile analysis', 
                    time: '1 day ago',
                    icon: Lock,
                    color: 'yellow'
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                    <div className={`p-2 bg-${activity.color}-100 rounded-lg`}>
                      <activity.icon className={`w-4 h-4 text-${activity.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                      <p className="text-xs text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;

