import React from 'react'
import { Monitor } from 'lucide-react'

export function ScreenMonitoringPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Screen Monitoring</h1>
        <p className="text-gray-600">Real-time coaching while you browse dating apps.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Screen monitoring feature coming soon...</p>
        </div>
      </div>
    </div>
  )
}
