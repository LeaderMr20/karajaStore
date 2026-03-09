#!/usr/bin/env python3
"""
KarajaERP FTP Deployment Script
Uploads backend files to karajaerp.wuaze.com/public_html/
"""

import ftplib
import os
import sys

FTP_HOST = "ftpupload.net"
FTP_USER = "if0_41274369"
FTP_PASS = "moit2030"
FTP_PORT = 21
REMOTE_ROOT = "/htdocs"

BACKEND_ROOT = r"C:\Users\Leader4ever\Desktop\Karajaerp\backend"

# Folders to upload from backend/ → public_html/
UPLOAD_DIRS = [
    "app",
    "bootstrap",
    "config",
    "database",
    "resources",
    "routes",
    "storage",
    "vendor",
    "public",
]

# Individual files to upload
UPLOAD_FILES = [
    ("artisan", "artisan"),
    ("composer.json", "composer.json"),
    ("composer.lock", "composer.lock"),
    (".env.production", ".env"),              # rename to .env
    ("public_html.htaccess", ".htaccess"),   # rename to .htaccess
]

# Files/dirs to skip during upload
SKIP_PATTERNS = [
    "database.sqlite",
    ".git",
    "node_modules",
    "tests",
    ".env.local",
    ".env.example",
    "__pycache__",
    ".DS_Store",
    "Thumbs.db",
]

uploaded = 0
skipped = 0
errors = 0


def should_skip(name):
    for pattern in SKIP_PATTERNS:
        if pattern in name:
            return True
    return False


def ensure_remote_dir(ftp, remote_path):
    """Create remote directory if it doesn't exist."""
    parts = remote_path.strip("/").split("/")
    current = ""
    for part in parts:
        current += "/" + part
        try:
            ftp.mkd(current)
        except ftplib.error_perm:
            pass  # Directory already exists


def upload_file(ftp, local_path, remote_path):
    """Upload a single file via FTP."""
    global uploaded, errors
    # Ensure parent directory exists
    remote_dir = "/".join(remote_path.split("/")[:-1])
    if remote_dir:
        ensure_remote_dir(ftp, remote_dir)
    try:
        with open(local_path, "rb") as f:
            ftp.storbinary(f"STOR {remote_path}", f)
        uploaded += 1
        filename = os.path.basename(local_path)
        if uploaded % 50 == 0:
            print(f"  [{uploaded} uploaded] ...{remote_path}")
    except Exception as e:
        errors += 1
        print(f"  ERROR uploading {remote_path}: {e}")


def upload_dir(ftp, local_dir, remote_dir):
    """Recursively upload a directory."""
    ensure_remote_dir(ftp, remote_dir)
    for item in os.listdir(local_dir):
        if should_skip(item):
            global skipped
            skipped += 1
            continue
        local_path = os.path.join(local_dir, item)
        remote_path = f"{remote_dir}/{item}"
        if os.path.isdir(local_path):
            upload_dir(ftp, local_path, remote_path)
        else:
            upload_file(ftp, local_path, remote_path)


def main():
    print(f"Connecting to {FTP_HOST}...")
    try:
        ftp = ftplib.FTP()
        ftp.connect(FTP_HOST, FTP_PORT, timeout=30)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.set_pasv(True)
        print(f"Connected. Server: {ftp.getwelcome()[:80]}")
    except Exception as e:
        print(f"FTP connection failed: {e}")
        sys.exit(1)

    print(f"\nStarting upload to {REMOTE_ROOT}/ ...")

    # Upload individual files first
    print("\n--- Uploading root files ---")
    for local_name, remote_name in UPLOAD_FILES:
        local_path = os.path.join(BACKEND_ROOT, local_name)
        remote_path = f"{REMOTE_ROOT}/{remote_name}"
        if os.path.exists(local_path):
            print(f"  {local_name} -> {remote_name}")
            upload_file(ftp, local_path, remote_path)
        else:
            print(f"  SKIP (not found): {local_name}")

    # Upload directories
    for dir_name in UPLOAD_DIRS:
        local_dir = os.path.join(BACKEND_ROOT, dir_name)
        remote_dir = f"{REMOTE_ROOT}/{dir_name}"
        if os.path.isdir(local_dir):
            print(f"\n--- Uploading {dir_name}/ ---")
            upload_dir(ftp, local_dir, remote_dir)
            print(f"    Done: {dir_name}/")
        else:
            print(f"  SKIP (not found): {dir_name}/")

    ftp.quit()
    print(f"\n=== Upload Complete ===")
    print(f"  Uploaded: {uploaded} files")
    print(f"  Skipped:  {skipped} items")
    print(f"  Errors:   {errors} files")


if __name__ == "__main__":
    main()
