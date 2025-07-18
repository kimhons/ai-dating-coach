import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, 
  Camera, 
  MessageCircle, 
  Mic, 
  Monitor, 
  Users, 
  TrendingUp, 
  Settings, 
  User, 
  CreditCard,
  Menu,
  X,
  Zap,
  Crown,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface AppLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Photo Analysis', href: '/photo-analysis', icon: Camera },
  { name: 'Conversation Coach', href: '/conversation-analysis', icon: MessageCircle },
  { name: 'Voice Training', href: '/voice-analysis', icon: Mic, tier: 'elite' },
  { name: 'Screen Monitor', href: '/screen-monitoring', icon: Monitor, tier: 'premium' },
  { name: 'Social Analytics', href: '/social-analytics', icon: Users, tier: 'elite' },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
]

const bottomNavigation = [
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { currentPlan, usageLimits } = useSubscription()
  const location = useLocation()
  const navigate = useNavigate()

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'spark': return <Zap className="w-4 h-4 text-orange-500" />
      case 'premium': return <Sparkles className="w-4 h-4 text-purple-500" />
      case 'elite': return <Crown className="w-4 h-4 text-yellow-500" />
      default: return <Zap className="w-4 h-4 text-gray-500" />
    }
  }

  const canAccessFeature = (requiredTier?: string) => {
    if (!requiredTier) return true
    
    const tierLevels = { spark: 0, premium: 1, elite: 2 }
    const userLevel = tierLevels[user?.subscription_tier || 'spark']
    const requiredLevel = tierLevels[requiredTier as keyof typeof tierLevels] || 0
    
    return userLevel >= requiredLevel
  }

  const Sidebar = ({ mobile = false }) => (
    <div className={cn(
      "flex flex-col h-full bg-white shadow-xl",
      mobile ? "w-full" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AC</span>
          </div>
          <span className="font-bold text-gray-900">AI Dating Coach</span>
        </div>
        {mobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.full_name || 'User'}
            </p>
            <div className="flex items-center space-x-1">
              {getTierIcon(user?.subscription_tier || 'spark')}
              <span className="text-xs text-gray-500 capitalize">
                {user?.subscription_tier || 'spark'} Plan
              </span>
            </div>
          </div>
        </div>
        
        {/* Usage Progress */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Monthly Usage</span>
            <span>{usageLimits.used}/{usageLimits.limit}</span>
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          const hasAccess = canAccessFeature(item.tier)
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "bg-purple-100 text-purple-700"
                  : hasAccess
                  ? "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  : "text-gray-400 cursor-not-allowed"
              )}
              onClick={(e) => {
                if (!hasAccess) {
                  e.preventDefault()
                  navigate('/pricing')
                }
                if (mobile) setSidebarOpen(false)
              }}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5 transition-colors",
                isActive
                  ? "text-purple-700"
                  : hasAccess
                  ? "text-gray-500 group-hover:text-gray-700"
                  : "text-gray-300"
              )} />
              <span className="flex-1">{item.name}</span>
              {item.tier && !hasAccess && (
                <Crown className="w-4 h-4 text-yellow-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-6 py-4 border-t border-gray-200 space-y-1">
        {bottomNavigation.map((item) => {
          const isActive = location.pathname === item.href
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
              onClick={() => mobile && setSidebarOpen(false)}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5 transition-colors",
                isActive ? "text-purple-700" : "text-gray-500 group-hover:text-gray-700"
              )} />
              {item.name}
            </Link>
          )
        })}
        
        {/* Upgrade Button */}
        {user?.subscription_tier === 'spark' && (
          <Button
            onClick={() => {
              navigate('/pricing')
              if (mobile) setSidebarOpen(false)
            }}
            className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        )}
        
        {/* Sign Out */}
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full mt-2 text-gray-600 hover:text-gray-900"
        >
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white shadow-sm border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">AC</span>
            </div>
            <span className="font-bold text-gray-900">AI Dating Coach</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
