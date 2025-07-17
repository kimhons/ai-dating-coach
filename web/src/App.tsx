import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { useSubscriptionRedirect } from '@/hooks/useSubscription'

// Layout Components
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

// Page Components
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PhotoAnalysisPage } from '@/pages/PhotoAnalysisPage'
import { ConversationAnalysisPage } from '@/pages/ConversationAnalysisPage'
import { VoiceAnalysisPage } from '@/pages/VoiceAnalysisPage'
import { ScreenMonitoringPage } from '@/pages/ScreenMonitoringPage'
import { SocialAnalyticsPage } from '@/pages/SocialAnalyticsPage'
import { ProgressPage } from '@/pages/ProgressPage'
import { PricingPage } from '@/pages/PricingPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect to onboarding if not completed
  if (!user.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

// Public Route Component (redirects authenticated users)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (user) {
    if (!user.onboarding_completed) {
      return <Navigate to="/onboarding" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// App Routes Component
function AppRoutes() {
  const { handleSubscriptionRedirect } = useSubscriptionRedirect()

  useEffect(() => {
    handleSubscriptionRedirect()
  }, [])

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <PublicRoute>
          <LandingPage />
        </PublicRoute>
      } />
      
      <Route path="/pricing" element={<PricingPage />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        </PublicRoute>
      } />
      
      <Route path="/signup" element={
        <PublicRoute>
          <AuthLayout>
            <SignUpPage />
          </AuthLayout>
        </PublicRoute>
      } />
      
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Onboarding Route */}
      <Route path="/onboarding" element={
        <AuthLayout>
          <OnboardingPage />
        </AuthLayout>
      } />

      {/* Protected App Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/photo-analysis" element={
        <ProtectedRoute>
          <AppLayout>
            <PhotoAnalysisPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/conversation-analysis" element={
        <ProtectedRoute>
          <AppLayout>
            <ConversationAnalysisPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/voice-analysis" element={
        <ProtectedRoute>
          <AppLayout>
            <VoiceAnalysisPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/screen-monitoring" element={
        <ProtectedRoute>
          <AppLayout>
            <ScreenMonitoringPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/social-analytics" element={
        <ProtectedRoute>
          <AppLayout>
            <SocialAnalyticsPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/progress" element={
        <ProtectedRoute>
          <AppLayout>
            <ProgressPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <AppLayout>
            <ProfilePage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <AppLayout>
            <SettingsPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Main App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #374151',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#f9fafb',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#f9fafb',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
