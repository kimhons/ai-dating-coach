import React from 'react';
import { Camera, MessageSquare, Mic, Monitor } from 'lucide-react';

interface UsageData {
  photos: { used: number; limit: number };
  conversations: { used: number; limit: number };
  voice: { used: number; limit: number };
  screenshots: { used: number; limit: number };
}

interface TierUsageWidgetProps {
  usage: UsageData;
  tier: string;
}

const TierUsageWidget: React.FC<TierUsageWidgetProps> = ({ usage, tier }) => {
  const getPercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const usageItems = [
    { key: 'photos', label: 'Photo Analyses', icon: Camera, data: usage.photos },
    { key: 'conversations', label: 'Conversations', icon: MessageSquare, data: usage.conversations },
    { key: 'voice', label: 'Voice Analyses', icon: Mic, data: usage.voice },
    { key: 'screenshots', label: 'Screenshots', icon: Monitor, data: usage.screenshots }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Usage This Month</h3>
        <span className="text-sm font-medium text-gray-600 capitalize">{tier} Plan</span>
      </div>
      <div className="space-y-4">
        {usageItems.map((item) => {
          const Icon = item.icon;
          const percentage = getPercentage(item.data.used, item.data.limit);
          const isUnlimited = item.data.limit === -1;
          
          return (
            <div key={item.key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {item.data.used} / {isUnlimited ? '∞' : item.data.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                {!isUnlimited && (
                  <div
                    className={`${getUsageColor(percentage)} rounded-full h-2 transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {tier === 'free' && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Upgrade to Premium for higher limits and more features!
          </p>
        </div>
      )}
    </div>
  );
};

export default TierUsageWidget;