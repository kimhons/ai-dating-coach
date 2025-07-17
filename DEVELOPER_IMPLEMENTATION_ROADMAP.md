# 🚀 AI Dating Coach - Developer Implementation Roadmap
## Granulated Plan for Full-Stack Development

> **Developer**: Senior Full-Stack Engineer  
> **Timeline**: 8 weeks (160 hours)  
> **Approach**: Agile development with weekly sprints  
> **Goal**: Ship browser extension MVP + enhanced mobile features

---

## 📋 Sprint Overview

| Sprint | Duration | Focus | Deliverable |
|--------|----------|-------|-------------|
| Sprint 1 | Week 1 | Browser Extension Foundation | Working MVP |
| Sprint 2 | Week 2 | AI Integration & Testing | Production-ready extension |
| Sprint 3 | Week 3 | Mobile App Enhancement | Cross-platform sync |
| Sprint 4 | Week 4 | Advanced Features | Smart suggestions |
| Sprint 5 | Week 5 | Analytics & Optimization | Performance tuning |
| Sprint 6 | Week 6 | Multi-Platform Support | Platform expansion |
| Sprint 7 | Week 7 | Advanced AI Features | Predictive analytics |
| Sprint 8 | Week 8 | Launch Preparation | Market-ready product |

---

## 🎯 Sprint 1: Browser Extension Foundation (Week 1)

### **Day 1: Project Architecture & Setup (8 hours)**

#### **Morning (4 hours): Environment Setup**
```bash
# Create browser extension workspace
cd /home/ubuntu/ai-dating-coach
mkdir browser-extension
cd browser-extension

# Initialize project structure
mkdir -p src/{content,background,popup,shared} assets dist

# Setup package.json for build tools
npm init -y
npm install --save-dev webpack webpack-cli copy-webpack-plugin
npm install axios uuid

# Create webpack config for extension building
```

**File Structure:**
```
browser-extension/
├── manifest.json
├── webpack.config.js
├── package.json
├── src/
│   ├── content/
│   │   ├── content.js
│   │   └── content.css
│   ├── background/
│   │   └── background.js
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   └── shared/
│       ├── api.js
│       ├── utils.js
│       └── constants.js
├── assets/
│   ├── icons/
│   └── images/
└── dist/
```

#### **Afternoon (4 hours): Core Manifest & Build System**

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "AI Dating Coach Assistant",
  "version": "1.0.0",
  "description": "Real-time AI coaching for dating apps",
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "*://*.tinder.com/*",
    "*://*.bumble.com/*",
    "*://*.hinge.co/*",
    "*://*.match.com/*"
  ],
  "content_scripts": [{
    "matches": [
      "*://*.tinder.com/*",
      "*://*.bumble.com/*",
      "*://*.hinge.co/*"
    ],
    "js": ["content.js"],
    "css": ["content.css"],
    "run_at": "document_end"
  }],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "AI Dating Coach"
  },
  "icons": {
    "16": "assets/icons/icon16.png",
    "48": "assets/icons/icon48.png",
    "128": "assets/icons/icon128.png"
  }
}
```

**webpack.config.js:**
```javascript
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    content: './src/content/content.js',
    background: './src/background/background.js',
    popup: './src/popup/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'src/content/content.css', to: 'content.css' },
        { from: 'src/popup/popup.css', to: 'popup.css' },
        { from: 'assets', to: 'assets' }
      ]
    })
  ]
};
```

### **Day 2: Platform Detection & DOM Monitoring (8 hours)**

#### **Morning (4 hours): Platform Detection System**

**src/shared/constants.js:**
```javascript
export const PLATFORMS = {
  TINDER: 'tinder',
  BUMBLE: 'bumble',
  HINGE: 'hinge',
  UNKNOWN: 'unknown'
};

