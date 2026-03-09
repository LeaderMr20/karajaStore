import ftplib, os

ftp = ftplib.FTP()
ftp.connect('ftpupload.net', 21, timeout=30)
ftp.login('if0_41274369', 'moit2030')
ftp.set_pasv(True)

base_local = r'c:\Users\Leader4ever\Desktop\Karajaerp\backend\public'
base_remote = '/htdocs'

def upload_file(local_path, remote_path):
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {remote_path}', f)
    print(f'Uploaded: {remote_path}')

# Upload index.html
upload_file(os.path.join(base_local, 'index.html'), f'{base_remote}/index.html')

# Upload assets folder
assets_local = os.path.join(base_local, 'assets')
try:
    ftp.mkd(f'{base_remote}/assets')
except:
    pass

for fname in os.listdir(assets_local):
    upload_file(os.path.join(assets_local, fname), f'{base_remote}/assets/{fname}')

ftp.quit()
print('Done!')
