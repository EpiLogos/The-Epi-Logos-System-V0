"""
Lightweight security logging hooks used by OAuth components.
These are intentionally minimal no-ops suitable for unit tests; production
deployments can wire richer sinks via dependency injection.
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


async def log_security_event(**kwargs: Any) -> None:
    logger.warning("security_event: %s", kwargs)


async def log_account_linking(**kwargs: Any) -> None:
    logger.info("account_linking: %s", kwargs)


async def log_security_alert(**kwargs: Any) -> None:
    logger.error("security_alert: %s", kwargs)

