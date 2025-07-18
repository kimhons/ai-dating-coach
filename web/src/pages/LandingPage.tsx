import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Heart, 
  Camera, 
  MessageCircle, 
  Mic, 
  Monitor, 
  Users, 
  TrendingUp,
  Zap,
  Sparkles,
  Crown,
  CheckCircle,
  ArrowRight,
  Star,
  Brain,
  Target,
  Award,
  Shield,
  PlayCircle,
  ChevronDown,
  Smartphone,
  Globe,
  BarChart3,
  Lightbulb
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function LandingPage() {
  const features = [
    {
      icon: Camera,
      title: 'AI Photo Analysis',
      description: 'Get instant feedback on your dating photos with AI-powered analysis and optimization suggestions. Our computer vision technology rates attractiveness, composition, and style.',
      tier: 'spark',
      stats: '95% accuracy rate'
    },
    {
      icon: MessageCircle,
      title: 'Conversation Coaching',
      description: 'Real-time analysis of your conversations with personalized suggestions to improve engagement. Master the art of digital flirting and meaningful connections.',
      tier: 'spark',
      stats: '3x better response rates'
    },
    {
      icon: Monitor,
      title: 'Smart Screen Monitoring',
      description: 'Live coaching while you browse dating apps with instant compatibility analysis. Get real-time swipe recommendations and profile insights.',
      tier: 'premium',
      stats: '40% more quality matches'
    },
    {
      icon: Mic,
      title: 'Voice Confidence Training',
      description: 'Advanced voice analysis and coaching to build confidence for phone calls and video dates. Practice scenarios and get feedback on tone and delivery.',
      tier: 'elite',
      stats: '85% confidence boost'
    },
    {
      icon: Users,
      title: 'Social Intelligence',
      description: 'Deep profile analysis and background insights to help you make informed decisions. Understand personality types and compatibility markers.',
      tier: 'elite',
      stats: '70% better first dates'
    },
    {
      icon: TrendingUp,
      title: 'Success Analytics',
      description: 'Track your dating progress with detailed analytics and personalized improvement plans. Data-driven insights for continuous optimization.',
      tier: 'spark',
      stats: 'Track 20+ metrics'
    }
  ]

  const plans = [
    {
      name: 'Spark',
      icon: Zap,
      price: 'Free',
      originalPrice: null,
      description: 'Perfect for getting started',
      features: [
        '5 AI photo analyses per month',
        'Basic conversation suggestions',
        'Photo feedback & optimization tips',
        'Progress tracking dashboard',
        'Email support within 48 hours',
        'Access to dating tips library'
      ],
      cta: 'Start Free Today',
      popular: false,
      color: 'orange'
    },
    {
      name: 'Premium',
      icon: Sparkles,
      price: '$19',
      originalPrice: '$29',
      description: 'Most popular for serious daters',
      features: [
        '25 AI analyses across all features',
        'Advanced photo optimization suite',
        'Real-time conversation coaching',
        'Smart screen monitoring alerts',
        'Dating app strategy recommendations',
        'Goal tracking & milestone rewards',
        'Priority support within 24 hours',
        'Weekly success reports'
      ],
      cta: 'Go Premium',
      popular: true,
      color: 'purple'
    },
    {
      name: 'Elite',
      icon: Crown,
      price: '$49',
      originalPrice: '$79',
      description: 'Ultimate dating transformation',
      features: [
        '100 AI analyses per month',
        'Voice confidence coaching sessions',
        'Social media profile optimization',
        'Background verification insights',
        'Advanced psychology profiling',
        'Personalized dating strategy plan',
        'Weekly 1-on-1 coaching calls (30 min)',
        'VIP support within 1 hour',
        'Success guarantee program'
      ],
      cta: 'Go Elite',
      popular: false,
      color: 'yellow'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah M.',
      rating: 5,
      text: "Increased my matches by 300% in just two weeks! The photo analysis was spot-on and the conversation coaching helped me move past small talk.",
      location: 'San Francisco, CA',
      result: '300% more matches',
      avatar: '👩‍💼'
    },
    {
      name: 'Mike K.',
      rating: 5,
      text: "The voice coaching was a game-changer. Went from nervous video calls to confident conversations. Found my girlfriend through Elite coaching!",
      location: 'New York, NY',
      result: 'Found relationship',
      avatar: '👨‍💻'
    },
    {
      name: 'Jessica L.',
      rating: 5,
      text: "Elite tier completely transformed my dating life. The personal coaching calls helped me understand what I was doing wrong. Worth every penny!",
      location: 'Austin, TX',
      result: '85% better first dates',
      avatar: '👩‍🎨'
    },
    {
      name: 'David R.',
      rating: 5,
      text: "As an introvert, the conversation suggestions were invaluable. Went from 2% response rate to 40% in one month. This actually works!",
      location: 'Seattle, WA',
      result: '2% → 40% response rate',
      avatar: '👨‍🔬'
    }
  ]

  const stats = [
    { number: '50,000+', label: 'Success Stories', icon: Heart },
    { number: '85%', label: 'Match Improvement', icon: TrendingUp },
    { number: '4.9★', label: 'User Rating', icon: Star },
    { number: '95%', label: 'Satisfaction Rate', icon: Award }
  ]

  const howItWorks = [
    {
      step: '1',
      title: 'Upload & Analyze',
      description: 'Upload your photos and conversation screenshots for instant AI analysis',
      icon: Camera
    },
    {
      step: '2',
      title: 'Get Insights',
      description: 'Receive detailed feedback with specific improvement recommendations',
      icon: Brain
    },
    {
      step: '3',
      title: 'Apply & Improve',
      description: 'Implement suggestions and track your success with real-time analytics',
      icon: Target
    },
    {
      step: '4',
      title: 'Find Love',
      description: 'Watch your matches and meaningful connections multiply dramatically',
      icon: Heart
    }
  ]

  const competitors = [
    {
      name: 'Traditional Dating Coaches',
      price: '$150/hour',
      features: ['Limited availability', 'Generic advice', 'No real-time help', 'Expensive sessions'],
      rating: 3.2
    },
    {
      name: 'Other AI Dating Apps',
      price: '$29/month',
      features: ['Basic photo rating', 'Limited features', 'No voice coaching', 'Poor accuracy'],
      rating: 3.8
    },
    {
      name: 'AI Dating Coach',
      price: '$19/month',
      features: ['24/7 availability', 'Personalized coaching', 'Real-time assistance', 'Proven results'],
      rating: 4.9,
      highlighted: true
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AI Dating Coach</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-white text-purple-600 hover:bg-gray-100">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Lightbulb className="w-4 h-4 text-yellow-300 mr-2" />
            <span className="text-white text-sm font-medium">Featured in TechCrunch, Forbes & Wired</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Transform Your Dating Game with{' '}
            <span className="text-yellow-300">AI Coaching</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Get personalized AI-powered feedback on your photos, conversations, and dating strategy. 
            Join 50,000+ users who've improved their match rates by 85% with our proven platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/signup">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 shadow-xl">
                Start Free Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <PlayCircle className="w-5 h-5 mr-2" />
              Watch 2-Min Demo
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-white/80 text-sm">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              <span>Privacy Protected</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span>No Commitment</span>
            </div>
            <div className="flex items-center">
              <Award className="w-4 h-4 mr-1" />
              <span>Money-Back Guarantee</span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <stat.icon className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{stat.number}</div>
                <div className="text-white/80 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform makes dating success simple and achievable in just 4 steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive AI-powered platform provides expert coaching across all aspects of modern dating
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  {feature.tier !== 'spark' && (
                    <div className="flex items-center space-x-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      <Crown className="w-3 h-3" />
                      <span className="capitalize">{feature.tier}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="text-sm font-medium text-purple-600">{feature.stats}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose AI Dating Coach?
            </h2>
            <p className="text-xl text-gray-600">
              See how we compare to traditional dating coaches and other AI apps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {competitors.map((competitor, index) => (
              <div 
                key={index} 
                className={`rounded-2xl p-8 ${
                  competitor.highlighted 
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white scale-105 shadow-2xl' 
                    : 'bg-white text-gray-900 shadow-lg'
                }`}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{competitor.name}</h3>
                  <div className="text-3xl font-bold">{competitor.price}</div>
                  <div className="flex items-center justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${
                          i < Math.floor(competitor.rating) 
                            ? 'text-yellow-400 fill-current' 
                            : competitor.highlighted ? 'text-white/30' : 'text-gray-300'
                        }`} 
                      />
                    ))}
                    <span className="ml-1 text-sm">{competitor.rating}</span>
                  </div>
                </div>
                <ul className="space-y-3">
                  {competitor.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className={`w-4 h-4 mr-3 flex-shrink-0 ${
                        competitor.highlighted ? 'text-white' : 'text-green-500'
                      }`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Success Plan
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              Start free and upgrade as you grow more confident
            </p>
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <Award className="w-4 h-4 mr-2" />
              Limited Time: Save up to 40% on annual plans
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 ${
                  plan.popular ? 'border-purple-500 scale-105' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <plan.icon className={`w-12 h-12 mx-auto mb-4 ${
                    plan.color === 'orange' ? 'text-orange-500' :
                    plan.color === 'purple' ? 'text-purple-500' : 'text-yellow-500'
                  }`} />
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                  <div className="mt-4">
                    <div className="flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      {plan.price !== 'Free' && <span className="text-gray-600">/month</span>}
                    </div>
                    {plan.originalPrice && (
                      <div className="text-sm text-gray-500 line-through">{plan.originalPrice}/month</div>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/signup" className="block">
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real Results from Real People
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands who've transformed their dating life with AI coaching
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic text-lg">"{testimonial.text}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">{testimonial.avatar}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-gray-600 text-sm">{testimonial.location}</p>
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                    {testimonial.result}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Dating Life?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join 50,000+ users who've found love with AI-powered coaching. Start your free analysis today and see results within 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 shadow-xl">
                Start Free Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Book Demo Call
            </Button>
          </div>
          <p className="text-white/80 text-sm mt-4">No credit card required • 7-day money back guarantee</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/demo" className="hover:text-white transition-colors">Demo</Link></li>
                <li><Link to="/api" className="hover:text-white transition-colors">API Docs</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/press" className="hover:text-white transition-colors">Press</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/status" className="hover:text-white transition-colors">Status</Link></li>
                <li><Link to="/community" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link to="/security" className="hover:text-white transition-colors">Security</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">AI Dating Coach</span>
            </div>
            <div className="flex items-center space-x-6 text-gray-400 text-sm">
              <p>&copy; 2025 AI Dating Coach. All rights reserved.</p>
              <div className="flex items-center space-x-4">
                <Smartphone className="w-4 h-4" />
                <Globe className="w-4 h-4" />
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
