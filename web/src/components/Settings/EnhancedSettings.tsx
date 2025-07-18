import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Palette, Globe, Smartphone, 
  Monitor, Download, Upload, Trash2, Eye, EyeOff,
  Lock, Unlock, Key, CreditCard, HelpCircle, 
  Save, RefreshCw, AlertTriangle, CheckCircle,
  Settings as SettingsIcon, Shield, Database,
  Zap, Target, MessageSquare, Camera, Mic,
  Calendar, Clock, Filter, Search, Star
} from 'lucide-react';

interface SettingsProps {
  user: any;
  settings: any;
  onSettingsUpdate: (settings: any) => void;
  onAccountAction: (action: string, data?: any) => void;
}

interface SettingSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
}

const EnhancedSettings: React.FC<SettingsProps> = ({
  user,
  settings,
  onSettingsUpdate,
  onAccountAction
}) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [localSettings, setLocalSettings] = useState(settings || {});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const sections: SettingSection[] = [
    {
      id: 'profile',
      title: 'Profile & Account',
      icon: User,
      description: 'Manage your personal information and account details'
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      description: 'Control your privacy settings and security preferences'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Configure how and when you receive notifications'
    },
    {
      id: 'ai-preferences',
      title: 'AI Preferences',
      icon: Zap,
      description: 'Customize AI coaching behavior and suggestions'
    },
    {
      id: 'platforms',
      title: 'Dating Platforms',
      icon: Smartphone,
      description: 'Manage connected dating apps and platform settings'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: Palette,
      description: 'Customize the look and feel of your dashboard'
    },
    {
      id: 'data',
      title: 'Data & Export',
      icon: Database,
      description: 'Manage your data, exports, and account deletion'
    },
    {
      id: 'billing',
      title: 'Billing & Subscription',
      icon: CreditCard,
      description: 'Manage your subscription and payment methods'
    }
  ];

  useEffect(() => {
    setLocalSettings(settings || {});
  }, [settings]);

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await onSettingsUpdate(localSettings);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = () => {
    setLocalSettings(settings || {});
    setHasChanges(false);
  };

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={localSettings.fullName || user?.name || ''}
              onChange={(e) => updateSetting('fullName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={localSettings.email || user?.email || ''}
              onChange={(e) => updateSetting('email', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Age
            </label>
            <input
              type="number"
              min="18"
              max="100"
              value={localSettings.age || ''}
              onChange={(e) => updateSetting('age', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={localSettings.location || ''}
              onChange={(e) => updateSetting('location', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="City, Country"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Dating Goals
          </label>
          <select
            value={localSettings.datingGoals || 'serious'}
            onChange={(e) => updateSetting('datingGoals', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="casual">Casual Dating</option>
            <option value="serious">Serious Relationship</option>
            <option value="marriage">Marriage</option>
            <option value="friends">Making Friends</option>
            <option value="networking">Professional Networking</option>
          </select>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Security</h3>
        
        <div className="space-y-4">
          <button className="flex items-center gap-3 w-full p-3 text-left bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <Key className="w-5 h-5 text-slate-600" />
            <div>
              <div className="font-medium text-slate-900">Change Password</div>
              <div className="text-sm text-slate-600">Update your account password</div>
            </div>
          </button>
          
          <button className="flex items-center gap-3 w-full p-3 text-left bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <Shield className="w-5 h-5 text-slate-600" />
            <div>
              <div className="font-medium text-slate-900">Two-Factor Authentication</div>
              <div className="text-sm text-slate-600">
                {localSettings.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Privacy</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Data Collection</div>
              <div className="text-sm text-slate-600">Allow collection of usage analytics</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.dataCollection !== false}
                onChange={(e) => updateSetting('dataCollection', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Profile Visibility</div>
              <div className="text-sm text-slate-600">Show your profile in success stories</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.profileVisibility !== false}
                onChange={(e) => updateSetting('profileVisibility', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Conversation Analysis</div>
              <div className="text-sm text-slate-600">Allow AI to analyze your conversations</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.conversationAnalysis !== false}
                onChange={(e) => updateSetting('conversationAnalysis', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Retention</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Keep conversation data for
            </label>
            <select
              value={localSettings.dataRetention || '30'}
              onChange={(e) => updateSetting('dataRetention', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="forever">Forever</option>
            </select>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-800">Data Retention Notice</div>
                <div className="text-sm text-yellow-700 mt-1">
                  Shorter retention periods may reduce AI coaching effectiveness but improve privacy.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Push Notifications</h3>
        
        <div className="space-y-4">
          {[
            { key: 'newMatches', label: 'New Matches', description: 'When you get a new match' },
            { key: 'messages', label: 'New Messages', description: 'When someone sends you a message' },
            { key: 'coachingTips', label: 'Coaching Tips', description: 'Daily AI coaching insights' },
            { key: 'profileViews', label: 'Profile Views', description: 'When someone views your profile' },
            { key: 'weeklyReport', label: 'Weekly Report', description: 'Your weekly dating performance summary' }
          ].map((notification) => (
            <div key={notification.key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">{notification.label}</div>
                <div className="text-sm text-slate-600">{notification.description}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.notifications?.[notification.key] !== false}
                  onChange={(e) => updateSetting(`notifications.${notification.key}`, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Email Notifications</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Frequency
            </label>
            <select
              value={localSettings.emailFrequency || 'weekly'}
              onChange={(e) => updateSetting('emailFrequency', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="never">Never</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Marketing Emails</div>
              <div className="text-sm text-slate-600">Product updates and tips</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.marketingEmails !== false}
                onChange={(e) => updateSetting('marketingEmails', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAIPreferencesSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Coaching Style</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Coaching Tone
            </label>
            <select
              value={localSettings.coachingTone || 'balanced'}
              onChange={(e) => updateSetting('coachingTone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="gentle">Gentle & Supportive</option>
              <option value="balanced">Balanced</option>
              <option value="direct">Direct & Honest</option>
              <option value="motivational">Motivational</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Suggestion Frequency
            </label>
            <select
              value={localSettings.suggestionFrequency || 'moderate'}
              onChange={(e) => updateSetting('suggestionFrequency', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="minimal">Minimal (Only when asked)</option>
              <option value="moderate">Moderate (Key moments)</option>
              <option value="frequent">Frequent (Real-time)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Focus Areas
            </label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { key: 'photos', label: 'Photo Optimization' },
                { key: 'bio', label: 'Bio Enhancement' },
                { key: 'conversation', label: 'Conversation Skills' },
                { key: 'timing', label: 'Timing Optimization' }
              ].map((area) => (
                <label key={area.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localSettings.focusAreas?.[area.key] !== false}
                    onChange={(e) => updateSetting(`focusAreas.${area.key}`, e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">{area.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">AI Model Preferences</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Primary AI Model
            </label>
            <select
              value={localSettings.aiModel || 'gpt-4'}
              onChange={(e) => updateSetting('aiModel', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="gpt-4">GPT-4 (Balanced)</option>
              <option value="claude">Claude (Creative)</option>
              <option value="gemini">Gemini (Analytical)</option>
              <option value="auto">Auto-select best model</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Dual Model Analysis</div>
              <div className="text-sm text-slate-600">Use multiple AI models for better insights</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.dualModelAnalysis !== false}
                onChange={(e) => updateSetting('dualModelAnalysis', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlatformsSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Connected Platforms</h3>
        
        <div className="space-y-4">
          {[
            { name: 'Tinder', connected: true, color: 'red' },
            { name: 'Bumble', connected: true, color: 'yellow' },
            { name: 'Hinge', connected: false, color: 'blue' },
            { name: 'Match', connected: false, color: 'green' }
          ].map((platform) => (
            <div key={platform.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full bg-${platform.color}-500`}></div>
                <div>
                  <div className="font-medium text-slate-900">{platform.name}</div>
                  <div className="text-sm text-slate-600">
                    {platform.connected ? 'Connected' : 'Not connected'}
                  </div>
                </div>
              </div>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  platform.connected
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {platform.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Platform Preferences</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Primary Platform
            </label>
            <select
              value={localSettings.primaryPlatform || 'tinder'}
              onChange={(e) => updateSetting('primaryPlatform', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="tinder">Tinder</option>
              <option value="bumble">Bumble</option>
              <option value="hinge">Hinge</option>
              <option value="match">Match</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Auto-sync across platforms</div>
              <div className="text-sm text-slate-600">Sync insights and improvements</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.autoSync !== false}
                onChange={(e) => updateSetting('autoSync', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Theme</h3>
        
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'light', label: 'Light', preview: 'bg-white border-2' },
            { key: 'dark', label: 'Dark', preview: 'bg-slate-900 border-2' },
            { key: 'auto', label: 'Auto', preview: 'bg-gradient-to-r from-white to-slate-900 border-2' }
          ].map((theme) => (
            <button
              key={theme.key}
              onClick={() => updateSetting('theme', theme.key)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                localSettings.theme === theme.key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`w-full h-16 rounded-lg mb-2 ${theme.preview}`}></div>
              <div className="text-sm font-medium text-slate-900">{theme.label}</div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Display Options</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Compact Mode</div>
              <div className="text-sm text-slate-600">Show more content in less space</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.compactMode === true}
                onChange={(e) => updateSetting('compactMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">Animations</div>
              <div className="text-sm text-slate-600">Enable smooth transitions and effects</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.animations !== false}
                onChange={(e) => updateSetting('animations', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Export</h3>
        
        <div className="space-y-4">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-3 w-full p-3 text-left bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Download className="w-5 h-5 text-slate-600" />
            <div>
              <div className="font-medium text-slate-900">Export All Data</div>
              <div className="text-sm text-slate-600">Download all your data in JSON format</div>
            </div>
          </button>
          
          <button className="flex items-center gap-3 w-full p-3 text-left bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <Upload className="w-5 h-5 text-slate-600" />
            <div>
              <div className="font-medium text-slate-900">Import Data</div>
              <div className="text-sm text-slate-600">Import data from another service</div>
            </div>
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Deletion</h3>
        
        <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <div className="font-medium text-red-800">Permanent Action</div>
              <div className="text-sm text-red-700 mt-1">
                This action cannot be undone. All your data will be permanently deleted.
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>
    </div>
  );

  const renderBillingSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Plan</h3>
        
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-blue-900">Premium Plan</div>
              <div className="text-sm text-blue-700">$19.99/month • Renews on March 15, 2024</div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Manage Plan
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Methods</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-slate-600" />
              <div>
                <div className="font-medium text-slate-900">•••• •••• •••• 4242</div>
                <div className="text-sm text-slate-600">Expires 12/25</div>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700">Edit</button>
          </div>
          
          <button className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-slate-400 transition-colors">
            + Add Payment Method
          </button>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSection();
      case 'privacy': return renderPrivacySection();
      case 'notifications': return renderNotificationsSection();
      case 'ai-preferences': return renderAIPreferencesSection();
      case 'platforms': return renderPlatformsSection();
      case 'appearance': return renderAppearanceSection();
      case 'data': return renderDataSection();
      case 'billing': return renderBillingSection();
      default: return renderProfileSection();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Manage your account preferences and privacy settings</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <section.icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{section.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{section.description}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderSectionContent()}
            
            {/* Save/Reset Buttons */}
            {hasChanges && (
              <div className="sticky bottom-6 mt-6">
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      You have unsaved changes
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={resetSettings}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isSaving ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-slate-900">Delete Account</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onAccountAction('delete');
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Export Data</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Your data export will include all your profile information, conversation history, and analytics data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onAccountAction('export');
                  setShowExportModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSettings;

