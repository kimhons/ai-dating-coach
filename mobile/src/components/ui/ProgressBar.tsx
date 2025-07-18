import React, { useRef, useEffect } from 'react';
import {
  View,
  ViewStyle,
  Animated,
  StyleSheet,
} from 'react-native';
import { MobileTokens } from '../../../shared/design-system/tokens';

export interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  height?: number;
  animated?: boolean;
  style?: ViewStyle;
  borderRadius?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = MobileTokens.colors.primary[500],
  backgroundColor = MobileTokens.colors.neutral[200],
  height = 6,
  animated = true,
  style,
  borderRadius,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: clampedProgress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(clampedProgress);
    }
  }, [clampedProgress, animated, animatedWidth]);

  const containerStyle: ViewStyle = {
    height,
    backgroundColor,
    borderRadius: borderRadius ?? height / 2,
    overflow: 'hidden',
  };

  const fillStyle: ViewStyle = {
    height: '100%',
    backgroundColor: color,
    borderRadius: borderRadius ?? height / 2,
  };

  return (
    <View style={[containerStyle, style]}>
      <Animated.View
        style={[
          fillStyle,
          {
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
              extrapolate: 'clamp',
            }),
          },
        ]}
      />
    </View>
  );
};

export default ProgressBar;