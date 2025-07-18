import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuth} from '@/contexts/AuthContext';
import {useSubscription} from '@/contexts/SubscriptionContext';
import {MobileTokens} from '../../shared/design-system/tokens';
import {PrimaryButton, OutlineButton} from '@/components/ui/Button';
import {ProgressBar} from '@/components/ui/ProgressBar';
import {Card} from '@/components/ui/Card';

const {width} = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  screen: string;
  locked?: boolean;
  premium?: boolean;
}

interface UsageStats {
  photoAnalysis: { used: number; limit: number };
  conversationAnalysis: { used: number; limit: number };
  voiceAnalysis: { used: number; limit: number };
  screenMonitoring: { used: number; limit: number };
}

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const {currentPlan, getUsageStats} = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    photoAnalysis: { used: 0, limit: 5 },
    conversationAnalysis: { used: 0, limit: 5 },
    voiceAnalysis: { used: 0, limit: 0 },
    screenMonitoring: { used: 0, limit: 0 },
  });

  // Quick actions configuration using design tokens
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'photo',
      title: 'Photo Analysis',
      subtitle: 'Get AI feedback on your photos',
      icon: 'photo-camera',
      color: MobileTokens.colors.primary[500],
      screen: 'PhotoAnalysis',
    },
    {
      id: 'conversation',
      title: 'Conversation Coach',
      subtitle: 'Improve your chat skills',
      icon: 'chat',
      color: MobileTokens.colors.success[500],
      screen: 'ConversationAnalysis',
    },
    {
      id: 'voice',
      title: 'Voice Training',
      subtitle: 'Build confidence speaking',
      icon: 'mic',
      color: MobileTokens.colors.warning[500],
      screen: 'VoiceAnalysis',
      locked: !currentPlan?.hasVoiceAnalysis,
      premium: true,
    },
    {
      id: 'screen',
      title: 'Screen Monitor',
      subtitle: 'Real-time dating app help',
      icon: 'phone-android',
      color: MobileTokens.colors.secondary[500],
      screen: 'ScreenMonitoring',
      locked: !currentPlan?.hasScreenMonitoring,
      premium: true,
    },
  ], [currentPlan]);

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = useCallback(async () => {
    try {
      const stats = await getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  }, [getUsageStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsageStats();
    setRefreshing(false);
  }, [loadUsageStats]);

  const getUsagePercentage = useCallback(() => {
    if (!currentPlan) return 0;
    
    const totalUsed = Object.values(usageStats).reduce(
      (sum, stat) => sum + stat.used,
      0
    );
    
    const totalLimit = Object.values(usageStats).reduce(
      (sum, stat) => sum + stat.limit,
      0
    );
    
    return totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
  }, [usageStats, currentPlan]);

  const getPlanDisplayName = useCallback(() => {
    switch (currentPlan?.type) {
      case 'free': return 'Spark Plan';
      case 'premium': return 'Premium Plan';
      case 'pro': return 'Elite Plan';
      default: return 'Free Plan';
    }
  }, [currentPlan]);

  const handleQuickActionPress = useCallback((action: QuickAction) => {
    if (action.locked) {
      // Navigate to upgrade screen
      navigation.navigate('Pricing' as never);
      return;
    }

    // Check usage limits
    const actionStats = usageStats[action.id as keyof UsageStats];
    if (actionStats && actionStats.used >= actionStats.limit) {
      // Show usage limit reached
      navigation.navigate('Pricing' as never);
      return;
    }

    navigation.navigate(action.screen as never);
  }, [navigation, usageStats]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}!
          </Text>
          <Text style={styles.planText}>
            {getPlanDisplayName()}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Icon 
            name="account-circle" 
            size={32} 
            color={MobileTokens.colors.primary[500]} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUsageCard = () => (
    <Card style={styles.usageCard}>
      <View style={styles.usageHeader}>
        <Text style={styles.usageTitle}>Monthly Usage</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Pricing' as never)}>
          <Text style={styles.upgradeLink}>Upgrade</Text>
        </TouchableOpacity>
      </View>
      
      <ProgressBar
        progress={getUsagePercentage()}
        color={MobileTokens.colors.primary[500]}
        backgroundColor={MobileTokens.colors.neutral[200]}
        height={8}
        style={styles.progressBar}
      />
      
      <View style={styles.usageStats}>
        {Object.entries(usageStats).map(([key, stat]) => {
          const action = quickActions.find(a => a.id === key);
          if (!action) return null;
          
          return (
            <View key={key} style={styles.usageItem}>
              <Icon 
                name={action.icon} 
                size={16} 
                color={action.color} 
              />
              <Text style={styles.usageItemText}>
                {stat.used}/{stat.limit}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.quickActionCard}
      onPress={() => handleQuickActionPress(action)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={action.locked ? 
          [MobileTokens.colors.neutral[200], MobileTokens.colors.neutral[300]] :
          [action.color, action.color + '80']
        }
        style={styles.quickActionGradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
        <View style={styles.quickActionContent}>
          <View style={styles.quickActionIcon}>
            <Icon 
              name={action.icon} 
              size={24} 
              color={action.locked ? MobileTokens.colors.neutral[500] : MobileTokens.colors.neutral[0]} 
            />
            {action.premium && (
              <View style={styles.premiumBadge}>
                <Icon name="star" size={12} color={MobileTokens.colors.warning[500]} />
              </View>
            )}
          </View>
          
          <Text style={[
            styles.quickActionTitle,
            { color: action.locked ? MobileTokens.colors.neutral[500] : MobileTokens.colors.neutral[0] }
          ]}>
            {action.title}
          </Text>
          
          <Text style={[
            styles.quickActionSubtitle,
            { color: action.locked ? MobileTokens.colors.neutral[400] : MobileTokens.colors.neutral[100] }
          ]}>
            {action.subtitle}
          </Text>
          
          {action.locked && (
            <View style={styles.lockedOverlay}>
              <Icon name="lock" size={16} color={MobileTokens.colors.neutral[500]} />
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderRecentActivity = () => (
    <Card style={styles.activityCard}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      
      <View style={styles.activityList}>
        <View style={styles.activityItem}>
          <Icon name="photo-camera" size={20} color={MobileTokens.colors.primary[500]} />
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Photo analyzed</Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>
          <Text style={styles.activityScore}>8.5/10</Text>
        </View>
        
        <View style={styles.activityItem}>
          <Icon name="chat" size={20} color={MobileTokens.colors.success[500]} />
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Conversation reviewed</Text>
            <Text style={styles.activityTime}>1 day ago</Text>
          </View>
          <Text style={styles.activityScore}>7.2/10</Text>
        </View>
      </View>
      
      <OutlineButton
        title="View All Activity"
        onPress={() => navigation.navigate('Progress' as never)}
        style={styles.viewAllButton}
        size="sm"
      />
    </Card>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <PrimaryButton
        title="Start Analysis"
        icon="play-arrow"
        onPress={() => navigation.navigate('PhotoAnalysis' as never)}
        style={styles.primaryActionButton}
        fullWidth
      />
      
      <OutlineButton
        title="View Progress"
        icon="trending-up"
        onPress={() => navigation.navigate('Progress' as never)}
        style={styles.secondaryActionButton}
        fullWidth
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={MobileTokens.colors.neutral[0]}
      />
      
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[MobileTokens.colors.primary[500]]}
            tintColor={MobileTokens.colors.primary[500]}
          />
        }
      >
        {renderUsageCard()}
        
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map(renderQuickAction)}
        </View>
        
        {renderRecentActivity()}
        {renderActionButtons()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MobileTokens.colors.neutral[50],
  },
  header: {
    backgroundColor: MobileTokens.colors.neutral[0],
    paddingHorizontal: MobileTokens.spacing[4],
    paddingBottom: MobileTokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: MobileTokens.colors.neutral[200],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: MobileTokens.typography.fontSize.xl,
    fontWeight: MobileTokens.typography.fontWeight.bold,
    color: MobileTokens.colors.neutral[900],
    fontFamily: Platform.OS === 'ios' ? MobileTokens.typography.fontFamily.ios[0] : MobileTokens.typography.fontFamily.android[0],
  },
  planText: {
    fontSize: MobileTokens.typography.fontSize.sm,
    color: MobileTokens.colors.neutral[600],
    marginTop: MobileTokens.spacing[1],
  },
  profileButton: {
    padding: MobileTokens.spacing[2],
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: MobileTokens.spacing[4],
  },
  usageCard: {
    marginTop: MobileTokens.spacing[4],
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: MobileTokens.spacing[3],
  },
  usageTitle: {
    fontSize: MobileTokens.typography.fontSize.lg,
    fontWeight: MobileTokens.typography.fontWeight.semibold,
    color: MobileTokens.colors.neutral[900],
  },
  upgradeLink: {
    fontSize: MobileTokens.typography.fontSize.sm,
    color: MobileTokens.colors.primary[500],
    fontWeight: MobileTokens.typography.fontWeight.medium,
  },
  progressBar: {
    marginBottom: MobileTokens.spacing[3],
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  usageItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageItemText: {
    fontSize: MobileTokens.typography.fontSize.sm,
    color: MobileTokens.colors.neutral[600],
    marginLeft: MobileTokens.spacing[1],
  },
  sectionTitle: {
    fontSize: MobileTokens.typography.fontSize.lg,
    fontWeight: MobileTokens.typography.fontWeight.semibold,
    color: MobileTokens.colors.neutral[900],
    marginTop: MobileTokens.spacing[6],
    marginBottom: MobileTokens.spacing[3],
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - MobileTokens.spacing[4] * 2 - MobileTokens.spacing[3]) / 2,
    marginBottom: MobileTokens.spacing[3],
    borderRadius: MobileTokens.borderRadius.card,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: MobileTokens.spacing[4],
    minHeight: 120,
  },
  quickActionContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  quickActionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MobileTokens.spacing[2],
  },
  premiumBadge: {
    backgroundColor: MobileTokens.colors.neutral[0],
    borderRadius: MobileTokens.borderRadius.full,
    padding: MobileTokens.spacing[1],
    marginLeft: MobileTokens.spacing[2],
  },
  quickActionTitle: {
    fontSize: MobileTokens.typography.fontSize.base,
    fontWeight: MobileTokens.typography.fontWeight.semibold,
    marginBottom: MobileTokens.spacing[1],
  },
  quickActionSubtitle: {
    fontSize: MobileTokens.typography.fontSize.sm,
    lineHeight: MobileTokens.typography.lineHeight.snug,
  },
  lockedOverlay: {
    position: 'absolute',
    top: MobileTokens.spacing[2],
    right: MobileTokens.spacing[2],
  },
  activityCard: {
    marginTop: MobileTokens.spacing[4],
  },
  activityList: {
    marginBottom: MobileTokens.spacing[4],
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MobileTokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: MobileTokens.colors.neutral[100],
  },
  activityContent: {
    flex: 1,
    marginLeft: MobileTokens.spacing[3],
  },
  activityTitle: {
    fontSize: MobileTokens.typography.fontSize.base,
    fontWeight: MobileTokens.typography.fontWeight.medium,
    color: MobileTokens.colors.neutral[900],
  },
  activityTime: {
    fontSize: MobileTokens.typography.fontSize.sm,
    color: MobileTokens.colors.neutral[600],
    marginTop: MobileTokens.spacing[1],
  },
  activityScore: {
    fontSize: MobileTokens.typography.fontSize.base,
    fontWeight: MobileTokens.typography.fontWeight.semibold,
    color: MobileTokens.colors.success[500],
  },
  viewAllButton: {
    alignSelf: 'center',
  },
  actionButtons: {
    marginTop: MobileTokens.spacing[6],
    gap: MobileTokens.spacing[3],
  },
  primaryActionButton: {
    // Additional styling if needed
  },
  secondaryActionButton: {
    // Additional styling if needed
  },
  bottomSpacing: {
    height: MobileTokens.spacing[8],
  },
});

export default DashboardScreen;