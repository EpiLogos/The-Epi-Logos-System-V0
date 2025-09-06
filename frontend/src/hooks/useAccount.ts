/**
 * useAccount Hook
 * Centralized account management logic and API interactions
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/auth';

interface UseAccountOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

interface AccountData {
  sessions: any[];
  billingHistory: any[];
  lastActivity: Date;
}

interface AccountActions {
  updateProfile: (data: any) => Promise<void>;
  updatePreferences: (preferences: any) => Promise<void>;
  exportAccountData: () => Promise<Blob>;
  deleteAccount: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  terminateSession: (sessionId: string) => Promise<void>;
  terminateAllSessions: () => Promise<void>;
  toggle2FA: (enabled: boolean) => Promise<void>;
  createCheckoutSession: () => Promise<string>;
  accessCustomerPortal: () => Promise<string>;
  cancelSubscription: () => Promise<void>;
  fetchBillingHistory: (page?: number, pageSize?: number) => Promise<any>;
  retry: () => Promise<void>;
}

interface UseAccountReturn extends AccountActions {
  data: AccountData;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export function useAccount(options: UseAccountOptions = {}): UseAccountReturn {
  const { autoFetch = true, refreshInterval = 5 * 60 * 1000 } = options;
  const { user, isAuthenticated, updateProfile: updateUser, getAuthHeader } = useAuth();
  
  const [data, setData] = useState<AccountData>({
    sessions: [],
    billingHistory: [],
    lastActivity: new Date(),
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function to get auth headers
  const getAuthHeaders = useCallback(() => {
    const authHeader = getAuthHeader();
    return {
      'Authorization': authHeader || '',
      'Content-Type': 'application/json',
    };
  }, [getAuthHeader]);

  // Helper function to handle API errors
  const handleApiError = useCallback((error: any, context: string) => {
    console.error(`Account API Error (${context}):`, error);
    const message = error instanceof Error ? error.message : `Failed to ${context}`;
    setError(message);
    throw new Error(message);
  }, []);

  // API call wrapper with error handling
  const apiCall = useCallback(async <T>(
    url: string, 
    options: RequestInit = {},
    context: string = 'perform operation'
  ): Promise<T> => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please sign in again.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return response as unknown as T;
      }
    } catch (err) {
      handleApiError(err, context);
      throw err; // Re-throw for caller handling
    }
  }, [getAuthHeaders, handleApiError]);

  // Fetch sessions data
  const refreshSessions = useCallback(async () => {
    try {
      const response = await apiCall<{ sessions: any[] }>('/api/auth/sessions', {}, 'fetch sessions');
      setData(prev => ({ ...prev, sessions: response.sessions }));
    } catch (err) {
      // Error already handled by apiCall
    }
  }, [apiCall]);

  // Fetch billing history
  const fetchBillingHistory = useCallback(async (page = 1, pageSize = 10) => {
    try {
      const response = await apiCall<any>(
        `/api/billing/history?page=${page}&pageSize=${pageSize}`,
        {},
        'fetch billing history'
      );
      setData(prev => ({ ...prev, billingHistory: response.history || [] }));
      return response;
    } catch (err) {
      // Error already handled by apiCall
      return { history: [], totalCount: 0, currentPage: page, hasMore: false };
    }
  }, [apiCall]);

  // Initialize account data
  const initializeAccount = useCallback(async () => {
    if (!isAuthenticated || !user || isInitialized) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch initial data in parallel
      await Promise.allSettled([
        refreshSessions(),
        fetchBillingHistory(),
      ]);
      
      setData(prev => ({ ...prev, lastActivity: new Date() }));
      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to initialize account data:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, isInitialized, refreshSessions, fetchBillingHistory]);

  // Update user profile
  const updateProfile = useCallback(async (profileData: any) => {
    setLoading(true);
    try {
      const updatedUser = await apiCall('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }, 'update profile');
      
      updateUser(updatedUser);
    } finally {
      setLoading(false);
    }
  }, [apiCall, updateUser]);

  // Update user preferences
  const updatePreferences = useCallback(async (preferences: any) => {
    setLoading(true);
    try {
      const updatedUser = await apiCall('/api/users/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      }, 'update preferences');
      
      updateUser(updatedUser);
    } finally {
      setLoading(false);
    }
  }, [apiCall, updateUser]);

  // Export account data
  const exportAccountData = useCallback(async (): Promise<Blob> => {
    setLoading(true);
    try {
      const response = await apiCall<Response>('/api/users/export', {}, 'export account data');
      return await response.blob();
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Delete account
  const deleteAccount = useCallback(async () => {
    setLoading(true);
    try {
      await apiCall('/api/users/account', {
        method: 'DELETE',
      }, 'delete account');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Terminate specific session
  const terminateSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    try {
      await apiCall(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      }, 'terminate session');
      
      await refreshSessions();
    } finally {
      setLoading(false);
    }
  }, [apiCall, refreshSessions]);

  // Terminate all other sessions
  const terminateAllSessions = useCallback(async () => {
    setLoading(true);
    try {
      await apiCall('/api/auth/sessions', {
        method: 'DELETE',
      }, 'terminate all sessions');
      
      await refreshSessions();
    } finally {
      setLoading(false);
    }
  }, [apiCall, refreshSessions]);

  // Toggle 2FA
  const toggle2FA = useCallback(async (enabled: boolean) => {
    setLoading(true);
    try {
      const updatedUser = await apiCall('/api/auth/2fa', {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      }, 'toggle 2FA');
      
      updateUser(updatedUser);
    } finally {
      setLoading(false);
    }
  }, [apiCall, updateUser]);

  // Create checkout session for subscription upgrade
  const createCheckoutSession = useCallback(async (): Promise<string> => {
    setLoading(true);
    try {
      const response = await apiCall<{ url: string }>('/api/billing/create-checkout-session', {
        method: 'POST',
      }, 'create checkout session');
      
      return response.url;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Access customer portal for subscription management
  const accessCustomerPortal = useCallback(async (): Promise<string> => {
    setLoading(true);
    try {
      const response = await apiCall<{ url: string }>('/api/billing/customer-portal', {
        method: 'POST',
      }, 'access customer portal');
      
      return response.url;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const updatedUser = await apiCall('/api/billing/cancel-subscription', {
        method: 'POST',
      }, 'cancel subscription');
      
      updateUser(updatedUser);
    } finally {
      setLoading(false);
    }
  }, [apiCall, updateUser]);

  // Retry last failed operation
  const retry = useCallback(async () => {
    setError(null);
    await initializeAccount();
  }, [initializeAccount]);

  // Auto-initialize when authenticated
  useEffect(() => {
    if (autoFetch && isAuthenticated && user && !isInitialized) {
      initializeAccount();
    }
  }, [autoFetch, isAuthenticated, user, isInitialized, initializeAccount]);

  // Set up refresh interval
  useEffect(() => {
    if (!refreshInterval || !isAuthenticated || !isInitialized) return;

    const interval = setInterval(() => {
      refreshSessions();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, isAuthenticated, isInitialized, refreshSessions]);

  return {
    data,
    loading,
    error,
    isInitialized,
    updateProfile,
    updatePreferences,
    exportAccountData,
    deleteAccount,
    refreshSessions,
    terminateSession,
    terminateAllSessions,
    toggle2FA,
    createCheckoutSession,
    accessCustomerPortal,
    cancelSubscription,
    fetchBillingHistory,
    retry,
  };
}

export default useAccount;