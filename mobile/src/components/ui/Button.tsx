import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  StyleSheet,
  Animated,
  ActivityIndicator,
  View,
  Platform,
  Haptics,
} from 'react-native';
import { MobileTokens } from '../../../shared/design-system/tokens';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Button variant types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
export type ButtonIconPosition = 'left' | 'right';

export interface ButtonProps {
  // Content
  title?: string;
  children?: React.ReactNode;
  
  // Styling
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  
  // Icon
  icon?: string;
  iconPosition?: ButtonIconPosition;
  iconSize?: number;
  
  // State
  disabled?: boolean;
  loading?: boolean;
  
  // Behavior
  onPress?: () => void;
  onLongPress?: () => void;
  hapticFeedback?: boolean;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  
  // Custom styling
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  iconSize,
  disabled = false,
  loading = false,
  onPress,
  onLongPress,
  hapticFeedback = true,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
  textStyle,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  // Handle press in animation
  const handlePressIn = () => {
    if (disabled || loading) return;

    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle press out animation
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle press with haptic feedback
  const handlePress = () => {
    if (disabled || loading || !onPress) return;

    if (hapticFeedback && Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }

    onPress();
  };

  // Get button styles based on variant and size
  const getButtonStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderRadius: MobileTokens.borderRadius.button,
      minHeight: getButtonHeight(),
      paddingHorizontal: getButtonPadding(),
    };

    if (fullWidth) {
      baseStyles.width = '100%';
    }

    // Variant-specific styles
    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: disabled ? MobileTokens.colors.neutral[300] : MobileTokens.colors.primary[500],
          shadowColor: MobileTokens.colors.primary[500],
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: disabled ? 0 : 0.2,
          shadowRadius: 4,
          elevation: disabled ? 0 : 2,
        };

      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: disabled ? MobileTokens.colors.neutral[100] : MobileTokens.colors.secondary[500],
          shadowColor: MobileTokens.colors.secondary[500],
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: disabled ? 0 : 0.2,
          shadowRadius: 4,
          elevation: disabled ? 0 : 2,
        };

      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? MobileTokens.colors.neutral[300] : MobileTokens.colors.primary[500],
        };

      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
        };

      case 'destructive':
        return {
          ...baseStyles,
          backgroundColor: disabled ? MobileTokens.colors.neutral[300] : MobileTokens.colors.error[500],
          shadowColor: MobileTokens.colors.error[500],
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: disabled ? 0 : 0.2,
          shadowRadius: 4,
          elevation: disabled ? 0 : 2,
        };

      default:
        return baseStyles;
    }
  };

  // Get text styles based on variant and size
  const getTextStyles = (): TextStyle => {
    const baseStyles: TextStyle = {
      fontFamily: Platform.OS === 'ios' ? MobileTokens.typography.fontFamily.ios[0] : MobileTokens.typography.fontFamily.android[0],
      fontSize: getTextSize(),
      fontWeight: MobileTokens.typography.fontWeight.semibold,
      textAlign: 'center',
    };

    // Variant-specific text colors
    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          color: disabled ? MobileTokens.colors.neutral[500] : MobileTokens.colors.neutral[0],
        };

      case 'secondary':
        return {
          ...baseStyles,
          color: disabled ? MobileTokens.colors.neutral[500] : MobileTokens.colors.neutral[0],
        };

      case 'outline':
        return {
          ...baseStyles,
          color: disabled ? MobileTokens.colors.neutral[400] : MobileTokens.colors.primary[500],
        };

      case 'ghost':
        return {
          ...baseStyles,
          color: disabled ? MobileTokens.colors.neutral[400] : MobileTokens.colors.primary[500],
        };

      case 'destructive':
        return {
          ...baseStyles,
          color: disabled ? MobileTokens.colors.neutral[500] : MobileTokens.colors.neutral[0],
        };

      default:
        return baseStyles;
    }
  };

  // Helper functions for size-based styling
  const getButtonHeight = (): number => {
    switch (size) {
      case 'sm': return 32;
      case 'md': return 44;
      case 'lg': return 52;
      case 'xl': return 60;
      default: return 44;
    }
  };

  const getButtonPadding = (): number => {
    switch (size) {
      case 'sm': return 12;
      case 'md': return 16;
      case 'lg': return 24;
      case 'xl': return 32;
      default: return 16;
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'sm': return MobileTokens.typography.fontSize.sm;
      case 'md': return MobileTokens.typography.fontSize.base;
      case 'lg': return MobileTokens.typography.fontSize.lg;
      case 'xl': return MobileTokens.typography.fontSize.xl;
      default: return MobileTokens.typography.fontSize.base;
    }
  };

  const getIconSize = (): number => {
    if (iconSize) return iconSize;
    
    switch (size) {
      case 'sm': return 16;
      case 'md': return 20;
      case 'lg': return 24;
      case 'xl': return 28;
      default: return 20;
    }
  };

  // Render icon if provided
  const renderIcon = () => {
    if (!icon || loading) return null;

    return (
      <Icon
        name={icon}
        size={getIconSize()}
        color={getTextStyles().color}
        style={[
          iconPosition === 'right' ? styles.iconRight : styles.iconLeft,
          !title && !children ? { marginHorizontal: 0 } : {}
        ]}
      />
    );
  };

  // Render loading indicator
  const renderLoadingIndicator = () => {
    if (!loading) return null;

    return (
      <ActivityIndicator
        size="small"
        color={getTextStyles().color}
        style={[
          styles.loadingIndicator,
          (title || children) ? { marginRight: MobileTokens.spacing[2] } : {}
        ]}
      />
    );
  };

  // Render button content
  const renderContent = () => {
    if (children) return children;
    if (!title) return null;

    return (
      <Text
        style={[getTextStyles(), textStyle]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {title}
      </Text>
    );
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        }
      ]}
    >
      <TouchableOpacity
        style={[getButtonStyles(), style]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        disabled={disabled || loading}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          disabled: disabled || loading,
          busy: loading,
        }}
        testID={testID}
        activeOpacity={1} // We handle opacity with animations
      >
        {/* Loading indicator */}
        {renderLoadingIndicator()}
        
        {/* Left icon */}
        {iconPosition === 'left' && renderIcon()}
        
        {/* Button content */}
        {renderContent()}
        
        {/* Right icon */}
        {iconPosition === 'right' && renderIcon()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  iconLeft: {
    marginRight: MobileTokens.spacing[2],
  },
  iconRight: {
    marginLeft: MobileTokens.spacing[2],
  },
  loadingIndicator: {
    // Loading indicator styles handled inline
  },
});

// Export button variants for easy usage
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="primary" />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="secondary" />
);

export const OutlineButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="outline" />
);

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="ghost" />
);

export const DestructiveButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="destructive" />
);

export default Button;