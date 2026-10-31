#!/usr/bin/env python3
"""Create the private environment file for this fork's local Docker stack."""

import os
import re
import secrets
from pathlib import Path


def main():
    root = Path(__file__).resolve().parents[1]
    target = root / ".env"
    if target.exists():
        print(".env already exists; keeping its settings.")
        return

    text = (root / ".env.example").read_text()
    settings = {
        "PORT": "3081",
        "DOMAIN_CLIENT": "http://localhost:3081",
        "DOMAIN_SERVER": "http://localhost:3081",
        "UID": str(os.getuid()),
        "GID": str(os.getgid()),
        "CREDS_KEY": secrets.token_hex(32),
        "CREDS_IV": secrets.token_hex(16),
        "JWT_SECRET": secrets.token_hex(32),
        "JWT_REFRESH_SECRET": secrets.token_hex(32),
        "MEILI_MASTER_KEY": secrets.token_hex(32),
        "NEARAI_API_KEY": "",
    }
    for name, value in settings.items():
        text, count = re.subn(
            rf"^(?:#\s*)?{re.escape(name)}=.*$",
            lambda _: f"{name}={value}",
            text,
            flags=re.MULTILINE,
        )
        if count == 0:
            text += f"\n{name}={value}\n"

    # Exclusive creation prevents overwriting credentials on a second invocation.
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w") as file:
        file.write(text)
    print("Created private .env for http://localhost:3081; no model keys configured.")


if __name__ == "__main__":
    main()
