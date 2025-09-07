"""
Workflow state management for Pydantic AI workflow engine.

Integrates with Track A Redis session management for state persistence.
Implements checkpoint and recovery mechanisms for workflow continuity.
"""
import json
import redis.asyncio as redis
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from enum import Enum

from ..orchestrator.core import PersonaType


class WorkflowStatus(str, Enum):
    """Workflow execution status enum."""
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class WorkflowCheckpoint(BaseModel):
    """Workflow checkpoint for state recovery."""
    workflow_id: str = Field(..., description="Unique workflow identifier")
    session_id: str = Field(..., description="Session identifier from orchestrator")
    step: int = Field(..., description="Current workflow step number")
    context: Dict[str, Any] = Field(default_factory=dict, description="Checkpoint context data")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional checkpoint metadata")


class WorkflowState(BaseModel):
    """Complete workflow state for persistence."""
    workflow_id: str = Field(..., description="Unique workflow identifier")
    session_id: str = Field(..., description="Session identifier from orchestrator")
    persona_type: PersonaType = Field(..., description="Active persona type")
    status: WorkflowStatus = Field(default=WorkflowStatus.PENDING)
    context: Dict[str, Any] = Field(default_factory=dict, description="Current workflow context")
    checkpoints: List[WorkflowCheckpoint] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    error: Optional[str] = Field(default=None, description="Last error message if failed")
    retry_count: int = Field(default=0, description="Number of retry attempts")
    max_retries: int = Field(default=3, description="Maximum retry attempts allowed")


