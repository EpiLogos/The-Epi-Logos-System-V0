class TOTP:
    def __init__(self, secret):
        self.secret = secret

    def verify(self, code, valid_window=1):
        # Minimal placeholder; tests patch this
        return False

