# 🌐 AI Dating Coach Web Dashboard

A modern React-based web dashboard for managing AI Dating Coach profiles, analytics, and administration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure your environment variables in .env.local
# Start development server
npm run dev
```

## 🔧 Environment Configuration

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration  
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# App Configuration
VITE_APP_URL=https://your-domain.com
VITE_APP_NAME=AI Dating Coach
```

## 🏗️ Build & Deployment

### Development
```bash
npm run dev          # Start development server
npm run type-check   # Run TypeScript type checking
npm run lint         # Run ESLint
```

### Production Build
```bash
npm run build        # Build for production
npm run preview      # Preview production build
npm run deploy       # Deploy to Vercel (requires setup)
```

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.example`

## 📁 Project Structure

```
web/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and configurations
│   ├── types/         # TypeScript type definitions
│   └── styles/        # Global styles and themes
├── public/            # Static assets
├── dist/              # Production build output
├── vercel.json        # Vercel deployment configuration
├── vite.config.ts     # Vite configuration
└── deploy.sh          # Deployment script
```

## 🎨 Features

### Dashboard
- User analytics and insights
- Photo analysis results
- Conversation coaching metrics
- Subscription management

### Admin Panel
- User management
- Content moderation
- Analytics overview
- System monitoring

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interactions
- Accessibility compliant

## 🔒 Security

### Authentication
- Supabase Auth integration
- Row Level Security (RLS)
- JWT token management
- Secure session handling

### Data Protection
- HTTPS enforcement
- CORS configuration
- Input validation
- XSS protection

## 📊 Performance

### Optimization
- Code splitting
- Lazy loading
- Image optimization
- Bundle analysis

### Monitoring
- Core Web Vitals tracking
- Error monitoring with Sentry
- Performance analytics
- User behavior tracking

## 🧪 Testing

```bash
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run test:coverage # Generate coverage report
```

## 🔧 Development Tools

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Husky for git hooks

### Build Tools
- Vite for fast development
- Rollup for production builds
- PostCSS for CSS processing
- Tailwind CSS for styling

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase project connected
- [ ] Stripe keys configured
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Analytics tracking enabled
- [ ] Error monitoring setup
- [ ] Performance monitoring active

## 📞 Support

For deployment issues or questions:
- **Documentation**: [./docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/kimhons/ai-dating-coach/issues)
- **Email**: support@aidatingcoach.com

---

**Built with ❤️ by the AI Dating Coach Team**

