import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  Text,
  Alert,
  Vibration,
  Platform,
  Haptics,
} from 'react-native';
import { captureScreen } from 'react-native-view-shot';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { AnalysisService } from '../services/AnalysisService';
import { MobileTokens } from '../../shared/design-system/tokens';

interface FloatingButtonProps {
  onAnalysisComplete?: (result: any) => void;
  onError?: (error: string) => void;
  config?: Partial<FloatingButtonConfig>;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  onAnalysisComplete,
  onError,
  config = {}
}) => {
  // State management
  const [isVisible, setIsVisible] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentTier, setCurrentTier] = useState<string>('free');
  
  // Hooks
  const { user } = useAuth();
  const { tier, checkTierAccess, updateUsage } = useTier();
  const { trackEvent } = useAnalytics();
  
  // Animation values
  const position = useRef(new Animated.ValueXY({
    x: config.positionX || screenWidth - 80,
    y: config.positionY || screenHeight / 2
  })).current;
  
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(config.opacity || 0.8)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  
  // Auto-hide timer
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Configuration
  const buttonConfig: FloatingButtonConfig = {
    positionX: config.positionX || screenWidth - 80,
    positionY: config.positionY || screenHeight / 2,
    size: config.size || 60,
    opacity: config.opacity || 0.8,
    autoHide: config.autoHide !== false,
    hideDelay: config.hideDelay || 3000,
    vibrationEnabled: config.vibrationEnabled !== false,
    soundEnabled: config.soundEnabled || false,
    ...config
  };

  // Pan responder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Clear auto-hide timer when user starts dragging
        if (hideTimer.current) {
          clearTimeout(hideTimer.current);
          hideTimer.current = null;
        }
        
        // Scale up slightly when touched
        Animated.spring(scale, {
          toValue: 1.1,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        // Scale back to normal
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
        
        // Snap to edges if close
        const { dx, dy } = gestureState;
        const finalX = position.x._value + dx;
        const finalY = position.y._value + dy;
        
        let snapX = finalX;
        let snapY = finalY;
        
        // Snap to left or right edge
        if (finalX < screenWidth / 2) {
          snapX = 20; // Left edge
        } else {
          snapX = screenWidth - buttonConfig.size - 20; // Right edge
        }
        
        // Keep within vertical bounds
        snapY = Math.max(50, Math.min(screenHeight - buttonConfig.size - 50, finalY));
        
        // Animate to snap position
        Animated.spring(position, {
          toValue: { x: snapX, y: snapY },
          useNativeDriver: false,
        }).start();
        
        // Restart auto-hide timer
        startAutoHideTimer();
        
        // Track position change
        trackEvent('floating_button_moved', {
          fromX: finalX,
          fromY: finalY,
          toX: snapX,
          toY: snapY
        });
      },
    })
  ).current;

  // Effects
  useEffect(() => {
    setCurrentTier(tier);
    startAutoHideTimer();
    
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [tier]);

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Auto-hide functionality
  const startAutoHideTimer = () => {
    if (!buttonConfig.autoHide) return;
    
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    
    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, buttonConfig.hideDelay);
  };

  const showButton = () => {
    Animated.timing(opacity, {
      toValue: buttonConfig.opacity,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    startAutoHideTimer();
  };

  // Screenshot capture and analysis
  const handleScreenshotCapture = async () => {
    try {
      // Check permissions
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.PHOTO_LIBRARY 
        : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
      
      const permissionResult = await check(permission);
      if (permissionResult !== RESULTS.GRANTED) {
        const requestResult = await request(permission);
        if (requestResult !== RESULTS.GRANTED) {
          Alert.alert('Permission Required', 'Please grant storage permission to capture screenshots.');
          return;
        }
      }

      // Check tier access
      const tierCheck = await checkTierAccess('screenshot');
      if (!tierCheck.allowed) {
        Alert.alert(
          'Upgrade Required',
          tierCheck.upgradePrompt || 'This feature requires a premium subscription.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => handleUpgradePrompt(tierCheck) }
          ]
        );
        return;
      }

      setIsAnalyzing(true);
      setAnalysisProgress(0);

      // Haptic feedback
      if (buttonConfig.vibrationEnabled) {
        Vibration.vibrate(50);
      }

      // Animate button during capture
      Animated.sequence([
        Animated.timing(rotation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Determine screenshot count based on tier
      const maxScreenshots = getMaxScreenshotsForTier(currentTier);
      const currentCount = screenshotCount + 1;
      
      // Capture screenshot
      setAnalysisProgress(20);
      const screenshotUri = await captureScreen({
        format: 'jpg',
        quality: 0.8,
      });

      setAnalysisProgress(40);

      // Prepare analysis request
      const analysisRequest = {
        screenshots: [screenshotUri],
        tier: currentTier,
        analysisDepth: getAnalysisDepthForTier(currentTier),
        platform: Platform.OS,
        metadata: {
          screenshotCount: currentCount,
          maxScreenshots,
          timestamp: Date.now(),
          deviceInfo: {
            width: screenWidth,
            height: screenHeight,
            platform: Platform.OS,
            version: Platform.Version
          }
        }
      };

      setAnalysisProgress(60);

      // Send for analysis
      const analysisResult = await AnalysisService.analyzeScreenshot(analysisRequest);
      
      setAnalysisProgress(80);

      // Update usage
      await updateUsage('screenshot', 1, {
        analysisDepth: analysisRequest.analysisDepth,
        processingTime: analysisResult.processingTime,
        confidence: analysisResult.confidence
      });

      setAnalysisProgress(100);

      // Track analytics
      trackEvent('screenshot_analysis_completed', {
        tier: currentTier,
        analysisDepth: analysisRequest.analysisDepth,
        confidence: analysisResult.confidence,
        processingTime: analysisResult.processingTime,
        screenshotCount: currentCount
      });

      // Update screenshot count
      setScreenshotCount(currentCount);

      // Success feedback
      if (buttonConfig.vibrationEnabled) {
        Vibration.vibrate([100, 50, 100]);
      }

      // Callback with results
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult);
      }

      // Show success animation
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

    } catch (error) {
      console.error('Screenshot analysis error:', error);
      
      // Error feedback
      if (buttonConfig.vibrationEnabled) {
        Vibration.vibrate([200, 100, 200, 100, 200]);
      }

      // Track error
      trackEvent('screenshot_analysis_error', {
        error: error.message,
        tier: currentTier,
        screenshotCount: screenshotCount + 1
      });

      // Error callback
      if (onError) {
        onError(error.message);
      }

      Alert.alert('Analysis Failed', 'Unable to analyze screenshot. Please try again.');
      
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  // Helper functions
  const getMaxScreenshotsForTier = (tier: string): number => {
    const limits = {
      free: 1,
      premium: 5,
      pro: -1 // unlimited
    };
    return limits[tier as keyof typeof limits] || 1;
  };

  const getAnalysisDepthForTier = (tier: string): string => {
    const depths = {
      free: 'basic',
      premium: 'comprehensive',
      pro: 'complete_reconstruction'
    };
    return depths[tier as keyof typeof depths] || 'basic';
  };

  const handleUpgradePrompt = (tierCheck: any) => {
    trackEvent('upgrade_prompt_shown', {
      feature: 'screenshot_analysis',
      currentTier,
      requiredTier: tierCheck.requiredTier
    });
    
    // Navigate to upgrade screen
    // This would be implemented based on your navigation setup
  };

  // Render progress indicator
  const renderProgressIndicator = () => {
    if (!isAnalyzing) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${analysisProgress}%` }]} />
        <Text style={styles.progressText}>{Math.round(analysisProgress)}%</Text>
      </View>
    );
  };

  // Render tier indicator
  const renderTierIndicator = () => {
    const tierColors = {
      free: '#9CA3AF',
      premium: '#3B82F6',
      pro: '#F59E0B'
    };

    return (
      <View style={[styles.tierIndicator, { backgroundColor: tierColors[currentTier as keyof typeof tierColors] }]}>
        <Text style={styles.tierText}>{currentTier.charAt(0).toUpperCase()}</Text>
      </View>
    );
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { scale },
            { rotate: rotation.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            })}
          ],
          opacity,
          width: buttonConfig.size,
          height: buttonConfig.size,
        }
      ]}
      {...panResponder.panHandlers}
      onTouchStart={showButton}
    >
      <TouchableOpacity
        style={[styles.button, { width: buttonConfig.size, height: buttonConfig.size }]}
        onPress={handleScreenshotCapture}
        disabled={isAnalyzing}
        activeOpacity={0.8}
      >
        {/* Main button content */}
        <View style={styles.buttonContent}>
          {isAnalyzing ? (
            <Icon name="hourglass-empty" size={24} color="#FFFFFF" />
          ) : (
            <Icon name="camera-alt" size={24} color="#FFFFFF" />
          )}
        </View>

        {/* Tier indicator */}
        {renderTierIndicator()}

        {/* Progress indicator */}
        {renderProgressIndicator()}

        {/* Screenshot count indicator */}
        {screenshotCount > 0 && (
          <View style={styles.countIndicator}>
            <Text style={styles.countText}>{screenshotCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tierText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressContainer: {
    position: 'absolute',
    bottom: -25,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressText: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  countIndicator: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default FloatingButton;

