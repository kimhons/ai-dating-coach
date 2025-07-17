import React from 'react'
import { Mic } from 'lucide-react'

export function VoiceAnalysisPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Analysis</h1>
        <p className="text-gray-600">Elite tier voice confidence coaching.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Mic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Voice analysis feature coming soon...</p>
        </div>
      </div>
    </div>
  )
}
