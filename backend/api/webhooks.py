"""
Webhook handlers for Stripe payment events.

This module processes Stripe webhook events for subscription lifecycle
management, payment processing, and billing event tracking.
"""

from fastapi import APIRouter, Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from typing import Dict, Any
import logging
from datetime import datetime

from ..services.stripe_service import stripe_service
from ..models.subscription import (
    Subscription, PaymentEvent, SubscriptionTier, SubscriptionStatus,
    PaymentEventMetadata
)
from ..core.exceptions import ValidationError, ExternalServiceError


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def handle_stripe_webhook(request: Request):
    """
    Handle incoming Stripe webhook events.
    
    This endpoint receives and processes webhook events from Stripe for
    subscription lifecycle management and payment tracking.
    
    Critical events handled:
    - checkout.session.completed: New subscription created
    - invoice.paid: Successful payment processed  
    - invoice.payment_failed: Payment failure handling
    - customer.subscription.updated: Subscription changes
    - customer.subscription.deleted: Subscription cancellation
    """
    try:
        # Get raw request body and signature header
        body = await request.body()
        signature = request.headers.get("stripe-signature")
        
        if not signature:
            logger.error("Missing Stripe signature header")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Stripe signature"
            )
        
        # Verify webhook signature and parse event
        try:
            event = await stripe_service.verify_webhook_signature(body, signature)
        except ValidationError as e:
            logger.error(f"Webhook signature verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature"
            )
        
        event_type = event["type"]
        event_data = event["data"]["object"]
        
        logger.info(f"Processing Stripe webhook: {event_type} - {event['id']}")
        
        # Route event to appropriate handler
        if event_type == "checkout.session.completed":
            await handle_checkout_session_completed(event_data, event)
        elif event_type == "invoice.paid":
            await handle_invoice_paid(event_data, event)
        elif event_type == "invoice.payment_failed":
            await handle_invoice_payment_failed(event_data, event)
        elif event_type == "customer.subscription.updated":
            await handle_subscription_updated(event_data, event)
        elif event_type == "customer.subscription.deleted":
            await handle_subscription_deleted(event_data, event)
        else:
            logger.info(f"Unhandled webhook event type: {event_type}")
        
        return JSONResponse(content={"status": "success"}, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed"
        )


async def handle_checkout_session_completed(session_data: Dict[str, Any], event: Dict[str, Any]):
    """
    Handle completed checkout session - new subscription created.
    
    This event indicates that a user has successfully completed payment
    and a new subscription should be created or updated.
    """
    try:
        customer_id = session_data.get("customer")
        subscription_id = session_data.get("subscription")
        
        if not customer_id or not subscription_id:
            logger.error(f"Missing customer or subscription ID in checkout session: {session_data}")
            return
        
        # TODO: Implement subscription creation/update logic
        # 1. Get user_id from Stripe customer metadata
        # 2. Create or update subscription record
        # 3. Update user tier status
        # 4. Send welcome email
        
        logger.info(f"Checkout completed for customer {customer_id}, subscription {subscription_id}")
        
        # Placeholder for actual implementation
        await create_or_update_subscription(customer_id, subscription_id, event)
        
    except Exception as e:
        logger.error(f"Error handling checkout session completed: {e}")
        raise


async def handle_invoice_paid(invoice_data: Dict[str, Any], event: Dict[str, Any]):
    """
    Handle successful invoice payment.
    
    This event confirms that a subscription payment was processed successfully.
    """
    try:
        customer_id = invoice_data.get("customer")
        subscription_id = invoice_data.get("subscription")
        amount_paid = invoice_data.get("amount_paid", 0)
        
        logger.info(f"Invoice paid: customer {customer_id}, amount ${amount_paid/100:.2f}")
        
        # TODO: Implement payment success handling
        # 1. Record payment event
        # 2. Update subscription status to active
        # 3. Reset any grace period flags
        # 4. Send payment confirmation
        
        await record_payment_event(
            customer_id=customer_id,
            subscription_id=subscription_id,
            event=event,
            amount=amount_paid,
            status="succeeded"
        )
        
    except Exception as e:
        logger.error(f"Error handling invoice paid: {e}")
        raise


async def handle_invoice_payment_failed(invoice_data: Dict[str, Any], event: Dict[str, Any]):
    """
    Handle failed invoice payment.
    
    This event indicates a payment failure and triggers grace period logic.
    """
    try:
        customer_id = invoice_data.get("customer")
        subscription_id = invoice_data.get("subscription")
        amount_due = invoice_data.get("amount_due", 0)
        
        logger.warning(f"Invoice payment failed: customer {customer_id}, amount ${amount_due/100:.2f}")
        
        # TODO: Implement payment failure handling
        # 1. Record failed payment event
        # 2. Start grace period
        # 3. Send payment retry notification
        # 4. Schedule retry attempts
        
        await record_payment_event(
            customer_id=customer_id,
            subscription_id=subscription_id,
            event=event,
            amount=amount_due,
            status="failed"
        )
        
    except Exception as e:
        logger.error(f"Error handling invoice payment failed: {e}")
        raise


