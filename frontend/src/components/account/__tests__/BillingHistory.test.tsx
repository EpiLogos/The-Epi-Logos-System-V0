/**
 * BillingHistory Component Tests
 * RED Phase - These tests will fail until component is implemented
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Jest globals available
import BillingHistory from '../BillingHistory';

// Mock billing data
const mockBillingHistory = [
  {
    id: 'inv-001',
    date: new Date('2025-01-01'),
    amount: 1200, // $12.00
    currency: 'usd',
    status: 'paid' as const,
    description: 'Patron Tier Subscription',
    invoiceUrl: 'https://stripe.com/invoices/inv-001',
    paymentMethod: 'Visa ending in 4242',
  },
  {
    id: 'inv-002',
    date: new Date('2024-12-01'),
    amount: 1200,
    currency: 'usd',
    status: 'paid' as const,
    description: 'Patron Tier Subscription',
    invoiceUrl: 'https://stripe.com/invoices/inv-002',
    paymentMethod: 'Visa ending in 4242',
  },
  {
    id: 'inv-003',
    date: new Date('2024-11-01'),
    amount: 1200,
    currency: 'usd',
    status: 'failed' as const,
    description: 'Patron Tier Subscription',
    invoiceUrl: null,
    paymentMethod: 'Visa ending in 4242',
    failureReason: 'Card declined',
  },
];

const mockProps = {
  userId: 'user-123',
  pageSize: 10,
  showDownloads: true,
};

// Mock fetch for API calls
global.fetch = jest.fn();

describe('BillingHistory Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        history: mockBillingHistory,
        totalCount: 3,
        currentPage: 1,
        hasMore: false,
      }),
    });
  });

  describe('Initial Load', () => {
    it('should render billing history table', async () => {
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('should display billing history data correctly', async () => {
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument();
        expect(screen.getByText('Patron Tier Subscription')).toBeInTheDocument();
        expect(screen.getByText('$12.00')).toBeInTheDocument();
        expect(screen.getByText('Paid')).toBeInTheDocument();
      });
    });

    it('should show failed payment status with reason', async () => {
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeInTheDocument();
        expect(screen.getByText('Card declined')).toBeInTheDocument();
      });
    });
  });

  describe('Invoice Downloads', () => {
    it('should show download button for paid invoices', async () => {
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(() => {
        const downloadButtons = screen.getAllByRole('button', { name: /download invoice/i });
        expect(downloadButtons).toHaveLength(2); // Only for paid invoices
      });
    });

    it('should not show download button for failed payments', async () => {
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(() => {
        const failedRow = screen.getByText('Card declined').closest('tr');
        expect(failedRow).not.toContain(screen.queryByRole('button', { name: /download invoice/i }));
      });
    });

    it('should handle invoice download click', async () => {
      const user = userEvent.setup();
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(async () => {
        const downloadButton = screen.getAllByRole('button', { name: /download invoice/i })[0];
        await user.click(downloadButton);
        
        // Should open invoice URL in new tab
        expect(window.open).toHaveBeenCalledWith('https://stripe.com/invoices/inv-001', '_blank');
      });
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          history: mockBillingHistory,
          totalCount: 25,
          currentPage: 1,
          hasMore: true,
        }),
      });
    });

    it('should show pagination controls when there are more pages', async () => {
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });
    });

    it('should handle next page click', async () => {
      const user = userEvent.setup();
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(async () => {
        const nextButton = screen.getByRole('button', { name: /next page/i });
        await user.click(nextButton);
        
        expect(fetch).toHaveBeenCalledWith('/api/billing/history?page=2&pageSize=10', expect.any(Object));
      });
    });

    it('should disable previous button on first page', async () => {
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous page/i });
        expect(prevButton).toBeDisabled();
      });
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          history: [],
          totalCount: 0,
          currentPage: 1,
          hasMore: false,
        }),
      });
    });

    it('should show empty state when no billing history', async () => {
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/no billing history/i)).toBeInTheDocument();
        expect(screen.getByText(/when you make payments/i)).toBeInTheDocument();
      });
    });

    it('should show upgrade suggestion in empty state for free users', async () => {
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upgrade to patron/i })).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      (fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    });

    it('should show loading state while fetching data', () => {
      render(<BillingHistory {...mockProps} />);
      
      expect(screen.getByText(/loading billing history/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show skeleton rows during loading', () => {
      render(<BillingHistory {...mockProps} />);
      
      const skeletonRows = screen.getAllByTestId('skeleton-row');
      expect(skeletonRows).toHaveLength(5); // Show 5 skeleton rows
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (fetch as any).mockRejectedValue(new Error('Network error'));
    });

    it('should display error message when API fails', async () => {
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load billing history/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('should retry loading when retry button is clicked', async () => {
      const user = userEvent.setup();
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(async () => {
        const retryButton = screen.getByRole('button', { name: /try again/i });
        await user.click(retryButton);
        
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should stack columns on mobile view', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
      render(<BillingHistory {...mockProps} />);
      
      expect(screen.getByTestId('mobile-billing-list')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure and ARIA labels', async () => {
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(() => {
        const table = screen.getByRole('table', { name: /billing history/i });
        expect(table).toBeInTheDocument();
        
        const columnHeaders = screen.getAllByRole('columnheader');
        expect(columnHeaders).toHaveLength(4); // Date, Description, Amount, Status
      });
    });

    it('should support keyboard navigation for download buttons', async () => {
      const user = userEvent.setup();
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(async () => {
        // Tab to first download button
        await user.tab();
        const downloadButton = screen.getAllByRole('button', { name: /download invoice/i })[0];
        expect(downloadButton).toHaveFocus();
      });
    });

    it('should announce loading and error states to screen readers', async () => {
      render(<BillingHistory {...mockProps} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should format currency amounts correctly', async () => {
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('$12.00')).toBeInTheDocument();
      });
    });

    it('should format dates in readable format', async () => {
      render(<BillingHistory {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument();
        expect(screen.getByText('Dec 1, 2024')).toBeInTheDocument();
      });
    });
  });
});