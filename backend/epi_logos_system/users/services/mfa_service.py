"""
Minimal TOTP-based MFA service used by unit tests.
"""

from __future__ import annotations

import base64
import os
from urllib.parse import quote


class MfaService:
    def generate_totp_secret(self) -> str:
        # 20 random bytes -> base32 yields 32 chars
        return base64.b32encode(os.urandom(20)).decode("utf-8").strip("=")

    def generate_qr_code_url(self, *, user_email: str, secret: str, issuer: str) -> str:
        label = quote(user_email)
        issuer_q = quote(issuer)
        return f"otpauth://totp/{label}?secret={secret}&issuer={issuer_q}"

    def verify_totp_code(self, secret: str, code: str) -> bool:
        # Import locally so tests can patch pyotp.TOTP
        import pyotp  # type: ignore

        totp = pyotp.TOTP(secret)
        return bool(totp.verify(code, valid_window=1))

    def generate_backup_codes(self) -> list[str]:
        import secrets
        return [f"{secrets.randbelow(10**8):08d}" for _ in range(10)]

    def setup_mfa_for_user(self, user_id: str, email: str) -> dict:
        secret = self.generate_totp_secret()
        qr = self.generate_qr_code_url(user_email=email, secret=secret, issuer="Epi-Logos System")
        codes = self.generate_backup_codes()
        return {"secret": secret, "qr_code_url": qr, "backup_codes": codes}

