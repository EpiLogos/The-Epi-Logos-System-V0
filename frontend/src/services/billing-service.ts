/**
 * Billing Service - Frontend API integration for Stripe billing
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Type for auth context integration
interface AuthContextType {
  getAuthHeader: () => string;
  isSessionValid: () => boolean;
}

export interface Subscription {
  id: string;
  tier: 'free' | 'patron';
  status: 'active' | 'inactive' | 'canceled';
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
}

export interface CheckoutSessionRequest {
  tier: 'free' | 'patron';
  success_url: string;
  cancel_url: string;
  trial_days?: number;
}

export interface CheckoutSessionResponse {
  session_id: string;
  checkout_url: string;
}

export interface CustomerPortalResponse {
  portal_url: string;
}

class BillingService {
  private authContext: AuthContextType | null = null;

  // Method to inject auth context dependency
  setAuthContext(authContext: AuthContextType) {
    this.authContext = authContext;
  }

  private getAuthHeaders(): HeadersInit {
    let authorization = '';
    
    if (this.authContext?.isSessionValid()) {
      authorization = this.authContext.getAuthHeader();
    } else {
      // Fallback to direct sessionStorage access
      const authTokensData = sessionStorage.getItem('auth_tokens');
      if (authTokensData) {
        try {
          const tokens = JSON.parse(authTokensData);
          if (tokens.accessToken) {
            authorization = `Bearer ${tokens.accessToken}`;
          }
        } catch (error) {
          console.error('Failed to parse auth tokens:', error);
        }
      }
    }
    
    return {
      'Content-Type': 'application/json',
      ...(authorization && { 'Authorization': authorization }),
    };
  }

  /**
   * Get current user's subscription status
   */
  async getSubscription(): Promise<Subscription | null> {
    try {
      const response = await fetch(`${API_BASE}/api/billing/subscription`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.status === 404) {
        // No subscription found - user is on free tier
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get subscription:', error);
      throw error;
    }
  }

  /**
   * Create Stripe checkout session for subscription upgrade
   */
  async createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    try {
      const response = await fetch(`${API_BASE}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw error;
    }
  }

  /**
   * Create Stripe customer portal session for billing management
   */
  async createCustomerPortal(returnUrl: string): Promise<CustomerPortalResponse> {
    try {
      const response = await fetch(`${API_BASE}/api/billing/customer-portal`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ return_url: returnUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create customer portal session:', error);
      throw error;
    }
  }

  /**
   * Cancel user's active subscription
   */
  async cancelSubscription(immediate: boolean = false): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/api/billing/cancel-subscription`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ immediate }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Get billing history for user
   */
  async getBillingHistory(limit: number = 10, offset: number = 0) {
    try {
      const response = await fetch(
        `${API_BASE}/api/billing/history?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get billing history:', error);
      throw error;
    }
  }

  /**
   * Redirect to Stripe Checkout - handles the browser redirect
   */
  async redirectToCheckout(targetTier: 'patron' = 'patron'): Promise<void> {
    try {
      const currentUrl = window.location.origin;
      const checkoutSession = await this.createCheckoutSession({
        tier: targetTier,
        success_url: `${currentUrl}/account?tab=billing&checkout=success`,
        cancel_url: `${currentUrl}/account?tab=billing&checkout=canceled`,
        trial_days: 7, // Optional 7-day trial
      });

      // Redirect to Stripe Checkout
      window.location.href = checkoutSession.checkout_url;
    } catch (error) {
      console.error('Failed to redirect to checkout:', error);
      throw error;
    }
  }

  /**
   * Open Stripe Customer Portal in new tab
   */
  async openCustomerPortal(): Promise<void> {
    try {
      const returnUrl = window.location.href;
      const portalSession = await this.createCustomerPortal(returnUrl);
      
      // Open in new tab/window
      window.open(portalSession.portal_url, '_blank');
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const billingService = new BillingService();
export default billingService;