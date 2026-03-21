'use client';

import { useState } from 'react';
import { Permit } from '@/types/permit';
import { AlertSubscription } from '@/types/alert';
import { 
  createAlertSubscription, 
  updateAlertSubscription 
} from '@/services/alerts';

interface AlertSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  permit: Permit;
  existingSubscription?: AlertSubscription | null;
  onSuccess: () => void;
}

export function AlertSubscriptionModal({ 
  isOpen, 
  onClose, 
  permit,
  existingSubscription,
  onSuccess
}: AlertSubscriptionModalProps) {
  const [subscriptionName, setSubscriptionName] = useState(
    existingSubscription?.name || `Watch ${permit.permit_number}`
  );
  
  const [watchedStatuses, setWatchedStatuses] = useState<string[]>(
    existingSubscription?.watched_statuses || []
  );
  
  const [notifyChannels, setNotifyChannels] = useState<string[]>(
    existingSubscription?.notify_channels || ['email', 'in_app']
  );
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const statusOptions = [
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'denied', label: 'Denied' },
    { value: 'amendment', label: 'Amendment' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
  
  const channelOptions = [
    { value: 'email', label: 'Email' },
    { value: 'in_app', label: 'In-App Notifications' },
  ];
  
  const handleStatusChange = (status: string) => {
    if (watchedStatuses.includes(status)) {
      setWatchedStatuses(watchedStatuses.filter(s => s !== status));
    } else {
      setWatchedStatuses([...watchedStatuses, status]);
    }
  };
  
  const handleChannelChange = (channel: string) => {
    if (notifyChannels.includes(channel)) {
      setNotifyChannels(notifyChannels.filter(c => c !== channel));
    } else {
      setNotifyChannels([...notifyChannels, channel]);
    }
  };
  
  const handleSelectAllStatuses = () => {
    if (watchedStatuses.length === statusOptions.length) {
      // If all are selected, deselect all
      setWatchedStatuses([]);
    } else {
      // If not all are selected, select all
      setWatchedStatuses(statusOptions.map(option => option.value));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (notifyChannels.length === 0) {
      setError('Please select at least one notification channel');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (existingSubscription) {
        // Update existing subscription
        await updateAlertSubscription(existingSubscription.id, {
          name: subscriptionName,
          watched_statuses: watchedStatuses,
          notify_channels: notifyChannels,
        });
      } else {
        // Create new subscription
        await createSubscription({
          name: subscriptionName,
          trigger_type: 'permit_status_change',
          permit_api_number: permit.api_number,
          watched_statuses: watchedStatuses,
          notify_channels: notifyChannels,
        });
      }

      setShowSuccess(true);

      // Close modal after a short delay to show success message
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      // Error is already handled by the hook, but we can show a user-friendly message
      setLocalError('Failed to save subscription. Please try again.');
      console.error(err);
    }
  };
  
  const handleUnsubscribe = async () => {
    if (!existingSubscription) return;
    
    if (window.confirm('Are you sure you want to unsubscribe from alerts for this permit?')) {
      setLoading(true);
      setError(null);
      
      try {
        await fetch(`/api/alerts/${existingSubscription.id}`, {
          method: 'DELETE',
        });
        
        onSuccess();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div 
            className="absolute inset-0 bg-gray-500 opacity-75"
            onClick={onClose}
          ></div>
        </div>
        
        {/* Modal container */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {existingSubscription ? 'Update Alert Settings' : 'Watch This Permit'}
                  </h3>
                  <div className="mt-2 space-y-4">
                    <div>
                      <label htmlFor="subscription-name" className="block text-sm font-medium text-gray-700">
                        Alert Name
                      </label>
                      <input
                        type="text"
                        id="subscription-name"
                        value={subscriptionName}
                        onChange={(e) => setSubscriptionName(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder={`e.g., Watch ${permit.permit_number}`}
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                          Status Changes to Watch
                        </label>
                        <button
                          type="button"
                          onClick={handleSelectAllStatuses}
                          className="text-sm text-blue-600 hover:text-blue-500"
                        >
                          {watchedStatuses.length === statusOptions.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {statusOptions.map((option) => (
                          <div key={option.value} className="flex items-center">
                            <input
                              id={`status-${option.value}`}
                              name="status-changes"
                              type="checkbox"
                              checked={watchedStatuses.includes(option.value)}
                              onChange={() => handleStatusChange(option.value)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`status-${option.value}`} className="ml-2 block text-sm text-gray-700">
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Notification Channels
                      </label>
                      <div className="mt-2 space-y-2">
                        {channelOptions.map((option) => (
                          <div key={option.value} className="flex items-center">
                            <input
                              id={`channel-${option.value}`}
                              name="notification-channels"
                              type="checkbox"
                              checked={notifyChannels.includes(option.value)}
                              onChange={() => handleChannelChange(option.value)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`channel-${option.value}`} className="ml-2 block text-sm text-gray-700">
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? 'Saving...' : (existingSubscription ? 'Update Alert' : 'Create Alert')}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              
              {existingSubscription && (
                <button
                  type="button"
                  onClick={handleUnsubscribe}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Unsubscribe
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}