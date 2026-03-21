'use client';

import { Permit } from '@/types/permit';

interface PermitMapSectionProps {
  permit: Permit;
}

export function PermitMapSection({ permit }: PermitMapSectionProps) {
  // Placeholder for map implementation
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Permit Location</h2>
      <div className="bg-gray-100 border-2 border-dashed rounded-xl w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Map Visualization</h3>
          <p className="mt-1 text-sm text-gray-500">Map showing permit location and buffer zone</p>
        </div>
      </div>
    </div>
  );
}