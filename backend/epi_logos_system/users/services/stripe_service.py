"""
Stripe service wrapper for subscription management and checkout flows.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

import stripe

from backend.epi_logos_system.users.models.subscription import (
    CheckoutSessionResponse,
    CustomerPortalResponse,
    SubscriptionStatus,
    SubscriptionTier,
)
from backend.epi_logos_system.shared.exceptions import (
    ValidationError,
    ExternalServiceError,
    NotFoundError,
)
from backend.services.stripe_service import get_config  # patch target in tests


class StripeService:
    def __init__(self) -> None:
        cfg = get_config()
        stripe.api_key = getattr(cfg, "stripe_secret_key", None)
        self.webhook_secret: Optional[str] = getattr(cfg, "stripe_webhook_secret", None)
        self.price_id_patron: Optional[str] = getattr(cfg, "stripe_price_id_patron", None)

    async def create_customer(self, *, user_id: str, email: str, name: str) -> str:
        try:
            customer = stripe.Customer.create(email=email, name=name, metadata={"user_id": user_id})
            return customer.id
        except stripe.error.InvalidRequestError as e:  # type: ignore[attr-defined]
            raise ExternalServiceError(f"Failed to create Stripe customer: {e}")

    async def create_checkout_session(
        self,
        *,
        customer_id: str,
        success_url: Optional[str],
        cancel_url: Optional[str],
        trial_period_days: Optional[int] = None,
    ) -> CheckoutSessionResponse:
        if not success_url or not cancel_url:
            raise ValidationError("Success URL and cancel URL are required")
        try:
            params: Dict[str, Any] = {
                "customer": customer_id,
                "mode": "subscription",
                "line_items": [
                    {
                        "price": self.price_id_patron,
                        "quantity": 1,
                    }
                ],
                "success_url": success_url,
                "cancel_url": cancel_url,
            }
            if trial_period_days is not None:
                params["subscription_data"] = {"trial_period_days": trial_period_days}
            session = stripe.checkout.Session.create(**params)
            return CheckoutSessionResponse(session_id=session.id, checkout_url=session.url)
        except stripe.error.InvalidRequestError as e:  # type: ignore[attr-defined]
            raise ExternalServiceError(str(e))

    async def create_customer_portal_session(self, *, customer_id: str, return_url: str) -> CustomerPortalResponse:
        session = stripe.billing_portal.Session.create(customer=customer_id, return_url=return_url)
        return CustomerPortalResponse(portal_url=session.url)

    async def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        try:
            return stripe.Subscription.retrieve(subscription_id)
        except stripe.error.InvalidRequestError:  # type: ignore[attr-defined]
            raise NotFoundError("Subscription not found")

    async def cancel_subscription(self, subscription_id: str, *, at_period_end: bool) -> Dict[str, Any]:
        if at_period_end:
            return stripe.Subscription.modify(subscription_id, cancel_at_period_end=True)
        return stripe.Subscription.delete(subscription_id)

    async def verify_webhook_signature(self, payload: bytes, signature: str) -> Dict[str, Any]:
        if not self.webhook_secret:
            raise ValidationError("Webhook secret not configured")
        try:
            event = stripe.Webhook.construct_event(payload, signature, self.webhook_secret)
            return event
        except stripe.error.SignatureVerificationError:  # type: ignore[attr-defined]
            raise ValidationError("Invalid webhook signature")

    def subscription_status_to_tier(self, status: str) -> SubscriptionTier:
        return SubscriptionTier.PATRON if status in ("active", "trialing") else SubscriptionTier.FREE

    def stripe_status_to_internal(self, status: str) -> SubscriptionStatus:
        mapping = {
            "active": SubscriptionStatus.ACTIVE,
            "trialing": SubscriptionStatus.ACTIVE,
            "canceled": SubscriptionStatus.CANCELED,
            "past_due": SubscriptionStatus.PAST_DUE,
            "unpaid": SubscriptionStatus.CANCELED,
        }
        return mapping.get(status, SubscriptionStatus.CANCELED)

    async def list_customer_subscriptions(self, customer_id: str) -> list:
        res = stripe.Subscription.list(customer=customer_id, limit=100)
        return list(res.data)

