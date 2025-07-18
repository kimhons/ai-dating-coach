import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Crown, Sparkles, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/Button'

export function PricingPage() {
  const { user } = useAuth()
  const { pricingPlans, handleSubscribe, isLoading } = useSubscription()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Success Plan</h1>
          <p className="text-xl text-gray-600">Start free and upgrade as you grow more confident</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
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
                {plan.id === 'spark' && <Zap className="w-12 h-12 mx-auto mb-4 text-orange-500" />}
                {plan.id === 'premium' && <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-500" />}
                {plan.id === 'elite' && <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-500" />}
                
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

              <Button 
                onClick={() => handleSubscribe(plan.id)}
                disabled={isLoading}
                className={`w-full ${
                  plan.popular 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-gray-900 hover:bg-gray-800'
                }`}
              >
                {plan.cta}
              </Button>
              
              {user?.subscription_tier === plan.id && (
                <p className="text-center text-sm text-gray-500 mt-2">Current Plan</p>
              )}
            </div>
          ))}
        </div>

        {!user && (
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Don't have an account yet?
            </p>
            <Link to="/signup">
              <Button variant="outline">
                Sign Up Free
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