export const PLATFORM_SELECTORS = {
  [PLATFORMS.TINDER]: {
    messageContainer: '[data-testid="messageList"]',
    messageInput: 'textarea[placeholder*="Type a message"]',
    sendButton: '[data-testid="send-button"]',
    newMessage: '[data-testid="messageText"]',
    matchName: '[data-testid="matchName"]',
    conversationHeader: '[data-testid="conversation-header"]'
  },
  [PLATFORMS.BUMBLE]: {
    messageContainer: '.messages-container, .conversation-messages',
    messageInput: 'textarea[placeholder*="Type your message"]',
    sendButton: '.send-button, [data-qa="send-message"]',
    newMessage: '.message-text, .message-content',
    matchName: '.match-name, .conversation-header-name',
    conversationHeader: '.conversation-header'
  },
  [PLATFORMS.HINGE]: {
    messageContainer: '.conversation-messages, .messages-list',
    messageInput: 'textarea[placeholder*="Write a message"]',
    sendButton: '.send-message-button, [data-testid="send"]',
    newMessage: '.message-text, .conversation-message',
    matchName: '.match-card-name, .conversation-name',
    conversationHeader: '.conversation-header, .match-header'
  }
};

export const API_ENDPOINTS = {
  ANALYZE_CONVERSATION: '/functions/v1/browser-extension-analysis',
  GET_SUGGESTIONS: '/functions/v1/real-time-suggestions',
  TRACK_USAGE: '/functions/v1/track-extension-usage'
};
```

**src/shared/utils.js:**
```javascript
import { PLATFORMS } from './constants.js';

export class PlatformDetector {
  static detect() {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('tinder.com')) return PLATFORMS.TINDER;
    if (hostname.includes('bumble.com')) return PLATFORMS.BUMBLE;
    if (hostname.includes('hinge.co')) return PLATFORMS.HINGE;
    
    return PLATFORMS.UNKNOWN;
  }
  
  static isSupported() {
    return this.detect() !== PLATFORMS.UNKNOWN;
  }
}

export class DOMUtils {
  static waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }
  
  static extractTextContent(element) {
    if (!element) return '';
    
    // Remove script and style elements
    const clone = element.cloneNode(true);
    const scripts = clone.querySelectorAll('script, style');
    scripts.forEach(script => script.remove());
    
    return clone.textContent.trim();
  }
}
```

#### **Afternoon (4 hours): DOM Monitoring Implementation**

**src/content/content.js:**
```javascript
import { PlatformDetector, DOMUtils } from '../shared/utils.js';
import { PLATFORM_SELECTORS, PLATFORMS } from '../shared/constants.js';
import { APIClient } from '../shared/api.js';

class DatingAppMonitor {
  constructor() {
    this.platform = PlatformDetector.detect();
    this.selectors = PLATFORM_SELECTORS[this.platform];
    this.apiClient = new APIClient();
    this.conversationHistory = [];
    this.isMonitoring = false;
    
    if (PlatformDetector.isSupported()) {
      this.initialize();
    }
  }
  
  async initialize() {
    console.log(`AI Dating Coach: Initializing for ${this.platform}`);
    
    try {
      await this.waitForPageLoad();
      await this.setupMessageMonitoring();
      await this.createSuggestionOverlay();
      this.isMonitoring = true;
      
      console.log('AI Dating Coach: Successfully initialized');
    } catch (error) {
      console.error('AI Dating Coach: Initialization failed', error);
    }
  }
  
  async waitForPageLoad() {
    // Wait for the message container to be available
    await DOMUtils.waitForElement(this.selectors.messageContainer, 10000);
  }
  
