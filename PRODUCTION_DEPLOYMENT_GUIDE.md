# 🚀 AI Dating Coach - Production Deployment Guide

## 📋 Overview

This guide provides step-by-step instructions for deploying the AI Dating Coach application to production across all platforms: Web (Vercel), iOS (App Store), Android (Google Play), and Backend (Supabase).

**Prerequisites**: All development and testing phases completed ✅

---

## 🌐 Web Dashboard Deployment (Vercel)

### Step 1: Prepare Environment Variables

1. **Create Vercel Project**
   ```bash
   npm i -g vercel
   vercel login
   cd web
   vercel
   ```

2. **Configure Environment Variables in Vercel Dashboard**
   - Go to Project Settings → Environment Variables
   - Add the following variables:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
   VITE_APP_URL=https://your-domain.com
   VITE_APP_NAME=AI Dating Coach
   VITE_ENABLE_ANALYTICS=true
   VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
   VITE_SENTRY_DSN=your_sentry_dsn
   ```

### Step 2: Deploy to Production

```bash
cd web
npm run build        # Test build locally
vercel --prod        # Deploy to production
```

### Step 3: Configure Custom Domain

1. In Vercel Dashboard → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Enable SSL (automatic)

### Step 4: Verify Deployment

- [ ] Website loads correctly
- [ ] All pages accessible
- [ ] API connections working
- [ ] Authentication functional
- [ ] Payment processing active

---

## 📱 iOS App Store Deployment

### Step 1: Prepare Xcode Project

```bash
cd mobile/ios
open AIDatingCoachMobile.xcworkspace
```

### Step 2: Configure App Store Connect

1. **Create App Store Connect Record**
   - App Name: AI Dating Coach
   - Bundle ID: com.aidatingcoach.mobile
   - SKU: aidatingcoach-ios-v1
   - Primary Language: English

2. **Upload App Metadata**
   - App Description (4000 chars max)
   - Keywords
   - Screenshots (all device sizes)
   - App Icon (1024x1024)
   - Privacy Policy URL
   - Support URL

### Step 3: Build and Archive

1. **Set Release Configuration**
   - Product → Scheme → Edit Scheme
   - Set Build Configuration to "Release"

2. **Archive the App**
   - Product → Archive
   - Wait for build completion

3. **Upload to App Store Connect**
   - Window → Organizer
   - Select archive → Distribute App
   - Choose "App Store Connect"
   - Upload

### Step 4: Submit for Review

1. **Complete App Store Connect Information**
   - App Information
   - Pricing and Availability
   - App Privacy
   - App Review Information

2. **Submit for Review**
   - Review all sections
   - Submit for App Store Review
   - Typical review time: 24-48 hours

### Step 5: Release Management

- [ ] Monitor review status
- [ ] Respond to review feedback if needed
- [ ] Release to App Store when approved
- [ ] Monitor crash reports and user feedback

---

## 🤖 Android Google Play Deployment

### Step 1: Prepare Release Build

```bash
cd mobile/android
./gradlew assembleRelease
```

### Step 2: Sign the APK

1. **Generate Upload Key** (if not done)
   ```bash
   keytool -genkey -v -keystore upload-key.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Signing in gradle.properties**
   ```properties
   MYAPP_UPLOAD_STORE_FILE=upload-key.keystore
   MYAPP_UPLOAD_KEY_ALIAS=upload
   MYAPP_UPLOAD_STORE_PASSWORD=your_store_password
   MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
   ```

3. **Build Signed APK**
   ```bash
   ./gradlew bundleRelease
   ```

### Step 3: Google Play Console Setup

1. **Create Application**
   - App Name: AI Dating Coach
   - Package Name: com.aidatingcoach.mobile
   - Default Language: English

2. **Upload App Bundle**
   - Go to Release → Production
   - Upload the AAB file from `app/build/outputs/bundle/release/`

### Step 4: Complete Store Listing

1. **App Details**
   - Short Description (80 chars)
   - Full Description (4000 chars)
   - Screenshots (all required sizes)
   - Feature Graphic (1024x500)
   - App Icon (512x512)

2. **Content Rating**
   - Complete content rating questionnaire
   - Likely rating: Teen (13+)

3. **App Content**
   - Privacy Policy URL
   - Target Audience
   - Data Safety declarations

### Step 5: Release to Production

1. **Review and Publish**
   - Complete all required sections
   - Submit for review
   - Typical review time: 1-3 days

2. **Monitor Release**
   - [ ] Track download metrics
   - [ ] Monitor crash reports
   - [ ] Respond to user reviews

---

## ⚡ Backend Deployment (Supabase)

### Step 1: Production Supabase Project

1. **Create Production Project**
   - Go to Supabase Dashboard
   - Create new project
   - Choose production-grade instance
   - Configure database password

2. **Configure Database**
   ```bash
   cd backend
   supabase db push --db-url "postgresql://..."
   ```

### Step 2: Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy conversation-analysis
supabase functions deploy photo-analysis
supabase functions deploy voice-analysis
supabase functions deploy create-subscription
supabase functions deploy stripe-webhook
supabase functions deploy conversation-analysis-enhanced
supabase functions deploy photo-analysis-enhanced

