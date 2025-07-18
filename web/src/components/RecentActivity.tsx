import React from 'react';
import { Camera, MessageSquare, Mic, Monitor } from 'lucide-react';

interface Activity {
  id: string;
  type: 'photo' | 'conversation' | 'voice' | 'screen';
  timestamp: string;
  result: string;
  score?: number;
}

interface RecentActivityProps {
  activities: Activity[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'photo':
        return <Camera className="h-5 w-5" />;
      case 'conversation':
        return <MessageSquare className="h-5 w-5" />;
      case 'voice':
        return <Mic className="h-5 w-5" />;
      case 'screen':
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: Activity['type']) => {
    switch (type) {
      case 'photo':
        return 'Photo Analysis';
      case 'conversation':
        return 'Conversation Analysis';
      case 'voice':
        return 'Voice Analysis';
      case 'screen':
        return 'Screenshot Analysis';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="bg-gray-100 rounded-full p-2">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {getTypeLabel(activity.type)}
                  </p>
                  {activity.score && (
                    <span className="text-sm font-semibold text-orange-600">
                      {activity.score}/10
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{activity.result}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTimestamp(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;