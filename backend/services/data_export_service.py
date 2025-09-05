"""
User Data Export service.
Implements MVP Security Baseline - Simple data export functionality.
"""

import uuid
import secrets
from typing import Dict, Optional, Any
from datetime import datetime, timezone, timedelta

from ..core.exceptions import DataExportError, UserNotFoundError


class DataExportService:
    """Service for exporting user data in compliance with privacy regulations."""
    
    def __init__(self, user_repository, mongodb_client, audit_service):
        """
        Initialize data export service.
        
        Args:
            user_repository: Repository for user data operations
            mongodb_client: MongoDB client for additional data retrieval
            audit_service: Service for security event logging
        """
        self.user_repository = user_repository
        self.mongodb_client = mongodb_client
        self.audit_service = audit_service
        
        # Rate limiting: 1 export per day per user
        self.export_rate_limit = 86400  # 24 hours in seconds
    
    async def export_user_data(self, user_id: str, ip_address: str) -> Dict[str, Any]:
        """
        Export complete user data in JSON format.
        
        Args:
            user_id: User ID to export data for
            ip_address: IP address of requester
            
        Returns:
            Dict with user's complete data export
            
        Raises:
            UserNotFoundError: If user not found
            DataExportError: If export fails or rate limited
        """
        # Check rate limit
        if not await self._check_export_rate_limit(user_id):
            raise DataExportError("Rate limit exceeded. You can export data once per day.")
        
        # Get user data
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise UserNotFoundError("User not found", user_id=user_id)
        
        # Generate unique export ID
        export_id = secrets.token_urlsafe(16)
        export_timestamp = datetime.now(timezone.utc)
        
        try:
            # Gather all user data
            export_data = await self._gather_user_data(user_id, user)
            
            # Add export metadata
            export_data["account_metadata"] = {
                "export_generated_at": export_timestamp,
                "export_format_version": "1.0",
                "export_id": export_id,
                "data_categories": list(export_data.keys())
            }
            
            # Log security event
            await self.audit_service.log_security_event(
                user_id=user_id,
                event_type="data_export_requested",
                severity="medium",
                ip_address=ip_address,
                metadata={
                    "export_id": export_id,
                    "data_categories": len(export_data) - 1  # Exclude metadata
                }
            )
            
            # Update rate limit
            await self._update_export_rate_limit(user_id)
            
            return {
                "success": True,
                "export_id": export_id,
                "generated_at": export_timestamp,
                "export_data": export_data
            }
            
        except Exception as e:
            raise DataExportError(f"Failed to export user data: {str(e)}")
    
    async def _gather_user_data(self, user_id: str, user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Gather all user data from various sources.
        
        Args:
            user_id: User ID
            user: User document
            
        Returns:
            Dict with complete user data
        """
        export_data = {}
        
        # 1. User profile data (sanitized)
        export_data["user_profile"] = self._sanitize_user_profile(user)
        
        # 2. Security events
        try:
            security_events_result = await self.audit_service.get_user_audit_log(
                user_id, limit=1000
            )
            export_data["security_events"] = security_events_result.get("events", [])
        except Exception:
            export_data["security_events"] = []
        
        # 3. User preferences
        try:
            preferences = await self.mongodb_client.user_preferences.find_one(
                {"user_id": user_id}
            )
            export_data["preferences"] = preferences or {}
        except Exception:
            export_data["preferences"] = {}
        
        # 4. Additional data sources can be added here
        # For MVP, we include basic categories
        
        return export_data
    
    def _sanitize_user_profile(self, user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize user profile data for export (remove sensitive fields).
        
        Args:
            user: Raw user document
            
        Returns:
            Sanitized user profile
        """
        # Fields to exclude from export (sensitive data)
        excluded_fields = {
            "_id",
            "password_hash", 
            "mfa_secret",
            "internal_notes",
            "admin_flags",
            "system_metadata"
        }
        
        # Fields to include (safe for export)
        safe_profile = {}
        
        for key, value in user.items():
            if key not in excluded_fields:
                # Convert datetime objects to ISO strings for JSON serialization
                if isinstance(value, datetime):
                    safe_profile[key] = value.isoformat()
                else:
                    safe_profile[key] = value
        
        return safe_profile
    
    async def _check_export_rate_limit(self, user_id: str) -> bool:
        """
        Check if user can export data (rate limiting).
        
        Args:
            user_id: User ID to check
            
        Returns:
            True if export is allowed, False if rate limited
        """
        # In a real implementation, this would check Redis or database
        # For MVP, we'll implement basic rate limiting logic
        
        # This is a simplified implementation
        # In production, you'd store last export timestamp in Redis/DB
        return True  # For MVP, always allow (tests will override this)
    
    async def _update_export_rate_limit(self, user_id: str) -> None:
        """
        Update export rate limit timestamp for user.
        
        Args:
            user_id: User ID to update
        """
        # In production, this would update Redis with current timestamp
        # For MVP, this is a placeholder
        pass
    
    async def get_export_history(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's data export history.
        
        Args:
            user_id: User ID to get history for
            
        Returns:
            Dict with export history
        """
        try:
            # Query audit logs for data export events
            export_events = await self.audit_service.get_security_events_by_type(
                "data_export_requested",
                limit=50,
                hours_back=24 * 30  # 30 days
            )
            
            # Filter events for this user
            user_exports = [
                event for event in export_events.get("events", [])
                if event.get("user_id") == user_id
            ]
            
            return {
                "exports": user_exports,
                "count": len(user_exports),
                "last_export_at": user_exports[0].get("timestamp") if user_exports else None
            }
            
        except Exception as e:
            return {
                "exports": [],
                "count": 0,
                "error": f"Failed to retrieve export history: {str(e)}"
            }
    
    def get_supported_formats(self) -> Dict[str, Any]:
        """
        Get supported export formats.
        
        Returns:
            Dict with supported formats
        """
        return {
            "formats": [
                {
                    "name": "JSON",
                    "description": "JavaScript Object Notation - machine readable",
                    "mime_type": "application/json",
                    "default": True
                }
            ],
            "current_version": "1.0"
        }
    
    def get_data_categories(self) -> Dict[str, Any]:
        """
        Get available data categories for export.
        
        Returns:
            Dict with data categories
        """
        return {
            "categories": [
                {
                    "name": "user_profile",
                    "description": "Basic user profile information",
                    "includes": ["name", "email", "account settings"]
                },
                {
                    "name": "security_events", 
                    "description": "Account security and access history",
                    "includes": ["login history", "password changes", "security events"]
                },
                {
                    "name": "preferences",
                    "description": "User preferences and settings",
                    "includes": ["theme", "language", "notification settings"]
                },
                {
                    "name": "account_metadata",
                    "description": "Export metadata and timestamps",
                    "includes": ["export info", "format version", "generation time"]
                }
            ]
        }