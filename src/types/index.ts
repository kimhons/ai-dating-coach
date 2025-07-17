// Core Types
export type UserTier = 'free' | 'premium' | 'pro';
export type DatingPlatform = 'tinder' | 'bumble' | 'hinge' | 'match' | 'okcupid' | 'unknown';
export type AnalysisType = 'photo' | 'conversation' | 'voice' | 'screenshot' | 'keyboard' | 'browser';

// User Management
export interface User {
  id: string;
  email: string;
  tier: UserTier;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
  subscription?: Subscription;
}

export interface UserPreferences {
  notifications: boolean;
  autoAnalysis: boolean;
  privacyMode: boolean;
  preferredAI: 'openai' | 'gemini' | 'auto';
  language: string;
  timezone: string;
}

export interface Subscription {
  id: string;
  tier: UserTier;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
}

// Analysis Types
export interface AnalysisRequest {
  type: AnalysisType;
  data: any;
  userTier: UserTier;
  userId: string;
  platform?: DatingPlatform;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface AnalysisResponse {
  success: boolean;
  analysis?: AnalysisResult;
  error?: string;
  tierLimitations?: TierLimitations;
  upgradePrompt?: string;
  processingTime?: number;
}

export interface AnalysisResult {
  compatibility?: number | string;
  insights: string[];
  suggestions: string[];
  redFlags: string[];
  conversationStarters: string[];
  personalityProfile?: PersonalityProfile;
  relationshipPotential?: RelationshipPotential;
  confidence: number;
  analysisType: 'basic' | 'comprehensive' | 'complete_reconstruction';
}

export interface PersonalityProfile {
  traits: PersonalityTrait[];
  communicationStyle: string;
  interests: string[];
  values: string[];
  lifestyle: string;
  relationshipGoals: string;
}

export interface PersonalityTrait {
  name: string;
  score: number;
  description: string;
}

export interface RelationshipPotential {
  shortTerm: number;
  longTerm: number;
  compatibility: number;
  challenges: string[];
  strengths: string[];
  advice: string;
}

// Tier Management
export interface TierLimitations {
  maxSuggestions: number;
  maxInsights: number;
  advancedFeatures: boolean;
  realTimeAnalysis: boolean;
  crossPlatformSync: boolean;
  voiceAnalysis: boolean;
  personalityProfiling: boolean;
  unlimitedScreenshots: boolean;
}

export interface UsageTracking {
  userId: string;
  date: string;
  photoAnalyses: number;
  conversationAnalyses: number;
  voiceAnalyses: number;
  screenshotAnalyses: number;
  keyboardSuggestions: number;
  browserCoaching: number;
}

// Screenshot Analysis
export interface Screenshot {
  id: string;
  data: string; // base64 encoded
  timestamp: number;
  platform: DatingPlatform;
  type: 'profile' | 'conversation' | 'match' | 'settings';
  metadata?: ScreenshotMetadata;
}

export interface ScreenshotMetadata {
  deviceType: 'mobile' | 'desktop';
  resolution: {
    width: number;
    height: number;
  };
  captureMethod: 'floating_button' | 'browser_extension' | 'manual';
  processingTime?: number;
}

export interface ScreenshotAnalysisResult extends AnalysisResult {
  screenshots: Screenshot[];
  extractedText?: string;
  detectedElements?: DetectedElement[];
  profileData?: ProfileData;
}

export interface DetectedElement {
  type: 'photo' | 'text' | 'button' | 'icon';
  content: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Profile Data
export interface ProfileData {
  name?: string;
  age?: number;
  bio?: string;
  photos: ProfilePhoto[];
  interests?: string[];
  education?: string;
  occupation?: string;
  location?: string;
  distance?: number;
  verified?: boolean;
}

export interface ProfilePhoto {
  url: string;
  order: number;
  analysis?: PhotoAnalysis;
}

export interface PhotoAnalysis {
  attractiveness: number;
  quality: number;
  lighting: number;
  composition: number;
  authenticity: number;
  suggestions: string[];
}

// Conversation Analysis
export interface Conversation {
  id: string;
  platform: DatingPlatform;
  messages: Message[];
  matchId?: string;
  startedAt: string;
  lastMessageAt: string;
  status: 'active' | 'archived' | 'blocked';
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  isUser: boolean;
  type: 'text' | 'image' | 'gif' | 'emoji';
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  readAt?: string;
  deliveredAt?: string;
  reactions?: string[];
  replyTo?: string;
}

export interface ConversationAnalysis extends AnalysisResult {
  engagement: number;
  sentiment: number;
  momentum: 'increasing' | 'decreasing' | 'stable';
  conversationStage: ConversationStage;
  nextSteps: string[];
  riskFactors: string[];
}

export type ConversationStage = 
  | 'opening' 
  | 'getting_to_know' 
  | 'building_rapport' 
  | 'planning_date' 
  | 'maintaining_interest' 
  | 'relationship_building';

// AI Keyboard
export interface KeyboardSuggestion {
  text: string;
  confidence: number;
  type: 'opener' | 'response' | 'question' | 'compliment' | 'humor';
  reasoning?: string;
  tier: UserTier;
}

export interface KeyboardContext {
  currentText: string;
  conversationHistory: Message[];
  platform: DatingPlatform;
  conversationStage: ConversationStage;
  matchProfile?: ProfileData;
}

// Browser Extension
export interface BrowserExtensionState {
  isActive: boolean;
  currentPlatform: DatingPlatform;
  userTier: UserTier;
  isAuthenticated: boolean;
  overlayVisible: boolean;
  analysisInProgress: boolean;
}

export interface CoachingOverlay {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size: 'small' | 'medium' | 'large';
  opacity: number;
  draggable: boolean;
  minimizable: boolean;
  content: OverlayContent;
}

export interface OverlayContent {
  type: 'suggestions' | 'analysis' | 'loading' | 'error' | 'upgrade';
  data: any;
  timestamp: number;
}

// Floating Button
export interface FloatingButtonConfig {
  position: {
    x: number;
    y: number;
  };
  size: number;
  opacity: number;
  autoHide: boolean;
  hideDelay: number;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
}

export interface FloatingButtonState {
  visible: boolean;
  dragging: boolean;
  analyzing: boolean;
  lastUsed: number;
  usageCount: number;
}

// Performance Monitoring
export interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime: number | null;
  duration: number | null;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceBenchmark {
  operation: string;
  targetDuration: number;
  maxDuration: number;
  successRate: number;
  measurements: number[];
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number;
  };
}

// Analytics
export interface AnalyticsEvent {
  type: string;
  category: 'user' | 'system' | 'business' | 'error' | 'performance';
  timestamp: number;
  sessionId: string;
  userId?: string;
  platform: DatingPlatform;
  userTier: UserTier;
  data: Record<string, any>;
}

export interface UserBehaviorMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  featureUsage: Record<string, number>;
  conversionRates: Record<string, number>;
  churnRate: number;
  retentionRate: number;
}

