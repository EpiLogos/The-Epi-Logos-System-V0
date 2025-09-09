"""
Base PersonaWorkflow template for coordinate-aware context handling.

Provides foundation for persona-specific workflow implementations with 
CAG (Coordinate-Augmented Generation) integration and context awareness.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, timezone

from ...agents.orchestrator.core import PersonaType
from ...agents.orchestrator.session.session import OrchestratorSession
from ...agents.orchestrator.context.context_package import ContextPackage


class WorkflowExecutionContext(BaseModel):
    """
    Comprehensive execution context for persona workflows.
    
    Integrates Track A orchestrator session data with workflow-specific context.
    """
    session_id: str = Field(..., description="Session identifier from orchestrator")
    user_id: str = Field(..., description="User identifier")
    persona_type: PersonaType = Field(..., description="Active persona type")
    user_input: str = Field(..., description="User's input message")
    
    # Track A integration - orchestrator session context
    session_context: Dict[str, Any] = Field(default_factory=dict, description="Orchestrator session context")
    conversation_history: List[Dict[str, str]] = Field(default_factory=list, description="Previous conversation messages")
    bimba_coordinates: List[str] = Field(default_factory=list, description="Active Bimba coordinate context")
    
    # Workflow-specific context
    workflow_step: int = Field(default=1, description="Current workflow step")
    workflow_context: Dict[str, Any] = Field(default_factory=dict, description="Workflow execution context")
    context_package: Optional[ContextPackage] = Field(default=None, description="ACT Protocol context package")
    
    # Temporal and coordination context  
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    coordinate_resolution_cache: Dict[str, Any] = Field(default_factory=dict, description="Cached coordinate resolutions")
    


class WorkflowExecutionResult(BaseModel):
    """Result of workflow execution with comprehensive metadata."""
    success: bool = Field(..., description="Whether workflow executed successfully")
    workflow_id: str = Field(..., description="Workflow identifier")
    session_id: str = Field(..., description="Session identifier")
    
    # Result data
    result: Optional[Dict[str, Any]] = Field(default=None, description="Workflow execution result")
    response_text: Optional[str] = Field(default=None, description="Generated response text")
    
    # Execution metadata
    execution_time_ms: Optional[float] = Field(default=None, description="Execution time in milliseconds")
    steps_completed: int = Field(default=0, description="Number of workflow steps completed")
    coordinates_resolved: List[str] = Field(default_factory=list, description="Bimba coordinates resolved during execution")
    
    # Error handling
    error: Optional[str] = Field(default=None, description="Error message if execution failed")
    retry_attempt: int = Field(default=0, description="Retry attempt number")
    
    # Context updates
    updated_context: Optional[Dict[str, Any]] = Field(default=None, description="Context updates to persist")
    next_workflow_suggestions: List[str] = Field(default_factory=list, description="Suggested follow-up workflows")
    


class PersonaWorkflow(ABC):
    """
    Abstract base class for persona-specific workflow templates.
    
    Provides coordinate-aware context handling and CAG integration foundation
    for authentic persona implementations following philosophical architecture.
    """
    
    def __init__(self, workflow_id: str, persona_type: PersonaType):
        """Initialize base persona workflow."""
        self.workflow_id = workflow_id
        self.persona_type = persona_type
        self._initialized = False
    
    @property
    @abstractmethod
    def workflow_name(self) -> str:
        """Human-readable workflow name."""
        pass
    
    @property
    @abstractmethod
    def workflow_description(self) -> str:
        """Description of workflow capabilities and use cases."""
        pass
    
    @property
    @abstractmethod
    def required_context_keys(self) -> List[str]:
        """List of required context keys for workflow execution."""
        pass
    
    @property
    @abstractmethod
    def coordinate_dependencies(self) -> List[str]:
        """List of Bimba coordinates this workflow depends on."""
        pass
    
    async def initialize(self) -> None:
        """Initialize workflow template with persona-specific setup."""
        if not self._initialized:
            await self._setup_persona_context()
            self._initialized = True
    
    @abstractmethod
    async def _setup_persona_context(self) -> None:
        """Setup persona-specific context and configuration."""
        pass
    
    async def validate_context(self, context: WorkflowExecutionContext) -> bool:
        """
        Validate that execution context meets workflow requirements.
        
        Args:
            context: WorkflowExecutionContext to validate
            
        Returns:
            bool: True if context is valid for execution
        """
        try:
            # Check required context keys
            for key in self.required_context_keys:
                if key not in context.workflow_context and key not in context.session_context:
                    return False
            
            # Validate persona type matches
            if context.persona_type != self.persona_type:
                return False
            
            # Coordinate dependency validation
            available_coordinates = set(context.bimba_coordinates)
            required_coordinates = set(self.coordinate_dependencies)
            
            if required_coordinates and not required_coordinates.issubset(available_coordinates):
                # Allow workflows with coordinate resolution capability
                if not await self._can_resolve_coordinates(required_coordinates - available_coordinates):
                    return False
            
            # Persona-specific validation
            return await self._validate_persona_context(context)
            
        except Exception as e:
            print(f"Context validation error for workflow {self.workflow_id}: {e}")
            return False
    
    @abstractmethod
    async def _validate_persona_context(self, context: WorkflowExecutionContext) -> bool:
        """Persona-specific context validation logic."""
        pass
    
    @abstractmethod
    async def _can_resolve_coordinates(self, missing_coordinates: set) -> bool:
        """Check if workflow can resolve missing coordinates during execution."""
        pass
    
    async def execute(self, context: WorkflowExecutionContext) -> WorkflowExecutionResult:
        """
        Execute workflow with comprehensive error handling and state management.
        
        Args:
            context: Execution context with session and workflow data
            
        Returns:
            WorkflowExecutionResult with execution outcome and metadata
        """
        start_time = datetime.now(timezone.utc)
        
        try:
            # Ensure workflow is initialized
            if not self._initialized:
                await self.initialize()
            
            # Validate execution context
            if not await self.validate_context(context):
                return WorkflowExecutionResult(
                    success=False,
                    workflow_id=self.workflow_id,
                    session_id=context.session_id,
                    error="Context validation failed"
                )
            
            # Resolve required coordinates if needed
            await self._resolve_coordinate_context(context)
            
            # Execute persona-specific workflow logic
            result_data = await self._execute_workflow_logic(context)
            
            # Calculate execution time
            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            
            # Generate response text from result
            response_text = await self._format_response(result_data, context)
            
            return WorkflowExecutionResult(
                success=True,
                workflow_id=self.workflow_id,
                session_id=context.session_id,
                result=result_data,
                response_text=response_text,
                execution_time_ms=execution_time,
                steps_completed=context.workflow_step,
                coordinates_resolved=list(context.coordinate_resolution_cache.keys())
            )
            
        except Exception as e:
            execution_time = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            
            return WorkflowExecutionResult(
                success=False,
                workflow_id=self.workflow_id,
                session_id=context.session_id,
                error=str(e),
                execution_time_ms=execution_time,
                steps_completed=context.workflow_step
            )
    
    @abstractmethod
    async def _execute_workflow_logic(self, context: WorkflowExecutionContext) -> Dict[str, Any]:
        """
        Core persona-specific workflow execution logic.
        
        Args:
            context: Validated execution context
            
        Returns:
            Dict containing workflow execution results
        """
        pass
    
    @abstractmethod
    async def _format_response(self, result_data: Dict[str, Any], context: WorkflowExecutionContext) -> str:
        """
        Format workflow results into persona-appropriate response text.
        
        Args:
            result_data: Results from workflow execution
            context: Execution context for persona-aware formatting
            
        Returns:
            Formatted response text for user
        """
        pass
    
    async def _resolve_coordinate_context(self, context: WorkflowExecutionContext) -> None:
        """
        Resolve Bimba coordinates needed for workflow execution.
        
        Integrates with Track A's GraphQL Bimba client for coordinate resolution.
        Caches resolved coordinates in context for efficient reuse.
        """
        missing_coordinates = set(self.coordinate_dependencies) - set(context.bimba_coordinates)
        
        for coordinate in missing_coordinates:
            if coordinate not in context.coordinate_resolution_cache:
                # In production, this would use Track A's BimbaGraphQLClient
                resolved_data = await self._resolve_single_coordinate(coordinate, context)
                context.coordinate_resolution_cache[coordinate] = resolved_data
                
                # Add to active coordinates
                if coordinate not in context.bimba_coordinates:
                    context.bimba_coordinates.append(coordinate)
    
    @abstractmethod
    async def _resolve_single_coordinate(self, coordinate: str, context: WorkflowExecutionContext) -> Dict[str, Any]:
        """
        Resolve a single Bimba coordinate for workflow context.
        
        Args:
            coordinate: Bimba coordinate to resolve (e.g., "#4-2-3")
            context: Execution context
            
        Returns:
            Resolved coordinate data
        """
        pass
    
    async def pause(self, context: WorkflowExecutionContext) -> bool:
        """
        Pause workflow execution and save checkpoint.
        
        Args:
            context: Current execution context
            
        Returns:
            bool: True if paused successfully
        """
        try:
            await self._save_checkpoint(context)
            return True
        except Exception as e:
            print(f"Error pausing workflow {self.workflow_id}: {e}")
            return False
    
    async def resume(self, context: WorkflowExecutionContext) -> bool:
        """
        Resume workflow execution from checkpoint.
        
        Args:
            context: Execution context with checkpoint data
            
        Returns:
            bool: True if resumed successfully
        """
        try:
            await self._restore_from_checkpoint(context)
            return True
        except Exception as e:
            print(f"Error resuming workflow {self.workflow_id}: {e}")
            return False
    
    @abstractmethod
    async def _save_checkpoint(self, context: WorkflowExecutionContext) -> None:
        """Save workflow checkpoint for pause/resume functionality."""
        pass
    
    @abstractmethod
    async def _restore_from_checkpoint(self, context: WorkflowExecutionContext) -> None:
        """Restore workflow state from checkpoint."""
        pass
    
    def get_workflow_info(self) -> Dict[str, Any]:
        """Get comprehensive workflow information for discovery and registration."""
        return {
            "workflow_id": self.workflow_id,
            "workflow_name": self.workflow_name,
            "workflow_description": self.workflow_description,
            "persona_type": self.persona_type.value,
            "required_context_keys": self.required_context_keys,
            "coordinate_dependencies": self.coordinate_dependencies,
            "capabilities": self._get_workflow_capabilities()
        }
    
    @abstractmethod
    def _get_workflow_capabilities(self) -> List[str]:
        """Return list of workflow capabilities for discovery."""
        pass
    
