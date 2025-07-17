import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { SlideInView, AnimatedButton, SuccessCheckmark } from '../animations/MicroInteractions';
import { useTheme } from '../../hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  image?: any;
  action?: {
    label: string;
    onPress: () => void;
  };
  highlights?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
  }>;
}

interface OnboardingTutorialProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  steps,
  onComplete,
  onSkip,
}) => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / steps.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, steps.length, progressAnim]);

  useEffect(() => {
    // Save progress
    AsyncStorage.setItem('onboarding_progress', JSON.stringify({
      currentStep,
      completedSteps: Array.from(completedSteps),
    }));
  }, [currentStep, completedSteps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set(prev).add(steps[currentStep].id));
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ x: width * (currentStep + 1), animated: true });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ x: width * (currentStep - 1), animated: true });
    }
  };

  const handleComplete = async () => {
    setCompletedSteps(prev => new Set(prev).add(steps[currentStep].id));
    await AsyncStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_skipped', 'true');
    onSkip?.();
  };

  const renderStep = (step: OnboardingStep, index: number) => (
    <View key={step.id} style={[styles.stepContainer, { width }]}>
      <SlideInView direction="up" delay={index === currentStep ? 0 : 300}>
        <View style={styles.contentContainer}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryPale }]}>
            <Icon name={step.icon} size={60} color={theme.colors.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {step.title}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {step.description}
          </Text>

          {/* Image if provided */}
          {step.image && (
            <Image source={step.image} style={styles.stepImage} resizeMode="contain" />
          )}

          {/* Action button if provided */}
          {step.action && (
            <AnimatedButton onPress={step.action.onPress} style={styles.actionButton}>
              <LinearGradient
                colors={theme.colors.gradients.primary}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.actionButtonText}>{step.action.label}</Text>
              </LinearGradient>
            </AnimatedButton>
          )}

          {/* Interactive highlights */}
          {step.highlights && step.highlights.map((highlight, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.highlight,
                {
                  left: highlight.x,
                  top: highlight.y,
                  width: highlight.width,
                  height: highlight.height,
                },
              ]}
              activeOpacity={0.8}
            >
              <View style={styles.highlightPulse} />
              <Text style={styles.highlightText}>{highlight.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SlideInView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.colors.primary,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Skip button */}
      {onSkip && currentStep < steps.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Steps */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
      >
        {steps.map((step, index) => renderStep(step, index))}
      </ScrollView>

      {/* Step indicators */}
      <View style={styles.indicatorContainer}>
        {steps.map((step, index) => (
          <View
            key={step.id}
            style={[
              styles.indicator,
              {
                backgroundColor:
                  index === currentStep
                    ? theme.colors.primary
                    : completedSteps.has(step.id)
                    ? theme.colors.success
                    : theme.colors.border,
              },
            ]}
          >
            {completedSteps.has(step.id) && index !== currentStep && (
              <Icon name="checkmark" size={12} color="white" />
            )}
          </View>
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        )}

        <AnimatedButton
          onPress={handleNext}
          style={[styles.primaryButton, { flex: 1, marginHorizontal: 16 }]}
        >
          <LinearGradient
            colors={theme.colors.gradients.primary}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.primaryButtonText}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Icon
              name={currentStep === steps.length - 1 ? 'checkmark' : 'arrow-forward'}
              size={20}
              color="white"
              style={{ marginLeft: 8 }}
            />
          </LinearGradient>
        </AnimatedButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  stepImage: {
    width: width - 80,
    height: 200,
    marginVertical: 20,
  },
  actionButton: {
    marginTop: 20,
  },
  gradientButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  highlight: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(233, 30, 99, 0.5)',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  highlightPulse: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E91E63',
  },
  highlightText: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#E91E63',
    fontSize: 12,
    fontWeight: '600',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingTutorial;