import React from 'react';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UpgradePromptProps {
  currentTier: string;
  onUpgrade?: () => void;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ currentTier, onUpgrade }) => {
  if (currentTier !== 'free') return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg shadow-md p-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Crown className="h-6 w-6" />
            <h3 className="text-xl font-bold">Upgrade to Premium</h3>
          </div>
          <p className="text-white/90 mb-4">
            Unlock unlimited analyses, advanced features, and priority support!
          </p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">10x more analyses per month</span>
            </li>
            <li className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">Advanced AI coaching features</span>
            </li>
            <li className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">Priority support & faster processing</span>
            </li>
          </ul>
          <Link
            to="/pricing"
            onClick={onUpgrade}
            className="inline-flex items-center space-x-2 bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            <span>View Plans</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="hidden md:block">
          <div className="bg-white/20 rounded-full p-8">
            <Crown className="h-16 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;