# AI Dating Coach - Comprehensive Deployment Guide

## 🚀 Production Deployment Overview

This guide provides step-by-step instructions for deploying the AI Dating Coach platform to production environments. The platform consists of multiple components that work together to provide a seamless cross-platform experience.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Backend Deployment](#backend-deployment)
5. [Web Application Deployment](#web-application-deployment)
6. [Mobile App Deployment](#mobile-app-deployment)
7. [Browser Extension Deployment](#browser-extension-deployment)
8. [Security Configuration](#security-configuration)
9. [Monitoring & Analytics](#monitoring--analytics)
10. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Accounts & Services
- **Supabase Account** (Database & Authentication)
- **Vercel Account** (Web hosting)
- **Apple Developer Account** (iOS deployment)
- **Google Play Console** (Android deployment)
- **Chrome Web Store Developer Account** (Browser extension)
- **OpenAI API Account** (AI services)
- **Domain & SSL Certificate** (Custom domain)

### Development Tools
- Node.js 18+ and npm/yarn
- React Native CLI
- Xcode (for iOS builds)
- Android Studio (for Android builds)
- Git and GitHub access

### System Requirements
- **Production Server**: 2+ CPU cores, 4GB+ RAM, 50GB+ storage
- **Development Machine**: 8GB+ RAM, 100GB+ free space
- **Network**: Stable internet connection with HTTPS support

## 🌍 Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/kimhons/ai-dating-coach.git
cd ai-dating-coach
```

### 2. Environment Variables

Create environment files for each component:

#### Backend (.env)
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_API_BASE=https://api.openai.com/v1

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-256-bits
ENCRYPTION_KEY=your-encryption-key-256-bits
BCRYPT_ROUNDS=12

# CORS Configuration
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Environment
NODE_ENV=production
PORT=3000
```

#### Web Application (.env.production)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

#### Mobile App (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
API_BASE_URL=https://api.yourdomain.com
APP_VERSION=1.0.0
ENVIRONMENT=production
```

### 3. Install Dependencies

```bash
# Root dependencies
npm install

# Web application
cd web && npm install && cd ..

# Mobile application
cd mobile && npm install && cd ..

# Backend functions
cd backend && npm install && cd ..
```

## 🗄️ Database Configuration

### 1. Supabase Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note down URL and API keys

2. **Run Database Migrations**
   ```bash
   # Install Supabase CLI
   npm install -g @supabase/cli

   # Login to Supabase
   supabase login

   # Link to your project
   supabase link --project-ref your-project-ref

   # Run migrations
   supabase db push
   ```

3. **Execute Schema Files**
   ```sql
   -- Run these files in Supabase SQL Editor:
   -- 1. backend/database/schema.sql
   -- 2. backend/database/sync-schema.sql
   -- 3. backend/database/security-schema.sql
   ```

### 2. Row Level Security (RLS)

Enable RLS policies for all tables:

```sql
-- Enable RLS on all user tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (see backend/database/rls-policies.sql)
```

### 3. Storage Configuration

Set up Supabase Storage buckets:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('profile-images', 'profile-images', false),
('data-exports', 'data-exports', false),
('analysis-cache', 'analysis-cache', false);

-- Set up storage policies
CREATE POLICY "Users can upload their own profile images" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
```

## 🔧 Backend Deployment

### 1. Supabase Edge Functions

Deploy backend functions to Supabase Edge Functions:

```bash
# Deploy all functions
supabase functions deploy unified-analysis-v2
supabase functions deploy tier-management
supabase functions deploy cross-platform-sync
supabase functions deploy photo-analysis-enhanced
supabase functions deploy conversation-analysis-enhanced

# Set environment variables for functions
supabase secrets set OPENAI_API_KEY=your-openai-api-key
supabase secrets set JWT_SECRET=your-jwt-secret
supabase secrets set ENCRYPTION_KEY=your-encryption-key
```

### 2. Function Configuration

Each function needs proper CORS and authentication:

```typescript
// Add to each function's index.ts
import { corsHeaders } from '../_shared/cors.ts'

// Handle CORS preflight
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })
}

// Add CORS headers to all responses
return new Response(JSON.stringify(responseData), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})
```

### 3. API Gateway Setup

Configure API routes and rate limiting:

```typescript
// backend/api/routes.ts
import { SecurityManager } from '../security/SecurityManager'

const security = new SecurityManager(securityConfig)

// Apply security middleware
app.use(security.authenticateToken)
app.use(security.authorize(['user']))
```

## 🌐 Web Application Deployment

### 1. Build for Production

```bash
cd web

# Install dependencies
npm install

# Build for production
npm run build

# Test build locally
npm run preview
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_API_BASE_URL production
```

### 3. Custom Domain Setup

1. **Add Domain in Vercel**
   - Go to Vercel dashboard
   - Add custom domain
   - Configure DNS records

2. **SSL Certificate**
   - Vercel automatically provisions SSL
   - Verify HTTPS is working

3. **CDN Configuration**
   ```json
   // vercel.json
   {
     "headers": [
       {
         "source": "/static/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       }
     ]
   }
   ```

## 📱 Mobile App Deployment

### 1. iOS Deployment

#### Prerequisites
- Apple Developer Account ($99/year)
- Xcode 14+
- iOS Distribution Certificate
- App Store Connect access

#### Build Process
```bash
cd mobile

# Install iOS dependencies
cd ios && pod install && cd ..

# Build for release
npx react-native run-ios --configuration Release

# Or use Xcode
open ios/AIDatingCoachMobile.xcworkspace
```

#### App Store Submission
1. **Configure App Store Connect**
   - Create app record
   - Set app information
   - Upload screenshots
   - Set pricing and availability

2. **Build and Upload**
   ```bash
   # Archive in Xcode
   Product > Archive

   # Upload to App Store Connect
   Window > Organizer > Distribute App
   ```

3. **App Review Preparation**
   - Test on physical devices
   - Prepare app review information
   - Submit for review

### 2. Android Deployment

#### Prerequisites
- Google Play Console account ($25 one-time)
- Android Studio
- Signing key for release builds

#### Build Process
```bash
cd mobile

# Generate release APK
cd android
./gradlew assembleRelease

# Generate AAB (recommended)
./gradlew bundleRelease
```

#### Play Store Submission
1. **Create Release**
   - Upload AAB file
   - Set release notes
   - Configure rollout percentage

2. **Store Listing**
   - Add app description
   - Upload screenshots
   - Set content rating

3. **Review and Publish**
   - Submit for review
   - Monitor rollout

## 🔌 Browser Extension Deployment

### 1. Chrome Web Store

#### Package Extension
```bash
cd browser-extension

# Build for production
npm run build

# Create ZIP package
zip -r ai-dating-coach-extension.zip dist/
```

#### Store Submission
1. **Developer Dashboard**
   - Go to Chrome Web Store Developer Dashboard
   - Create new item
   - Upload ZIP file

2. **Store Listing**
   - Add description and screenshots
   - Set privacy policy URL
   - Configure permissions

3. **Review Process**
   - Submit for review
   - Address any feedback
   - Publish when approved

### 2. Firefox Add-ons

#### Package for Firefox
```bash
# Modify manifest for Firefox
cp manifest-firefox.json dist/manifest.json

# Create XPI package
zip -r ai-dating-coach-firefox.xpi dist/
```

#### Mozilla Add-ons Submission
1. **Upload to AMO**
   - Go to addons.mozilla.org
   - Submit new add-on
   - Upload XPI file

2. **Review Process**
   - Automated review
   - Manual review if needed
   - Publish when approved

## 🔒 Security Configuration

### 1. SSL/TLS Setup

```nginx
# Nginx configuration
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. Security Headers

```typescript
// Security middleware configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com", "https://*.supabase.co"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))
```

### 3. API Security

```typescript
// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later'
  }
})

app.use('/api/', limiter)
```

## 📊 Monitoring & Analytics

### 1. Application Monitoring

#### Supabase Analytics
- Monitor database performance
- Track API usage
- Set up alerts for errors

#### Custom Analytics
```typescript
// Analytics service
class AnalyticsService {
  track(event: string, properties: any) {
    // Send to analytics service
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({ event, properties })
    })
  }
}
```

### 2. Error Monitoring

#### Sentry Integration
```bash
npm install @sentry/react @sentry/react-native

# Configure Sentry
```

```typescript
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: 'production'
})
```

### 3. Performance Monitoring

#### Web Vitals
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)
```

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors
```typescript
// Ensure CORS is properly configured
app.use(cors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
  credentials: true
}))
```

#### 2. Authentication Issues
```typescript
// Verify JWT configuration
const token = jwt.verify(authToken, process.env.JWT_SECRET)
```

#### 3. Database Connection Issues
```typescript
// Check Supabase connection
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .limit(1)

if (error) {
  console.error('Database connection error:', error)
}
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_tier_usage_user_id_feature ON tier_usage(user_id, feature);
```

#### 2. Caching Strategy
```typescript
// Implement Redis caching
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Cache frequently accessed data
await redis.setex(`user:${userId}`, 3600, JSON.stringify(userData))
```

#### 3. CDN Configuration
```json
// Vercel configuration
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 🚀 Go-Live Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Monitoring tools setup
- [ ] Backup procedures tested
- [ ] Load testing completed

### Launch Day
- [ ] Deploy all components
- [ ] Verify all services are running
- [ ] Test critical user flows
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify analytics tracking

### Post-Launch
- [ ] Monitor system health
- [ ] Review error logs
- [ ] Check user feedback
- [ ] Plan first update cycle
- [ ] Document lessons learned

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- **Daily**: Monitor error rates and performance
- **Weekly**: Review security logs and user feedback
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Performance optimization and feature updates

### Emergency Procedures
1. **Service Outage**: Check status page, rollback if needed
2. **Security Incident**: Isolate affected systems, investigate
3. **Data Issues**: Restore from backup, investigate cause

### Contact Information
- **Technical Support**: tech@yourdomain.com
- **Security Issues**: security@yourdomain.com
- **General Inquiries**: support@yourdomain.com

---

## 📝 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Security Guide](./SECURITY_GUIDE.md)
- [Privacy Policy](./PRIVACY_POLICY.md)
- [Terms of Service](./TERMS_OF_SERVICE.md)
- [User Guide](./USER_GUIDE.md)

---

*Last Updated: $(date)*
*Version: 1.0.0*

