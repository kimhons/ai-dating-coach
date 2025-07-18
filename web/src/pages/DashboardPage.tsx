import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Camera, 
  MessageCircle, 
  Mic, 
  Monitor, 
  Users, 
  TrendingUp,
  Plus,
  Zap,
  Crown,
  Sparkles,
  ArrowRight,
  Target,
  Calendar,
  Award
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { AnalyticsService } from '@/services/AnalyticsService'
import { AnalysisService } from '@/services/AnalysisService'
import { useTierFeatures } from '@/hooks/useAIAnalysis'
import { Button } from '@/components/ui/Button'
import { cn, formatRelativeTime } from '@/lib/utils'

export function DashboardPage() {
  const { user } = useAuth()
  const { currentPlan, usageLimits } = useSubscription()
  const { hasFeature } = useTierFeatures()
  const [achievements, setAchievements] = useState(0)
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        // For now, set mock data. TODO: Replace with actual API calls
        setAchievements(3)
        setRecentAnalyses([
          {
            id: 1,
            type: 'photo',
            title: 'Profile Photo Analysis',
            timestamp: new Date().toISOString(),
            score: 85
          }
        ])
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboardData()
  }, [user])

  const quickActions = [
    {
      title: 'Analyze Photo',
      description: 'Get AI feedback on your dating photos',
      icon: Camera,
      href: '/photo-analysis',
      color: 'from-blue-500 to-cyan-500',
      available: true
    },
    {
      title: 'Review Conversation',
      description: 'Get coaching on your conversations',
      icon: MessageCircle,
      href: '/conversation-analysis',
      color: 'from-green-500 to-emerald-500',
      available: true
    },
    {
      title: 'Voice Training',
      description: 'Practice your voice confidence',
      icon: Mic,
      href: '/voice-analysis',
      color: 'from-purple-500 to-violet-500',
      available: hasFeature('voice_analysis'),
      tier: 'elite'
    },
    {
      title: 'Screen Monitor',
      description: 'Real-time dating app coaching',
      icon: Monitor,
      href: '/screen-monitoring',
      color: 'from-orange-500 to-red-500',
      available: hasFeature('screen_monitoring'),
      tier: 'premium'
    }
  ]

  const stats = [
    {
      label: 'Analyses This Month',
      value: user?.usage_count || 0,
      max: user?.monthly_limit || 5,
      icon: Target,
      color: 'text-blue-600'
    },
    {
      label: 'Confidence Score',
      value: user?.confidence_score || 50,
      max: 100,
      icon: TrendingUp,
      color: 'text-green-600',
      suffix: '%'
    },
    {
      label: 'Days Active',
      value: user ? Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      icon: Calendar,
      color: 'text-purple-600'
    },
    {
      label: 'Achievements',
      value: achievements,
      icon: Award,
      color: 'text-yellow-600'
    }
  ]

  // recentAnalyses state is now loaded from the useEffect above

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'spark': return <Zap className="w-4 h-4 text-orange-500" />
      case 'premium': return <Sparkles className="w-4 h-4 text-purple-500" />
      case 'elite': return <Crown className="w-4 h-4 text-yellow-500" />
      default: return <Zap className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.full_name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-gray-600">
          Ready to boost your dating success? Let's see what we can improve today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-lg bg-gray-50", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              {stat.max && (
                <span className="text-xs text-gray-500">
                  / {stat.max}{stat.suffix || ''}
                </span>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}{stat.suffix || ''}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
              {stat.max && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      stat.value / stat.max > 0.8 ? "bg-red-500" :
                      stat.value / stat.max > 0.6 ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ width: `${Math.min(100, (stat.value / stat.max) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Usage Warning */}
      {usageLimits.percentage > 80 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="text-yellow-600">
              ⚠️
            </div>
            <div>
              <p className="text-yellow-800 font-medium">
                You're running low on monthly analyses
              </p>
              <p className="text-yellow-700 text-sm">
                {usageLimits.used} of {usageLimits.limit} used this month. 
                {user?.subscription_tier === 'spark' && (
                  <span> Consider upgrading for more analyses.</span>
                )}
              </p>
            </div>
            {user?.subscription_tier === 'spark' && (
              <Link to="/pricing">
                <Button size="sm" className="ml-auto">
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <div key={index}>
              {action.available ? (
                <Link to={action.href}>
                  <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer">
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-105 transition-transform",
                      action.color
                    )}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                    <div className="flex items-center text-sm text-purple-600 group-hover:text-purple-700">
                      Get started
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 opacity-75">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mb-4">
                    <action.icon className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-600 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{action.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Crown className="w-3 h-3 mr-1" />
                      {action.tier?.charAt(0).toUpperCase() + action.tier?.slice(1)} required
                    </span>
                    <Link to="/pricing">
                      <Button size="sm" variant="outline">
                        Upgrade
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {recentAnalyses.length > 0 ? (
              <div className="space-y-4">
                {recentAnalyses.length > 0 ? (
              recentAnalyses.map((analysis) => (
                <div key={analysis.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{analysis.title}</h4>
                      <p className="text-sm text-gray-600">
                        {formatRelativeTime(new Date(analysis.timestamp))}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{analysis.score}/100</div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recent analyses</p>
            )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
                <p className="text-gray-600 mb-4">
                  Start by analyzing a photo or conversation to get personalized feedback.
                </p>
                <Link to="/photo-analysis">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Start First Analysis
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              {getTierIcon(user?.subscription_tier || 'spark')}
              <div>
                <h3 className="font-semibold text-gray-900 capitalize">
                  {user?.subscription_tier || 'spark'} Plan
                </h3>
                <p className="text-sm text-gray-600">
                  {currentPlan.price === 'Free' ? 'Free' : `$${currentPlan.price}/month`}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly analyses</span>
                <span className="font-medium">
                  {usageLimits.used}/{usageLimits.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    usageLimits.percentage > 80 ? "bg-red-500" :
                    usageLimits.percentage > 60 ? "bg-yellow-500" : "bg-green-500"
                  )}
                  style={{ width: `${Math.min(100, usageLimits.percentage)}%` }}
                />
              </div>
            </div>

            {user?.subscription_tier === 'spark' && (
              <Link to="/pricing">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </Link>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Member since {user?.created_at ? formatRelativeTime(user.created_at) : 'recently'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
