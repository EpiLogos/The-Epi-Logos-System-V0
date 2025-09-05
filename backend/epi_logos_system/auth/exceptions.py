"""
Authentication exceptions
"""


class UnauthorizedError(Exception):
    """Raised when authentication fails"""
    pass


class ForbiddenError(Exception):
    """Raised when user lacks permission"""
    pass