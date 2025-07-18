/**
 * AI Dating Coach Browser Extension - Main Content Script
 * Handles floating button, real-time coaching overlay, and dating app integration
 */

class AICoachingOverlay {
  constructor() {
    this.platform = null;
    this.settings = {};
    this.isInitialized = false;
    this.floatingButton = null;
    this.coachingPanel = null;
    this.currentAnalysis = null;
    this.observerInstances = [];
    
    this.init();
  }

  async init() {
    if (this.isInitialized) return;
    
    console.log('AI Dating Coach: Initializing overlay');
    
    // Wait for page to be fully loaded
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => this.init());
      return;
    }
    
    // Get initial state from background script
    const state = await this.sendMessage({ type: 'GET_EXTENSION_STATE' });
    if (state.success) {
      this.settings = state.data.settings;
      this.platform = this.detectCurrentPlatform();
    }
    
    // Create floating button if enabled
    if (this.settings.floatingButtonEnabled && this.platform) {
      this.createFloatingButton();
    }
    
    // Set up observers for dynamic content
    this.setupObservers();
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });
    
    this.isInitialized = true;
    console.log(`AI Dating Coach: Initialized for ${this.platform}`);
  }

  detectCurrentPlatform() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('tinder.com')) return 'tinder';
    if (hostname.includes('bumble.com')) return 'bumble';
    if (hostname.includes('hinge.co')) return 'hinge';
    if (hostname.includes('okcupid.com')) return 'okcupid';
    if (hostname.includes('match.com')) return 'match';
    if (hostname.includes('coffeemeetsbagel.com')) return 'coffeemeetsbagel';
    if (hostname.includes('pof.com')) return 'pof';
    
    return null;
  }

  createFloatingButton() {
    // Remove existing button if present
    if (this.floatingButton) {
      this.floatingButton.remove();
    }
    
    // Create floating button container
    this.floatingButton = document.createElement('div');
    this.floatingButton.id = 'ai-coach-floating-button';
    this.floatingButton.className = 'ai-coach-floating-btn';
    
    // Button content
    this.floatingButton.innerHTML = `
      <div class="ai-coach-btn-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
          <path d="M19 15L20.09 18.26L24 19L20.09 19.74L19 23L17.91 19.74L14 19L17.91 18.26L19 15Z" fill="white"/>
          <path d="M5 15L6.09 18.26L10 19L6.09 19.74L5 23L3.91 19.74L0 19L3.91 18.26L5 15Z" fill="white"/>
        </svg>
      </div>
      <div class="ai-coach-btn-pulse"></div>
    `;
    
    // Add click handler
    this.floatingButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleCoachingPanel();
    });
    
    // Add to page
    document.body.appendChild(this.floatingButton);
    
    // Position button based on platform
    this.positionFloatingButton();
    
    // Add hover effects
    this.addFloatingButtonEffects();
  }

  positionFloatingButton() {
    const button = this.floatingButton;
    if (!button) return;
    
    // Platform-specific positioning
    switch (this.platform) {
      case 'tinder':
        button.style.right = '20px';
        button.style.bottom = '100px';
        break;
      case 'bumble':
        button.style.right = '20px';
        button.style.bottom = '120px';
        break;
      case 'hinge':
        button.style.right = '20px';
        button.style.bottom = '80px';
        break;
      default:
        button.style.right = '20px';
        button.style.bottom = '80px';
    }
  }

  addFloatingButtonEffects() {
    const button = this.floatingButton;
    if (!button) return;
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      this.showQuickTip();
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      this.hideQuickTip();
    });
    
    // Pulse animation for new suggestions
    this.startPulseAnimation();
  }

  startPulseAnimation() {
    const pulse = this.floatingButton?.querySelector('.ai-coach-btn-pulse');
    if (pulse) {
      pulse.style.animation = 'ai-coach-pulse 2s infinite';
    }
  }

  async toggleCoachingPanel() {
    if (this.coachingPanel && this.coachingPanel.style.display !== 'none') {
      this.hideCoachingPanel();
    } else {
      await this.showCoachingPanel();
    }
  }

  async showCoachingPanel() {
    // Create panel if it doesn't exist
    if (!this.coachingPanel) {
      this.createCoachingPanel();
    }
    
    // Show panel
    this.coachingPanel.style.display = 'block';
    setTimeout(() => {
      this.coachingPanel.style.opacity = '1';
      this.coachingPanel.style.transform = 'translateX(0)';
    }, 10);
    
    // Load quick suggestions
    await this.loadQuickSuggestions();
    
    // Track usage
    this.sendMessage({
      type: 'TRACK_USAGE',
      data: { type: 'floating_button_click', platform: this.platform }
    });
  }

  hideCoachingPanel() {
    if (!this.coachingPanel) return;
    
    this.coachingPanel.style.opacity = '0';
    this.coachingPanel.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
      this.coachingPanel.style.display = 'none';
    }, 300);
  }

  createCoachingPanel() {
    this.coachingPanel = document.createElement('div');
    this.coachingPanel.id = 'ai-coach-panel';
    this.coachingPanel.className = 'ai-coach-panel';
    
    this.coachingPanel.innerHTML = `
      <div class="ai-coach-panel-header">
        <div class="ai-coach-panel-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="#E91E63"/>
          </svg>
          AI Dating Coach
        </div>
        <button class="ai-coach-panel-close" onclick="this.closest('.ai-coach-panel').style.display='none'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
      
      <div class="ai-coach-panel-content">
        <div class="ai-coach-quick-actions">
          <button class="ai-coach-action-btn" data-action="analyze-photos">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="2"/>
              <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2"/>
            </svg>
            Analyze Photos
          </button>
          
          <button class="ai-coach-action-btn" data-action="analyze-conversation">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2"/>
            </svg>
            Analyze Chat
          </button>
          
          <button class="ai-coach-action-btn" data-action="get-suggestions">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9.663 17H4.5C3.837 17 3.201 16.737 2.732 16.268C2.263 15.799 2 15.163 2 14.5S2.263 13.201 2.732 12.732C3.201 12.263 3.837 12 4.5 12H9.663M14.337 7H19.5C20.163 7 20.799 7.263 21.268 7.732C21.737 8.201 22 8.837 22 9.5S21.737 10.799 21.268 11.268C20.799 11.737 20.163 12 19.5 12H14.337M6 12H18" stroke="currentColor" stroke-width="2"/>
            </svg>
            Get Tips
          </button>
        </div>
        
        <div class="ai-coach-suggestions-container">
          <div class="ai-coach-loading">
            <div class="ai-coach-spinner"></div>
            Loading suggestions...
          </div>
        </div>
        
        <div class="ai-coach-panel-footer">
          <div class="ai-coach-platform-indicator">
            <span class="ai-coach-platform-name">${this.platform}</span>
            <span class="ai-coach-status-dot"></span>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners
    this.coachingPanel.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('.ai-coach-action-btn');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        this.handlePanelAction(action);
      }
    });
    
    document.body.appendChild(this.coachingPanel);
  }

  async handlePanelAction(action) {
    const container = this.coachingPanel.querySelector('.ai-coach-suggestions-container');
    
    switch (action) {
      case 'analyze-photos':
        await this.analyzeCurrentPhotos();
        break;
      case 'analyze-conversation':
        await this.analyzeCurrentConversation();
        break;
      case 'get-suggestions':
        await this.loadQuickSuggestions();
        break;
    }
  }

  async analyzeCurrentPhotos() {
    const container = this.coachingPanel.querySelector('.ai-coach-suggestions-container');
    container.innerHTML = '<div class="ai-coach-loading"><div class="ai-coach-spinner"></div>Analyzing photos...</div>';
    
    try {
      // Find photo elements on the current page
      const photos = this.findPhotosOnPage();
      
      if (photos.length === 0) {
        container.innerHTML = '<div class="ai-coach-no-content">No photos found on this page. Navigate to a profile with photos to analyze.</div>';
        return;
      }
      
      // Analyze the first photo
      const photoUrl = photos[0].src;
      const result = await this.sendMessage({
        type: 'ANALYZE_PHOTO',
        data: {
          imageUrl: photoUrl,
          analysisType: 'profile'
        }
      });
      
      if (result.success) {
        this.displayPhotoAnalysis(result.data);
      } else {
        container.innerHTML = `<div class="ai-coach-error">Analysis failed: ${result.error}</div>`;
      }
      
    } catch (error) {
      console.error('Photo analysis error:', error);
      container.innerHTML = '<div class="ai-coach-error">Failed to analyze photos. Please try again.</div>';
    }
  }

  async analyzeCurrentConversation() {
    const container = this.coachingPanel.querySelector('.ai-coach-suggestions-container');
    container.innerHTML = '<div class="ai-coach-loading"><div class="ai-coach-spinner"></div>Analyzing conversation...</div>';
    
    try {
      // Extract conversation text from the current page
      const conversationText = this.extractConversationText();
      
      if (!conversationText) {
        container.innerHTML = '<div class="ai-coach-no-content">No conversation found. Open a chat to analyze the conversation.</div>';
        return;
      }
      
      const result = await this.sendMessage({
        type: 'ANALYZE_CONVERSATION',
        data: {
          conversationText: conversationText,
          analysisType: 'text'
        }
      });
      
      if (result.success) {
        this.displayConversationAnalysis(result.data);
      } else {
        container.innerHTML = `<div class="ai-coach-error">Analysis failed: ${result.error}</div>`;
      }
      
    } catch (error) {
      console.error('Conversation analysis error:', error);
      container.innerHTML = '<div class="ai-coach-error">Failed to analyze conversation. Please try again.</div>';
    }
  }

  async loadQuickSuggestions() {
    const container = this.coachingPanel.querySelector('.ai-coach-suggestions-container');
    container.innerHTML = '<div class="ai-coach-loading"><div class="ai-coach-spinner"></div>Loading suggestions...</div>';
    
    try {
      const result = await this.sendMessage({
        type: 'GET_QUICK_SUGGESTIONS',
        data: { platform: this.platform }
      });
      
      if (result.success) {
        this.displayQuickSuggestions(result.data);
      } else {
        container.innerHTML = `<div class="ai-coach-error">Failed to load suggestions: ${result.error}</div>`;
      }
      
    } catch (error) {
      console.error('Load suggestions error:', error);
      container.innerHTML = '<div class="ai-coach-error">Failed to load suggestions. Please try again.</div>';
    }
  }

  displayPhotoAnalysis(analysis) {
    const container = this.coachingPanel.querySelector('.ai-coach-suggestions-container');
    
    container.innerHTML = `
      <div class="ai-coach-analysis-result">
        <div class="ai-coach-analysis-header">
          <h3>Photo Analysis Results</h3>
          <div class="ai-coach-overall-score">${analysis.overall_score}/10</div>
        </div>
        
        <div class="ai-coach-score-breakdown">
          <div class="ai-coach-score-item">
            <span class="ai-coach-score-label">Appeal</span>
            <span class="ai-coach-score-value">${analysis.appeal_score}/10</span>
          </div>
          <div class="ai-coach-score-item">
            <span class="ai-coach-score-label">Composition</span>
            <span class="ai-coach-score-value">${analysis.composition_score}/10</span>
          </div>
          <div class="ai-coach-score-item">
            <span class="ai-coach-score-label">Emotion</span>
            <span class="ai-coach-score-value">${analysis.emotion_score}/10</span>
          </div>
        </div>
        
        <div class="ai-coach-feedback">
          <h4>Feedback</h4>
          <p>${analysis.feedback}</p>
        </div>
        
        ${analysis.suggestions.length > 0 ? `
          <div class="ai-coach-suggestions">
            <h4>Suggestions</h4>
            <ul>
              ${analysis.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  displayConversationAnalysis(analysis) {
    const container = this.coachingPanel.querySelector('.ai-coach-suggestions-container');
    
    container.innerHTML = `
      <div class="ai-coach-analysis-result">
        <div class="ai-coach-analysis-header">
          <h3>Conversation Analysis</h3>
        </div>
        
        <div class="ai-coach-score-breakdown">
          <div class="ai-coach-score-item">
            <span class="ai-coach-score-label">Engagement</span>
            <span class="ai-coach-score-value">${analysis.engagement_score}/10</span>
          </div>
          <div class="ai-coach-score-item">
            <span class="ai-coach-score-label">Sentiment</span>
            <span class="ai-coach-score-value">${analysis.sentiment_score}/10</span>
          </div>
          <div class="ai-coach-score-item">
            <span class="ai-coach-score-label">Quality</span>
            <span class="ai-coach-score-value">${analysis.response_quality_score}/10</span>
          </div>
        </div>
        
        <div class="ai-coach-feedback">
          <h4>Coaching Feedback</h4>
          <p>${analysis.coaching_feedback}</p>
        </div>
        
        ${analysis.next_message_suggestions.length > 0 ? `
          <div class="ai-coach-suggestions">
            <h4>Message Suggestions</h4>
            <div class="ai-coach-message-suggestions">
              ${analysis.next_message_suggestions.map(suggestion => `
                <div class="ai-coach-message-suggestion">
                  <div class="ai-coach-suggestion-text">${suggestion.text}</div>
                  <div class="ai-coach-suggestion-meta">
                    <span class="ai-coach-suggestion-tone">${suggestion.tone}</span>
                    <span class="ai-coach-suggestion-score">${suggestion.engagement_prediction}/10</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  displayQuickSuggestions(suggestions) {
    const container = this.coachingPanel.querySelector('.ai-coach-suggestions-container');
    
    container.innerHTML = `
      <div class="ai-coach-quick-suggestions">
        <h3>Quick Tips</h3>
        <div class="ai-coach-tips-list">
          ${suggestions.map(suggestion => `
            <div class="ai-coach-tip-item" data-action="${suggestion.action}">
              <div class="ai-coach-tip-icon">
                ${this.getTipIcon(suggestion.type)}
              </div>
              <div class="ai-coach-tip-content">
                <div class="ai-coach-tip-title">${suggestion.title}</div>
                <div class="ai-coach-tip-message">${suggestion.message}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  getTipIcon(type) {
    const icons = {
      photo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="2"/><path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2"/></svg>',
      conversation: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2"/></svg>',
      profile: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>'
    };
    return icons[type] || icons.profile;
  }

  // Platform-specific content extraction methods
  findPhotosOnPage() {
    const photos = [];
    
    // Common photo selectors across platforms
    const selectors = [
      'img[src*="images-ssl.gotinder.com"]', // Tinder
      'img[src*="bumble.com"]', // Bumble
      'img[src*="hinge.co"]', // Hinge
      'img[src*="okcupid.com"]', // OkCupid
      '.photo img', // Generic
      '.profile-photo img', // Generic
      '[data-testid*="photo"] img', // Generic
      '.card img' // Generic
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(img => {
        if (img.src && img.src.startsWith('http') && img.width > 100 && img.height > 100) {
          photos.push(img);
        }
      });
    });
    
    return photos;
  }

  extractConversationText() {
    let conversationText = '';
    
    // Platform-specific conversation extraction
    switch (this.platform) {
      case 'tinder':
        conversationText = this.extractTinderConversation();
        break;
      case 'bumble':
        conversationText = this.extractBumbleConversation();
        break;
      case 'hinge':
        conversationText = this.extractHingeConversation();
        break;
      default:
        conversationText = this.extractGenericConversation();
    }
    
    return conversationText;
  }

  extractTinderConversation() {
    const messages = document.querySelectorAll('[data-testid="msg"]');
    let conversation = '';
    
    messages.forEach(msg => {
      const text = msg.textContent?.trim();
      if (text) {
        const isOutgoing = msg.closest('[data-testid="outgoing-msg"]');
        const sender = isOutgoing ? 'You' : 'Them';
        conversation += `${sender}: ${text}\n`;
      }
    });
    
    return conversation;
  }

  extractBumbleConversation() {
    const messages = document.querySelectorAll('.message');
    let conversation = '';
    
    messages.forEach(msg => {
      const text = msg.textContent?.trim();
      if (text) {
        const isOutgoing = msg.classList.contains('message--outgoing');
        const sender = isOutgoing ? 'You' : 'Them';
        conversation += `${sender}: ${text}\n`;
      }
    });
    
    return conversation;
  }

  extractHingeConversation() {
    const messages = document.querySelectorAll('.message-text');
    let conversation = '';
    
    messages.forEach(msg => {
      const text = msg.textContent?.trim();
      if (text) {
        const isOutgoing = msg.closest('.message--sent');
        const sender = isOutgoing ? 'You' : 'Them';
        conversation += `${sender}: ${text}\n`;
      }
    });
    
    return conversation;
  }

  extractGenericConversation() {
    // Generic conversation extraction for other platforms
    const messageSelectors = [
      '.message',
      '.chat-message',
      '.conversation-message',
      '[data-testid*="message"]',
      '.msg'
    ];
    
    let conversation = '';
    
    messageSelectors.forEach(selector => {
      const messages = document.querySelectorAll(selector);
      messages.forEach(msg => {
        const text = msg.textContent?.trim();
        if (text && text.length > 5) {
          conversation += `Message: ${text}\n`;
        }
      });
    });
    
    return conversation;
  }

  setupObservers() {
    // Observe DOM changes to detect new content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if new photos or messages were added
          this.handleNewContent(mutation.addedNodes);
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    this.observerInstances.push(observer);
  }

  handleNewContent(addedNodes) {
    // Auto-analyze new content if enabled
    if (!this.settings.autoAnalysisEnabled) return;
    
    addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Check for new photos
        const photos = node.querySelectorAll('img');
        if (photos.length > 0) {
          this.handleNewPhotos(photos);
        }
        
        // Check for new messages
        const messages = node.querySelectorAll('.message, .chat-message, [data-testid*="message"]');
        if (messages.length > 0) {
          this.handleNewMessages(messages);
        }
      }
    });
  }

  handleNewPhotos(photos) {
    // Show subtle notification about new photos
    if (this.floatingButton) {
      this.startPulseAnimation();
    }
  }

  handleNewMessages(messages) {
    // Show subtle notification about new messages
    if (this.floatingButton) {
      this.startPulseAnimation();
    }
  }

  showQuickTip() {
    // Show quick tip on hover
    const tip = document.createElement('div');
    tip.className = 'ai-coach-quick-tip';
    tip.textContent = 'Click for AI coaching tips';
    
    this.floatingButton.appendChild(tip);
    
    setTimeout(() => {
      tip.style.opacity = '1';
    }, 10);
  }

  hideQuickTip() {
    const tip = this.floatingButton?.querySelector('.ai-coach-quick-tip');
    if (tip) {
      tip.remove();
    }
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'PLATFORM_DETECTED':
        this.platform = message.platform;
        this.settings = message.settings;
        if (this.settings.floatingButtonEnabled && !this.floatingButton) {
          this.createFloatingButton();
        }
        break;
        
      case 'SETTINGS_UPDATED':
        this.settings = message.settings;
        this.updateUIBasedOnSettings();
        break;
    }
  }

  updateUIBasedOnSettings() {
    if (this.settings.floatingButtonEnabled && !this.floatingButton) {
      this.createFloatingButton();
    } else if (!this.settings.floatingButtonEnabled && this.floatingButton) {
      this.floatingButton.remove();
      this.floatingButton = null;
    }
    
    if (!this.settings.floatingButtonEnabled && this.coachingPanel) {
      this.hideCoachingPanel();
    }
  }

  async sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response || { success: false, error: 'No response' });
      });
    });
  }

  destroy() {
    // Clean up observers
    this.observerInstances.forEach(observer => observer.disconnect());
    this.observerInstances = [];
    
    // Remove UI elements
    if (this.floatingButton) {
      this.floatingButton.remove();
    }
    
    if (this.coachingPanel) {
      this.coachingPanel.remove();
    }
    
    this.isInitialized = false;
  }
}

// Initialize the overlay when the script loads
let aiCoachingOverlay;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    aiCoachingOverlay = new AICoachingOverlay();
  });
} else {
  aiCoachingOverlay = new AICoachingOverlay();
}

// Handle page navigation in SPAs
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Reinitialize on navigation
    if (aiCoachingOverlay) {
      aiCoachingOverlay.destroy();
    }
    setTimeout(() => {
      aiCoachingOverlay = new AICoachingOverlay();
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });

