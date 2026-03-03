"""Upload and run the inventory import script on InfinityFree server."""
import ftplib
import os
import urllib.request
import urllib.error
import urllib.parse
import http.cookiejar
import json
import re

from Crypto.Cipher import AES

FTP_HOST = "ftpupload.net"
FTP_USER = "if0_41274369"
FTP_PASS = "moit2030"
FTP_PORT = 21
REMOTE_ROOT = "/htdocs"
LOCAL_FILE = r"C:\Users\Leader4ever\Desktop\Karajaerp\backend\public\import-inventory.php"
BASE_URL = "https://karajaerp.wuaze.com"
SCRIPT_URL = BASE_URL + "/import-inventory.php?token=karaja-import-2030"

def solve_cookie(html):
    """Extract a/b/c from InfinityFree challenge and solve via AES-CBC."""
    a_match = re.search(r'var a=toNumbers\("([0-9a-f]+)"\)', html)
    b_match = re.search(r',b=toNumbers\("([0-9a-f]+)"\)', html)
    c_match = re.search(r',c=toNumbers\("([0-9a-f]+)"\)', html)
    if not (a_match and b_match and c_match):
        print("Could not extract a/b/c from challenge HTML")
        return None
    key = bytes.fromhex(a_match.group(1))
    iv  = bytes.fromhex(b_match.group(1))
    ct  = bytes.fromhex(c_match.group(1))
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted = cipher.decrypt(ct)
    # Convert bytes to hex string (that's what toHex() does)
    cookie_val = decrypted.hex()
    print("Solved cookie: " + cookie_val)
    return cookie_val

def make_request(url, cookie_val=None):
    """Make HTTP request with optional __test cookie."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html,application/json,*/*',
    }
    if cookie_val:
        headers['Cookie'] = '__test=' + cookie_val
    req = urllib.request.Request(url, headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        return resp.read().decode('utf-8', errors='ignore'), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        return body, e.code
    except Exception as e:
        return str(e), 0

# Step 1: Upload the import script via FTP
print("Step 1: Uploading import-inventory.php via FTP...")
ftp = ftplib.FTP()
ftp.connect(FTP_HOST, FTP_PORT, timeout=60)
ftp.login(FTP_USER, FTP_PASS)
ftp.set_pasv(True)
remote_path = REMOTE_ROOT + "/import-inventory.php"
with open(LOCAL_FILE, "rb") as f:
    ftp.storbinary("STOR " + remote_path, f)
print("Uploaded OK")
ftp.quit()

# Step 2: Get the challenge page
print("\nStep 2: Getting challenge...")
body, status = make_request(SCRIPT_URL)
print("Status: " + str(status))

cookie_val = None
if 'slowAES' in body:
    cookie_val = solve_cookie(body)

# Step 3: Run the actual script with cookie
print("\nStep 3: Running import with cookie...")
run_url = SCRIPT_URL + "&i=1"
body2, status2 = make_request(run_url, cookie_val)
print("Status: " + str(status2))

# If still getting challenge, try once more
if 'slowAES' in body2:
    print("Still getting challenge, retrying...")
    cookie_val = solve_cookie(body2)
    body2, status2 = make_request(run_url, cookie_val)
    print("Status: " + str(status2))

print("\nResponse:")
print(body2[:4000])

# Parse result
try:
    data = json.loads(body2)
    if data.get('success'):
        print("\n=== SUCCESS ===")
        print("Branch ID:        " + str(data.get('branch_id')))
        print("Products created: " + str(data.get('products_created')))
        print("Products existed: " + str(data.get('products_existing')))
        print("Stock records:    " + str(data.get('stock_records')))
        print("Total quantity:   " + str(data.get('total_qty')))
        for line in data.get('log', []):
            print("  " + line)
    else:
        print("\n=== FAILED ===")
        print("Error: " + str(data.get('error')))
except Exception as e:
    print("(Could not parse JSON: " + str(e) + ")")

# Step 4: Delete script from server
print("\nStep 4: Deleting script from server...")
ftp2 = ftplib.FTP()
ftp2.connect(FTP_HOST, FTP_PORT, timeout=30)
ftp2.login(FTP_USER, FTP_PASS)
ftp2.set_pasv(True)
try:
    ftp2.delete(remote_path)
    print("Deleted OK")
except Exception as e:
    print("Delete failed: " + str(e))
ftp2.quit()

print("\nAll done!")
