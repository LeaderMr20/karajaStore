# KarajaERP — Deployment Guide
# Target: karajaerp.wuaze.com

## Overview
- Frontend (React) is built into `backend/public/`
- Laravel API serves at: `karajaerp.wuaze.com/api/v1`
- React SPA serves at: `karajaerp.wuaze.com/`

---

## Step 1 — Create MySQL Database on wuaze.com

1. Log in to: https://cpanel.wuaze.com (or the control panel URL from your welcome email)
2. Go to **MySQL Databases**
3. Create a database named: `karajaerp` → it becomes `if0_41274369_karajaerp`
4. Create a MySQL user with your preferred password
5. Assign the user to the database (All Privileges)
6. Note the MySQL hostname (usually `sql.wuaze.com` or `sqlXXX.wuaze.com` shown in cPanel)
7. Update `.env.production` with the correct MySQL host and password

---

## Step 2 — Build the React Frontend

Run in Windows Command Prompt:

```
cd C:\Users\Leader4ever\Desktop\Karajaerp\frontend
npm run build
```

This outputs the React app into `backend/public/` (alongside Laravel's index.php).

---

## Step 3 — Prepare Backend Files

Copy `.env.production` as the active `.env`:
- Open `backend/.env.production`
- Update `DB_HOST` with the MySQL host from cPanel
- Update `DB_PASSWORD` with your MySQL password
- Save it as `backend/.env` (replace the existing one) before uploading

---

## Step 4 — Upload Files via FTP

FTP Settings:
- Host: `karajaerp.wuaze.com`
- Username: `if0_41274369`
- Password: `moit2030`
- Port: 21

Use FileZilla or WinSCP. Upload to the `public_html/` folder:

### What to upload:

Upload the following folders/files FROM `backend/` TO `public_html/`:
```
app/           → public_html/app/
bootstrap/     → public_html/bootstrap/
config/        → public_html/config/
database/      → public_html/database/
resources/     → public_html/resources/
routes/        → public_html/routes/
storage/       → public_html/storage/
vendor/        → public_html/vendor/
public/        → public_html/public/    (includes React built files)
.env           → public_html/.env       (the production one)
```

Also upload the root `.htaccess`:
- Rename `backend/public_html.htaccess` → `.htaccess`
- Upload to: `public_html/.htaccess`

### Do NOT upload:
- `node_modules/`
- `.env.local` / `.env.production` (only upload the final `.env`)
- `tests/`
- `.git/`

---

## Step 5 — Set File Permissions (via cPanel File Manager)

In cPanel → File Manager:
- `public_html/storage/` → set to 775 (writable)
- `public_html/bootstrap/cache/` → set to 775 (writable)
- `public_html/.env` → set to 640 (readable by PHP only)

---

## Step 6 — Run Migrations (via cPanel PHP CLI or Laravel Artisan)

Most free hosts don't allow SSH. Use one of these methods:

### Option A — cPanel Terminal (if available):
```bash
cd /home/if0_41274369/public_html
php artisan migrate --seed --force
```

### Option B — Create a temporary migration script:
Create a file `public_html/run-migrate.php`:
```php
<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->call('migrate', ['--seed' => true, '--force' => true]);
echo "Migration done!";
```
Visit: `https://karajaerp.wuaze.com/run-migrate.php`
**Delete this file immediately after!**

---

## Step 7 — Test

1. Open: `https://karajaerp.wuaze.com`
2. You should see the KarajaERP login page
3. Login with: `admin@karaja.com` / `123456`
4. Test creating a sale and viewing the invoice

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 500 Error | Check `.env` values, run `php artisan config:clear` |
| Blank page | Check browser console for JS errors |
| API 404 | Verify `.htaccess` files were uploaded correctly |
| DB connection error | Verify MySQL host, database name, username, password in `.env` |
| Storage error | Set `storage/` and `bootstrap/cache/` to permission 775 |
