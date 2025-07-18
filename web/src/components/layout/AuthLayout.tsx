import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, Sparkles } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/20 animate-pulse" />
          <div className="absolute top-32 right-20 w-16 h-16 rounded-full bg-white/10 animate-pulse delay-1000" />
          <div className="absolute bottom-32 left-20 w-24 h-24 rounded-full bg-white/15 animate-pulse delay-500" />
          <div className="absolute bottom-20 right-32 w-12 h-12 rounded-full bg-white/25 animate-pulse delay-300" />
        </div>

        <div className="relative z-10 max-w-md mx-auto text-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold text-white mb-4">
            Find Your Perfect Match
          </h1>
          
          <p className="text-lg text-white/90 mb-8">
            AI-powered dating coach that helps you optimize your profile, conversations, and confidence for dating success.
          </p>

          {/* Features */}
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3 text-white/90">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span>AI-powered photo analysis & optimization</span>
            </div>
            <div className="flex items-center space-x-3 text-white/90">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span>Real-time conversation coaching</span>
            </div>
            <div className="flex items-center space-x-3 text-white/90">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span>Voice confidence training</span>
            </div>
            <div className="flex items-center space-x-3 text-white/90">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span>Progress tracking & insights</span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-white">50K+</div>
              <div className="text-sm text-white/80">Success Stories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">85%</div>
              <div className="text-sm text-white/80">Match Improvement</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">4.9★</div>
              <div className="text-sm text-white/80">User Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="flex items-center justify-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AI Dating Coach</span>
            </Link>
          </div>

          {/* Auth Content */}
          {children}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-purple-600 hover:text-purple-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-purple-600 hover:text-purple-500">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
