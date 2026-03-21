'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAlertSubscriptions } from '@/hooks/useAlertSubscriptions';
import { AlertSubscription } from '@/types/alert';
import { formatDate } from '@/utils/date';

export default function AlertsDashboardPage() {
  const router = useRouter();
  const { subscriptions, loading, error, fetchSubscriptions, deleteSubscription } = useAlertSubscriptions();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this alert subscription?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteSubscription(id);
    } catch (err) {
      console.error('Failed to delete subscription:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id: string) => {
    // For permit status change alerts, navigate to the permit detail page
    const subscription = subscriptions.find(sub => sub.id === id);
    if (subscription && subscription.permit_api_number) {
      router.push(`/permits/${subscription.permit_api_number}`);
    }
  };

  const getStatusChangeDescription = (subscription: AlertSubscription) => {
    if (subscription.trigger_type !== 'permit_status_change') {
      return 'Unknown trigger';
    }

    if (subscription.watched_statuses.length === 0) {
      return 'All status changes';
    }

    return subscription.watched_statuses
      .map(status => status.charAt(0).toUpperCase() + status.slice(1))
      .join(', ');
  };

  const getNotificationChannels = (subscription: AlertSubscription) => {
    return subscription.notify_channels
      .map(channel => channel === 'email' ? 'Email' : 'In-App')
      .join(', ');
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Alert Subscriptions</h1>
        <p className="mt-2 text-gray-600">
          Manage your alert subscriptions and notification preferences
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No alert subscriptions</h3>
            <p className="mt-1 text-gray-500">
              Get started by creating alert subscriptions for permits you want to monitor.
            </p>
            <div className="mt-6">
              <a
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Permits
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Active Subscriptions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trigger
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notifications
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{subscription.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {subscription.trigger_type === 'permit_status_change' ? 'Permit Status' : 'Search Results'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {subscription.trigger_type === 'permit_status_change' 
                          ? getStatusChangeDescription(subscription)
                          : 'New results'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {getNotificationChannels(subscription)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(subscription.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(subscription.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(subscription.id)}
                        disabled={deletingId === subscription.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deletingId === subscription.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}