import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import { MobileTokens } from '../../shared/design-system/tokens';

const {width, height} = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Sequence of animations for better UX
    const animationSequence = Animated.sequence([
      // Initial fade and scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      
      // Logo rotation and text slide
      Animated.parallel([
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(textSlideAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // Hold for a moment
      Animated.delay(1500),
      
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      onFinish?.();
    });

    // Auto-finish after maximum time
    const timeout = setTimeout(() => {
      onFinish?.();
    }, 4000);

    return () => clearTimeout(timeout);
  }, [fadeAnim, scaleAnim, logoRotateAnim, textSlideAnim, onFinish]);

  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={[
        MobileTokens.colors.primary[400],
        MobileTokens.colors.secondary[500],
        MobileTokens.colors.primary[600]
      ]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
    >
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={MobileTokens.colors.primary[400]}
        translucent={Platform.OS === 'android'}
      />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: textSlideAnim }
            ],
          },
        ]}>
        
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                transform: [{ rotate: logoRotation }]
              }
            ]}
          >
            {/* Main logo - using emoji for now, can be replaced with actual logo */}
            <View style={styles.logoBackground}>
              <Text style={styles.logoEmoji}>💘</Text>
            </View>
          </Animated.View>
          
          <View style={styles.brandingContainer}>
            <Text style={styles.title}>AI Dating Coach</Text>
            <Text style={styles.subtitle}>Your Personal Dating Assistant</Text>
            <View style={styles.taglineContainer}>
              <Text style={styles.tagline}>Transform Your Dating Life</Text>
            </View>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingDots}>
            {[0, 1, 2].map((index) => (
              <LoadingDot key={index} delay={index * 200} />
            ))}
          </View>
          <Text style={styles.loadingText}>Preparing your experience...</Text>
        </View>
        
        {/* Version info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

// Loading dot component with individual animation
const LoadingDot: React.FC<{ delay: number }> = ({ delay }) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    const timeout = setTimeout(animate, delay);
    return () => clearTimeout(timeout);
  }, [scaleAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.loadingDot,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    paddingVertical: MobileTokens.spacing[16],
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoWrapper: {
    marginBottom: MobileTokens.spacing[8],
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoEmoji: {
    fontSize: 60,
  },
  brandingContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: MobileTokens.typography.fontSize['4xl'],
    fontWeight: MobileTokens.typography.fontWeight.bold,
    color: MobileTokens.colors.neutral[0],
    marginBottom: MobileTokens.spacing[2],
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 
      MobileTokens.typography.fontFamily.ios[0] : 
      MobileTokens.typography.fontFamily.android[0],
    letterSpacing: MobileTokens.typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: MobileTokens.typography.fontSize.lg,
    color: MobileTokens.colors.neutral[0],
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: MobileTokens.spacing[4],
    fontWeight: MobileTokens.typography.fontWeight.medium,
  },
  taglineContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: MobileTokens.spacing[4],
    paddingVertical: MobileTokens.spacing[2],
    borderRadius: MobileTokens.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tagline: {
    fontSize: MobileTokens.typography.fontSize.sm,
    color: MobileTokens.colors.neutral[0],
    fontWeight: MobileTokens.typography.fontWeight.medium,
    textAlign: 'center',
    letterSpacing: MobileTokens.typography.letterSpacing.wide,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: MobileTokens.spacing[8],
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: MobileTokens.spacing[4],
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MobileTokens.colors.neutral[0],
    marginHorizontal: MobileTokens.spacing[1],
    opacity: 0.8,
  },
  loadingText: {
    fontSize: MobileTokens.typography.fontSize.base,
    color: MobileTokens.colors.neutral[0],
    opacity: 0.8,
    fontWeight: MobileTokens.typography.fontWeight.medium,
  },
  versionContainer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: MobileTokens.typography.fontSize.xs,
    color: MobileTokens.colors.neutral[0],
    opacity: 0.6,
    fontWeight: MobileTokens.typography.fontWeight.normal,
  },
});

export default SplashScreen;