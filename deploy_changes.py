"""Upload only the changed files to FTP."""
import ftplib
import os

FTP_HOST = "ftpupload.net"
FTP_USER = "if0_41274369"
FTP_PASS = "moit2030"
FTP_PORT = 21
REMOTE_ROOT = "/htdocs"
BACKEND_ROOT = r"C:\Users\Leader4ever\Desktop\Karajaerp\backend"
LOCAL_PUBLIC = os.path.join(BACKEND_ROOT, "public")

uploaded = 0
errors = 0

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
            ftp.storbinary("STOR " + remote_path, f)
        uploaded += 1
        print("  [OK] " + remote_path)
    except Exception as e:
        errors += 1
        print("  ERROR: " + remote_path + ": " + str(e))

def upload_dir(ftp, local_dir, remote_dir):
    ensure_remote_dir(ftp, remote_dir)
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = remote_dir + "/" + item
        if os.path.isdir(local_path):
            upload_dir(ftp, local_path, remote_path)
        else:
            upload_file(ftp, local_path, remote_path)

print("Connecting to " + FTP_HOST + "...")
ftp = ftplib.FTP()
ftp.connect(FTP_HOST, FTP_PORT, timeout=60)
ftp.login(FTP_USER, FTP_PASS)
ftp.set_pasv(True)
print("Connected!\n")

# 1. Upload new frontend assets (index.html + assets/)
print("--- Uploading frontend ---")
upload_file(ftp, os.path.join(LOCAL_PUBLIC, "index.html"), REMOTE_ROOT + "/index.html")
upload_dir(ftp, os.path.join(LOCAL_PUBLIC, "assets"), REMOTE_ROOT + "/assets")

# 2. Upload changed backend files
print("\n--- Uploading backend changes ---")

changed_files = [
    (os.path.join(BACKEND_ROOT, "routes", "api.php"), REMOTE_ROOT + "/routes/api.php"),
    (os.path.join(BACKEND_ROOT, "app", "Http", "Controllers", "Api", "SystemController.php"),
     REMOTE_ROOT + "/app/Http/Controllers/Api/SystemController.php"),
    (os.path.join(BACKEND_ROOT, "app", "Http", "Controllers", "Api", "ReportController.php"),
     REMOTE_ROOT + "/app/Http/Controllers/Api/ReportController.php"),
    (os.path.join(BACKEND_ROOT, "app", "Http", "Controllers", "Api", "ProductController.php"),
     REMOTE_ROOT + "/app/Http/Controllers/Api/ProductController.php"),
    (os.path.join(BACKEND_ROOT, "app", "Http", "Controllers", "Api", "DashboardController.php"),
     REMOTE_ROOT + "/app/Http/Controllers/Api/DashboardController.php"),
]

for local_path, remote_path in changed_files:
    if os.path.exists(local_path):
        upload_file(ftp, local_path, remote_path)
    else:
        print("  SKIP (not found): " + local_path)

ftp.quit()
print("\nDone! Uploaded: " + str(uploaded) + ", Errors: " + str(errors))