  async setupMessageMonitoring() {
    const messageContainer = document.querySelector(this.selectors.messageContainer);
    
    if (!messageContainer) {
      throw new Error('Message container not found');
    }
    
    // Monitor for new messages
    this.messageObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          this.handleNewMessages(mutation.addedNodes);
        }
      });
    });
    
    this.messageObserver.observe(messageContainer, {
      childList: true,
      subtree: true
    });
    
    // Load existing conversation
    this.loadExistingConversation();
  }
  
  loadExistingConversation() {
    const messages = document.querySelectorAll(this.selectors.newMessage);
    messages.forEach(messageElement => {
      const messageData = this.extractMessageData(messageElement);
      if (messageData) {
        this.conversationHistory.push(messageData);
      }
    });
    
    console.log(`Loaded ${this.conversationHistory.length} existing messages`);
  }
  
  handleNewMessages(addedNodes) {
    addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const messageElements = node.querySelectorAll(this.selectors.newMessage);
        messageElements.forEach(messageElement => {
          const messageData = this.extractMessageData(messageElement);
          if (messageData && !this.isDuplicateMessage(messageData)) {
            this.conversationHistory.push(messageData);
            this.analyzeConversation();
          }
        });
      }
    });
  }
  
  extractMessageData(messageElement) {
    const text = DOMUtils.extractTextContent(messageElement);
    if (!text) return null;
    
    // Determine if message is from user or match
    const isFromUser = this.isUserMessage(messageElement);
    
    return {
      id: this.generateMessageId(),
      text: text,
      timestamp: Date.now(),
      isFromUser: isFromUser,
      platform: this.platform
    };
  }
  
  isUserMessage(messageElement) {
    // Platform-specific logic to determine message sender
    const messageContainer = messageElement.closest('[class*="message"]');
    
    switch (this.platform) {
      case PLATFORMS.TINDER:
        return messageContainer?.classList.contains('sent') || 
               messageContainer?.querySelector('[data-testid="sent-message"]');
      case PLATFORMS.BUMBLE:
        return messageContainer?.classList.contains('message-sent') ||
               messageContainer?.classList.contains('outbound');
      case PLATFORMS.HINGE:
        return messageContainer?.classList.contains('sent') ||
               messageContainer?.classList.contains('outgoing');
      default:
        return false;
    }
  }
  
  isDuplicateMessage(newMessage) {
    return this.conversationHistory.some(msg => 
      msg.text === newMessage.text && 
      Math.abs(msg.timestamp - newMessage.timestamp) < 1000
    );
  }
  
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  async analyzeConversation() {
    if (this.conversationHistory.length === 0) return;
    
    try {
      const analysis = await this.apiClient.analyzeConversation({
        messages: this.conversationHistory,
        platform: this.platform,
        timestamp: Date.now()
      });
      
      this.displaySuggestions(analysis);
    } catch (error) {
      console.error('Conversation analysis failed:', error);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new DatingAppMonitor());
} else {
  new DatingAppMonitor();
}
```

### **Day 3: API Integration Layer (8 hours)**

#### **Morning (4 hours): API Client Implementation**

**src/shared/api.js:**
```javascript
import { API_ENDPOINTS } from './constants.js';

export class APIClient {
  constructor() {
    this.baseURL = 'https://your-project.supabase.co';
    this.authToken = null;
    this.userId = null;
    
    this.initializeAuth();
  }
  
