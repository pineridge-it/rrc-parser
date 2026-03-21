'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Permit } from '@/types/permit';
import { fetchPermitByApiNumber } from '@/services/permits';
import { PermitDetailHeader } from '@/components/permits/detail/PermitDetailHeader';
import { PermitMapSection } from '@/components/permits/detail/PermitMapSection';
import { PermitDetailsTabs } from '@/components/permits/detail/PermitDetailsTabs';

export default function PermitDetailPage() {
  const params = useParams();
  const { api_number } = params;
  const [permit, setPermit] = useState<Permit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermitData = async () => {
      try {
        setLoading(true);
        const data = await fetchPermitByApiNumber(api_number as string);
        setPermit(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load permit data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (api_number) {
      fetchPermitData();
    }
  }, [api_number]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="ml-3 text-lg font-medium text-red-800">Error Loading Permit</h3>
          </div>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!permit) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="ml-3 text-lg font-medium text-yellow-800">Permit Not Found</h3>
          </div>
          <div className="mt-2 text-sm text-yellow-700">
            <p>No permit found with API number: {api_number}</p>
          </div>
          <div className="mt-4">
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <PermitDetailHeader
        permit={permit}
        onAnnotateClick={() => setIsAnnotationPanelOpen(true)}
      />
      <PermitMapSection permit={permit} />
      <PermitDetailsTabs permit={permit} />

      {/* Annotation Panel */}
      <AnnotationPanel
        permitApiNumber={permit.api_number}
        isOpen={isAnnotationPanelOpen}
        onClose={() => setIsAnnotationPanelOpen(false)}
      />
    </div>
  );
}