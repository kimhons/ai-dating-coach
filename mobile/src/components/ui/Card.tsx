import React from 'react';
import {
  View,
  ViewStyle,
  StyleSheet,
  Platform,
} from 'react-native';
import { MobileTokens } from '../../../shared/design-system/tokens';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof MobileTokens.spacing;
  shadow?: boolean;
  borderRadius?: keyof typeof MobileTokens.borderRadius;
  backgroundColor?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = '4',
  shadow = true,
  borderRadius = 'card',
  backgroundColor = MobileTokens.colors.neutral[0],
}) => {
  const cardStyles: ViewStyle = {
    backgroundColor,
    borderRadius: MobileTokens.borderRadius[borderRadius],
    padding: MobileTokens.spacing[padding],
    ...shadow && Platform.select({
      ios: {
        shadowColor: MobileTokens.colors.neutral[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  };

  return (
    <View style={[cardStyles, style]}>
      {children}
    </View>
  );
};

export default Card;