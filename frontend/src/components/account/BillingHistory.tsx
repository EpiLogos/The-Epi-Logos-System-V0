/**
 * BillingHistory Component
 * Displays billing history with pagination and download functionality
 */

'use client';

import { useState, useEffect } from 'react';

interface BillingHistoryItem {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  status: 'paid' | 'failed' | 'pending';
  description: string;
  invoiceUrl?: string | null;
  paymentMethod?: string;
  failureReason?: string;
}

interface BillingHistoryResponse {
  history: BillingHistoryItem[];
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
}

interface BillingHistoryProps {
  userId: string;
  pageSize?: number;
  showDownloads?: boolean;
}

export default function BillingHistory({ 
  userId, 
  pageSize = 10, 
  showDownloads = true 
}: BillingHistoryProps) {
  const [data, setData] = useState<BillingHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);

  const fetchBillingHistory = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/billing/history?page=${page}&pageSize=${pageSize}`,
        {
          headers: {
            'Content-Type': 'application/json',
            // Authorization header would be added by the calling component
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch billing history');
      }

      const result: BillingHistoryResponse = await response.json();
      setData(result);
      setCurrentPage(result.currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingHistory(1);
  }, [userId, pageSize]);

  const handlePageChange = (newPage: number) => {
    fetchBillingHistory(newPage);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchBillingHistory(currentPage);
  };

  const handleDownloadInvoice = (invoiceUrl: string) => {
    window.open(invoiceUrl, '_blank');
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Assuming amounts are in cents
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

  return (
    <section 
      role="region" 
      aria-label="Billing History"
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Billing History
        </h2>
        <button
          onClick={() => handleRetry()}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="sr-only">Loading billing history...</div>
          </div>
          <div role="progressbar" aria-label="Loading" className="sr-only"></div>
          
          {/* Skeleton loading rows */}
          <div className="space-y-4 w-full">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} data-testid="skeleton-row" className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <div role="alert" className="text-red-600 dark:text-red-400 mb-4">
            Failed to load billing history: {error}
          </div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      )}

      {data && data.history.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No billing history</p>
            <p className="text-sm">When you make payments, they&apos;ll appear here.</p>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Upgrade to Patron
          </button>
        </div>
      )}

      {data && data.history.length > 0 && !loading && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table role="table" aria-label="Billing History" className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  {showDownloads && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Invoice
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.history.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">{item.description}</div>
                      {item.paymentMethod && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.paymentMethod}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatCurrency(item.amount, item.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status === 'paid' ? 'Paid' : item.status === 'failed' ? 'Failed' : 'Pending'}
                      </span>
                      {item.failureReason && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">{item.failureReason}</div>
                      )}
                    </td>
                    {showDownloads && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.invoiceUrl && item.status === 'paid' && (
                          <button
                            onClick={() => handleDownloadInvoice(item.invoiceUrl!)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            aria-label={`Download invoice for ${item.description}`}
                          >
                            Download Invoice
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden" data-testid="mobile-billing-list">
            <div className="space-y-4">
              {data.history.map((item) => (
                <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-300">
                        {item.description}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(item.date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-300">
                        {formatCurrency(item.amount, item.currency)}
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status === 'paid' ? 'Paid' : item.status === 'failed' ? 'Failed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  
                  {item.paymentMethod && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {item.paymentMethod}
                    </div>
                  )}
                  
                  {item.failureReason && (
                    <div className="text-xs text-red-600 dark:text-red-400 mb-2">
                      {item.failureReason}
                    </div>
                  )}
                  
                  {showDownloads && item.invoiceUrl && item.status === 'paid' && (
                    <button
                      onClick={() => handleDownloadInvoice(item.invoiceUrl!)}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      aria-label={`Download invoice for ${item.description}`}
                    >
                      Download Invoice
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous Page
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!data.hasMore}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Page
                </button>
              </div>
              
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav role="navigation" aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!data.hasMore}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Status for screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {loading && 'Loading billing history'}
        {error && `Error loading billing history: ${error}`}
        {data && `Showing ${data.history.length} of ${data.totalCount} billing records`}
      </div>
    </section>
  );
}