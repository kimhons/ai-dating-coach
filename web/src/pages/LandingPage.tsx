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
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function LandingPage() {
  const features = [
    {
      icon: Camera,
      title: 'AI Photo Analysis',
      description: 'Get instant feedback on your dating photos with AI-powered analysis and optimization suggestions.',
      tier: 'spark'
    },
    {
      icon: MessageCircle,
      title: 'Conversation Coaching',
      description: 'Real-time analysis of your conversations with personalized suggestions to improve engagement.',
      tier: 'spark'
    },
    {
      icon: Monitor,
      title: 'Screen Monitoring',
      description: 'Live coaching while you browse dating apps with instant compatibility analysis.',
      tier: 'premium'
    },
    {
      icon: Mic,
      title: 'Voice Confidence',
      description: 'Advanced voice analysis and coaching to build confidence for phone calls and video dates.',
      tier: 'elite'
    },
    {
      icon: Users,
      title: 'Social Analytics',
      description: 'Deep profile analysis and background verification to help you make informed decisions.',
      tier: 'elite'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Track your dating success with detailed analytics and personalized improvement plans.',
      tier: 'spark'
    }
  ]

  const plans = [
    {
      name: 'Spark',
      icon: Zap,
      price: 'Free',
      description: 'Perfect for getting started',
      features: [
        '5 AI analyses per month',
        'Photo feedback & tips',
        'Basic conversation analysis',
        'Confidence tracking',
        'Email support'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Premium',
      icon: Sparkles,
      price: '$19',
      description: 'Most popular choice',
      features: [
        '25 AI analyses per month',
        'Advanced photo optimization',
        'Detailed conversation coaching',
        'Screen monitoring alerts',
        'Real-time chat suggestions',
        'Goal tracking & milestones',
        'Priority support'
      ],
      cta: 'Go Premium',
      popular: true
    },
    {
      name: 'Elite',
      icon: Crown,
      price: '$49',
      description: 'Ultimate dating success',
      features: [
        '100 AI analyses per month',
        'Voice confidence coaching',
        'Social media profile analysis',
        'Background verification tools',
        'Advanced psychology insights',
        'Personal dating strategy',
        'Weekly 1-on-1 coaching calls',
        'VIP support'
      ],
      cta: 'Go Elite',
      popular: false
    }
  ]

  const testimonials = [
    {
      name: 'Sarah M.',
      rating: 5,
      text: "Increased my matches by 300% in just two weeks! The photo analysis was spot-on.",
      location: 'San Francisco, CA'
    },
    {
      name: 'Mike K.',
      rating: 5,
      text: "The conversation coaching helped me get past small talk and have meaningful connections.",
      location: 'New York, NY'
    },
    {
      name: 'Jessica L.',
      rating: 5,
      text: "Elite tier voice coaching gave me confidence for video dates. Found my boyfriend here!",
      location: 'Austin, TX'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Transform Your Dating Game with{' '}
            <span className="text-yellow-300">AI Coaching</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Get personalized AI-powered feedback on your photos, conversations, and dating strategy. 
            Join thousands who've found love with our advanced coaching platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                Start Free Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Watch Demo
            </Button>
          </div>
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">50,000+</div>
              <div className="text-white/80">Success Stories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">85%</div>
              <div className="text-white/80">Match Improvement</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">4.9★</div>
              <div className="text-white/80">User Rating</div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform provides comprehensive coaching across all aspects of modern dating.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
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
                <p className="text-gray-600">{feature.description}</p>
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
            <p className="text-xl text-gray-600">
              Start free and upgrade as you grow more confident
            </p>
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
                    plan.name === 'Spark' ? 'text-orange-500' :
                    plan.name === 'Premium' ? 'text-purple-500' : 'text-yellow-500'
                  }`} />
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== 'Free' && <span className="text-gray-600">/month</span>}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
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
              Join thousands who've transformed their dating life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">{testimonial.location}</p>
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
            Join thousands who've found love with AI-powered coaching. Start your free analysis today.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              Start Free Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/features" className="hover:text-white">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link to="/demo" className="hover:text-white">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white">About</Link></li>
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/status" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link to="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AI Dating Coach. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
