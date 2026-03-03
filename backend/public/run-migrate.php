<?php
// KarajaERP — Temporary migration runner
// DELETE THIS FILE IMMEDIATELY after use!
// Access: https://karajaerp.wuaze.com/run-migrate.php

$token = $_GET['token'] ?? '';
if ($token !== 'karaja2030migrate') {
    http_response_code(403);
    die('Forbidden');
}

set_time_limit(120);
ob_start();

$basePath = dirname(__DIR__);

require $basePath . '/vendor/autoload.php';
$app = require_once $basePath . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

echo "<pre>\n";
echo "Running: php artisan migrate --seed --force\n\n";

$status = $kernel->call('migrate', ['--seed' => true, '--force' => true]);

echo $kernel->output();
echo "\nExit code: $status\n";

if ($status === 0) {
    echo "\n✓ Migration and seeding completed successfully!\n";
    echo "\nAdmin login: admin@karaja.com / 123456\n";
} else {
    echo "\n✗ Migration failed. Check the output above.\n";
}

echo "</pre>";
echo ob_get_clean();
