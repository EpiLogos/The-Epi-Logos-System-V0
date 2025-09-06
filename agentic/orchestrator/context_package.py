"""
ACT Protocol Context Package Implementation

Implements the foundational ACT Protocol Context Package assembly for persona workflows.
Creates Virtual File systems and manages lazy-loaded context building for agent instantiation.

Implements AC2: ACT Protocol foundation - Context Package assembly for persona workflows
"""

import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class VirtualFileType(str, Enum):
    """Virtual file types supported by ACT Protocol"""
    MARKDOWN = "md"
    YAML = "yaml" 
    JSON = "json"
    HTML = "html"


class VirtualFile(BaseModel):
    """
    A Virtual File in the ACT Protocol system.
    
    Virtual Files are delimited blocks of content with unique, fully-qualified paths
    that allow for precise, lazy-loaded context.
    """
    path: str
    file_type: VirtualFileType
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    size_bytes: int = Field(default=0)
    
    def model_post_init(self, __context):
        """Calculate file size after initialization"""
        self.size_bytes = len(self.content.encode('utf-8'))
    
    def to_act_format(self) -> str:
        """Convert to ACT Protocol format with delimiters"""
        return f"""==================== START: {self.path} ====================
{self.content}
==================== END: {self.path} ===================="""
    
    @classmethod
    def from_content(
        cls,
        path: str,
        content: str,
        file_type: Optional[VirtualFileType] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> "VirtualFile":
        """Create VirtualFile from content with automatic type detection"""
        if not file_type:
            # Detect type from file extension
            if path.endswith('.md'):
                file_type = VirtualFileType.MARKDOWN
            elif path.endswith('.yaml') or path.endswith('.yml'):
                file_type = VirtualFileType.YAML
            elif path.endswith('.json'):
                file_type = VirtualFileType.JSON
            elif path.endswith('.html'):
                file_type = VirtualFileType.HTML
            else:
                file_type = VirtualFileType.MARKDOWN  # Default
        
        return cls(
            path=path,
            file_type=file_type,
            content=content,
            metadata=metadata or {}
        )


class ContextPackage(BaseModel):
    """
    A Context Package - curated collection of Virtual Files for specific persona tasks.
    
    Context Packages contain everything an agent needs for a specific task, and nothing more.
    They implement lazy-loaded context building for efficient memory usage.
    """
    package_id: str
    persona: str
    task_type: str
    virtual_files: List[VirtualFile] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    @property
    def file_list(self) -> List[str]:
        """Get list of file paths in this package"""
        return [vf.path for vf in self.virtual_files]
    
    @property
    def total_size(self) -> int:
        """Get total size of all files in bytes"""
        return sum(vf.size_bytes for vf in self.virtual_files)
    
    def add_file(self, virtual_file: VirtualFile):
        """Add a virtual file to the package"""
        self.virtual_files.append(virtual_file)
    
    def get_file(self, path: str) -> Optional[VirtualFile]:
        """Get a specific virtual file by path"""
        for vf in self.virtual_files:
            if vf.path == path:
                return vf
        return None
    
    def to_context_bundle(self) -> str:
        """
        Convert to single-file execution bundle for agent consumption.
        
        This creates the "custom toolkit" - a bespoke, purpose-built context
        compiled at the moment of execution.
        """
        bundle_parts = [
            f"=== CONTEXT PACKAGE: {self.package_id} ===",
            f"Persona: {self.persona}",
            f"Task Type: {self.task_type}",
            f"Files: {len(self.virtual_files)}",
            f"Total Size: {self.total_size} bytes",
            f"Created: {self.created_at.isoformat()}",
            "",
            "=== VIRTUAL FILES ==="
        ]
        
        # Add each virtual file in ACT format
        for virtual_file in self.virtual_files:
            bundle_parts.append("")
            bundle_parts.append(virtual_file.to_act_format())
        
        return "\n".join(bundle_parts)


class ContextPackageBuilder:
    """
    Builder for creating Context Packages with ACT Protocol foundation.
    
    Implements modular addressing, lazy-loaded context, and structured interaction
    patterns for persona workflow execution.
    """
    
    def __init__(self):
        """Initialize the Context Package Builder"""
        self.virtual_file_cache: Dict[str, VirtualFile] = {}
        self.package_templates: Dict[str, Dict[str, Any]] = {}
        
        # Initialize basic templates
        self._initialize_templates()
        
        logger.info("ContextPackageBuilder initialized")
    
    def _initialize_templates(self):
        """Initialize basic package templates for different personas and tasks"""
        
        # Nara persona templates
        self.package_templates["nara_reflection"] = {
            "required_files": [
                "tasks/nara/reflection_guidance.md",
                "data/user/personal_context.json",
                "cache/previous_reflections.json"
            ],
            "optional_files": [
                "data/user/emotional_state.json",
                "cache/themes.json"
            ]
        }
        
        # Epii persona templates  
        self.package_templates["epii_synthesis"] = {
            "required_files": [
                "tasks/epii/synthesis_procedure.md",
                "data/knowledge/domain_context.json",
                "cache/bimba/coordinates.json"
            ],
            "optional_files": [
                "data/knowledge/related_concepts.json",
                "cache/insights.json"
            ]
        }
        
        # System persona templates
        self.package_templates["system_coordination"] = {
            "required_files": [
                "tasks/system/coordination_protocol.md",
                "data/system/available_personas.json",
                "state/system/current_status.yaml"
            ],
            "optional_files": [
                "data/user/preferences.json"
            ]
        }
    
    async def build_package(
        self,
        persona: str,
        session_context: Optional[Dict[str, Any]] = None,
        user_request: Optional[str] = None,
        bimba_context: Optional[List[str]] = None,
        task_type: Optional[str] = None
    ) -> ContextPackage:
        """
        Build a Context Package for a specific persona and task.
        
        This implements the core ACT Protocol foundation with lazy-loaded context
        building and modular resource addressing.
        """
        try:
            # Generate package ID
            package_id = f"{persona}_{task_type or 'general'}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Determine task type if not provided
            if not task_type:
                task_type = self._infer_task_type(persona, user_request)
            
            # Create context package
            package = ContextPackage(
                package_id=package_id,
                persona=persona,
                task_type=task_type,
                metadata={
                    'session_context': session_context or {},
                    'user_request': user_request,
                    'bimba_context': bimba_context or []
                }
            )
            
            # Add persona-specific task file
            task_file = await self._create_task_file(persona, task_type, user_request)
            package.add_file(task_file)
            
            # Add session context if available
            if session_context:
                context_file = self._create_context_file(session_context)
                package.add_file(context_file)
            
            # Add Bimba coordinate context if available
            if bimba_context:
                bimba_file = self._create_bimba_context_file(bimba_context)
                package.add_file(bimba_file)
            
            # Add state tracking file
            state_file = self._create_state_file(package_id, persona, task_type)
            package.add_file(state_file)
            
            logger.info(
                f"Built context package {package_id} for persona '{persona}' "
                f"with {len(package.virtual_files)} files ({package.total_size} bytes)"
            )
            
            return package
            
        except Exception as e:
            logger.error(f"Error building context package: {e}")
            # Return minimal fallback package
            return await self._create_fallback_package(persona)
    
    def _infer_task_type(self, persona: str, user_request: Optional[str]) -> str:
        """Infer task type based on persona and user request"""
        if not user_request:
            return "general"
        
        request_lower = user_request.lower()
        
        # Persona-specific task inference
        if persona == "nara":
            if any(keyword in request_lower for keyword in [
                'reflect', 'journal', 'diary', 'thoughts', 'feelings'
            ]):
                return "reflection"
            elif any(keyword in request_lower for keyword in [
                'process', 'understand', 'work through'
            ]):
                return "processing"
        
        elif persona == "epii":
            if any(keyword in request_lower for keyword in [
                'synthesize', 'analyze', 'connect', 'pattern'
            ]):
                return "synthesis"
            elif any(keyword in request_lower for keyword in [
                'wisdom', 'insight', 'meaning'
            ]):
                return "insight"
        
        elif persona == "system":
            if any(keyword in request_lower for keyword in [
                'help', 'guide', 'navigate'
            ]):
                return "coordination"
        
        return "general"
    
    async def _create_task_file(
        self, 
        persona: str, 
        task_type: str, 
        user_request: Optional[str]
    ) -> VirtualFile:
        """Create persona-specific task instruction file"""
        
        task_content = f"""# {persona.title()} Task: {task_type.title()}

## User Request
{user_request or 'General assistance requested'}

## Persona Guidelines
You are embodying the {persona} persona. Follow your persona-specific guidelines
and maintain consistency with your role throughout this interaction.

## Task Instructions
1. Analyze the user's request within your persona context
2. Apply your specialized knowledge and approach
3. Provide response that aligns with your persona's expertise
4. Maintain appropriate tone and style for your persona

## Context Available
- Session context (if provided)
- Bimba coordinate references (if available) 
- Previous interaction history (via session)

## Success Criteria
- Response demonstrates persona-appropriate expertise
- User needs are addressed within persona scope
- Context is appropriately utilized
- Persona consistency is maintained
"""
        
        return VirtualFile.from_content(
            path=f"tasks/{persona}/{task_type}_task.md",
            content=task_content,
            file_type=VirtualFileType.MARKDOWN,
            metadata={
                'persona': persona,
                'task_type': task_type,
                'auto_generated': True
            }
        )
    
    def _create_context_file(self, session_context: Dict[str, Any]) -> VirtualFile:
        """Create session context file in JSON format"""
        import json
        
        context_content = json.dumps(session_context, indent=2, default=str)
        
        return VirtualFile.from_content(
            path="data/session/context.json",
            content=context_content,
            file_type=VirtualFileType.JSON,
            metadata={'source': 'session_context'}
        )
    
    def _create_bimba_context_file(self, bimba_context: List[str]) -> VirtualFile:
        """Create Bimba coordinate context file"""
        import json
        
        bimba_data = {
            'coordinates': bimba_context,
            'count': len(bimba_context),
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        bimba_content = json.dumps(bimba_data, indent=2)
        
        return VirtualFile.from_content(
            path="cache/bimba/coordinates.json",
            content=bimba_content,
            file_type=VirtualFileType.JSON,
            metadata={'source': 'bimba_context', 'coordinate_count': len(bimba_context)}
        )
    
    def _create_state_file(self, package_id: str, persona: str, task_type: str) -> VirtualFile:
        """Create state tracking file for task progress"""
        import yaml
        
        state_data = {
            'package_id': package_id,
            'persona': persona,
            'task_type': task_type,
            'status': 'pending',
            'stage': 'initialization',
            'created_at': datetime.now(timezone.utc).isoformat(),
            'progress': {
                'started': False,
                'completed': False,
                'error': None
            }
        }
        
        state_content = yaml.dump(state_data, default_flow_style=False)
        
        return VirtualFile.from_content(
            path=f"state/{persona}/task_{package_id}.yaml",
            content=state_content,
            file_type=VirtualFileType.YAML,
            metadata={'package_id': package_id, 'tracking': True}
        )
    
    async def _create_fallback_package(self, persona: str) -> ContextPackage:
        """Create minimal fallback package for error cases"""
        package = ContextPackage(
            package_id=f"fallback_{persona}_{datetime.now().strftime('%H%M%S')}",
            persona=persona,
            task_type="fallback"
        )
        
        # Add minimal task file
        fallback_content = f"""# Fallback Task for {persona.title()}

An error occurred while building the full context package. 
This is a minimal fallback to ensure the persona can still respond.

Please provide a helpful response within your {persona} persona capabilities.
"""
        
        fallback_file = VirtualFile.from_content(
            path=f"tasks/{persona}/fallback.md",
            content=fallback_content,
            metadata={'fallback': True}
        )
        
        package.add_file(fallback_file)
        
        return package
    
    def get_package_template(self, template_name: str) -> Optional[Dict[str, Any]]:
        """Get a package template by name"""
        return self.package_templates.get(template_name)
    
    def add_package_template(self, name: str, template: Dict[str, Any]):
        """Add a new package template"""
        self.package_templates[name] = template
        logger.info(f"Added package template: {name}")
    
    def cache_virtual_file(self, virtual_file: VirtualFile):
        """Cache a virtual file for reuse"""
        self.virtual_file_cache[virtual_file.path] = virtual_file
    
    def get_cached_file(self, path: str) -> Optional[VirtualFile]:
        """Get a cached virtual file"""
        return self.virtual_file_cache.get(path)
    
    def get_builder_stats(self) -> Dict[str, Any]:
        """Get statistics about the context builder"""
        return {
            'cached_files': len(self.virtual_file_cache),
            'package_templates': len(self.package_templates),
            'template_names': list(self.package_templates.keys()),
            'cache_size_bytes': sum(
                vf.size_bytes for vf in self.virtual_file_cache.values()
            )
        }