import ftplib
import os

FTP_HOST = "ftpupload.net"
FTP_USER = "if0_41274369"
FTP_PASS = "moit2030"
FTP_PORT = 21
REMOTE_ROOT = "/htdocs"
LOCAL_PUBLIC = r"C:\Users\Leader4ever\Desktop\Karajaerp\backend\public"

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
        if uploaded % 5 == 0:
            print("[" + str(uploaded) + " uploaded] " + remote_path)
    except Exception as e:
        errors += 1
        print("ERROR: " + remote_path + ": " + str(e))

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
print("Connected!")

local_index = os.path.join(LOCAL_PUBLIC, "index.html")
print("Uploading index.html...")
upload_file(ftp, local_index, REMOTE_ROOT + "/index.html")

local_assets = os.path.join(LOCAL_PUBLIC, "assets")
print("Uploading assets/ folder...")
upload_dir(ftp, local_assets, REMOTE_ROOT + "/assets")

ftp.quit()
print("Done! Uploaded: " + str(uploaded) + ", Errors: " + str(errors))
