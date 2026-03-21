// __tests__/components/permits/detail/PermitDetailHeader.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PermitDetailHeader } from '@/components/permits/detail/PermitDetailHeader';
import { AlertSubscription } from '@/types/alert';
import * as alertService from '@/services/alerts';

// Mock the alert service functions
jest.mock('@/services/alerts', () => ({
  fetchAlertSubscriptions: jest.fn(),
  createAlertSubscription: jest.fn(),
  deleteAlertSubscription: jest.fn(),
}));

// Mock the WatchPermitButton and AlertSubscriptionModal components
jest.mock('@/components/permits/detail/WatchPermitButton', () => ({
  WatchPermitButton: ({ isSubscribed, onClick, loading }: any) => (
    <button 
      onClick={onClick} 
      disabled={loading}
      data-testid="watch-button"
      data-subscribed={isSubscribed}
    >
      {isSubscribed ? 'Watching' : 'Watch This Permit'}
    </button>
  ),
}));

jest.mock('@/components/permits/detail/AlertSubscriptionModal', () => ({
  AlertSubscriptionModal: ({ isOpen, onClose, permit, existingSubscription, onSuccess }: any) => (
    isOpen ? (
      <div data-testid="subscription-modal">
        <button onClick={onClose}>Close Modal</button>
        <button onClick={onSuccess}>Simulate Success</button>
      </div>
    ) : null
  ),
}));

// Mock the PermitStatusBadge component
jest.mock('@/components/permits/detail/PermitStatusBadge', () => ({
  PermitStatusBadge: ({ status }: any) => <span data-testid="status-badge">{status}</span>,
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

const mockSubscription: AlertSubscription = {
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
};

describe('PermitDetailHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders permit information correctly', () => {
    (alertService.fetchAlertSubscriptions as jest.Mock).mockResolvedValue([]);
    
    render(<PermitDetailHeader permit={mockPermit} />);
    
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Approved');
    expect(screen.getByText('Sample Operator')).toBeInTheDocument();
    expect(screen.getByText('Sample County, Sample Field')).toBeInTheDocument();
  });

  it('shows "Watch This Permit" button when not subscribed', async () => {
    (alertService.fetchAlertSubscriptions as jest.Mock).mockResolvedValue([]);
    
    render(<PermitDetailHeader permit={mockPermit} />);
    
    await waitFor(() => {
      const watchButton = screen.getByTestId('watch-button');
      expect(watchButton).toBeInTheDocument();
      expect(watchButton).toHaveAttribute('data-subscribed', 'false');
      expect(watchButton).toHaveTextContent('Watch This Permit');
    });
  });

  it('shows "Watching" button when subscribed', async () => {
    (alertService.fetchAlertSubscriptions as jest.Mock).mockResolvedValue([mockSubscription]);
    
    render(<PermitDetailHeader permit={mockPermit} />);
    
    await waitFor(() => {
      const watchButton = screen.getByTestId('watch-button');
      expect(watchButton).toBeInTheDocument();
      expect(watchButton).toHaveAttribute('data-subscribed', 'true');
      expect(watchButton).toHaveTextContent('Watching');
    });
  });

  it('opens subscription modal when watch button is clicked', async () => {
    (alertService.fetchAlertSubscriptions as jest.Mock).mockResolvedValue([]);
    
    render(<PermitDetailHeader permit={mockPermit} />);
    
    await waitFor(() => {
      const watchButton = screen.getByTestId('watch-button');
      fireEvent.click(watchButton);
    });
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('subscription-modal')).toBeInTheDocument();
    });
  });

  it('handles subscription status check error gracefully', async () => {
    (alertService.fetchAlertSubscriptions as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));
    
    render(<PermitDetailHeader permit={mockPermit} />);
    
    // Should still render the permit information even if subscription check fails
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Approved');
  });
});