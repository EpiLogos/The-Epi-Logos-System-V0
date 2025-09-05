"""
Stripe integration service for subscription billing and payment processing.

This service handles all Stripe API interactions including subscription management,
checkout session creation, customer portal access, and webhook processing.
"""

import stripe

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from ..config.environment import get_config
from ..models.subscription import (
    Subscription, PaymentEvent, SubscriptionTier, SubscriptionStatus,
    CheckoutSessionResponse, CustomerPortalResponse,
    SubscriptionMetadata, PaymentEventMetadata
)
from ..core.exceptions import (
    ValidationError, ExternalServiceError, NotFoundError
)


logger = logging.getLogger(__name__)


class StripeService:
    """Service for Stripe payment processing and subscription management."""
    
    def __init__(self):
        """Initialize Stripe service with configuration."""
        config = get_config()
        
        if not config.stripe_secret_key:
            raise ValueError("Stripe secret key is required for billing functionality")
            
        stripe.api_key = config.stripe_secret_key
        self.webhook_secret = config.stripe_webhook_secret
        self.price_id_patron = config.stripe_price_id_patron
        
        logger.info("Stripe service initialized with real API")
        logger.info("Stripe service ready for production use")

    async def create_customer(self, user_id: str, email: str, name: Optional[str] = None) -> str:
        """
        Create a new Stripe customer.
        
        Args:
            user_id: Internal user ID
            email: Customer email
            name: Optional customer name
            
        Returns:
            Stripe customer ID
            
        Raises:
            ExternalServiceError: If Stripe API call fails
        """
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={"user_id": user_id}
            )
            logger.info(f"Created Stripe customer {customer.id} for user {user_id}")
            return customer.id
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe customer creation failed: {e}")
            raise ExternalServiceError(f"Failed to create Stripe customer: {str(e)}")

    async def create_checkout_session(
        self,
        customer_id: str,
        price_id: Optional[str] = None,
        success_url: str = None,
        cancel_url: str = None,
        trial_period_days: Optional[int] = None
    ) -> CheckoutSessionResponse:
        """
        Create a Stripe checkout session for subscription.
        
        Args:
            customer_id: Stripe customer ID
            price_id: Stripe price ID (defaults to patron tier)
            success_url: URL to redirect on success
            cancel_url: URL to redirect on cancellation
            trial_period_days: Optional trial period
            
        Returns:
            CheckoutSessionResponse with session URL and ID
            
        Raises:
            ValidationError: If required parameters are missing
            ExternalServiceError: If Stripe API call fails
        """
        if not success_url or not cancel_url:
            raise ValidationError("Success URL and cancel URL are required")
            
        if not price_id:
            if not self.price_id_patron:
                raise ValidationError("No price ID provided and patron price ID not configured")
            price_id = self.price_id_patron
            
        try:
            session_params = {
                "customer": customer_id,
                "payment_method_types": ["card"],
                "line_items": [{
                    "price": price_id,
                    "quantity": 1,
                }],
                "mode": "subscription",
                "success_url": success_url,
                "cancel_url": cancel_url,
                "billing_address_collection": "auto",
            }
            
            # Add trial period if specified
            if trial_period_days:
                session_params["subscription_data"] = {
                    "trial_period_days": trial_period_days
                }
            
            session = stripe.checkout.Session.create(**session_params)
            
            logger.info(f"Created checkout session {session.id} for customer {customer_id}")
            
            return CheckoutSessionResponse(
                checkout_url=session.url,
                session_id=session.id
            )
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe checkout session creation failed: {e}")
            raise ExternalServiceError(f"Failed to create checkout session: {str(e)}")

    async def create_customer_portal_session(
        self,
        customer_id: str,
        return_url: str
    ) -> CustomerPortalResponse:
        """
        Create a Stripe customer portal session for subscription management.
        
        Args:
            customer_id: Stripe customer ID
            return_url: URL to return to after portal session
            
        Returns:
            CustomerPortalResponse with portal URL
            
        Raises:
            ExternalServiceError: If Stripe API call fails
        """
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            
            logger.info(f"Created customer portal session for customer {customer_id}")
            
            return CustomerPortalResponse(portal_url=session.url)
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe customer portal creation failed: {e}")
            raise ExternalServiceError(f"Failed to create customer portal: {str(e)}")

    async def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """
        Retrieve subscription details from Stripe.
        
        Args:
            subscription_id: Stripe subscription ID
            
        Returns:
            Subscription data from Stripe
            
        Raises:
            NotFoundError: If subscription not found
            ExternalServiceError: If Stripe API call fails
        """
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return subscription
            
        except stripe.error.InvalidRequestError as e:
            logger.error(f"Subscription {subscription_id} not found: {e}")
            raise NotFoundError(f"Subscription not found: {subscription_id}")
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve subscription {subscription_id}: {e}")
            raise ExternalServiceError(f"Failed to retrieve subscription: {str(e)}")

    async def cancel_subscription(
        self,
        subscription_id: str,
        at_period_end: bool = True
    ) -> Dict[str, Any]:
        """
        Cancel a Stripe subscription.
        
        Args:
            subscription_id: Stripe subscription ID
            at_period_end: Whether to cancel at period end or immediately
            
        Returns:
            Updated subscription data
            
        Raises:
            NotFoundError: If subscription not found
            ExternalServiceError: If Stripe API call fails
        """
        try:
            if at_period_end:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
                logger.info(f"Scheduled cancellation for subscription {subscription_id}")
            else:
                subscription = stripe.Subscription.delete(subscription_id)
                logger.info(f"Immediately canceled subscription {subscription_id}")
                
            return subscription
            
        except stripe.error.InvalidRequestError as e:
            logger.error(f"Subscription {subscription_id} not found for cancellation: {e}")
            raise NotFoundError(f"Subscription not found: {subscription_id}")
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to cancel subscription {subscription_id}: {e}")
            raise ExternalServiceError(f"Failed to cancel subscription: {str(e)}")

    async def list_customer_subscriptions(self, customer_id: str) -> List[Dict[str, Any]]:
        """
        List all subscriptions for a customer.
        
        Args:
            customer_id: Stripe customer ID
            
        Returns:
            List of subscription data
            
        Raises:
            ExternalServiceError: If Stripe API call fails
        """
        try:
            subscriptions = stripe.Subscription.list(
                customer=customer_id,
                limit=100  # Reasonable limit for most use cases
            )
            
            return subscriptions.data
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to list subscriptions for customer {customer_id}: {e}")
            raise ExternalServiceError(f"Failed to list subscriptions: {str(e)}")

    async def verify_webhook_signature(
        self,
        payload: bytes,
        signature_header: str
    ) -> Dict[str, Any]:
        """
        Verify and parse Stripe webhook event.
        
        Args:
            payload: Raw webhook payload
            signature_header: Stripe signature header
            
        Returns:
            Parsed webhook event
            
        Raises:
            ValidationError: If signature verification fails
        """
        if not self.webhook_secret:
            raise ValidationError("Webhook secret not configured")
            
        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature_header,
                self.webhook_secret
            )
            
            logger.info(f"Verified webhook event: {event['type']} - {event['id']}")
            return event
            
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            logger.error(f"Webhook signature verification failed: {e}")
            raise ValidationError("Invalid webhook signature")

    def subscription_status_to_tier(self, stripe_status: str) -> SubscriptionTier:
        """
        Map Stripe subscription status to internal tier.
        
        Args:
            stripe_status: Stripe subscription status
            
        Returns:
            Internal subscription tier
        """
        active_statuses = ["active", "trialing"]
        
        if stripe_status in active_statuses:
            return SubscriptionTier.PATRON
        else:
            return SubscriptionTier.FREE

    def stripe_status_to_internal(self, stripe_status: str) -> SubscriptionStatus:
        """
        Map Stripe status to internal status enum.
        
        Args:
            stripe_status: Stripe subscription status
            
        Returns:
            Internal subscription status
        """
        status_mapping = {
            "active": SubscriptionStatus.ACTIVE,
            "canceled": SubscriptionStatus.CANCELED,
            "past_due": SubscriptionStatus.PAST_DUE,
            "unpaid": SubscriptionStatus.UNPAID,
            "trialing": SubscriptionStatus.TRIALING,
            "incomplete": SubscriptionStatus.INCOMPLETE,
            "incomplete_expired": SubscriptionStatus.INCOMPLETE_EXPIRED,
        }
        
        return status_mapping.get(stripe_status, SubscriptionStatus.CANCELED)


# Singleton instance for dependency injection
stripe_service = StripeService()