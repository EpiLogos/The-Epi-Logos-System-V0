"""
Dependency injection container for the Epi-Logos System.
Centralizes service dependency management and configuration injection.
"""
import logging
from typing import Dict, Any, Optional

# Updated absolute imports for new domain structure
from backend.epi_logos_system.shared.config import EnvironmentConfig
from backend.epi_logos_system.auth.services.password_service import PasswordService
from backend.epi_logos_system.auth.services.jwt_service import JWTService
# SessionService removed - using stateless JWT
from backend.epi_logos_system.users.services.user_service import UserService
# TODO: Fix imports in other services later
# from backend.epi_logos_system.auth.services.mfa_service import MfaService
# from backend.epi_logos_system.auth.services.password_reset_service import PasswordResetService
from backend.epi_logos_system.users.repositories.user_repository import UserRepository
# from backend.epi_logos_system.users.repositories.mongo_user_repository import MongoUserRepository

logger = logging.getLogger(__name__)


class Container:
    """Simple dependency injection container for all services."""
    
    def __init__(self):
        """Initialize container with service instances."""
        self._config: Optional[EnvironmentConfig] = None
        self._password_service: Optional[PasswordService] = None
        self._jwt_service: Optional[JWTService] = None
        self._mfa_service: Optional = None
        self._password_reset_service: Optional = None
        # Session service removed - using stateless JWT
        self._user_service: Optional[UserService] = None
        self._user_repository: Optional[UserRepository] = None
        self._instances: Dict[str, Any] = {}
    
    def config(self) -> EnvironmentConfig:
        """Get configuration instance (singleton)."""
        if self._config is None:
            self._config = EnvironmentConfig()
            logger.debug("Configuration instance created")
        return self._config
    
    def password_service(self) -> PasswordService:
        """Get password service instance (singleton)."""
        if self._password_service is None:
            self._password_service = PasswordService()
            logger.debug("Password service instance created")
        return self._password_service
    
    def jwt_service(self) -> JWTService:
        """Get JWT service instance (singleton)."""
        if self._jwt_service is None:
            config = self.config()
            self._jwt_service = JWTService(
                secret_key=config.jwt_secret,
                algorithm=config.jwt_algorithm,
                expiration_hours=config.jwt_expiration_hours
            )
            logger.debug("JWT service instance created")
        return self._jwt_service
    
    # session_service method removed - using stateless JWT
    
    def mfa_service(self):
        """Get MFA service instance (singleton)."""
        if self._mfa_service is None:
            self._mfa_service = MfaService()
            logger.debug("MFA service instance created")
        return self._mfa_service
    
    def password_reset_service(self):
        """Get password reset service instance (singleton)."""
        if self._password_reset_service is None:
            config = self.config()
            self._password_reset_service = PasswordResetService(
                user_repository=self.user_repository(),
                audit_service=None,  # Will be None for minimal implementation
                jwt_secret=config.jwt_secret
            )
            logger.debug("Password reset service instance created")
        return self._password_reset_service
    
    def user_repository(self) -> UserRepository:
        """Get user repository instance (singleton)."""
        if self._user_repository is None:
            from backend.epi_logos_system.users.repositories.mongo_user_repository import MongoUserRepository
            self._user_repository = MongoUserRepository()
            logger.debug("User repository instance created")
        return self._user_repository
    
    def user_service(self) -> UserService:
        """Get user service instance (singleton) with all dependencies."""
        if self._user_service is None:
            self._user_service = UserService(
                user_repository=self.user_repository(),
                password_service=self.password_service(),
                jwt_service=self.jwt_service()
                # Session service removed for stateless JWT architecture
            )
            logger.debug("User service instance created with dependencies (stateless JWT)")
        return self._user_service
    
    def reset_singletons(self):
        """Reset all singleton instances."""
        self._config = None
        self._password_service = None
        self._jwt_service = None
        self._mfa_service = None
        self._password_reset_service = None
        # self._session_service = None
        self._user_service = None
        self._user_repository = None
        self._instances.clear()
        logger.info("All singleton instances reset")
    
    def wire(self, modules=None):
        """Wire the container (placeholder for compatibility)."""
        logger.info(f"Container wired to modules: {modules or []}")


# Global container instance
_container: Container = None


def get_container() -> Container:
    """Get the global container instance."""
    global _container
    if _container is None:
        _container = Container()
        _container.wire(modules=[
            "backend.api.users",
            "backend.api.security",
            "backend.services.user_service", 
            "backend.services.jwt_service",
            "backend.services.mfa_service",
            "backend.services.password_reset_service",
            # "backend.services.session_service",
            "backend.services.password_service",
        ])
        logger.info("Container created and wired")
    return _container


def reset_container():
    """Reset the global container instance."""
    global _container
    if _container is not None:
        _container.reset_singletons()
    _container = None
    logger.info("Container reset")


# Convenience functions for FastAPI dependency injection
def get_config() -> EnvironmentConfig:
    """Get configuration instance."""
    return get_container().config()


def get_password_service() -> PasswordService:
    """Get password service instance."""
    return get_container().password_service()


def get_jwt_service() -> JWTService:
    """Get JWT service instance."""
    return get_container().jwt_service()


#def get_session_service() -> SessionService:
    """Get session service instance."""
#    return get_container().session_service()


def get_user_repository() -> UserRepository:
    """Get user repository instance."""
    return get_container().user_repository()


def get_user_service() -> UserService:
    """Get user service instance with all dependencies injected."""
    return get_container().user_service()


# TODO: Uncomment when MFA service imports are fixed
# def get_mfa_service() -> MfaService:
#     """Get MFA service instance."""
#     return get_container().mfa_service()


# TODO: Uncomment when password reset service imports are fixed
# def get_password_reset_service() -> PasswordResetService:
#     """Get password reset service instance with dependencies injected."""
#     return get_container().password_reset_service()