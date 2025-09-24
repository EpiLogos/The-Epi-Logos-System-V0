"""
User document models for MongoDB.
Implements comprehensive user data structures with validation and business logic.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict
from bson import ObjectId
import re


class PyObjectId(ObjectId):
    """Custom ObjectId class for Pydantic v2 compatibility."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v, handler=None):
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class UserPreferences(BaseModel):
    """User preference settings."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    notifications: bool = True
    theme: str = "auto"  # light, dark, auto
    language: str = "en"
    
    @field_validator('theme')
    @classmethod
    def validate_theme(cls, v):
        if v not in ["light", "dark", "auto"]:
            raise ValueError("Invalid theme")
        return v


class OAuthProvider(BaseModel):
    """OAuth provider integration data."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    provider: str
    providerId: str
    linkedAt: datetime
    
    @field_validator('provider')
    @classmethod
    def validate_provider(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Provider name required")
        return v


class UserMetadata(BaseModel):
    """User metadata for tracking and analytics."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    registrationSource: str  # email, oauth
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None


class User(BaseModel):
    """Main user document model for MongoDB."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    email: str
    passwordHash: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    profilePicture: Optional[str] = None
    tier: str = "free"  # free, patron
    isAdmin: bool = False  # Admin privileges flag
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    lastLoginAt: Optional[datetime] = None
    lastActiveAt: Optional[datetime] = None
    isEmailVerified: bool = False
    oauthProviders: List[OAuthProvider] = Field(default_factory=list)
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    metadata: UserMetadata

    # MFA (Multi-Factor Authentication) fields
    mfaEnabled: bool = False
    mfaSecret: Optional[str] = None  # TOTP secret (encrypted in production)
    backupCodes: List[str] = Field(default_factory=list)  # Hashed backup codes
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError("Invalid email")
        return v.lower()
    
    @field_validator('tier')
    @classmethod
    def validate_tier(cls, v):
        if v not in ["free", "patron"]:
            raise ValueError("Invalid tier")
        return v
    
    def to_public_dict(self) -> Dict[str, Any]:
        """Convert to dictionary excluding sensitive data."""
        user_dict = self.model_dump(by_alias=True)

        # Remove sensitive fields
        user_dict.pop('passwordHash', None)
        user_dict.pop('mfaSecret', None)  # Never expose MFA secret
        user_dict.pop('backupCodes', None)  # Never expose backup codes

        # Add password status for OAuth integration
        user_dict['hasPassword'] = self.has_password()

        # Add MFA status (safe to expose)
        user_dict['hasMFA'] = self.has_mfa()

        # Convert ObjectId to string for JSON serialization
        if '_id' in user_dict and user_dict['_id']:
            user_dict['_id'] = str(user_dict['_id'])

        # Convert datetime objects to ISO strings
        for field in ['createdAt', 'lastLoginAt', 'lastActiveAt']:
            if user_dict.get(field):
                user_dict[field] = user_dict[field].isoformat()
        
        # Convert nested datetime objects
        for provider in user_dict.get('oauthProviders', []):
            if provider.get('linkedAt'):
                provider['linkedAt'] = provider['linkedAt'].isoformat()
        
        return user_dict
    
    def has_password(self) -> bool:
        """Check if user has a password set."""
        return self.passwordHash is not None

    def has_mfa(self) -> bool:
        """Check if user has MFA enabled and configured."""
        return bool(self.mfaEnabled and self.mfaSecret and len(self.mfaSecret.strip()) > 0)

    def has_oauth_provider(self, provider: str) -> bool:
        """Check if user has a specific OAuth provider linked."""
        return any(oauth.provider == provider for oauth in self.oauthProviders)
    
    def get_oauth_provider(self, provider: str) -> Optional[OAuthProvider]:
        """Get OAuth provider data for a specific provider."""
        for oauth in self.oauthProviders:
            if oauth.provider == provider:
                return oauth
        return None
    
    def add_oauth_provider(self, provider: str, provider_id: str) -> None:
        """Add a new OAuth provider to the user."""
        if not self.has_oauth_provider(provider):
            oauth_provider = OAuthProvider(
                provider=provider,
                providerId=provider_id,
                linkedAt=datetime.now(timezone.utc)
            )
            self.oauthProviders.append(oauth_provider)
    
    def remove_oauth_provider(self, provider: str) -> bool:
        """Remove an OAuth provider from the user."""
        initial_count = len(self.oauthProviders)
        self.oauthProviders = [
            oauth for oauth in self.oauthProviders 
            if oauth.provider != provider
        ]
        return len(self.oauthProviders) < initial_count
    
    def update_last_login(self) -> None:
        """Update the last login timestamp."""
        self.lastLoginAt = datetime.now(timezone.utc)
    
    def update_last_active(self) -> None:
        """Update the last active timestamp."""
        self.lastActiveAt = datetime.now(timezone.utc)
    
    def can_remove_oauth_provider(self, provider: str) -> bool:
        """
        Check if an OAuth provider can be safely removed.
        User must have either a password or another OAuth provider.
        """
        if not self.has_oauth_provider(provider):
            return False
        
        # Can remove if user has a password
        if self.has_password():
            return True
        
        # Can remove if user has other OAuth providers
        other_providers = [
            oauth for oauth in self.oauthProviders 
            if oauth.provider != provider
        ]
        return len(other_providers) > 0


class UserSession(BaseModel):
    """User session model for Redis storage."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    userId: str
    sessionId: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    lastAccessedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expiresAt: datetime
    ipAddress: str
    userAgent: str
    isActive: bool = True
    
    def is_expired(self) -> bool:
        """Check if session is expired."""
        return datetime.now(timezone.utc) > self.expiresAt
    
    def refresh_access(self) -> None:
        """Update last accessed timestamp."""
        self.lastAccessedAt = datetime.now(timezone.utc)
    
    def deactivate(self) -> None:
        """Deactivate the session."""
        self.isActive = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for Redis storage."""
        session_dict = self.model_dump()
        
        # Convert datetime objects to timestamps for Redis
        for field in ['createdAt', 'lastAccessedAt', 'expiresAt']:
            if session_dict.get(field):
                session_dict[field] = session_dict[field].timestamp()
        
        return session_dict
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'UserSession':
        """Create session from dictionary data."""
        # Convert timestamps back to datetime objects
        for field in ['createdAt', 'lastAccessedAt', 'expiresAt']:
            if field in data and isinstance(data[field], (int, float)):
                data[field] = datetime.fromtimestamp(data[field])
        
        return cls(**data)


class UserRegistrationRequest(BaseModel):
    """Request model for user registration."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    email: str
    password: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    linkOAuthAccount: bool = False
    oauthProvider: Optional[str] = None
    oauthId: Optional[str] = None
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError("Invalid email format")
        return v.lower()
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if v is not None:
            if len(v) < 8:
                raise ValueError("Password must be at least 8 characters long")
            if not re.search(r'[A-Z]', v):
                raise ValueError("Password must contain at least one uppercase letter")
            if not re.search(r'[a-z]', v):
                raise ValueError("Password must contain at least one lowercase letter")
            if not re.search(r'\d', v):
                raise ValueError("Password must contain at least one digit")
            if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
                raise ValueError("Password must contain at least one special character")
        return v


class UserLoginRequest(BaseModel):
    """Request model for user login."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    email: str
    password: str
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError("Invalid email format")
        return v.lower()


class UserProfileUpdateRequest(BaseModel):
    """Request model for user profile updates."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    firstName: Optional[str] = None
    lastName: Optional[str] = None
    profilePicture: Optional[str] = None
    preferences: Optional[UserPreferences] = None
    isAdmin: Optional[bool] = None  # Admin status (requires admin privileges to change)

    def has_updates(self) -> bool:
        """Check if request contains any updates."""
        return any([
            self.firstName is not None,
            self.lastName is not None,
            self.profilePicture is not None,
            self.preferences is not None,
            self.isAdmin is not None
        ])


class OAuthLinkRequest(BaseModel):
    """Request model for linking OAuth accounts."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    provider: str
    providerId: str
    accessToken: str  # OAuth access token for verification
    
    @field_validator('provider')
    @classmethod
    def validate_provider(cls, v):
        supported_providers = ["google", "github", "microsoft"]
        if v not in supported_providers:
            raise ValueError(f"Unsupported OAuth provider: {v}")
        return v