async def handle_subscription_updated(subscription_data: Dict[str, Any], event: Dict[str, Any]):
    """
    Handle subscription updates (tier changes, cancellations, etc.).
    
    This event covers various subscription lifecycle changes.
    """
    try:
        subscription_id = subscription_data.get("id")
        status = subscription_data.get("status")
        cancel_at_period_end = subscription_data.get("cancel_at_period_end", False)
        
        logger.info(f"Subscription updated: {subscription_id}, status: {status}")
        
        # TODO: Implement subscription update handling
        # 1. Update local subscription record
        # 2. Adjust user tier if status changed
        # 3. Handle cancellation scheduling
        # 4. Send appropriate notifications
        
        await update_subscription_from_stripe(subscription_data, event)
        
    except Exception as e:
        logger.error(f"Error handling subscription updated: {e}")
        raise


async def handle_subscription_deleted(subscription_data: Dict[str, Any], event: Dict[str, Any]):
    """
    Handle subscription deletion/cancellation.
    
    This event indicates a subscription has been permanently canceled.
    """
    try:
        subscription_id = subscription_data.get("id")
        customer_id = subscription_data.get("customer")
        
        logger.info(f"Subscription deleted: {subscription_id} for customer {customer_id}")
        
        # TODO: Implement subscription deletion handling
        # 1. Update subscription status to canceled
        # 2. Downgrade user to free tier
        # 3. Handle data retention per "Freemium with Conscience" policy
        # 4. Send cancellation confirmation
        
        await handle_subscription_cancellation(subscription_id, customer_id, event)
        
    except Exception as e:
        logger.error(f"Error handling subscription deleted: {e}")
        raise


# Helper functions for webhook processing

async def create_or_update_subscription(
    customer_id: str, 
    stripe_subscription_id: str,
    event: Dict[str, Any]
):
    """
    Create or update subscription record from Stripe data.
    
    This is a placeholder for the actual subscription management logic
    that will be implemented with the subscription repository.
    """
    try:
        # TODO: Implement with subscription repository
        # 1. Get Stripe subscription details
        # 2. Extract user_id from customer metadata
        # 3. Create or update subscription record
        # 4. Update user tier status
        
        logger.info(f"Creating/updating subscription for customer {customer_id}")
        
        # Placeholder - will be replaced with actual database operations
        pass
        
    except Exception as e:
        logger.error(f"Failed to create/update subscription: {e}")
        raise


async def record_payment_event(
    customer_id: str,
    subscription_id: str, 
    event: Dict[str, Any],
    amount: int,
    status: str
):
    """
    Record payment event for audit and analytics.
    
    This creates a payment event record for tracking billing history.
    """
    try:
        # TODO: Implement with payment event repository
        # 1. Extract event details
        # 2. Get user_id from customer
        # 3. Create payment event record
        
        logger.info(f"Recording payment event: {status} for customer {customer_id}")
        
        # Placeholder - will be replaced with actual database operations
        pass
        
    except Exception as e:
        logger.error(f"Failed to record payment event: {e}")
        raise


async def update_subscription_from_stripe(
    subscription_data: Dict[str, Any],
    event: Dict[str, Any]
):
    """
    Update local subscription record from Stripe subscription data.
    """
    try:
        # TODO: Implement with subscription repository
        # 1. Find existing subscription record
        # 2. Update with Stripe data
        # 3. Handle tier changes
        # 4. Update user status
        
        subscription_id = subscription_data.get("id")
        logger.info(f"Updating subscription {subscription_id} from Stripe data")
        
        # Placeholder - will be replaced with actual database operations
        pass
        
    except Exception as e:
        logger.error(f"Failed to update subscription from Stripe: {e}")
        raise


async def handle_subscription_cancellation(
    subscription_id: str,
    customer_id: str,
    event: Dict[str, Any]
):
    """
    Handle subscription cancellation with "Freemium with Conscience" principles.
    """
    try:
        # TODO: Implement cancellation handling
        # 1. Update subscription status
        # 2. Downgrade user to free tier (graceful degradation)
        # 3. Preserve user data (no data hostage)
        # 4. Send respectful cancellation acknowledgment
        
        logger.info(f"Handling cancellation for subscription {subscription_id}")
        
        # Placeholder - will be replaced with actual implementation
        pass
        
    except Exception as e:
        logger.error(f"Failed to handle subscription cancellation: {e}")
        raise


# Development and testing endpoints

@router.get("/stripe/test")
async def test_webhook_endpoint():
    """
    Test endpoint to verify webhook handling is working.
    
    Development endpoint for testing webhook infrastructure.
    """
    return {
        "status": "webhook endpoint active",
        "timestamp": datetime.utcnow().isoformat(),
        "webhook_secret_configured": bool(stripe_service.webhook_secret)
    }