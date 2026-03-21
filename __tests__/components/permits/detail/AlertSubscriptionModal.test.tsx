// __tests__/components/permits/detail/AlertSubscriptionModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AlertSubscriptionModal } from '@/components/permits/detail/AlertSubscriptionModal';
import { useAlertSubscriptions } from '@/hooks/useAlertSubscriptions';
import * as alertService from '@/services/alerts';

// Mock the useAlertSubscriptions hook
jest.mock('@/hooks/useAlertSubscriptions', () => ({
  useAlertSubscriptions: jest.fn(),
}));

// Mock the alert service functions
jest.mock('@/services/alerts', () => ({
  createAlertSubscription: jest.fn(),
  updateAlertSubscription: jest.fn(),
  deleteAlertSubscription: jest.fn(),
}));

const mockPermit = {
  id: '1',
  permit_number: '1234567890',
  permit_type: 'Drilling',
  operator_name: 'Sample Operator',
  operator_number: 'OP-12345',
  lease_name: 'Sample Lease',
  well_number: 'W-67890',
  county: 'Sample County',
  field_name: 'Sample Field',
  district: 'Sample District',
  status: 'Approved',
  filed_date: '2026-01-15',
  updated_date: '2026-01-20',
  api_number: '1234567890',
};

const mockSubscription = {
  id: 'sub-1',
  workspace_id: 'ws-1',
  user_id: 'user-1',
  name: 'Watch Sample Permit',
  trigger_type: 'permit_status_change',
  permit_api_number: '1234567890',
  saved_search_id: null,
  watched_statuses: ['approved', 'denied'],
  notify_channels: ['email'],
  is_active: true,
  created_at: '2026-01-15T10:30:00Z',
};

const mockUseAlertSubscriptions = {
  createSubscription: jest.fn(),
  updateSubscription: jest.fn(),
  deleteSubscription: jest.fn(),
  loading: false,
  error: null,
};

