import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useSubscription} from '@/contexts/SubscriptionContext';

const analysisOptions = [
  {
    id: 'photo',
    title: 'Photo Analysis',
    description: 'Get AI feedback on your dating photos with detailed suggestions',
    icon: 'camera-outline',
    color: '#6366f1',
    screen: 'PhotoAnalysis',
    tier: 'all',
  },
  {
    id: 'conversation',
    title: 'Conversation Coach',
    description: 'Upload screenshots and get real-time conversation advice',
    icon: 'chatbubble-outline',
    color: '#10b981',
    screen: 'ConversationAnalysis',
    tier: 'all',
  },
  {
    id: 'voice',
    title: 'Voice Analysis',
    description: 'Practice conversations and build speaking confidence',
    icon: 'mic-outline',
    color: '#f59e0b',
    screen: 'VoiceAnalysis',
    tier: 'elite',
  },
  {
    id: 'screen',
    title: 'Screen Monitoring',
    description: 'Get live coaching while using dating apps',
    icon: 'phone-portrait-outline',
    color: '#ef4444',
    screen: 'ScreenMonitoring',
    tier: 'premium',
  },
  {
    id: 'social',
    title: 'Social Analytics',
    description: 'Analyze social media profiles and compatibility',
    icon: 'analytics-outline',
    color: '#8b5cf6',
    screen: 'SocialAnalytics',
    tier: 'elite',
  },
];

export const AnalyzeHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const {currentPlan} = useSubscription();

  const isFeatureAvailable = (tier: string) => {
    if (tier === 'all') return true;
    if (tier === 'premium') return currentPlan?.hasScreenMonitoring;
    if (tier === 'elite') return currentPlan?.hasVoiceAnalysis;
    return false;
  };

  const handleOptionPress = (option: typeof analysisOptions[0]) => {
    if (!isFeatureAvailable(option.tier)) {
      navigation.navigate('Pricing' as never);
      return;
    }
    
    navigation.navigate(option.screen as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Analysis</Text>
          <Text style={styles.subtitle}>
            Choose the type of analysis you want to perform
          </Text>
        </View>

        {/* Analysis Options */}
        <View style={styles.optionsContainer}>
          {analysisOptions.map((option) => {
            const available = isFeatureAvailable(option.tier);
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, !available && styles.lockedCard]}
                onPress={() => handleOptionPress(option)}
                activeOpacity={0.7}>
                
                <View style={styles.optionHeader}>
                  <View style={[styles.optionIcon, {backgroundColor: option.color}]}>
                    <Icon name={option.icon} size={28} color="#ffffff" />
                    {!available && (
                      <View style={styles.lockOverlay}>
                        <Icon name="lock-closed" size={16} color="#ffffff" />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    {!available && (
                      <Text style={styles.tierBadge}>
                        {option.tier === 'premium' ? 'Premium' : 'Elite'} Feature
                      </Text>
                    )}
                  </View>
                  
                  <Icon 
                    name="chevron-forward" 
                    size={20} 
                    color={available ? "#6b7280" : "#d1d5db"} 
                  />
                </View>
                
                <Text style={[
                  styles.optionDescription,
                  !available && styles.lockedDescription
                ]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Usage Info */}
        <View style={styles.infoCard}>
          <Icon name="information-circle-outline" size={24} color="#6366f1" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoDescription}>
              Upload your photos, conversations, or voice recordings and get instant AI-powered feedback to improve your dating success.
            </Text>
          </View>
        </View>

        {/* Upgrade Prompt */}
        {currentPlan?.id === 'spark' && (
          <TouchableOpacity
            style={styles.upgradeCard}
            onPress={() => navigation.navigate('Pricing' as never)}
            activeOpacity={0.8}>
            <View style={styles.upgradeContent}>
              <Text style={styles.upgradeTitle}>🚀 Unlock Premium Features</Text>
              <Text style={styles.upgradeDescription}>
                Get access to voice analysis, screen monitoring, and unlimited analyses
              </Text>
            </View>
            <Icon name="arrow-forward" size={24} color="#6366f1" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lockedCard: {
    opacity: 0.7,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  tierBadge: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  lockedDescription: {
    color: '#9ca3af',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  upgradeCard: {
    backgroundColor: '#fefce8',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde047',
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
});