import { Appearance } from 'react-native';

export interface Theme {
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    primaryPale: string;
    secondary: string;
    secondaryDark: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    borderLight: string;
    shadow: string;
    overlay: string;
    gradients: {
      primary: string[];
      secondary: string[];
      premium: string[];
      pro: string[];
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  typography: {
    fontFamily: {
      regular: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      xxxl: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  borderRadius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  animation: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: {
      standard: string;
      accelerate: string;
      decelerate: string;
      bounce: string;
    };
  };
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

const baseTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semibold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
      xxxl: 48,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  animation: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
      decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
};

export const lightTheme: Theme = {
  ...baseTheme,
  colors: {
    primary: '#E91E63',
    primaryDark: '#AD1457',
    primaryLight: '#F8BBD9',
    primaryPale: '#FCE4EC',
    secondary: '#673AB7',
    secondaryDark: '#4527A0',
    accent: '#FF9800',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    text: '#212121',
    textSecondary: '#757575',
    textTertiary: '#BDBDBD',
    border: '#E0E0E0',
    borderLight: '#F5F5F5',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    gradients: {
      primary: ['#E91E63', '#AD1457'],
      secondary: ['#673AB7', '#4527A0'],
      premium: ['#FF9800', '#F57C00'],
      pro: ['#673AB7', '#E91E63'],
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

export const darkTheme: Theme = {
  ...baseTheme,
  colors: {
    primary: '#E91E63',
    primaryDark: '#F48FB1',
    primaryLight: '#880E4F',
    primaryPale: '#3E1223',
    secondary: '#9575CD',
    secondaryDark: '#B39DDB',
    accent: '#FFB74D',
    success: '#66BB6A',
    warning: '#FFD54F',
    error: '#EF5350',
    info: '#42A5F5',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textTertiary: '#757575',
    border: '#3C3C3C',
    borderLight: '#2C2C2C',
    shadow: '#000000',
    overlay: 'rgba(255, 255, 255, 0.1)',
    gradients: {
      primary: ['#E91E63', '#880E4F'],
      secondary: ['#9575CD', '#5E35B1'],
      premium: ['#FFB74D', '#FF8A65'],
      pro: ['#9575CD', '#E91E63'],
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

export const getTheme = (isDark?: boolean): Theme => {
  const colorScheme = isDark ?? Appearance.getColorScheme() === 'dark';
  return colorScheme ? darkTheme : lightTheme;
};

export default { lightTheme, darkTheme, getTheme };