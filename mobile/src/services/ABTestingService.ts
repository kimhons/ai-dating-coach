import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  variants: Variant[];
  allocation: number; // Percentage of users in experiment
  startDate: Date;
  endDate?: Date;
  metrics: string[]; // Metrics to track
}

interface Variant {
  id: string;
  name: string;
  weight: number; // Percentage allocation within experiment
  config: Record<string, any>;
}

interface UserExperiment {
  experimentId: string;
  variantId: string;
  enrolledAt: Date;
}

interface ExperimentResult {
  experimentId: string;
  variantId: string;
  metric: string;
  value: number;
  timestamp: Date;
}

class ABTestingService {
  private static instance: ABTestingService;
  private experiments: Map<string, Experiment> = new Map();
  private userExperiments: Map<string, UserExperiment> = new Map();
  private userId?: string;
  private deviceId?: string;

  private constructor() {
    this.initialize();
  }

  static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService();
    }
    return ABTestingService.instance;
  }

  private async initialize() {
    try {
      // Load cached experiments
      const cached = await AsyncStorage.getItem('ab_experiments');
      if (cached) {
        const experiments = JSON.parse(cached);
        experiments.forEach((exp: Experiment) => {
          this.experiments.set(exp.id, exp);
        });
      }

      // Load user's experiment assignments
      const userExps = await AsyncStorage.getItem('user_experiments');
      if (userExps) {
        const assignments = JSON.parse(userExps);
        Object.entries(assignments).forEach(([expId, assignment]) => {
          this.userExperiments.set(expId, assignment as UserExperiment);
        });
      }

      // Fetch latest experiments from server
      this.fetchExperiments();
    } catch (error) {
      console.error('Failed to initialize A/B testing:', error);
    }
  }

  async setUser(userId: string, deviceId: string) {
    this.userId = userId;
    this.deviceId = deviceId;
    await this.syncUserExperiments();
  }

  private async fetchExperiments() {
    try {
      const { data, error } = await supabase
        .from('experiments')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      // Update local experiments
      this.experiments.clear();
      data.forEach((exp: Experiment) => {
        this.experiments.set(exp.id, exp);
      });

      // Cache experiments
      await AsyncStorage.setItem(
        'ab_experiments',
        JSON.stringify(Array.from(this.experiments.values()))
      );
    } catch (error) {
      console.error('Failed to fetch experiments:', error);
    }
  }

  private async syncUserExperiments() {
    if (!this.userId) return;

    try {
      const { data, error } = await supabase
        .from('user_experiments')
        .select('*')
        .eq('user_id', this.userId);

      if (error) throw error;

      // Update local assignments
      this.userExperiments.clear();
      data.forEach((assignment: any) => {
        this.userExperiments.set(assignment.experiment_id, {
          experimentId: assignment.experiment_id,
          variantId: assignment.variant_id,
          enrolledAt: new Date(assignment.enrolled_at),
        });
      });

      // Cache user experiments
      await AsyncStorage.setItem(
        'user_experiments',
        JSON.stringify(Object.fromEntries(this.userExperiments))
      );
    } catch (error) {
      console.error('Failed to sync user experiments:', error);
    }
  }

  getVariant(experimentId: string): string | null {
    // Check if user is already assigned to a variant
    const assignment = this.userExperiments.get(experimentId);
    if (assignment) {
      return assignment.variantId;
    }

    // Check if experiment exists and is active
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'active') {
      return null;
    }

    // Check if user should be in experiment based on allocation
    const hash = this.hashUserId(this.userId || this.deviceId || '');
    const bucket = hash % 100;
    if (bucket >= experiment.allocation) {
      return null; // User not in experiment
    }

    // Assign variant based on weights
    const variantBucket = hash % 100;
    let cumulative = 0;
    let selectedVariant: Variant | null = null;

    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (variantBucket < cumulative) {
        selectedVariant = variant;
        break;
      }
    }

    if (selectedVariant) {
      // Save assignment
      this.assignUserToVariant(experimentId, selectedVariant.id);
      return selectedVariant.id;
    }

    return null;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async assignUserToVariant(experimentId: string, variantId: string) {
    const assignment: UserExperiment = {
      experimentId,
      variantId,
      enrolledAt: new Date(),
    };

    this.userExperiments.set(experimentId, assignment);

    // Save locally
    await AsyncStorage.setItem(
      'user_experiments',
      JSON.stringify(Object.fromEntries(this.userExperiments))
    );

    // Save to server
    if (this.userId) {
      try {
        await supabase.from('user_experiments').insert({
          user_id: this.userId,
          experiment_id: experimentId,
          variant_id: variantId,
          enrolled_at: assignment.enrolledAt.toISOString(),
        });
      } catch (error) {
        console.error('Failed to save experiment assignment:', error);
      }
    }
  }

  getExperimentConfig(experimentId: string): Record<string, any> | null {
    const variantId = this.getVariant(experimentId);
    if (!variantId) return null;

    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const variant = experiment.variants.find(v => v.id === variantId);
    return variant?.config || null;
  }

  async trackEvent(experimentId: string, metric: string, value: number = 1) {
    const assignment = this.userExperiments.get(experimentId);
    if (!assignment) return;

    const result: ExperimentResult = {
      experimentId,
      variantId: assignment.variantId,
      metric,
      value,
      timestamp: new Date(),
    };

    // Save locally first
    try {
      const key = `experiment_results_${experimentId}`;
      const stored = await AsyncStorage.getItem(key);
      const results = stored ? JSON.parse(stored) : [];
      results.push(result);
      
      // Keep only last 100 results locally
      if (results.length > 100) {
        results.shift();
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(results));
    } catch (error) {
      console.error('Failed to save experiment result locally:', error);
    }

    // Send to server
    if (this.userId) {
      try {
        await supabase.from('experiment_results').insert({
          user_id: this.userId,
          experiment_id: experimentId,
          variant_id: assignment.variantId,
          metric,
          value,
          timestamp: result.timestamp.toISOString(),
        });
      } catch (error) {
        console.error('Failed to track experiment event:', error);
      }
    }
  }

  // Feature flag helper
  isFeatureEnabled(featureName: string): boolean {
    const config = this.getExperimentConfig(featureName);
    return config?.enabled === true;
  }

  // Get all active experiments for debugging
  getActiveExperiments(): Experiment[] {
    return Array.from(this.experiments.values()).filter(
      exp => exp.status === 'active'
    );
  }

  // Get user's experiment assignments for debugging
  getUserExperiments(): UserExperiment[] {
    return Array.from(this.userExperiments.values());
  }

  // Force refresh experiments from server
  async refreshExperiments() {
    await this.fetchExperiments();
    await this.syncUserExperiments();
  }
}

// Export singleton instance
export default ABTestingService.getInstance();

// Export types for use in other files
export type { Experiment, Variant, UserExperiment, ExperimentResult };