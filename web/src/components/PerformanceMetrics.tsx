import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Metric {
  label: string;
  value: number;
  previousValue: number;
  format?: 'percentage' | 'number';
}

interface PerformanceMetricsProps {
  metrics?: Metric[];
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  const defaultMetrics: Metric[] = metrics || [
    { label: 'Match Rate', value: 72, previousValue: 68, format: 'percentage' },
    { label: 'Response Rate', value: 45, previousValue: 42, format: 'percentage' },
    { label: 'Profile Views', value: 234, previousValue: 198, format: 'number' },
    { label: 'Conversations Started', value: 18, previousValue: 15, format: 'number' }
  ];

  const getTrend = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return { icon: TrendingUp, color: 'text-green-600', value: change };
    if (change < 0) return { icon: TrendingDown, color: 'text-red-600', value: Math.abs(change) };
    return { icon: Minus, color: 'text-gray-600', value: 0 };
  };

  const formatValue = (value: number, format?: string) => {
    if (format === 'percentage') return `${value}%`;
    return value.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
      <div className="grid grid-cols-2 gap-4">
        {defaultMetrics.map((metric, index) => {
          const trend = getTrend(metric.value, metric.previousValue);
          const Icon = trend.icon;
          
          return (
            <div key={index} className="border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900">
                  {formatValue(metric.value, metric.format)}
                </p>
                <div className={`flex items-center space-x-1 ${trend.color}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {trend.value.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PerformanceMetrics;