// API Responses
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    timestamp: number;
    requestId: string;
    processingTime: number;
    rateLimit?: RateLimit;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  resetAt: number;
}

// Cross-Platform Sync
export interface SyncData {
  userId: string;
  lastSyncAt: string;
  version: number;
  data: {
    preferences: UserPreferences;
    analysisHistory: AnalysisResult[];
    conversations: Conversation[];
    profiles: ProfileData[];
    usage: UsageTracking;
  };
  conflicts?: SyncConflict[];
}

export interface SyncConflict {
  field: string;
  localValue: any;
  remoteValue: any;
  timestamp: string;
  resolution?: 'local' | 'remote' | 'merge';
}

// Error Types
export class AICoachError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AICoachError';
  }
}

export class TierLimitError extends AICoachError {
  constructor(
    feature: string,
    currentTier: UserTier,
    requiredTier: UserTier
  ) {
    super(
      `Feature '${feature}' requires ${requiredTier} tier. Current tier: ${currentTier}`,
      'TIER_LIMIT_EXCEEDED',
      false,
      { feature, currentTier, requiredTier }
    );
  }
}

export class AnalysisError extends AICoachError {
  constructor(
    message: string,
    public analysisType: AnalysisType,
    retryable: boolean = true
  ) {
    super(message, 'ANALYSIS_FAILED', retryable, { analysisType });
  }
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Configuration Types
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  ai: {
    openai: {
      apiKey: string;
      model: string;
      maxTokens: number;
    };
    gemini: {
      apiKey: string;
      model: string;
      maxTokens: number;
    };
    fallbackEnabled: boolean;
  };
  features: {
    floatingButton: boolean;
    aiKeyboard: boolean;
    browserExtension: boolean;
    voiceAnalysis: boolean;
    crossPlatformSync: boolean;
  };
  performance: {
    maxResponseTime: number;
    maxMemoryUsage: number;
    confidenceInterval: number;
  };
  privacy: {
    encryptionEnabled: boolean;
    dataRetentionDays: number;
    anonymizeAnalytics: boolean;
  };
}

export default {};

