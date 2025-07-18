import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '@/contexts/AuthContext';
import type {PersonaType, GoalType} from '@/types';

const {width} = Dimensions.get('window');

const PERSONAS = [
  {
    id: 'frustrated_professional' as PersonaType,
    title: 'Frustrated Professional',
    description: 'Successful in career but struggling with dating',
    icon: 'briefcase-outline',
    color: '#3b82f6',
  },
  {
    id: 'recently_single' as PersonaType,
    title: 'Recently Single',
    description: 'Ready to get back into the dating scene',
    icon: 'heart-outline',
    color: '#ef4444',
  },
  {
    id: 'experienced_optimizer' as PersonaType,
    title: 'Dating App Veteran',
    description: 'Want to optimize your existing dating strategy',
    icon: 'trending-up-outline',
    color: '#10b981',
  },
  {
    id: 'confidence_builder' as PersonaType,
    title: 'Confidence Builder',
    description: 'Looking to build self-confidence and social skills',
    icon: 'star-outline',
    color: '#f59e0b',
  },
];

const GOALS = [
  {
    id: 'more_matches' as GoalType,
    title: 'Get More Matches',
    description: 'Improve your profile to attract more people',
    icon: 'people-outline',
  },
  {
    id: 'better_conversations' as GoalType,
    title: 'Better Conversations',
    description: 'Learn to have engaging and meaningful chats',
    icon: 'chatbubbles-outline',
  },
  {
    id: 'build_confidence' as GoalType,
    title: 'Build Confidence',
    description: 'Develop self-assurance in dating situations',
    icon: 'fitness-outline',
  },
  {
    id: 'find_relationship' as GoalType,
    title: 'Find a Relationship',
    description: 'Focus on finding a meaningful connection',
    icon: 'heart-outline',
  },
];

export const OnboardingScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<GoalType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const {completeOnboarding} = useAuth();

  const handlePersonaSelect = (persona: PersonaType) => {
    setSelectedPersona(persona);
  };

  const handleGoalToggle = (goal: GoalType) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleNext = () => {
    if (currentStep === 0 && selectedPersona) {
      setCurrentStep(1);
    }
  };

  const handleComplete = async () => {
    if (!selectedPersona || selectedGoals.length === 0) return;

    try {
      setIsLoading(true);
      await completeOnboarding(selectedPersona, selectedGoals);
    } catch (error) {
      // Error handled in auth context
    } finally {
      setIsLoading(false);
    }
  };

  const renderPersonaStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepNumber}>1 of 2</Text>
        <Text style={styles.stepTitle}>What describes you best?</Text>
        <Text style={styles.stepSubtitle}>
          This helps us personalize your experience
        </Text>
      </View>

      <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
        {PERSONAS.map((persona) => (
          <TouchableOpacity
            key={persona.id}
            style={[
              styles.optionCard,
              selectedPersona === persona.id && styles.selectedOption,
            ]}
            onPress={() => handlePersonaSelect(persona.id)}
            activeOpacity={0.7}>
            <View style={[styles.optionIcon, {backgroundColor: persona.color}]}>
              <Icon name={persona.icon} size={24} color="#ffffff" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{persona.title}</Text>
              <Text style={styles.optionDescription}>{persona.description}</Text>
            </View>
            <View style={styles.optionCheckbox}>
              {selectedPersona === persona.id && (
                <Icon name="checkmark-circle" size={24} color="#6366f1" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.nextButton, !selectedPersona && styles.disabledButton]}
        onPress={handleNext}
        disabled={!selectedPersona}
        activeOpacity={0.8}>
        <Text style={styles.nextButtonText}>Continue</Text>
        <Icon name="arrow-forward" size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  const renderGoalsStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepNumber}>2 of 2</Text>
        <Text style={styles.stepTitle}>What are your goals?</Text>
        <Text style={styles.stepSubtitle}>
          Select all that apply (you can change these later)
        </Text>
      </View>

      <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
        {GOALS.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[
              styles.optionCard,
              selectedGoals.includes(goal.id) && styles.selectedOption,
            ]}
            onPress={() => handleGoalToggle(goal.id)}
            activeOpacity={0.7}>
            <View style={[styles.optionIcon, {backgroundColor: '#6366f1'}]}>
              <Icon name={goal.icon} size={24} color="#ffffff" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{goal.title}</Text>
              <Text style={styles.optionDescription}>{goal.description}</Text>
            </View>
            <View style={styles.optionCheckbox}>
              {selectedGoals.includes(goal.id) && (
                <Icon name="checkmark-circle" size={24} color="#6366f1" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentStep(0)}
          activeOpacity={0.8}>
          <Icon name="arrow-back" size={20} color="#6366f1" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.completeButton, 
            (selectedGoals.length === 0 || isLoading) && styles.disabledButton
          ]}
          onPress={handleComplete}
          disabled={selectedGoals.length === 0 || isLoading}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Text style={styles.completeButtonText}>Get Started</Text>
              <Icon name="checkmark" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                {width: `${((currentStep + 1) / 2) * 100}%`}
              ]} />
            </View>
          </View>

          {/* Step Content */}
          <View style={styles.formContainer}>
            {currentStep === 0 ? renderPersonaStep() : renderGoalsStep()}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressContainer: {
    paddingVertical: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    flex: 1,
    padding: 24,
  },
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    marginBottom: 24,
  },
  stepNumber: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
  },
  optionsContainer: {
    flex: 1,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#ede9fe',
    borderColor: '#6366f1',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  optionCheckbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 20,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 8,
  },
});