import React from 'react'
import { TrendingUp } from 'lucide-react'

export function ProgressPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Tracking</h1>
        <p className="text-gray-600">Track your dating success and improvements.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Progress tracking feature coming soon...</p>
        </div>
      </div>
    </div>
  )
}
