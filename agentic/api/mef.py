"""
MEF Analysis API Endpoints

Provides status and result retrieval for asynchronous MEF analysis tasks.
Parashakti processes MEF lens analysis in background, Epii polls for results.

Story 08.07 Enhancement - Epii-Parashakti MEF Delegation
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends

from agentic.agents.delegation_manager import DelegationManager
from agentic.agents.factory import AgentFactory
from shared.database.redis_client import RedisClient

logger = logging.getLogger(__name__)


# Dependency for getting DelegationManager
def get_delegation_manager() -> DelegationManager:
    """Get DelegationManager instance with agent factory."""
    factory = AgentFactory()
    redis_client = RedisClient()
    return DelegationManager(factory, redis_client)


# Create router for MEF API endpoints
router = APIRouter(prefix="/api/v1/mef", tags=["mef-analysis"])


@router.get("/status/{task_id}")
async def get_mef_status(
    task_id: str,
    delegation_manager: DelegationManager = Depends(get_delegation_manager)
):
    """
    Get MEF analysis task status.

    Returns current status of an async MEF analysis task:
    - processing: Task is running
    - completed: Task finished successfully
    - failed: Task encountered error
    - cancelled: Task was cancelled

    Story 08.07 Enhancement - Epii-Parashakti MEF Delegation
    """
    try:
        status = await delegation_manager.get_mef_status(task_id)

        if not status:
            raise HTTPException(
                status_code=404,
                detail=f"MEF task {task_id} not found"
            )

        return {
            "success": True,
            "task_id": task_id,
            "status": status
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting MEF status for task {task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{task_id}")
async def get_mef_results(
    task_id: str,
    delegation_manager: DelegationManager = Depends(get_delegation_manager)
):
    """
    Retrieve completed MEF analysis results.

    Returns full analysis results from Parashakti including:
    - Lens-specific insights
    - Patterns discovered
    - Questions explored
    - Resonances detected

    Only available when task status is "completed".

    Story 08.07 Enhancement - Epii-Parashakti MEF Delegation
    """
    try:
        # Check task status first
        status = await delegation_manager.get_mef_status(task_id)

        if not status:
            raise HTTPException(
                status_code=404,
                detail=f"MEF task {task_id} not found"
            )

        # Check if task is complete
        task_status = status.get("status")

        if task_status == "processing":
            raise HTTPException(
                status_code=425,  # Too Early
                detail=f"MEF analysis still processing. Check /status/{task_id} for updates."
            )

        if task_status == "failed":
            raise HTTPException(
                status_code=500,
                detail=f"MEF analysis failed: {status.get('error', 'Unknown error')}"
            )

        if task_status == "cancelled":
            raise HTTPException(
                status_code=410,  # Gone
                detail="MEF analysis was cancelled"
            )

        # Task is completed - retrieve results
        results = await delegation_manager.get_mef_result(task_id)

        if not results:
            raise HTTPException(
                status_code=404,
                detail=f"MEF results for task {task_id} not found (may have expired)"
            )

        return {
            "success": True,
            "task_id": task_id,
            "results": results
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting MEF results for task {task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/tasks/{task_id}")
async def cancel_mef_task(
    task_id: str,
    delegation_manager: DelegationManager = Depends(get_delegation_manager)
):
    """
    Cancel a running MEF analysis task.

    Note: Actual task cancellation is limited - this marks status as cancelled
    but background asyncio task may still complete.

    Story 08.07 Enhancement - Epii-Parashakti MEF Delegation
    """
    try:
        cancelled = await delegation_manager.cancel_mef_task(task_id)

        if not cancelled:
            raise HTTPException(
                status_code=400,
                detail=f"Could not cancel task {task_id} - may not exist or already completed"
            )

        return {
            "success": True,
            "message": f"MEF task {task_id} marked as cancelled"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling MEF task {task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Export router for integration with main FastAPI app
__all__ = ["router"]
