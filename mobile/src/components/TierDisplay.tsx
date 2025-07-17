import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTier } from '../hooks/useTier';
import { TierService } from '../services/TierService';

interface TierDisplayProps {
  onUpgrade?: () => void;
  showUsage?: boolean;
  compact?: boolean;
  style?: any;
}

interface TierConfig {
  name: string;
  color: string[];
  icon: string;
  features: string[];
  price: string;
  description: string;
}

const TIER_CONFIGS: Record<string, TierConfig> = {
  free: {
    name: 'Dating Coach Starter',
    color: ['#6B7280', '#9CA3AF'],
    icon: 'heart-outline',
    features: [
      '3 photo analyses/month',
      '3 conversation analyses/month', 
      '1 voice analysis/month',
      '3 screenshot analyses/day',
      '5 keyboard suggestions/day',
      'Basic web dashboard'
    ],
    price: 'FREE',
    description: 'Perfect for getting started with AI dating coaching'
  },
  premium: {
    name: 'Dating Coach Pro',
    color: ['#3B82F6', '#1D4ED8'],
    icon: 'heart',
    features: [
      'UNLIMITED all analyses',
      'Multi-screenshot analysis (3-5 per profile)',
      'Unlimited AI keyboard suggestions',
      'Browser extension access',
      'Full web dashboard',
      'Cross-platform sync'
    ],
    price: '$9.99/month',
    description: 'Complete dating coaching experience'
  },
  pro: {
    name: 'Dating Coach Elite',
    color: ['#F59E0B', '#D97706'],
    icon: 'heart-circle',
    features: [
      'Everything in Premium PLUS:',
      'Complete profile reconstruction',
      'Predictive compatibility modeling',
      'Voice activation & Apple Watch',
      'Monthly 1-on-1 coaching session',
      'Beta feature access',
      'Advanced personality analysis'
    ],
    price: '$19.99/month',
    description: 'Professional-level dating coaching'
  }
};

