import React from 'react';
import { Camera, MessageSquare, Mic, Monitor, Upload } from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const actions = [
    {
      id: 'analyze_profile',
      label: 'Analyze Profile Photo',
      icon: Camera,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'analyze_conversation',
      label: 'Analyze Conversation',
      icon: MessageSquare,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'analyze_voice',
      label: 'Voice Analysis',
      icon: Mic,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'analyze_screenshot',
      label: 'Screenshot Analysis',
      icon: Monitor,
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onAction(action.id)}
              className={`${action.color} text-white rounded-lg p-4 flex flex-col items-center justify-center space-y-2 transition-colors`}
            >
              <Icon className="h-8 w-8" />
              <span className="text-sm font-medium text-center">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;