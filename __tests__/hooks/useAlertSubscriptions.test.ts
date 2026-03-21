// __tests__/hooks/useAlertSubscriptions.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAlertSubscriptions } from '@/hooks/useAlertSubscriptions';
import * as alertService from '@/services/alerts';

// Mock the alert service functions
jest.mock('@/services/alerts', () => ({
  fetchAlertSubscriptions: jest.fn(),
  createAlertSubscription: jest.fn(),
  updateAlertSubscription: jest.fn(),
  deleteAlertSubscription: jest.fn(),
}));

const mockSubscriptions = [
  {
    id: 'sub-1',
    workspace_id: 'ws-1',
    user_id: 'user-1',
    name: 'Watch Sample Permit',
    trigger_type: 'permit_status_change',
    permit_api_number: '1234567890',
    saved_search_id: null,
    watched_statuses: [],
    notify_channels: ['email', 'in_app'],
    is_active: true,
    created_at: '2026-01-15T10:30:00Z',
  },
  {
    id: 'sub-2',
    workspace_id: 'ws-1',
    user_id: 'user-1',
    name: 'Watch Search Results',
    trigger_type: 'search_result_change',
    permit_api_number: null,
    saved_search_id: 'search-1',
    watched_statuses: [],
    notify_channels: ['email'],
    is_active: true,
    created_at: '2026-01-16T10:30:00Z',
  },
];

describe('useAlertSubscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches subscriptions on mount', async () => {
    (alertService.fetchAlertSubscriptions as jest.Mock).mockResolvedValue(mockSubscriptions);
    
    const { result } = renderHook(() => useAlertSubscriptions());
    
    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.subscriptions).toEqual(mockSubscriptions);
    expect(alertService.fetchAlertSubscriptions).toHaveBeenCalledTimes(1);
  });

  it('handles fetch subscriptions error', async () => {
    (alertService.fetchAlertSubscriptions as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));
    
    const { result } = renderHook(() => useAlertSubscriptions());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to fetch subscriptions');
    expect(result.current.subscriptions).toEqual([]);
  });

  it('creates a new subscription', async () => {
    const newSubscription = {
      ...mockSubscriptions[0],
      id: 'sub-3',
      name: 'New Subscription',
    };
    
    (alertService.fetchAlertSubscriptions as jest.Mock).mockResolvedValue(mockSubscriptions);
    (alertService.createAlertSubscription as jest.Mock).mockResolvedValue(newSubscription);
    
    const { result } = renderHook(() => useAlertSubscriptions());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      await result.current.createSubscription({
        name: 'New Subscription',
        trigger_type: 'permit_status_change',
        permit_api_number: '0987654321',
        watched_statuses: [],
        notify_channels: ['email'],
      });
    });
    
    expect(alertService.createAlertSubscription).toHaveBeenCalledTimes(1);
    expect(result.current.subscriptions).toContainEqual(newSubscription);
    expect(result.current.subscriptions).toHaveLength(3);
  });

  it('handles create subscription error', async () => {
    (alertService.fetchAlertSubscriptions as jest.Mock).mockResolvedValue(mockSubscriptions);
    (alertService.createAlertSubscription as jest.Mock).mockRejectedValue(new Error('Failed to create'));
    
    const { result } = renderHook(() => useAlertSubscriptions());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await expect(
      act(async () => {
        await result.current.createSubscription({
          name: 'New Subscription',
          trigger_type: 'permit_status_change',
          permit_api_number: '0987654321',
          watched_statuses: [],
          notify_channels: ['email'],
        });
      })
    ).rejects.toThrow('Failed to create subscription');
    
    expect(result.current.error).toBe('Failed to create subscription');
  });

  it('updates an existing subscription', async () => {
    const updatedSubscription = {
      ...mockSubscriptions[0],
      name: 'Updated Subscription',
    };
    
    (alertService.fetchAlertSubscriptions as jest.Mock).mockResolvedValue(mockSubscriptions);
    (alertService.updateAlertSubscription as jest.Mock).mockResolvedValue(updatedSubscription);
    
    const { result } = renderHook(() => useAlertSubscriptions());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      await result.current.updateSubscription('sub-1', {
        name: 'Updated Subscription',
      });
    });
    
    expect(alertService.updateAlertSubscription).toHaveBeenCalledTimes(1);
    expect(result.current.subscriptions).toContainEqual(updatedSubscription);
    expect(result.current.subscriptions).toHaveLength(2);
  });

  it('deletes a subscription', async () => {
    (alertService.fetchAlertSubscriptions as jest.Mock).mockResolvedValue(mockSubscriptions);
    (alertService.deleteAlertSubscription as jest.Mock).mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAlertSubscriptions());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      await result.current.deleteSubscription('sub-1');
    });
    
    expect(alertService.deleteAlertSubscription).toHaveBeenCalledTimes(1);
    expect(result.current.subscriptions).toHaveLength(1);
    expect(result.current.subscriptions).not.toContainEqual(mockSubscriptions[0]);
  });

  it('checks if subscribed to a permit', async () => {
    (alertService.fetchAlertSubscriptions as jest.Mock).mockResolvedValue(mockSubscriptions);
    
    const { result } = renderHook(() => useAlertSubscriptions());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.isSubscribedToPermit('1234567890')).toBe(true);
    expect(result.current.isSubscribedToPermit('0987654321')).toBe(false);
  });

  it('gets subscription for a permit', async () => {
    (alertService.fetchAlertSubscriptions as jest.Mock).mockResolvedValue(mockSubscriptions);
    
    const { result } = renderHook(() => useAlertSubscriptions());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.getSubscriptionForPermit('1234567890')).toEqual(mockSubscriptions[0]);
    expect(result.current.getSubscriptionForPermit('0987654321')).toBeNull();
  });
});