describe('AlertSubscriptionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAlertSubscriptions as jest.Mock).mockReturnValue(mockUseAlertSubscriptions);
  });

  it('renders correctly when open', () => {
    render(
      <AlertSubscriptionModal
        isOpen={true}
        onClose={jest.fn()}
        permit={mockPermit}
        onSuccess={jest.fn()}
      />
    );

    expect(screen.getByText('Watch This Permit')).toBeInTheDocument();
    expect(screen.getByLabelText('Alert Name')).toHaveValue('Watch 1234567890');
    expect(screen.getByText('Select All')).toBeInTheDocument();
  });

  it('renders correctly for existing subscription', () => {
    render(
      <AlertSubscriptionModal
        isOpen={true}
        onClose={jest.fn()}
        permit={mockPermit}
        existingSubscription={mockSubscription}
        onSuccess={jest.fn()}
      />
    );

    expect(screen.getByText('Update Alert Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Alert Name')).toHaveValue('Watch Sample Permit');
    
    // Check that watched statuses are pre-selected
    expect(screen.getByLabelText('Approved')).toBeChecked();
    expect(screen.getByLabelText('Denied')).toBeChecked();
    
    // Check that notification channels are pre-selected
    expect(screen.getByLabelText('Email')).toBeChecked();
    expect(screen.getByLabelText('In-App Notifications')).not.toBeChecked();
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = jest.fn();
    
    render(
      <AlertSubscriptionModal
        isOpen={true}
        onClose={onCloseMock}
        permit={mockPermit}
        onSuccess={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('validates form and shows error when no notification channels selected', async () => {
    render(
      <AlertSubscriptionModal
        isOpen={true}
        onClose={jest.fn()}
        permit={mockPermit}
        onSuccess={jest.fn()}
      />
    );

    // Deselect all notification channels
    fireEvent.click(screen.getByLabelText('Email'));
    fireEvent.click(screen.getByLabelText('In-App Notifications'));
    
    // Submit form
    fireEvent.click(screen.getByText('Create Alert'));
    
    await waitFor(() => {
      expect(screen.getByText('Please select at least one notification channel')).toBeInTheDocument();
    });
  });

  it('creates new subscription when form is submitted', async () => {
    const onSuccessMock = jest.fn();
    const createSubscriptionMock = jest.fn().mockResolvedValue({ id: 'new-sub' });
    
    (useAlertSubscriptions as jest.Mock).mockReturnValue({
      ...mockUseAlertSubscriptions,
      createSubscription: createSubscriptionMock,
    });

    render(
      <AlertSubscriptionModal
        isOpen={true}
        onClose={jest.fn()}
        permit={mockPermit}
        onSuccess={onSuccessMock}
      />
    );

    fireEvent.click(screen.getByText('Create Alert'));
    
    await waitFor(() => {
      expect(createSubscriptionMock).toHaveBeenCalledWith({
        name: 'Watch 1234567890',
        trigger_type: 'permit_status_change',
        permit_api_number: '1234567890',
        watched_statuses: [],
        notify_channels: ['email', 'in_app'],
      });
    });
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Alert created successfully!')).toBeInTheDocument();
    });
    
    // Wait for onSuccess to be called
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it('updates existing subscription when form is submitted', async () => {
    const onSuccessMock = jest.fn();
    const updateSubscriptionMock = jest.fn().mockResolvedValue({ id: 'sub-1' });
    
    (useAlertSubscriptions as jest.Mock).mockReturnValue({
      ...mockUseAlertSubscriptions,
      updateSubscription: updateSubscriptionMock,
    });

    render(
      <AlertSubscriptionModal
        isOpen={true}
        onClose={jest.fn()}
        permit={mockPermit}
        existingSubscription={mockSubscription}
        onSuccess={onSuccessMock}
      />
    );

    // Change subscription name
    fireEvent.change(screen.getByLabelText('Alert Name'), {
      target: { value: 'Updated Alert Name' },
    });
    
    fireEvent.click(screen.getByText('Update Alert'));
    
    await waitFor(() => {
      expect(updateSubscriptionMock).toHaveBeenCalledWith('sub-1', {
        name: 'Updated Alert Name',
        watched_statuses: ['approved', 'denied'],
        notify_channels: ['email'],
      });
    });
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Alert settings updated successfully!')).toBeInTheDocument();
    });
    
    // Wait for onSuccess to be called
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it('deletes subscription when unsubscribe button is clicked', async () => {
    const onSuccessMock = jest.fn();
    const deleteSubscriptionMock = jest.fn().mockResolvedValue(undefined);
    const confirmMock = jest.spyOn(window, 'confirm').mockImplementation(() => true);
    
    (useAlertSubscriptions as jest.Mock).mockReturnValue({
      ...mockUseAlertSubscriptions,
      deleteSubscription: deleteSubscriptionMock,
    });

    render(
      <AlertSubscriptionModal
        isOpen={true}
        onClose={jest.fn()}
        permit={mockPermit}
        existingSubscription={mockSubscription}
        onSuccess={onSuccessMock}
      />
    );

    fireEvent.click(screen.getByText('Unsubscribe'));
    
    await waitFor(() => {
      expect(deleteSubscriptionMock).toHaveBeenCalledWith('sub-1');
    });
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Alert created successfully!')).toBeInTheDocument();
    });
    
    // Wait for onSuccess to be called
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
    
    confirmMock.mockRestore();
  });

  it('shows error message when subscription creation fails', async () => {
    const createSubscriptionMock = jest.fn().mockRejectedValue(new Error('Failed to create'));
    
    (useAlertSubscriptions as jest.Mock).mockReturnValue({
      ...mockUseAlertSubscriptions,
      createSubscription: createSubscriptionMock,
    });

    render(
      <AlertSubscriptionModal
        isOpen={true}
        onClose={jest.fn()}
        permit={mockPermit}
        onSuccess={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('Create Alert'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to save subscription. Please try again.')).toBeInTheDocument();
    });
  });
});