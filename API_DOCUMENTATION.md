# AI Dating Coach - API Documentation

## 🚀 Overview

The AI Dating Coach API provides comprehensive endpoints for profile analysis, conversation coaching, tier management, and cross-platform synchronization. This RESTful API is built with security, performance, and scalability in mind.

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Base URLs](#base-urls)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [Authentication Endpoints](#authentication-endpoints)
6. [Profile Analysis](#profile-analysis)
7. [Conversation Coaching](#conversation-coaching)
8. [Tier Management](#tier-management)
9. [Cross-Platform Sync](#cross-platform-sync)
10. [Privacy & Security](#privacy--security)
11. [Webhooks](#webhooks)
12. [SDKs](#sdks)

## 🔐 Authentication

All API requests require authentication using JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Structure
```json
{
  "userId": "user-123",
  "sessionId": "session-456",
  "email": "user@example.com",
  "tier": "premium",
  "permissions": ["user", "analytics"],
  "iat": 1640995200,
  "exp": 1641081600
}
```

## 🌐 Base URLs

- **Production**: `https://api.aidatingcoach.com`
- **Staging**: `https://staging-api.aidatingcoach.com`
- **Development**: `http://localhost:3000`

## ⚡ Rate Limiting

API requests are rate-limited to ensure fair usage:

- **Free Tier**: 100 requests per 15 minutes
- **Premium Tier**: 500 requests per 15 minutes
- **Pro Tier**: 1000 requests per 15 minutes

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## ❌ Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  },
  "timestamp": 1640995200000
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## 🔑 Authentication Endpoints

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "deviceId": "device-123",
  "platform": "web"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "tier": "premium",
      "permissions": ["user", "analytics"]
    },
    "sessionId": "session-456"
  },
  "timestamp": 1640995200000
}
```

### Logout
```http
POST /auth/logout
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "timestamp": 1640995200000
}
```

### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "sessionId": "session-456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token",
    "expiresIn": 86400
  },
  "timestamp": 1640995200000
}
```

## 📊 Profile Analysis

### Analyze Profile
```http
POST /api/analysis/profile
```

**Request Body:**
```json
{
  "platform": "tinder",
  "profileData": {
    "photos": [
      {
        "url": "https://example.com/photo1.jpg",
        "isPrimary": true
      }
    ],
    "bio": "Love hiking and coffee",
    "age": 28,
    "interests": ["hiking", "coffee", "travel"]
  },
  "analysisType": "comprehensive"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis-123",
    "score": 85,
    "breakdown": {
      "photos": {
        "score": 90,
        "feedback": "Great variety and quality"
      },
      "bio": {
        "score": 80,
        "feedback": "Could be more specific about interests"
      },
      "overall": {
        "score": 85,
        "feedback": "Strong profile with room for improvement"
      }
    },
    "suggestions": [
      {
        "type": "photo",
        "priority": "high",
        "text": "Add a group photo to show social side",
        "category": "variety"
      },
      {
        "type": "bio",
        "priority": "medium",
        "text": "Mention specific hiking trails you enjoy",
        "category": "specificity"
      }
    ],
    "metrics": {
      "attractivenessScore": 88,
      "approachabilityScore": 82,
      "authenticityScore": 90
    },
    "timestamp": 1640995200000
  },
  "timestamp": 1640995200000
}
```

### Get Analysis History
```http
GET /api/analysis/history?limit=10&offset=0&platform=tinder
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analyses": [
      {
        "id": "analysis-123",
        "platform": "tinder",
        "score": 85,
        "createdAt": "2024-01-01T12:00:00Z",
        "summary": "Strong profile with room for improvement"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  },
  "timestamp": 1640995200000
}
```

### Screenshot Analysis
```http
POST /api/analysis/screenshot
```

**Request Body:**
```json
{
  "image": "base64-encoded-image-data",
  "platform": "tinder",
  "context": "profile_view",
  "options": {
    "includeOCR": true,
    "detectFaces": true,
    "analyzeLayout": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "screenshot-123",
    "detectedElements": [
      {
        "type": "profile_photo",
        "confidence": 0.95,
        "boundingBox": {
          "x": 100,
          "y": 150,
          "width": 200,
          "height": 250
        }
      },
      {
        "type": "bio_text",
        "confidence": 0.88,
        "text": "Love hiking and coffee",
        "boundingBox": {
          "x": 50,
          "y": 420,
          "width": 300,
          "height": 80
        }
      }
    ],
    "suggestions": [
      {
        "type": "swipe_decision",
        "recommendation": "right",
        "confidence": 0.82,
        "reasoning": "High compatibility based on shared interests"
      }
    ],
    "compatibility": {
      "score": 82,
      "factors": [
        "shared_interests",
        "age_compatibility",
        "lifestyle_match"
      ]
    },
    "timestamp": 1640995200000
  },
  "timestamp": 1640995200000
}
```

## 💬 Conversation Coaching

### Get Conversation Suggestions
```http
POST /api/coaching/suggestions
```

**Request Body:**
```json
{
  "conversationContext": {
    "platform": "tinder",
    "matchInfo": {
      "name": "Sarah",
      "age": 26,
      "bio": "Yoga instructor who loves travel",
      "photos": ["photo1.jpg", "photo2.jpg"]
    },
    "conversationHistory": [
      {
        "sender": "user",
        "message": "Hey! I noticed you're into yoga",
        "timestamp": "2024-01-01T10:00:00Z"
      },
      {
        "sender": "match",
        "message": "Yes! I teach at a studio downtown",
        "timestamp": "2024-01-01T10:05:00Z"
      }
    ]
  },
  "suggestionType": "response",
  "tone": "casual",
  "options": {
    "includeQuestions": true,
    "maxSuggestions": 3,
    "personalityType": "friendly"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "suggestion-1",
        "text": "That's awesome! I've been wanting to try yoga. Any beginner-friendly classes you'd recommend?",
        "type": "question",
        "tone": "curious",
        "confidence": 0.92,
        "reasoning": "Shows interest and opens conversation"
      },
      {
        "id": "suggestion-2",
        "text": "Downtown has such great energy! I love that area. What's your favorite spot there?",
        "type": "follow_up",
        "tone": "enthusiastic",
        "confidence": 0.88,
        "reasoning": "Builds on location connection"
      },
      {
        "id": "suggestion-3",
        "text": "Teaching yoga must be so rewarding! How long have you been practicing?",
        "type": "personal_interest",
        "tone": "supportive",
        "confidence": 0.85,
        "reasoning": "Shows genuine interest in her passion"
      }
    ],
    "conversationAnalysis": {
      "sentiment": "positive",
      "engagement": "high",
      "compatibility": 0.87,
      "nextSteps": [
        "ask_about_interests",
        "suggest_meetup",
        "share_personal_story"
      ]
    },
    "timestamp": 1640995200000
  },
  "timestamp": 1640995200000
}
```

### Analyze Conversation
```http
POST /api/coaching/analyze
```

**Request Body:**
```json
{
  "conversationHistory": [
    {
      "sender": "user",
      "message": "Hey! How's your day going?",
      "timestamp": "2024-01-01T10:00:00Z"
    },
    {
      "sender": "match",
      "message": "Pretty good! Just finished a yoga class",
      "timestamp": "2024-01-01T10:05:00Z"
    }
  ],
  "analysisType": "comprehensive"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "conv-analysis-123",
    "overallScore": 78,
    "metrics": {
      "engagement": 0.85,
      "sentiment": 0.92,
      "reciprocity": 0.75,
      "depth": 0.60
    },
    "insights": [
      {
        "type": "positive",
        "message": "Good opening with casual, friendly tone"
      },
      {
        "type": "suggestion",
        "message": "Consider asking follow-up questions about yoga"
      }
    ],
    "recommendations": [
      "Ask more open-ended questions",
      "Share something personal to build connection",
      "Reference something from their profile"
    ],
    "riskFactors": [],
    "timestamp": 1640995200000
  },
  "timestamp": 1640995200000
}
```

## 🎯 Tier Management

### Get Current Tier
```http
GET /api/tier/current
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tier": "premium",
    "limits": {
      "profileAnalysis": {
        "limit": 50,
        "used": 12,
        "remaining": 38,
        "resetDate": "2024-02-01T00:00:00Z"
      },
      "conversationCoaching": {
        "limit": 30,
        "used": 8,
        "remaining": 22,
        "resetDate": "2024-02-01T00:00:00Z"
      },
      "realTimeSuggestions": {
        "limit": -1,
        "used": 156,
        "remaining": -1,
        "resetDate": null
      }
    },
    "features": [
      "profile_analysis",
      "conversation_coaching",
      "real_time_suggestions",
      "advanced_analytics",
      "priority_support"
    ],
    "billingCycle": "monthly",
    "nextBillingDate": "2024-02-01T00:00:00Z"
  },
  "timestamp": 1640995200000
}
```

### Track Feature Usage
```http
POST /api/tier/usage
```

**Request Body:**
```json
{
  "feature": "profileAnalysis",
  "metadata": {
    "platform": "tinder",
    "analysisType": "comprehensive",
    "duration": 2500
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "remainingUsage": 37,
    "limitExceeded": false,
    "resetDate": "2024-02-01T00:00:00Z",
    "usageHistory": {
      "today": 3,
      "thisWeek": 15,
      "thisMonth": 13
    }
  },
  "timestamp": 1640995200000
}
```

### Initiate Upgrade
```http
POST /api/tier/upgrade
```

**Request Body:**
```json
{
  "targetTier": "pro",
  "billingCycle": "monthly",
  "paymentMethod": "stripe",
  "successUrl": "https://app.aidatingcoach.com/upgrade/success",
  "cancelUrl": "https://app.aidatingcoach.com/upgrade/cancel"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "upgradeUrl": "https://checkout.stripe.com/pay/cs_test_...",
    "sessionId": "cs_test_1234567890",
    "expiresAt": "2024-01-01T13:00:00Z"
  },
  "timestamp": 1640995200000
}
```

## 🔄 Cross-Platform Sync

### Sync Data
```http
POST /api/sync
```

**Request Body:**
```json
{
  "operation": "sync",
  "lastSyncTimestamp": 1640995200000,
  "deviceId": "device-123",
  "platform": "mobile",
  "changes": [
    {
      "id": "change-1",
      "dataType": "user_preferences",
      "dataId": "pref-123",
      "operation": "update",
      "data": {
        "theme": "dark",
        "notifications": true
      },
      "timestamp": 1640995300000,
      "version": 2
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "changes": {
      "user_preferences": {
        "changes": [
          {
            "dataId": "pref-456",
            "data": {
              "language": "en",
              "timezone": "UTC"
            },
            "timestamp": 1640995400000,
            "version": 3
          }
        ]
      }
    },
    "conflicts": [
      {
        "id": "conflict-123",
        "dataType": "user_preferences",
        "dataId": "pref-789",
        "versions": [
          {
            "version": 2,
            "data": {"theme": "light"},
            "timestamp": 1640995200000,
            "platform": "web"
          },
          {
            "version": 2,
            "data": {"theme": "dark"},
            "timestamp": 1640995250000,
            "platform": "mobile"
          }
        ],
        "suggestedStrategy": "latest_wins"
      }
    ],
    "lastSyncTimestamp": 1640995500000,
    "hasMore": false
  },
  "timestamp": 1640995500000
}
```

### Resolve Conflict
```http
POST /api/sync/resolve-conflict
```

**Request Body:**
```json
{
  "conflictId": "conflict-123",
  "strategy": "manual",
  "resolvedData": {
    "theme": "dark",
    "autoSync": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resolved": true,
    "newVersion": 4,
    "timestamp": 1640995600000
  },
  "timestamp": 1640995600000
}
```

### Get Sync Status
```http
GET /api/sync/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lastSyncTimestamp": 1640995500000,
    "pendingChanges": 3,
    "conflictsCount": 1,
    "syncInProgress": false,
    "devices": [
      {
        "deviceId": "device-123",
        "platform": "mobile",
        "lastSeen": 1640995400000,
        "syncStatus": "up_to_date"
      },
      {
        "deviceId": "device-456",
        "platform": "web",
        "lastSeen": 1640995300000,
        "syncStatus": "pending"
      }
    ]
  },
  "timestamp": 1640995600000
}
```

## 🔒 Privacy & Security

### Get Privacy Settings
```http
GET /api/privacy/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dataCollection": true,
    "profileVisibility": "private",
    "conversationAnalysis": true,
    "marketingEmails": false,
    "analyticsTracking": true,
    "dataRetentionDays": 365,
    "shareWithPartners": false,
    "locationTracking": false,
    "personalizedAds": false,
    "thirdPartyIntegrations": false,
    "updatedAt": "2024-01-01T12:00:00Z"
  },
  "timestamp": 1640995600000
}
```

### Update Privacy Settings
```http
PUT /api/privacy/settings
```

**Request Body:**
```json
{
  "conversationAnalysis": false,
  "marketingEmails": true,
  "dataRetentionDays": 180
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": true,
    "changedFields": [
      "conversationAnalysis",
      "marketingEmails", 
      "dataRetentionDays"
    ]
  },
  "timestamp": 1640995700000
}
```

### Request Data Export
```http
POST /api/privacy/export
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "export-123",
    "status": "pending",
    "estimatedCompletion": "2024-01-02T12:00:00Z",
    "verificationRequired": true
  },
  "timestamp": 1640995700000
}
```

### Request Data Deletion
```http
POST /api/privacy/delete
```

**Request Body:**
```json
{
  "reason": "No longer using the service",
  "confirmEmail": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "delete-123",
    "status": "pending",
    "verificationRequired": true,
    "deletionDate": "2024-01-08T12:00:00Z"
  },
  "timestamp": 1640995700000
}
```

## 🔗 Webhooks

### Configure Webhook
```http
POST /api/webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks/ai-dating-coach",
  "events": [
    "analysis.completed",
    "tier.upgraded",
    "sync.conflict"
  ],
  "secret": "your-webhook-secret"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "webhookId": "webhook-123",
    "url": "https://your-app.com/webhooks/ai-dating-coach",
    "events": [
      "analysis.completed",
      "tier.upgraded", 
      "sync.conflict"
    ],
    "secret": "your-webhook-secret",
    "createdAt": "2024-01-01T12:00:00Z"
  },
  "timestamp": 1640995700000
}
```

### Webhook Events

#### Analysis Completed
```json
{
  "event": "analysis.completed",
  "data": {
    "analysisId": "analysis-123",
    "userId": "user-123",
    "platform": "tinder",
    "score": 85,
    "type": "profile"
  },
  "timestamp": 1640995700000
}
```

#### Tier Upgraded
```json
{
  "event": "tier.upgraded",
  "data": {
    "userId": "user-123",
    "fromTier": "free",
    "toTier": "premium",
    "billingCycle": "monthly"
  },
  "timestamp": 1640995700000
}
```

#### Sync Conflict
```json
{
  "event": "sync.conflict",
  "data": {
    "conflictId": "conflict-123",
    "userId": "user-123",
    "dataType": "user_preferences",
    "severity": "low"
  },
  "timestamp": 1640995700000
}
```

## 📚 SDKs

### JavaScript/TypeScript SDK

```bash
npm install @ai-dating-coach/sdk
```

```typescript
import { AIDatingCoachSDK } from '@ai-dating-coach/sdk'

const client = new AIDatingCoachSDK({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.aidatingcoach.com'
})

// Analyze profile
const analysis = await client.analysis.analyzeProfile({
  platform: 'tinder',
  profileData: {
    photos: [{ url: 'photo.jpg', isPrimary: true }],
    bio: 'Love hiking and coffee'
  }
})

// Get conversation suggestions
const suggestions = await client.coaching.getSuggestions({
  conversationContext: {
    platform: 'tinder',
    matchInfo: { name: 'Sarah', age: 26 }
  }
})
```

### Python SDK

```bash
pip install ai-dating-coach-sdk
```

```python
from ai_dating_coach import AIDatingCoachClient

client = AIDatingCoachClient(
    api_key='your-api-key',
    base_url='https://api.aidatingcoach.com'
)

# Analyze profile
analysis = client.analysis.analyze_profile(
    platform='tinder',
    profile_data={
        'photos': [{'url': 'photo.jpg', 'is_primary': True}],
        'bio': 'Love hiking and coffee'
    }
)

# Get tier information
tier_info = client.tier.get_current()
```

### React Native SDK

```bash
npm install @ai-dating-coach/react-native-sdk
```

```typescript
import { AIDatingCoachProvider, useAIDatingCoach } from '@ai-dating-coach/react-native-sdk'

// Provider setup
<AIDatingCoachProvider apiKey="your-api-key">
  <App />
</AIDatingCoachProvider>

// Usage in component
const { analyzeProfile, getSuggestions } = useAIDatingCoach()

const handleAnalyze = async () => {
  const result = await analyzeProfile({
    platform: 'tinder',
    profileData: profileData
  })
}
```

## 📊 Response Examples

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": 1640995700000
}
```

### Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  },
  "timestamp": 1640995700000
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [
      // Array of items
    ],
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 0,
      "hasMore": true,
      "nextOffset": 20
    }
  },
  "timestamp": 1640995700000
}
```

## 🔧 Testing

### Postman Collection
Download our Postman collection: [AI Dating Coach API.postman_collection.json](./postman/AI_Dating_Coach_API.postman_collection.json)

### cURL Examples

```bash
# Login
curl -X POST https://api.aidatingcoach.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "deviceId": "device-123",
    "platform": "web"
  }'

# Analyze profile
curl -X POST https://api.aidatingcoach.com/api/analysis/profile \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "tinder",
    "profileData": {
      "photos": [{"url": "photo.jpg", "isPrimary": true}],
      "bio": "Love hiking and coffee"
    }
  }'
```

## 📞 Support

- **API Documentation**: [https://docs.aidatingcoach.com](https://docs.aidatingcoach.com)
- **Developer Support**: dev-support@aidatingcoach.com
- **Status Page**: [https://status.aidatingcoach.com](https://status.aidatingcoach.com)
- **GitHub Issues**: [https://github.com/kimhons/ai-dating-coach/issues](https://github.com/kimhons/ai-dating-coach/issues)

---

*Last Updated: $(date)*
*API Version: v1.0.0*

