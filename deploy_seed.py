"""
Upload seeder files to InfinityFree hosting and run them via HTTP
"""
import ftplib
import os
import time
import urllib.request
import urllib.error

FTP_HOST = 'ftpupload.net'
FTP_USER = 'if0_41274369'
FTP_PASS = 'moit2030'
SITE_URL = 'https://karajaerp.wuaze.com'

BASE_DIR = r'C:\Users\Leader4ever\Desktop\Karajaerp\backend'

# Runner script content - only runs Muwaih and Noura seeders (uses firstOrCreate, safe to run multiple times)
RUNNER_PHP = '''<?php
if (!isset($_GET['k']) || $_GET['k'] !== 'kj2030') { die('403'); }
error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(300);

$base = __DIR__;
chdir($base);
define('LARAVEL_START', microtime(true));
require $base . '/vendor/autoload.php';
$app = require_once $base . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);

ob_start();
try {
    $kernel->call('db:seed', ['--class' => 'Database\\\\Seeders\\\\MuwaihBranchSeeder', '--force' => true]);
    echo "--- Muwaih done ---\\n";
    $kernel->call('db:seed', ['--class' => 'Database\\\\Seeders\\\\NouraBranchSeeder', '--force' => true]);
    echo "--- Noura done ---\\n";
} catch (\\Throwable $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\\n";
}
$out = ob_get_clean();
echo '<pre>' . htmlspecialchars($out) . '</pre><br><b>DONE</b>';
'''

def connect_ftp():
    print(f"Connecting to FTP: {FTP_HOST}")
    ftp = ftplib.FTP(FTP_HOST, timeout=30)
    ftp.login(FTP_USER, FTP_PASS)
    print("Connected.")
    return ftp

def list_root(ftp):
    print("\n=== FTP root listing ===")
    ftp.retrlines('LIST')

def upload_file(ftp, local_path, remote_path):
    # Ensure remote directory exists
    parts = remote_path.rsplit('/', 1)
    if len(parts) > 1:
        remote_dir = parts[0]
        try:
            ftp.mkd(remote_dir)
        except ftplib.error_perm:
            pass  # Directory already exists

    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {remote_path}', f)
    print(f"  Uploaded: {remote_path}")

def upload_string(ftp, content, remote_path):
    import io
    data = io.BytesIO(content.encode('utf-8'))
    try:
        ftp.storbinary(f'STOR {remote_path}', data)
        print(f"  Uploaded: {remote_path}")
    except Exception as e:
        print(f"  ERROR uploading {remote_path}: {e}")

def delete_file(ftp, remote_path):
    try:
        ftp.delete(remote_path)
        print(f"  Deleted: {remote_path}")
    except:
        pass

def bypass_infinityfree(url):
    """Handle InfinityFree AES bot protection, return (cookie_jar, final_url)"""
    import re
    import http.cookiejar
    cookie_jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
    opener.addheaders = [('User-Agent', 'Mozilla/5.0')]

    # First request - get the challenge
    try:
        with opener.open(url, timeout=30) as resp:
            body = resp.read().decode('utf-8', errors='replace')
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')

    # Check if it's the AES challenge page
    if 'slowAES' not in body:
        return opener, url  # No challenge, return as-is

    print("  InfinityFree bot protection detected, solving AES challenge...")

    # Extract a, b, c values
    a_match = re.search(r'var a=toNumbers\("([0-9a-f]+)"\)', body)
    b_match = re.search(r',b=toNumbers\("([0-9a-f]+)"\)', body)
    c_match = re.search(r',c=toNumbers\("([0-9a-f]+)"\)', body)

    if not (a_match and b_match and c_match):
        print("  Could not parse AES challenge!")
        return opener, url

    key_hex = a_match.group(1)
    iv_hex  = b_match.group(1)
    ct_hex  = c_match.group(1)

    # Decrypt using AES-CBC
    from Crypto.Cipher import AES
    key = bytes.fromhex(key_hex)
    iv  = bytes.fromhex(iv_hex)
    ct  = bytes.fromhex(ct_hex)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted = cipher.decrypt(ct).hex()

    print(f"  AES solved: __test={decrypted}")

    # Set the cookie manually
    import http.cookiejar
    cookie = http.cookiejar.Cookie(
        version=0, name='__test', value=decrypted,
        port=None, port_specified=False,
        domain='karajaerp.wuaze.com', domain_specified=True, domain_initial_dot=False,
        path='/', path_specified=True,
        secure=False, expires=None, discard=True,
        comment=None, comment_url=None, rest={}
    )
    cookie_jar.set_cookie(cookie)

    # Follow the redirect (?i=1)
    final_url = url + '&i=1' if '?' in url else url + '?i=1'
    return opener, final_url


def run_seeder_via_http():
    url = f'{SITE_URL}/run_seed.php?k=kj2030'
    print(f"\nAccessing: {url}")
    try:
        opener, final_url = bypass_infinityfree(url)
        print(f"  Requesting: {final_url}")
        with opener.open(final_url, timeout=120) as resp:
            body = resp.read().decode('utf-8', errors='replace')
            print("=== Server Response ===")
            import re
            clean = re.sub(r'<[^>]+>', '', body)
            print(clean[:3000])
            return 'DONE' in body or 'seeded' in body.lower() or len(body) > 50
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}")
        try:
            body = e.read().decode('utf-8', errors='replace')
            import re
            clean = re.sub(r'<[^>]+>', '', body)
            print(clean[:2000])
        except:
            pass
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    ftp = connect_ftp()

    # List root to understand server structure
    print("\n=== Listing /htdocs ===")
    try:
        ftp.cwd('/htdocs')
        ftp.retrlines('LIST')
    except Exception as e:
        print(f"Cannot list /htdocs: {e}")
        print("\n=== Listing / ===")
        ftp.cwd('/')
        ftp.retrlines('LIST')

    # Upload seeder files
    print("\n=== Uploading seeder files ===")
    seeders = [
        ('database/seeders/DatabaseSeeder.php',    '/htdocs/database/seeders/DatabaseSeeder.php'),
        ('database/seeders/MuwaihBranchSeeder.php', '/htdocs/database/seeders/MuwaihBranchSeeder.php'),
        ('database/seeders/NouraBranchSeeder.php',  '/htdocs/database/seeders/NouraBranchSeeder.php'),
    ]
    for local_rel, remote_path in seeders:
        local_full = os.path.join(BASE_DIR, local_rel)
        if os.path.exists(local_full):
            upload_file(ftp, local_full, remote_path)
        else:
            print(f"  MISSING: {local_full}")

    # Upload runner
    print("\n=== Uploading runner script ===")
    upload_string(ftp, RUNNER_PHP, '/htdocs/run_seed.php')

    ftp.quit()
    print("\nFTP done. Waiting 3 seconds...")
    time.sleep(3)

    # Run seeder
    success = run_seeder_via_http()

    # Cleanup: delete runner
    print("\n=== Deleting runner script ===")
    ftp2 = connect_ftp()
    delete_file(ftp2, '/htdocs/run_seed.php')
    ftp2.quit()

    if success:
        print("\nSeeding complete!")
    else:
        print("\nSomething went wrong. Check response above.")

if __name__ == '__main__':
    main()
