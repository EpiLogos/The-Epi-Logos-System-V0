"""
OAuth authentication exceptions for error handling and security validation.
"""


class OAuthError(Exception):
    """Base OAuth error class."""
    pass


class AuthenticationRequiredError(OAuthError):
    """Raised when authentication is required for an operation."""
    pass


class ReauthenticationRequiredError(OAuthError):
    """Raised when recent password re-authentication is required."""
    pass


class InvalidStateError(OAuthError):
    """Raised when OAuth state parameter validation fails (CSRF protection)."""
    pass


class InvalidNonceError(OAuthError):
    """Raised when OIDC nonce validation fails."""
    pass


class NonceExpiredError(InvalidNonceError):
    """Raised when nonce has expired."""
    pass


class NonceReplayError(InvalidNonceError):
    """Raised when nonce reuse is detected (replay attack)."""
    pass


class PKCEValidationError(OAuthError):
    """Raised when PKCE validation fails."""
    pass


class TokenValidationError(OAuthError):
    """Raised when token validation with external provider fails."""
    pass


class RevocationCleanupError(OAuthError):
    """Raised when token revocation cleanup fails."""
    pass


class DuplicateAccountError(OAuthError):
    """Raised when attempting to link duplicate accounts."""
    pass


class AccountLinkingError(OAuthError):
    """Raised during secure account linking failures."""
    pass


class CSRFProtectionError(OAuthError):
    """Raised when CSRF protection validation fails."""
    pass


class StateExpiredError(OAuthError):
    """Raised when OAuth state has expired."""
    pass


class NonceValidationError(OAuthError):
    """General nonce validation error."""
    pass


class TokenRevocationError(OAuthError):
    """Raised during token revocation handling."""
    pass


class StateValidationError(OAuthError):
    """General state validation error."""
    pass