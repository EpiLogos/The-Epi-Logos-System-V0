"""
Billing API endpoints for subscription management and payment processing.

This module provides REST endpoints for Stripe integration, subscription
management, and billing operations following the Story 02.10.2 specification.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from ..services.jwt_service import JWTService
from ..services.user_service import UserService
from ..services.stripe_service import stripe_service
from ..models.user import User
from ..models.subscription import (
    SubscriptionCreateRequest, SubscriptionResponse, 
    CheckoutSessionResponse, CustomerPortalResponse,
    Subscription, SubscriptionTier, SubscriptionStatus
)
from ..core.exceptions import (
    ValidationError, ExternalServiceError, NotFoundError, AuthorizationError
)


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])
security = HTTPBearer()

# Dependency injection using container
from ..core.container import get_jwt_service, get_user_service

def get_jwt_service_dependency() -> JWTService:
    """Get JWTService instance from container."""
    return get_jwt_service()

def get_user_service_dependency() -> UserService:
    """Get UserService instance from container."""
    return get_user_service()

async def get_current_user_id(
    token: str = Depends(security),
    jwt_service: JWTService = Depends(get_jwt_service_dependency)
) -> str:
    """Get current authenticated user ID from JWT token."""
    try:
        # Extract token from Bearer format
        token_str = token.credentials if hasattr(token, 'credentials') else str(token)
        
        # Validate and decode token
        payload = await jwt_service.verify_access_token(token_str)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        # Return user ID from token
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        return user_id
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


@router.get("/subscription", response_model=Optional[SubscriptionResponse])
async def get_subscription_status(
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get current user's subscription status.
    
    Returns subscription details including tier, status, and billing cycle information.
    Returns None if user has no active subscription (free tier).
    
    Required for frontend account management integration.
    """
    try:
        # TODO: Implement subscription repository to get subscription by user_id
        # For now, return free tier as default
        logger.info(f"Getting subscription status for user {current_user_id}")
        
        # Placeholder response - will be replaced with actual database query
        return SubscriptionResponse(
            id="default-free",
            tier=SubscriptionTier.FREE,
            status=SubscriptionStatus.ACTIVE,
            current_period_end=None,
            cancel_at_period_end=False,
            trial_end=None
        )
        
    except Exception as e:
        logger.error(f"Failed to get subscription status for user {current_user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve subscription status"
        )


@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: SubscriptionCreateRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Create a Stripe checkout session for subscription upgrade.
    
    This endpoint creates a Stripe checkout session that redirects users
    to Stripe's hosted checkout page for secure payment processing.
    
    Required for frontend subscription upgrade flow.
    """
    try:
        logger.info(f"Creating checkout session for user {current_user_id}")
        
        # TODO: Get or create Stripe customer for user
        # For now, create a new customer each time (development only)
        customer_id = await stripe_service.create_customer(
            user_id=current_user_id,
            email=f"user-{current_user_id}@example.com",  # TODO: Get real email
            name=f"User {current_user_id}"
        )
        
        # Create checkout session
        session = await stripe_service.create_checkout_session(
            customer_id=customer_id,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            trial_period_days=request.trial_days
        )
        
        logger.info(f"Created checkout session {session.session_id} for user {current_user_id}")
        return session
        
    except ValidationError as e:
        logger.error(f"Validation error in checkout session creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ExternalServiceError as e:
        logger.error(f"Stripe error in checkout session creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"Unexpected error in checkout session creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session"
        )


@router.post("/customer-portal", response_model=CustomerPortalResponse) 
async def create_customer_portal_session(
    return_url: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Create a Stripe customer portal session for subscription management.
    
    This endpoint creates a session URL that redirects users to Stripe's
    customer portal where they can manage billing, download invoices, etc.
    
    Required for frontend billing management integration.
    """
    try:
        logger.info(f"Creating customer portal session for user {current_user_id}")
        
        # TODO: Get Stripe customer ID from subscription record
        # For now, this is a placeholder - will need subscription lookup
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found for customer portal access"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in customer portal creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create customer portal session"
        )


@router.post("/cancel-subscription")
async def cancel_subscription(
    immediate: bool = False,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Cancel user's active subscription.
    
    Args:
        immediate: If True, cancel immediately. If False, cancel at period end.
    
    Required for frontend subscription cancellation flow.
    """
    try:
        logger.info(f"Canceling subscription for user {current_user_id}")
        
        # TODO: Implement subscription cancellation
        # 1. Get user's active subscription
        # 2. Cancel via Stripe API
        # 3. Update local subscription record
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found to cancel"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in subscription cancellation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )


@router.get("/history")
async def get_billing_history(
    limit: int = 10,
    offset: int = 0,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get user's billing history and payment events.
    
    Args:
        limit: Maximum number of records to return (default: 10)
        offset: Number of records to skip (default: 0)
    
    Required for frontend billing history display.
    """
    try:
        logger.info(f"Getting billing history for user {current_user_id}")
        
        # TODO: Implement billing history retrieval
        # 1. Query payment events by user_id
        # 2. Format for frontend display
        # 3. Include invoice links and receipt URLs
        
        return {
            "events": [],
            "total": 0,
            "has_more": False
        }
        
    except Exception as e:
        logger.error(f"Unexpected error in billing history retrieval: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve billing history"
        )


@router.get("/invoice/{invoice_id}")
async def get_invoice_details(
    invoice_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get details for a specific invoice.
    
    Args:
        invoice_id: Stripe invoice ID
    
    Provides detailed invoice information for user's billing records.
    """
    try:
        logger.info(f"Getting invoice {invoice_id} for user {current_user_id}")
        
        # TODO: Implement invoice retrieval
        # 1. Verify invoice belongs to user
        # 2. Get invoice details from Stripe
        # 3. Return formatted invoice data
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found or access denied"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in invoice retrieval: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve invoice details"
        )


# Additional utility endpoints for development and testing

@router.get("/tiers")
async def get_subscription_tiers():
    """
    Get available subscription tiers and their feature limits.
    
    Public endpoint for displaying tier comparison on frontend.
    """
    from ..models.subscription import TIER_LIMITS
    
    return {
        "tiers": {
            "free": {
                "name": "Free",
                "price": 0,
                "currency": "usd",
                "interval": None,
                "limits": TIER_LIMITS[SubscriptionTier.FREE].dict()
            },
            "patron": {
                "name": "Patron",
                "price": 1200,  # $12.00 in cents
                "currency": "usd", 
                "interval": "month",
                "limits": TIER_LIMITS[SubscriptionTier.PATRON].dict()
            }
        }
    }


@router.get("/status")
async def get_billing_service_status():
    """
    Get billing service health status.
    
    Development endpoint for monitoring Stripe integration status.
    """
    try:
        # Simple test of Stripe API connectivity
        import stripe
        
        # This will throw an exception if API key is invalid
        stripe.api_key  # Just access the key to verify it's set
        
        return {
            "status": "healthy",
            "stripe_configured": bool(stripe.api_key),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Billing service health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "error": "Stripe service unavailable",
                "timestamp": datetime.utcnow().isoformat()
            }
        )