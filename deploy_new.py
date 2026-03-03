#!/usr/bin/env python3
"""
KarajaStore FTP Deployment Script
Uploads to karajastore.wuaze.com
"""

import ftplib
import os
import sys
import shutil

# ─── FTP CREDENTIALS ─────────────────────────────────────────────────────────
FTP_HOST = "ftpupload.net"
FTP_USER = "if0_41289917"
FTP_PASS = "karaja2030"
FTP_PORT = 21
REMOTE_ROOT = "/htdocs"

# ─── LOCAL PATHS ─────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.join(BASE_DIR, "backend")
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")

# ─── SKIP PATTERNS ───────────────────────────────────────────────────────────
SKIP_PATTERNS = [
    "database.sqlite", ".git", "node_modules", "tests",
    ".env.local", ".env.example", "__pycache__", ".DS_Store",
    "Thumbs.db", ".idea", ".vscode",
]

# ─── COUNTERS ────────────────────────────────────────────────────────────────
uploaded = 0
skipped = 0
errors = 0


def should_skip(name):
    for pattern in SKIP_PATTERNS:
        if pattern in name:
            return True
    return False


def ensure_remote_dir(ftp, remote_path):
    parts = remote_path.strip("/").split("/")
    current = ""
    for part in parts:
        current += "/" + part
        try:
            ftp.mkd(current)
        except ftplib.error_perm:
            pass


def upload_file(ftp, local_path, remote_path):
    global uploaded, errors
    remote_dir = "/".join(remote_path.split("/")[:-1])
    if remote_dir:
        ensure_remote_dir(ftp, remote_dir)
    try:
        with open(local_path, "rb") as f:
            ftp.storbinary(f"STOR {remote_path}", f)
        uploaded += 1
        if uploaded % 30 == 0:
            print(f"  [{uploaded} uploaded] {remote_path}")
    except Exception as e:
        errors += 1
        print(f"  ERROR: {remote_path}: {e}")


def upload_dir(ftp, local_dir, remote_dir):
    global skipped
    ensure_remote_dir(ftp, remote_dir)
    for item in os.listdir(local_dir):
        if should_skip(item):
            skipped += 1
            continue
        local_path = os.path.join(local_dir, item)
        remote_path = f"{remote_dir}/{item}"
        if os.path.isdir(local_path):
            upload_dir(ftp, local_path, remote_path)
        else:
            upload_file(ftp, local_path, remote_path)


def delete_remote_dir(ftp, remote_dir):
    """Delete all files inside a remote directory."""
    try:
        items = ftp.nlst(remote_dir)
        for item in items:
            try:
                ftp.delete(item)
            except ftplib.error_perm:
                delete_remote_dir(ftp, item)
                try:
                    ftp.rmd(item)
                except:
                    pass
    except:
        pass


def main():
    print("=" * 55)
    print("  KarajaStore FTP Deployment")
    print(f"  Host: {FTP_HOST}")
    print(f"  User: {FTP_USER}")
    print(f"  Target: {REMOTE_ROOT}")
    print("=" * 55)

    # ── Connect ───────────────────────────────────────────────
    print(f"\nConnecting to {FTP_HOST}...")
    try:
        ftp = ftplib.FTP()
        ftp.connect(FTP_HOST, FTP_PORT, timeout=60)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.set_pasv(True)
        print(f"Connected successfully!\n")
    except Exception as e:
        print(f"FTP connection failed: {e}")
        sys.exit(1)

    # ── Step 1: Upload root config files ─────────────────────
    print("--- [1/3] Uploading root config files ---")
    root_files = [
        ("htdocs_index.php",    f"{REMOTE_ROOT}/index.php"),
        ("artisan",             f"{REMOTE_ROOT}/artisan"),
        ("composer.json",       f"{REMOTE_ROOT}/composer.json"),
        ("composer.lock",       f"{REMOTE_ROOT}/composer.lock"),
        ("public_html.htaccess",f"{REMOTE_ROOT}/.htaccess"),
    ]
    for local_name, remote_path in root_files:
        local_path = os.path.join(BACKEND_ROOT, local_name)
        if os.path.exists(local_path):
            print(f"  {local_name} -> {remote_path}")
            upload_file(ftp, local_path, remote_path)
        else:
            print(f"  SKIP (not found): {local_name}")

    # ── Step 2: Upload backend directories ────────────────────
    print("\n--- [2/3] Uploading backend directories ---")
    backend_dirs = ["app", "bootstrap", "config", "database",
                    "resources", "routes", "storage"]
    for dir_name in backend_dirs:
        local_dir = os.path.join(BACKEND_ROOT, dir_name)
        remote_dir = f"{REMOTE_ROOT}/{dir_name}"
        if os.path.isdir(local_dir):
            print(f"  Uploading {dir_name}/...")
            upload_dir(ftp, local_dir, remote_dir)
        else:
            print(f"  SKIP: {dir_name}/")

    # ── Step 3: Upload frontend dist to /public ───────────────
    print("\n--- [3/3] Uploading frontend dist ---")
    if os.path.isdir(FRONTEND_DIST):
        upload_dir(ftp, FRONTEND_DIST, f"{REMOTE_ROOT}/public")
        print(f"  Frontend uploaded to {REMOTE_ROOT}/public/")
    else:
        print("  SKIP: frontend/dist not found (run: npm run build)")

    ftp.quit()
    print(f"\n{'=' * 55}")
    print(f"  Deployment Complete!")
    print(f"  Uploaded : {uploaded} files")
    print(f"  Skipped  : {skipped} items")
    print(f"  Errors   : {errors} files")
    print(f"  Site     : https://karajastore.wuaze.com")
    print(f"{'=' * 55}")


if __name__ == "__main__":
    main()
