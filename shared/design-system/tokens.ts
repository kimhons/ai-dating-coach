// AI Dating Coach - Unified Design System Tokens
// This file defines the core design tokens used across all platforms

export const DesignTokens = {
  // ============================================================================
  // BRAND COLORS - Primary brand identity colors
  // ============================================================================
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#fef7ee',
      100: '#fef0e7',
      200: '#fcd9bd',
      300: '#f9b08a',
      400: '#f57c00', // Main brand orange
      500: '#f57c00',
      600: '#ea6c00',
      700: '#d45900',
      800: '#ab4500',
      900: '#8a3600',
    },
    
    // Secondary Colors - Dating theme
    secondary: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899', // Pink accent
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
    },
    
    // Neutral Colors - Text and backgrounds
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
    
    // Semantic Colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    
    // Platform-specific adaptations
    ios: {
      blue: '#007AFF',
      gray: '#8E8E93',
      background: '#F2F2F7',
      systemGray: '#F2F2F7',
      systemGray2: '#AEAEB2',
      systemGray3: '#C7C7CC',
      systemGray4: '#D1D1D6',
      systemGray5: '#E5E5EA',
      systemGray6: '#F2F2F7',
    },
    
    android: {
      primary: '#6200EE',
      primaryVariant: '#3700B3',
      secondary: '#03DAC6',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      error: '#B00020',
      onPrimary: '#FFFFFF',
      onSecondary: '#000000',
      onBackground: '#000000',
      onSurface: '#000000',
      onError: '#FFFFFF',
    },
  },

  // ============================================================================
  // TYPOGRAPHY - Font scales, weights, and line heights
  // ============================================================================
  typography: {
    // Font Families
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      ios: ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      android: ['Roboto', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
    },
    
    // Font Sizes (mobile-first approach)
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
      '6xl': '60px',
    },
    
    // Font Weights
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    
    // Line Heights
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    
    // Letter Spacing
    letterSpacing: {
      tighter: '-0.02em',
      tight: '-0.01em',
      normal: '0em',
      wide: '0.01em',
      wider: '0.02em',
      widest: '0.1em',
    },
  },

  // ============================================================================
  // SPACING - Consistent spacing scale
  // ============================================================================
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    11: '44px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px',
    28: '112px',
    32: '128px',
    36: '144px',
    40: '160px',
    44: '176px',
    48: '192px',
    52: '208px',
    56: '224px',
    60: '240px',
    64: '256px',
    72: '288px',
    80: '320px',
    96: '384px',
  },

  // ============================================================================
  // SHADOWS - Elevation and depth
  // ============================================================================
  shadows: {
    // Mobile-optimized shadows
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    
    // Platform-specific shadows
    ios: {
      card: '0 2px 8px rgba(0, 0, 0, 0.1)',
      modal: '0 10px 25px rgba(0, 0, 0, 0.2)',
      floating: '0 5px 15px rgba(0, 0, 0, 0.15)',
    },
    
    android: {
      elevation1: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      elevation2: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
      elevation3: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
      elevation4: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
    },
  },

  // ============================================================================
  // BORDER RADIUS - Consistent rounding
  // ============================================================================
  borderRadius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    full: '9999px',
    
    // Component-specific radius
    button: '8px',
    card: '12px',
    modal: '16px',
    floating: '20px',
  },

  // ============================================================================
  // ANIMATION - Consistent timing and easing
  // ============================================================================
  animation: {
    // Duration
    duration: {
      fastest: '100ms',
      fast: '200ms',
      normal: '300ms',
      slow: '500ms',
      slowest: '800ms',
    },
    
    // Easing curves
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      ios: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      android: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    // Spring configurations for React Native
    spring: {
      gentle: { tension: 120, friction: 14 },
      medium: { tension: 180, friction: 12 },
      bouncy: { tension: 200, friction: 8 },
      wobbly: { tension: 180, friction: 6 },
    },
  },

  // ============================================================================
  // BREAKPOINTS - Responsive design breakpoints
  // ============================================================================
  breakpoints: {
    xs: '320px',
    sm: '375px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    
    // Device-specific
    mobile: '375px',
    tablet: '768px',
    desktop: '1024px',
    
    // iOS device sizes
    iphone: '375px',
    iphonePlus: '414px',
    iphoneMax: '428px',
    ipad: '768px',
    ipadPro: '1024px',
  },

  // ============================================================================
  // Z-INDEX - Layering system
  // ============================================================================
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1020,
    banner: 1030,
    overlay: 1040,
    modal: 1050,
    popover: 1060,
    skipLink: 1070,
    toast: 1080,
    tooltip: 1090,
  },

  // ============================================================================
  // COMPONENT TOKENS - Specific component styling
  // ============================================================================
  components: {
    button: {
      height: {
        sm: '32px',
        md: '40px',
        lg: '48px',
        xl: '56px',
      },
      padding: {
        sm: '8px 12px',
        md: '12px 16px',
        lg: '16px 24px',
        xl: '20px 32px',
      },
    },
    
    input: {
      height: {
        sm: '36px',
        md: '44px',
        lg: '52px',
      },
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      focusBorder: '2px solid #f57c00',
    },
    
    card: {
      padding: '16px',
      radius: '12px',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    
    modal: {
      overlay: 'rgba(0, 0, 0, 0.5)',
      radius: '16px',
      padding: '24px',
    },
  },

  // ============================================================================
  // ACCESSIBILITY - WCAG compliant values
  // ============================================================================
  accessibility: {
    // Minimum touch target sizes
    touchTarget: {
      minimum: '44px',
      comfortable: '48px',
      large: '56px',
    },
    
    // Focus indicators
    focus: {
      outline: '2px solid #f57c00',
      outlineOffset: '2px',
    },
    
    // Color contrast ratios (WCAG AA compliant)
    contrast: {
      normal: 4.5,
      large: 3,
      enhanced: 7,
    },
  },
} as const;

// ============================================================================
// PLATFORM-SPECIFIC ADAPTERS
// ============================================================================

// React Native specific tokens
export const MobileTokens = {
  ...DesignTokens,
  // React Native specific overrides
  typography: {
    ...DesignTokens.typography,
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
    },
  },
  spacing: Object.fromEntries(
    Object.entries(DesignTokens.spacing).map(([key, value]) => [
      key,
      parseInt(value.replace('px', ''))
    ])
  ),
};

// Web specific tokens (keeping px values)
export const WebTokens = DesignTokens;

// Type definitions for TypeScript
export type DesignTokensType = typeof DesignTokens;
export type ColorTokens = typeof DesignTokens.colors;
export type TypographyTokens = typeof DesignTokens.typography;
export type SpacingTokens = typeof DesignTokens.spacing;