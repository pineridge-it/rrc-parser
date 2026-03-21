// hooks/useAlertSubscriptions.ts
import { useState, useEffect, useCallback } from 'react';
import { AlertSubscription } from '@/types/alert';
import {
  fetchAlertSubscriptions,
  createAlertSubscription,
  updateAlertSubscription,
  deleteAlertSubscription
} from '@/services/alerts';
import { AlertSubscriptionCreateInput, AlertSubscriptionUpdateInput } from '@/types/alert';

interface UseAlertSubscriptionsReturn {
  subscriptions: AlertSubscription[];
  loading: boolean;
  error: string | null;
  fetchSubscriptions: () => Promise<void>;
  createSubscription: (input: AlertSubscriptionCreateInput) => Promise<AlertSubscription>;
  updateSubscription: (id: string, input: AlertSubscriptionUpdateInput) => Promise<AlertSubscription>;
  deleteSubscription: (id: string) => Promise<void>;
  isSubscribedToPermit: (permitApiNumber: string) => boolean;
  getSubscriptionForPermit: (permitApiNumber: string) => AlertSubscription | null;
}

export function useAlertSubscriptions(): UseAlertSubscriptionsReturn {
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAlertSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscriptions';
      setError(errorMessage);
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubscription = useCallback(async (input: AlertSubscriptionCreateInput) => {
    try {
      setLoading(true);
      setError(null);
      const newSubscription = await createAlertSubscription(input);
      setSubscriptions(prev => [...prev, newSubscription]);
      return newSubscription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subscription';
      setError(errorMessage);
      console.error('Error creating subscription:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSubscription = useCallback(async (id: string, input: AlertSubscriptionUpdateInput) => {
    try {
      setLoading(true);
      setError(null);
      const updatedSubscription = await updateAlertSubscription(id, input);
      setSubscriptions(prev =>
        prev.map(sub => sub.id === id ? updatedSubscription : sub)
      );
      return updatedSubscription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update subscription';
      setError(errorMessage);
      console.error('Error updating subscription:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSubscription = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteAlertSubscription(id);
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete subscription';
      setError(errorMessage);
      console.error('Error deleting subscription:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const isSubscribedToPermit = useCallback((permitApiNumber: string) => {
    return subscriptions.some(
      sub => sub.trigger_type === 'permit_status_change' &&
             sub.permit_api_number === permitApiNumber
    );
  }, [subscriptions]);

  const getSubscriptionForPermit = useCallback((permitApiNumber: string) => {
    return subscriptions.find(
      sub => sub.trigger_type === 'permit_status_change' &&
             sub.permit_api_number === permitApiNumber
    ) || null;
  }, [subscriptions]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return {
    subscriptions,
    loading,
    error,
    fetchSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    isSubscribedToPermit,
    getSubscriptionForPermit,
  };
}