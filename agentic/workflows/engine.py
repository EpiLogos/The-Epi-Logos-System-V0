"""
Pydantic AI Workflow Engine for Track B Story 02.14 implementation.

Integrates with Track A UnifiedOrchestrator for persona workflow execution,
state management, and MCP tool integration. Provides workflow registration,
discovery, and execution with comprehensive error handling.
"""
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from .state import WorkflowStateManager, WorkflowState, WorkflowStatus, WorkflowCheckpoint
from .templates.base import PersonaWorkflow, WorkflowExecutionContext, WorkflowExecutionResult
from .tools.registry import MCPToolRegistry
from ..agents.orchestrator.session.session import OrchestratorSession
from ..agents.orchestrator.core import PersonaType


class WorkflowEngineConfig(BaseModel):
    """Configuration for WorkflowEngine initialization."""
    redis_url: str
    max_concurrent_workflows: int = 10
    default_workflow_timeout: int = 300  # 5 minutes
    enable_checkpointing: bool = True
    checkpoint_interval: int = 30  # seconds
    max_retries: int = 3
    retry_backoff_factor: float = 2.0


class WorkflowEngine:
    """
    Pydantic AI Workflow Engine for persona workflow execution.
    
    Integrates with Track A UnifiedOrchestrator to provide:
    - Workflow template registration and discovery
    - Redis-based state persistence and checkpoint recovery  
    - MCP tool integration infrastructure
    - Comprehensive error handling and retry mechanisms
    - Persona-aware workflow routing and execution
    """
    
    def __init__(self, redis_url: str, config: Optional[WorkflowEngineConfig] = None):
        """Initialize WorkflowEngine with Redis connection and configuration."""
        if not redis_url:
            raise ValueError("Redis URL is required for WorkflowEngine")
        
        self.redis_url = redis_url
        self.config = config or WorkflowEngineConfig(redis_url=redis_url)
        
        # Core components
        self.state_manager = WorkflowStateManager(redis_url)
        self.tool_registry = MCPToolRegistry()
        
        # Workflow registry
        self._registered_workflows: Dict[str, PersonaWorkflow] = {}
        self._persona_workflows: Dict[PersonaType, List[str]] = {
            persona: [] for persona in PersonaType
        }
        
        # Runtime state
        self._initialized = False
        self._active_workflows: Dict[str, asyncio.Task] = {}
        self._workflow_semaphore = asyncio.Semaphore(self.config.max_concurrent_workflows)
    
    async def initialize(self) -> None:
        """Initialize WorkflowEngine components."""
        if self._initialized:
            return
        
        # Initialize state manager
        await self.state_manager.initialize()
        
        # Initialize tool registry
        await self.tool_registry.initialize()
        
        # Load any persisted workflow registrations
        await self._restore_workflow_registry()
        
        self._initialized = True
    
    async def cleanup(self) -> None:
        """Cleanup WorkflowEngine resources."""
        if not self._initialized:
            return
        
        # Cancel active workflows
        for task in self._active_workflows.values():
            if not task.done():
                task.cancel()
        
        # Wait for workflows to complete
        if self._active_workflows:
            await asyncio.gather(*self._active_workflows.values(), return_exceptions=True)
        
        # Cleanup components
        await self.state_manager.cleanup()
        await self.tool_registry.cleanup()
        
        self._initialized = False
    
    async def register_workflow(self, workflow: PersonaWorkflow) -> bool:
        """
        Register a persona workflow template for execution.
        
        Args:
            workflow: PersonaWorkflow template to register
            
        Returns:
            bool: True if registered successfully, False if workflow_id already exists
        """
        try:
            if workflow.workflow_id in self._registered_workflows:
                return False
            
            # Initialize workflow
            await workflow.initialize()
            
            # Register workflow
            self._registered_workflows[workflow.workflow_id] = workflow
            
            # Add to persona-specific registry
            if workflow.persona_type in self._persona_workflows:
                self._persona_workflows[workflow.persona_type].append(workflow.workflow_id)
            else:
                self._persona_workflows[workflow.persona_type] = [workflow.workflow_id]
            
            # Persist registration (in production, save to Redis)
            await self._persist_workflow_registry()
            
            return True
            
        except Exception as e:
            print(f"Error registering workflow {workflow.workflow_id}: {e}")
            return False
    
    async def unregister_workflow(self, workflow_id: str) -> bool:
        """
        Unregister a workflow template.
        
        Args:
            workflow_id: Workflow identifier to unregister
            
        Returns:
            bool: True if unregistered successfully
        """
        try:
            if workflow_id not in self._registered_workflows:
                return False
            
            workflow = self._registered_workflows[workflow_id]
            
            # Remove from persona registry
            if workflow.persona_type in self._persona_workflows:
                if workflow_id in self._persona_workflows[workflow.persona_type]:
                    self._persona_workflows[workflow.persona_type].remove(workflow_id)
            
            # Remove from main registry
            del self._registered_workflows[workflow_id]
            
            # Persist changes
            await self._persist_workflow_registry()
            
            return True
            
        except Exception as e:
            print(f"Error unregistering workflow {workflow_id}: {e}")
            return False
    
    async def discover_workflows(self, persona_type: PersonaType) -> List[PersonaWorkflow]:
        """
        Discover available workflows for a specific persona type.
        
        Args:
            persona_type: PersonaType to discover workflows for
            
        Returns:
            List of available PersonaWorkflow templates
        """
        try:
            workflow_ids = self._persona_workflows.get(persona_type, [])
            workflows = [
                self._registered_workflows[wid] 
                for wid in workflow_ids 
                if wid in self._registered_workflows
            ]
            return workflows
            
        except Exception as e:
            print(f"Error discovering workflows for {persona_type}: {e}")
            return []
    
    async def get_workflow_info(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive information about a registered workflow.
        
        Args:
            workflow_id: Workflow identifier
            
        Returns:
            Workflow information dict or None if not found
        """
        workflow = self._registered_workflows.get(workflow_id)
        return workflow.get_workflow_info() if workflow else None
    
    async def execute_workflow(
        self,
        workflow_id: str,
        session: OrchestratorSession,
        context: Dict[str, Any],
        max_retries: Optional[int] = None
    ) -> WorkflowExecutionResult:
        """
        Execute a workflow with Track A orchestrator session integration.
        
        Args:
            workflow_id: Registered workflow identifier
            session: OrchestratorSession from Track A
            context: Additional execution context
            max_retries: Override default retry count
            
        Returns:
            WorkflowExecutionResult with execution outcome
        """
        if not self._initialized:
            return WorkflowExecutionResult(
                success=False,
                workflow_id=workflow_id,
                session_id=session.session_id,
                error="WorkflowEngine not initialized"
            )
        
        workflow = self._registered_workflows.get(workflow_id)
        if not workflow:
            return WorkflowExecutionResult(
                success=False,
                workflow_id=workflow_id,
                session_id=session.session_id,
                error=f"Workflow '{workflow_id}' not found"
            )
        
        # Build execution context from session and additional context
        execution_context = await self._build_execution_context(session, context, workflow)
        
        # Execute with retry logic
        max_retries = max_retries or self.config.max_retries
        
        for attempt in range(max_retries + 1):
            try:
                # Create workflow state
                workflow_state = WorkflowState(
                    workflow_id=workflow_id,
                    session_id=session.session_id,
                    persona_type=PersonaType(session.active_persona),
                    status=WorkflowStatus.RUNNING,
                    context=execution_context.model_dump(),
                    retry_count=attempt,
                    max_retries=max_retries
                )
                
                # Save initial state
                await self.state_manager.save_state(workflow_state)
                
                # Execute workflow with semaphore control
                async with self._workflow_semaphore:
                    result = await asyncio.wait_for(
                        workflow.execute(execution_context),
                        timeout=self.config.default_workflow_timeout
                    )
                
                # Update state based on result
                workflow_state.status = WorkflowStatus.COMPLETED if result.success else WorkflowStatus.FAILED
                workflow_state.error = result.error if not result.success else None
                
                await self.state_manager.save_state(workflow_state)
                
                # Save final checkpoint
                if self.config.enable_checkpointing:
                    checkpoint = WorkflowCheckpoint(
                        workflow_id=workflow_id,
                        session_id=session.session_id,
                        step=result.steps_completed,
                        context=result.updated_context or {}
                    )
                    await self.state_manager.save_checkpoint(checkpoint)
                
                return result
                
            except asyncio.TimeoutError:
                error_msg = f"Workflow execution timeout after {self.config.default_workflow_timeout} seconds"
                
                if attempt < max_retries:
                    await asyncio.sleep(self.config.retry_backoff_factor ** attempt)
                    continue
                
                return WorkflowExecutionResult(
                    success=False,
                    workflow_id=workflow_id,
                    session_id=session.session_id,
                    error=error_msg,
                    retry_attempt=attempt
                )
                
            except Exception as e:
                error_msg = f"Workflow execution error: {str(e)}"
                
                if attempt < max_retries:
                    # Check if error is retryable
                    if await self._is_retryable_error(e):
                        await asyncio.sleep(self.config.retry_backoff_factor ** attempt)
                        continue
                
                return WorkflowExecutionResult(
                    success=False,
                    workflow_id=workflow_id,
                    session_id=session.session_id,
                    error=error_msg,
                    retry_attempt=attempt
                )
        
        # Should not reach here, but safety fallback
        return WorkflowExecutionResult(
            success=False,
            workflow_id=workflow_id,
            session_id=session.session_id,
            error="Maximum retries exceeded"
        )
    
    async def pause_workflow(self, workflow_id: str, session_id: str) -> bool:
        """
        Pause an active workflow and save checkpoint.
        
        Args:
            workflow_id: Workflow identifier
            session_id: Session identifier
            
        Returns:
            bool: True if paused successfully
        """
        try:
            # Get current state
            state = await self.state_manager.get_state(workflow_id, session_id)
            if not state or state.status != WorkflowStatus.RUNNING:
                return False
            
            # Update state to paused
            state.status = WorkflowStatus.PAUSED
            state.updated_at = datetime.now(timezone.utc).isoformat()
            
            await self.state_manager.save_state(state)
            
            # Cancel active workflow task if exists
            task_key = f"{session_id}:{workflow_id}"
            if task_key in self._active_workflows:
                task = self._active_workflows[task_key]
                if not task.done():
                    task.cancel()
                del self._active_workflows[task_key]
            
            return True
            
        except Exception as e:
            print(f"Error pausing workflow {workflow_id}: {e}")
            return False
    
    async def resume_workflow(self, workflow_id: str, session_id: str) -> WorkflowExecutionResult:
        """
        Resume a paused workflow from checkpoint.
        
        Args:
            workflow_id: Workflow identifier  
            session_id: Session identifier
            
        Returns:
            WorkflowExecutionResult from resumed execution
        """
        try:
            # Get paused state
            state = await self.state_manager.get_state(workflow_id, session_id)
            if not state or state.status != WorkflowStatus.PAUSED:
                return WorkflowExecutionResult(
                    success=False,
                    workflow_id=workflow_id,
                    session_id=session_id,
                    error="Workflow not in paused state"
                )
            
            # Get latest checkpoint
            checkpoint = await self.state_manager.get_latest_checkpoint(workflow_id, session_id)
            if not checkpoint:
                return WorkflowExecutionResult(
                    success=False,
                    workflow_id=workflow_id,
                    session_id=session_id,
                    error="No checkpoint found for resume"
                )
            
            # Reconstruct execution context from checkpoint
            execution_context = WorkflowExecutionContext.model_validate(state.context)
            execution_context.workflow_step = checkpoint.step
            execution_context.workflow_context.update(checkpoint.context)
            
            # Get workflow template
            workflow = self._registered_workflows.get(workflow_id)
            if not workflow:
                return WorkflowExecutionResult(
                    success=False,
                    workflow_id=workflow_id,
                    session_id=session_id,
                    error="Workflow template not found"
                )
            
            # Resume workflow execution
            state.status = WorkflowStatus.RUNNING
            state.updated_at = datetime.now(timezone.utc).isoformat()
            await self.state_manager.save_state(state)
            
            # Execute from checkpoint
            return await workflow.execute(execution_context)
            
        except Exception as e:
            return WorkflowExecutionResult(
                success=False,
                workflow_id=workflow_id,
                session_id=session_id,
                error=f"Resume error: {str(e)}"
            )
    
    async def get_workflow_status(self, workflow_id: str, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get current workflow status and metadata.
        
        Args:
            workflow_id: Workflow identifier
            session_id: Session identifier
            
        Returns:
            Workflow status information or None if not found
        """
        try:
            state = await self.state_manager.get_state(workflow_id, session_id)
            if not state:
                return None
            
            return {
                "workflow_id": workflow_id,
                "session_id": session_id,
                "status": state.status,
                "persona_type": state.persona_type,
                "created_at": state.created_at,
                "updated_at": state.updated_at,
                "retry_count": state.retry_count,
                "error": state.error,
                "checkpoints": len(state.checkpoints)
            }
            
        except Exception as e:
            print(f"Error getting workflow status: {e}")
            return None
    
    async def cleanup_session_workflows(self, session_id: str) -> int:
        """
        Cleanup all workflows for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Number of workflows cleaned up
        """
        try:
            workflow_ids = await self.state_manager.get_session_workflows(session_id)
            cleaned = 0
            
            for workflow_id in workflow_ids:
                if await self.state_manager.delete_state(workflow_id, session_id):
                    cleaned += 1
            
            return cleaned
            
        except Exception as e:
            print(f"Error cleaning up session workflows: {e}")
            return 0
    
    async def _build_execution_context(
        self,
        session: OrchestratorSession,
        additional_context: Dict[str, Any],
        workflow: PersonaWorkflow
    ) -> WorkflowExecutionContext:
        """Build comprehensive execution context from session and additional data."""
        # Extract user input from additional context
        user_input = additional_context.get("user_input", "") or additional_context.get("message", "")
        
        return WorkflowExecutionContext(
            session_id=session.session_id,
            user_id=session.user_id,
            persona_type=PersonaType(session.active_persona),
            user_input=user_input,
            session_context=session.context or {},
            bimba_coordinates=session.bimba_context or [],
            workflow_context=additional_context
        )
    
    async def _is_retryable_error(self, error: Exception) -> bool:
        """Determine if an error is retryable."""
        # Network-related errors are typically retryable
        retryable_types = [
            ConnectionError,
            TimeoutError,
            asyncio.TimeoutError,
            # Add other retryable exceptions as needed
        ]
        
        return any(isinstance(error, error_type) for error_type in retryable_types)
    
    async def _restore_workflow_registry(self) -> None:
        """Restore workflow registry from persistent storage (placeholder)."""
        # In production, this would restore from Redis or database
        pass
    
    async def _persist_workflow_registry(self) -> None:
        """Persist workflow registry to storage (placeholder)."""
        # In production, this would save to Redis or database
        pass