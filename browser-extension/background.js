// AI Dating Coach Browser Extension - Background Service Worker
// Enhanced with tier management and cross-platform sync

import { TierManager } from './services/tier-manager.js';
import { AnalysisService } from './services/analysis-service.js';
import { SyncService } from './services/sync-service.js';
import { AnalyticsService } from './services/analytics-service.js';

class BackgroundService {
  constructor() {
    this.tierManager = new TierManager();
    this.analysisService = new AnalysisService();
    this.syncService = new SyncService();
    this.analyticsService = new AnalyticsService();
    
    this.isInitialized = false;
    this.activeTabId = null;
    this.activePlatform = null;
    this.sessionStartTime = Date.now();
    
    this.init();
  }

  async init() {
    try {
      console.log('🚀 AI Dating Coach Extension - Background Service Starting');
      
      // Initialize services
      await this.tierManager.initialize();
      await this.syncService.initialize();
      await this.analyticsService.initialize();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Setup periodic tasks
      this.setupPeriodicTasks();
      
      // Check authentication status
      await this.checkAuthStatus();
      
      this.isInitialized = true;
      console.log('✅ Background Service Initialized Successfully');
      
      // Track extension startup
      this.analyticsService.trackEvent('extension_startup', {
        version: chrome.runtime.getManifest().version,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('❌ Background Service Initialization Failed:', error);
      this.analyticsService.trackEvent('extension_startup_error', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  setupEventListeners() {
    // Extension installation/update
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Tab activation
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivation(activeInfo);
    });

    // Tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Message handling from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Command handling (keyboard shortcuts)
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });

    // Alarm handling for periodic tasks
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });

    // Storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.handleStorageChange(changes, namespace);
    });
  }

  setupPeriodicTasks() {
    // Sync data every 5 minutes
    chrome.alarms.create('sync-data', { periodInMinutes: 5 });
    
    // Check tier status every 30 minutes
    chrome.alarms.create('check-tier', { periodInMinutes: 30 });
    
    // Analytics heartbeat every 15 minutes
    chrome.alarms.create('analytics-heartbeat', { periodInMinutes: 15 });
    
    // Cleanup old data daily
    chrome.alarms.create('cleanup-data', { periodInMinutes: 1440 });
  }

  async handleInstallation(details) {
    console.log('📦 Extension Installation:', details.reason);
    
    if (details.reason === 'install') {
      // First time installation
      await this.setupDefaultSettings();
      await this.showWelcomeTab();
      
      this.analyticsService.trackEvent('extension_installed', {
        version: chrome.runtime.getManifest().version
      });
      
    } else if (details.reason === 'update') {
      // Extension update
      await this.handleUpdate(details.previousVersion);
      
      this.analyticsService.trackEvent('extension_updated', {
        from_version: details.previousVersion,
        to_version: chrome.runtime.getManifest().version
      });
    }
  }

  async setupDefaultSettings() {
    const defaultSettings = {
      coaching_enabled: true,
      auto_analysis: true,
      suggestion_count: 3,
      notification_enabled: true,
      dark_mode: false,
      tier_access: 'free',
      last_sync: 0,
      user_preferences: {
        platforms: {
          tinder: true,
          bumble: true,
          hinge: true,
          match: true
        },
        features: {
          profile_analysis: true,
          conversation_coaching: true,
          real_time_suggestions: true
        }
      }
    };

    await chrome.storage.sync.set(defaultSettings);
    console.log('⚙️ Default settings configured');
  }

  async showWelcomeTab() {
    const welcomeUrl = chrome.runtime.getURL('welcome/welcome.html');
    await chrome.tabs.create({ url: welcomeUrl });
  }

  async handleUpdate(previousVersion) {
    console.log(`🔄 Extension updated from ${previousVersion}`);
    
    // Perform migration if needed
    await this.migrateSettings(previousVersion);
    
    // Clear old cache
    await this.clearOldCache();
    
    // Show update notification
    await this.showUpdateNotification();
  }

  async handleTabActivation(activeInfo) {
    this.activeTabId = activeInfo.tabId;
    
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      const platform = this.detectPlatform(tab.url);
      
      if (platform !== this.activePlatform) {
        this.activePlatform = platform;
        
        if (platform) {
          console.log(`🎯 Activated on ${platform}`);
          await this.initializePlatformSupport(activeInfo.tabId, platform);
        }
      }
    } catch (error) {
      console.error('Error handling tab activation:', error);
    }
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      const platform = this.detectPlatform(tab.url);
      
      if (platform) {
        // Inject content scripts if needed
        await this.ensureContentScriptsInjected(tabId, platform);
        
        // Check tier access for this platform
        await this.checkPlatformAccess(tabId, platform);
      }
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('📨 Received message:', message.type);
      
      switch (message.type) {
        case 'ANALYZE_PROFILE':
          await this.handleProfileAnalysis(message, sender, sendResponse);
          break;
          
        case 'ANALYZE_CONVERSATION':
          await this.handleConversationAnalysis(message, sender, sendResponse);
          break;
          
        case 'GENERATE_SUGGESTIONS':
          await this.handleSuggestionGeneration(message, sender, sendResponse);
          break;
          
        case 'CHECK_TIER_ACCESS':
          await this.handleTierCheck(message, sender, sendResponse);
          break;
          
        case 'TRACK_USAGE':
          await this.handleUsageTracking(message, sender, sendResponse);
          break;
          
        case 'SYNC_DATA':
          await this.handleDataSync(message, sender, sendResponse);
          break;
          
        case 'GET_SETTINGS':
          await this.handleGetSettings(message, sender, sendResponse);
          break;
          
        case 'UPDATE_SETTINGS':
          await this.handleUpdateSettings(message, sender, sendResponse);
          break;
          
        case 'AUTHENTICATE':
          await this.handleAuthentication(message, sender, sendResponse);
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
      
      this.analyticsService.trackEvent('message_handling_error', {
        message_type: message.type,
        error: error.message
      });
    }
  }

  async handleProfileAnalysis(message, sender, sendResponse) {
    try {
      // Check tier access
      const hasAccess = await this.tierManager.checkFeatureAccess('profile_analysis');
      if (!hasAccess) {
        sendResponse({
          success: false,
          error: 'Upgrade required',
          upgrade_required: true
        });
        return;
      }

      // Track usage
      await this.tierManager.trackUsage('profile_analysis');

      // Perform analysis
      const result = await this.analysisService.analyzeProfile({
        profileData: message.profileData,
        platform: message.platform,
        tier: await this.tierManager.getCurrentTier()
      });

      // Sync result
      await this.syncService.queueSync('profile_analysis', result);

      sendResponse({ success: true, result });

      // Analytics
      this.analyticsService.trackEvent('profile_analyzed', {
        platform: message.platform,
        tier: await this.tierManager.getCurrentTier(),
        analysis_type: result.analysis_type
      });

    } catch (error) {
      console.error('Profile analysis error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleConversationAnalysis(message, sender, sendResponse) {
    try {
      // Check tier access
      const hasAccess = await this.tierManager.checkFeatureAccess('conversation_analysis');
      if (!hasAccess) {
        sendResponse({
          success: false,
          error: 'Upgrade required',
          upgrade_required: true
        });
        return;
      }

      // Track usage
      await this.tierManager.trackUsage('conversation_analysis');

      // Perform analysis
      const result = await this.analysisService.analyzeConversation({
        conversationData: message.conversationData,
        platform: message.platform,
        tier: await this.tierManager.getCurrentTier()
      });

      // Sync result
      await this.syncService.queueSync('conversation_analysis', result);

      sendResponse({ success: true, result });

      // Analytics
      this.analyticsService.trackEvent('conversation_analyzed', {
        platform: message.platform,
        tier: await this.tierManager.getCurrentTier(),
        message_count: message.conversationData.messages?.length || 0
      });

    } catch (error) {
      console.error('Conversation analysis error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleSuggestionGeneration(message, sender, sendResponse) {
    try {
      // Check tier access
      const hasAccess = await this.tierManager.checkFeatureAccess('real_time_suggestions');
      if (!hasAccess) {
        sendResponse({
          success: false,
          error: 'Upgrade required',
          upgrade_required: true
        });
        return;
      }

      // Track usage
      await this.tierManager.trackUsage('real_time_suggestions');

      // Generate suggestions
      const result = await this.analysisService.generateSuggestions({
        context: message.context,
        platform: message.platform,
        tier: await this.tierManager.getCurrentTier(),
        count: message.count || 3
      });

      sendResponse({ success: true, result });

      // Analytics
      this.analyticsService.trackEvent('suggestions_generated', {
        platform: message.platform,
        tier: await this.tierManager.getCurrentTier(),
        suggestion_count: result.suggestions?.length || 0
      });

    } catch (error) {
      console.error('Suggestion generation error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleTierCheck(message, sender, sendResponse) {
    try {
      const tierInfo = await this.tierManager.getTierInfo();
      const hasAccess = await this.tierManager.checkFeatureAccess(message.feature);
      
      sendResponse({
        success: true,
        tier: tierInfo.current_tier,
        hasAccess,
        usage: tierInfo.usage,
        limits: tierInfo.limits
      });
    } catch (error) {
      console.error('Tier check error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleUsageTracking(message, sender, sendResponse) {
    try {
      await this.tierManager.trackUsage(message.feature, message.metadata);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Usage tracking error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleDataSync(message, sender, sendResponse) {
    try {
      await this.syncService.performSync();
      sendResponse({ success: true });
    } catch (error) {
      console.error('Data sync error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleGetSettings(message, sender, sendResponse) {
    try {
      const settings = await chrome.storage.sync.get();
      sendResponse({ success: true, settings });
    } catch (error) {
      console.error('Get settings error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleUpdateSettings(message, sender, sendResponse) {
    try {
      await chrome.storage.sync.set(message.settings);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Update settings error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleAuthentication(message, sender, sendResponse) {
    try {
      const result = await this.tierManager.authenticate(message.credentials);
      sendResponse({ success: true, result });
    } catch (error) {
      console.error('Authentication error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleCommand(command) {
    console.log('⌨️ Command received:', command);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      switch (command) {
        case 'toggle-coaching':
          await this.sendMessageToTab(tab.id, { type: 'TOGGLE_COACHING' });
          break;
          
        case 'analyze-profile':
          await this.sendMessageToTab(tab.id, { type: 'ANALYZE_CURRENT_PROFILE' });
          break;
          
        case 'generate-opener':
          await this.sendMessageToTab(tab.id, { type: 'GENERATE_OPENER' });
          break;
      }
      
      this.analyticsService.trackEvent('command_executed', { command });
      
    } catch (error) {
      console.error('Command handling error:', error);
    }
  }

  async handleAlarm(alarm) {
    console.log('⏰ Alarm triggered:', alarm.name);
    
    try {
      switch (alarm.name) {
        case 'sync-data':
          await this.syncService.performSync();
          break;
          
        case 'check-tier':
          await this.tierManager.refreshTierInfo();
          break;
          
        case 'analytics-heartbeat':
          await this.analyticsService.sendHeartbeat();
          break;
          
        case 'cleanup-data':
          await this.cleanupOldData();
          break;
      }
    } catch (error) {
      console.error(`Alarm ${alarm.name} error:`, error);
    }
  }

  async handleStorageChange(changes, namespace) {
    if (namespace === 'sync') {
      // Notify content scripts of settings changes
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (this.detectPlatform(tab.url)) {
          try {
            await this.sendMessageToTab(tab.id, {
              type: 'SETTINGS_UPDATED',
              changes
            });
          } catch (error) {
            // Tab might not have content script injected
          }
        }
      }
    }
  }

  // Utility Methods
  detectPlatform(url) {
    if (!url) return null;
    
    const platformMap = {
      'tinder.com': 'tinder',
      'bumble.com': 'bumble',
      'hinge.co': 'hinge',
      'match.com': 'match',
      'okcupid.com': 'okcupid',
      'pof.com': 'pof',
      'eharmony.com': 'eharmony',
      'zoosk.com': 'zoosk'
    };
    
    for (const [domain, platform] of Object.entries(platformMap)) {
      if (url.includes(domain)) {
        return platform;
      }
    }
    
    return null;
  }

  async initializePlatformSupport(tabId, platform) {
    try {
      await this.sendMessageToTab(tabId, {
        type: 'INITIALIZE_PLATFORM',
        platform,
        tierInfo: await this.tierManager.getTierInfo()
      });
    } catch (error) {
      console.error('Platform initialization error:', error);
    }
  }

  async ensureContentScriptsInjected(tabId, platform) {
    try {
      // Check if content script is already injected
      const response = await this.sendMessageToTab(tabId, { type: 'PING' });
      if (response?.success) {
        return; // Already injected
      }
    } catch (error) {
      // Content script not injected, inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [
            'content-scripts/platform-detector.js',
            'content-scripts/ui-injector.js',
            'content-scripts/conversation-monitor.js',
            'content-scripts/profile-analyzer.js',
            'content-scripts/main.js'
          ]
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId },
          files: [
            'styles/coaching-overlay.css',
            'styles/tier-display.css',
            'styles/suggestion-panel.css'
          ]
        });
        
        console.log(`✅ Content scripts injected for ${platform}`);
      } catch (injectionError) {
        console.error('Content script injection error:', injectionError);
      }
    }
  }

  async checkPlatformAccess(tabId, platform) {
    const hasAccess = await this.tierManager.checkPlatformAccess(platform);
    
    await this.sendMessageToTab(tabId, {
      type: 'PLATFORM_ACCESS_UPDATE',
      platform,
      hasAccess
    });
  }

  async sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  async checkAuthStatus() {
    try {
      const authStatus = await this.tierManager.checkAuthStatus();
      console.log('🔐 Auth Status:', authStatus.authenticated ? 'Authenticated' : 'Not Authenticated');
      
      if (!authStatus.authenticated) {
        // Show authentication prompt
        await this.showAuthenticationPrompt();
      }
    } catch (error) {
      console.error('Auth status check error:', error);
    }
  }

  async showAuthenticationPrompt() {
    const authUrl = chrome.runtime.getURL('auth/auth.html');
    await chrome.tabs.create({ url: authUrl });
  }

  async cleanupOldData() {
    try {
      await this.syncService.cleanupOldData();
      await this.analyticsService.cleanupOldData();
      console.log('🧹 Old data cleaned up');
    } catch (error) {
      console.error('Data cleanup error:', error);
    }
  }

  async migrateSettings(previousVersion) {
    // Implement settings migration logic here
    console.log(`🔄 Migrating settings from ${previousVersion}`);
  }

  async clearOldCache() {
    await chrome.storage.local.clear();
    console.log('🗑️ Old cache cleared');
  }

  async showUpdateNotification() {
    // Show update notification to user
    console.log('📢 Update notification shown');
  }
}

// Initialize background service
const backgroundService = new BackgroundService();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackgroundService;
}

