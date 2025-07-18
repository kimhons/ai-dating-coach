import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Target, MessageCircle, TrendingUp, ArrowRight, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { PersonaType, GoalType } from '@/types'

const personas = [
  {
    type: 'frustrated_professional' as PersonaType,
    title: 'Frustrated Professional',
    description: 'You\'re successful in your career but struggling to find meaningful connections on dating apps.',
    icon: Target
  },
  {
    type: 'recently_single' as PersonaType,
    title: 'Recently Single',
    description: 'You\'re getting back into dating after a relationship and want to make a fresh start.',
    icon: Heart
  },
  {
    type: 'experienced_optimizer' as PersonaType,
    title: 'Experienced Optimizer',
    description: 'You\'ve been dating for a while and want to optimize your approach for better results.',
    icon: TrendingUp
  },
  {
    type: 'confidence_builder' as PersonaType,
    title: 'Confidence Builder',
    description: 'You want to build confidence and improve your dating skills from the ground up.',
    icon: MessageCircle
  }
]

const goals = [
  { type: 'more_matches' as GoalType, label: 'Get more matches', description: 'Improve your profile to attract more potential partners' },
  { type: 'better_conversations' as GoalType, label: 'Better conversations', description: 'Learn to have engaging and meaningful conversations' },
  { type: 'build_confidence' as GoalType, label: 'Build confidence', description: 'Develop self-confidence for dating success' },
  { type: 'find_relationship' as GoalType, label: 'Find a relationship', description: 'Find a meaningful, long-term relationship' },
  { type: 'improve_profile' as GoalType, label: 'Improve profile', description: 'Optimize your dating profile for maximum appeal' },
  { type: 'voice_confidence' as GoalType, label: 'Voice confidence', description: 'Improve speaking confidence for calls and dates' }
]

export function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null)
  const [selectedGoals, setSelectedGoals] = useState<GoalType[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()

  const handleComplete = async () => {
    if (!selectedPersona || selectedGoals.length === 0) return

    setIsCompleting(true)
    try {
      await updateProfile({
        persona_type: selectedPersona,
        onboarding_completed: true
      })
      
      // Create user goals
      // TODO: Create goals in database
      
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const toggleGoal = (goal: GoalType) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    )
  }

  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to AI Dating Coach!</h1>
            <p className="text-gray-600">Let's personalize your experience. Which best describes you?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {personas.map((persona) => (
              <button
                key={persona.type}
                onClick={() => setSelectedPersona(persona.type)}
                className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg text-left ${
                  selectedPersona === persona.type 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <persona.icon className={`w-8 h-8 mb-4 ${
                  selectedPersona === persona.type ? 'text-purple-600' : 'text-gray-600'
                }`} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{persona.title}</h3>
                <p className="text-gray-600 text-sm">{persona.description}</p>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!selectedPersona}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Next: Choose Goals
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">What are your dating goals?</h1>
          <p className="text-gray-600">Select all that apply to get personalized coaching</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {goals.map((goal) => (
            <button
              key={goal.type}
              onClick={() => toggleGoal(goal.type)}
              className={`p-4 rounded-xl border-2 transition-all hover:shadow-md text-left ${
                selectedGoals.includes(goal.type)
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900 mb-1">{goal.label}</h3>
              <p className="text-gray-600 text-sm">{goal.description}</p>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button
            onClick={handleComplete}
            disabled={selectedGoals.length === 0 || isCompleting}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {isCompleting ? 'Setting up...' : 'Complete Setup'}
          </Button>
        </div>

        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
