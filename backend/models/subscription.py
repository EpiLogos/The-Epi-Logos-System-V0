"""
Subscription models for billing and tier management.

This module defines the data models for subscription management,
payment tracking, and tier-based feature access.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
from pydantic import BaseModel, Field


class SubscriptionTier(str, Enum):
    """Enumeration of subscription tiers."""
    FREE = "free"
    PATRON = "patron"


class SubscriptionStatus(str, Enum):
    """Enumeration of subscription statuses from Stripe."""
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due" 
    UNPAID = "unpaid"
    TRIALING = "trialing"
    INCOMPLETE = "incomplete"
    INCOMPLETE_EXPIRED = "incomplete_expired"


class SubscriptionMetadata(BaseModel):
    """Metadata for subscription tracking."""
    upgrade_source: str = Field(..., description="Where the upgrade originated")
    price_id: str = Field(..., description="Stripe price ID")
    currency: str = Field(default="usd", description="Currency code")
    trial_days: Optional[int] = Field(None, description="Trial period days")


class Subscription(BaseModel):
    """Core subscription document model."""
    
    id: Optional[str] = Field(default=None, description="Subscription document ID")
    user_id: str = Field(..., description="Reference to user document")
    
    # Stripe identifiers
    stripe_customer_id: str = Field(..., description="Stripe customer ID")
    stripe_subscription_id: Optional[str] = Field(None, description="Stripe subscription ID")
    
    # Subscription details
    tier: SubscriptionTier = Field(default=SubscriptionTier.FREE, description="Current subscription tier")
    status: SubscriptionStatus = Field(default=SubscriptionStatus.ACTIVE, description="Subscription status")
    
    # Billing cycle information
    current_period_start: Optional[datetime] = Field(None, description="Current billing period start")
    current_period_end: Optional[datetime] = Field(None, description="Current billing period end")
    cancel_at_period_end: bool = Field(default=False, description="Cancel at period end flag")
    canceled_at: Optional[datetime] = Field(None, description="Cancellation timestamp")
    trial_end: Optional[datetime] = Field(None, description="Trial period end date")
    
    # Metadata and tracking
    metadata: SubscriptionMetadata = Field(..., description="Subscription metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class PaymentEventMetadata(BaseModel):
    """Metadata for payment event tracking."""
    payment_method: str = Field(..., description="Payment method used")
    failure_reason: Optional[str] = Field(None, description="Payment failure reason")
    receipt_url: Optional[str] = Field(None, description="Receipt URL from Stripe")
    invoice_id: Optional[str] = Field(None, description="Associated invoice ID")


class PaymentEvent(BaseModel):
    """Payment event tracking for audit and analytics."""
    
    id: Optional[str] = Field(default=None, description="Payment event document ID")
    user_id: str = Field(..., description="Reference to user document") 
    subscription_id: str = Field(..., description="Reference to subscription document")
    
    # Stripe event information
    stripe_event_id: str = Field(..., description="Stripe event ID")
    event_type: str = Field(..., description="Stripe event type")
    
    # Payment details
    amount: int = Field(..., description="Amount in cents")
    currency: str = Field(default="usd", description="Currency code")
    status: str = Field(..., description="Payment status (succeeded, failed, pending)")
    
    # Processing information
    processed_at: datetime = Field(default_factory=datetime.utcnow, description="Event processing timestamp")
    metadata: PaymentEventMetadata = Field(..., description="Payment event metadata")
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TierLimits(BaseModel):
    """Feature limits by subscription tier."""
    monthly_queries: int = Field(..., description="Monthly query limit")
    concurrent_sessions: int = Field(..., description="Concurrent session limit")
    storage_mb: int = Field(..., description="Storage limit in MB")
    export_formats: List[str] = Field(..., description="Available export formats")
    premium_features: bool = Field(default=False, description="Access to premium features")


class SubscriptionCreateRequest(BaseModel):
    """Request model for subscription creation."""
    tier: SubscriptionTier = Field(..., description="Target subscription tier")
    success_url: str = Field(..., description="Success redirect URL")
    cancel_url: str = Field(..., description="Cancel redirect URL")
    trial_days: Optional[int] = Field(None, description="Trial period days")


class SubscriptionResponse(BaseModel):
    """Response model for subscription queries."""
    id: str = Field(..., description="Subscription ID")
    tier: SubscriptionTier = Field(..., description="Current tier")
    status: SubscriptionStatus = Field(..., description="Current status")
    current_period_end: Optional[datetime] = Field(None, description="Period end date")
    cancel_at_period_end: bool = Field(..., description="Cancellation pending")
    trial_end: Optional[datetime] = Field(None, description="Trial end date")


class CheckoutSessionResponse(BaseModel):
    """Response model for Stripe checkout session creation."""
    checkout_url: str = Field(..., description="Stripe checkout session URL")
    session_id: str = Field(..., description="Checkout session ID")


class CustomerPortalResponse(BaseModel):
    """Response model for Stripe customer portal."""
    portal_url: str = Field(..., description="Customer portal URL")


# Tier-based feature limits configuration
TIER_LIMITS: Dict[SubscriptionTier, TierLimits] = {
    SubscriptionTier.FREE: TierLimits(
        monthly_queries=100,
        concurrent_sessions=1,
        storage_mb=50,
        export_formats=["json"],
        premium_features=False
    ),
    SubscriptionTier.PATRON: TierLimits(
        monthly_queries=10000,
        concurrent_sessions=5,
        storage_mb=1000,
        export_formats=["json", "pdf", "csv", "xml"],
        premium_features=True
    )
}