class WorkflowStateManager:
    """
    Redis-based workflow state management.
    
    Integrates with Track A session management for consistent state storage.
    Provides checkpoint and recovery mechanisms for workflow reliability.
    """
    
    def __init__(self, redis_url: str):
        """Initialize with Redis connection."""
        if not redis_url:
            raise ValueError("Redis URL is required for workflow state management")
        
        self.redis_url = redis_url
        self._redis: Optional[redis.Redis] = None
        
        # Redis key patterns
        self.STATE_KEY_PREFIX = "workflow:state"
        self.CHECKPOINT_KEY_PREFIX = "workflow:checkpoint"
        self.SESSION_WORKFLOWS_PREFIX = "session:workflows"
    
    async def initialize(self) -> None:
        """Initialize Redis connection."""
        self._redis = redis.from_url(self.redis_url)
        # Test connection
        await self._redis.ping()
    
    async def cleanup(self) -> None:
        """Cleanup Redis connection."""
        if self._redis:
            await self._redis.aclose()
            self._redis = None
    
    def _get_state_key(self, workflow_id: str, session_id: str) -> str:
        """Generate Redis key for workflow state."""
        return f"{self.STATE_KEY_PREFIX}:{session_id}:{workflow_id}"
    
    def _get_checkpoint_key(self, workflow_id: str, session_id: str, step: int) -> str:
        """Generate Redis key for workflow checkpoint."""
        return f"{self.CHECKPOINT_KEY_PREFIX}:{session_id}:{workflow_id}:{step}"
    
    def _get_session_workflows_key(self, session_id: str) -> str:
        """Generate Redis key for session's active workflows."""
        return f"{self.SESSION_WORKFLOWS_PREFIX}:{session_id}"
    
    async def save_state(self, state: WorkflowState) -> bool:
        """
        Save workflow state to Redis.
        
        Args:
            state: WorkflowState to persist
            
        Returns:
            bool: True if saved successfully
        """
        try:
            if not self._redis:
                raise RuntimeError("WorkflowStateManager not initialized")
            
            # Update timestamp
            state.updated_at = datetime.now(timezone.utc).isoformat()
            
            # Save main state
            key = self._get_state_key(state.workflow_id, state.session_id)
            state_json = state.model_dump_json()
            
            await self._redis.set(key, state_json, ex=3600)  # 1 hour expiry
            
            # Track workflow in session's active workflows
            session_key = self._get_session_workflows_key(state.session_id)
            await self._redis.sadd(session_key, state.workflow_id)
            await self._redis.expire(session_key, 3600)
            
            return True
            
        except Exception as e:
            # Log error in production
            print(f"Error saving workflow state: {e}")
            return False
    
    async def get_state(self, workflow_id: str, session_id: str) -> Optional[WorkflowState]:
        """
        Retrieve workflow state from Redis.
        
        Args:
            workflow_id: Workflow identifier
            session_id: Session identifier
            
        Returns:
            WorkflowState if found, None otherwise
        """
        try:
            if not self._redis:
                raise RuntimeError("WorkflowStateManager not initialized")
            
            key = self._get_state_key(workflow_id, session_id)
            state_json = await self._redis.get(key)
            
            if not state_json:
                return None
            
            return WorkflowState.model_validate_json(state_json)
            
        except Exception as e:
            print(f"Error retrieving workflow state: {e}")
            return None
    
    async def delete_state(self, workflow_id: str, session_id: str) -> bool:
        """
        Delete workflow state from Redis.
        
        Args:
            workflow_id: Workflow identifier
            session_id: Session identifier
            
        Returns:
            bool: True if deleted successfully
        """
        try:
            if not self._redis:
                raise RuntimeError("WorkflowStateManager not initialized")
            
            key = self._get_state_key(workflow_id, session_id)
            deleted = await self._redis.delete(key)
            
            # Remove from session's active workflows
            session_key = self._get_session_workflows_key(session_id)
            await self._redis.srem(session_key, workflow_id)
            
            return deleted > 0
            
        except Exception as e:
            print(f"Error deleting workflow state: {e}")
            return False
    
    async def save_checkpoint(self, checkpoint: WorkflowCheckpoint) -> bool:
        """
        Save workflow checkpoint for recovery.
        
        Args:
            checkpoint: WorkflowCheckpoint to save
            
        Returns:
            bool: True if saved successfully
        """
        try:
            if not self._redis:
                raise RuntimeError("WorkflowStateManager not initialized")
            
            key = self._get_checkpoint_key(
                checkpoint.workflow_id,
                checkpoint.session_id,
                checkpoint.step
            )
            checkpoint_json = checkpoint.model_dump_json()
            
            await self._redis.set(key, checkpoint_json, ex=7200)  # 2 hour expiry
            
            # Also save as latest checkpoint
            latest_key = f"{self.CHECKPOINT_KEY_PREFIX}:{checkpoint.session_id}:{checkpoint.workflow_id}:latest"
            await self._redis.set(latest_key, checkpoint_json, ex=7200)
            
            return True
            
        except Exception as e:
            print(f"Error saving workflow checkpoint: {e}")
            return False
    
    async def get_checkpoint(self, workflow_id: str, session_id: str, step: int) -> Optional[WorkflowCheckpoint]:
        """
        Retrieve specific workflow checkpoint.
        
        Args:
            workflow_id: Workflow identifier
            session_id: Session identifier
            step: Checkpoint step number
            
        Returns:
            WorkflowCheckpoint if found, None otherwise
        """
        try:
            if not self._redis:
                raise RuntimeError("WorkflowStateManager not initialized")
            
            key = self._get_checkpoint_key(workflow_id, session_id, step)
            checkpoint_json = await self._redis.get(key)
            
            if not checkpoint_json:
                return None
            
            return WorkflowCheckpoint.model_validate_json(checkpoint_json)
            
        except Exception as e:
            print(f"Error retrieving workflow checkpoint: {e}")
            return None
    
    async def get_latest_checkpoint(self, workflow_id: str, session_id: str) -> Optional[WorkflowCheckpoint]:
        """
        Retrieve latest workflow checkpoint for recovery.
        
        Args:
            workflow_id: Workflow identifier
            session_id: Session identifier
            
        Returns:
            Latest WorkflowCheckpoint if found, None otherwise
        """
        try:
            if not self._redis:
                raise RuntimeError("WorkflowStateManager not initialized")
            
            key = f"{self.CHECKPOINT_KEY_PREFIX}:{session_id}:{workflow_id}:latest"
            checkpoint_json = await self._redis.get(key)
            
            if not checkpoint_json:
                return None
            
            return WorkflowCheckpoint.model_validate_json(checkpoint_json)
            
        except Exception as e:
            print(f"Error retrieving latest checkpoint: {e}")
            return None
    
    async def get_session_workflows(self, session_id: str) -> List[str]:
        """
        Get all active workflow IDs for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            List of active workflow IDs
        """
        try:
            if not self._redis:
                raise RuntimeError("WorkflowStateManager not initialized")
            
            key = self._get_session_workflows_key(session_id)
            workflow_ids = await self._redis.smembers(key)
            
            return [wid.decode() if isinstance(wid, bytes) else wid for wid in workflow_ids]
            
        except Exception as e:
            print(f"Error retrieving session workflows: {e}")
            return []
    
    async def cleanup_expired_states(self) -> int:
        """
        Cleanup expired workflow states and checkpoints.
        
        Returns:
            Number of cleaned up entries
        """
        try:
            if not self._redis:
                raise RuntimeError("WorkflowStateManager not initialized")
            
            # Redis TTL handles expiry automatically, but we can scan for manual cleanup
            # This would be used for batch cleanup operations if needed
            
            # Scan for expired states
            pattern = f"{self.STATE_KEY_PREFIX}:*"
            cursor = 0
            cleaned = 0
            
            while True:
                cursor, keys = await self._redis.scan(cursor=cursor, match=pattern, count=100)
                
                for key in keys:
                    ttl = await self._redis.ttl(key)
                    if ttl == -1:  # No expiry set, apply default
                        await self._redis.expire(key, 3600)
                    elif ttl == -2:  # Key doesn't exist
                        cleaned += 1
                
                if cursor == 0:
                    break
            
            return cleaned
            
        except Exception as e:
            print(f"Error during cleanup: {e}")
            return 0