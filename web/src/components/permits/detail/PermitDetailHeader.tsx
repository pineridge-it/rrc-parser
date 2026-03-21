'use client';

import { useState } from 'react';
import { Permit } from '@/types/permit';
import { WatchPermitButton } from './WatchPermitButton';
import { PermitStatusBadge } from './PermitStatusBadge';
import { AlertSubscriptionModal } from './AlertSubscriptionModal';
import { useAlertSubscriptions } from '@/hooks/useAlertSubscriptions';
import { AlertSubscription } from '@/types/alert';

interface PermitDetailHeaderProps {
  permit: Permit;
  onAnnotateClick?: () => void;
}

export function PermitDetailHeader({ permit }: PermitDetailHeaderProps) {
  const {
    isSubscribedToPermit,
    getSubscriptionForPermit,
    loading: subscriptionsLoading
  } = useAlertSubscriptions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubscribed = isSubscribedToPermit(permit.api_number);
  const existingSubscription = getSubscriptionForPermit(permit.api_number);

  const handleSubscribe = async () => {
    // Open modal for configuration
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    // The useAlertSubscriptions hook will automatically refresh the subscriptions
    // No need to do anything here as the component will re-render with updated data
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{permit.permit_number}</h1>
              <PermitStatusBadge status={permit.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h2 className="text-sm font-medium text-gray-500">Operator</h2>
                <p className="mt-1 text-sm text-gray-900">{permit.operator_name || 'N/A'}</p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">Filed Date</h2>
                <p className="mt-1 text-sm text-gray-900">
                  {permit.filed_date ? new Date(permit.filed_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">Lease Name</h2>
                <p className="mt-1 text-sm text-gray-900">{permit.lease_name || 'N/A'}</p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">County</h2>
                <p className="mt-1 text-sm text-gray-900">{permit.county || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {onAnnotateClick && (
              <button
                type="button"
                onClick={onAnnotateClick}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Annotate
              </button>
            )}
            <WatchPermitButton
              permitApiNumber={permit.api_number}
              isSubscribed={isSubscribed}
              existingSubscription={existingSubscription}
              onSubscribe={handleSubscribe}
              loading={subscriptionsLoading}
            />
          </div>
        </div>
      </div>
                <h2 className="text-sm font-medium text-gray-500">Location</h2>
                <p className="text-sm text-gray-900">
                  {permit.county}, {permit.field_name || 'N/A'}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500">Filed Date</h2>
                <p className="text-sm text-gray-900">
                  {permit.filed_date
                    ? new Date(permit.filed_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <WatchPermitButton
              isSubscribed={isSubscribed}
              onClick={handleSubscribe}
              loading={subscriptionsLoading}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      <AlertSubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        permit={permit}
        existingSubscription={existingSubscription}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}