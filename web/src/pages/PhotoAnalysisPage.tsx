import React from 'react'
import { Camera, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function PhotoAnalysisPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Photo Analysis</h1>
        <p className="text-gray-600">
          Get AI-powered feedback on your dating photos to maximize your appeal.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Photo</h2>
          <p className="text-gray-600 mb-6">
            Upload a photo to get instant AI feedback and optimization suggestions.
          </p>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
            <Upload className="w-4 h-4 mr-2" />
            Choose Photo
          </Button>
        </div>
      </div>
    </div>
  )
}
