import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Components
import { ErrorBoundary } from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import { LandingPage } from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import { PhotoAnalysisPage } from './pages/PhotoAnalysisPage';
import { ConversationAnalysisPage } from './pages/ConversationAnalysisPage';
import { ScreenMonitoringPage } from './pages/ScreenMonitoringPage';
import { SettingsPage } from './pages/SettingsPage';
import { PricingPage } from './pages/PricingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignUpPage } from './pages/auth/SignUpPage';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useSubscription } from './hooks/useSubscription';

// Services
import { AnalyticsService } from './services/AnalyticsService';

// Styles
import './App.css';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize application
    const initializeApp = async () => {
      try {
        // Initialize analytics
        AnalyticsService.initialize();
        
        // Track page view
        AnalyticsService.trackPageView(window.location.pathname);
        
        // Initialize performance monitoring
        try {
          const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');
          onCLS((metric) => AnalyticsService.trackWebVital(metric));
          onINP((metric) => AnalyticsService.trackWebVital(metric));
          onFCP((metric) => AnalyticsService.trackWebVital(metric));
          onLCP((metric) => AnalyticsService.trackWebVital(metric));
          onTTFB((metric) => AnalyticsService.trackWebVital(metric));
        } catch (error) {
          console.log('Web vitals not available');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true); // Continue even if initialization fails
      }
    };

    initializeApp();
  }, []);

  // Show loading spinner while app is initializing
  if (!isInitialized || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          {/* Global Toaster for notifications */}
          <Toaster position="top-right" />

          {/* Main Content */}
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/login" element={
                user ? <Navigate to="/dashboard" replace /> : <LoginPage />
              } />
              <Route path="/signup" element={
                user ? <Navigate to="/dashboard" replace /> : <SignUpPage />
              } />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                user ? (
                  <Dashboard 
                    user={user} 
                    tier={subscription?.plan_type || 'free'} 
                    usage={{}} 
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              } />
              
              <Route path="/photo-analysis" element={
                user ? <PhotoAnalysisPage /> : <Navigate to="/login" replace />
              } />
              
              <Route path="/conversation-analysis" element={
                user ? <ConversationAnalysisPage /> : <Navigate to="/login" replace />
              } />
              
              <Route path="/screen-monitoring" element={
                user ? <ScreenMonitoringPage /> : <Navigate to="/login" replace />
              } />
              
              <Route path="/settings" element={
                user ? <SettingsPage /> : <Navigate to="/login" replace />
              } />

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;

