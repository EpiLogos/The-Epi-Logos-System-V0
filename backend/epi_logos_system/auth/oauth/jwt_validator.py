"""
Stub JWT validator used in tests. In production, wire to real JWT validation.
"""
from typing import Dict, Any


def validate_id_token(token: str) -> Dict[str, Any]:
    # Minimal stub; tests will patch this.
    return {"nonce": None}

