// AI Dating Coach Browser Extension - Main Content Script
// Enhanced with tier management and real-time coaching

class AICoachingOverlay {
  constructor() {
    this.platform = null;
    this.isInitialized = false;
    this.isCoachingEnabled = true;
    this.tierInfo = null;
    this.currentProfile = null;
    this.currentConversation = null;
    
    // UI Components
    this.overlay = null;
    this.suggestionPanel = null;
    this.tierDisplay = null;
    this.floatingButton = null;
    
    // State
    this.isAnalyzing = false;
    this.lastAnalysisTime = 0;
    this.analysisThrottle = 2000; // 2 seconds
    
    // Observers
    this.profileObserver = null;
    this.conversationObserver = null;
    this.messageObserver = null;
    
    this.init();
  }

  async init() {
    try {
      console.log('🚀 AI Dating Coach - Content Script Initializing');
      
      // Detect platform
      this.platform = this.detectPlatform();
      if (!this.platform) {
        console.log('❌ Platform not supported');
        return;
      }
      
      console.log(`🎯 Platform detected: ${this.platform}`);
      
      // Wait for page to be ready
      await this.waitForPageReady();
      
      // Get tier information
      await this.loadTierInfo();
      
      // Create UI components
      await this.createOverlay();
      
      // Setup observers
      this.setupObservers();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initial analysis
      await this.performInitialAnalysis();
      
      this.isInitialized = true;
      console.log('✅ AI Dating Coach - Content Script Initialized');
      
      // Track initialization
      this.sendMessage('TRACK_USAGE', {
        feature: 'extension_initialization',
        metadata: { platform: this.platform }
      });
      
    } catch (error) {
      console.error('❌ Content Script Initialization Failed:', error);
    }
  }

  detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    
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
      if (hostname.includes(domain)) {
        return platform;
      }
    }
    
    return null;
  }

  async waitForPageReady() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }

  async loadTierInfo() {
    try {
      const response = await this.sendMessage('CHECK_TIER_ACCESS', {
        feature: 'browser_extension'
      });
      
      if (response.success) {
        this.tierInfo = {
          tier: response.tier,
          hasAccess: response.hasAccess,
          usage: response.usage,
          limits: response.limits
        };
      }
    } catch (error) {
      console.error('Error loading tier info:', error);
      // Default to free tier
      this.tierInfo = {
        tier: 'free',
        hasAccess: false,
        usage: {},
        limits: {}
      };
    }
  }

  async createOverlay() {
    // Create main overlay container
    this.overlay = document.createElement('div');
    this.overlay.id = 'ai-dating-coach-overlay';
    this.overlay.className = 'ai-coach-overlay';
    
    // Create floating button
    this.createFloatingButton();
    
    // Create suggestion panel
    this.createSuggestionPanel();
    
    // Create tier display
    this.createTierDisplay();
    
    // Append to body
    document.body.appendChild(this.overlay);
    
    // Apply initial visibility
    this.updateOverlayVisibility();
  }

  createFloatingButton() {
    this.floatingButton = document.createElement('div');
    this.floatingButton.className = 'ai-coach-floating-button';
    this.floatingButton.innerHTML = `
      <div class="floating-button-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L10.59 10.75C10.21 11.13 10.21 11.75 10.59 12.13L11.87 13.41C12.25 13.79 12.87 13.79 13.25 13.41L18.83 7.83L21.5 10.5L23 9H21ZM1 9V7L7 1L8.5 2.5L5.83 5.17L11.41 10.75C11.79 11.13 11.79 11.75 11.41 12.13L10.13 13.41C9.75 13.79 9.13 13.79 8.75 13.41L3.17 7.83L0.5 10.5L-1 9H1Z" fill="currentColor"/>
        </svg>
      </div>
      <div class="floating-button-text">AI Coach</div>
    `;
    
    // Make draggable
    this.makeFloatingButtonDraggable();
    
    // Add click handler
    this.floatingButton.addEventListener('click', () => {
      this.toggleSuggestionPanel();
    });
    
    this.overlay.appendChild(this.floatingButton);
  }

  createSuggestionPanel() {
    this.suggestionPanel = document.createElement('div');
    this.suggestionPanel.className = 'ai-coach-suggestion-panel';
    this.suggestionPanel.innerHTML = `
      <div class="suggestion-panel-header">
        <div class="panel-title">
          <span class="panel-icon">🤖</span>
          <span class="panel-text">AI Dating Coach</span>
        </div>
        <div class="panel-controls">
          <button class="panel-minimize" title="Minimize">−</button>
          <button class="panel-close" title="Close">×</button>
        </div>
      </div>
      
      <div class="suggestion-panel-content">
        <div class="analysis-section">
          <div class="section-header">
            <span class="section-title">Profile Analysis</span>
            <button class="analyze-button" data-type="profile">Analyze</button>
          </div>
          <div class="analysis-results" id="profile-analysis-results">
            <div class="placeholder-text">Click "Analyze" to get AI insights on this profile</div>
          </div>
        </div>
        
        <div class="suggestions-section">
          <div class="section-header">
            <span class="section-title">Conversation Suggestions</span>
            <button class="analyze-button" data-type="conversation">Generate</button>
          </div>
          <div class="suggestions-list" id="conversation-suggestions">
            <div class="placeholder-text">Generate AI-powered conversation starters</div>
          </div>
        </div>
        
        <div class="real-time-section">
          <div class="section-header">
            <span class="section-title">Real-time Coaching</span>
            <label class="toggle-switch">
              <input type="checkbox" id="real-time-toggle" checked>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="real-time-feedback" id="real-time-feedback">
            <div class="placeholder-text">Real-time suggestions will appear here as you type</div>
          </div>
        </div>
      </div>
      
      <div class="suggestion-panel-footer">
        <div class="tier-info">
          <span class="tier-badge" id="tier-badge">Free</span>
          <span class="usage-info" id="usage-info">3/3 analyses remaining today</span>
        </div>
        <button class="upgrade-button" id="upgrade-button" style="display: none;">
          Upgrade to Premium
        </button>
      </div>
    `;
    
    // Initially hidden
    this.suggestionPanel.style.display = 'none';
    
    // Setup panel event listeners
    this.setupPanelEventListeners();
    
    this.overlay.appendChild(this.suggestionPanel);
  }

  createTierDisplay() {
    this.tierDisplay = document.createElement('div');
    this.tierDisplay.className = 'ai-coach-tier-display';
    this.tierDisplay.innerHTML = `
      <div class="tier-badge-container">
        <span class="tier-badge" id="tier-badge-display">${this.tierInfo?.tier || 'Free'}</span>
        <div class="tier-tooltip">
          <div class="tier-tooltip-content">
            <div class="tier-name">${this.getTierDisplayName()}</div>
            <div class="tier-usage">
              <div class="usage-item">
                <span>Profile Analyses:</span>
                <span>${this.getUsageDisplay('profile_analysis')}</span>
              </div>
              <div class="usage-item">
                <span>Conversation Coaching:</span>
                <span>${this.getUsageDisplay('conversation_analysis')}</span>
              </div>
              <div class="usage-item">
                <span>Real-time Suggestions:</span>
                <span>${this.getUsageDisplay('real_time_suggestions')}</span>
              </div>
            </div>
            ${!this.tierInfo?.hasAccess ? '<button class="tier-upgrade-btn">Upgrade Now</button>' : ''}
          </div>
        </div>
      </div>
    `;
    
    this.overlay.appendChild(this.tierDisplay);
  }

  setupPanelEventListeners() {
    // Analyze buttons
    this.suggestionPanel.querySelectorAll('.analyze-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        this.performAnalysis(type);
      });
    });
    
    // Panel controls
    this.suggestionPanel.querySelector('.panel-minimize').addEventListener('click', () => {
      this.minimizeSuggestionPanel();
    });
    
    this.suggestionPanel.querySelector('.panel-close').addEventListener('click', () => {
      this.closeSuggestionPanel();
    });
    
    // Real-time toggle
    this.suggestionPanel.querySelector('#real-time-toggle').addEventListener('change', (e) => {
      this.toggleRealTimeCoaching(e.target.checked);
    });
    
    // Upgrade button
    this.suggestionPanel.querySelector('#upgrade-button').addEventListener('click', () => {
      this.openUpgradePage();
    });
  }

  makeFloatingButtonDraggable() {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    this.floatingButton.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(window.getComputedStyle(this.floatingButton).left, 10);
      startTop = parseInt(window.getComputedStyle(this.floatingButton).top, 10);
      
      this.floatingButton.style.cursor = 'grabbing';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newLeft = startLeft + deltaX;
      let newTop = startTop + deltaY;
      
      // Keep within viewport bounds
      const rect = this.floatingButton.getBoundingClientRect();
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - rect.width));
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - rect.height));
      
      this.floatingButton.style.left = newLeft + 'px';
      this.floatingButton.style.top = newTop + 'px';
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.floatingButton.style.cursor = 'grab';
        
        // Snap to edges
        this.snapFloatingButtonToEdge();
      }
    });
  }

  snapFloatingButtonToEdge() {
    const rect = this.floatingButton.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const snapThreshold = 100;
    
    if (centerX < window.innerWidth / 2) {
      // Snap to left
      this.floatingButton.style.left = '20px';
    } else {
      // Snap to right
      this.floatingButton.style.left = (window.innerWidth - rect.width - 20) + 'px';
    }
  }

  setupObservers() {
    // Profile observer
    this.setupProfileObserver();
    
    // Conversation observer
    this.setupConversationObserver();
    
    // Message input observer
    this.setupMessageObserver();
  }

  setupProfileObserver() {
    const profileSelectors = this.getPlatformSelectors().profile;
    
    this.profileObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if new profile content was added
          const hasProfileContent = Array.from(mutation.addedNodes).some(node => {
            return node.nodeType === Node.ELEMENT_NODE && 
                   profileSelectors.some(selector => 
                     node.matches && node.matches(selector) || 
                     node.querySelector && node.querySelector(selector)
                   );
          });
          
          if (hasProfileContent) {
            this.debounce(() => this.onProfileChange(), 1000);
          }
        }
      });
    });
    
    this.profileObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupConversationObserver() {
    const conversationSelectors = this.getPlatformSelectors().conversation;
    
    this.conversationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if new conversation content was added
          const hasConversationContent = Array.from(mutation.addedNodes).some(node => {
            return node.nodeType === Node.ELEMENT_NODE && 
                   conversationSelectors.some(selector => 
                     node.matches && node.matches(selector) || 
                     node.querySelector && node.querySelector(selector)
                   );
          });
          
          if (hasConversationContent) {
            this.debounce(() => this.onConversationChange(), 1000);
          }
        }
      });
    });
    
    this.conversationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupMessageObserver() {
    const messageInputSelectors = this.getPlatformSelectors().messageInput;
    
    messageInputSelectors.forEach(selector => {
      const input = document.querySelector(selector);
      if (input) {
        input.addEventListener('input', () => {
          this.debounce(() => this.onMessageInput(input), 500);
        });
        
        input.addEventListener('focus', () => {
          this.onMessageInputFocus();
        });
        
        input.addEventListener('blur', () => {
          this.onMessageInputBlur();
        });
      }
    });
  }

  setupEventListeners() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleBackgroundMessage(message, sender, sendResponse);
      return true;
    });
    
    // Listen for keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcut(e);
    });
    
    // Listen for page navigation
    window.addEventListener('popstate', () => {
      this.onPageNavigation();
    });
    
    // Listen for window resize
    window.addEventListener('resize', () => {
      this.onWindowResize();
    });
  }

  async performInitialAnalysis() {
    // Auto-analyze current profile if enabled
    const settings = await this.getSettings();
    if (settings.auto_analysis && this.tierInfo?.hasAccess) {
      setTimeout(() => {
        this.performAnalysis('profile');
      }, 2000);
    }
  }

  async performAnalysis(type) {
    if (this.isAnalyzing) return;
    
    const now = Date.now();
    if (now - this.lastAnalysisTime < this.analysisThrottle) {
      this.showThrottleMessage();
      return;
    }
    
    this.isAnalyzing = true;
    this.lastAnalysisTime = now;
    
    try {
      if (type === 'profile') {
        await this.analyzeCurrentProfile();
      } else if (type === 'conversation') {
        await this.generateConversationSuggestions();
      }
    } catch (error) {
      console.error(`Analysis error (${type}):`, error);
      this.showErrorMessage(`Failed to ${type === 'profile' ? 'analyze profile' : 'generate suggestions'}`);
    } finally {
      this.isAnalyzing = false;
    }
  }

  async analyzeCurrentProfile() {
    const profileData = this.extractProfileData();
    if (!profileData) {
      this.showErrorMessage('No profile found to analyze');
      return;
    }
    
    this.showAnalysisLoading('profile');
    
    try {
      const response = await this.sendMessage('ANALYZE_PROFILE', {
        profileData,
        platform: this.platform
      });
      
      if (response.success) {
        this.displayProfileAnalysis(response.result);
      } else if (response.upgrade_required) {
        this.showUpgradeRequired('profile analysis');
      } else {
        this.showErrorMessage(response.error || 'Analysis failed');
      }
    } catch (error) {
      this.showErrorMessage('Network error during analysis');
    }
  }

  async generateConversationSuggestions() {
    const conversationData = this.extractConversationData();
    
    this.showAnalysisLoading('conversation');
    
    try {
      const response = await this.sendMessage('GENERATE_SUGGESTIONS', {
        context: {
          conversation: conversationData,
          profile: this.currentProfile
        },
        platform: this.platform,
        count: 3
      });
      
      if (response.success) {
        this.displayConversationSuggestions(response.result.suggestions);
      } else if (response.upgrade_required) {
        this.showUpgradeRequired('conversation suggestions');
      } else {
        this.showErrorMessage(response.error || 'Suggestion generation failed');
      }
    } catch (error) {
      this.showErrorMessage('Network error during suggestion generation');
    }
  }

  // Platform-specific selectors
  getPlatformSelectors() {
    const selectors = {
      tinder: {
        profile: ['.profileCard', '.Pos\\(r\\)', '[data-testid="card"]'],
        conversation: ['.messageList', '.messages', '[data-testid="messageList"]'],
        messageInput: ['textarea[placeholder*="message"]', 'input[placeholder*="message"]']
      },
      bumble: {
        profile: ['.encounters-story-profile', '.profile-card', '.encounter-card'],
        conversation: ['.messages-container', '.conversation-messages'],
        messageInput: ['textarea[placeholder*="message"]', 'input[placeholder*="Type"]']
      },
      hinge: {
        profile: ['.profile-card', '.profile-container', '.card'],
        conversation: ['.conversation-messages', '.messages'],
        messageInput: ['textarea[placeholder*="message"]', 'input[placeholder*="Say"]']
      },
      // Add more platforms as needed
    };
    
    return selectors[this.platform] || {
      profile: ['.profile', '.card'],
      conversation: ['.messages', '.conversation'],
      messageInput: ['textarea', 'input[type="text"]']
    };
  }

  extractProfileData() {
    const selectors = this.getPlatformSelectors().profile;
    let profileElement = null;
    
    for (const selector of selectors) {
      profileElement = document.querySelector(selector);
      if (profileElement) break;
    }
    
    if (!profileElement) return null;
    
    // Extract profile information
    const profileData = {
      platform: this.platform,
      timestamp: Date.now(),
      photos: this.extractPhotos(profileElement),
      bio: this.extractBio(profileElement),
      details: this.extractDetails(profileElement),
      interests: this.extractInterests(profileElement)
    };
    
    this.currentProfile = profileData;
    return profileData;
  }

  extractPhotos(profileElement) {
    const photos = [];
    const imgElements = profileElement.querySelectorAll('img');
    
    imgElements.forEach(img => {
      if (img.src && !img.src.includes('icon') && !img.src.includes('logo')) {
        photos.push({
          url: img.src,
          alt: img.alt || '',
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height
        });
      }
    });
    
    return photos;
  }

  extractBio(profileElement) {
    // Platform-specific bio extraction
    const bioSelectors = [
      '.bio', '.description', '.about', '.profile-bio',
      '[data-testid="bio"]', '.profile-description'
    ];
    
    for (const selector of bioSelectors) {
      const bioElement = profileElement.querySelector(selector);
      if (bioElement) {
        return bioElement.textContent.trim();
      }
    }
    
    return '';
  }

  extractDetails(profileElement) {
    const details = {};
    
    // Extract age
    const ageMatch = profileElement.textContent.match(/\\b(\\d{2})\\b/);
    if (ageMatch) {
      details.age = parseInt(ageMatch[1]);
    }
    
    // Extract location
    const locationSelectors = ['.location', '.distance', '.city'];
    for (const selector of locationSelectors) {
      const locationElement = profileElement.querySelector(selector);
      if (locationElement) {
        details.location = locationElement.textContent.trim();
        break;
      }
    }
    
    // Extract education/work
    const workSelectors = ['.work', '.education', '.job', '.school'];
    for (const selector of workSelectors) {
      const workElement = profileElement.querySelector(selector);
      if (workElement) {
        details.work = workElement.textContent.trim();
        break;
      }
    }
    
    return details;
  }

  extractInterests(profileElement) {
    const interests = [];
    const interestSelectors = [
      '.interests', '.hobbies', '.tags', '.badges',
      '.interest-tag', '.hobby-tag'
    ];
    
    for (const selector of interestSelectors) {
      const interestElements = profileElement.querySelectorAll(selector);
      interestElements.forEach(element => {
        const interest = element.textContent.trim();
        if (interest && !interests.includes(interest)) {
          interests.push(interest);
        }
      });
    }
    
    return interests;
  }

  extractConversationData() {
    const selectors = this.getPlatformSelectors().conversation;
    let conversationElement = null;
    
    for (const selector of selectors) {
      conversationElement = document.querySelector(selector);
      if (conversationElement) break;
    }
    
    if (!conversationElement) return null;
    
    const messages = [];
    const messageElements = conversationElement.querySelectorAll('[class*="message"], .message, .msg');
    
    messageElements.forEach(msgElement => {
      const text = msgElement.textContent.trim();
      if (text) {
        // Determine if message is from user or match
        const isFromUser = this.isMessageFromUser(msgElement);
        
        messages.push({
          text,
          isFromUser,
          timestamp: this.extractMessageTimestamp(msgElement)
        });
      }
    });
    
    this.currentConversation = { messages };
    return { messages };
  }

  isMessageFromUser(messageElement) {
    // Platform-specific logic to determine message sender
    const userIndicators = [
      'sent', 'outgoing', 'user', 'me', 'right',
      'message--sent', 'message-sent'
    ];
    
    const className = messageElement.className.toLowerCase();
    return userIndicators.some(indicator => className.includes(indicator));
  }

  extractMessageTimestamp(messageElement) {
    const timeElement = messageElement.querySelector('time, .timestamp, .time');
    if (timeElement) {
      const datetime = timeElement.getAttribute('datetime') || timeElement.textContent;
      return new Date(datetime).getTime();
    }
    return Date.now();
  }

  // UI Update Methods
  displayProfileAnalysis(analysis) {
    const resultsContainer = document.getElementById('profile-analysis-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = `
      <div class="analysis-result">
        <div class="analysis-score">
          <div class="score-circle">
            <span class="score-value">${Math.round(analysis.overall_score * 10)}/10</span>
          </div>
          <div class="score-label">Overall Score</div>
        </div>
        
        <div class="analysis-details">
          <div class="detail-item">
            <span class="detail-label">Attractiveness:</span>
            <span class="detail-value">${Math.round(analysis.attractiveness_score * 10)}/10</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Photo Quality:</span>
            <span class="detail-value">${Math.round(analysis.photo_quality_score * 10)}/10</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Bio Quality:</span>
            <span class="detail-value">${Math.round(analysis.bio_score * 10)}/10</span>
          </div>
        </div>
        
        <div class="analysis-suggestions">
          <h4>Improvement Suggestions:</h4>
          <ul>
            ${analysis.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
          </ul>
        </div>
        
        ${analysis.red_flags && analysis.red_flags.length > 0 ? `
          <div class="analysis-warnings">
            <h4>⚠️ Red Flags:</h4>
            <ul>
              ${analysis.red_flags.map(flag => `<li>${flag}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  displayConversationSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('conversation-suggestions');
    if (!suggestionsContainer) return;
    
    suggestionsContainer.innerHTML = `
      <div class="suggestions-list">
        ${suggestions.map((suggestion, index) => `
          <div class="suggestion-item" data-suggestion="${suggestion}">
            <div class="suggestion-text">${suggestion}</div>
            <button class="use-suggestion-btn" onclick="this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector('.ai-coach-overlay').aiCoach.useSuggestion('${suggestion}')">
              Use This
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  showAnalysisLoading(type) {
    const containerId = type === 'profile' ? 'profile-analysis-results' : 'conversation-suggestions';
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">Analyzing with AI...</div>
      </div>
    `;
  }

  showErrorMessage(message) {
    // Show error in both sections
    ['profile-analysis-results', 'conversation-suggestions'].forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = `
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <div class="error-text">${message}</div>
          </div>
        `;
      }
    });
  }

  showUpgradeRequired(feature) {
    const upgradeButton = document.getElementById('upgrade-button');
    if (upgradeButton) {
      upgradeButton.style.display = 'block';
      upgradeButton.textContent = `Upgrade for ${feature}`;
    }
    
    this.showErrorMessage(`Upgrade to Premium to unlock ${feature}`);
  }

  showThrottleMessage() {
    this.showErrorMessage('Please wait before analyzing again');
  }

  // Event Handlers
  toggleSuggestionPanel() {
    const isVisible = this.suggestionPanel.style.display !== 'none';
    this.suggestionPanel.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      this.updateTierDisplay();
    }
  }

  minimizeSuggestionPanel() {
    this.suggestionPanel.classList.toggle('minimized');
  }

  closeSuggestionPanel() {
    this.suggestionPanel.style.display = 'none';
  }

  toggleRealTimeCoaching(enabled) {
    this.isCoachingEnabled = enabled;
    
    if (enabled) {
      this.setupMessageObserver();
    } else {
      // Clear real-time feedback
      const feedbackContainer = document.getElementById('real-time-feedback');
      if (feedbackContainer) {
        feedbackContainer.innerHTML = '<div class="placeholder-text">Real-time coaching disabled</div>';
      }
    }
  }

  openUpgradePage() {
    window.open('https://app.aidatingcoach.com/upgrade', '_blank');
  }

  useSuggestion(suggestion) {
    const messageInputSelectors = this.getPlatformSelectors().messageInput;
    
    for (const selector of messageInputSelectors) {
      const input = document.querySelector(selector);
      if (input) {
        input.value = suggestion;
        input.focus();
        
        // Trigger input event
        input.dispatchEvent(new Event('input', { bubbles: true }));
        break;
      }
    }
  }

  // Event Handlers for Observers
  onProfileChange() {
    console.log('Profile changed, updating analysis');
    this.currentProfile = null;
    
    // Auto-analyze if enabled
    if (this.tierInfo?.hasAccess) {
      setTimeout(() => {
        this.performAnalysis('profile');
      }, 1000);
    }
  }

  onConversationChange() {
    console.log('Conversation changed');
    this.currentConversation = null;
  }

  async onMessageInput(input) {
    if (!this.isCoachingEnabled || !this.tierInfo?.hasAccess) return;
    
    const text = input.value.trim();
    if (text.length < 3) return;
    
    try {
      const response = await this.sendMessage('GENERATE_SUGGESTIONS', {
        context: {
          currentMessage: text,
          conversation: this.currentConversation,
          profile: this.currentProfile
        },
        platform: this.platform,
        count: 1
      });
      
      if (response.success && response.result.suggestions.length > 0) {
        this.showRealTimeFeedback(response.result.suggestions[0]);
      }
    } catch (error) {
      console.error('Real-time suggestion error:', error);
    }
  }

  onMessageInputFocus() {
    // Show real-time feedback area
    const feedbackContainer = document.getElementById('real-time-feedback');
    if (feedbackContainer) {
      feedbackContainer.style.display = 'block';
    }
  }

  onMessageInputBlur() {
    // Hide real-time feedback after delay
    setTimeout(() => {
      const feedbackContainer = document.getElementById('real-time-feedback');
      if (feedbackContainer) {
        feedbackContainer.style.display = 'none';
      }
    }, 5000);
  }

  showRealTimeFeedback(suggestion) {
    const feedbackContainer = document.getElementById('real-time-feedback');
    if (!feedbackContainer) return;
    
    feedbackContainer.innerHTML = `
      <div class="real-time-suggestion">
        <div class="suggestion-text">${suggestion}</div>
        <button class="use-suggestion-btn" onclick="aiCoach.useSuggestion('${suggestion}')">
          Use This
        </button>
      </div>
    `;
  }

  handleBackgroundMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'PING':
        sendResponse({ success: true });
        break;
        
      case 'TOGGLE_COACHING':
        this.toggleSuggestionPanel();
        sendResponse({ success: true });
        break;
        
      case 'ANALYZE_CURRENT_PROFILE':
        this.performAnalysis('profile');
        sendResponse({ success: true });
        break;
        
      case 'GENERATE_OPENER':
        this.performAnalysis('conversation');
        sendResponse({ success: true });
        break;
        
      case 'INITIALIZE_PLATFORM':
        this.platform = message.platform;
        this.tierInfo = message.tierInfo;
        this.updateTierDisplay();
        sendResponse({ success: true });
        break;
        
      case 'PLATFORM_ACCESS_UPDATE':
        this.tierInfo.hasAccess = message.hasAccess;
        this.updateTierDisplay();
        sendResponse({ success: true });
        break;
        
      case 'SETTINGS_UPDATED':
        this.onSettingsUpdated(message.changes);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  }

  handleKeyboardShortcut(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'c':
          if (e.shiftKey) {
            e.preventDefault();
            this.toggleSuggestionPanel();
          }
          break;
        case 'a':
          if (e.shiftKey) {
            e.preventDefault();
            this.performAnalysis('profile');
          }
          break;
        case 'o':
          if (e.shiftKey) {
            e.preventDefault();
            this.performAnalysis('conversation');
          }
          break;
      }
    }
  }

  onPageNavigation() {
    // Reset state on navigation
    this.currentProfile = null;
    this.currentConversation = null;
    
    // Clear analysis results
    this.clearAnalysisResults();
  }

  onWindowResize() {
    // Adjust floating button position if needed
    this.snapFloatingButtonToEdge();
  }

  onSettingsUpdated(changes) {
    if (changes.coaching_enabled) {
      this.isCoachingEnabled = changes.coaching_enabled.newValue;
    }
    
    if (changes.dark_mode) {
      this.updateTheme(changes.dark_mode.newValue);
    }
  }

  // Utility Methods
  updateOverlayVisibility() {
    if (this.tierInfo?.hasAccess) {
      this.overlay.style.display = 'block';
    } else {
      this.overlay.style.display = 'block'; // Show with upgrade prompts
    }
  }

  updateTierDisplay() {
    const tierBadge = document.getElementById('tier-badge-display');
    const usageInfo = document.getElementById('usage-info');
    const upgradeButton = document.getElementById('upgrade-button');
    
    if (tierBadge) {
      tierBadge.textContent = this.getTierDisplayName();
      tierBadge.className = `tier-badge tier-${this.tierInfo?.tier || 'free'}`;
    }
    
    if (usageInfo) {
      usageInfo.textContent = this.getUsageDisplay('profile_analysis');
    }
    
    if (upgradeButton) {
      upgradeButton.style.display = this.tierInfo?.hasAccess ? 'none' : 'block';
    }
  }

  getTierDisplayName() {
    const tierNames = {
      free: 'Free',
      premium: 'Premium',
      pro: 'Pro'
    };
    return tierNames[this.tierInfo?.tier] || 'Free';
  }

  getUsageDisplay(feature) {
    if (!this.tierInfo?.usage || !this.tierInfo?.limits) {
      return 'Loading...';
    }
    
    const used = this.tierInfo.usage[feature] || 0;
    const limit = this.tierInfo.limits[feature];
    
    if (limit === -1) {
      return 'Unlimited';
    }
    
    return `${used}/${limit} used today`;
  }

  clearAnalysisResults() {
    const containers = ['profile-analysis-results', 'conversation-suggestions'];
    containers.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = '<div class="placeholder-text">Click "Analyze" to get AI insights</div>';
      }
    });
  }

  updateTheme(isDarkMode) {
    if (isDarkMode) {
      this.overlay.classList.add('dark-theme');
    } else {
      this.overlay.classList.remove('dark-theme');
    }
  }

  async getSettings() {
    try {
      const response = await this.sendMessage('GET_SETTINGS');
      return response.success ? response.settings : {};
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  }

  sendMessage(type, data = {}) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, ...data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  debounce(func, wait) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(func, wait);
  }

  // Cleanup
  destroy() {
    if (this.profileObserver) {
      this.profileObserver.disconnect();
    }
    
    if (this.conversationObserver) {
      this.conversationObserver.disconnect();
    }
    
    if (this.messageObserver) {
      this.messageObserver.disconnect();
    }
    
    if (this.overlay) {
      this.overlay.remove();
    }
  }
}

// Initialize the overlay
const aiCoach = new AICoachingOverlay();

// Make it globally accessible for button clicks
window.aiCoach = aiCoach;

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AICoachingOverlay;
}

