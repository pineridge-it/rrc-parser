'use client';

import { useState } from 'react';
import { Permit } from '@/types/permit';

interface PermitDetailsTabsProps {
  permit: Permit;
}

export function PermitDetailsTabs({ permit }: PermitDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'status' | 'activity'>('general');

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('general')}
            className={`
              py-4 px-6 text-center border-b-2 font-medium text-sm
              ${activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            General Information
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`
              py-4 px-6 text-center border-b-2 font-medium text-sm
              ${activeTab === 'status'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Status History
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`
              py-4 px-6 text-center border-b-2 font-medium text-sm
              ${activeTab === 'activity'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Activity Timeline
          </button>
        </nav>
      </div>
      
      <div className="p-6">
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Permit Details</h3>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Permit Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{permit.permit_type || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">API Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{permit.api_number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Well Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{permit.well_number || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">District</dt>
                  <dd className="mt-1 text-sm text-gray-900">{permit.district || 'N/A'}</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Operator Information</h3>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Operator Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{permit.operator_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Operator Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{permit.operator_number || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lease Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{permit.lease_name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Field Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{permit.field_name || 'N/A'}</dd>
                </div>
              </dl>
            </div>
            
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dates</h3>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Filed Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {permit.filed_date 
                      ? new Date(permit.filed_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Updated Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {permit.updated_date 
                      ? new Date(permit.updated_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">County</dt>
                  <dd className="mt-1 text-sm text-gray-900">{permit.county}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
        
        {activeTab === 'status' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status History</h3>
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">No status history available</h4>
                <p className="mt-1 text-sm text-gray-500">Status history will be populated as permit status changes are recorded.</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Timeline</h3>
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">No activity recorded</h4>
                <p className="mt-1 text-sm text-gray-500">Activity timeline will be populated as events occur related to this permit.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}