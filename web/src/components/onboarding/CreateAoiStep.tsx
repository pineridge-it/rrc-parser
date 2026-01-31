'use client'

import { useOnboarding } from './OnboardingContext'
import { useState } from 'react'

export default function CreateAoiStep() {
  const { completeStep, skipStep, setFirstAoiId } = useOnboarding()
  const [aoiName, setAoiName] = useState('')
  const [drawingMode, setDrawingMode] = useState<'draw' | 'county'>('draw')

  const handleContinue = () => {
    // In a real implementation, this would create an actual AOI
    // For now, we'll just simulate it
    const fakeAoiId = 'aoi-' + Date.now()
    setFirstAoiId(fakeAoiId)
    completeStep('create_aoi')
  }

  const handleSkip = () => {
    skipStep('create_aoi')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Your First Area of Interest</h1>
        <p className="text-gray-600">
          Define the geographic area you want to monitor for drilling permits.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6">
          <label htmlFor="aoi-name" className="block text-sm font-medium text-gray-700 mb-1">
            Area Name
          </label>
          <input
            type="text"
            id="aoi-name"
            value={aoiName}
            onChange={(e) => setAoiName(e.target.value)}
            placeholder="e.g., Permian Basin, My Ranch, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How would you like to define your area?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setDrawingMode('draw')}
              className={`p-4 border rounded-lg text-left ${
                drawingMode === 'draw'
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-indigo-100 rounded-md p-2">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Draw on Map</h3>
                  <p className="text-xs text-gray-500">Draw a polygon directly on the map</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDrawingMode('county')}
              className={`p-4 border rounded-lg text-left ${
                drawingMode === 'county'
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-green-100 rounded-md p-2">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Select County</h3>
                  <p className="text-xs text-gray-500">Choose from Texas counties</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Popular Areas</h3>
          <div className="flex flex-wrap gap-2">
            {['Permian Basin', 'Eagle Ford Shale', 'Barnett Shale', 'Haynesville Shale'].map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setAoiName(area)}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleSkip}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Skip for now
          </button>
          <button
            onClick={handleContinue}
            disabled={!aoiName.trim()}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              aoiName.trim()
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-indigo-400 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}