import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ProfileAnalysis from './pages/ProfileAnalysis';
import ConversationCoaching from './pages/ConversationCoaching';
import ScreenshotAnalysis from './pages/ScreenshotAnalysis';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useTier } from './hooks/useTier';
import { useSync } from './hooks/useSync';

// Services
import { AnalyticsService } from './services/AnalyticsService';
import { ErrorBoundary } from './components/ErrorBoundary';

// Styles
import './styles/App.css';

const App: React.FC = () => {
  const { user, loading: authLoading, login, logout } = useAuth();
  const { tier, usage, loading: tierLoading } = useTier();
  const { syncStatus, lastSync } = useSync();
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
        if ('web-vitals' in window) {
          const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
          getCLS(AnalyticsService.trackWebVital);
          getFID(AnalyticsService.trackWebVital);
          getFCP(AnalyticsService.trackWebVital);
          getLCP(AnalyticsService.trackWebVital);
          getTTFB(AnalyticsService.trackWebVital);
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
      <div className="app-loading">
        <LoadingSpinner size="large" />
        <p>Initializing AI Dating Coach...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          {/* Global Toaster for notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          {/* Navigation */}
          <Navbar 
            user={user} 
            tier={tier}
            onLogin={login}
            onLogout={logout}
          />

          {/* Sync Status Indicator */}
          {user && (
            <SyncStatusIndicator 
              status={syncStatus}
              lastSync={lastSync}
            />
          )}

          {/* Main Content */}
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={
                user ? <Navigate to="/dashboard" replace /> : <Login />
              } />
              <Route path="/signup" element={
                user ? <Navigate to="/dashboard" replace /> : <Signup />
              } />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute user={user}>
                  <Dashboard user={user} tier={tier} usage={usage} />
                </ProtectedRoute>
              } />
              
              <Route path="/profile-analysis" element={
                <ProtectedRoute user={user}>
                  <ProfileAnalysis tier={tier} usage={usage} />
                </ProtectedRoute>
              } />
              
              <Route path="/conversation-coaching" element={
                <ProtectedRoute user={user}>
                  <ConversationCoaching tier={tier} usage={usage} />
                </ProtectedRoute>
              } />
              
              <Route path="/screenshot-analysis" element={
                <ProtectedRoute user={user}>
                  <ScreenshotAnalysis tier={tier} usage={usage} />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute user={user}>
                  <Settings user={user} />
                </ProtectedRoute>
              } />

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />

          {/* Tier Upgrade Modal */}
          {user && <TierUpgradeModal tier={tier} usage={usage} />}
        </div>
      </Router>
    </ErrorBoundary>
  );
};

// Protected Route Component
interface ProtectedRouteProps {
  user: any;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Sync Status Indicator Component
interface SyncStatusIndicatorProps {
  status: 'synced' | 'syncing' | 'error' | 'offline';
  lastSync: Date | null;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ status, lastSync }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status === 'syncing' || status === 'error') {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!isVisible) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: '🔄',
          text: 'Syncing data...',
          className: 'sync-status-syncing'
        };
      case 'synced':
        return {
          icon: '✅',
          text: 'Data synced',
          className: 'sync-status-synced'
        };
      case 'error':
        return {
          icon: '❌',
          text: 'Sync failed',
          className: 'sync-status-error'
        };
      case 'offline':
        return {
          icon: '📱',
          text: 'Offline mode',
          className: 'sync-status-offline'
        };
      default:
        return {
          icon: '❓',
          text: 'Unknown status',
          className: 'sync-status-unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`sync-status-indicator ${config.className}`}>
      <span className="sync-status-icon">{config.icon}</span>
      <span className="sync-status-text">{config.text}</span>
      {lastSync && (
        <span className="sync-status-time">
          Last sync: {lastSync.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

// Tier Upgrade Modal Component
interface TierUpgradeModalProps {
  tier: any;
  usage: any;
}

const TierUpgradeModal: React.FC<TierUpgradeModalProps> = ({ tier, usage }) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Show upgrade modal when user approaches limits
    if (tier && usage) {
      const shouldShowUpgrade = Object.values(usage).some((feature: any) => {
        if (feature.limit === -1) return false; // Unlimited
        return (feature.used / feature.limit) > 0.8; // 80% usage
      });

      if (shouldShowUpgrade && tier.name !== 'pro') {
        setShowModal(true);
      }
    }
  }, [tier, usage]);

  if (!showModal) return null;

  return (
    <div className="tier-upgrade-modal-overlay">
      <div className="tier-upgrade-modal">
        <div className="tier-upgrade-modal-header">
          <h3>Upgrade Your Plan</h3>
          <button 
            className="tier-upgrade-modal-close"
            onClick={() => setShowModal(false)}
          >
            ×
          </button>
        </div>
        
        <div className="tier-upgrade-modal-body">
          <div className="upgrade-message">
            <p>You're approaching your monthly limits!</p>
            <p>Upgrade to get unlimited access to all features.</p>
          </div>
          
          <div className="usage-summary">
            {Object.entries(usage).map(([feature, data]: [string, any]) => (
              <div key={feature} className="usage-item">
                <span className="usage-feature">{feature}</span>
                <div className="usage-bar">
                  <div 
                    className="usage-fill"
                    style={{ 
                      width: data.limit === -1 ? '100%' : `${(data.used / data.limit) * 100}%` 
                    }}
                  />
                </div>
                <span className="usage-text">
                  {data.limit === -1 ? 'Unlimited' : `${data.used}/${data.limit}`}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="tier-upgrade-modal-footer">
          <button 
            className="btn-secondary"
            onClick={() => setShowModal(false)}
          >
            Maybe Later
          </button>
          <button 
            className="btn-primary"
            onClick={() => {
              window.location.href = '/pricing';
              AnalyticsService.trackEvent('upgrade_modal_clicked', { 
                current_tier: tier.name 
              });
            }}
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;

