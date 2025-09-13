"""
Security Audit Logging service.
Implements MVP Security Baseline - Essential audit logging functionality.
"""

import uuid
from typing import Dict, Optional, Any, List
from datetime import datetime, timezone, timedelta

from backend.epi_logos_system.shared.exceptions import AuditError


class AuditService:
    """Service for managing security audit events and logging."""
    
    def __init__(self, mongodb_client):
        """
        Initialize audit service.
        
        Args:
            mongodb_client: MongoDB client for audit event storage
        """
        self.mongodb_client = mongodb_client
        
        # Valid event types for MVP security baseline
        self.valid_event_types = {
            "login_success",
            "login_failure", 
            "logout",
            "mfa_enabled",
            "mfa_disabled",
            "mfa_verification_success",
            "mfa_verification_failure",
            "password_changed",
            "password_reset_requested",
            "password_reset_completed",
            "account_locked",
            "account_unlocked",
            "data_export_requested",
            "suspicious_activity",
            "session_created",
            "session_terminated"
        }
        
        # Valid severity levels
        self.valid_severity_levels = {"low", "medium", "high", "critical"}
    
    async def log_security_event(
        self,
        event_type: str,
        severity: str,
        ip_address: str,
        user_id: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Log a security event.
        
        Args:
            event_type: Type of security event
            severity: Severity level (low, medium, high, critical)
            ip_address: IP address where event occurred
            user_id: Optional user ID associated with event
            user_agent: Optional user agent string
            metadata: Optional additional event metadata
            
        Returns:
            Dict with success status and event ID
            
        Raises:
            AuditError: If event logging fails
        """
        # Validate event type
        if event_type not in self.valid_event_types:
            raise AuditError(f"Invalid event type: {event_type}")
        
        # Validate severity level
        if severity not in self.valid_severity_levels:
            raise AuditError(f"Invalid severity level: {severity}")
        
        # Sanitize metadata to prevent injection attacks
        sanitized_metadata = self._sanitize_metadata(metadata or {})
        
        # Create event document
        event_document = {
            "event_id": str(uuid.uuid4()),
            "event_type": event_type,
            "severity": severity,
            "timestamp": timestamp or datetime.now(timezone.utc),
            "ip_address": ip_address,
            "user_id": user_id,
            "user_agent": user_agent,
            "metadata": sanitized_metadata
        }
        
        try:
            # Store in MongoDB
            result = await self.mongodb_client.security_events.insert_one(event_document)
            
            return {
                "success": True,
                "event_id": event_document["event_id"],
                "inserted_id": str(result.inserted_id)
            }
            
        except Exception as e:
            raise AuditError(f"Failed to log security event: {str(e)}")
    
    async def get_user_audit_log(
        self, 
        user_id: str, 
        limit: int = 50,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get audit log for specific user.
        
        Args:
            user_id: User ID to get audit log for
            limit: Maximum number of events to return
            start_date: Optional start date filter
            end_date: Optional end date filter
            
        Returns:
            Dict with user's audit events
        """
        # Build query
        query = {"user_id": user_id}
        
        if start_date or end_date:
            timestamp_filter = {}
            if start_date:
                timestamp_filter["$gte"] = start_date
            if end_date:
                timestamp_filter["$lte"] = end_date
            query["timestamp"] = timestamp_filter
        
        try:
            # Query MongoDB
            res = self.mongodb_client.security_events.find(query)
            # Support both chained cursor and direct async list
            try:
                cursor = res.sort("timestamp", -1).limit(limit)
                events = await cursor.to_list(length=limit)
            except AttributeError:
                # If AsyncMock returns coroutine-like
                if hasattr(res, 'to_list'):
                    events = await res.to_list(length=limit)
                else:
                    events = list(res)
            
            return {
                "events": events,
                "count": len(events),
                "user_id": user_id
            }
            
        except Exception as e:
            raise AuditError(f"Failed to retrieve user audit log: {str(e)}")
    
    async def get_security_events_by_type(
        self, 
        event_type: str, 
        limit: int = 100,
        hours_back: int = 24
    ) -> Dict[str, Any]:
        """
        Get security events by type within time window.
        
        Args:
            event_type: Type of events to retrieve
            limit: Maximum number of events to return
            hours_back: Hours back from now to search
            
        Returns:
            Dict with matching events
        """
        # Calculate time window
        start_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        
        query = {
            "event_type": event_type,
            "timestamp": {"$gte": start_time}
        }
        
        try:
            cursor = self.mongodb_client.security_events.find(query).sort("timestamp", -1).limit(limit)
            events = await cursor.to_list(length=limit)
            
            return {
                "events": events,
                "count": len(events),
                "event_type": event_type,
                "time_window_hours": hours_back
            }
            
        except Exception as e:
            raise AuditError(f"Failed to retrieve events by type: {str(e)}")
    
    async def get_recent_security_events(
        self, 
        limit: int = 50,
        severity_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get recent security events across all users.
        
        Args:
            limit: Maximum number of events to return
            severity_filter: Optional severity level filter
            
        Returns:
            Dict with recent events
        """
        # Build query
        query = {}
        if severity_filter and severity_filter in self.valid_severity_levels:
            query["severity"] = severity_filter
        
        try:
            res = self.mongodb_client.security_events.find(query)
            try:
                cursor = res.sort("timestamp", -1).limit(limit)
                events = await cursor.to_list(length=limit)
            except AttributeError:
                if hasattr(res, 'to_list'):
                    events = await res.to_list(length=limit)
                else:
                    events = list(res)
            
            return {
                "events": events,
                "count": len(events),
                "severity_filter": severity_filter
            }
            
        except Exception as e:
            raise AuditError(f"Failed to retrieve recent events: {str(e)}")
    
    async def get_security_events_by_severity(
        self, 
        severity: str, 
        limit: int = 100,
        hours_back: int = 24
    ) -> Dict[str, Any]:
        """
        Get security events by severity level.
        
        Args:
            severity: Severity level to filter by
            limit: Maximum number of events to return
            hours_back: Hours back from now to search
            
        Returns:
            Dict with matching events
        """
        if severity not in self.valid_severity_levels:
            raise AuditError(f"Invalid severity level: {severity}")
        
        # Calculate time window
        start_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        
        query = {
            "severity": severity,
            "timestamp": {"$gte": start_time}
        }
        
        try:
            res = self.mongodb_client.security_events.find(query)
            try:
                cursor = res.sort("timestamp", -1).limit(limit)
                events = await cursor.to_list(length=limit)
            except AttributeError:
                if hasattr(res, 'to_list'):
                    events = await res.to_list(length=limit)
                else:
                    events = list(res)
            
            return {
                "events": events,
                "count": len(events),
                "severity": severity,
                "time_window_hours": hours_back
            }
            
        except Exception as e:
            raise AuditError(f"Failed to retrieve events by severity: {str(e)}")
    
    async def search_audit_events(
        self,
        ip_address: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        Search audit events with various filters.
        
        Args:
            ip_address: Optional IP address filter
            start_date: Optional start date filter
            end_date: Optional end date filter
            limit: Maximum number of events to return
            
        Returns:
            Dict with matching events
        """
        # Build query
        query = {}
        
        if ip_address:
            query["ip_address"] = ip_address
        
        if start_date or end_date:
            timestamp_filter = {}
            if start_date:
                timestamp_filter["$gte"] = start_date
            if end_date:
                timestamp_filter["$lte"] = end_date
            query["timestamp"] = timestamp_filter
        
        try:
            res = self.mongodb_client.security_events.find(query)
            try:
                cursor = res.sort("timestamp", -1).limit(limit)
                events = await cursor.to_list(length=limit)
            except AttributeError:
                if hasattr(res, 'to_list'):
                    events = await res.to_list(length=limit)
                else:
                    events = list(res)
            
            return {
                "events": events,
                "count": len(events),
                "filters": {
                    "ip_address": ip_address,
                    "start_date": start_date,
                    "end_date": end_date
                }
            }
            
        except Exception as e:
            raise AuditError(f"Failed to search audit events: {str(e)}")
    
    async def get_audit_statistics(self, days: int = 30) -> Dict[str, Any]:
        """
        Get audit statistics for the specified time period.
        
        Args:
            days: Number of days back to calculate statistics
            
        Returns:
            Dict with audit statistics
        """
        # Calculate time window
        start_time = datetime.now(timezone.utc) - timedelta(days=days)
        
        query = {"timestamp": {"$gte": start_time}}
        
        try:
            total_events = await self.mongodb_client.security_events.count_documents(query)
            
            return {
                "total_events": total_events,
                "period_days": days,
                "start_date": start_time,
                "end_date": datetime.now(timezone.utc)
            }
            
        except Exception as e:
            raise AuditError(f"Failed to get audit statistics: {str(e)}")
    
    def _sanitize_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize metadata to prevent MongoDB injection attacks.
        
        Args:
            metadata: Raw metadata dictionary
            
        Returns:
            Sanitized metadata dictionary
        """
        sanitized = {}
        
        for key, value in metadata.items():
            # Remove MongoDB operators that could be injection attempts
            if isinstance(key, str) and key.startswith('$'):
                continue
                
            # Convert non-JSON-serializable objects to strings
            if isinstance(value, (datetime, uuid.UUID)):
                sanitized[key] = str(value)
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_metadata(value)
            elif isinstance(value, (str, int, float, bool, type(None))):
                sanitized[key] = value
            else:
                sanitized[key] = str(value)
        
        return sanitized