export const TierDisplay: React.FC<TierDisplayProps> = ({
  onUpgrade,
  showUsage = true,
  compact = false,
  style
}) => {
  const { 
    currentTier, 
    usage, 
    loading, 
    error, 
    refreshTier,
    checkFeatureAccess,
    trackUsage 
  } = useTier();

  const [animatedValue] = useState(new Animated.Value(0));
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('premium');

  const tierConfig = TIER_CONFIGS[currentTier] || TIER_CONFIGS.free;
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    // Animate tier display on mount
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, []);

  useEffect(() => {
    // Refresh tier data every 30 seconds
    const interval = setInterval(() => {
      refreshTier();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshTier]);

  const handleUpgrade = async (targetTier: string) => {
    try {
      // Haptic feedback
      if (Platform.OS === 'ios') {
        Vibration.vibrate([0, 100]);
      }

      // Track upgrade attempt
      await trackUsage('upgrade_attempt', { 
        from_tier: currentTier, 
        to_tier: targetTier 
      });

      // Call external upgrade handler
      if (onUpgrade) {
        onUpgrade();
      } else {
        // Default upgrade flow
        Alert.alert(
          'Upgrade to ' + TIER_CONFIGS[targetTier].name,
          'Unlock premium features and unlimited access',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Upgrade', 
              onPress: () => {
                // Navigate to upgrade screen
                console.log('Navigating to upgrade screen for:', targetTier);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      Alert.alert('Error', 'Unable to process upgrade. Please try again.');
    }
  };

  const renderUsageBar = (used: number, limit: number, label: string) => {
    const percentage = limit > 0 ? (used / limit) * 100 : 0;
    const isNearLimit = percentage > 80;
    const isAtLimit = percentage >= 100;

    return (
      <View style={styles.usageContainer}>
        <View style={styles.usageHeader}>
          <Text style={styles.usageLabel}>{label}</Text>
          <Text style={[
            styles.usageText,
            isAtLimit && styles.usageTextDanger,
            isNearLimit && !isAtLimit && styles.usageTextWarning
          ]}>
            {used}/{limit === -1 ? '∞' : limit}
          </Text>
        </View>
        <View style={styles.usageBarContainer}>
          <View 
            style={[
              styles.usageBar,
              { 
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: isAtLimit ? '#EF4444' : isNearLimit ? '#F59E0B' : '#10B981'
              }
            ]} 
          />
        </View>
      </View>
    );
  };

  const renderCompactView = () => (
    <Animated.View 
      style={[
        styles.compactContainer,
        { transform: [{ scale: animatedValue }] },
        style
      ]}
    >
      <LinearGradient
        colors={tierConfig.color}
        style={styles.compactGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.compactContent}>
          <Ionicons 
            name={tierConfig.icon as any} 
            size={20} 
            color="white" 
          />
          <Text style={styles.compactTierName}>{tierConfig.name}</Text>
          {currentTier === 'free' && (
            <TouchableOpacity 
              style={styles.compactUpgradeButton}
              onPress={() => handleUpgrade('premium')}
            >
              <Text style={styles.compactUpgradeText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderFullView = () => (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ scale: animatedValue }] },
        style
      ]}
    >
      <LinearGradient
        colors={tierConfig.color}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.tierInfo}>
            <Ionicons 
              name={tierConfig.icon as any} 
              size={32} 
              color="white" 
            />
            <View style={styles.tierText}>
              <Text style={styles.tierName}>{tierConfig.name}</Text>
              <Text style={styles.tierPrice}>{tierConfig.price}</Text>
            </View>
          </View>
          
          {currentTier !== 'pro' && (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => handleUpgrade(currentTier === 'free' ? 'premium' : 'pro')}
            >
              <Text style={styles.upgradeButtonText}>
                {currentTier === 'free' ? 'Upgrade' : 'Go Pro'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.description}>{tierConfig.description}</Text>

        {showUsage && usage && (
          <View style={styles.usageSection}>
            <Text style={styles.usageSectionTitle}>Today's Usage</Text>
            
            {renderUsageBar(
              usage.screenshot_analyses || 0,
              currentTier === 'free' ? 3 : -1,
              'Screenshot Analyses'
            )}
            
            {renderUsageBar(
              usage.keyboard_suggestions || 0,
              currentTier === 'free' ? 5 : -1,
              'Keyboard Suggestions'
            )}
            
            {renderUsageBar(
              usage.photo_analyses || 0,
              currentTier === 'free' ? 3 : -1,
              'Photo Analyses'
            )}
            
            {renderUsageBar(
              usage.conversation_analyses || 0,
              currentTier === 'free' ? 3 : -1,
              'Conversation Analyses'
            )}
          </View>
        )}

        <View style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>Features</Text>
          {tierConfig.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color="rgba(255, 255, 255, 0.8)" 
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refreshTier}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <Animated.View 
          style={[
            styles.loadingSpinner,
            {
              transform: [{
                rotate: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }]
            }
          ]}
        >
          <Ionicons name="refresh" size={24} color="#6B7280" />
        </Animated.View>
        <Text style={styles.loadingText}>Loading tier information...</Text>
      </View>
    );
  }

  return compact ? renderCompactView() : renderFullView();
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  compactContainer: {
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    padding: 20,
  },
  compactGradient: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierText: {
    marginLeft: 12,
  },
  tierName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  tierPrice: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactTierName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  compactUpgradeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactUpgradeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  usageSection: {
    marginBottom: 16,
  },
  usageSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  usageContainer: {
    marginBottom: 12,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  usageLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  usageText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  usageTextWarning: {
    color: '#FCD34D',
  },
  usageTextDanger: {
    color: '#FCA5A5',
  },
  usageBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageBar: {
    height: '100%',
    borderRadius: 3,
  },
  featuresSection: {
    marginBottom: 8,
  },
  featuresSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
  },
  retryText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingSpinner: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

