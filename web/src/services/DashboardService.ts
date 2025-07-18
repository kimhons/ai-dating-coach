import { supabase } from '@/lib/supabase';

export interface DashboardData {
  stats: {
    totalAnalyses: number;
    successRate: number;
    matchRate: number;
    responseRate: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'photo' | 'conversation' | 'voice' | 'screen';
    timestamp: string;
    result: string;
    score?: number;
  }>;
  performanceMetrics: {
    labels: string[];
    matchRates: number[];
    responseRates: number[];
  };
  tierUsage: {
    photos: { used: number; limit: number };
    conversations: { used: number; limit: number };
    voice: { used: number; limit: number };
    screenshots: { used: number; limit: number };
  };
}

class DashboardServiceClass {
  async getDashboardData(timeRange: string): Promise<DashboardData> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      // Fetch analyses data
      const { data: analyses, error: analysesError } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (analysesError) throw analysesError;

      // Calculate stats
      const totalAnalyses = analyses?.length || 0;
      const successfulAnalyses = analyses?.filter(a => a.score >= 7).length || 0;
      const successRate = totalAnalyses > 0 ? (successfulAnalyses / totalAnalyses) * 100 : 0;

      // Mock match and response rates (in production, these would come from actual data)
      const matchRate = 65 + Math.random() * 20;
      const responseRate = 45 + Math.random() * 25;

      // Get recent activity
      const recentActivity = analyses?.slice(0, 10).map(analysis => ({
        id: analysis.id,
        type: analysis.type,
        timestamp: analysis.created_at,
        result: analysis.result_summary || 'Analysis completed',
        score: analysis.score
      })) || [];

      // Generate performance metrics
      const labels = [];
      const matchRates = [];
      const responseRates = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        matchRates.push(60 + Math.random() * 30);
        responseRates.push(40 + Math.random() * 30);
      }

      // Get tier usage
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .single();

      const tierLimits = {
        free: { photos: 5, conversations: 10, voice: 3, screenshots: 5 },
        premium: { photos: 50, conversations: 100, voice: 30, screenshots: 50 },
        elite: { photos: -1, conversations: -1, voice: -1, screenshots: -1 }
      };

      const currentTier = subscription?.tier || 'free';
      const limits = tierLimits[currentTier as keyof typeof tierLimits];

      // Count usage by type
      const photoCount = analyses?.filter(a => a.type === 'photo').length || 0;
      const conversationCount = analyses?.filter(a => a.type === 'conversation').length || 0;
      const voiceCount = analyses?.filter(a => a.type === 'voice').length || 0;
      const screenshotCount = analyses?.filter(a => a.type === 'screenshot').length || 0;

      return {
        stats: {
          totalAnalyses,
          successRate,
          matchRate,
          responseRate
        },
        recentActivity,
        performanceMetrics: {
          labels,
          matchRates,
          responseRates
        },
        tierUsage: {
          photos: { used: photoCount, limit: limits.photos },
          conversations: { used: conversationCount, limit: limits.conversations },
          voice: { used: voiceCount, limit: limits.voice },
          screenshots: { used: screenshotCount, limit: limits.screenshots }
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  async getQuickStats(userId: string): Promise<DashboardData['stats']> {
    try {
      const { data: analyses } = await supabase
        .from('analyses')
        .select('score')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const totalAnalyses = analyses?.length || 0;
      const successfulAnalyses = analyses?.filter(a => a.score >= 7).length || 0;
      const successRate = totalAnalyses > 0 ? (successfulAnalyses / totalAnalyses) * 100 : 0;

      return {
        totalAnalyses,
        successRate,
        matchRate: 65 + Math.random() * 20,
        responseRate: 45 + Math.random() * 25
      };
    } catch (error) {
      console.error('Error fetching quick stats:', error);
      throw error;
    }
  }
}

export const DashboardService = new DashboardServiceClass();