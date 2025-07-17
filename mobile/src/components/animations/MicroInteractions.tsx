import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ViewStyle,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as Haptics from 'react-native-haptic-feedback';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  haptic?: boolean;
  scale?: number;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onPress,
  style,
  haptic = true,
  scale = 0.95,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (haptic) {
      Haptics.trigger('impactLight');
    }
    Animated.spring(scaleAnim, {
      toValue: scale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

interface PulseAnimationProps {
  children: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
  minScale?: number;
  maxScale?: number;
}

export const PulseAnimation: React.FC<PulseAnimationProps> = ({
  children,
  style,
  duration = 2000,
  minScale = 0.95,
  maxScale = 1.05,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: maxScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: minScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [scaleAnim, duration, minScale, maxScale]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

interface ShakeAnimationProps {
  children: React.ReactNode;
  style?: ViewStyle;
  trigger: boolean;
  intensity?: number;
}

export const ShakeAnimation: React.FC<ShakeAnimationProps> = ({
  children,
  style,
  trigger,
  intensity = 10,
}) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Haptics.trigger('notificationError');
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: intensity,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -intensity,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: intensity,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [trigger, shakeAnim, intensity]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateX: shakeAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

interface SlideInViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
}

export const SlideInView: React.FC<SlideInViewProps> = ({
  children,
  style,
  direction = 'up',
  duration = 500,
  delay = 0,
}) => {
  const slideAnim = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim, duration, delay]);

  const getTransform = () => {
    switch (direction) {
      case 'left':
        return { translateX: slideAnim };
      case 'right':
        return { translateX: Animated.multiply(slideAnim, -1) };
      case 'up':
        return { translateY: slideAnim };
      case 'down':
        return { translateY: Animated.multiply(slideAnim, -1) };
      default:
        return { translateY: slideAnim };
    }
  };

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [getTransform()],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

interface SuccessCheckmarkProps {
  visible: boolean;
  size?: number;
  color?: string;
}

export const SuccessCheckmark: React.FC<SuccessCheckmarkProps> = ({
  visible,
  size = 50,
  color = '#4CAF50',
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.trigger('notificationSuccess');
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible, scaleAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [{ scale: scaleAnim }, { rotate: spin }],
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: size * 0.5,
            height: size * 0.25,
            borderLeftWidth: 3,
            borderBottomWidth: 3,
            borderColor: 'white',
            transform: [{ rotate: '-45deg' }, { translateY: -size * 0.05 }],
          }}
        />
      </View>
    </Animated.View>
  );
};

export default {
  AnimatedButton,
  PulseAnimation,
  ShakeAnimation,
  SlideInView,
  SuccessCheckmark,
};