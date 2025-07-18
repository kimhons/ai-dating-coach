import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '@/contexts/AuthContext';
import {useSubscription} from '@/contexts/SubscriptionContext';

const {width} = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  screen: string;
  locked?: boolean;
}

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const {currentPlan, getUsageStats} = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [usageStats, setUsageStats] = useState<any>({});

  const quickActions: QuickAction[] = [
    {
      id: 'photo',
      title: 'Photo Analysis',
      subtitle: 'Get AI feedback on your photos',
      icon: 'camera-outline',
      color: '#6366f1',
      screen: 'PhotoAnalysis',
    },
    {
      id: 'conversation',
      title: 'Conversation Coach',
      subtitle: 'Improve your chat skills',
      icon: 'chatbubble-outline',
      color: '#10b981',
      screen: 'ConversationAnalysis',
    },
    {
      id: 'voice',
      title: 'Voice Training',
      subtitle: 'Build confidence speaking',
      icon: 'mic-outline',
      color: '#f59e0b',
      screen: 'VoiceAnalysis',
      locked: !currentPlan?.hasVoiceAnalysis,
    },
    {
      id: 'screen',
      title: 'Screen Monitor',
      subtitle: 'Real-time dating app help',
      icon: 'phone-portrait-outline',
      color: '#ef4444',
      screen: 'ScreenMonitoring',
      locked: !currentPlan?.hasScreenMonitoring,
    },
  ];

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    try {
      const stats = await getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsageStats();
    setRefreshing(false);
  };

  const getUsagePercentage = () => {
    if (!currentPlan) return 0;
    
    const totalUsed = Object.values(usageStats).reduce(
      (sum: number, stat: any) => sum + (stat?.usage_count || 0),
      0
    );
    
    return Math.min((totalUsed / currentPlan.monthlyAnalyses) * 100, 100);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.locked) {
      // Navigate to pricing page
      navigation.navigate('Pricing' as never);
      return;
    }
    
    navigation.navigate('Analyze' as never, {
      screen: action.screen,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>
                {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}!
              </Text>
              <Text style={styles.headerSubtitle}>
                Ready to level up your dating game?
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile' as never)}>
              <Icon name="person-circle-outline" size={32} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Usage Progress */}
        <View style={styles.usageCard}>
          <View style={styles.usageHeader}>
            <View>
              <Text style={styles.usageTitle}>Monthly Usage</Text>
              <Text style={styles.usagePlan}>{currentPlan?.name} Plan</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Pricing' as never)}>
              <Text style={styles.upgradeButton}>Upgrade</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  {width: `${getUsagePercentage()}%`}
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Object.values(usageStats).reduce(
                (sum: number, stat: any) => sum + (stat?.usage_count || 0),
                0
              )} / {currentPlan?.monthlyAnalyses} analyses used
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, action.locked && styles.lockedCard]}
                onPress={() => handleQuickAction(action)}
                activeOpacity={0.7}>
                <View style={[styles.actionIcon, {backgroundColor: action.color}]}>
                  <Icon name={action.icon} size={24} color="#ffffff" />
                  {action.locked && (
                    <View style={styles.lockOverlay}>
                      <Icon name="lock-closed" size={16} color="#ffffff" />
                    </View>
                  )}
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                {action.locked && (
                  <Text style={styles.lockedText}>Premium Feature</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Progress' as never)}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityCard}>
            <Icon name="analytics-outline" size={24} color="#6366f1" />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>No recent activity</Text>
              <Text style={styles.activitySubtitle}>
                Start analyzing your photos or conversations to see your progress
              </Text>
            </View>
          </View>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Icon name="lightbulb-outline" size={24} color="#f59e0b" />
            <Text style={styles.tipsTitle}>Daily Tip</Text>
          </View>
          <Text style={styles.tipsContent}>
            Your first photo should clearly show your face and smile. 
            Studies show that smiling photos get 14% more matches!
          </Text>
        </View>
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
    paddingBottom: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  profileButton: {
    padding: 8,
  },
  usageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginTop: -15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  usagePlan: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  upgradeButton: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  seeAllButton: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lockedCard: {
    opacity: 0.7,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  lockedText: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '600',
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  tipsCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 8,
  },
  tipsContent: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
});