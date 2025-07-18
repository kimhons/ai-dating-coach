/**
 * AI Dating Coach Browser Extension - Background Service Worker
 * Handles extension lifecycle, messaging, and coordination between components
 */

// Extension state management
let extensionState = {
  isActive: true,
  currentPlatform: null,
  userId: null,
  subscriptionTier: 'spark',
  settings: {
    floatingButtonEnabled: true,
    autoAnalysisEnabled: true,
    notificationsEnabled: true,
    privacyMode: false
  }
};

// Platform detection patterns
const PLATFORM_PATTERNS = {
  tinder: /tinder\.com/,
  bumble: /bumble\.com/,
  hinge: /hinge\.co/,
  okcupid: /okcupid\.com/,
  match: /match\.com/,
  coffeemeetsbagel: /coffeemeetsbagel\.com/,
  pof: /pof\.com/
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('AI Dating Coach extension installed/updated');
  
  // Set default settings
  await chrome.storage.sync.set({
    settings: extensionState.settings,
    isFirstRun: details.reason === 'install'
  });
  
  // Show welcome notification for new installs
  if (details.reason === 'install') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'AI Dating Coach Installed!',
      message: 'Start getting real-time coaching on your favorite dating apps.'
    });
  }
});

// Handle tab updates to detect dating app navigation
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const platform = detectPlatform(tab.url);
    
    if (platform && extensionState.isActive) {
      extensionState.currentPlatform = platform;
      
      // Inject content script if not already injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content-scripts/main.js']
        });
        
        // Send platform info to content script
        chrome.tabs.sendMessage(tabId, {
          type: 'PLATFORM_DETECTED',
          platform: platform,
          settings: extensionState.settings
        });
        
      } catch (error) {
        console.log('Content script already injected or injection failed:', error);
      }
    }
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep message channel open for async responses
});

// Message handler
async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      case 'GET_EXTENSION_STATE':
        sendResponse({
          success: true,
          data: extensionState
        });
        break;
        
      case 'UPDATE_SETTINGS':
        await updateSettings(message.settings);
        sendResponse({ success: true });
        break;
        
      case 'ANALYZE_PHOTO':
        const photoResult = await analyzePhoto(message.data);
        sendResponse(photoResult);
        break;
        
      case 'ANALYZE_CONVERSATION':
        const conversationResult = await analyzeConversation(message.data);
        sendResponse(conversationResult);
        break;
        
      case 'GET_QUICK_SUGGESTIONS':
        const suggestions = await getQuickSuggestions(message.data);
        sendResponse(suggestions);
        break;
        
      case 'CAPTURE_SCREENSHOT':
        const screenshot = await captureScreenshot(sender.tab.id);
        sendResponse(screenshot);
        break;
        
      case 'SYNC_WITH_MOBILE':
        const syncResult = await syncWithMobile(message.data);
        sendResponse(syncResult);
        break;
        
      case 'TRACK_USAGE':
        await trackUsage(message.data);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ 
          success: false, 
          error: 'Unknown message type' 
        });
    }
  } catch (error) {
    console.error('Message handling error:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

// Platform detection
function detectPlatform(url) {
  for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(url)) {
      return platform;
    }
  }
  return null;
}

// Settings management
async function updateSettings(newSettings) {
  extensionState.settings = { ...extensionState.settings, ...newSettings };
  await chrome.storage.sync.set({ settings: extensionState.settings });
  
  // Notify all content scripts of settings change
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (detectPlatform(tab.url)) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SETTINGS_UPDATED',
        settings: extensionState.settings
      }).catch(() => {}); // Ignore errors for tabs without content script
    }
  }
}