  async initializeAuth() {
    try {
      // Get stored auth token
      const result = await chrome.storage.local.get(['authToken', 'userId']);
      this.authToken = result.authToken;
      this.userId = result.userId;
      
      if (!this.authToken) {
        await this.authenticateUser();
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    }
  }
  
  async authenticateUser() {
    // For MVP, create anonymous session
    // Later: implement proper OAuth flow
    const anonymousId = this.generateAnonymousId();
    
    await chrome.storage.local.set({
      authToken: `anonymous_${anonymousId}`,
      userId: anonymousId
    });
    
    this.authToken = `anonymous_${anonymousId}`;
    this.userId = anonymousId;
  }
  
  generateAnonymousId() {
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  async analyzeConversation(conversationData) {
    const endpoint = `${this.baseURL}${API_ENDPOINTS.ANALYZE_CONVERSATION}`;
    
    const payload = {
      conversationContent: this.formatConversationForAI(conversationData.messages),
      platform: conversationData.platform,
      userId: this.userId,
      inputMethod: 'browser_extension',
      timestamp: conversationData.timestamp
    };
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Track successful analysis
      this.trackUsage('conversation_analyzed', {
        platform: conversationData.platform,
        messageCount: conversationData.messages.length
      });
      
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      return this.getFallbackSuggestions();
    }
  }
  
  formatConversationForAI(messages) {
    return messages.map(msg => ({
      role: msg.isFromUser ? 'user' : 'assistant',
      content: msg.text,
      timestamp: msg.timestamp
    }));
  }
  
  getFallbackSuggestions() {
    return {
      suggestions: [
        "Ask an open-ended question about their interests",
        "Share something interesting about your day",
        "Suggest meeting for coffee or a casual activity"
      ],
      engagement_score: 7.0,
      confidence: 0.5,
      source: 'fallback'
    };
  }
  
  async trackUsage(eventType, eventData) {
    try {
      const endpoint = `${this.baseURL}${API_ENDPOINTS.TRACK_USAGE}`;
      
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          userId: this.userId,
          eventType: eventType,
          eventData: eventData,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Usage tracking failed:', error);
    }
  }
}
```

#### **Afternoon (4 hours): Backend Function Creation**

**backend/functions/browser-extension-analysis/index.ts:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AnalysisRequest {
  conversationContent: ConversationMessage[];
  platform: string;
  userId: string;
  inputMethod: string;
  timestamp: number;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { conversationContent, platform, userId, inputMethod, timestamp }: AnalysisRequest = await req.json();

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Analyze conversation using existing dual LLM system
    const analysis = await analyzeConversationWithDualLLM(conversationContent);

    // Store analysis in database
    await supabase.from('conversation_analyses').insert({
      user_id: userId,
      platform: platform,
      input_method: inputMethod,
      message_count: conversationContent.length,
      analysis_result: analysis,
      created_at: new Date(timestamp).toISOString()
    });

    // Return enhanced analysis for browser extension
    const enhancedAnalysis = {
      ...analysis,
      realTimeFeatures: {
        optimalResponseTime: calculateOptimalResponseTime(conversationContent),
        conversationMomentum: calculateMomentum(conversationContent),
        nextStepRecommendation: generateNextStepRecommendation(analysis)
      }
    };

    return new Response(JSON.stringify(enhancedAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Browser extension analysis error:', error);
    
    return new Response(JSON.stringify({
      error: 'Analysis failed',
      fallback: true,
      suggestions: [
        "Ask about their weekend plans",
        "Share something about your interests",
        "Suggest a fun activity you could do together"
      ],
      engagement_score: 6.0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function analyzeConversationWithDualLLM(messages: ConversationMessage[]) {
  // Use existing dual LLM system from conversation-analysis-enhanced
  const conversationText = messages.map(msg => 
    `${msg.role === 'user' ? 'You' : 'Match'}: ${msg.content}`
  ).join('\n');

  try {
    // Try OpenAI first
    const openAIResult = await analyzeWithOpenAI(conversationText);
    return openAIResult;
  } catch (error) {
    console.log('OpenAI failed, trying Gemini:', error);
    try {
      const geminiResult = await analyzeWithGemini(conversationText);
      return geminiResult;
    } catch (geminiError) {
      console.error('Both AI providers failed:', geminiError);
      throw new Error('AI analysis unavailable');
    }
  }
}

async function analyzeWithOpenAI(conversationText: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: `You are an expert dating coach. Analyze this conversation and provide:
1. 3-5 specific message suggestions
2. Engagement score (1-10)
3. Conversation assessment
4. Next step recommendations

Format as JSON with keys: suggestions, engagement_score, assessment, next_steps`
      }, {
        role: 'user',
        content: conversationText
      }],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function analyzeWithGemini(conversationText: string) {
  // Implement Gemini analysis as fallback
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `As a dating coach, analyze this conversation and provide JSON response with suggestions, engagement_score, assessment, next_steps:\n\n${conversationText}`
        }]
      }]
    })
  });

  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

function calculateOptimalResponseTime(messages: ConversationMessage[]): string {
  const recentMessages = messages.slice(-5);
  const avgResponseTime = recentMessages.reduce((acc, msg, index) => {
    if (index === 0) return acc;
    return acc + (msg.timestamp - recentMessages[index - 1].timestamp);
  }, 0) / Math.max(recentMessages.length - 1, 1);

  if (avgResponseTime < 60000) return 'Respond quickly (within 1 minute)';
  if (avgResponseTime < 300000) return 'Respond soon (within 5 minutes)';
  if (avgResponseTime < 3600000) return 'Respond within an hour';
  return 'Take your time (respond when convenient)';
}

function calculateMomentum(messages: ConversationMessage[]): number {
  if (messages.length < 2) return 5.0;
  
  const recentMessages = messages.slice(-10);
  const timeSpans = recentMessages.slice(1).map((msg, index) => 
    msg.timestamp - recentMessages[index].timestamp
  );
  
  const avgTimeSpan = timeSpans.reduce((a, b) => a + b, 0) / timeSpans.length;
  
  // Lower time spans = higher momentum
  if (avgTimeSpan < 60000) return 9.0; // Very high momentum
  if (avgTimeSpan < 300000) return 7.0; // High momentum
  if (avgTimeSpan < 3600000) return 5.0; // Medium momentum
  return 3.0; // Low momentum
}

function generateNextStepRecommendation(analysis: any): string {
  const score = analysis.engagement_score || 5;
  
  if (score >= 8) return 'Great conversation! Consider suggesting to meet in person.';
  if (score >= 6) return 'Good momentum. Keep the conversation flowing with engaging questions.';
  if (score >= 4) return 'Try to increase engagement with more personal or interesting topics.';
  return 'Consider changing the conversation direction or asking more engaging questions.';
}
```

### **Day 4: Suggestion Overlay UI (8 hours)**

#### **Morning (4 hours): Overlay Component**

**src/content/content.css:**
```css
/* AI Dating Coach Overlay Styles */
.ai-coach-overlay {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  max-height: 500px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: white;
  overflow: hidden;
  transition: all 0.3s ease;
}

.ai-coach-overlay.minimized {
  height: 50px;
  overflow: hidden;
}

.ai-coach-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  cursor: move;
}

.ai-coach-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-coach-controls {
  display: flex;
  gap: 8px;
}

.ai-coach-controls button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.ai-coach-controls button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ai-coach-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.suggestions-section {
  margin-bottom: 16px;
}

.suggestions-section h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  opacity: 0.9;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.4;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.suggestion-item:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.suggestion-item.used {
  opacity: 0.6;
  background: rgba(255, 255, 255, 0.05);
}

.metrics-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.metric-item {
  text-align: center;
}

.metric-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 11px;
  opacity: 0.8;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-size: 12px;
  opacity: 0.8;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  opacity: 0.8;
}

.retry-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  margin-top: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .ai-coach-overlay {
    width: 280px;
    right: 10px;
    top: 10px;
  }
}

/* Dark mode support for different dating apps */
.ai-coach-overlay.dark-theme {
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
}

/* Animation for new suggestions */
.suggestion-item.new {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

#### **Afternoon (4 hours): Overlay JavaScript Implementation**

**src/content/overlay.js:**
```javascript
export class SuggestionOverlay {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.isMinimized = false;
    this.isDragging = false;
    this.currentSuggestions = [];
    this.usedSuggestions = new Set();
    
