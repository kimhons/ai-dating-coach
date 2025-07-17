import { PerformanceObserver } from 'react-native-performance';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

interface PerformanceReport {
  deviceInfo: {
    model: string;
    os: string;
    version: string;
    memory: number;
    battery: number;
  };
  metrics: {
    appStartup: number;
    screenTransitions: Record<string, number>;
    apiCalls: Record<string, { count: number; avgDuration: number }>;
    memoryUsage: number[];
    fps: number[];
    crashes: number;
    anrs: number; // Application Not Responding
  };
  userExperience: {
    sessionDuration: number;
    screenViews: Record<string, number>;
    interactions: Record<string, number>;
    errors: Array<{ type: string; count: number }>;
  };
}

class PerformanceMonitorService {
  private static instance: PerformanceMonitorService;
  private metrics: PerformanceMetric[] = [];
  private sessionStartTime: number;
  private screenTransitions: Map<string, number[]> = new Map();
  private apiCallMetrics: Map<string, number[]> = new Map();
  private fpsValues: number[] = [];
  private memorySnapshots: number[] = [];
  private observer?: PerformanceObserver;

  private constructor() {
    this.sessionStartTime = Date.now();
    this.initializePerformanceObserver();
    this.startMemoryMonitoring();
    this.startFPSMonitoring();
  }

  static getInstance(): PerformanceMonitorService {
    if (!PerformanceMonitorService.instance) {
      PerformanceMonitorService.instance = new PerformanceMonitorService();
    }
    return PerformanceMonitorService.instance;
  }

  private initializePerformanceObserver() {
    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric({
            name: entry.name,
            value: entry.duration,
            timestamp: Date.now(),
            context: { entryType: entry.entryType },
          });
        });
      });

      this.observer.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (error) {
      console.warn('Performance Observer not available:', error);
    }
  }

  private startMemoryMonitoring() {
    setInterval(async () => {
      try {
        const memoryInfo = await DeviceInfo.getUsedMemory();
        const totalMemory = await DeviceInfo.getTotalMemory();
        const memoryUsagePercent = (memoryInfo / totalMemory) * 100;
        
        this.memorySnapshots.push(memoryUsagePercent);
        if (this.memorySnapshots.length > 100) {
          this.memorySnapshots.shift();
        }

        // Alert if memory usage is high
        if (memoryUsagePercent > 80) {
          this.recordMetric({
            name: 'high_memory_usage',
            value: memoryUsagePercent,
            timestamp: Date.now(),
            context: { threshold: 80 },
          });
        }
      } catch (error) {
        console.warn('Memory monitoring error:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  private startFPSMonitoring() {
    let frameCount = 0;
    let lastTime = Date.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = Date.now();
      const elapsed = currentTime - lastTime;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        this.fpsValues.push(fps);
        
        if (this.fpsValues.length > 60) {
          this.fpsValues.shift();
        }

        // Alert if FPS drops below threshold
        if (fps < 30) {
          this.recordMetric({
            name: 'low_fps',
            value: fps,
            timestamp: currentTime,
            context: { threshold: 30 },
          });
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }

    // Persist critical metrics
    if (metric.name === 'crash' || metric.name === 'anr' || metric.name === 'error') {
      this.persistMetric(metric);
    }
  }

  private async persistMetric(metric: PerformanceMetric) {
    try {
      const stored = await AsyncStorage.getItem('performance_metrics');
      const metrics = stored ? JSON.parse(stored) : [];
      metrics.push(metric);
      
      // Keep only last 100 persisted metrics
      if (metrics.length > 100) {
        metrics.shift();
      }
      
      await AsyncStorage.setItem('performance_metrics', JSON.stringify(metrics));
    } catch (error) {
      console.warn('Failed to persist metric:', error);
    }
  }

  measureScreenTransition(fromScreen: string, toScreen: string, duration: number) {
    const key = `${fromScreen}->${toScreen}`;
    if (!this.screenTransitions.has(key)) {
      this.screenTransitions.set(key, []);
    }
    this.screenTransitions.get(key)!.push(duration);

    this.recordMetric({
      name: 'screen_transition',
      value: duration,
      timestamp: Date.now(),
      context: { from: fromScreen, to: toScreen },
    });
  }

  measureAPICall(endpoint: string, duration: number, success: boolean) {
    if (!this.apiCallMetrics.has(endpoint)) {
      this.apiCallMetrics.set(endpoint, []);
    }
    this.apiCallMetrics.get(endpoint)!.push(duration);

    this.recordMetric({
      name: 'api_call',
      value: duration,
      timestamp: Date.now(),
      context: { endpoint, success },
    });
  }

  async generateReport(): Promise<PerformanceReport> {
    const deviceInfo = {
      model: DeviceInfo.getModel(),
      os: DeviceInfo.getSystemName(),
      version: DeviceInfo.getSystemVersion(),
      memory: await DeviceInfo.getTotalMemory(),
      battery: await DeviceInfo.getBatteryLevel(),
    };

    const screenTransitionMetrics: Record<string, number> = {};
    this.screenTransitions.forEach((durations, transition) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      screenTransitionMetrics[transition] = Math.round(avg);
    });

    const apiMetrics: Record<string, { count: number; avgDuration: number }> = {};
    this.apiCallMetrics.forEach((durations, endpoint) => {
      apiMetrics[endpoint] = {
        count: durations.length,
        avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      };
    });

    const errorMetrics = this.metrics
      .filter(m => m.name === 'error')
      .reduce((acc, metric) => {
        const errorType = metric.context?.type || 'unknown';
        acc[errorType] = (acc[errorType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      deviceInfo,
      metrics: {
        appStartup: this.metrics.find(m => m.name === 'app_startup')?.value || 0,
        screenTransitions: screenTransitionMetrics,
        apiCalls: apiMetrics,
        memoryUsage: [...this.memorySnapshots],
        fps: [...this.fpsValues],
        crashes: this.metrics.filter(m => m.name === 'crash').length,
        anrs: this.metrics.filter(m => m.name === 'anr').length,
      },
      userExperience: {
        sessionDuration: Date.now() - this.sessionStartTime,
        screenViews: this.getScreenViewCounts(),
        interactions: this.getInteractionCounts(),
        errors: Object.entries(errorMetrics).map(([type, count]) => ({ type, count })),
      },
    };
  }

  private getScreenViewCounts(): Record<string, number> {
    return this.metrics
      .filter(m => m.name === 'screen_view')
      .reduce((acc, metric) => {
        const screen = metric.context?.screen || 'unknown';
        acc[screen] = (acc[screen] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
  }

  private getInteractionCounts(): Record<string, number> {
    return this.metrics
      .filter(m => m.name === 'user_interaction')
      .reduce((acc, metric) => {
        const action = metric.context?.action || 'unknown';
        acc[action] = (acc[action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
  }

  getAverageFPS(): number {
    if (this.fpsValues.length === 0) return 60;
    return Math.round(this.fpsValues.reduce((a, b) => a + b, 0) / this.fpsValues.length);
  }

  getMemoryUsage(): number {
    if (this.memorySnapshots.length === 0) return 0;
    return this.memorySnapshots[this.memorySnapshots.length - 1];
  }

  async uploadReport() {
    try {
      const report = await this.generateReport();
      // In production, send to analytics service
      console.log('Performance Report:', report);
      
      // Clear old metrics after upload
      this.metrics = this.metrics.slice(-100);
    } catch (error) {
      console.error('Failed to upload performance report:', error);
    }
  }
}

export default PerformanceMonitorService.getInstance();