# Set environment variables
supabase secrets set OPENAI_API_KEY=sk-your-production-key
supabase secrets set GEMINI_API_KEY=your-production-gemini-key
supabase secrets set STRIPE_SECRET_KEY=sk_live_your-stripe-key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### Step 3: Configure Storage Buckets

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('profile-photos', 'profile-photos', true),
('conversation-screenshots', 'conversation-screenshots', false),
('voice-recordings', 'voice-recordings', false);

-- Set up RLS policies
-- (Execute the policies from backend/migrations/)
```

### Step 4: Production Environment Variables

Update all applications with production Supabase URLs:

```env
# Production Supabase Configuration
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
```

---

## 💳 Payment Processing Setup

### Step 1: Stripe Production Configuration

1. **Activate Stripe Account**
   - Complete business verification
   - Activate live payments
   - Configure webhooks

2. **Update Webhook Endpoints**
   ```
   Production Webhook URL: https://your-project.supabase.co/functions/v1/stripe-webhook
   Events to send: 
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   ```

### Step 2: Test Payment Flow

- [ ] Test subscription creation
- [ ] Test payment processing
- [ ] Test webhook delivery
- [ ] Test subscription cancellation
- [ ] Verify refund process

---

## 📊 Monitoring & Analytics Setup

### Step 1: Error Monitoring (Sentry)

```bash
# Install Sentry
npm install @sentry/react @sentry/vite-plugin

# Configure in production
VITE_SENTRY_DSN=your-production-sentry-dsn
```

### Step 2: Analytics (Google Analytics)

```javascript
// Configure GA4
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### Step 3: Performance Monitoring

- Set up Vercel Analytics
- Configure Supabase monitoring
- Set up mobile crash reporting

---

## 🔒 Security Checklist

### Pre-Deployment Security Review

- [ ] All API keys are production keys
- [ ] Environment variables secured
- [ ] HTTPS enforced everywhere
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation active
- [ ] SQL injection protection
- [ ] XSS protection enabled
- [ ] Authentication flows tested
- [ ] Authorization rules verified

### Post-Deployment Security

- [ ] Security headers configured
- [ ] SSL certificates valid
- [ ] Vulnerability scanning complete
- [ ] Penetration testing performed
- [ ] Compliance requirements met
- [ ] Data backup procedures active
- [ ] Incident response plan ready

---

## 📋 Go-Live Checklist

### Final Pre-Launch Verification

#### Web Application
- [ ] Domain configured and SSL active
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Payment processing functional
- [ ] Analytics tracking active
- [ ] Error monitoring configured

#### iOS Application
- [ ] App Store listing complete
- [ ] Screenshots and metadata uploaded
- [ ] App approved and released
- [ ] Deep linking functional
- [ ] Push notifications configured
- [ ] Crash reporting active

#### Android Application
- [ ] Google Play listing complete
- [ ] App bundle uploaded and approved
- [ ] Store listing optimized
- [ ] App signing configured
- [ ] Release management setup

#### Backend Services
- [ ] All edge functions deployed
- [ ] Database migrations applied
- [ ] Storage buckets configured
- [ ] RLS policies active
- [ ] API endpoints tested
- [ ] Webhook endpoints verified

#### Payment & Billing
- [ ] Stripe live mode activated
- [ ] Webhook endpoints configured
- [ ] Subscription plans created
- [ ] Payment flows tested
- [ ] Refund processes verified

#### Monitoring & Support
- [ ] Error monitoring active
- [ ] Performance monitoring setup
- [ ] Analytics tracking configured
- [ ] Support channels ready
- [ ] Documentation published
- [ ] Team training completed

---

## 🎯 Post-Launch Activities

### Week 1: Launch Monitoring
- Monitor error rates and performance
- Track user acquisition metrics
- Respond to user feedback
- Address any critical issues

### Week 2-4: Optimization
- Analyze user behavior data
- Optimize conversion funnels
- Improve app store rankings
- Gather user feedback

### Month 2+: Growth & Iteration
- Plan feature updates
- Analyze retention metrics
- Optimize marketing campaigns
- Scale infrastructure as needed

---

## 📞 Support & Emergency Contacts

### Technical Support
- **Lead Developer**: tech@aidatingcoach.com
- **DevOps**: devops@aidatingcoach.com
- **Emergency**: +1-XXX-XXX-XXXX

### Service Providers
- **Vercel Support**: vercel.com/support
- **Supabase Support**: supabase.com/support
- **Stripe Support**: stripe.com/support
- **Apple Developer**: developer.apple.com/support
- **Google Play**: support.google.com/googleplay

---

**Deployment Guide Version**: 1.0  
**Last Updated**: July 17, 2025  
**Status**: ✅ READY FOR PRODUCTION DEPLOYMENT

---

*This guide ensures a smooth, secure, and successful production deployment across all platforms. Follow each step carefully and verify completion before proceeding to the next phase.*