    this.createElement();
    this.bindEvents();
    this.loadSettings();
  }
  
  createElement() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'ai-coach-overlay';
    this.overlay.innerHTML = `
      <div class="ai-coach-header">
        <h3>
          <span class="ai-icon">🤖</span>
          AI Dating Coach
        </h3>
        <div class="ai-coach-controls">
          <button class="settings-btn" title="Settings">⚙️</button>
          <button class="minimize-btn" title="Minimize">−</button>
          <button class="close-btn" title="Close">×</button>
        </div>
      </div>
      <div class="ai-coach-content">
        <div class="loading-state">
          <div class="loading-spinner"></div>
          Analyzing conversation...
        </div>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
    this.makeDraggable();
  }
  
  bindEvents() {
    // Control buttons
    this.overlay.querySelector('.minimize-btn').addEventListener('click', () => {
      this.toggleMinimize();
    });
    
    this.overlay.querySelector('.close-btn').addEventListener('click', () => {
      this.hide();
    });
    
    this.overlay.querySelector('.settings-btn').addEventListener('click', () => {
      this.showSettings();
    });
    
    // Suggestion click handling
    this.overlay.addEventListener('click', (e) => {
      if (e.target.classList.contains('suggestion-item') && !e.target.classList.contains('used')) {
        this.useSuggestion(e.target);
      }
    });
  }
  
  makeDraggable() {
    const header = this.overlay.querySelector('.ai-coach-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    header.addEventListener('mousedown', (e) => {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      
      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
        header.style.cursor = 'grabbing';
      }
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        this.overlay.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    });
    
    document.addEventListener('mouseup', () => {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      header.style.cursor = 'move';
    });
  }
  
  updateSuggestions(analysis) {
    const content = this.overlay.querySelector('.ai-coach-content');
    
    if (!analysis || analysis.error) {
      this.showError(analysis?.error || 'Analysis failed');
      return;
    }
    
    this.currentSuggestions = analysis.suggestions || [];
    
    content.innerHTML = `
      <div class="suggestions-section">
        <h4>💡 Smart Suggestions</h4>
        <div class="suggestion-list">
          ${this.currentSuggestions.map((suggestion, index) => `
            <div class="suggestion-item new" data-index="${index}">
              ${suggestion}
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="metrics-section">
        <div class="metric-item">
          <span class="metric-value">${analysis.engagement_score || '--'}</span>
          <span class="metric-label">Engagement</span>
        </div>
        <div class="metric-item">
          <span class="metric-value">${analysis.realTimeFeatures?.conversationMomentum || '--'}</span>
          <span class="metric-label">Momentum</span>
        </div>
      </div>
      
      ${analysis.realTimeFeatures?.nextStepRecommendation ? `
        <div class="next-step-section">
          <h4>🎯 Next Step</h4>
          <p class="next-step-text">${analysis.realTimeFeatures.nextStepRecommendation}</p>
        </div>
      ` : ''}
      
      ${analysis.realTimeFeatures?.optimalResponseTime ? `
        <div class="timing-section">
          <h4>⏰ Timing</h4>
          <p class="timing-text">${analysis.realTimeFeatures.optimalResponseTime}</p>
        </div>
      ` : ''}
    `;
    
    // Track successful analysis
    this.apiClient.trackUsage('suggestions_displayed', {
      suggestionCount: this.currentSuggestions.length,
      engagementScore: analysis.engagement_score
    });
  }
  
  useSuggestion(suggestionElement) {
    const index = parseInt(suggestionElement.dataset.index);
    const suggestion = this.currentSuggestions[index];
    
    if (!suggestion) return;
    
    // Mark as used
    suggestionElement.classList.add('used');
    this.usedSuggestions.add(index);
    
    // Copy to clipboard
    navigator.clipboard.writeText(suggestion).then(() => {
      this.showToast('Suggestion copied to clipboard!');
    }).catch(() => {
      this.showToast('Click to copy: ' + suggestion);
    });
    
    // Track usage
    this.apiClient.trackUsage('suggestion_used', {
      suggestion: suggestion,
      index: index
    });
  }
  
  showLoading() {
    const content = this.overlay.querySelector('.ai-coach-content');
    content.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        Analyzing conversation...
      </div>
    `;
  }
  
  showError(errorMessage) {
    const content = this.overlay.querySelector('.ai-coach-content');
    content.innerHTML = `
      <div class="error-state">
        <p>⚠️ ${errorMessage}</p>
        <button class="retry-button">Retry Analysis</button>
      </div>
    `;
    
    content.querySelector('.retry-button').addEventListener('click', () => {
      this.showLoading();
      // Trigger re-analysis
      window.dispatchEvent(new CustomEvent('ai-coach-retry'));
    });
  }
  
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'ai-coach-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10001;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.style.opacity = '1', 10);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  }
  
  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    this.overlay.classList.toggle('minimized', this.isMinimized);
    
    const btn = this.overlay.querySelector('.minimize-btn');
    btn.textContent = this.isMinimized ? '+' : '−';
    btn.title = this.isMinimized ? 'Expand' : 'Minimize';
  }
  
  show() {
    this.overlay.style.display = 'block';
  }
  
  hide() {
    this.overlay.style.display = 'none';
  }
  
  async loadSettings() {
    try {
      const settings = await chrome.storage.local.get(['overlayPosition', 'overlayTheme']);
      
      if (settings.overlayPosition) {
        this.overlay.style.transform = `translate(${settings.overlayPosition.x}px, ${settings.overlayPosition.y}px)`;
      }
      
      if (settings.overlayTheme === 'dark') {
        this.overlay.classList.add('dark-theme');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
  
  showSettings() {
    // TODO: Implement settings panel
    this.showToast('Settings panel coming soon!');
  }
}
```

### **Day 5: Integration & Testing (8 hours)**

#### **Morning (4 hours): Complete Integration**

**Updated src/content/content.js (integration):**
```javascript
import { PlatformDetector, DOMUtils } from '../shared/utils.js';
import { PLATFORM_SELECTORS, PLATFORMS } from '../shared/constants.js';
import { APIClient } from '../shared/api.js';
import { SuggestionOverlay } from './overlay.js';

class DatingAppMonitor {
  constructor() {
    this.platform = PlatformDetector.detect();
    this.selectors = PLATFORM_SELECTORS[this.platform];
    this.apiClient = new APIClient();
    this.overlay = new SuggestionOverlay(this.apiClient);
    this.conversationHistory = [];
    this.isMonitoring = false;
    this.analysisTimeout = null;
    
    if (PlatformDetector.isSupported()) {
      this.initialize();
    } else {
      console.log('AI Dating Coach: Platform not supported');
    }
  }
  
  async initialize() {
    console.log(`AI Dating Coach: Initializing for ${this.platform}`);
    
    try {
      await this.waitForPageLoad();
      await this.setupMessageMonitoring();
      this.overlay.show();
      this.isMonitoring = true;
      
      // Initial analysis if conversation exists
      if (this.conversationHistory.length > 0) {
        this.scheduleAnalysis();
      }
      
      console.log('AI Dating Coach: Successfully initialized');
    } catch (error) {
      console.error('AI Dating Coach: Initialization failed', error);
      this.overlay.showError('Failed to initialize. Please refresh the page.');
    }
  }
  
  // ... (previous methods remain the same)
  
  scheduleAnalysis() {
    // Debounce analysis to avoid too many API calls
    if (this.analysisTimeout) {
      clearTimeout(this.analysisTimeout);
    }
    
    this.analysisTimeout = setTimeout(() => {
      this.analyzeConversation();
    }, 2000); // Wait 2 seconds after last message
  }
  
  async analyzeConversation() {
    if (this.conversationHistory.length === 0) return;
    
    this.overlay.showLoading();
    
    try {
      const analysis = await this.apiClient.analyzeConversation({
        messages: this.conversationHistory,
        platform: this.platform,
        timestamp: Date.now()
      });
      
      this.overlay.updateSuggestions(analysis);
    } catch (error) {
      console.error('Conversation analysis failed:', error);
      this.overlay.showError('Analysis failed. Please try again.');
    }
  }
  
  handleNewMessages(addedNodes) {
    let hasNewMessages = false;
    
    addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const messageElements = node.querySelectorAll(this.selectors.newMessage);
        messageElements.forEach(messageElement => {
          const messageData = this.extractMessageData(messageElement);
          if (messageData && !this.isDuplicateMessage(messageData)) {
            this.conversationHistory.push(messageData);
            hasNewMessages = true;
          }
        });
      }
    });
    
    if (hasNewMessages) {
      this.scheduleAnalysis();
    }
  }
}

// Listen for retry events
window.addEventListener('ai-coach-retry', () => {
  if (window.datingAppMonitor) {
    window.datingAppMonitor.analyzeConversation();
  }
});

// Initialize and store globally for retry functionality
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.datingAppMonitor = new DatingAppMonitor();
  });
} else {
  window.datingAppMonitor = new DatingAppMonitor();
}
```

#### **Afternoon (4 hours): Testing & Bug Fixes**

**Testing Checklist:**
- [ ] Platform detection works correctly
- [ ] Message monitoring captures new messages
- [ ] API integration functions properly
- [ ] Overlay displays and updates correctly
- [ ] Drag functionality works
- [ ] Minimize/maximize works
- [ ] Suggestion copying works
- [ ] Error handling displays properly
- [ ] Performance is acceptable

**Build and Test Script:**
```bash
# Build extension
npm run build

# Load in Chrome for testing
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

---

## 🎯 Sprint 1 Deliverables

### **Completed Features:**
- [x] Browser extension foundation with manifest v3
- [x] Platform detection for Tinder, Bumble, Hinge
- [x] Real-time message monitoring
- [x] API integration with existing backend
- [x] Suggestion overlay with drag/minimize functionality
- [x] Basic error handling and fallback suggestions
- [x] Usage tracking and analytics

### **Technical Achievements:**
- [x] Webpack build system for extension development
- [x] Modular architecture with shared utilities
- [x] Responsive overlay UI with smooth animations
- [x] Cross-platform message extraction
- [x] Debounced API calls for performance
- [x] Local storage for settings and auth

### **Next Sprint Preview:**
Sprint 2 will focus on advanced AI features, performance optimization, and preparing for Chrome Web Store submission.

**Total Development Time: 40 hours (Week 1)**  
**Status: MVP Ready for Beta Testing** ✅

