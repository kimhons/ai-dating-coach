export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

export interface WebVitalMetric {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  id?: string;
  delta?: number;
}

class AnalyticsServiceClass {
  private initialized = false;

  initialize(): void {
    this.initialized = true;
    console.log('Analytics initialized');
  }

  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    
    // In production, this would send to analytics service
    console.log('Analytics Event:', eventName, properties);
    
    // Example: send to Google Analytics, Mixpanel, etc.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }
  }

  trackPageView(path: string): void {
    if (!this.initialized) return;
    
    console.log('Page View:', path);
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.VITE_GA_MEASUREMENT_ID, {
        page_path: path,
      });
    }
  }

  trackWebVital(metric: WebVitalMetric): void {
    if (!this.initialized) return;
    
    console.log('Web Vital:', metric);
    
    this.trackEvent('web_vital', {
      metric_name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
  }

  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) return;
    
    console.error('Analytics Error:', error, context);
    
    this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  setUser(userId: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    
    console.log('Set User:', userId, properties);
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.VITE_GA_MEASUREMENT_ID, {
        user_id: userId,
      });
    }
  }

  clearUser(): void {
    if (!this.initialized) return;
    
    console.log('Clear User');
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.VITE_GA_MEASUREMENT_ID, {
        user_id: null,
      });
    }
  }
}

export const AnalyticsService = new AnalyticsServiceClass();