// Photo analysis integration
async function analyzePhoto(data) {
  try {
    // Get authentication token
    const authToken = await getAuthToken();
    if (!authToken) {
      return { 
        success: false, 
        error: 'Please log in to use photo analysis' 
      };
    }
    
    // Call photo analysis service
    const response = await fetch('https://your-project.supabase.co/functions/v1/photo-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        image_url: data.imageUrl,
        user_id: extensionState.userId,
        platform: extensionState.currentPlatform,
        analysis_type: data.analysisType || 'profile'
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Photo analysis failed');
    }
    
    // Track usage
    await trackUsage({ type: 'photo_analysis', platform: extensionState.currentPlatform });
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.error('Photo analysis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Conversation analysis integration
async function analyzeConversation(data) {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      return { 
        success: false, 
        error: 'Please log in to use conversation analysis' 
      };
    }
    
    const response = await fetch('https://your-project.supabase.co/functions/v1/conversation-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        conversation_text: data.conversationText,
        screenshot_url: data.screenshotUrl,
        user_id: extensionState.userId,
        platform: extensionState.currentPlatform,
        analysis_type: data.analysisType || 'text'
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Conversation analysis failed');
    }
    
    // Track usage
    await trackUsage({ type: 'conversation_analysis', platform: extensionState.currentPlatform });
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.error('Conversation analysis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Quick suggestions for floating button
async function getQuickSuggestions(data) {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      return { 
        success: false, 
        error: 'Please log in to get suggestions' 
      };
    }
    
    // Generate quick coaching tips based on current context
    const suggestions = [
      {
        type: 'photo',
        title: 'Photo Tip',
        message: 'Add more variety to your photos - show different activities and settings',
        action: 'analyze_photos'
      },
      {
        type: 'conversation',
        title: 'Conversation Tip',
        message: 'Ask open-ended questions to keep the conversation flowing',
        action: 'analyze_conversation'
      },
      {
        type: 'profile',
        title: 'Profile Tip',
        message: 'Update your bio to highlight your unique interests and personality',
        action: 'optimize_profile'
      }
    ];
    
    // Filter suggestions based on platform and user tier
    const filteredSuggestions = suggestions.filter(suggestion => {
      if (extensionState.subscriptionTier === 'spark' && suggestion.type === 'conversation') {
        return false; // Conversation analysis requires premium
      }
      return true;
    });
    
    return {
      success: true,
      data: filteredSuggestions
    };
    
  } catch (error) {
    console.error('Get suggestions error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Screenshot capture
async function captureScreenshot(tabId) {
  try {
    const screenshot = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 90
    });
    
    return {
      success: true,
      data: screenshot
    };
    
  } catch (error) {
    console.error('Screenshot capture error:', error);
    return {
      success: false,
      error: 'Failed to capture screenshot'
    };
  }
}

// Mobile app synchronization
async function syncWithMobile(data) {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      return { 
        success: false, 
        error: 'Please log in to sync with mobile app' 
      };
    }
    
    // Sync data with mobile app via Supabase
    const response = await fetch('https://your-project.supabase.co/functions/v1/sync-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        user_id: extensionState.userId,
        platform: extensionState.currentPlatform,
        sync_data: data,
        source: 'browser_extension'
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Sync failed');
    }
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Usage tracking
async function trackUsage(data) {
  try {
    const authToken = await getAuthToken();
    if (!authToken) return;
    
    await fetch('https://your-project.supabase.co/functions/v1/track-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        user_id: extensionState.userId,
        usage_type: data.type,
        platform: data.platform || extensionState.currentPlatform,
        timestamp: new Date().toISOString(),
        source: 'browser_extension'
      })
    });
    
  } catch (error) {
    console.error('Usage tracking error:', error);
  }
}

// Authentication token management
async function getAuthToken() {
  try {
    const result = await chrome.storage.local.get(['authToken', 'userId']);
    
    if (result.authToken && result.userId) {
      extensionState.userId = result.userId;
      return result.authToken;
    }
    
    return null;
  } catch (error) {
    console.error('Get auth token error:', error);
    return null;
  }
}

// Store authentication token
async function setAuthToken(token, userId) {
  try {
    await chrome.storage.local.set({ 
      authToken: token, 
      userId: userId 
    });
    extensionState.userId = userId;
  } catch (error) {
    console.error('Set auth token error:', error);
  }
}

// Clear authentication
async function clearAuth() {
  try {
    await chrome.storage.local.remove(['authToken', 'userId']);
    extensionState.userId = null;
  } catch (error) {
    console.error('Clear auth error:', error);
  }
}

// Notification management
function showNotification(title, message, type = 'basic') {
  if (!extensionState.settings.notificationsEnabled) return;
  
  chrome.notifications.create({
    type: type,
    iconUrl: 'icons/icon-48.png',
    title: title,
    message: message
  });
}

// Periodic sync with mobile app
setInterval(async () => {
  if (extensionState.userId && extensionState.settings.autoSyncEnabled) {
    await syncWithMobile({ type: 'periodic_sync' });
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Load saved settings on startup
chrome.storage.sync.get(['settings']).then((result) => {
  if (result.settings) {
    extensionState.settings = { ...extensionState.settings, ...result.settings };
  }
});

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    detectPlatform,
    updateSettings,
    analyzePhoto,
    analyzeConversation,
    getQuickSuggestions
  };
}

