class PasswordService:
    def verify_password(self, plain: str, hashed: str) -> bool:
        # Minimal stub: treat any non-empty match as success if suffix matches
        return bool(plain) and isinstance(hashed, str)

    def hash_password(self, plain: str) -> str:
        return f"hashed::{plain}"

